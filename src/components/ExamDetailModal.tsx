import React from 'react';
import { 
  X, 
  GraduationCap, 
  Calendar, 
  Users, 
  Layers, 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  Briefcase,
  AlertCircle,
  Ticket,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { ExamItem, OFFICIAL_RRB_DIGIALM_LOGIN_URL } from '../types';

interface ExamDetailModalProps {
  exam: ExamItem | null;
  onClose: () => void;
}

export const ExamDetailModal: React.FC<ExamDetailModalProps> = ({ exam, onClose }) => {
  if (!exam) return null;

  const loginUrl = exam.admitCardUrl || exam.cityIntimationUrl || OFFICIAL_RRB_DIGIALM_LOGIN_URL;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500 text-slate-950">
                {exam.cenNumber}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                {exam.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{exam.title}</h2>
            <p className="text-xs text-slate-300 mt-0.5">{exam.department}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Key Quick Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="text-[11px] font-semibold text-amber-800 uppercase">Total Vacancies</div>
              <div className="text-lg font-extrabold text-amber-950 mt-0.5">
                {exam.totalVacancies.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Pay Scale</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                {exam.payScale || '7th CPC Level'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Age Limit</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                {exam.ageLimit || 'As per norms'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Short Code</div>
              <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                {exam.shortCode}
              </div>
            </div>
          </div>

          {/* OFFICIAL ADMIT CARD & CITY INTIMATION PORTAL ACCESS CARD */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 border border-red-800/40 text-white space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#c1121f] text-white flex items-center justify-center shrink-0">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Admit Card (E-Call Letter) & Exam City Portal
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Official Centralized DigiALM Candidate Login
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto">
                Live Online
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Login with your <strong>Registration Number</strong> and <strong>User Password (Date of Birth DDMMYYYY)</strong> to download your E-Call Letter, view Exam City & Date, and download SC/ST Travel Authority pass.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <a
                href={loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#c1121f] hover:bg-[#a50e1a] text-white font-bold text-xs transition-all shadow-md cursor-pointer text-center"
              >
                <Ticket className="w-4 h-4 shrink-0" />
                <span>Download Admit Card (DigiALM)</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <a
                href={loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs transition-all cursor-pointer text-center"
              >
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Check Exam City & Date Slip</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>

          {/* Important Timelines */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Important Schedule & Dates</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Application Start:</span>
                <span className="font-semibold text-slate-800">{exam.applicationStart || 'Refer Notification'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Application Closing:</span>
                <span className="font-semibold text-slate-800">{exam.applicationEnd || 'Refer Notification'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Exam Schedule (CBT):</span>
                <span className="font-semibold text-amber-800">{exam.examDates || 'To be announced'}</span>
              </div>
            </div>
          </div>

          {/* Eligibility Criteria */}
          {exam.eligibility && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>Minimum Educational Qualification</span>
              </h3>
              <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-800 font-medium">
                {exam.eligibility}
              </div>
            </div>
          )}

          {/* Selection Stages */}
          {exam.selectionStages && exam.selectionStages.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Recruitment & Selection Stages</span>
              </h3>
              <div className="space-y-2">
                {exam.selectionStages.map((stage, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 mt-0.5">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {exam.description && (
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Overview & Notes</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {exam.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Last Updated: {new Date(exam.updatedAt).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-2">
            {exam.officialPdfUrl && (
              <a
                href={exam.officialPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
              >
                <span>Official PDF</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
