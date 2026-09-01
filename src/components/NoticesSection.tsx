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
  X,
  Sparkles,
  Send,
  Radio
} from 'lucide-react';
import { FullRRBDatabase, NoticeCategory, NoticeItem, TabView, WebsitePost } from '../types';
import { PdfViewerModal } from './PdfViewerModal';
import { PostDetailModal } from './PostDetailModal';

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
  const [activePostModal, setActivePostModal] = useState<WebsitePost | null>(null);
  const [activePdfPreview, setActivePdfPreview] = useState<{ title: string; source: string; text?: string } | null>(null);

  const categories: { label: string; value: string }[] = [
    { label: 'All Updates & Circulars', value: 'ALL' },
    { label: '⚡ Telegram AI Updates', value: 'TELEGRAM_POSTS' },
    { label: 'Exam Date', value: 'Exam Date' },
    { label: 'City Slip / Admit Card', value: 'City Intimation / Admit Card' },
    { label: 'Answer Key & Objections', value: 'Answer Key & Objections' },
    { label: 'Corrigendum & Vacancy', value: 'Corrigendum & Vacancy Revision' },
    { label: 'Result & Merit', value: 'Result & Merit List' },
    { label: 'DV & Medical', value: 'DV & Medical' },
    { label: 'General Advisory', value: 'General Advisory' },
  ];

  const publishedTelegramPosts = (database.posts || []).filter(p => p.status === 'PUBLISHED');

  const filteredNotices = database.notices.filter((item) => {
    if (selectedCategory === 'TELEGRAM_POSTS') return false;

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

  const filteredPosts = publishedTelegramPosts.filter((post) => {
    if (selectedCategory !== 'ALL' && selectedCategory !== 'TELEGRAM_POSTS') return false;

    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.exam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
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
      {/* Post Viewer Modal */}
      <PostDetailModal post={activePostModal} onClose={() => setActivePostModal(null)} />

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
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Zone Selector */}
          <div className="w-full sm:w-64">
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  : cat.value === 'TELEGRAM_POSTS'
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Telegram Live AI Articles Grid (if matching) */}
      {filteredPosts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Live Real-Time Bulletins (Auto-Published)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setActivePostModal(post)}
                className="bg-gradient-to-br from-white to-slate-50/70 p-5 rounded-2xl border border-blue-100 hover:border-blue-300 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {post.category}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {post.exam}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-xs font-bold text-blue-600">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-slate-500 font-medium text-[11px]">Click to Read Full Analysis</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notices Feed List */}
      {filteredNotices.length === 0 && filteredPosts.length === 0 ? (
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
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${getCategoryBadgeClass(
                      notice.category
                    )}`}
                  >
                    {notice.category}
                  </span>
                  {notice.cenNumber && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] sm:text-xs font-semibold">
                      {notice.cenNumber}
                    </span>
                  )}
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    Zone: {notice.zoneCode}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    {notice.publishDate}
                  </span>
                </div>

                <h3
                  onClick={() => setActiveNoticeModal(notice)}
                  className="font-bold text-slate-900 hover:text-blue-600 text-sm sm:text-base cursor-pointer transition-colors"
                >
                  {notice.title}
                </h3>

                {notice.contentSummary && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {notice.contentSummary}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => setActiveNoticeModal(notice)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  View Notice
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
                    className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                    title="Preview Circular PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notice Detail Modal */}
      {activeNoticeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryBadgeClass(
                    activeNoticeModal.category
                  )}`}
                >
                  {activeNoticeModal.category}
                </span>
                <span className="text-xs text-slate-500">
                  {activeNoticeModal.publishDate}
                </span>
              </div>
              <button
                onClick={() => setActiveNoticeModal(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="font-extrabold text-slate-950 text-base sm:text-lg leading-snug">
                {activeNoticeModal.title}
              </h3>

              <div className="flex flex-wrap gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
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
