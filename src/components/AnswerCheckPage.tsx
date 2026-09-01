import React from 'react';
import { 
  ArrowLeft, 
  Home, 
  Sparkles, 
  Clock, 
  Bell, 
  ShieldCheck, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';
import { RailwayLogo } from './RailwayLogo';

interface AnswerCheckPageProps {
  database: FullRRBDatabase;
  onNavigateTab: (tab: TabView) => void;
}

export const AnswerCheckPage: React.FC<AnswerCheckPageProps> = ({
  database,
  onNavigateTab
}) => {
  return (
    <div className="min-h-screen bg-[#071328] bg-radial from-[#0d2347] via-[#071328] to-[#030914] text-white flex flex-col justify-between font-sans selection:bg-[#c1121f] selection:text-white relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. TOP MINIMAL NAVBAR */}
      <header className="relative z-20 px-4 sm:px-8 py-5 border-b border-white/10 backdrop-blur-md bg-white/[0.02]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => onNavigateTab('home')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <RailwayLogo size="md" />
            <div>
              <div className="flex items-center space-x-1.5 leading-none">
                <span className="text-white font-black text-lg tracking-tight">RRB</span>
                <span className="text-blue-400 font-black text-lg tracking-tight">Smart Portal</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Railway Recruitment Board • भारत सरकार
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('home')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs sm:text-sm font-bold flex items-center space-x-2 border border-white/15 transition-all cursor-pointer shadow-sm"
          >
            <Home className="w-4 h-4 text-blue-400" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CENTERED COMING SOON HERO */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="max-w-2xl w-full mx-auto text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Glowing Status Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md shadow-lg shadow-blue-900/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span>Answer Key & Rank Calculator Engine</span>
          </div>

          {/* Large Hero Title */}
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight">
              Coming <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">Soon</span>
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-slate-300 font-hindi tracking-wide">
              जल्द ही आ रहा है
            </p>
          </div>

          {/* Clean Description Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl text-slate-300 text-sm sm:text-base leading-relaxed space-y-4 max-w-xl mx-auto">
            <p className="font-medium text-slate-200">
              The official <strong>RRB Answer Key Verification, Score Calculator & All-India Rank Prediction</strong> tool is currently under preparation and will be live shortly.
            </p>
            <p className="text-xs sm:text-sm text-slate-400 font-hindi">
              जैसे ही रेलवे भर्ती बोर्ड (RRB) द्वारा आधिकारिक उत्तर कुंजी जारी की जाएगी, यह सुविधा तुरंत लाइव कर दी जाएगी।
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-blue-200 font-semibold">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shift-Wise Score Check</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zone & Category Rank</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Normalized Cut-Off Marks</span>
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('home')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Portal Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('cutoffs')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-sm sm:text-base border border-white/15 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Explore Official Cut-Offs</span>
            </button>
          </div>

        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="relative z-20 px-4 sm:px-8 py-6 border-t border-white/10 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            © {new Date().getFullYear()} RRB Smart Portal • Railway Recruitment Board
          </p>
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Official Candidate Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
