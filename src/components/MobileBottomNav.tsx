import React, { useState, useEffect } from 'react';
import { Home, GraduationCap, BarChart3, Trophy, Bot, Sparkles } from 'lucide-react';
import { TabView } from '../types';

interface MobileBottomNavProps {
  currentTab: TabView;
  setCurrentTab: (tab: TabView) => void;
  onOpenAIModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAIModal,
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
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          currentTab === 'home' ? 'text-[#c1121f]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Home</span>
        {currentTab === 'home' && <span className="w-3 h-0.5 bg-[#c1121f] rounded-full mt-0.5" />}
      </button>

      {/* Exams */}
      <button
        type="button"
        onClick={() => handleTabClick('exams')}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          currentTab === 'exams' ? 'text-[#c1121f]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <GraduationCap className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Exams</span>
        {currentTab === 'exams' && <span className="w-3 h-0.5 bg-[#c1121f] rounded-full mt-0.5" />}
      </button>

      {/* Cut Off */}
      <button
        type="button"
        onClick={() => handleTabClick('cutoffs')}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
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
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          currentTab === 'results' ? 'text-[#c1121f]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Trophy className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Results</span>
        {currentTab === 'results' && <span className="w-3 h-0.5 bg-[#c1121f] rounded-full mt-0.5" />}
      </button>

      {/* AI */}
      <button
        type="button"
        onClick={onOpenAIModal}
        className="flex flex-col items-center py-1 px-3 rounded-xl text-blue-600 hover:text-blue-700 transition-all cursor-pointer relative"
      >
        <div className="relative">
          <Bot className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
        </div>
        <span className="text-[10px] font-extrabold mt-0.5">AI</span>
      </button>
    </div>
  );
};
