import React, { useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  TrainTrack
} from 'lucide-react';
import { FullRRBDatabase, TabView, ExamItem } from '../types';

interface LatestUpdatesCarouselProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  onSelectExam?: (exam: ExamItem) => void;
}

export const LatestUpdatesCarousel: React.FC<LatestUpdatesCarouselProps> = ({
  database,
  setCurrentTab,
  onSelectExam,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const exams = database.exams || [];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base sm:text-lg text-slate-950 flex items-center space-x-1.5">
          <span>🔥 Active Recruitment Drives</span>
        </h3>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentTab('exams')}
            className="text-xs font-bold text-[#c1121f] hover:bg-red-50 border border-[#c1121f] px-3 py-1 rounded-full transition-colors cursor-pointer"
          >
            View All Exams
          </button>

          {exams.length > 0 && (
            <>
              {/* Carousel Arrows */}
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                aria-label="Previous updates"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                aria-label="Next updates"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-700">No active recruitment drives loaded</p>
          <p className="text-[11px] text-slate-500 mt-1">Exams and recruitment notifications will appear here upon official release.</p>
        </div>
      ) : (
        /* Horizontal Scrollable Carousel Container */
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {exams.map((exam) => {
            return (
              <div
                key={exam.id}
                onClick={() => {
                  if (onSelectExam) onSelectExam(exam);
                  else setCurrentTab('exams');
                }}
                className="min-w-[240px] sm:min-w-[260px] max-w-[260px] snap-start bg-slate-50/70 hover:bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group select-none"
              >
                <div>
                  {/* Header of card: Train Icon + Name & Eligibility */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-[#c1121f] flex items-center justify-center shrink-0">
                        <TrainTrack className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {exam.shortCode}
                      </h4>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                      {exam.eligibility ? exam.eligibility.split(' ')[0] : 'All'}
                    </span>
                  </div>

                  {/* Status Items List */}
                  <div className="space-y-2 py-1 text-xs text-slate-700">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-500">CEN No:</span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{exam.cenNumber}</span>
                    </div>

                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-500">Status:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        {exam.status}
                      </span>
                    </div>

                    {exam.totalVacancies && (
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-500">Total Posts:</span>
                        <span className="font-bold text-slate-900 text-[11px]">{exam.totalVacancies.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Details Link */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-xs text-[#c1121f] group-hover:text-[#991b1b] flex items-center space-x-1">
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

