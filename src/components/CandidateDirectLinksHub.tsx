import React, { useState } from 'react';
import { 
  Ticket, 
  FileSpreadsheet, 
  Award, 
  MapPin, 
  ExternalLink, 
  Copy, 
  Check, 
  PlusCircle, 
  Sparkles, 
  ShieldCheck,
  ArrowRight,
  Filter
} from 'lucide-react';
import { CandidatePortalLink, FullRRBDatabase, PortalLinkType, TabView } from '../types';

interface CandidateDirectLinksHubProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  activeExamFilter?: string;
  onClearFilter?: () => void;
}

export const CandidateDirectLinksHub: React.FC<CandidateDirectLinksHubProps> = ({
  database,
  setCurrentTab,
  activeExamFilter = 'ALL',
  onClearFilter,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | PortalLinkType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const links = Array.isArray(database?.portalLinks) ? database.portalLinks : [];
  
  // Apply exam filter if specified (e.g. RRB NTPC, RRB Group D, RRB Technician, RRB ALP)
  const examMatchedLinks = activeExamFilter && activeExamFilter !== 'ALL'
    ? links.filter((l) => {
        if (!l) return false;
        const target = `${l.examTitle || ''} ${l.cenNumber || ''} ${l.title || ''} ${l.description || ''}`.toLowerCase();
        const query = activeExamFilter.toLowerCase().replace('rrb', '').trim();
        return target.includes(query) || (l.examTitle && l.examTitle.toLowerCase().includes(activeExamFilter.toLowerCase()));
      })
    : links;

  const activeLinks = examMatchedLinks.filter((l) => l && l.isActive);

  const filteredLinks = selectedTypeFilter === 'all'
    ? activeLinks
    : activeLinks.filter((l) => l && l.type === selectedTypeFilter);

  const handleCopy = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      navigator.clipboard.writeText(url);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeTheme = (type: PortalLinkType) => {
    switch (type) {
      case 'admit_card':
        return {
          label: 'Admit Card',
          bgLight: 'bg-rose-50/80',
          borderColor: 'border-rose-200 hover:border-rose-400',
          textColor: 'text-rose-700',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
          btnBg: 'bg-[#c1121f] hover:bg-[#a50e1a] text-white',
          iconBg: 'bg-[#c1121f] text-white',
          Icon: Ticket,
        };
      case 'answer_key':
        return {
          label: 'Answer Key',
          bgLight: 'bg-teal-50/80',
          borderColor: 'border-teal-200 hover:border-teal-400',
          textColor: 'text-teal-700',
          badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
          btnBg: 'bg-teal-600 hover:bg-teal-700 text-white',
          iconBg: 'bg-teal-600 text-white',
          Icon: FileSpreadsheet,
        };
      case 'score_card':
        return {
          label: 'Score Card',
          bgLight: 'bg-amber-50/80',
          borderColor: 'border-amber-200 hover:border-amber-400',
          textColor: 'text-amber-800',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
          iconBg: 'bg-amber-600 text-white',
          Icon: Award,
        };
      case 'city_intimation':
      default:
        return {
          label: 'City Slip',
          bgLight: 'bg-blue-50/80',
          borderColor: 'border-blue-200 hover:border-blue-400',
          textColor: 'text-blue-700',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
          iconBg: 'bg-blue-600 text-white',
          Icon: MapPin,
        };
    }
  };

  const countByType = {
    all: activeLinks.length,
    admit_card: activeLinks.filter((l) => l.type === 'admit_card').length,
    answer_key: activeLinks.filter((l) => l.type === 'answer_key').length,
    score_card: activeLinks.filter((l) => l.type === 'score_card').length,
    city_intimation: activeLinks.filter((l) => l.type === 'city_intimation').length,
  };

  return (
    <section 
      id="candidate-direct-links-hub"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-red-100 text-[#c1121f] text-[11px] font-bold uppercase tracking-wider border border-red-200">
              <span className="w-2 h-2 rounded-full bg-[#c1121f] animate-pulse"></span>
              <span>Live Portals</span>
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Candidate Direct Portals & Links
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Direct online login links for Answer Key, Admit Card (E-Call Letter), Score Card & Exam City Slip
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          {activeExamFilter && activeExamFilter !== 'ALL' && (
            <button
              type="button"
              onClick={onClearFilter}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer"
            >
              <span>✕ Clear Filter ({activeExamFilter})</span>
            </button>
          )}
          <button
            onClick={() => setCurrentTab('admin')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            title="Add or Remove Candidate Links as Admin"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Manage Links (Admin)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedTypeFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
            selectedTypeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>All Direct Links</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200">
            {countByType.all}
          </span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter('admit_card')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
            selectedTypeFilter === 'admit_card'
              ? 'bg-[#c1121f] text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Admit Card</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200/80 text-rose-900">
            {countByType.admit_card}
          </span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter('answer_key')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
            selectedTypeFilter === 'answer_key'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Answer Key</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-200/80 text-teal-900">
            {countByType.answer_key}
          </span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter('score_card')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
            selectedTypeFilter === 'score_card'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Score Card</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200/80 text-amber-950">
            {countByType.score_card}
          </span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter('city_intimation')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
            selectedTypeFilter === 'city_intimation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>City Slip</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200/80 text-blue-900">
            {countByType.city_intimation}
          </span>
        </button>
      </div>

      {/* Links Grid */}
      {filteredLinks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">
            No active direct links available in this category
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You can add new direct links for Answer Keys, Admit Cards, and Scorecards through the Admin Panel.
          </p>
          <button
            onClick={() => setCurrentTab('admin')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#c1121f] text-white font-bold text-xs hover:bg-[#a50e1a] transition-all cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Candidate Link in Admin</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLinks.map((item) => {
            const theme = getTypeTheme(item.type);
            const Icon = theme.Icon;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item?.url) {
                    window.open(item.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className={`p-4 sm:p-5 rounded-2xl border ${theme.borderColor} ${theme.bgLight} hover:bg-white transition-all duration-200 flex flex-col justify-between group shadow-xs hover:shadow-md cursor-pointer relative`}
              >
                <div>
                  {/* Top Row: Type Pill & Live Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${theme.badgeBg}`}>
                        {theme.label}
                      </span>
                    </div>

                    {item.badgeText && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{item.badgeText}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Exam info */}
                  <h3 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#c1121f] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {(item.examName || item.cenNumber) && (
                    <div className="mt-1.5 flex items-center space-x-2 text-xs">
                      {item.cenNumber && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                          {item.cenNumber}
                        </span>
                      )}
                      {item.examName && (
                        <span className="text-slate-600 font-semibold truncate text-[11px]">
                          {item.examName}
                        </span>
                      )}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Action Strip */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(item.id, item?.url || '', e)}
                    className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0"
                    title="Copy direct portal link"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <div
                    className={`inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl ${theme.btnBg} font-black text-xs transition-all shadow-xs group-hover:shadow cursor-pointer flex-1 text-center`}
                  >
                    <span>Click Box to Open Portal</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
