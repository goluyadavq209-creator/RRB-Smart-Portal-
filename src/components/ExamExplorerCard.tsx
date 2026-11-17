import React from 'react';
import { 
  ChevronRight, 
  ArrowRight,
  GraduationCap, 
  Layers, 
  Wrench, 
  TrainTrack, 
  BarChart3, 
  Activity 
} from 'lucide-react';
import { FullRRBDatabase, TabView, ExamItem } from '../types';

interface ExamExplorerCardProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  onSelectExam?: (exam: ExamItem) => void;
}

export const ExamExplorerCard: React.FC<ExamExplorerCardProps> = ({
  database,
  setCurrentTab,
  onSelectExam,
}) => {
  const examsList = [
    {
      id: 'ntpc',
      name: 'RRB NTPC',
      icon: GraduationCap,
      color: 'bg-red-50 text-red-600',
      examId: 'rrb-ntpc-2024',
    },
    {
      id: 'groupd',
      name: 'RRB Group D',
      icon: Layers,
      color: 'bg-blue-50 text-blue-600',
      examId: 'rrb-group-d-2024',
    },
    {
      id: 'technician',
      name: 'RRB Technician',
      icon: Wrench,
      color: 'bg-emerald-50 text-emerald-600',
      examId: 'rrb-tech-2024',
    },
    {
      id: 'alp',
      name: 'RRB ALP',
      icon: TrainTrack,
      color: 'bg-purple-50 text-purple-600',
      examId: 'rrb-alp-2024',
    },
    {
      id: 'je',
      name: 'RRB JE',
      icon: BarChart3,
      color: 'bg-amber-50 text-amber-600',
      examId: 'rrb-je-2024',
    },
    {
      id: 'nursing',
      name: 'RRB Nursing',
      icon: Activity,
      color: 'bg-cyan-50 text-cyan-600',
      examId: 'rrb-paramedical-2024',
    },
  ];

  const handleClick = (item: typeof examsList[0]) => {
    const found = database.exams.find((e) => e.id === item.examId || e.shortCode.toLowerCase().includes(item.id));
    if (found && onSelectExam) {
      onSelectExam(found);
    } else {
      setCurrentTab('exams');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      {/* Header with View All -> */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
          Exam Explorer
        </h3>
        <button
          type="button"
          onClick={() => setCurrentTab('exams')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List of 6 Exams */}
      <div className="space-y-1.5">
        {examsList.map((exam) => {
          const Icon = exam.icon;
          return (
            <div
              key={exam.id}
              onClick={() => handleClick(exam)}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group select-none"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl ${exam.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#c1121f] transition-colors">
                  {exam.name}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#c1121f] group-hover:translate-x-0.5 transition-all" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
