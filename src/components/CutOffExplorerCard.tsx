import React, { useState } from 'react';
import { Calendar, Info, ChevronDown, CheckCircle2 } from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';

interface CutOffExplorerCardProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  onApplyCutoffFilters: (filters: {
    examId?: string;
    year?: string;
    zoneCode?: string;
    category?: string;
    stage?: string;
  }) => void;
}

export const CutOffExplorerCard: React.FC<CutOffExplorerCardProps> = ({
  database,
  setCurrentTab,
  onApplyCutoffFilters,
}) => {
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('UR');
  const [selectedStage, setSelectedStage] = useState('CBT-1');

  const handleViewCutOff = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyCutoffFilters({
      examId: selectedExam || undefined,
      year: selectedYear,
      zoneCode: selectedZone !== 'ALL' ? selectedZone : undefined,
      category: selectedCategory,
      stage: selectedStage,
    });
    setCurrentTab('cutoffs');
  };

  const years = ['2025', '2024', '2022', '2019', '2018'];
  const stages = ['CBT-1', 'CBT-2 (Part-A)', 'CBAT / Psycho Test', 'Typing Skill Test', 'Document Verification (DV/Final)'];
  const categories = ['UR', 'OBC', 'SC', 'ST', 'EWS', 'ExSM', 'PwBD'];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-red-50 text-[#c1121f] flex items-center justify-center">
          <Calendar className="w-4 h-4" />
        </div>
        <h3 className="font-black text-base sm:text-lg text-[#c1121f] tracking-tight">
          Cut Off Finder
        </h3>
      </div>

      {/* Form Form Controls */}
      <form onSubmit={handleViewCutOff} className="space-y-4">
        {/* Row 1: Select Exam & Select Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Select Exam */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Select Exam
            </label>
            <div className="relative">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#c1121f]"
              >
                <option value="">Select Exam</option>
                {database.exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.shortCode} - {exam.title.split('-')[0]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Select Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Select Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#c1121f]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Select Zone & Select Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Select Zone */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Select Zone
            </label>
            <div className="relative">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#c1121f]"
              >
                <option value="ALL">All Zones</option>
                {database.zones.map((z) => (
                  <option key={z.id} value={z.code}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Select Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Select Category
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#c1121f]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 3: Select Stage */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Select Stage
          </label>
          <div className="relative">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#c1121f]"
            >
              {stages.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Big Red Button */}
        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-[#c1121f] hover:bg-[#a50f1a] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
        >
          <span>View Cut Off</span>
        </button>

        {/* Soft Blue Information Box */}
        <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 flex items-start space-x-2.5">
          <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-sky-800 font-medium leading-tight">
            Get zone & category wise cut off <br />
            <span className="text-sky-600 font-normal">All years data available</span>
          </p>
        </div>
      </form>
    </div>
  );
};
