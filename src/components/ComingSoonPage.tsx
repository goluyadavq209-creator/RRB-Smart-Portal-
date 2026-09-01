import React, { useState } from 'react';
import { 
  Building2, 
  Train, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Bell, 
  Send, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Zap, 
  ChevronRight, 
  AlertTriangle,
  Mail,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { RailwayLogo } from './RailwayLogo';
import { FullRRBDatabase } from '../types';

interface ComingSoonPageProps {
  database: FullRRBDatabase;
  onOpenAdminLogin: () => void;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  database,
  onOpenAdminLogin,
}) => {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const siteSettings = database.settings || {
    isWebsiteLive: false,
    maintenanceTitle: 'RRB Portal - Official Gateway Upgrade',
    maintenanceMessage: 'हम पोर्टल को और बेहतर और तीव्र बनाने के लिए तकनीकी अपडेट कर रहे हैं। जल्द ही सभी परीक्षा परिणाम, कट-ऑफ और उत्तर कुंजी उपलब्ध होंगे।',
    expectedLaunchDate: 'Coming Very Soon (जल्द आ रहे हैं)',
    supportContactEmail: 'helpdesk@rrb.gov.in',
    telegramChannelUrl: 'https://t.me/railway_recruitment_updates',
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyEmail.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setNotifyEmail('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1426] via-[#0f1d38] to-[#070d1a] text-white flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[350px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-10 w-[400px] h-[300px] bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Bar Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RailwayLogo className="w-10 h-10 drop-shadow-md" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-black tracking-wide text-white">
                  GOVERNMENT OF INDIA
                </span>
                <span className="hidden sm:inline-block text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                  Ministry of Railways
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
                Railway Recruitment Boards (RRB) • Official Web Gateway
              </p>
            </div>
          </div>

          {/* Admin Entry Action */}
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm hover:scale-105"
            title="Admin & Management Access"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Portal</span>
          </button>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center max-w-4xl mx-auto w-full">
        {/* Status Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wider uppercase mb-6 shadow-inner animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Under Maintenance • Coming Soon</span>
        </div>

        {/* Main Display Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-4">
          Upgrading the Official <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
            Railway Recruitment Gateway
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
          {siteSettings.maintenanceMessage || 
            'हम पोर्टल को और बेहतर, तीव्र और उन्नत बनाने के लिए तकनीकी मेंटेनेंस कर रहे हैं। शीघ्र ही सभी 21 आरआरबी के परिणाम, आंसर-की और कट-ऑफ उपलब्ध होंगे।'}
        </p>

        {/* Live Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl mb-10 text-left">
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 font-bold">
              🧮
            </div>
            <h2 className="text-xs font-black text-white">Answer Key Calculator</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Instant score & normalization</p>
          </div>

          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold">
              📊
            </div>
            <h2 className="text-xs font-black text-white">21 RRB Cut-Off Finder</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Category & Zone wise data</p>
          </div>

          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 font-bold">
              🔍
            </div>
            <h2 className="text-xs font-black text-white">Direct Roll Search</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Instant PDF candidate lookup</p>
          </div>

          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 font-bold">
              ⚡
            </div>
            <h2 className="text-xs font-black text-white">Instant Notifications</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Official CEN alerts</p>
          </div>
        </div>

        {/* Expected Time & Notification Box */}
        <div className="w-full max-w-lg bg-white/5 border border-white/15 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-center space-x-2 text-amber-300 text-xs font-bold mb-3">
            <Clock className="w-4 h-4" />
            <span>Estimated Launch: {siteSettings.expectedLaunchDate || 'Coming Very Soon'}</span>
          </div>

          {/* Email Alert Subscribe */}
          {isSubscribed ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>धन्यवाद! वेबसाइट लाइव होते ही आपको अलर्ट मिल जाएगा।</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="Enter email for live launch alert..."
                className="flex-1 bg-slate-950/80 border border-white/20 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 shadow-lg"
              >
                <span>Notify Me</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Telegram Channel Button */}
          {siteSettings.telegramChannelUrl && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center">
              <a
                href={siteSettings.telegramChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
              >
                <span>Join Official Telegram Channel for Instant Alerts</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/60 backdrop-blur-md py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Railway Recruitment Boards (RRBs). All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span>Helpdesk: {siteSettings.supportContactEmail || 'helpdesk@rrb.gov.in'}</span>
            <button
              onClick={onOpenAdminLogin}
              className="text-amber-400 hover:underline font-semibold cursor-pointer text-[11px]"
            >
              Admin Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
