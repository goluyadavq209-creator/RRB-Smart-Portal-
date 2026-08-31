import React from 'react';
import { Home, Calculator, BarChart3, Trophy, SearchCheck } from 'lucide-react';
import { TabView } from '../types';

interface MobileBottomNavProps {
  currentTab: TabView;
  setCurrentTab: (tab: TabView) => void;
  onOpenSearch?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const handleTabClick = (tab: TabView) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {/* Home */}
      <button
        type="button"
        onClick={() => handleTabClick('home')}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'home' ? 'text-[#c1121f]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Home</span>
        {currentTab === 'home' && <span className="w-3 h-0.5 bg-[#c1121f] rounded-full mt-0.5" />}
      </button>

      {/* Answer Check (Answer Key & Rank Calculator) */}
      <button
        type="button"
        onClick={() => handleTabClick('answer-check')}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'answer-check' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'
        }`}
      >
        <Calculator className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Answer Check</span>
        {currentTab === 'answer-check' && <span className="w-3 h-0.5 bg-blue-600 rounded-full mt-0.5" />}
      </button>

      {/* Roll Check (Direct Next Action) */}
      <button
        type="button"
        onClick={() => handleTabClick('roll-check')}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'roll-check' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'
        }`}
      >
        <SearchCheck className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Roll Check</span>
        {currentTab === 'roll-check' && <span className="w-3 h-0.5 bg-indigo-600 rounded-full mt-0.5" />}
      </button>

      {/* Cut Off */}
      <button
        type="button"
        onClick={() => handleTabClick('cutoffs')}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'cutoffs' ? 'text-[#c1121f]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Cut Off</span>
        {currentTab === 'cutoffs' && <span className="w-3 h-0.5 bg-[#c1121f] rounded-full mt-0.5" />}
      </button>

      {/* Results */}
      <button
        type="button"
        onClick={() => handleTabClick('results')}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'results' ? 'text-[#c1121f]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Trophy className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Results</span>
        {currentTab === 'results' && <span className="w-3 h-0.5 bg-[#c1121f] rounded-full mt-0.5" />}
      </button>
    </div>
  );
};
