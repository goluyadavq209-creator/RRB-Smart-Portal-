// Comprehensive Notification Engine for Railway Recruitment Board Portal
// Handles Browser Push Notifications, In-App Notification Center, Audio Chimes, and Cross-Tab Real-time Broadcasts.

export interface NotificationPreferences {
  enabled: boolean;             // Master switch
  browserPush: boolean;         // System / Browser Push Alerts
  sound: boolean;               // Audio synthesizer chime
  toastAlert: boolean;          // Real-time floating toast banner
  categories: {
    exams: boolean;
    cutoffs: boolean;
    notices: boolean;
    results: boolean;
    pdfUploads: boolean;
  };
  zoneFilter: string;           // 'ALL' or specific zone code e.g. 'ALD'
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'exam' | 'cutoff' | 'notice' | 'result' | 'upload' | 'system';
  targetTab: 'exams' | 'cutoffs' | 'notices' | 'results' | 'admin' | 'home';
  targetId?: string;
  timestamp: string;
  read: boolean;
  zoneCode?: string;
  badgeText?: string;
  linkUrl?: string;
}

const PREFS_STORAGE_KEY = 'rrb_notification_preferences_v1';
const NOTIFS_STORAGE_KEY = 'rrb_user_notifications_v1';
const BROADCAST_CHANNEL_NAME = 'rrb_notification_broadcast_channel';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  browserPush: false,
  sound: true,
  toastAlert: true,
  categories: {
    exams: true,
    cutoffs: true,
    notices: true,
    results: true,
    pdfUploads: true,
  },
  zoneFilter: 'ALL',
};

// Initial baseline notifications if user has fresh state
const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// Load Notification Preferences
export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      // Auto-detect browser permission state
      const hasBrowserPermission = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        browserPush: hasBrowserPermission,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
      categories: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
        ...(parsed.categories || {}),
      },
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

// Save Notification Preferences
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    // Broadcast preferences change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rrb_prefs_changed', { detail: prefs }));
    }
  } catch (err) {
    console.error('Failed to save notification preferences:', err);
  }
}

// Request Browser Push Notification Permission
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    const prefs = getNotificationPreferences();
    if (permission === 'granted') {
      prefs.browserPush = true;
      prefs.enabled = true;
      saveNotificationPreferences(prefs);
      
      // Send a confirmation test push
      try {
        new Notification('🔔 RRB Portal Notifications Enabled', {
          body: 'You will now receive instant desktop & mobile alerts when new Railway recruitment data is published.',
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.log('Notification constructor fallback:', e);
      }
    } else {
      prefs.browserPush = false;
      saveNotificationPreferences(prefs);
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

const READ_NOTIFS_KEY = 'rrb_read_notif_ids_v1';

// In-memory cache for live server notifications
let cachedServerNotifications: AppNotification[] = [];

// Helper: Get set of read notification IDs from client local storage
export function getReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_NOTIFS_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

// Helper: Save read notification IDs to client local storage
export function saveReadNotificationId(id: string): void {
  try {
    const ids = getReadNotificationIds();
    ids.add(id);
    localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(Array.from(ids).slice(-100)));
  } catch {}
}

// Fetch live notifications from Cloud SQL PostgreSQL database
export async function fetchServerLiveNotifications(limit = 40): Promise<AppNotification[]> {
  try {
    const res = await fetch(`/api/database/notifications?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        const readIds = getReadNotificationIds();
        const serverItems: AppNotification[] = data.notifications.map((row: any) => ({
          id: `db-notif-${row.id}`,
          title: row.title,
          message: row.message,
          category: (row.category || 'general') as any,
          timestamp: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
          read: readIds.has(`db-notif-${row.id}`),
          linkUrl: row.linkUrl,
          targetTab: row.targetTab,
          zoneCode: 'ALL',
        }));
        cachedServerNotifications = serverItems;
        return serverItems;
      }
    }
  } catch (err) {
    console.warn('Could not fetch notifications from Cloud SQL:', err);
  }
  return getStoredNotifications();
}

// Get Stored Notifications
export function getStoredNotifications(): AppNotification[] {
  if (cachedServerNotifications.length > 0) {
    const readIds = getReadNotificationIds();
    return cachedServerNotifications.map(n => ({
      ...n,
      read: readIds.has(n.id) || n.read,
    }));
  }
  try {
    const raw = localStorage.getItem(NOTIFS_STORAGE_KEY);
    if (!raw) {
      return INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

// Save Stored Notifications
export function saveStoredNotifications(notifs: AppNotification[]): void {
  try {
    const trimmed = notifs.slice(0, 50);
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save stored notifications:', err);
  }
}

// Mark Single Notification as Read
export function markNotificationAsRead(id: string): AppNotification[] {
  saveReadNotificationId(id);
  cachedServerNotifications = cachedServerNotifications.map(n => n.id === id ? { ...n, read: true } : n);
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
  triggerNotificationUpdate();
  return updated;
}

// Mark All Notifications as Read
export function markAllNotificationsAsRead(): AppNotification[] {
  const current = getStoredNotifications();
  current.forEach(n => saveReadNotificationId(n.id));
  cachedServerNotifications = cachedServerNotifications.map(n => ({ ...n, read: true }));
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStoredNotifications(updated);
  triggerNotificationUpdate();
  return updated;
}

// Clear All Notifications
export function clearAllNotifications(): AppNotification[] {
  const current = getStoredNotifications();
  current.forEach(n => saveReadNotificationId(n.id));
  cachedServerNotifications = [];
  const updated: AppNotification[] = [];
  saveStoredNotifications(updated);
  triggerNotificationUpdate();
  return updated;
}

// Play Gentle Synthesizer Chime using Web Audio API (Zero external file dependencies)
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic 2-tone pleasant Railway-style alert chime (Major Third / Fifth interval)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Frequency sequence: 587.33 Hz (D5) -> 880 Hz (A5)
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.52);
    osc2.stop(now + 0.52);
  } catch (err) {
    // AudioContext may be blocked before first user gesture
    console.debug('Audio chime playback omitted (awaiting user gesture):', err);
  }
}

// Trigger DOM event for component listeners
function triggerNotificationUpdate(newNotif?: AppNotification) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('rrb_notifications_updated', {
        detail: { notification: newNotif, timestamp: Date.now() },
      })
    );
  }
}

// Main Dispatch Function: Dispatches a new notification to all users who enabled notifications!
export function dispatchNewDataNotification(
  data: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): AppNotification | null {
  const prefs = getNotificationPreferences();

  // If notifications are globally disabled by user, skip
  if (!prefs.enabled) {
    return null;
  }

  // Category filter check
  if (data.category === 'exam' && !prefs.categories.exams) return null;
  if (data.category === 'cutoff' && !prefs.categories.cutoffs) return null;
  if (data.category === 'notice' && !prefs.categories.notices) return null;
  if (data.category === 'result' && !prefs.categories.results) return null;
  if (data.category === 'upload' && !prefs.categories.pdfUploads) return null;

  // Zone filter check
  if (
    prefs.zoneFilter !== 'ALL' &&
    data.zoneCode &&
    data.zoneCode !== 'ALL' &&
    data.zoneCode !== prefs.zoneFilter
  ) {
    return null;
  }

  const newNotification: AppNotification = {
    ...data,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };

  // 1. Broadcast to PostgreSQL Cloud SQL so all connected devices receive this update
  try {
    fetch('/api/database/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newNotification.title,
        message: newNotification.message,
        category: newNotification.category || 'general',
        targetTab: newNotification.targetTab,
        linkUrl: newNotification.linkUrl,
      }),
    }).catch((err) => {
      console.warn('Silent notice broadcast to Cloud SQL:', err);
    });
  } catch {}

  // 2. Add to active in-memory list
  cachedServerNotifications = [newNotification, ...cachedServerNotifications];
  const current = getStoredNotifications();
  const updated = [newNotification, ...current];
  saveStoredNotifications(updated);

  // 2. Play audio chime if enabled
  if (prefs.sound) {
    playNotificationSound();
  }

  // 3. Trigger Browser / Desktop push notification if enabled and permitted
  if (prefs.browserPush && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const browserNotif = new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: newNotification.id,
        });
        browserNotif.onclick = () => {
          window.focus();
          triggerNotificationUpdate(newNotification);
        };
      } catch (err) {
        console.debug('Browser push notification could not be shown:', err);
      }
    }
  }

  // 4. Cross-tab Broadcast Channel communication
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({
        type: 'NEW_DATA_NOTIFICATION',
        notification: newNotification,
      });
      channel.close();
    } catch {
      // BroadcastChannel fallback handled by storage event
    }
  }

  // 5. In-App Toast & State Trigger
  triggerNotificationUpdate(newNotification);

  return newNotification;
}

// Helper to broadcast test notification
export function sendTestNotification(): AppNotification | null {
  return dispatchNewDataNotification({
    title: '🔔 Test RRB Alert: Notification System Active',
    message: 'This is a sample live alert. You will receive notifications like this whenever new CEN Exams, Cut-Offs, Notices, or Results are uploaded.',
    category: 'system',
    targetTab: 'home',
    badgeText: 'Test Alert',
  });
}
