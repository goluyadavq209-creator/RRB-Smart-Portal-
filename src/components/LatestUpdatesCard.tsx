import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { FullRRBDatabase, TabView, WebsitePost } from '../types';
import { PostDetailModal } from './PostDetailModal';

interface LatestUpdatesCardProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  onOpenNoticeDetail?: (noticeTitle: string) => void;
}

export const LatestUpdatesCard: React.FC<LatestUpdatesCardProps> = ({
  database,
  setCurrentTab,
  onOpenNoticeDetail,
}) => {
  const [selectedPost, setSelectedPost] = useState<WebsitePost | null>(null);

  // Derive updates dynamically from real database notices, exams, and published Telegram posts
  const publishedPosts = (database.posts || []).filter(p => p.status === 'PUBLISHED');

  const updates = [
    ...publishedPosts.map((p) => ({
      id: `post-${p.id}`,
      tag: p.category.toUpperCase(),
      tagColor: p.category === 'Answer Key' ? 'bg-amber-600 text-white' : p.category === 'Result' ? 'bg-emerald-600 text-white' : p.category === 'Admit Card' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white',
      title: p.title,
      date: new Date(p.published_at || p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      post: p,
      tab: 'notices' as TabView,
    })),
    ...database.notices.map((n) => ({
      id: n.id,
      tag: n.category === 'Exam Date' ? 'EXAM DATE' : n.category === 'Result & Merit List' ? 'RESULT' : n.category === 'Answer Key & Objections' ? 'ANSWER KEY' : 'NOTICE',
      tagColor: n.category === 'Result & Merit List' ? 'bg-emerald-600 text-white' : n.category === 'Exam Date' ? 'bg-purple-600 text-white' : n.category === 'Answer Key & Objections' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white',
      title: n.title,
      date: n.publishDate || 'Official',
      post: null as WebsitePost | null,
      tab: 'notices' as TabView,
    })),
    ...database.cutoffs.map((c) => ({
      id: `cut-${c.id}`,
      tag: 'CUT OFF',
      tagColor: 'bg-blue-600 text-white',
      title: `${c.examTitle || c.cenNumber} (${c.stage}) - ${c.postName}`,
      date: `${c.year}`,
      post: null as WebsitePost | null,
      tab: 'cutoffs' as TabView,
    })),
    ...database.results.map((r) => ({
      id: `res-${r.id}`,
      tag: 'RESULT',
      tagColor: 'bg-emerald-600 text-white',
      title: `${r.examTitle || r.cenNumber} - ${r.type}`,
      date: r.publishDate || 'Official',
      post: null as WebsitePost | null,
      tab: 'results' as TabView,
    })),
  ].slice(0, 6);

  const handleClick = (item: (typeof updates)[0]) => {
    if (item.post) {
      setSelectedPost(item.post);
      return;
    }
    if (onOpenNoticeDetail) {
      onOpenNoticeDetail(item.title);
    }
    setCurrentTab(item.tab);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      {/* Post Viewer Modal */}
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />

      {/* Header with View All -> */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
            Latest Updates & Notices
          </h3>
          {publishedPosts.length > 0 && (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
              <Sparkles className="w-3 h-3" />
              <span>Live Auto-Sync</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCurrentTab('notices')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List of Updates or Empty State */}
      {updates.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-700">No updates published yet</p>
          <p className="text-[11px] text-slate-500 mt-1">Latest updates and notifications will appear here upon official release.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {updates.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClick(item)}
              className="p-3 sm:p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between group gap-3 select-none"
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                {/* Badge Tag */}
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${item.tagColor}`}>
                  {item.tag}
                </span>

                {/* Title */}
                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                  {item.title}
                </p>
              </div>

              {/* Date with dot indicator */}
              <div className="flex items-center space-x-1.5 shrink-0 text-slate-500 text-[11px] font-medium">
                <span>{item.date}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
