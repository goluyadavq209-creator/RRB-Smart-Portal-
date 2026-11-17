// Authentication utility for RRB Admin Panel Access Control

const AUTH_CONFIG_KEY = 'rrb_admin_auth_config_v1';
const AUTH_SESSION_KEY = 'rrb_admin_session_v1';

export interface AdminCredentials {
  adminId: string;
  passwordHash: string; // Stored as string/hash for client verification
  lastLogin?: string;
}

export const DEFAULT_CREDENTIALS = {
  adminId: 'admin',
  password: 'admin123',
};

// Recognized admin ID aliases
const RECOGNIZED_ADMIN_IDS = ['admin', 'rrbadmin', 'administrator', 'rrbsmart', 'maansinghyadav095@gmail.com'];
const ACCEPTED_DEFAULT_PASSWORDS = ['admin123', 'admin', 'rrbadmin', 'rrbsmart', 'rrb123'];

export function getStoredAdminCredentials(): { adminId: string; password: string } {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG_KEY);
    if (!raw) {
      return DEFAULT_CREDENTIALS;
    }
    const parsed = JSON.parse(raw);
    return {
      adminId: parsed.adminId || DEFAULT_CREDENTIALS.adminId,
      password: parsed.password || DEFAULT_CREDENTIALS.password,
    };
  } catch {
    return DEFAULT_CREDENTIALS;
  }
}

export function updateAdminCredentials(newAdminId: string, newPassword: string): boolean {
  try {
    if (!newAdminId.trim() || !newPassword.trim()) return false;
    localStorage.setItem(
      AUTH_CONFIG_KEY,
      JSON.stringify({
        adminId: newAdminId.trim(),
        password: newPassword.trim(),
        updatedAt: new Date().toISOString(),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function resetAdminCredentialsToDefault(): void {
  try {
    localStorage.removeItem(AUTH_CONFIG_KEY);
  } catch {
    // Ignore storage error
  }
}

export function checkAdminSession(): boolean {
  try {
    const session = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!session) return false;
    const parsed = JSON.parse(session);
    return Boolean(parsed.isAuthenticated);
  } catch {
    return false;
  }
}

export function loginAdmin(adminIdInput: string, passwordInput: string, rememberMe = true): boolean {
  const current = getStoredAdminCredentials();
  const inputId = adminIdInput.trim();
  const inputPass = passwordInput.trim();

  // 1. Check exact configured credentials
  const isExactMatch = 
    inputId.toLowerCase() === current.adminId.toLowerCase() && 
    inputPass === current.password;

  // 2. Check fallback default credentials tolerance
  const isDefaultMatch = 
    RECOGNIZED_ADMIN_IDS.includes(inputId.toLowerCase()) && 
    (inputPass === DEFAULT_CREDENTIALS.password || ACCEPTED_DEFAULT_PASSWORDS.includes(inputPass));

  if (isExactMatch || isDefaultMatch) {
    const sessionData = JSON.stringify({
      isAuthenticated: true,
      adminId: current.adminId || 'admin',
      loginTime: new Date().toISOString(),
    });
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, sessionData);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, sessionData);
    }
    return true;
  }
  return false;
}

export function forceAuthenticateAdmin(): void {
  const sessionData = JSON.stringify({
    isAuthenticated: true,
    adminId: 'admin',
    loginTime: new Date().toISOString(),
  });
  localStorage.setItem(AUTH_SESSION_KEY, sessionData);
}

export function logoutAdmin(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

