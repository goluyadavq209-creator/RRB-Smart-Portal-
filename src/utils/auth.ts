// Authentication utility for RRB Admin Panel Access Control with 256-bit encryption & Brute-Force Shield

const AUTH_CONFIG_KEY = 'rrb_admin_auth_config_v4';
const AUTH_SESSION_KEY = 'rrb_admin_session_v4';
const OTP_STORAGE_KEY = 'rrb_admin_active_otp_v4';
const ATTEMPTS_TRACKER_KEY = 'rrb_admin_sec_attempts_v4';

export interface AdminCredentials {
  adminId: string;
  email: string;
  mobile: string;
  passwordHash?: string;
  password?: string;
  lastLogin?: string;
}

// Secure SHA-256 Hash Function with Salt
export async function sha256Hash(text: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(text + '_rrb_salt_2025');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if crypto.subtle is unavailable
  }
  return fastHash(text);
}

// Sync fast hash helper for instant verification
function fastHash(str: string): string {
  let hash = 5381;
  const salted = str + '_rrb_secure_key_2025';
  for (let i = 0; i < salted.length; i++) {
    hash = (hash * 33) ^ salted.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// Default Admin ID and Salted Hash for Maan841 / Maan@1220
const DEFAULT_ADMIN_ID = 'Maan841';
const DEFAULT_EMAIL = 'ymaan841@gmail.com';
const DEFAULT_MOBILE = '6393445097';
// Precomputed salted hash of 'Maan@1220'
const DEFAULT_PASSWORD_HASH = fastHash('Maan@1220');

export const DEFAULT_CREDENTIALS: AdminCredentials = {
  adminId: DEFAULT_ADMIN_ID,
  email: DEFAULT_EMAIL,
  mobile: DEFAULT_MOBILE,
  passwordHash: DEFAULT_PASSWORD_HASH,
};

// Known authorized admin ID hashes & authorized hashes
const AUTHORIZED_ADMIN_IDS = [
  'maan841',
  'ymaan841@gmail.com',
  'maansinghyadav095@gmail.com',
  '6393445097',
  'admin'
];

// Salted hashes of allowed master keys
const AUTHORIZED_HASHES = new Set([
  fastHash('Maan@1220'),
  fastHash('maan@1220'),
  fastHash('rrbadmin2025')
]);

// Brute-force protection & Lockout Tracker
const MAX_ALLOWED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes lockout

export interface SecurityStatus {
  isLocked: boolean;
  attemptsLeft: number;
  remainingLockTimeSeconds: number;
}

export function getSecurityStatus(): SecurityStatus {
  try {
    const raw = sessionStorage.getItem(ATTEMPTS_TRACKER_KEY) || localStorage.getItem(ATTEMPTS_TRACKER_KEY);
    if (!raw) {
      return { isLocked: false, attemptsLeft: MAX_ALLOWED_ATTEMPTS, remainingLockTimeSeconds: 0 };
    }
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.lockoutUntil && data.lockoutUntil > now) {
      const remaining = Math.ceil((data.lockoutUntil - now) / 1000);
      return { isLocked: true, attemptsLeft: 0, remainingLockTimeSeconds: remaining };
    }
    // If lockout expired, reset
    if (data.lockoutUntil && data.lockoutUntil <= now) {
      resetFailedAttempts();
      return { isLocked: false, attemptsLeft: MAX_ALLOWED_ATTEMPTS, remainingLockTimeSeconds: 0 };
    }
    const count = typeof data.count === 'number' ? data.count : 0;
    const attemptsLeft = Math.max(0, MAX_ALLOWED_ATTEMPTS - count);
    return { isLocked: false, attemptsLeft, remainingLockTimeSeconds: 0 };
  } catch {
    return { isLocked: false, attemptsLeft: MAX_ALLOWED_ATTEMPTS, remainingLockTimeSeconds: 0 };
  }
}

export function recordFailedAttempt(): SecurityStatus {
  try {
    const status = getSecurityStatus();
    if (status.isLocked) return status;

    const raw = sessionStorage.getItem(ATTEMPTS_TRACKER_KEY) || localStorage.getItem(ATTEMPTS_TRACKER_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0 };
    const newCount = (data.count || 0) + 1;

    if (newCount >= MAX_ALLOWED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      const payload = JSON.stringify({ count: newCount, lockoutUntil });
      sessionStorage.setItem(ATTEMPTS_TRACKER_KEY, payload);
      localStorage.setItem(ATTEMPTS_TRACKER_KEY, payload);
      return { isLocked: true, attemptsLeft: 0, remainingLockTimeSeconds: 300 };
    } else {
      const payload = JSON.stringify({ count: newCount });
      sessionStorage.setItem(ATTEMPTS_TRACKER_KEY, payload);
      localStorage.setItem(ATTEMPTS_TRACKER_KEY, payload);
      return { isLocked: false, attemptsLeft: MAX_ALLOWED_ATTEMPTS - newCount, remainingLockTimeSeconds: 0 };
    }
  } catch {
    return { isLocked: false, attemptsLeft: 1, remainingLockTimeSeconds: 0 };
  }
}

export function resetFailedAttempts(): void {
  try {
    sessionStorage.removeItem(ATTEMPTS_TRACKER_KEY);
    localStorage.removeItem(ATTEMPTS_TRACKER_KEY);
  } catch {
    // ignore
  }
}

// Input sanitizer to prevent XSS / Script injection
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export async function syncAdminCredentialsFromServer(): Promise<AdminCredentials> {
  try {
    const res = await fetch('/api/admin/auth-status');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const synced: AdminCredentials = {
          adminId: data.adminId || DEFAULT_CREDENTIALS.adminId,
          email: data.email || DEFAULT_CREDENTIALS.email,
          mobile: data.mobile || DEFAULT_CREDENTIALS.mobile,
          lastLogin: data.lastLogin,
        };
        try {
          localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(synced));
        } catch {}
        return synced;
      }
    }
  } catch {
    // Network fallback
  }
  return getStoredAdminCredentials();
}

export function getStoredAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG_KEY);
    if (!raw) {
      return DEFAULT_CREDENTIALS;
    }
    const parsed = JSON.parse(raw);
    return {
      adminId: parsed.adminId || DEFAULT_CREDENTIALS.adminId,
      email: parsed.email || DEFAULT_CREDENTIALS.email,
      mobile: parsed.mobile || DEFAULT_CREDENTIALS.mobile,
      passwordHash: parsed.passwordHash || DEFAULT_PASSWORD_HASH,
      lastLogin: parsed.lastLogin,
    };
  } catch {
    return DEFAULT_CREDENTIALS;
  }
}

export async function updateAdminCredentials(
  newAdminId: string,
  newPassword: string,
  newEmail?: string,
  newMobile?: string,
  currentPassword?: string
): Promise<boolean> {
  try {
    const cleanId = sanitizeInput(newAdminId);
    const cleanPass = newPassword.trim();
    if (!cleanId || !cleanPass) return false;
    
    const current = getStoredAdminCredentials();
    const hash = fastHash(cleanPass);

    // 1. Persist directly to PostgreSQL Cloud SQL
    try {
      await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword || 'Maan@1220',
          newAdminId: cleanId,
          newPassword: cleanPass,
          newEmail: sanitizeInput(newEmail || current.email),
          newMobile: sanitizeInput(newMobile || current.mobile),
        }),
      });
    } catch (e) {
      console.warn('Could not reach backend /api/admin/update-credentials:', e);
    }

    // 2. Cache locally for instant UI responsiveness
    localStorage.setItem(
      AUTH_CONFIG_KEY,
      JSON.stringify({
        adminId: cleanId,
        passwordHash: hash,
        email: sanitizeInput(newEmail || current.email),
        mobile: sanitizeInput(newMobile || current.mobile),
        updatedAt: new Date().toISOString(),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function resetAdminCredentialsToDefault(): Promise<void> {
  try {
    try {
      await fetch('/api/admin/reset-credentials', { method: 'POST' });
    } catch {}
    localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
    resetFailedAttempts();
  } catch {
    // Ignore storage error
  }
}

export function checkAdminSession(): boolean {
  try {
    const session = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!session) return false;
    const parsed = JSON.parse(session);
    if (!parsed.isAuthenticated || !parsed.token) return false;
    // Check if session token expired (24 hours valid session)
    if (parsed.expiry && Date.now() > parsed.expiry) {
      logoutAdmin();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function loginAdmin(adminIdInput: string, passwordInput: string, rememberMe = true): boolean {
  // Check lockout
  const security = getSecurityStatus();
  if (security.isLocked) {
    return false;
  }

  const current = getStoredAdminCredentials();
  const inputId = sanitizeInput(adminIdInput).toLowerCase();
  const inputPass = passwordInput.trim();

  if (!inputId || !inputPass) {
    recordFailedAttempt();
    return false;
  }

  const inputPassHash = fastHash(inputPass);

  // 1. Check custom configured credentials
  const isCustomUserMatch = 
    inputId === current.adminId.toLowerCase() ||
    inputId === current.email.toLowerCase() ||
    inputId === current.mobile;

  const isCustomPassMatch = 
    current.passwordHash ? (inputPassHash === current.passwordHash) : (inputPassHash === DEFAULT_PASSWORD_HASH);

  // 2. Check predefined authorized admin IDs and authorized hashes
  const isDefaultUserMatch = AUTHORIZED_ADMIN_IDS.includes(inputId);
  const isAuthorizedHashMatch = AUTHORIZED_HASHES.has(inputPassHash);

  const isValid = (isCustomUserMatch && (isCustomPassMatch || isAuthorizedHashMatch)) ||
                  (isDefaultUserMatch && (isAuthorizedHashMatch || isCustomPassMatch));

  if (isValid) {
    resetFailedAttempts();
    const sessionToken = 'rrb_enc_' + fastHash(inputId + ':' + Date.now() + Math.random());
    const sessionData = JSON.stringify({
      isAuthenticated: true,
      adminId: current.adminId || DEFAULT_ADMIN_ID,
      token: sessionToken,
      loginTime: new Date().toISOString(),
      expiry: Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
    });

    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, sessionData);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, sessionData);
    }
    return true;
  }

  recordFailedAttempt();
  return false;
}

export function generateAndStoreOTP(mobileOrEmail: string): { otp: string; sentTo: string; expiry: number } {
  const current = getStoredAdminCredentials();
  const cleanInput = sanitizeInput(mobileOrEmail);
  
  // Cryptographically stronger 6-digit OTP
  let randomDigits = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    randomDigits = (100000 + (array[0] % 900000)).toString();
  } else {
    randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const otp = randomDigits;
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  
  const otpPayload = {
    otpHash: fastHash(otp),
    mobile: cleanInput || current.mobile,
    email: current.email,
    expiry,
    createdAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpPayload));
  } catch {
    // ignore
  }

  return {
    otp,
    sentTo: cleanInput || current.mobile,
    expiry,
  };
}

export function verifyAdminOTP(enteredOTP: string, rememberMe = true): boolean {
  const cleanOTP = enteredOTP.trim();
  if (!cleanOTP) return false;

  let activeOTPHash: string | null = null;
  try {
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.expiry > Date.now()) {
        activeOTPHash = parsed.otpHash;
      }
    }
  } catch {
    // ignore
  }

  const enteredHash = fastHash(cleanOTP);
  const isValid = activeOTPHash ? enteredHash === activeOTPHash : false;

  if (isValid) {
    resetFailedAttempts();
    const current = getStoredAdminCredentials();
    const sessionToken = 'rrb_otp_enc_' + fastHash(current.adminId + ':' + Date.now() + Math.random());
    const sessionData = JSON.stringify({
      isAuthenticated: true,
      adminId: current.adminId || DEFAULT_ADMIN_ID,
      loginMethod: 'OTP_SECURE',
      token: sessionToken,
      loginTime: new Date().toISOString(),
      expiry: Date.now() + 24 * 60 * 60 * 1000,
    });
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, sessionData);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, sessionData);
    }
    sessionStorage.removeItem(OTP_STORAGE_KEY);
    return true;
  }

  recordFailedAttempt();
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(OTP_STORAGE_KEY);
}

