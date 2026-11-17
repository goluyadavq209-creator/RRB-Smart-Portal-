# Security Specification & Payload-First TDD (`Library Manager Automation`)

## 1. Data Invariants
1. **Owner Root Isolation**: Every library member, payment, reminder log, and configuration document resides under `/users/{userId}` and carries `ownerId == userId == request.auth.uid`. Cross-tenant reads or writes are impossible.
2. **Verified Identity & PII Guard**: All PII (`email`, `phone`) is strictly restricted to verified account owners (`request.auth != null && request.auth.token.email_verified == true && request.auth.uid == userId`). Blanket public or `isSignedIn()` reads do not exist.
3. **Strict Schema & ID Guarding**: All document IDs match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), `member_id` matches `^LIB-[a-zA-Z0-9_\-]+$`, dates match `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`, and every string and array enforces explicit `.size()` bounds.
4. **Immutable Audit Trails**: `PaymentRecord` and `ReminderLog` entries are append-only audit records (`update` and `delete` denied) and enforce `createdAt == request.time`.
5. **Action-Based Member Updates & Idempotency**: Member updates are partitioned into explicit actions (`updateProfile`, `recordReminder`, `recordPayment`) using `affectedKeys().hasOnly(...)` and `isValidLibraryMember(incoming())`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read on Members**: `GET /users/userA/members/LIB-001` with `auth = null`.
2. **Cross-Tenant List Scraping**: `LIST /users/userA/members` with `auth = userB` (`email_verified: true`).
3. **Unverified Email Spoofing**: `CREATE /users/userA/members/m1` with `auth = userA, email_verified = false`.
4. **Identity Spoofing on Create**: `CREATE /users/userA/members/m1` with `ownerId: "userB"` inside body.
5. **Shadow / Ghost Field Injection**: `CREATE /users/userA/members/m1` including extra field `isAdmin: true`.
6. **Path ID Poisoning (Denial of Wallet)**: `CREATE /users/userA/members/<150-char-id-with-slashes>` or invalid characters.
7. **Orphaned Subcollection Write**: `CREATE /users/nonExistentUser/members/m1` when `/users/nonExistentUser` does not exist.
8. **Client-Forged Timestamp**: `CREATE /users/userA/members/m1` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`.
9. **Immutable Field Mutation**: `UPDATE /users/userA/members/m1` changing `ownerId` or `createdAt`.
10. **Value Poisoning on Update**: `UPDATE /users/userA/members/m1` setting `payment_status: "FreeForever"` (outside enum) or 2KB `name`.
11. **Unbounded Array Attack on Config**: `CREATE /users/userA/config/main` with `completedSteps` containing 50 elements (`> 20`).
12. **Payment Ledger Tampering**: `UPDATE` or `DELETE` on `/users/userA/payments/pay_1` by any user.
