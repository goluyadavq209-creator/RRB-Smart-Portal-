// Authentication utility for RRB Admin Panel Access Control

const AUTH_CONFIG_KEY = 'rrb_admin_auth_config_v1';
const AUTH_SESSION_KEY = 'rrb_admin_session_v1';

export interface AdminCredentials {
  adminId: string;
  passwordHash: string; // Stored as simple hash/string for client verification
  lastLogin?: string;
}

const DEFAULT_CREDENTIALS = {
  adminId: 'admin',
  password: 'admin123',
};

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
  if (
    adminIdInput.trim() === current.adminId &&
    passwordInput.trim() === current.password
  ) {
    const sessionData = JSON.stringify({
      isAuthenticated: true,
      adminId: current.adminId,
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

export function logoutAdmin(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}
