import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  ShieldCheck, 
  Play, 
  ArrowUpRight, 
  ExternalLink, 
  Server, 
  Activity, 
  Check, 
  FileText, 
  Filter, 
  Search, 
  Calendar, 
  Eye, 
  UploadCloud, 
  XCircle, 
  Edit3, 
  Zap, 
  Sliders, 
  ShieldAlert, 
  Layers,
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';
import { FullRRBDatabase } from '../../types';

interface AdminAutoUpdateViewProps {
  database: FullRRBDatabase;
  onSuccessMessage: (msg: string) => void;
  setDatabase?: (db: FullRRBDatabase) => void;
}

interface SyncItem {
  id: number;
  title: string;
  cenNumber?: string | null;
  examName?: string | null;
  category: string;
  zoneCode?: string | null;
  publishDate?: string | null;
  description?: string | null;
  officialSourceUrl?: string | null;
  officialPdfUrl?: string | null;
  officialLinks?: string | null;
  status: 'pending_review' | 'published' | 'rejected';
  confidence: 'high' | 'low';
  source: string;
  importedAt: string;
  publishedAt?: string | null;
}

interface SyncLog {
  id: number;
  action: string;
  details: string;
  sourceUrl?: string | null;
  recordId?: string | null;
  status: string;
  createdAt: string;
}

interface SyncStats {
  total: number;
  published: number;
  pendingReview: number;
  rejected: number;
  autoSyncEnabled: boolean;
  autoPublishEnabled: boolean;
  intervalMinutes: number;
  intervalSeconds?: number;
  lastSyncAt?: string | null;
  nextSyncAt?: string | null;
}

export const AdminAutoUpdateView: React.FC<AdminAutoUpdateViewProps> = ({ 
  database, 
  onSuccessMessage,
  setDatabase 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<SyncStats>({
    total: 0,
    published: 0,
    pendingReview: 0,
    rejected: 0,
    autoSyncEnabled: true,
    autoPublishEnabled: true,
    intervalMinutes: 10,
    lastSyncAt: null,
    nextSyncAt: null,
  });

  const [items, setItems] = useState<SyncItem[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SyncItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    cenNumber: '',
    examName: '',
    category: 'notice',
    zoneCode: 'ALL',
    publishDate: '',
    description: '',
    officialPdfUrl: '',
  });

  // Action Loading States
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Fetch Sync Status & Summary Stats
  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/rrb-sync/status');
      const data = await res.json();
      if (data.success) {
        setStats({
          total: data.total,
          published: data.published,
          pendingReview: data.pendingReview,
          rejected: data.rejected,
          autoSyncEnabled: data.autoSyncEnabled,
          autoPublishEnabled: data.autoPublishEnabled,
          intervalMinutes: data.intervalMinutes ?? 10,
          lastSyncAt: data.lastSyncAt,
          nextSyncAt: data.nextSyncAt,
        });
      }
    } catch (err) {
      console.warn('Could not fetch sync status:', err);
    }
  };

  // Fetch Synced Items
  const fetchSyncItems = async () => {
    setIsLoadingItems(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`/api/rrb-sync/items?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.warn('Could not fetch sync items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Fetch Sync Logs
  const fetchSyncLogs = async () => {
    try {
      const res = await fetch('/api/rrb-sync/logs?limit=40');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.warn('Could not fetch sync logs:', err);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    fetchSyncItems();
    fetchSyncLogs();

    // Periodic status refresh
    const interval = setInterval(() => {
      fetchSyncStatus();
      fetchSyncLogs();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchSyncItems();
  }, [categoryFilter, statusFilter, searchQuery, dateFilter]);

  // Handle Trigger Immediate Sync
  const handleTriggerSync = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/rrb-sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.success) {
        onSuccessMessage(data.result?.message || 'Official RRB synchronization completed successfully!');
        await Promise.all([fetchSyncStatus(), fetchSyncItems(), fetchSyncLogs()]);
      } else {
        alert(data.error || 'Sync routine encounter an issue.');
      }
    } catch (err: any) {
      alert('Error triggering sync: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle Auto-Sync Setting
  const handleToggleAutoSync = async () => {
    const newStatus = !stats.autoSyncEnabled;
    try {
      const res = await fetch('/api/rrb-sync/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSyncEnabled: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(prev => ({ ...prev, autoSyncEnabled: newStatus }));
        onSuccessMessage(newStatus ? '🟢 Official RRB Auto-Sync Enabled' : '🔴 Official RRB Auto-Sync Paused');
      }
    } catch (err) {
      alert('Failed to update auto-sync setting');
    }
  };

  // Toggle Auto-Publish Setting
  const handleToggleAutoPublish = async () => {
    const newStatus = !stats.autoPublishEnabled;
    try {
      const res = await fetch('/api/rrb-sync/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPublishEnabled: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(prev => ({ ...prev, autoPublishEnabled: newStatus }));
        onSuccessMessage(newStatus ? '⚡ High-Confidence Auto-Publish Enabled' : '🛑 Auto-Publish Paused (Review Queue Required)');
      }
    } catch (err) {
      alert('Failed to update auto-publish setting');
    }
  };

  // Publish Individual Item
  const handlePublishItem = async (item: SyncItem) => {
    setActionLoadingId(item.id);
    try {
      const res = await fetch(`/api/rrb-sync/publish/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        onSuccessMessage(`"${item.title}" successfully published to Public Portal!`);
        await Promise.all([fetchSyncStatus(), fetchSyncItems(), fetchSyncLogs()]);
      } else {
        alert(data.error || 'Failed to publish item');
      }
    } catch (err: any) {
      alert('Error publishing item: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Item
  const handleRejectItem = async (item: SyncItem) => {
    if (!confirm(`Are you sure you want to dismiss/reject "${item.title}"?`)) return;

    setActionLoadingId(item.id);
    try {
      const res = await fetch(`/api/rrb-sync/reject/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        onSuccessMessage(`Item rejected from live publish queue.`);
        await Promise.all([fetchSyncStatus(), fetchSyncItems(), fetchSyncLogs()]);
      } else {
        alert(data.error || 'Failed to reject item');
      }
    } catch (err: any) {
      alert('Error rejecting item: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: SyncItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      cenNumber: item.cenNumber || '',
      examName: item.examName || '',
      category: item.category || 'notice',
      zoneCode: item.zoneCode || 'ALL',
      publishDate: item.publishDate || '',
      description: item.description || '',
      officialPdfUrl: item.officialPdfUrl || '',
    });
  };

  // Save Edit Item
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/rrb-sync/edit/${editingItem.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        onSuccessMessage('Item metadata updated successfully.');
        setEditingItem(null);
        await fetchSyncItems();
      } else {
        alert(data.error || 'Failed to update item');
      }
    } catch (err: any) {
      alert('Error updating item: ' + err.message);
    }
  };

  const formatIndianDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[monthIndex] || parts[1]} ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string, confidence: string) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>PUBLISHED</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          <span>REJECTED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span>NEEDS REVIEW</span>
      </span>
    );
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'cen': return 'CEN / Recruitment';
      case 'exam_schedule': return 'Exam Schedule & City Intimation';
      case 'answer_key': return 'Answer Key & Objection';
      case 'result': return 'Result & Merit List';
      case 'cutoff': return 'Cut-Off Marks';
      case 'notice': return 'Important Notice';
      default: return 'Other RRB Update';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <span>Official RRB Auto Sync & Auto Publish Engine</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                  PRODUCTION READY
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized Public-Page Fetcher & Intelligent Categorizer for <a href="https://rrb.indianrailways.gov.in/" target="_blank" rel="noreferrer" className="text-red-600 font-bold hover:underline inline-flex items-center space-x-0.5"><span>https://rrb.indianrailways.gov.in/</span><ExternalLink className="w-2.5 h-2.5 inline" /></a>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleTriggerSync}
            disabled={isScanning}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 cursor-pointer transition-all active:scale-95"
          >
            <Play className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Syncing Official Gateway...' : 'Sync Now (Official Crawl)'}</span>
          </button>
        </div>
      </div>

      {/* Control & Live Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gateway Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Apex Gateway Source</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              VERIFIED HTTPS
            </span>
          </div>

          <div>
            <div className="font-mono text-sm text-amber-300 truncate font-bold">https://rrb.indianrailways.gov.in/</div>
            <div className="text-[11px] text-slate-400 mt-1">Railway Recruitment Control Board (21 Regional Boards)</div>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Last Synced</span>
              <span className="font-bold text-slate-200">
                {stats.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Ready for Sync'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Next Cycle</span>
              <span className="font-bold text-slate-200">
                {stats.nextSyncAt ? new Date(stats.nextSyncAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Every 10m'}
              </span>
            </div>
          </div>
        </div>

        {/* Auto Sync Toggle Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">Background Sync Engine</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stats.autoSyncEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {stats.autoSyncEnabled ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-600">
              Periodically checks official RRB portal every <strong>{stats.intervalMinutes || 10} minutes</strong> without user friction.
            </p>
          </div>

          <button
            onClick={handleToggleAutoSync}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              stats.autoSyncEnabled
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span>{stats.autoSyncEnabled ? '⏸️ Pause Auto-Sync' : '▶️ Enable Auto-Sync'}</span>
          </button>
        </div>

        {/* Auto Publish Toggle Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-900">High-Confidence Auto-Publish</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stats.autoPublishEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {stats.autoPublishEnabled ? 'AUTO ON' : 'MANUAL APPROVAL'}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-600">
              High-confidence official records go live automatically. Ambiguous notices are queued in <strong>Needs Review</strong>.
            </p>
          </div>

          <button
            onClick={handleToggleAutoPublish}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              stats.autoPublishEnabled
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <span>{stats.autoPublishEnabled ? '🔒 Require Manual Approval' : '⚡ Enable Auto-Publish'}</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Synced Records</span>
          <span className="text-2xl font-black text-slate-900">{stats.total}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Published to Live Portal</span>
          <span className="text-2xl font-black text-emerald-700">{stats.published}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 block">Needs Review Queue</span>
          <span className="text-2xl font-black text-amber-800">{stats.pendingReview}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Rejected / Dismissed</span>
          <span className="text-2xl font-black text-slate-600">{stats.rejected}</span>
        </div>
      </div>

      {/* Main Review & Management Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </span>
            {['all', 'notice', 'cen', 'exam_schedule', 'answer_key', 'result', 'cutoff'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat === 'all' ? 'All Updates' : getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending_review">Needs Review ({stats.pendingReview})</option>
              <option value="published">Published ({stats.published})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search CEN, title, exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 w-44 md:w-60 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>
        </div>

        {/* Synced Items Table / Cards */}
        {isLoadingItems ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            <span>Loading synchronized items...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No synced items found for this filter</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click "Sync Now" above to crawl and fetch real-time notices directly from https://rrb.indianrailways.gov.in/.
            </p>
            <button
              onClick={handleTriggerSync}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 cursor-pointer"
            >
              Trigger Sync Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.status === 'pending_review'
                    ? 'border-amber-300 bg-amber-50/30'
                    : item.status === 'published'
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-slate-200 bg-slate-50 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(item.status, item.confidence)}

                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                        {getCategoryLabel(item.category)}
                      </span>

                      {item.cenNumber && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-[10px] font-bold border border-blue-200">
                          {item.cenNumber}
                        </span>
                      )}

                      {item.examName && (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                          {item.examName}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{formatIndianDate(item.publishDate)}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      {item.officialSourceUrl && (
                        <a
                          href={item.officialSourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center space-x-1"
                        >
                          <span>Source Gateway Page</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}

                      {item.officialPdfUrl && (
                        <a
                          href={item.officialPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-600 hover:underline font-bold flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Official PDF Attachment</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {item.officialPdfUrl && (
                      <a
                        href={item.officialPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center space-x-1 border border-red-200 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Open PDF</span>
                      </a>
                    )}

                    {item.status !== 'published' && (
                      <button
                        onClick={() => handlePublishItem(item)}
                        disabled={actionLoadingId === item.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === item.id ? 'Publishing...' : 'Publish to Portal'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(item)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {item.status !== 'rejected' && (
                      <button
                        onClick={() => handleRejectItem(item)}
                        disabled={actionLoadingId === item.id}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Quick Mapping Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-red-600" />
                <span>Edit Synchronized Notice & Mapping</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notice Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CEN Number</label>
                  <input
                    type="text"
                    value={editForm.cenNumber}
                    placeholder="e.g. CEN 05/2024"
                    onChange={(e) => setEditForm(prev => ({ ...prev, cenNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Exam Name</label>
                  <input
                    type="text"
                    value={editForm.examName}
                    placeholder="e.g. RRB NTPC"
                    onChange={(e) => setEditForm(prev => ({ ...prev, examName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Section / Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="notice">Important Notice</option>
                    <option value="exam_schedule">Exam Schedule & City Intimation</option>
                    <option value="answer_key">Answer Key & Objection</option>
                    <option value="result">Result & Merit List</option>
                    <option value="cutoff">Cut-Off Marks</option>
                    <option value="cen">CEN / Recruitment</option>
                    <option value="other">Other Updates</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Publication Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={editForm.publishDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, publishDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official PDF Download URL</label>
                <input
                  type="text"
                  value={editForm.officialPdfUrl}
                  placeholder="https://rrb.indianrailways.gov.in/notices/..."
                  onChange={(e) => setEditForm(prev => ({ ...prev, officialPdfUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Summary / Instructions</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Audit & Sync Logs Stream */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-200">Live Crawl & Synchronization Event Stream</span>
          </div>
          <button
            onClick={fetchSyncLogs}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pt-1 text-slate-300">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-4">No audit logs recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="leading-relaxed flex items-start space-x-2 text-[11px]">
                <span className="text-slate-500 shrink-0">
                  [{new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                </span>
                <span className={`font-bold shrink-0 ${
                  log.action === 'item_published' ? 'text-emerald-400' :
                  log.action === 'item_discovered' ? 'text-amber-400' :
                  log.action === 'error' ? 'text-rose-400' : 'text-blue-400'
                }`}>
                  [{log.action.toUpperCase()}]
                </span>
                <span className="text-slate-300">{log.details}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
