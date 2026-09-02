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
  ChevronRight,
  Clock
} from 'lucide-react';
import { AppNotification, getNotificationPreferences, playNotificationSound } from '../utils/notifications';
import { TabView } from '../types';

interface NotificationToastContainerProps {
  onNavigate: (tab: TabView) => void;
}

interface ActiveToast extends AppNotification {
  startTime: number;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({ onNavigate }) => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    // 1. Listen to DOM custom event
    const handleNewNotification = (e: any) => {
      const notif = e.detail?.notification as AppNotification;
      if (!notif) return;

      const prefs = getNotificationPreferences();
      if (!prefs.enabled || !prefs.toastAlert) return;

      const newToast: ActiveToast = {
        ...notif,
        startTime: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev.filter((t) => t.id !== notif.id)].slice(0, 3));

      // Play chime sound
      if (prefs.sound) {
        playNotificationSound();
      }

      // Auto dismiss after EXACTLY 3 seconds (3000ms) as requested
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notif.id));
      }, 3000);
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
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col space-y-3 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const isCutoff = toast.category === 'cutoff';
        const isResult = toast.category === 'result';
        const isNotice = toast.category === 'notice';
        const isExam = toast.category === 'exam';
        const isUpload = toast.category === 'upload';

        let badgeBg = 'bg-amber-500 text-slate-950';
        let borderColor = 'border-amber-400';
        let progressBarColor = 'bg-amber-400';
        let Icon = Bell;

        if (isCutoff) {
          badgeBg = 'bg-emerald-500 text-white';
          borderColor = 'border-emerald-500';
          progressBarColor = 'bg-emerald-400';
          Icon = BarChart3;
        } else if (isResult) {
          badgeBg = 'bg-purple-500 text-white';
          borderColor = 'border-purple-500';
          progressBarColor = 'bg-purple-400';
          Icon = Award;
        } else if (isNotice) {
          badgeBg = 'bg-blue-500 text-white';
          borderColor = 'border-blue-500';
          progressBarColor = 'bg-blue-400';
          Icon = FileText;
        } else if (isExam) {
          badgeBg = 'bg-amber-500 text-slate-950';
          borderColor = 'border-amber-500';
          progressBarColor = 'bg-amber-400';
          Icon = GraduationCap;
        } else if (isUpload) {
          badgeBg = 'bg-indigo-500 text-white';
          borderColor = 'border-indigo-500';
          progressBarColor = 'bg-indigo-400';
          Icon = Upload;
        }

        return (
          <div
            key={toast.id}
            className={`relative overflow-hidden pointer-events-auto bg-slate-900/98 text-white border-l-4 ${borderColor} rounded-xl shadow-2xl p-4 transition-all transform animate-in slide-in-from-right-8 duration-300 backdrop-blur-md border border-slate-800 flex flex-col group hover:bg-slate-900 cursor-pointer`}
            onClick={() => handleToastClick(toast)}
          >
            <div className="flex items-start space-x-3">
              {/* Category Icon */}
              <div className={`w-9 h-9 rounded-lg ${badgeBg} flex items-center justify-center shrink-0 shadow-xs font-bold`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{toast.badgeText || toast.category.toUpperCase()}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center space-x-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>3s</span>
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-1">
                  {toast.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {toast.message}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-amber-400 font-semibold flex items-center space-x-0.5 group-hover:translate-x-1 transition-transform">
                    <span>View Update</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                  {toast.zoneCode && toast.zoneCode !== 'ALL' && (
                    <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      Zone: {toast.zoneCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button ('काटने वाला बटन') */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer border border-transparent hover:border-red-500/40"
                title="Dismiss / बंद करें (✕)"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Second Countdown Progress Bar Animation */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
              <div 
                className={`h-full ${progressBarColor}`}
                style={{
                  animation: 'toast-timer-3s 3s linear forwards',
                  transformOrigin: 'left'
                }}
              />
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes toast-timer-3s {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
