import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  User,
} from '../lib/firebase';
import {
  LibraryConfig,
  LibraryMember,
  PaymentRecord,
  ReminderLog,
} from '../types/library';
import { buildSampleMembers, buildSamplePayments } from '../data/libraryGuideData';
import { normalizePhone } from '../utils/libraryLogic';

// Ensure /users/{uid} root document and default config exist
export async function ensureOwnerWorkspace(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // 1. Create /users/{uid} root first so subcollection exists(/users/$(userId)) checks pass
      await setDoc(userRef, {
        uid: user.uid,
        email: (user.email || '').slice(0, 200),
        displayName: (user.displayName || 'Library Owner').slice(0, 120),
        libraryName: 'My Study Library',
        totalSeats: 80,
        createdAt: serverTimestamp(),
      });

      // 2. Create config and sample members
      const batch1 = writeBatch(db);
      const configRef = doc(db, 'users', user.uid, 'config', 'main');
      batch1.set(configRef, {
        ownerId: user.uid,
        libraryName: 'My Study Library',
        ownerEmail: (user.email || '').slice(0, 200),
        ownerPhone: '',
        totalSeats: 80,
        completedSteps: [],
        updatedAt: serverTimestamp(),
      });

      const samples = buildSampleMembers(user.uid);
      for (const m of samples) {
        const mRef = doc(db, 'users', user.uid, 'members', m.docId);
        const { docId: _ignored, ...rest } = m;
        batch1.set(mRef, {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch1.commit();

      // 3. Create sample payments after members exist in Firestore
      const batch2 = writeBatch(db);
      const samplePayments = buildSamplePayments(user.uid);
      for (const p of samplePayments) {
        const pRef = doc(db, 'users', user.uid, 'payments', p.payment_id);
        batch2.set(pRef, {
          ...p,
          createdAt: serverTimestamp(),
        });
      }
      await batch2.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeOwnerMembers(
  uid: string,
  onData: (members: LibraryMember[]) => void
) {
  const colPath = `users/${uid}/members`;
  const q = query(collection(db, 'users', uid, 'members'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: LibraryMember[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          docId: d.id,
          member_id: data.member_id || d.id,
          ownerId: data.ownerId || uid,
          name: data.name || '',
          phone: data.phone || '',
          plan: data.plan || 'Monthly',
          plan_months: Number(data.plan_months) || 1,
          fee: Number(data.fee) || 0,
          start_date: data.start_date || '',
          expiry_date: data.expiry_date || '',
          payment_status: data.payment_status || 'Pending',
          last_payment_date: data.last_payment_date || '',
          last_reminder_date: data.last_reminder_date || '',
          last_payment_ref: data.last_payment_ref || '',
          seat_no: data.seat_no || 'S-01',
          shift: data.shift || 'Full Day',
          whatsapp_opt_in: Boolean(data.whatsapp_opt_in),
        };
      });
      list.sort((a, b) => a.member_id.localeCompare(b.member_id));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, colPath)
  );
}

export function subscribeOwnerPayments(
  uid: string,
  onData: (payments: PaymentRecord[]) => void
) {
  const colPath = `users/${uid}/payments`;
  const q = query(collection(db, 'users', uid, 'payments'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: PaymentRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          payment_id: data.payment_id || d.id,
          ownerId: data.ownerId || uid,
          member_doc_id: data.member_doc_id || '',
          member_id: data.member_id || '',
          member_name: data.member_name || '',
          amount: Number(data.amount) || 0,
          mode: data.mode || 'Cash',
          link_id: data.link_id || '',
          payment_date: data.payment_date || '',
          previous_expiry: data.previous_expiry || '',
          new_expiry: data.new_expiry || '',
        };
      });
      list.sort((a, b) => b.payment_date.localeCompare(a.payment_date));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, colPath)
  );
}

export function subscribeOwnerReminders(
  uid: string,
  onData: (reminders: ReminderLog[]) => void
) {
  const colPath = `users/${uid}/reminders`;
  const q = query(collection(db, 'users', uid, 'reminders'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ReminderLog[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          reminder_id: data.reminder_id || d.id,
          ownerId: data.ownerId || uid,
          member_id: data.member_id || '',
          member_name: data.member_name || '',
          phone: data.phone || '',
          expiry_date: data.expiry_date || '',
          days_left: Number(data.days_left) || 0,
          message_preview: data.message_preview || '',
          sent_date: data.sent_date || '',
          status: data.status || 'Simulated',
        };
      });
      list.sort((a, b) => b.sent_date.localeCompare(a.sent_date));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, colPath)
  );
}

export function subscribeOwnerConfig(
  uid: string,
  onData: (config: LibraryConfig) => void
) {
  const docPath = `users/${uid}/config/main`;
  return onSnapshot(
    doc(db, 'users', uid, 'config', 'main'),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onData({
          ownerId: d.ownerId || uid,
          libraryName: d.libraryName || 'My Study Library',
          ownerEmail: d.ownerEmail || '',
          ownerPhone: d.ownerPhone || '',
          totalSeats: Number(d.totalSeats) || 80,
          completedSteps: Array.isArray(d.completedSteps) ? d.completedSteps : [],
        });
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, docPath)
  );
}

export async function saveMemberToFirestore(
  uid: string,
  member: LibraryMember,
  isUpdate: boolean
): Promise<void> {
  const docPath = `users/${uid}/members/${member.docId}`;
  const docRef = doc(db, 'users', uid, 'members', member.docId);

  const sanitized = {
    member_id: member.member_id.slice(0, 32),
    ownerId: uid,
    name: member.name.trim().slice(0, 100),
    phone: normalizePhone(member.phone),
    plan: member.plan,
    plan_months: Number(member.plan_months) || 1,
    fee: Math.max(0, Math.min(1000000, Number(member.fee) || 0)),
    start_date: member.start_date.slice(0, 10),
    expiry_date: member.expiry_date.slice(0, 10),
    payment_status: member.payment_status,
    last_payment_date: (member.last_payment_date || '').slice(0, 10),
    last_reminder_date: (member.last_reminder_date || '').slice(0, 10),
    last_payment_ref: (member.last_payment_ref || '').slice(0, 120),
    seat_no: (member.seat_no || 'S-01').trim().slice(0, 20),
    shift: member.shift,
    whatsapp_opt_in: Boolean(member.whatsapp_opt_in),
  };

  try {
    if (isUpdate) {
      await updateDoc(docRef, {
        name: sanitized.name,
        phone: sanitized.phone,
        plan: sanitized.plan,
        plan_months: sanitized.plan_months,
        fee: sanitized.fee,
        start_date: sanitized.start_date,
        expiry_date: sanitized.expiry_date,
        payment_status: sanitized.payment_status,
        seat_no: sanitized.seat_no,
        shift: sanitized.shift,
        whatsapp_opt_in: sanitized.whatsapp_opt_in,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isUpdate ? OperationType.UPDATE : OperationType.CREATE,
      docPath
    );
  }
}

export async function deleteMemberFromFirestore(uid: string, docId: string): Promise<void> {
  const docPath = `users/${uid}/members/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'members', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function recordPaymentBatchInFirestore(
  uid: string,
  member: LibraryMember,
  payment: PaymentRecord,
  newExpiry: string
): Promise<void> {
  const memberPath = `users/${uid}/members/${member.docId}`;
  try {
    const batch = writeBatch(db);
    const memberRef = doc(db, 'users', uid, 'members', member.docId);
    batch.update(memberRef, {
      payment_status: 'Paid',
      last_payment_date: payment.payment_date,
      expiry_date: newExpiry,
      last_payment_ref: payment.link_id.slice(0, 120),
      updatedAt: serverTimestamp(),
    });

    const payRef = doc(db, 'users', uid, 'payments', payment.payment_id);
    batch.set(payRef, {
      payment_id: payment.payment_id,
      ownerId: uid,
      member_doc_id: member.docId,
      member_id: member.member_id.slice(0, 32),
      member_name: member.name.trim().slice(0, 100),
      amount: Math.max(0, Math.min(1000000, Number(payment.amount) || 0)),
      mode: payment.mode,
      link_id: payment.link_id.slice(0, 120),
      payment_date: payment.payment_date.slice(0, 10),
      previous_expiry: (payment.previous_expiry || '').slice(0, 10),
      new_expiry: newExpiry.slice(0, 10),
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, memberPath);
  }
}

export async function recordRemindersBatchInFirestore(
  uid: string,
  items: Array<{ member: LibraryMember; log: ReminderLog }>
): Promise<void> {
  const basePath = `users/${uid}/reminders`;
  try {
    const batch = writeBatch(db);
    for (const { member, log } of items) {
      const mRef = doc(db, 'users', uid, 'members', member.docId);
      batch.update(mRef, {
        last_reminder_date: log.sent_date,
        updatedAt: serverTimestamp(),
      });

      const rRef = doc(db, 'users', uid, 'reminders', log.reminder_id);
      batch.set(rRef, {
        reminder_id: log.reminder_id,
        ownerId: uid,
        member_id: log.member_id.slice(0, 32),
        member_name: log.member_name.trim().slice(0, 100),
        phone: normalizePhone(log.phone),
        expiry_date: log.expiry_date.slice(0, 10),
        days_left: Number(log.days_left) || 0,
        message_preview: log.message_preview.slice(0, 500),
        sent_date: log.sent_date.slice(0, 10),
        status: log.status,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, basePath);
  }
}

export async function saveConfigToFirestore(
  uid: string,
  config: LibraryConfig
): Promise<void> {
  const docPath = `users/${uid}/config/main`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'config', 'main'),
      {
        ownerId: uid,
        libraryName: (config.libraryName || 'My Study Library').trim().slice(0, 120),
        ownerEmail: (config.ownerEmail || '').trim().slice(0, 200),
        ownerPhone: (config.ownerPhone || '').trim().slice(0, 20),
        totalSeats: Math.max(1, Math.min(5000, Number(config.totalSeats) || 80)),
        completedSteps: (config.completedSteps || []).slice(0, 20),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}
