import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  Download, 
  ExternalLink, 
  X, 
  Calendar, 
  Building2, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Share2
} from 'lucide-react';
import { FullRRBDatabase, TabView, WebsitePost, NoticeItem, CutoffRecord, ResultItem } from '../types';
import { PostDetailModal } from './PostDetailModal';
import { PdfViewerModal } from './PdfViewerModal';

interface LatestUpdatesCardProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  onOpenNoticeDetail?: (noticeTitle: string) => void;
  activeExamFilter?: string;
  onClearFilter?: () => void;
}

type UpdateItemType = {
  id: string;
  tag: string;
  categoryType: 'ANSWER_KEY' | 'RESULT' | 'CUTOFF' | 'ADMIT_CARD' | 'NOTICE' | 'EXAM_DATE';
  tagBadgeClass: string;
  cardBorderClass: string;
  cardBgClass: string;
  title: string;
  examTitle?: string;
  cenNumber?: string;
  zoneName?: string;
  date: string;
  pdfUrl?: string;
  content?: string;
  post: WebsitePost | null;
  notice?: NoticeItem | null;
  cutoff?: CutoffRecord | null;
  result?: ResultItem | null;
  tab: TabView;
};

export const LatestUpdatesCard: React.FC<LatestUpdatesCardProps> = ({
  database,
  setCurrentTab,
  onOpenNoticeDetail,
  activeExamFilter = 'ALL',
  onClearFilter,
}) => {
  const [selectedPost, setSelectedPost] = useState<WebsitePost | null>(null);
  const [selectedGenericItem, setSelectedGenericItem] = useState<UpdateItemType | null>(null);
  const [activePdfUrl, setActivePdfUrl] = useState<{ url: string; title: string } | null>(null);

  // Derive updates dynamically from real database notices, exams, cutoffs, results, and published Telegram posts
  const publishedPosts = (database.posts || []).filter((p) => p.status === 'PUBLISHED');

  const allUpdates: UpdateItemType[] = [
    // 1. Published Telegram & Website Posts
    ...publishedPosts.map((p) => {
      const isAnswerKey = p.category === 'Answer Key';
      const isResult = p.category === 'Result';
      const isAdmitCard = p.category === 'Admit Card';
      const isCutoff = p.category === 'Cut Off';
      
      let badgeClass = 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs';
      let borderClass = 'border-indigo-100 hover:border-indigo-300';
      let bgClass = 'hover:bg-indigo-50/40';
      let categoryType: UpdateItemType['categoryType'] = 'NOTICE';

      if (isAnswerKey) {
        badgeClass = 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs';
        borderClass = 'border-amber-200 hover:border-amber-400';
        bgClass = 'hover:bg-amber-50/40';
        categoryType = 'ANSWER_KEY';
      } else if (isResult) {
        badgeClass = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs';
        borderClass = 'border-emerald-200 hover:border-emerald-400';
        bgClass = 'hover:bg-emerald-50/40';
        categoryType = 'RESULT';
      } else if (isAdmitCard) {
        badgeClass = 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs';
        borderClass = 'border-rose-200 hover:border-rose-400';
        bgClass = 'hover:bg-rose-50/40';
        categoryType = 'ADMIT_CARD';
      } else if (isCutoff) {
        badgeClass = 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs';
        borderClass = 'border-blue-200 hover:border-blue-400';
        bgClass = 'hover:bg-blue-50/40';
        categoryType = 'CUTOFF';
      }

      return {
        id: `post-${p.id}`,
        tag: p.category.toUpperCase(),
        categoryType,
        tagBadgeClass: badgeClass,
        cardBorderClass: borderClass,
        cardBgClass: bgClass,
        title: p.title,
        examTitle: p.exam_name || p.cen_number,
        cenNumber: p.cen_number,
        zoneName: p.zone_name,
        date: new Date(p.published_at || p.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        pdfUrl: p.pdf_url || p.official_url,
        content: p.summary_points?.join('\n• ') || p.cleaned_content,
        post: p,
        tab: 'notices' as TabView,
      };
    }),

    // 2. Official Database Notices
    ...database.notices.map((n) => {
      const isExamDate = n.category === 'Exam Date';
      const isResult = n.category === 'Result & Merit List';
      const isAnswerKey = n.category === 'Answer Key & Objections';

      let badgeClass = 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs';
      let borderClass = 'border-rose-200 hover:border-rose-400';
      let bgClass = 'hover:bg-rose-50/40';
      let categoryType: UpdateItemType['categoryType'] = 'NOTICE';
      let tagText = 'OFFICIAL NOTICE';

      if (isResult) {
        tagText = 'RESULT';
        badgeClass = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs';
        borderClass = 'border-emerald-200 hover:border-emerald-400';
        bgClass = 'hover:bg-emerald-50/40';
        categoryType = 'RESULT';
      } else if (isExamDate) {
        tagText = 'EXAM DATE';
        badgeClass = 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs';
        borderClass = 'border-purple-200 hover:border-purple-400';
        bgClass = 'hover:bg-purple-50/40';
        categoryType = 'EXAM_DATE';
      } else if (isAnswerKey) {
        tagText = 'ANSWER KEY';
        badgeClass = 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs';
        borderClass = 'border-amber-200 hover:border-amber-400';
        bgClass = 'hover:bg-amber-50/40';
        categoryType = 'ANSWER_KEY';
      }

      return {
        id: n.id,
        tag: tagText,
        categoryType,
        tagBadgeClass: badgeClass,
        cardBorderClass: borderClass,
        cardBgClass: bgClass,
        title: n.title,
        examTitle: n.examTitle || n.cenNumber,
        cenNumber: n.cenNumber,
        zoneName: n.zoneName,
        date: n.publishDate || 'Official Release',
        pdfUrl: n.pdfUrl,
        content: n.summary || n.title,
        post: null,
        notice: n,
        tab: 'notices' as TabView,
      };
    }),

    // 3. Cut-Off Marks
    ...database.cutoffs.map((c) => ({
      id: `cut-${c.id}`,
      tag: 'CUT OFF',
      categoryType: 'CUTOFF' as const,
      tagBadgeClass: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs',
      cardBorderClass: 'border-blue-200 hover:border-blue-400',
      cardBgClass: 'hover:bg-blue-50/40',
      title: `${c.examTitle || c.cenNumber} (${c.stage}) - ${c.postName} [Zone: ${c.zoneName || c.zoneCode}]`,
      examTitle: c.examTitle || c.cenNumber,
      cenNumber: c.cenNumber,
      zoneName: c.zoneName || c.zoneCode,
      date: `${c.year || '2026'}`,
      pdfUrl: c.pdfUrl,
      content: `UR: ${c.categories?.UR || 'N/A'} | OBC: ${c.categories?.OBC || 'N/A'} | SC: ${c.categories?.SC || 'N/A'} | ST: ${c.categories?.ST || 'N/A'} | EWS: ${c.categories?.EWS || 'N/A'}`,
      post: null,
      cutoff: c,
      tab: 'cutoffs' as TabView,
    })),

    // 4. Results & Merit Lists
    ...database.results.map((r) => ({
      id: `res-${r.id}`,
      tag: 'RESULT',
      categoryType: 'RESULT' as const,
      tagBadgeClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs',
      cardBorderClass: 'border-emerald-200 hover:border-emerald-400',
      cardBgClass: 'hover:bg-emerald-50/40',
      title: `${r.examTitle || r.cenNumber} - ${r.type} (${r.zoneName || 'All Zones'})`,
      examTitle: r.examTitle || r.cenNumber,
      cenNumber: r.cenNumber,
      zoneName: r.zoneName,
      date: r.publishDate || 'Official',
      pdfUrl: r.pdfUrl,
      content: `Result & Merit list published for ${r.examTitle || r.cenNumber}. Stage: ${r.type}.`,
      post: null,
      result: r,
      tab: 'results' as TabView,
    })),
  ];

  // Apply exam-specific filtering when activeExamFilter is set (e.g. RRB NTPC, RRB Group D, RRB Technician, RRB ALP)
  const isFiltered = activeExamFilter && activeExamFilter !== 'ALL';
  const filteredUpdates = isFiltered
    ? allUpdates.filter((item) => {
        const textToSearch = `${item.title} ${item.examTitle || ''} ${item.cenNumber || ''} ${item.tag}`.toLowerCase();
        const query = activeExamFilter.toLowerCase().replace('rrb', '').trim();
        return textToSearch.includes(query) || (item.examTitle && item.examTitle.toLowerCase().includes(activeExamFilter.toLowerCase()));
      })
    : allUpdates;

  const displayUpdates = filteredUpdates.slice(0, 8);

  const handleItemClick = (item: UpdateItemType) => {
    // 1. If it's a post -> Open PostDetailModal
    if (item.post) {
      setSelectedPost(item.post);
      return;
    }

    // 2. If it has a PDF link directly and is an official circular/notice
    if (item.pdfUrl && (item.pdfUrl.startsWith('data:application/pdf') || item.pdfUrl.endsWith('.pdf'))) {
      setActivePdfUrl({ url: item.pdfUrl, title: item.title });
      return;
    }

    // 3. Open Generic Item Notification Modal with complete details
    setSelectedGenericItem(item);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      {/* 1. Post Detail Modal */}
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />

      {/* 2. Full PDF Viewer Modal */}
      {activePdfUrl && (
        <PdfViewerModal
          isOpen={Boolean(activePdfUrl)}
          onClose={() => setActivePdfUrl(null)}
          title={activePdfUrl.title}
          pdfSource={activePdfUrl.url}
        />
      )}

      {/* 3. Comprehensive Notification / Notice Detail Modal */}
      {selectedGenericItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-3xl">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${selectedGenericItem.tagBadgeClass}`}>
                    {selectedGenericItem.tag}
                  </span>
                  {selectedGenericItem.cenNumber && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/20 text-white border border-white/20">
                      CEN: {selectedGenericItem.cenNumber}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-xl font-black leading-snug">
                  {selectedGenericItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGenericItem(null)}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Publish Date</span>
                  <span className="font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedGenericItem.date}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">RRB Zone</span>
                  <span className="font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{selectedGenericItem.zoneName || 'All 21 Zones'}</span>
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block font-medium text-[11px]">Authority</span>
                  <span className="font-bold text-emerald-700 flex items-center space-x-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Verified</span>
                  </span>
                </div>
              </div>

              {/* Cut-Off Table if Cutoff Record */}
              {selectedGenericItem.cutoff && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Category-Wise Cut-Off Marks Breakdown</span>
                  </h4>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="font-bold text-blue-900 block text-[11px]">UR</span>
                      <span className="font-black text-sm text-blue-700">{selectedGenericItem.cutoff.categories?.UR || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                      <span className="font-bold text-teal-900 block text-[11px]">OBC</span>
                      <span className="font-black text-sm text-teal-700">{selectedGenericItem.cutoff.categories?.OBC || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="font-bold text-purple-900 block text-[11px]">SC</span>
                      <span className="font-black text-sm text-purple-700">{selectedGenericItem.cutoff.categories?.SC || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-200">
                      <span className="font-bold text-pink-900 block text-[11px]">ST</span>
                      <span className="font-black text-sm text-pink-700">{selectedGenericItem.cutoff.categories?.ST || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="font-bold text-amber-900 block text-[11px]">EWS</span>
                      <span className="font-black text-sm text-amber-700">{selectedGenericItem.cutoff.categories?.EWS || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description / Circular Content */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">Official Notice Details</h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedGenericItem.content || 'Official notification released by Railway Recruitment Board.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {selectedGenericItem.pdfUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      const url = selectedGenericItem.pdfUrl!;
                      const title = selectedGenericItem.title;
                      setSelectedGenericItem(null);
                      setActivePdfUrl({ url, title });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#c1121f] hover:bg-[#a50f1a] text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Open & Read Official PDF</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const tab = selectedGenericItem.tab;
                      setSelectedGenericItem(null);
                      setCurrentTab(tab);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
                  >
                    <span>View Section ({selectedGenericItem.tab.toUpperCase()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
            Latest Updates & Notices
          </h3>
          {publishedPosts.length > 0 && (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xs">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Live Auto-Sync</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilter}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold transition-all cursor-pointer"
            >
              <span>✕ Clear ({activeExamFilter})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCurrentTab('notices')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Exam Filter Bar if Active */}
      {isFiltered && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-red-900 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#c1121f] animate-ping" />
            <span>Filtering exclusively by: <strong className="font-black text-[#c1121f]">{activeExamFilter}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClearFilter}
            className="text-[11px] font-bold text-red-700 hover:underline cursor-pointer"
          >
            Show All Exams
          </button>
        </div>
      )}

      {/* List of Updates with Rich Vibrant Color Cards */}
      {displayUpdates.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-700">
            {isFiltered ? `No updates found for ${activeExamFilter}` : 'No updates published yet'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {isFiltered ? 'Click "Show All Exams" above to see all updates.' : 'Latest updates and notifications will appear here upon official release.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayUpdates.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group gap-3 select-none shadow-xs hover:shadow-md ${item.cardBorderClass} ${item.cardBgClass} bg-white`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Colorful Category Tag Badge */}
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${item.tagBadgeClass}`}>
                  {item.tag}
                </span>

                {/* Title and Metadata */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                    {item.title}
                  </p>
                  {item.cenNumber && (
                    <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                      CEN: {item.cenNumber} {item.zoneName ? `• ${item.zoneName}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Date & Interactive Action */}
              <div className="flex items-center space-x-2.5 shrink-0">
                <div className="text-right hidden xs:block">
                  <span className="text-slate-500 text-[11px] font-bold block">{item.date}</span>
                </div>
                <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

