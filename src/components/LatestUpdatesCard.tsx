import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';

interface LatestUpdatesCardProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  onOpenNoticeDetail?: (noticeTitle: string) => void;
}

export const LatestUpdatesCard: React.FC<LatestUpdatesCardProps> = ({
  database,
  setCurrentTab,
  onOpenNoticeDetail,
}) => {
  // Derive updates dynamically from real database notices & exams
  const updates = [
    ...database.notices.map((n) => ({
      id: n.id,
      tag: n.category === 'Exam Date' ? 'EXAM DATE' : n.category === 'Result & Merit List' ? 'RESULT' : n.category === 'Answer Key & Objections' ? 'ANSWER KEY' : 'NOTICE',
      tagColor: n.category === 'Result & Merit List' ? 'bg-emerald-600 text-white' : n.category === 'Exam Date' ? 'bg-purple-600 text-white' : n.category === 'Answer Key & Objections' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white',
      title: n.title,
      date: n.publishDate || 'Official',
      tab: 'notices' as TabView,
    })),
    ...database.cutoffs.map((c) => ({
      id: `cut-${c.id}`,
      tag: 'CUT OFF',
      tagColor: 'bg-blue-600 text-white',
      title: `${c.examTitle || c.cenNumber} (${c.stage}) - ${c.postName}`,
      date: `${c.year}`,
      tab: 'cutoffs' as TabView,
    })),
    ...database.results.map((r) => ({
      id: `res-${r.id}`,
      tag: 'RESULT',
      tagColor: 'bg-emerald-600 text-white',
      title: `${r.examTitle || r.cenNumber} - ${r.type}`,
      date: r.publishDate || 'Official',
      tab: 'results' as TabView,
    })),
  ].slice(0, 5);

  const handleClick = (item: (typeof updates)[0]) => {
    if (onOpenNoticeDetail) {
      onOpenNoticeDetail(item.title);
    }
    setCurrentTab(item.tab);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      {/* Header with View All -> */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
          Latest Updates
        </h3>
        <button
          type="button"
          onClick={() => setCurrentTab('notices')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List of Updates or Empty State */}
      {updates.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-700">No updates published yet</p>
          <p className="text-[11px] text-slate-500 mt-1">Latest updates and notifications will appear here upon official release.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {updates.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClick(item)}
              className="p-3 sm:p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between group gap-3 select-none"
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                {/* Badge Tag */}
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${item.tagColor}`}>
                  {item.tag}
                </span>

                {/* Title */}
                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#c1121f] transition-colors truncate">
                  {item.title}
                </p>
              </div>

              {/* Date with dot indicator */}
              <div className="flex items-center space-x-1.5 shrink-0 text-slate-500 text-[11px] font-medium">
                <span>{item.date}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
