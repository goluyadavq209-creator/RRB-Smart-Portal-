import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Volume2, 
  VolumeX, 
  Globe, 
  GraduationCap, 
  BarChart3, 
  Award, 
  FileText, 
  Upload, 
  Check, 
  AlertCircle, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  Layers
} from 'lucide-react';
import { 
  AppNotification, 
  NotificationPreferences, 
  getStoredNotifications, 
  fetchServerLiveNotifications,
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications, 
  getNotificationPreferences, 
  saveNotificationPreferences, 
  requestBrowserNotificationPermission,
  sendTestNotification,
  playNotificationSound
} from '../utils/notifications';
import { TabView, RRBZone } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabView) => void;
  zones: RRBZone[];
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  zones,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'cutoff' | 'notice' | 'result' | 'exam'>('all');
  const [viewMode, setViewMode] = useState<'notifications' | 'settings'>('notifications');
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  // Sync state when opened or when notification event fires
  const refreshData = async () => {
    setNotifications(getStoredNotifications());
    setPreferences(getNotificationPreferences());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
    // Fetch real-time live broadcast records from Cloud SQL PostgreSQL
    const liveNotifs = await fetchServerLiveNotifications();
    if (liveNotifs && liveNotifs.length > 0) {
      setNotifications(liveNotifs);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener('rrb_notifications_updated', handleUpdate);
    window.addEventListener('rrb_prefs_changed', handleUpdate);
    return () => {
      window.removeEventListener('rrb_notifications_updated', handleUpdate);
      window.removeEventListener('rrb_prefs_changed', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.category === activeFilter;
  });

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all notification history?')) {
      const updated = clearAllNotifications();
      setNotifications(updated);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    onClose();
    if (notif.targetTab) {
      onNavigate(notif.targetTab);
    }
  };

  const handleToggleMaster = () => {
    const updated = { ...preferences, enabled: !preferences.enabled };
    setPreferences(updated);
    saveNotificationPreferences(updated);
  };

  const handleRequestBrowserPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPermissionState(perm);
    setPreferences(getNotificationPreferences());
  };

  const handleToggleSound = () => {
    const updated = { ...preferences, sound: !preferences.sound };
    setPreferences(updated);
    saveNotificationPreferences(updated);
    if (updated.sound) {
      playNotificationSound();
    }
  };

  const handleToggleToast = () => {
    const updated = { ...preferences, toastAlert: !preferences.toastAlert };
    setPreferences(updated);
    saveNotificationPreferences(updated);
  };

  const handleCategoryToggle = (categoryKey: keyof NotificationPreferences['categories']) => {
    const updated = {
      ...preferences,
      categories: {
        ...preferences.categories,
        [categoryKey]: !preferences.categories[categoryKey],
      },
    };
    setPreferences(updated);
    saveNotificationPreferences(updated);
  };

  const handleSendTest = () => {
    sendTestNotification();
    setTestSentMessage('Test notification sent with sound and push alert!');
    setTimeout(() => setTestSentMessage(null), 3500);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="relative w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-xs">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-slate-900 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  Notifications & Live Alerts
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Railway recruitment upload alerts, cut-offs & merit lists
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle Settings View */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'notifications' ? 'settings' : 'notifications')}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                viewMode === 'settings'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={viewMode === 'settings' ? 'View Notifications' : 'Notification Settings'}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Alert Switch Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${preferences.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-semibold text-slate-800">
              Instant Alerts:
            </span>
            <span className={`font-bold ${preferences.enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
              {preferences.enabled ? 'Enabled (चालू)' : 'Disabled (बंद)'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleToggleMaster}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                preferences.enabled
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {preferences.enabled ? 'Turn Off' : 'Turn On (चालू करें)'}
            </button>

            {permissionState !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestBrowserPermission}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                title="Enable browser system push notifications"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Allow Push Alerts</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Body */}
        {viewMode === 'notifications' ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Filter Tabs & Bulk Actions */}
            <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('cutoff')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'cutoff'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cut-Offs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('result')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'result'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Results
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('notice')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'notice'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Notices
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('exam')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'exam'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Exams
                </button>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1 cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Read All</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-slate-400 hover:text-rose-600 transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Clear notification list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-700 text-sm">No notifications found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    When new CEN exams, cut-offs, or results are uploaded, live alerts will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendTest}
                    className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Sample Test Notification</span>
                  </button>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isCutoff = notif.category === 'cutoff';
                  const isResult = notif.category === 'result';
                  const isNotice = notif.category === 'notice';
                  const isExam = notif.category === 'exam';

                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  let iconBg = 'bg-amber-100 text-amber-800';
                  let Icon = Bell;

                  if (isCutoff) {
                    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    iconBg = 'bg-emerald-100 text-emerald-700';
                    Icon = BarChart3;
                  } else if (isResult) {
                    badgeColor = 'bg-purple-50 text-purple-800 border-purple-200';
                    iconBg = 'bg-purple-100 text-purple-700';
                    Icon = Award;
                  } else if (isNotice) {
                    badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                    iconBg = 'bg-blue-100 text-blue-700';
                    Icon = FileText;
                  } else if (isExam) {
                    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                    iconBg = 'bg-amber-100 text-amber-700';
                    Icon = GraduationCap;
                  }

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 rounded-xl transition-all flex items-start space-x-3 cursor-pointer group hover:bg-slate-50 ${
                        !notif.read ? 'bg-amber-50/40 border-l-4 border-amber-500' : 'bg-white'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {notif.badgeText || notif.category}
                            </span>
                            {notif.zoneCode && notif.zoneCode !== 'ALL' && (
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
                                {notif.zoneCode}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {formatTime(notif.timestamp)}
                          </span>
                        </div>

                        <h4 className={`text-xs sm:text-sm font-bold leading-snug group-hover:text-amber-700 transition-colors ${
                          !notif.read ? 'text-slate-950 font-extrabold' : 'text-slate-800'
                        }`}>
                          {notif.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="mt-2 flex items-center space-x-1 text-[11px] font-semibold text-amber-600 group-hover:text-amber-700">
                          <span>View record in {notif.targetTab || 'portal'}</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {!notif.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1.5" title="Unread" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Settings View */
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-800 text-xs">
            {testSentMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{testSentMessage}</span>
              </div>
            )}

            {/* Setting Item: Browser Desktop/Mobile Push */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                    <Globe className="w-4 h-4 text-amber-600" />
                    <span>Browser Desktop & Mobile Push Notifications</span>
                  </h4>
                  <p className="text-slate-500 mt-1 text-xs leading-relaxed">
                    Receive official Railway Board alerts directly in your browser or device notification tray even when this tab is not actively focused.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestBrowserPermission}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                    permissionState === 'granted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  {permissionState === 'granted' ? 'Allowed (सक्रिय)' : 'Enable Browser Push'}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1 border-t border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: Browser Permission is <strong>{permissionState}</strong></span>
              </div>
            </div>

            {/* Setting Item: Audio Chime & In-App Toasts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    {preferences.sound ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <span>Audio Chime Tone</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Gentle synthesizer sound on update</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    preferences.sound ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Real-time In-App Toasts</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Floating bottom banners on data upload</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleToast}
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    preferences.toastAlert ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                </button>
              </div>
            </div>

            {/* Category Preferences */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Notification Categories & Event Subscriptions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.categories.cutoffs}
                    onChange={() => handleCategoryToggle('cutoffs')}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">Cut-Off Marks Updates</span>
                    <p className="text-[10px] text-slate-500">CBT-1, CBT-2, Psycho & DV cutoffs</p>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.categories.results}
                    onChange={() => handleCategoryToggle('results')}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">Results & Merit Panels</span>
                    <p className="text-[10px] text-slate-500">Selected roll numbers & scorecards</p>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.categories.notices}
                    onChange={() => handleCategoryToggle('notices')}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">Official Notices & Circulars</span>
                    <p className="text-[10px] text-slate-500">Exam dates, city slips & answer keys</p>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.categories.exams}
                    onChange={() => handleCategoryToggle('exams')}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">CEN Exam Notifications</span>
                    <p className="text-[10px] text-slate-500">New job drives, eligibility & vacancies</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Test Notification Trigger */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSendTest}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 text-amber-400" />
                <span>Send Test Live Notification</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('notifications')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
              >
                ← Back to Notification List
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cross-tab Live Real-time Broadcast Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
