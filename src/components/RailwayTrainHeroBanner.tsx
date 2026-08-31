import React, { useState } from 'react';
import { Search, Bell, BarChart3, Trophy, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { TabView } from '../types';

interface RailwayTrainHeroBannerProps {
  onSearchSubmit?: (query: string) => void;
  onSelectTrendingExam?: (examShortCode: string) => void;
  onNavigateTab?: (tab: TabView) => void;
}

export const RailwayTrainHeroBanner: React.FC<RailwayTrainHeroBannerProps> = ({
  onSearchSubmit,
  onSelectTrendingExam,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchSubmit) {
      onSearchSubmit(searchQuery.trim());
    }
  };

  const trendingExams = ['RRB NTPC', 'RRB Group D', 'RRB Technician', 'RRB ALP'];

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl bg-[#09152b] border border-slate-800 text-white min-h-[460px] lg:min-h-[490px] flex items-center">
      {/* Background Indian Railways Locomotive Train Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Night / Dusk Railway Station Sky Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071329] via-[#091a38] to-[#12284c]" />

        {/* Ambient Railway Red & Warm Lantern Glows */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[350px] bg-amber-500/15 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

        {/* Detailed Realistic Indian Railway WAP-4 Red Train Vector Illustration */}
        <svg
          viewBox="0 0 1200 600"
          preserveAspectRatio="xMidYMid slice"
          className="absolute right-0 top-0 w-full h-full object-cover opacity-85"
        >
          <defs>
            <linearGradient id="trainRedBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="30%" stopColor="#dc2626" />
              <stop offset="70%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            <linearGradient id="trainRoof" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="locoGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0f172a" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
            </linearGradient>

            <linearGradient id="railGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Railway Tracks Base & Ballast */}
          <path d="M420 600 L1200 450 L1200 600 Z" fill="url(#railGlow)" opacity="0.9" />

          {/* Steel Rails */}
          <path d="M480 590 L1200 460" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
          <path d="M540 600 L1200 495" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />

          {/* Sleepers */}
          {Array.from({ length: 18 }).map((_, i) => (
            <line
              key={i}
              x1={510 + i * 36}
              y1={590 - i * 8}
              x2={560 + i * 36}
              y2={610 - i * 6}
              stroke="#475569"
              strokeWidth="5"
              strokeOpacity="0.8"
            />
          ))}

          {/* Overhead Electrification (OHE) Mast & Pantograph */}
          <line x1="720" y1="40" x2="720" y2="280" stroke="#64748b" strokeWidth="3" opacity="0.4" />
          <line x1="1020" y1="20" x2="1020" y2="240" stroke="#64748b" strokeWidth="3" opacity="0.4" />
          <line x1="400" y1="90" x2="1200" y2="40" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />
          <line x1="400" y1="120" x2="1200" y2="70" stroke="#cbd5e1" strokeWidth="2" opacity="0.6" />

          {/* Pantograph diamond arms */}
          <path d="M850 160 L875 105 L900 160 Z" stroke="#ef4444" strokeWidth="4" fill="none" />
          <line x1="840" y1="105" x2="910" y2="105" stroke="#fbbf24" strokeWidth="3" />

          {/* WAP-4 Red Locomotive Engine Main Cab Body */}
          <path
            d="M580 430 L590 280 L620 220 L1200 130 L1200 520 L660 520 Z"
            fill="url(#trainRedBody)"
            stroke="#7f1d1d"
            strokeWidth="2"
          />

          {/* Curved Front Aerodynamic Nose / Cowl */}
          <path
            d="M560 410 C560 290, 610 230, 680 215 L1200 145 L1200 480 L680 500 C600 500, 560 460, 560 410 Z"
            fill="url(#trainRedBody)"
          />

          {/* Yellow Railway Stripe on Locomotive */}
          <path
            d="M565 370 C600 370, 640 365, 710 355 L1200 295 L1200 325 L710 380 C630 390, 590 395, 565 390 Z"
            fill="#fbbf24"
          />

          {/* Cab Windshield Glass with Reflections */}
          <path
            d="M585 300 C605 255, 650 235, 710 230 L760 225 L750 290 L670 298 C625 302, 595 305, 585 300 Z"
            fill="url(#locoGlass)"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <path
            d="M775 224 L860 215 L850 280 L765 290 Z"
            fill="url(#locoGlass)"
            stroke="#1e293b"
            strokeWidth="3"
          />

          {/* WAP-4 / 22820 Number Plate & Indian Railways Logo */}
          <rect x="620" y="325" width="75" height="22" rx="4" fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
          <text x="657" y="340" fontSize="12" fill="#ffffff" textAnchor="middle" fontWeight="900" fontFamily="sans-serif">
            WAP-4
          </text>
          <text x="760" y="342" fontSize="14" fill="#fbbf24" fontWeight="900" fontFamily="sans-serif">
            22820
          </text>
          <text x="630" y="440" fontSize="11" fill="#fef08a" fontWeight="bold">
            द.पू.रे. / SER
          </text>

          {/* High-Beam Dual Round Headlights with Golden Aura */}
          <circle cx="585" cy="420" r="14" fill="#ffffff" stroke="#fbbf24" strokeWidth="3" />
          <circle cx="585" cy="420" r="6" fill="#fef08a" />
          <circle cx="585" cy="420" r="45" fill="#fef08a" opacity="0.35" filter="blur(12px)" />

          <circle cx="660" cy="435" r="14" fill="#ffffff" stroke="#fbbf24" strokeWidth="3" />
          <circle cx="660" cy="435" r="6" fill="#fef08a" />
          <circle cx="660" cy="435" r="45" fill="#fef08a" opacity="0.35" filter="blur(12px)" />

          {/* Bottom Cowcatcher / Cattle Guard */}
          <path d="M570 480 L620 520 L730 525 L720 545 L580 525 Z" fill="#1e293b" stroke="#dc2626" strokeWidth="2" />
        </svg>

        {/* Dark Left Backdrop Gradient for Perfect Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071329] via-[#071329]/95 md:via-[#071329]/80 lg:via-[#071329]/40 to-transparent w-full lg:w-3/5" />
      </div>

      {/* Hero Main Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column (7 cols): Headline, Search Box, Trending Pills */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              {/* Hindi Big Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-white leading-[1.2] tracking-tight">
                <span>Railway Exams की</span> <br />
                <span className="text-white">पूरी जानकारी, एक ही जगह</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-2.5 max-w-lg leading-relaxed">
                All Information. One Platform. Your Success.
              </p>
            </div>

            {/* Main Search Input with Red Search Button */}
            <form onSubmit={handleSearch} className="max-w-xl">
              <div className="bg-white rounded-2xl p-1.5 flex items-center shadow-2xl border border-white/20">
                <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Exam, Vacancy, Cut Off, Result..."
                  className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#c1121f] hover:bg-[#a50f1a] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Trending Now Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-300 font-semibold mr-1">Trending Now :</span>
              {trendingExams.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => onSelectTrendingExam && onSelectTrendingExam(exam)}
                  className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  {exam}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (5 cols): Official Candidate Services & Highlights */}
          <div className="lg:col-span-5 flex justify-end">
            <div className="w-full max-w-md bg-[#0b1b3d]/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-blue-500/30 shadow-2xl space-y-4 text-white relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                    <Bell className="w-5 h-5 text-red-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      Official RRB Live Updates
                    </h3>
                    <p className="text-[11px] text-blue-200">
                      All 21 Railway Recruitment Boards
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  LIVE
                </span>
              </div>

              {/* Quick Hub Links */}
              <div className="space-y-2">
                {[
                  {
                    title: 'Direct Roll Number Check',
                    sub: 'Instant Result Verification (No Login Required)',
                    tab: 'roll-check' as const,
                    icon: CheckCircle2,
                    badge: 'Instant',
                    highlight: true,
                  },
                  {
                    title: 'Exam Calendar & Syllabus',
                    sub: 'NTPC, Group D, ALP & Technician',
                    tab: 'exams' as const,
                    icon: FileText,
                    badge: 'Updated',
                    highlight: false,
                  },
                  {
                    title: 'Category-Wise Cut-Offs',
                    sub: 'UR / OBC / SC / ST / EWS Normalized Scores',
                    tab: 'cutoffs' as const,
                    icon: BarChart3,
                    badge: '21 Zones',
                    highlight: false,
                  },
                  {
                    title: 'CBT Results & Merit Lists',
                    sub: 'Scorecards & Document Verification Lists',
                    tab: 'results' as const,
                    icon: Trophy,
                    badge: 'Official',
                    highlight: false,
                  },
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab(item.tab)}
                    className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer group ${
                      item.highlight 
                        ? 'bg-blue-600/30 hover:bg-blue-600/45 border-blue-400/50 shadow-sm' 
                        : 'bg-white/10 hover:bg-white/15 border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        item.highlight ? 'bg-blue-500 text-white shadow-xs' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center space-x-1.5">
                          <span>{item.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            item.highlight ? 'bg-emerald-500 text-white' : 'bg-red-600/80 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 truncate max-w-[200px]">
                          {item.sub}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>

              {/* Trust Footer */}
              <div className="pt-1 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Govt. of India • Ministry of Railways Portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
