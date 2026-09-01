import React from 'react';
import { 
  X, 
  Calendar, 
  ExternalLink, 
  Tag, 
  CheckCircle2, 
  Share2, 
  Copy, 
  FileText, 
  Sparkles, 
  AlertCircle,
  Building2,
  BookmarkCheck,
  ArrowRight
} from 'lucide-react';
import { WebsitePost } from '../types';

interface PostDetailModalProps {
  post: WebsitePost | null;
  onClose: () => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!post) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?post=${post.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Answer Key':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Result':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Admit Card':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cut Off':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Vacancy':
      case 'Recruitment':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {post.post_type}
            </span>
            {post.confidence && (
              <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-600 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <Sparkles className="w-3 h-3" />
                <span>AI Verified ({Math.round(post.confidence * 100)}%)</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors relative"
              title="Copy Article Link"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          {/* Post Title & Exam Info */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-2">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{post.exam}</span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {post.official_reference && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{post.official_reference}</span>
                </>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
              {post.title}
            </h1>
          </div>

          {/* Quick Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-100/80">
            <div className="flex items-start space-x-3">
              <BookmarkCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                  Quick Summary & Highlights
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {post.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Key Bullet Points */}
          {post.important_points && post.important_points.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Important Key Points</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {post.important_points.map((pt, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start space-x-2.5 text-xs sm:text-sm text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Article Content */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Full Notification Details & Instructions</span>
            </h3>

            <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 whitespace-pre-line">
              {post.content}
            </div>
          </div>

          {/* Official Source & Reference */}
          {post.source_url && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-900">Official Portal Link</div>
                  <div className="text-xs text-amber-700 truncate max-w-md">{post.source_url}</div>
                </div>
              </div>
              <a
                href={post.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
              >
                <span>Open Official Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1 mr-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Tags:</span>
              </span>
              {post.tags.map((tag, i) => (
                <span 
                  key={i}
                  className="text-xs font-medium px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Source: Official RRB Channels & Verified Gateways
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
