import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  ExternalLink, 
  AlertCircle, 
  Plus, 
  ArrowRight, 
  Tag,
  CheckCircle2,
  X
} from 'lucide-react';
import { FullRRBDatabase, NoticeCategory, NoticeItem, TabView } from '../types';
import { PdfViewerModal } from './PdfViewerModal';

interface NoticesSectionProps {
  database: FullRRBDatabase;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  setCurrentTab: (tab: TabView) => void;
}

export const NoticesSection: React.FC<NoticesSectionProps> = ({
  database,
  selectedZoneFilter,
  setSelectedZoneFilter,
  setCurrentTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeNoticeModal, setActiveNoticeModal] = useState<NoticeItem | null>(null);
  const [activePdfPreview, setActivePdfPreview] = useState<{ title: string; source: string; text?: string } | null>(null);

  const categories: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Exam Date', value: 'Exam Date' },
    { label: 'City Slip / Admit Card', value: 'City Intimation / Admit Card' },
    { label: 'Answer Key & Objections', value: 'Answer Key & Objections' },
    { label: 'Corrigendum & Vacancy', value: 'Corrigendum & Vacancy Revision' },
    { label: 'Result & Merit', value: 'Result & Merit List' },
    { label: 'DV & Medical', value: 'DV & Medical' },
    { label: 'General Advisory', value: 'General Advisory' },
  ];

  const filteredNotices = database.notices.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.cenNumber && item.cenNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.contentSummary && item.contentSummary.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;

    const matchesZone =
      selectedZoneFilter === 'ALL' || item.zoneCode === 'ALL' || item.zoneCode === selectedZoneFilter;

    return matchesSearch && matchesCategory && matchesZone;
  });

  const getCategoryBadgeClass = (category: NoticeCategory) => {
    switch (category) {
      case 'Exam Date':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'City Intimation / Admit Card':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'Answer Key & Objections':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      case 'Corrigendum & Vacancy Revision':
        return 'bg-orange-50 text-orange-900 border-orange-200';
      case 'Result & Merit List':
        return 'bg-rose-50 text-rose-900 border-rose-200';
      case 'DV & Medical':
        return 'bg-cyan-50 text-cyan-900 border-cyan-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950">
                Official Notices & Employment Bulletins
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Centralized exam dates, city slip links, key objection windows, and corrigendums
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('admin')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Upload / Manage Notices</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices by keyword or CEN..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Zone Selector */}
          <div className="w-full sm:w-64">
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Zones & All-India Notices</option>
              {database.zones.map((z) => (
                <option key={z.id} value={z.code}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Feed List */}
      {filteredNotices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {database.notices.length === 0 ? 'No Active Notices Published' : 'No Notices Match Your Search'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            {database.notices.length === 0
              ? 'Official circulars, corrigendums, and exam schedules will be listed here as released by the Railway Recruitment Boards.'
              : 'Try resetting the category filter or searching with different terms.'}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setCurrentTab('admin')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Open Admin Panel
            </button>
            {(searchQuery || selectedCategory !== 'ALL' || selectedZoneFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedZoneFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`p-5 rounded-2xl bg-white border transition-all hover:shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                notice.isImportant
                  ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-2">
                {/* Badges Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {notice.isNew && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-600 text-white">
                      NEW
                    </span>
                  )}
                  {notice.isImportant && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-50 text-amber-900 border border-amber-200">
                      IMPORTANT
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-semibold uppercase rounded border ${getCategoryBadgeClass(
                      notice.category
                    )}`}
                  >
                    {notice.category}
                  </span>

                  {notice.cenNumber && (
                    <span className="px-2 py-0.5 font-mono text-[11px] font-medium bg-slate-100 text-slate-800 rounded border border-slate-200">
                      {notice.cenNumber}
                    </span>
                  )}

                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{notice.publishDate}</span>
                  </span>

                  <span className="text-[11px] font-medium text-slate-500">
                    • Zone:{' '}
                    {notice.zoneCode === 'ALL'
                      ? 'All RRBs'
                      : database.zones.find((z) => z.code === notice.zoneCode)?.name || notice.zoneCode}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {notice.title}
                </h3>

                {/* Summary */}
                {notice.contentSummary && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {notice.contentSummary}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0">
                <button
                  onClick={() => setActiveNoticeModal(notice)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  View Details
                </button>

                {notice.pdfUrl && (
                  <button
                    onClick={() =>
                      setActivePdfPreview({
                        title: notice.title,
                        source: notice.pdfUrl!,
                        text: notice.contentSummary,
                      })
                    }
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-purple-600 hover:text-purple-800 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Preview Document</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notice Detail View Modal */}
      {activeNoticeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-white border-b border-slate-200 text-slate-900 flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                  {activeNoticeModal.category}
                </span>
                <h3 className="font-bold text-base text-slate-950 mt-2">
                  {activeNoticeModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveNoticeModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
                <div>
                  <strong>Published:</strong> {activeNoticeModal.publishDate}
                </div>
                <div>
                  <strong>CEN:</strong> {activeNoticeModal.cenNumber || 'General'}
                </div>
                <div>
                  <strong>Zone:</strong> {activeNoticeModal.zoneCode}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Notice Announcement</h4>
                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {activeNoticeModal.contentSummary || 'No additional summary text provided in this notice.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {activeNoticeModal.pdfUrl ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const doc = activeNoticeModal;
                      setActivePdfPreview({
                        title: doc.title,
                        source: doc.pdfUrl!,
                        text: doc.contentSummary,
                      });
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>In-App Preview</span>
                  </button>
                  <a
                    href={activeNoticeModal.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Official Railway Release</span>
              )}
              <button
                onClick={() => setActiveNoticeModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {activePdfPreview && (
        <PdfViewerModal
          isOpen={true}
          onClose={() => setActivePdfPreview(null)}
          title={activePdfPreview.title}
          pdfSource={activePdfPreview.source}
          extractedText={activePdfPreview.text}
        />
      )}
    </div>
  );
};
