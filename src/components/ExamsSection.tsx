import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Layers, 
  Briefcase, 
  ArrowRight, 
  Plus, 
  ExternalLink,
  Info,
  CheckCircle,
  Clock,
  Ticket,
  MapPin
} from 'lucide-react';
import { ExamItem, ExamStatus, TabView, OFFICIAL_RRB_DIGIALM_LOGIN_URL } from '../types';
import { ExamDetailModal } from './ExamDetailModal';

interface ExamsSectionProps {
  exams: ExamItem[];
  setCurrentTab: (tab: TabView) => void;
}

export const ExamsSection: React.FC<ExamsSectionProps> = ({ exams, setCurrentTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedExamForModal, setSelectedExamForModal] = useState<ExamItem | null>(null);

  const statuses: { label: string; value: string }[] = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Active Application', value: 'Active Application' },
    { label: 'Exam Scheduled', value: 'Exam Scheduled' },
    { label: 'Upcoming', value: 'Upcoming' },
    { label: 'Result Declared', value: 'Result Declared' },
    { label: 'Completed', value: 'Completed' },
  ];

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.cenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.eligibility && exam.eligibility.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'ALL' || exam.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ExamStatus) => {
    switch (status) {
      case 'Active Application':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Exam Scheduled':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Upcoming':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Result Declared':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Completed':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950">
              Centralized Employment Notifications (CEN)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Official Indian Railway Recruitment Board Exam directory, eligibility & vacancy criteria
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('admin')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Upload / Manage Exams</span>
        </button>
      </div>

      {/* Official DigiALM Admit Card & City Slip Direct Access Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white border border-red-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            <span>Centralized DigiALM Portal</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Download Admit Card (E-Call Letter) & Check Exam City Intimation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Official candidate login link active for all RRB CEN Examinations. Login with your Registration Number and Date of Birth to view Exam City, Date, Shift & download Admit Card.
          </p>
        </div>

        <a
          href={OFFICIAL_RRB_DIGIALM_LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-[#c1121f] hover:bg-[#a50e1a] text-white font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-red-900/30 shrink-0 cursor-pointer"
        >
          <Ticket className="w-4 h-4" />
          <span>Candidate Login Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CEN, exam title, post..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {statuses.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === st.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {exams.length === 0 ? 'No Active RRB Exams at this moment' : 'No Matching Exams Found'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            {exams.length === 0
              ? 'Centralized employment notifications will appear here once officially published by the Railway Recruitment Board.'
              : 'Try adjusting your search criteria or resetting filters.'}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setCurrentTab('admin')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Open Admin Panel
            </button>
            {selectedStatus !== 'ALL' && (
              <button
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const loginUrl = exam.admitCardUrl || exam.cityIntimationUrl || OFFICIAL_RRB_DIGIALM_LOGIN_URL;
            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: CEN Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                      {exam.cenNumber}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(
                        exam.status
                      )}`}
                    >
                      {exam.status}
                    </span>
                  </div>

                  {/* Exam Title */}
                  <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{exam.department}</p>

                  {/* Quick Info Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Vacancies
                      </span>
                      <span className="font-extrabold text-slate-950 text-sm">
                        {exam.totalVacancies.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Pay Scale
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {exam.payScale || '7th CPC'}
                      </span>
                    </div>
                  </div>

                  {/* Dates info */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {exam.examDates && (
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          CBT Dates: <strong>{exam.examDates}</strong>
                        </span>
                      </div>
                    )}
                    {exam.applicationEnd && (
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Last Date: <strong>{exam.applicationEnd}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Direct Admit Card & City Slip Action Strip */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <a
                      href={loginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#c1121f] border border-red-200 font-bold text-[11px] transition-colors cursor-pointer text-center"
                      title="Download E-Call Letter / Admit Card"
                    >
                      <Ticket className="w-3 h-3 shrink-0" />
                      <span className="truncate">Admit Card</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                    </a>

                    <a
                      href={loginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[11px] transition-colors cursor-pointer text-center"
                      title="Check Exam City & Date Intimation Slip"
                    >
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">City Slip</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                    </a>
                  </div>

                  {/* Selection stages preview */}
                  {exam.selectionStages && exam.selectionStages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {exam.selectionStages.slice(0, 3).map((stg, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded"
                        >
                          {stg}
                        </span>
                      ))}
                      {exam.selectionStages.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                          +{exam.selectionStages.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedExamForModal(exam)}
                    className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>View Full Details & Stages</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exam Details Modal */}
      <ExamDetailModal
        exam={selectedExamForModal}
        onClose={() => setSelectedExamForModal(null)}
      />
    </div>
  );
};
