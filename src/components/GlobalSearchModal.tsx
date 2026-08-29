import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  GraduationCap, 
  BarChart3, 
  Bell, 
  Award, 
  Building2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: FullRRBDatabase;
  onNavigate: (tab: TabView, detailId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  database,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open from anywhere
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search in Exams
  const matchedExams = q
    ? database.exams.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.cenNumber.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.status.toLowerCase().includes(q)
      )
    : [];

  // Search in Cutoffs
  const matchedCutoffs = q
    ? database.cutoffs.filter(
        (c) =>
          c.examTitle.toLowerCase().includes(q) ||
          c.cenNumber.toLowerCase().includes(q) ||
          c.zoneName.toLowerCase().includes(q) ||
          c.postName.toLowerCase().includes(q) ||
          c.stage.toLowerCase().includes(q)
      )
    : [];

  // Search in Notices
  const matchedNotices = q
    ? database.notices.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          (n.cenNumber && n.cenNumber.toLowerCase().includes(q)) ||
          (n.contentSummary && n.contentSummary.toLowerCase().includes(q))
      )
    : [];

  // Search in Results
  const matchedResults = q
    ? database.results.filter(
        (r) =>
          r.examTitle.toLowerCase().includes(q) ||
          r.cenNumber.toLowerCase().includes(q) ||
          r.zoneName.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.rollNumbersSample && r.rollNumbersSample.some((roll) => roll.toLowerCase().includes(q)))
      )
    : [];

  // Search in Zones
  const matchedZones = q
    ? database.zones.filter(
        (z) =>
          z.name.toLowerCase().includes(q) ||
          z.code.toLowerCase().includes(q) ||
          z.headquarters.toLowerCase().includes(q)
      )
    : [];

  const totalMatches =
    matchedExams.length +
    matchedCutoffs.length +
    matchedNotices.length +
    matchedResults.length +
    matchedZones.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 pb-10">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
          <Search className="w-5 h-5 text-amber-600 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exams (e.g. ALP, NTPC), cut-offs, notices, roll numbers..."
            className="w-full bg-transparent border-none text-slate-900 placeholder-slate-400 focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
          {!query ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-base mb-1">
                Quick Universal RRB Search
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Type any CEN number (e.g., CEN 01/2024), zone name (e.g., Prayagraj, Mumbai), post name, or roll number.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['ALP', 'NTPC', 'Technician', 'Prayagraj', 'Cut-off', 'CBT-1'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-full font-medium transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : totalMatches === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">
                No matches found for "<span className="font-semibold text-slate-800">{query}</span>"
              </p>
              <p className="text-xs text-slate-400 mt-1">
                If data is empty, you can upload your official RRB JSON in the Admin Panel.
              </p>
              <button
                onClick={() => {
                  onNavigate('admin');
                  onClose();
                }}
                className="mt-3 inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 cursor-pointer"
              >
                <span>Go to Admin Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Exams Matches */}
              {matchedExams.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Exams ({matchedExams.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedExams.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => {
                          onNavigate('exams', ex.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                              {ex.cenNumber}
                            </span>
                            <span className="font-semibold text-sm text-slate-900">{ex.title}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ex.department} • Vacancies: {ex.totalVacancies.toLocaleString()} • Status: {ex.status}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cut-Offs Matches */}
              {matchedCutoffs.length > 0 && (
                <div className="pt-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cut-Off Records ({matchedCutoffs.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedCutoffs.map((cut) => (
                      <div
                        key={cut.id}
                        onClick={() => {
                          onNavigate('cutoffs');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {cut.postName} ({cut.stage})
                            </span>
                            <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {cut.zoneName}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-600 mt-1">
                            {cut.cutoffs.UR && <span className="font-medium">UR: <span className="text-slate-900 font-bold">{cut.cutoffs.UR}</span></span>}
                            {cut.cutoffs.OBC && <span>OBC: <strong>{cut.cutoffs.OBC}</strong></span>}
                            {cut.cutoffs.SC && <span>SC: <strong>{cut.cutoffs.SC}</strong></span>}
                            {cut.cutoffs.ST && <span>ST: <strong>{cut.cutoffs.ST}</strong></span>}
                            {cut.cutoffs.EWS && <span>EWS: <strong>{cut.cutoffs.EWS}</strong></span>}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notices Matches */}
              {matchedNotices.length > 0 && (
                <div className="pt-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span>Notices ({matchedNotices.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedNotices.map((nt) => (
                      <div
                        key={nt.id}
                        onClick={() => {
                          onNavigate('notices');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              {nt.category}
                            </span>
                            <span className="font-medium text-xs text-slate-900 truncate max-w-md">
                              {nt.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Published: {nt.publishDate} {nt.cenNumber ? `• ${nt.cenNumber}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Matches */}
              {matchedResults.length > 0 && (
                <div className="pt-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    <span>Results & Panels ({matchedResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedResults.map((res) => {
                      const matchedRoll = res.rollNumbersSample?.find(r => r.toLowerCase().includes(q));
                      return (
                        <div
                          key={res.id}
                          onClick={() => {
                            onNavigate('results');
                            onClose();
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200 hover:border-purple-300 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-xs text-slate-900">
                              {res.examTitle} - {res.stage}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {res.zoneName} • Type: {res.type} • Date: {res.publishDate}
                            </p>
                            {matchedRoll && (
                              <div className="mt-1.5 flex items-center space-x-1.5 text-xs">
                                <span className="text-[11px] text-slate-500">Matched Roll:</span>
                                <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-slate-950 border border-yellow-500 shadow-2xs">
                                  {matchedRoll}
                                </span>
                              </div>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Zones Matches */}
              {matchedZones.length > 0 && (
                <div className="pt-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>RRB Regional Boards ({matchedZones.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedZones.map((z) => (
                      <a
                        key={z.id}
                        href={z.officialWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{z.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{z.officialWebsite}</div>
                        </div>
                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold font-mono">
                          {z.code}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Press ESC or click outside to dismiss</span>
          <span className="font-medium text-slate-700">Instant Local Filter</span>
        </div>
      </div>
    </div>
  );
};
