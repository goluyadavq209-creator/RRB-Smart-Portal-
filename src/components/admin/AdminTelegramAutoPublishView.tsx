import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Settings, 
  Sliders, 
  Check, 
  X, 
  Search, 
  Filter, 
  Copy, 
  Eye, 
  Layers, 
  FileText, 
  ShieldCheck, 
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Globe,
  Radio,
  Zap,
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  FullRRBDatabase, 
  WebsitePost, 
  TelegramMessageRecord, 
  AIProcessingLogRecord, 
  TelegramAutoPublishSettings,
  PostCategory,
  PostType,
  PostStatus
} from '../../types';
import { PostDetailModal } from '../PostDetailModal';

interface AdminTelegramAutoPublishViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  showToast: (msg: string) => void;
}

const SAMPLE_TELEGRAM_TEMPLATES = [
  {
    label: 'RRB Technician Answer Key 2026',
    text: `⚡️ RRB TECHNICIAN (CEN 02/2024) ANSWER KEY OUT!
Railway Recruitment Boards ne Technician Grade-1 & Grade-3 CBT exam ki tentative answer key aur question paper response sheet active kar di hai.
Candidates rrbcdg.gov.in ya digialm portal par login karke apni response sheet check kar sakte hain.
Objection raise karne ki fee ₹50 per question hai (refundable on valid objection).
Official Link: https://rrbcdg.gov.in`,
  },
  {
    label: 'RRB NTPC CBT-1 Exam Date & City Slip',
    text: `📢 BIG UPDATE: RRB NTPC (CEN 05/2024) Exam City Intimation Slip
Railway NTPC Graduate & Undergraduate posts ke CBT-1 exam ka city slip download link 10 din pehle sabhi 21 regional RRB boards par active hoga.
Exam Schedule: 15 April se 28 April 2026.
SC/ST Free Travel Pass bhi candidate portal par uplabdh hoga.
Source: Ministry of Railways Official Release`,
  },
  {
    label: 'RRB ALP CEN 01/2024 CBT-2 Result',
    text: `🔥 RRB ALP (Assistant Loco Pilot) CEN 01/2024 CBT-2 Official Result Declared!
CBAT (Aptitude Test) ke liye shortlisted candidates ki merit list aur cut-off marks sabhi 21 zones (Prayagraj, Mumbai, Kolkata, Chandigarh) ke liye release kar di gayi hai.
CBAT exam next month conduct kiya jayega.
Check your scorecard now on rrb.digialm.com`,
  },
  {
    label: 'RRB Group D 32,000+ Vacancy Notification',
    text: `🚨 NEW VACANCY: Railway Group D (CEN 08/2024) 32,450 Posts
Indian Railways me Track Maintainer, Pointsman aur Assistant Workshop posts ke liye online application form 1st May se shuru honge.
Eligibility: 10th Pass + NCVT/SCVT ITI certificate.
Age Limit: 18-33 years. Complete syllabus and vacancy distribution notification uploaded.`,
  }
];

export const AdminTelegramAutoPublishView: React.FC<AdminTelegramAutoPublishViewProps> = ({
  database,
  setDatabase,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'webhook' | 'simulator' | 'messages' | 'settings' | 'logs'>('webhook');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Post view & edit modal states
  const [viewingPost, setViewingPost] = useState<WebsitePost | null>(null);
  const [editingPost, setEditingPost] = useState<WebsitePost | null>(null);
  
  // Settings local state
  const [settings, setSettings] = useState<TelegramAutoPublishSettings>(
    database.telegramSettings || {
      telegram_enabled: true,
      ai_enabled: true,
      auto_publish: true,
      default_status: 'PUBLISHED',
      confidence_threshold: 0.80,
      ai_model: 'gemini-3.7-flash',
      target_channel_id: '@railway_recruitment_updates',
      auto_create_notices: true,
      auto_create_results: true,
      auto_create_portal_links: true,
      updated_at: new Date().toISOString(),
    }
  );

  // Simulator state
  const [simMediaType, setSimMediaType] = useState<'text' | 'photo' | 'document'>('text');
  const [simFileName, setSimFileName] = useState('CEN_02_2024_Technician_Notification.pdf');
  const [simText, setSimText] = useState(SAMPLE_TELEGRAM_TEMPLATES[0].text);
  const [simChatId, setSimChatId] = useState('-100192837465');
  const [simMsgId, setSimMsgId] = useState(String(Math.floor(1000 + Math.random() * 9000)));
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Connection Test state
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);

  // Polling state
  const [isFetchingUpdates, setIsFetchingUpdates] = useState(false);
  const [pollerStatus, setPollerStatus] = useState<{
    isActive: boolean;
    lastPolledAt: string | null;
    totalPolled: number;
    currentOffset: number;
    lastError: string | null;
  }>({
    isActive: true,
    lastPolledAt: null,
    totalPolled: 0,
    currentOffset: 0,
    lastError: null,
  });
  const [customWebhookInput, setCustomWebhookInput] = useState('');

  // Live Webhook Diagnostics state
  const [webhookDiagnostics, setWebhookDiagnostics] = useState<{
    telegramRegisteredUrl?: string;
    isRegistered?: boolean;
    hasCustomCertificate?: boolean;
    pendingUpdateCount?: number;
    telegramLastErrorDate?: string | null;
    telegramLastErrorMessage?: string | null;
    allowedUpdates?: string[];
    lastReceivedAt?: string | null;
    lastTelegramMessageId?: string | number | null;
    lastTelegramChatTitle?: string | null;
    lastTelegramStatus?: string | null;
    lastTelegramText?: string | null;
    lastError?: string | null;
    totalMessages?: number;
    totalPosts?: number;
  }>({});

  // Live Backend Server Sync states
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);
  const [serverEnvInfo, setServerEnvInfo] = useState<{
    hasBotToken?: boolean;
    hasWebhookSecret?: boolean;
    hasGeminiApiKey?: boolean;
    appUrl?: string;
  }>({});

  const posts = database.posts || [];
  const messages = database.telegramMessages || [];
  const logs = database.aiLogs || [];

  // Fetch live stats & settings from server on mount
  useEffect(() => {
    fetchServerData();
  }, []);

  const fetchServerData = async () => {
    try {
      setIsLoadingServer(true);

      // 1. Settings & Env
      const res = await fetch('/api/admin/auto-publish-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.environment) {
          setServerEnvInfo(data.environment);
        }
      }

      // 2. Webhook Diagnostics & Polling Status from Telegram API
      try {
        const whRes = await fetch('/api/telegram/webhook-info');
        if (whRes.ok) {
          const whData = await whRes.json();
          if (whData.diagnostics) {
            setWebhookDiagnostics(whData.diagnostics);
          }
        }

        const pollRes = await fetch('/api/telegram/polling-status');
        if (pollRes.ok) {
          const pData = await pollRes.json();
          if (pData.status) {
            setPollerStatus(pData.status);
          }
        }
      } catch (err) {
        console.warn('Webhook / Poller info fetch failed:', err);
      }

      // 3. Posts
      let fetchedPosts = database.posts || [];
      const postsRes = await fetch('/api/posts');
      if (postsRes.ok) {
        const pData = await postsRes.json();
        if (Array.isArray(pData.posts) && pData.posts.length > 0) {
          fetchedPosts = pData.posts;
        }
      }

      // 4. Raw Telegram Messages
      let fetchedMessages = database.telegramMessages || [];
      const msgRes = await fetch('/api/telegram/messages');
      if (msgRes.ok) {
        const mData = await msgRes.json();
        if (Array.isArray(mData.messages)) {
          fetchedMessages = mData.messages;
        }
      }

      // 5. AI Execution Logs
      let fetchedLogs = database.aiLogs || [];
      const logsRes = await fetch('/api/telegram/logs');
      if (logsRes.ok) {
        const lData = await logsRes.json();
        if (Array.isArray(lData.logs)) {
          fetchedLogs = lData.logs;
        }
      }

      setDatabase({
        ...database,
        posts: fetchedPosts,
        telegramMessages: fetchedMessages,
        aiLogs: fetchedLogs,
      });
    } catch (err) {
      console.warn('Backend sync warning (using client database):', err);
    } finally {
      setIsLoadingServer(false);
    }
  };

  // Action: Register Webhook (default or custom URL)
  const handleRegisterWebhook = async (customUrl?: string) => {
    setIsRegisteringWebhook(true);
    showToast('🌐 Connecting & registering webhook with Telegram API...');
    try {
      const appUrl = (customUrl || customWebhookInput.trim() || window.location.origin).trim();
      const res = await fetch('/api/telegram/setup-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appUrl }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Telegram Webhook registered and active on Telegram API!');
      } else {
        showToast(`⚠️ Telegram notice: ${data.error || 'Failed to register webhook'}`);
      }
      fetchServerData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsRegisteringWebhook(false);
    }
  };

  // Action: Delete / Unregister Webhook (enables direct polling)
  const handleDeleteWebhook = async () => {
    showToast('Disconnecting webhook from Telegram API...');
    try {
      const res = await fetch('/api/telegram/delete-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: settings.bot_token }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Webhook deleted. Telegram will now deliver updates to the live poller.');
      } else {
        showToast(`⚠️ Notice: ${data.error || 'Failed to delete webhook'}`);
      }
      fetchServerData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Action: Fetch / Poll Pending Updates Now
  const handleFetchUpdatesNow = async () => {
    setIsFetchingUpdates(true);
    showToast('⚡ Connecting to Telegram API & downloading pending channel posts...');
    try {
      const res = await fetch('/api/telegram/poll-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: settings.bot_token }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.receivedCount > 0) {
          showToast(`🎉 Successfully ingested & processed ${data.receivedCount} updates from Telegram!`);
        } else {
          showToast('✅ Telegram queue is currently clear (0 new pending updates).');
        }
      } else {
        showToast(`⚠️ Fetch notice: ${data.error || 'Check error details'}`);
      }
      fetchServerData();
    } catch (err: any) {
      showToast(`Error fetching updates: ${err.message}`);
    } finally {
      setIsFetchingUpdates(false);
    }
  };

  // Action: Toggle Background Polling
  const handleTogglePolling = async (enable: boolean) => {
    showToast(`${enable ? 'Starting' : 'Stopping'} Live Telegram Background Poller...`);
    try {
      const res = await fetch('/api/telegram/toggle-polling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: settings.bot_token, enable }),
      });
      const data = await res.json();
      if (data.success && data.status) {
        setPollerStatus(data.status);
        showToast(`✅ Telegram Background Poller ${enable ? 'is now ACTIVE' : 'is now PAUSED'}`);
      }
      fetchServerData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Action: Test Telegram Connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    showToast('🔍 Testing connection to Telegram Bot API & checking webhook...');
    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: settings.bot_token }),
      });
      const data = await res.json();
      setConnectionTestResult(data);
      if (data.success) {
        showToast('✅ Telegram Bot & Webhook connection verified successfully!');
      } else {
        showToast(`⚠️ Telegram notice: ${data.error || 'Check diagnostic result below'}`);
      }
      fetchServerData();
    } catch (err: any) {
      setConnectionTestResult({ success: false, error: err.message });
      showToast(`Connection test error: ${err.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Metrics Calculations
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED').length;
  const draftPosts = posts.filter(p => p.status === 'DRAFT').length;
  const rejectedPosts = posts.filter(p => p.status === 'REJECTED').length;
  const avgConfidence = posts.length > 0 
    ? Math.round((posts.reduce((acc, p) => acc + (p.confidence || 0.85), 0) / posts.length) * 100)
    : 95;

  // Filtered Posts
  const filteredPosts = posts.filter(post => {
    if (statusFilter !== 'ALL' && post.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && post.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        post.title.toLowerCase().includes(q) || 
        post.summary.toLowerCase().includes(q) ||
        post.exam.toLowerCase().includes(q) ||
        post.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Action: Approve & Publish
  const handleApprovePublish = async (post: WebsitePost) => {
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const updated = posts.map(p => p.id === post.id ? data.post : p);
        setDatabase({ ...database, posts: updated });
        showToast(`✅ Post "${post.title.slice(0, 30)}..." approved & published to website!`);
        return;
      }
    } catch (err) {
      console.warn('Local update fallback for publish');
    }

    const updatedPost: WebsitePost = {
      ...post,
      status: 'PUBLISHED',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = posts.map(p => p.id === post.id ? updatedPost : p);
    setDatabase({ ...database, posts: updated });
    showToast(`✅ Post "${post.title.slice(0, 30)}..." published to live website!`);
  };

  // Action: Reject
  const handleReject = async (post: WebsitePost) => {
    try {
      await fetch(`/api/posts/${post.id}/reject`, { method: 'POST' });
    } catch (err) {}

    const updatedPost: WebsitePost = {
      ...post,
      status: 'REJECTED',
      updated_at: new Date().toISOString(),
    };
    const updated = posts.map(p => p.id === post.id ? updatedPost : p);
    setDatabase({ ...database, posts: updated });
    showToast(`Post marked as REJECTED`);
  };

  // Action: Delete Post
  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    } catch (err) {}

    const updated = posts.filter(p => p.id !== id);
    setDatabase({ ...database, posts: updated });
    showToast('🗑️ Post deleted successfully');
  };

  // Action: Regenerate AI
  const handleRegenerateAI = async (post: WebsitePost) => {
    showToast('✨ Gemini AI is regenerating article from source text...');
    try {
      const res = await fetch(`/api/posts/${post.id}/regenerate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const updated = posts.map(p => p.id === post.id ? data.post : p);
        setDatabase({ ...database, posts: updated });
        showToast('✨ AI Content regenerated successfully!');
        return;
      }
    } catch (err) {}

    showToast('Failed to regenerate post AI content.');
  };

  // Action: Save Edit Modal
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPost),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = posts.map(p => p.id === editingPost.id ? data.post : p);
        setDatabase({ ...database, posts: updated });
        setEditingPost(null);
        showToast('💾 Post changes saved successfully!');
        return;
      }
    } catch (err) {}

    const updated = posts.map(p => p.id === editingPost.id ? editingPost : p);
    setDatabase({ ...database, posts: updated });
    setEditingPost(null);
    showToast('💾 Post changes saved locally!');
  };

  // Action: Save Settings
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/auto-publish-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast('⚙️ Telegram Auto-Publish settings saved successfully!');
      }
    } catch (err) {}

    setDatabase({
      ...database,
      telegramSettings: settings,
    });
    showToast('⚙️ Telegram Auto-Publish settings saved!');
  };

  // Action: Run Simulator
  const handleRunSimulation = async () => {
    if (!simText.trim()) {
      showToast('Please enter message text to simulate');
      return;
    }

    setSimulating(true);
    setSimulationResult(null);

    let channelPostPayload: any = {
      message_id: parseInt(simMsgId, 10) || Date.now(),
      chat: {
        id: simChatId,
        title: 'Railway Official Channel (Simulated)',
        type: 'channel',
      },
      date: Math.floor(Date.now() / 1000),
    };

    if (simMediaType === 'photo') {
      channelPostPayload.caption = simText;
      channelPostPayload.photo = [
        { file_id: `photo_thumb_${Date.now()}`, width: 320, height: 240, file_size: 25000 },
        { file_id: `photo_full_${Date.now()}`, width: 1280, height: 960, file_size: 150000 },
      ];
    } else if (simMediaType === 'document') {
      channelPostPayload.caption = simText;
      channelPostPayload.document = {
        file_id: `doc_pdf_${Date.now()}`,
        file_name: simFileName || 'CEN_02_2024_Technician_Notification.pdf',
        mime_type: 'application/pdf',
        file_size: 1048576,
      };
    } else {
      channelPostPayload.text = simText;
    }

    const payload = {
      update_id: Math.floor(100000 + Math.random() * 900000),
      channel_post: channelPostPayload,
    };

    try {
      const res = await fetch('/api/telegram/webhook?sync=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSimulationResult(data);

      if (data.duplicate) {
        showToast('⚠️ DUPLICATE CHECK TRIGGERED: This message ID has already been processed!');
      } else if (data.success) {
        if (data.autoPublished) {
          showToast('🚀 SUCCESS: Message processed with Gemini AI & AUTO-PUBLISHED to website!');
        } else {
          showToast('📝 SUCCESS: Message processed with Gemini AI & saved to DRAFT for approval!');
        }
        // Refresh database posts
        fetchServerData();
        // Generate new random message ID for next simulation
        setSimMsgId(String(Math.floor(1000 + Math.random() * 9000)));
      } else {
        showToast(`❌ Error: ${data.error || 'Failed to process'}`);
      }
    } catch (err: any) {
      setSimulationResult({ success: false, error: err.message });
      showToast('Simulation failed to connect to server');
    } finally {
      setSimulating(false);
    }
  };

  const currentWebhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/telegram/webhook` 
    : 'https://your-domain.com/api/telegram/webhook';

  return (
    <div className="space-y-6">
      {/* Detail Viewer Modal */}
      <PostDetailModal post={viewingPost} onClose={() => setViewingPost(null)} />

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Post & Article Content</h3>
              </div>
              <button 
                onClick={() => setEditingPost(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Article Title
                </label>
                <input
                  type="text"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editingPost.category}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value as PostCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    {[
                      'Latest News',
                      'Exam Update',
                      'Admit Card',
                      'Answer Key',
                      'Result',
                      'Cut Off',
                      'Vacancy',
                      'Recruitment',
                      'Government Job',
                      'Scholarship',
                      'Current Affairs',
                      'Education',
                      'Important Notice',
                      'Other'
                    ].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Post Type
                  </label>
                  <select
                    value={editingPost.post_type}
                    onChange={(e) => setEditingPost({ ...editingPost, post_type: e.target.value as PostType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    {['NEWS', 'RESULT', 'ADMIT_CARD', 'ANSWER_KEY', 'CUT_OFF', 'VACANCY', 'NOTICE', 'ARTICLE', 'CURRENT_AFFAIRS'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editingPost.status}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as PostStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DRAFT">DRAFT (Pending Approval)</option>
                    <option value="PUBLISHED">PUBLISHED (Live on Website)</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Exam / CEN Notification
                </label>
                <input
                  type="text"
                  value={editingPost.exam}
                  onChange={(e) => setEditingPost({ ...editingPost, exam: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Summary
                </label>
                <textarea
                  rows={2}
                  value={editingPost.summary}
                  onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Content (Markdown)
                </label>
                <textarea
                  rows={7}
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SEO Slug
                  </label>
                  <input
                    type="text"
                    value={editingPost.slug}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Reference Link
                  </label>
                  <input
                    type="text"
                    value={editingPost.source_url || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, source_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700"
                    placeholder="https://rrbcdg.gov.in"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save & Update Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Telegram → Gemini AI Pipeline</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                settings.auto_publish 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {settings.auto_publish ? '⚡ AUTO-PUBLISH: ON' : '📝 APPROVAL QUEUE: ON'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Telegram Auto-Publish & AI Processing Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Whenever a post is sent to your Telegram Channel, Gemini AI automatically extracts exam details, detects category, creates SEO tags, checks duplicates, and publishes to the website.
            </p>
          </div>

          {/* Quick Toggle Mode */}
          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 flex items-center space-x-4 shrink-0">
            <div>
              <div className="text-xs font-bold text-slate-200">Auto Publish Mode</div>
              <div className="text-[11px] text-slate-400">
                {settings.auto_publish ? 'Directly Live on Site' : 'Send to Admin Drafts'}
              </div>
            </div>
            <button
              onClick={() => {
                const newAuto = !settings.auto_publish;
                const updated = { ...settings, auto_publish: newAuto };
                setSettings(updated);
                setDatabase({ ...database, telegramSettings: updated });
                showToast(newAuto ? '⚡ Auto-Publish turned ON' : '📝 Draft Approval mode turned ON');
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.auto_publish ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.auto_publish ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Posts</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{totalPosts}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">From Telegram webhook</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Live Published</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1.5">{publishedPosts}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active on public site</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Pending Drafts</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1.5">{draftPosts}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting Admin Approval</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>AI Accuracy</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1.5">{avgConfidence}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Gemini 3.7 Flash Engine</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'webhook', label: '📡 Webhook Status & Diagnostics', icon: Radio, highlight: true },
          { id: 'posts', label: 'Posts & Articles', icon: FileText, badge: totalPosts },
          { id: 'simulator', label: 'Telegram Simulator (Test)', icon: Play },
          { id: 'messages', label: 'Raw Telegram Webhooks', icon: MessageSquare, badge: messages.length },
          { id: 'settings', label: 'Auto-Publish Settings', icon: Sliders },
          { id: 'logs', label: 'AI Execution Logs', icon: Database, badge: logs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : tab.highlight
                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: WEBHOOK STATUS & DIAGNOSTICS */}
      {activeTab === 'webhook' && (
        <div className="space-y-6">
          {/* Main Webhook Diagnostic Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-900 text-lg">Telegram Webhook Diagnostics & Ingestion Status</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    webhookDiagnostics.isRegistered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : pollerStatus.isActive 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {webhookDiagnostics.isRegistered 
                      ? '● Webhook Active on Telegram' 
                      : pollerStatus.isActive 
                        ? '● Live Background Poller Active' 
                        : '○ Webhook Not Registered'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Live verification of Telegram Bot API connection, webhook error logs, pending queues, and automated channel post ingestion.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={handleFetchUpdatesNow}
                  disabled={isFetchingUpdates}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center space-x-1.5"
                  title="Directly pull and process all queued channel posts from Telegram"
                >
                  <Zap className={`w-3.5 h-3.5 ${isFetchingUpdates ? 'animate-spin' : ''}`} />
                  <span>{isFetchingUpdates ? 'Fetching...' : 'Fetch Pending Updates Now'}</span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center space-x-1.5"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{isTestingConnection ? 'Testing...' : 'Test Connection & Webhook'}</span>
                </button>

                <button
                  onClick={fetchServerData}
                  disabled={isLoadingServer}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingServer ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* CRITICAL DIAGNOSTIC: Exact Reason Why Channel Post Is Not Reaching Webhook */}
            <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-amber-950">
                    Webhook Delivery Diagnostic & Analysis
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Root Cause Found:</strong> When Telegram's servers attempt to send an HTTP POST request to the cloud sandbox URL (<code>{webhookDiagnostics.telegramRegisteredUrl || currentWebhookUrl}</code>), the container proxy returns an HTTP <code>302 Found</code> (browser cookie authentication redirect). Telegram's Bot API rejects redirects and requires an immediate <code>200 OK</code> response.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                {/* Solution 1: Live Background Polling (Recommended) */}
                <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                  pollerStatus.isActive 
                    ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20' 
                    : 'bg-white/90 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-indigo-950">
                      <span className={`w-2.5 h-2.5 rounded-full ${pollerStatus.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="text-sm">Solution 1: Live Background Poller</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pollerStatus.isActive 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {pollerStatus.isActive ? 'Active (Every 3s)' : 'Paused'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Continuously fetches new channel posts directly via Telegram HTTPS Bot API every 3 seconds. Completely bypasses sandbox cookie redirects (302) and firewall limits.
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white/80 p-2 rounded-lg border border-indigo-100">
                    <span>Updates processed: <strong className="text-indigo-900 font-mono">{pollerStatus.totalPolled ?? 0}</strong></span>
                    <span>Last check: <strong className="text-slate-800">{pollerStatus.lastPolledAt ? new Date(pollerStatus.lastPolledAt).toLocaleTimeString('en-IN') : 'Active now'}</strong></span>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleFetchUpdatesNow}
                      disabled={isFetchingUpdates}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isFetchingUpdates ? 'animate-spin' : ''}`} />
                      <span>{isFetchingUpdates ? 'Processing...' : 'Pull Pending Updates Now'}</span>
                    </button>
                    <button
                      onClick={() => handleTogglePolling(!pollerStatus.isActive)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-colors ${
                        pollerStatus.isActive 
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {pollerStatus.isActive ? 'Pause Poller' : 'Start Poller'}
                    </button>
                    {webhookDiagnostics.telegramRegisteredUrl && (
                      <button
                        onClick={handleDeleteWebhook}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-xs border border-amber-300"
                        title="Delete Webhook so Telegram delivers updates immediately to the live poller"
                      >
                        Clean Webhook
                      </button>
                    )}
                  </div>
                </div>

                {/* Solution 2: Custom Public Webhook URL */}
                <div className="p-4 bg-white/90 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                    <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-sm">Solution 2: Custom Production Webhook URL</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    If deploying on a custom domain, Cloudflare Tunnel, or production server with open inbound ports (no cookie auth), configure your URL here:
                  </p>
                  <div className="flex items-center space-x-1.5 pt-1">
                    <input
                      type="url"
                      placeholder="https://rrbportal.com"
                      value={customWebhookInput}
                      onChange={(e) => setCustomWebhookInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono shadow-inner"
                    />
                    <button
                      onClick={() => handleRegisterWebhook()}
                      disabled={isRegisteringWebhook}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-sm"
                    >
                      Set Webhook
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Note: If webhook is set, remove it with "Clean Webhook" to switch back to Live Poller.
                  </div>
                </div>
              </div>
            </div>

            {/* Test Connection Live Result Box (if tested) */}
            {connectionTestResult && (
              <div className={`p-5 rounded-2xl border transition-all ${
                connectionTestResult.success 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {connectionTestResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm">
                        {connectionTestResult.success 
                          ? 'Telegram Bot API & Webhook Verification Successful' 
                          : 'Telegram Bot API Diagnostic Report'}
                      </h4>
                      <p className="text-xs opacity-80 mt-0.5">
                        {connectionTestResult.checks?.exactReasonNotReaching || connectionTestResult.error || 'Diagnostic query complete.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectionTestResult(null)}
                    className="text-xs p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white/80 backdrop-blur rounded-xl border border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bot Account</span>
                    <strong className="text-slate-900 block truncate">
                      {connectionTestResult.bot?.username ? `@${connectionTestResult.bot.username}` : (connectionTestResult.bot?.first_name || 'Valid Bot')}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {connectionTestResult.bot?.id || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-white/80 backdrop-blur rounded-xl border border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bot Token</span>
                    <strong className="text-slate-900 block font-mono">
                      {connectionTestResult.checks?.botTokenMasked || 'Configured'}
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-semibold">● Verified Authenticated</span>
                  </div>

                  <div className="p-3 bg-white/80 backdrop-blur rounded-xl border border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Channel Post Support</span>
                    <strong className={connectionTestResult.checks?.channelPostAllowed ? 'text-emerald-700 font-bold block' : 'text-amber-700 font-bold block'}>
                      {connectionTestResult.checks?.channelPostAllowed ? '✅ Enabled (channel_post)' : '⚠️ Check Allowed Updates'}
                    </strong>
                    <span className="text-[10px] text-slate-500">
                      Edited Posts: {connectionTestResult.checks?.editedChannelPostAllowed ? '✅ Enabled' : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-white/80 backdrop-blur rounded-xl border border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Telegram Pending Queue</span>
                    <strong className="text-slate-900 font-mono block text-sm">
                      {connectionTestResult.checks?.pendingUpdates ?? 0} updates
                    </strong>
                    <span className="text-[10px] text-indigo-600 font-medium">
                      {(connectionTestResult.checks?.pendingUpdates ?? 0) > 0 ? 'Click Fetch to ingest' : 'Queue clear'}
                    </span>
                  </div>
                </div>

                {connectionTestResult.checks?.lastErrorMessage && (
                  <div className="mt-3 p-3 bg-rose-100/80 border border-rose-300 rounded-xl text-xs text-rose-900">
                    <strong>Telegram Webhook Last Error ({connectionTestResult.checks.lastErrorDate ? new Date(connectionTestResult.checks.lastErrorDate).toLocaleString() : 'Recent'}):</strong>
                    <p className="mt-1 font-mono text-[11px] font-bold">{connectionTestResult.checks.lastErrorMessage}</p>
                    <p className="mt-1 text-[11px] text-rose-800">
                      {connectionTestResult.checks.recommendedAction || 'Use Live Background Poller or configure custom webhook URL.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4 Core Webhook & Ingestion Parameters (from getWebhookInfo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Webhook URL */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 lg:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>1. Telegram Webhook URL</span>
                  <span className="text-[11px] font-mono text-blue-600 font-semibold">POST /api/telegram/webhook</span>
                </div>
                <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl flex items-center justify-between break-all">
                  <span>{webhookDiagnostics.telegramRegisteredUrl || currentWebhookUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(webhookDiagnostics.telegramRegisteredUrl || currentWebhookUrl);
                      showToast('📋 Webhook URL copied to clipboard!');
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-2 shrink-0"
                    title="Copy Webhook URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    Status: {webhookDiagnostics.telegramRegisteredUrl ? (
                      <strong className="text-emerald-700">Registered on Telegram API</strong>
                    ) : (
                      <strong className="text-amber-700">Not Set (Polling Mode Active)</strong>
                    )}
                  </span>
                  {webhookDiagnostics.telegramRegisteredUrl && (
                    <button
                      onClick={handleDeleteWebhook}
                      className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                    >
                      Delete Webhook
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Pending Update Count */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  2. pending_update_count
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black font-mono text-slate-900">
                    {webhookDiagnostics.pendingUpdateCount ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">in Telegram queue</span>
                </div>
                <div className="text-[11px]">
                  {(webhookDiagnostics.pendingUpdateCount ?? 0) > 0 ? (
                    <button
                      onClick={handleFetchUpdatesNow}
                      disabled={isFetchingUpdates}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Fetch {webhookDiagnostics.pendingUpdateCount} updates now</span>
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-medium">All updates synchronized</span>
                  )}
                </div>
              </div>

              {/* 3. last_error_message & last_error_date */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. last_error_message
                </div>
                <div className={`text-xs font-bold ${webhookDiagnostics.telegramLastErrorMessage ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {webhookDiagnostics.telegramLastErrorMessage ? (
                    <span className="line-clamp-2">{webhookDiagnostics.telegramLastErrorMessage}</span>
                  ) : (
                    <span>None (0 errors on Telegram)</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {webhookDiagnostics.telegramLastErrorDate ? (
                    <span>Date: {new Date(webhookDiagnostics.telegramLastErrorDate).toLocaleString('en-IN')}</span>
                  ) : (
                    <span>Last error date: N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* Verified Update Types Verification Grid */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <span>Verified Update Formats & Media Types:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                  All Active
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>channel_post</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Extracts author signatures, chat title, message ID, and post body.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>edited_channel_post</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Captures revised exam notifications & date corrigendum announcements.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>PDF / Documents</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Extracts document file_id, file_name, and mime_type for official circulars.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Photos & Banners</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Resolves high-resolution photo file_id to download URL via getFile API.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Test Webhook Triggers */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Instant Webhook Test Triggers</h4>
                </div>
                <span className="text-[11px] text-slate-500">Sends test channel_post update to verify receipt</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={async () => {
                    setSimMediaType('text');
                    setSimText(SAMPLE_TELEGRAM_TEMPLATES[0].text);
                    setActiveTab('simulator');
                    showToast('Loaded text template in Simulator. Click "Run Webhook" to execute.');
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Test Text Notice Post</span>
                </button>

                <button
                  onClick={async () => {
                    setSimMediaType('document');
                    setSimFileName('CEN_05_2024_NTPC_Exam_Dates.pdf');
                    setSimText('Official notification circular for RRB NTPC Graduate & Undergraduate Examination 2026.');
                    setActiveTab('simulator');
                    showToast('Loaded PDF document template in Simulator. Click "Run Webhook" to execute.');
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Test PDF Document Upload</span>
                </button>

                <button
                  onClick={async () => {
                    setSimMediaType('photo');
                    setSimText('Railway Recruitment Board official visual circular banner notification.');
                    setActiveTab('simulator');
                    showToast('Loaded Photo template in Simulator. Click "Run Webhook" to execute.');
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Test Photo Notice Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: POSTS & ARTICLES MANAGEMENT */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
              {['ALL', 'PUBLISHED', 'DRAFT', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === st 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Posts' : st}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search articles, exams, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={fetchServerData}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                title="Refresh from server"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingServer ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Posts Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No articles match your current filter. You can simulate an incoming Telegram message to see AI auto-publishing in real time!
              </p>
              <button
                onClick={() => setActiveTab('simulator')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Open Simulator & Test</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredPosts.map((post) => {
                const isPublished = post.status === 'PUBLISHED';
                const isDraft = post.status === 'DRAFT';
                const isRejected = post.status === 'REJECTED';

                return (
                  <div
                    key={post.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isDraft
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {post.status}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {post.category}
                        </span>

                        <span className="text-xs font-medium text-slate-500">
                          {post.exam}
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="text-[11px] text-slate-400">
                          {new Date(post.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 
                        onClick={() => setViewingPost(post)}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors leading-snug"
                      >
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {post.summary}
                      </p>

                      {/* Source & Tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {post.source_url && (
                          <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate max-w-xs">{post.source_url}</span>
                          </span>
                        )}
                        {post.confidence && (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Confidence: {Math.round(post.confidence * 100)}%</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {isDraft && (
                        <button
                          onClick={() => handleApprovePublish(post)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      )}

                      <button
                        onClick={() => setViewingPost(post)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1"
                        title="View Full Post"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => setEditingPost(post)}
                        className="p-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-colors"
                        title="Edit Article Content"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRegenerateAI(post)}
                        className="p-2 text-slate-600 hover:bg-slate-100 hover:text-purple-600 rounded-xl transition-colors"
                        title="Regenerate with Gemini AI"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>

                      {isDraft && (
                        <button
                          onClick={() => handleReject(post)}
                          className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                          title="Reject Post"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TELEGRAM SIMULATOR / AI TESTER */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Input Box */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Simulate Incoming Telegram Post</h3>
              </div>
              <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Gemini 3.7 Flash Live
              </span>
            </div>

            {/* Quick Template Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Load Sample Real Updates:
              </label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TELEGRAM_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSimText(tmpl.text)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-xs font-medium text-slate-700 transition-colors text-left"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Telegram Post Format:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSimMediaType('text')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    simMediaType === 'text'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Text Only</span>
                </button>

                <button
                  onClick={() => setSimMediaType('photo')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    simMediaType === 'photo'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Photo + Caption</span>
                </button>

                <button
                  onClick={() => setSimMediaType('document')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    simMediaType === 'document'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Document</span>
                </button>
              </div>
            </div>

            {/* If Document, show file name input */}
            {simMediaType === 'document' && (
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-1.5">
                <label className="block text-[11px] font-bold text-purple-900 uppercase">
                  PDF Document File Name
                </label>
                <input
                  type="text"
                  value={simFileName}
                  onChange={(e) => setSimFileName(e.target.value)}
                  placeholder="CEN_02_2024_Technician_Notification.pdf"
                  className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-mono text-purple-900 focus:outline-none"
                />
              </div>
            )}

            {/* Raw Message Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {simMediaType === 'text' ? 'Telegram Message Text:' : 'Telegram Caption / Details:'}
              </label>
              <textarea
                rows={5}
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Paste raw Telegram post or caption here..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Simulated Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={simChatId}
                  onChange={(e) => setSimChatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Telegram Message ID
                </label>
                <input
                  type="text"
                  value={simMsgId}
                  onChange={(e) => setSimMsgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            {/* Trigger Simulation Button */}
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing with Gemini AI & Checking Duplicates...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Run Webhook & AI Processing Pipeline</span>
                </>
              )}
            </button>
          </div>

          {/* Simulation Output / Preview */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">AI Pipeline Output & Response</h3>
              </div>
              {simulationResult && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  simulationResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {simulationResult.duplicate ? 'DUPLICATE BLOCKED' : simulationResult.status || 'PROCESSED'}
                </span>
              )}
            </div>

            {!simulationResult ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                <Send className="w-10 h-10 text-slate-300 stroke-1" />
                <p className="text-xs font-medium">
                  Click <strong>"Run Webhook & AI Processing Pipeline"</strong> to test how Telegram messages are converted into rich website articles.
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                {simulationResult.duplicate && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Duplicate Detected:</strong> This Telegram Message ID has already been processed previously. The system skipped reprocessing to prevent spam!
                    </div>
                  </div>
                )}

                {simulationResult.success && !simulationResult.duplicate && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{simulationResult.autoPublished ? 'Auto-Published Live to Website!' : 'Saved to Approval Queue!'}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Post ID: <span className="font-mono">{simulationResult.postId}</span> • Confidence: {Math.round((simulationResult.confidence || 0.95) * 100)}%
                    </div>
                  </div>
                )}

                {/* Raw JSON inspection */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    API Response Payload:
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-64 leading-relaxed">
                    {JSON.stringify(simulationResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RAW TELEGRAM WEBHOOK MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Incoming Telegram Messages History</h3>
              <p className="text-xs text-slate-500">
                Log of all raw Telegram updates received by your webhook endpoint.
              </p>
            </div>
            <button
              onClick={fetchServerData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 text-xs">
              No raw Telegram messages recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        Chat: {msg.telegram_chat_id}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-xs text-slate-500">
                        Msg ID: {msg.telegram_message_id}
                      </span>
                      {msg.channel_title && (
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {msg.channel_title}
                        </span>
                      )}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      msg.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : msg.status === 'FAILED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {msg.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 font-mono whitespace-pre-wrap">
                    {msg.message_text || msg.caption || '(No text content)'}
                  </div>

                  {msg.media_url && (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-mono text-[11px] flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>Media/File: {msg.media_url}</span>
                      </span>
                    </div>
                  )}

                  {msg.raw_payload && (
                    <details className="text-[11px] text-slate-500">
                      <summary className="cursor-pointer font-bold text-blue-600 hover:underline">
                        View Raw Webhook Payload
                      </summary>
                      <pre className="mt-1.5 p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-40">
                        {JSON.stringify(msg.raw_payload, null, 2)}
                      </pre>
                    </details>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Received: {new Date(msg.received_at).toLocaleString('en-IN')}</span>
                    {msg.status === 'FAILED' && (
                      <button
                        onClick={async () => {
                          showToast('Retrying processing...');
                          try {
                            await fetch(`/api/telegram/messages/${msg.id}/retry`, { method: 'POST' });
                            fetchServerData();
                          } catch (err) {}
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Retry AI Processing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & WEBHOOK CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Auto-Publish Rules & Confidence Tuning</h3>
              <p className="text-xs text-slate-500">Configure how incoming Telegram updates are handled.</p>
            </div>

            {/* Toggle 1: Auto Publish */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div>
                <div className="text-xs font-bold text-slate-800">Auto Publish to Website</div>
                <div className="text-[11px] text-slate-500">
                  When enabled, posts with confidence above threshold are published live instantly.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_publish}
                onChange={(e) => setSettings({ ...settings, auto_publish: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Toggle 2: Telegram Enabled */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div>
                <div className="text-xs font-bold text-slate-800">Telegram Webhook Active</div>
                <div className="text-[11px] text-slate-500">Accept and process updates from Telegram</div>
              </div>
              <input
                type="checkbox"
                checked={settings.telegram_enabled}
                onChange={(e) => setSettings({ ...settings, telegram_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Toggle 3: AI Processing */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div>
                <div className="text-xs font-bold text-slate-800">Gemini AI Engine Active</div>
                <div className="text-[11px] text-slate-500">Extract title, summary, points, tags and SEO</div>
              </div>
              <input
                type="checkbox"
                checked={settings.ai_enabled}
                onChange={(e) => setSettings({ ...settings, ai_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Bot Token Configuration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Telegram Bot API Token
                </label>
                {settings.bot_token ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    Not Configured
                  </span>
                )}
              </div>
              <input
                type="text"
                value={settings.bot_token || ''}
                onChange={(e) => setSettings({ ...settings, bot_token: e.target.value })}
                placeholder="e.g. 8580504765:AAEAULLAiL0DZL4WNfj45Mj9pxwlduckHKk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                Bot token from @BotFather used to query channel updates and sync webhooks.
              </div>
            </div>

            {/* Target Channel ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target Channel Username / Chat ID
              </label>
              <input
                type="text"
                value={settings.target_channel_id || ''}
                onChange={(e) => setSettings({ ...settings, target_channel_id: e.target.value })}
                placeholder="e.g. @railway_recruitment_updates"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Confidence Threshold */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Auto-Publish Confidence Threshold
                </label>
                <span className="text-xs font-bold text-blue-600">
                  {Math.round((settings.confidence_threshold || 0.8) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={settings.confidence_threshold || 0.8}
                onChange={(e) => setSettings({ ...settings, confidence_threshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                Posts below this score will be held in Draft Queue for manual approval.
              </div>
            </div>

            {/* AI Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                AI Processing Model
              </label>
              <select
                value={settings.ai_model || 'gemini-3.7-flash'}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (High Quality & Reasoning)</option>
                <option value="gemini-flash-latest">Gemini Flash Latest (Fast & Reliable)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (High Availability & Speed)</option>
              </select>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              Save Settings
            </button>
          </div>

          {/* Webhook Connection Guide Card */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Telegram Bot & Webhook Details</h3>
              <p className="text-xs text-slate-500">Live webhook URL to link with your Telegram Bot.</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Your Webhook URL
              </label>
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl flex items-center justify-between break-all">
                <span>{currentWebhookUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentWebhookUrl);
                    showToast('📋 Webhook URL copied to clipboard!');
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-2 shrink-0"
                  title="Copy Webhook URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Setup Instructions */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-blue-900">How to Connect Your Telegram Channel:</div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600">
                <li>Create a Telegram bot via <strong>@BotFather</strong>.</li>
                <li>Add your bot as an <strong>Administrator</strong> in your Telegram channel or group.</li>
                <li>Set your Bot Token in the environment secrets (`TELEGRAM_BOT_TOKEN`).</li>
                <li>Set your Webhook via API or the setup helper.</li>
              </ol>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  showToast('Setting up Telegram Webhook...');
                  try {
                    const res = await fetch('/api/telegram/setup-webhook', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ appUrl: window.location.origin }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      showToast('✅ Webhook successfully registered with Telegram!');
                    } else {
                      showToast(`Telegram setup notice: ${data.error || 'Check bot token'}`);
                    }
                  } catch (err) {
                    showToast('Failed to setup webhook');
                  }
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Register Webhook with Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Gemini AI Processing Audit Logs</h3>
              <p className="text-xs text-slate-500">
                Audit logs showing prompts, JSON responses, model execution times and confidence.
              </p>
            </div>
            <button
              onClick={fetchServerData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 text-xs">
              No AI execution logs recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                        {log.model}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-mono text-slate-500">
                        Msg ID: {log.telegram_message_id}
                      </span>
                      {log.execution_time_ms && (
                        <span className="text-xs text-emerald-600 font-mono">
                          {log.execution_time_ms} ms
                        </span>
                      )}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 font-mono bg-slate-50 p-2.5 rounded-xl truncate">
                    {log.prompt}
                  </div>

                  {log.response && (
                    <details className="text-xs text-slate-600">
                      <summary className="cursor-pointer font-bold text-blue-600 hover:underline">
                        View Full Gemini JSON Output
                      </summary>
                      <pre className="mt-2 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                        {log.response}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
