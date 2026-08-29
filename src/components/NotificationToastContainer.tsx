import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  ExternalLink, 
  GraduationCap, 
  BarChart3, 
  Award, 
  FileText, 
  Upload, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { AppNotification, getNotificationPreferences } from '../utils/notifications';
import { TabView } from '../types';

interface NotificationToastContainerProps {
  onNavigate: (tab: TabView) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({ onNavigate }) => {
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  useEffect(() => {
    // 1. Listen to DOM custom event
    const handleNewNotification = (e: any) => {
      const notif = e.detail?.notification as AppNotification;
      if (!notif) return;

      const prefs = getNotificationPreferences();
      if (!prefs.enabled || !prefs.toastAlert) return;

      setToasts((prev) => [notif, ...prev.filter((t) => t.id !== notif.id)].slice(0, 3));

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notif.id));
      }, 6000);
    };

    window.addEventListener('rrb_notifications_updated', handleNewNotification);

    // 2. Listen to BroadcastChannel across different browser tabs
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcastChannel = new BroadcastChannel('rrb_notification_broadcast_channel');
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'NEW_DATA_NOTIFICATION' && event.data?.notification) {
            handleNewNotification({ detail: { notification: event.data.notification } });
          }
        };
      } catch (err) {
        console.debug('BroadcastChannel error:', err);
      }
    }

    return () => {
      window.removeEventListener('rrb_notifications_updated', handleNewNotification);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToastClick = (toast: AppNotification) => {
    dismissToast(toast.id);
    if (toast.targetTab) {
      onNavigate(toast.targetTab);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const isCutoff = toast.category === 'cutoff';
        const isResult = toast.category === 'result';
        const isNotice = toast.category === 'notice';
        const isExam = toast.category === 'exam';
        const isUpload = toast.category === 'upload';

        let badgeBg = 'bg-amber-500 text-slate-950';
        let borderColor = 'border-amber-400';
        let Icon = Bell;

        if (isCutoff) {
          badgeBg = 'bg-emerald-500 text-white';
          borderColor = 'border-emerald-500';
          Icon = BarChart3;
        } else if (isResult) {
          badgeBg = 'bg-purple-500 text-white';
          borderColor = 'border-purple-500';
          Icon = Award;
        } else if (isNotice) {
          badgeBg = 'bg-blue-500 text-white';
          borderColor = 'border-blue-500';
          Icon = FileText;
        } else if (isExam) {
          badgeBg = 'bg-amber-500 text-slate-950';
          borderColor = 'border-amber-500';
          Icon = GraduationCap;
        } else if (isUpload) {
          badgeBg = 'bg-indigo-500 text-white';
          borderColor = 'border-indigo-500';
          Icon = Upload;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-slate-900/95 text-white border-l-4 ${borderColor} rounded-xl shadow-2xl p-4 transition-all transform animate-in slide-in-from-right-8 duration-300 backdrop-blur-md border-t border-r border-b border-slate-800 flex items-start space-x-3 group hover:bg-slate-900 cursor-pointer`}
            onClick={() => handleToastClick(toast)}
          >
            {/* Category Icon */}
            <div className={`w-9 h-9 rounded-lg ${badgeBg} flex items-center justify-center shrink-0 shadow-xs font-bold`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {toast.badgeText || toast.category.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-1">
                {toast.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                {toast.message}
              </p>

              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-amber-400 font-semibold flex items-center space-x-0.5 group-hover:translate-x-1 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
                {toast.zoneCode && toast.zoneCode !== 'ALL' && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded">
                    Zone: {toast.zoneCode}
                  </span>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
