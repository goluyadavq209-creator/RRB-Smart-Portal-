import React from 'react';
import { 
  ClipboardList, 
  Megaphone, 
  TrendingUp, 
  Trophy, 
  Key, 
  BookOpen 
} from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';

interface QuickAccessGridProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  onOpenStudyMaterial?: () => void;
}

export const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({
  setCurrentTab,
  onOpenStudyMaterial,
}) => {
  const cards = [
    {
      id: 'exams',
      title: 'Latest Exams',
      subtitle: 'View All Exams',
      icon: ClipboardList,
      iconColor: 'text-[#ef4444]',
      iconBg: 'bg-red-50',
      action: () => setCurrentTab('exams'),
    },
    {
      id: 'notifications',
      title: 'Latest Notifications',
      subtitle: 'Stay Updated',
      icon: Megaphone,
      iconColor: 'text-[#f97316]',
      iconBg: 'bg-orange-50',
      action: () => setCurrentTab('notices'),
    },
    {
      id: 'cutoffs',
      title: 'Cut Off',
      subtitle: 'Check Cut Off',
      icon: TrendingUp,
      iconColor: 'text-[#3b82f6]',
      iconBg: 'bg-blue-50',
      action: () => setCurrentTab('cutoffs'),
    },
    {
      id: 'results',
      title: 'Results',
      subtitle: 'View Results',
      icon: Trophy,
      iconColor: 'text-[#10b981]',
      iconBg: 'bg-emerald-50',
      action: () => setCurrentTab('results'),
    },
    {
      id: 'answerkey',
      title: 'Answer Keys',
      subtitle: 'Official Notices',
      icon: Key,
      iconColor: 'text-[#8b5cf6]',
      iconBg: 'bg-purple-50',
      action: () => setCurrentTab('notices'),
    },
    {
      id: 'studymaterial',
      title: 'Study Material',
      subtitle: 'Download PDFs',
      icon: BookOpen,
      iconColor: 'text-[#06b6d4]',
      iconBg: 'bg-cyan-50',
      action: () => {
        if (onOpenStudyMaterial) onOpenStudyMaterial();
        else setCurrentTab('exams');
      },
    },
  ];

  return (
    <div className="space-y-3">
      {/* Red Accent Section Header Label */}
      <div className="flex items-center space-x-2">
        <span className="text-[#c1121f] font-black text-base">/</span>
        <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
          Quick Access
        </h3>
      </div>

      {/* 6 Responsive Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.action}
              className="bg-white hover:bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center justify-between group select-none"
            >
              {/* Centered Colored Icon */}
              <div className={`w-12 h-12 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs`}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Title & Subtitle */}
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-[#c1121f] transition-colors leading-tight">
                  {card.title}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
