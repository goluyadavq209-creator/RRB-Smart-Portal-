import React from 'react';
import { ShieldCheck, Sparkles, Zap, Layers } from 'lucide-react';

export const TrustBadgesStrip: React.FC = () => {
  const badges = [
    {
      icon: ShieldCheck,
      title: '100% Trusted',
      subtitle: 'Official & Authentic Data',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      icon: Sparkles,
      title: 'AI Powered',
      subtitle: 'Smart Search & Analysis',
      iconBg: 'bg-blue-500/20 text-blue-400',
    },
    {
      icon: Zap,
      title: 'Fast Updates',
      subtitle: 'Real Time Notifications',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    {
      icon: Layers,
      title: 'All in One Place',
      subtitle: 'Everything at One Portal',
      iconBg: 'bg-purple-500/20 text-purple-400',
    },
  ];

  return (
    <div className="bg-[#0b1b3d] rounded-3xl p-4 sm:p-5 text-white border border-blue-900/50 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-blue-900/40">
        {badges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className={`flex items-center space-x-3.5 ${
                idx !== 0 ? 'pt-3 sm:pt-0 sm:pl-4' : ''
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl ${badge.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
                  {badge.title}
                </h4>
                <p className="text-[11px] text-blue-200/70 truncate">
                  {badge.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
