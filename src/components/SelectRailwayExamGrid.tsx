import React from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  Key, 
  Wrench, 
  Activity, 
  Shield, 
  Briefcase, 
  BarChart3,
  Layers
} from 'lucide-react';
import { FullRRBDatabase, TabView, ExamItem } from '../types';

interface SelectRailwayExamGridProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  onSelectExam?: (exam: ExamItem) => void;
}

export const SelectRailwayExamGrid: React.FC<SelectRailwayExamGridProps> = ({
  database,
  setCurrentTab,
  onSelectExam,
}) => {
  const examCategories = [
    {
      id: 'ntpc',
      name: 'RRB NTPC',
      subtitle: 'Non-Technical Popular',
      iconColor: 'bg-rose-50 text-[#c1121f] border-rose-100',
      icon: GraduationCap,
      examId: 'rrb-ntpc-2024',
    },
    {
      id: 'groupd',
      name: 'RRB Group D',
      subtitle: 'Level-1 Track Maintainer',
      iconColor: 'bg-purple-50 text-purple-700 border-purple-100',
      icon: Key,
      examId: 'rrb-group-d-2024',
    },
    {
      id: 'alp',
      name: 'RRB ALP',
      subtitle: 'Assistant Loco Pilot',
      iconColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: Layers,
      examId: 'rrb-alp-2024',
    },
    {
      id: 'technician',
      name: 'RRB Technician',
      subtitle: 'Grade-I & III Technical',
      iconColor: 'bg-amber-50 text-amber-700 border-amber-100',
      icon: Wrench,
      examId: 'rrb-tech-2024',
    },
    {
      id: 'je',
      name: 'RRB JE',
      subtitle: 'Junior Engineer & DMS',
      iconColor: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: BarChart3,
      examId: 'rrb-je-2024',
    },
    {
      id: 'nursing',
      name: 'RRB Nursing',
      subtitle: 'Staff Nurse & Medical',
      iconColor: 'bg-pink-50 text-pink-700 border-pink-100',
      icon: Activity,
      examId: 'rrb-paramedical-2024',
    },
    {
      id: 'paramedical',
      name: 'RRB Paramedical',
      subtitle: 'Pharmacist, Lab Tech',
      iconColor: 'bg-teal-50 text-teal-700 border-teal-100',
      icon: Shield,
      examId: 'rrb-paramedical-2024',
    },
    {
      id: 'ministerial',
      name: 'RRB Ministerial & Isolated',
      subtitle: 'Steno, Junior Translator',
      iconColor: 'bg-orange-50 text-orange-700 border-orange-100',
      icon: Briefcase,
      examId: 'rrb-ministerial-2024',
    },
  ];

  const handleSelectCategory = (cat: typeof examCategories[0]) => {
    const foundExam = database.exams.find((e) => e.id === cat.examId || e.shortCode.toLowerCase().includes(cat.id));
    if (foundExam && onSelectExam) {
      onSelectExam(foundExam);
    } else {
      setCurrentTab('exams');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-950">
            Select Railway Exam
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse centralized recruitment categories and vacancy portals.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('exams')}
          className="text-xs font-bold text-[#c1121f] hover:text-[#991b1b] cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Grid of 8 Exam Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {examCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat)}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col items-center text-center justify-between group select-none"
            >
              {/* Circular Icon */}
              <div className={`w-10 h-10 rounded-full ${cat.iconColor} border flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>

              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  {cat.name}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {cat.subtitle}
                </p>
              </div>

              {/* Arrow */}
              <div className="mt-3 text-slate-400 group-hover:text-[#c1121f] group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

