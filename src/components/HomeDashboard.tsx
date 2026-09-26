import React from 'react';
import { 
  Building2, 
  Search, 
  FileCheck, 
  TrendingUp, 
  Award, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  Globe
} from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';
import { CandidateDirectLinksHub } from './CandidateDirectLinksHub';
import { RRBZonesWidget } from './RRBZonesWidget';
import { RailwayLogo } from './RailwayLogo';

interface HomeDashboardProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  onOpenGlobalSearch?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  database,
  setCurrentTab,
  selectedZoneFilter,
  setSelectedZoneFilter,
  onOpenGlobalSearch,
}) => {
  return (
    <div className="space-y-6 pb-10">
      {/* Official Government Direct Links Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1b2a4a] to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 shadow-inner shrink-0 flex items-center justify-center">
              <RailwayLogo className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>आधिकारिक डायरेक्ट लिंक पोर्टल • 2024–2026</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                Railway Recruitment Board • Official Links & Portals
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                भारतीय रेल भर्ती बोर्ड के आधिकारिक डायरेक्ट लिंक्स: Admit Card, City Intimation Slip, Score Card, Answer Key, Cut-Offs और Roll Number रिज़ल्ट्स।
              </p>
            </div>
          </div>

          {/* Quick Action Buttons for Real Tools */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <button
              onClick={() => setCurrentTab('roll-check')}
              className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#c1121f] hover:bg-[#a50e1a] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Check Roll Number</span>
            </button>
            <button
              onClick={() => setCurrentTab('cutoffs')}
              className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Cut-Off Marks</span>
            </button>
            <button
              onClick={() => setCurrentTab('results')}
              className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Results & Merit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Candidate Direct Online Portals & Links Hub (Admit Card, Score Card, Answer Key, City Slip, Official Apply) */}
      <CandidateDirectLinksHub 
        database={database} 
        setCurrentTab={setCurrentTab} 
      />

      {/* 2. Official RRB Regional Boards Directory (All 21 Official Regional RRB Websites) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                All 21 Regional RRBs Official Government Websites (सभी 21 क्षेत्रीय आरआरबी आधिकारिक वेबसाइट्स)
              </h2>
              <p className="text-xs text-slate-500">
                Direct official .gov.in links for all 21 Railway Recruitment Boards
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            21 Official Boards Active
          </span>
        </div>

        <RRBZonesWidget
          database={database}
          selectedZoneFilter={selectedZoneFilter}
          setSelectedZoneFilter={setSelectedZoneFilter}
          setCurrentTab={setCurrentTab}
        />
      </div>
    </div>
  );
};

