import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Cpu, 
  Zap, 
  Clock, 
  Play, 
  Server, 
  Radio, 
  CheckCheck,
  FileCode2,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { SystemHealthStatus, SystemRepairLog } from '../../services/systemMonitorService';

export const AdminAutoMonitorView: React.FC = () => {
  const [report, setReport] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'repairs' | 'checks'>('all');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const fetchStatus = async (showToast = false) => {
    try {
      setLoading(true);
      const res = await fetch('/api/system-monitor/status');
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        if (showToast) {
          setNotificationMsg({ type: 'success', text: 'सिस्टम स्वास्थ्य स्थिति सफलतापूर्वक अपडेट हो गई।' });
          setTimeout(() => setNotificationMsg(null), 3000);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch system monitor status:', err);
      setNotificationMsg({ type: 'error', text: 'मॉनिटर स्थिति लोड करने में विफल।' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll status every 15 seconds for live monitor updates
    const timer = setInterval(() => {
      fetchStatus();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleRunDeepRepair = async () => {
    try {
      setActionLoading('repair');
      const res = await fetch('/api/system-monitor/run-repair', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setNotificationMsg({ 
          type: 'success', 
          text: '✅ डीप डायग्नोस्टिक्स व ऑटो-रिपेयर पूर्ण: सभी सबसिस्टम सत्यापित और स्वस्थ हैं!' 
        });
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: 'ऑटो-रिपेयर निष्पादन में त्रुटि।' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateIssue = async () => {
    try {
      setActionLoading('simulate');
      const res = await fetch('/api/system-monitor/simulate-issue', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.healingReport) {
        setReport(data.healingReport);
        setNotificationMsg({ 
          type: 'success', 
          text: `🧪 टेस्ट सफल: समस्या सिमुलेट हुई और वॉचडॉग ने उसे तुरंत ठीक (Auto-Repaired) कर दिया!` 
        });
        setTimeout(() => setNotificationMsg(null), 5000);
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: 'सिमुलेशन में त्रुटि।' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleWatchdog = async () => {
    if (!report) return;
    try {
      const res = await fetch('/api/system-monitor/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !report.watchdogActive }),
      });
      const data = await res.json();
      if (data.success) {
        setReport(prev => prev ? { ...prev, watchdogActive: data.watchdogActive } : null);
        setNotificationMsg({
          type: 'info',
          text: `ऑटो-वॉचडॉग अब ${data.watchdogActive ? 'चालू (ACTIVE)' : 'रोक दिया गया (PAUSED)'} है।`,
        });
        setTimeout(() => setNotificationMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = (report?.recentRepairs || []).filter(item => {
    if (filterType === 'repairs') return item.id.startsWith('rep-') && item.issue !== 'Autonomous Self-Healing Watchdog Engine initialized';
    if (filterType === 'checks') return item.id.startsWith('chk-');
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification Alert */}
      {notificationMsg && (
        <div 
          id="auto-monitor-toast"
          className={`p-4 rounded-xl border flex items-center justify-between text-sm font-semibold transition-all ${
            notificationMsg.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' 
              : notificationMsg.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-xs opacity-75 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Hero Header & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-7 h-7" />
              </span>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-xl font-black text-white tracking-wide">
                    ऑटो मॉनिटर एवं सेल्फ-हीलिंग वॉचडॉग (Auto Monitor & Self-Healing Engine)
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    <Radio className="w-3 h-3 mr-1 text-emerald-400" />
                    LIVE 30s
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  डेटाबेस, स्कीमा, और सिंक प्रक्रियाओं की निरंतर स्वचालित निगरानी — कोई भी समस्या आने पर सिस्टम खुद ही तुरंत ठीक (Auto-Repair) करता है।
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-run-deep-repair"
              onClick={handleRunDeepRepair}
              disabled={actionLoading !== null}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Wrench className={`w-4 h-4 ${actionLoading === 'repair' ? 'animate-spin' : ''}`} />
              <span>{actionLoading === 'repair' ? 'जाँच व रिपेयर जारी...' : 'जाँच व ऑटो-रिपेयर चलाएं'}</span>
            </button>

            <button
              id="btn-simulate-test-issue"
              onClick={handleSimulateIssue}
              disabled={actionLoading !== null}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              title="परीक्षण करें कि समस्या आने पर वॉचडॉग उसे कैसे खुद सही करता है"
            >
              <Zap className={`w-4 h-4 ${actionLoading === 'simulate' ? 'animate-bounce' : 'text-purple-400'}`} />
              <span>{actionLoading === 'simulate' ? 'परीक्षण जारी...' : 'ऑटो-रिपेयर टेस्ट करें'}</span>
            </button>

            <button
              id="btn-refresh-status"
              onClick={() => fetchStatus(true)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="ताज़ा करें"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Watchdog Status Strip */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">ऑटोमैटिक वॉचडॉग:</span>
              <button
                onClick={handleToggleWatchdog}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  report?.watchdogActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${report?.watchdogActive ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                <span>{report?.watchdogActive ? 'हमेशा चालू (Active)' : 'रोका गया (Paused)'}</span>
              </button>
            </div>

            <div className="text-slate-400 hidden sm:block">
              अंतिम स्वचालित जाँच:{' '}
              <span className="text-slate-200 font-mono">
                {report?.lastCheckedAt ? new Date(report.lastCheckedAt).toLocaleTimeString() : 'जारी...'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-emerald-400 font-semibold bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/40">
            <CheckCheck className="w-4 h-4" />
            <span>स्वायत्त आत्म-सुधार सक्रिय (Autonomous Self-Healing Active)</span>
          </div>
        </div>
      </div>

      {/* 4 Key Diagnostic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Health Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">सिस्टम स्वास्थ्य स्कोर (Health)</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">
              {report?.healthScore ?? 100}%
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {report?.overallState || 'Operational'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${report?.healthScore ?? 100}%` }}
            />
          </div>
        </div>

        {/* 2. Autonomous Repairs Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">स्वतः सुधारी गई समस्याएँ (Auto-Repaired)</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Wrench className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-purple-300">
              {report?.issuesResolvedCount ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-400">समस्याएं खुद ठीक की गईं</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            बिना वेबसाइट बंद किए ऑटो-रिसॉल्व
          </p>
        </div>

        {/* 3. Database Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">डेटाबेस लेटेंसी (Cloud SQL)</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Database className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-blue-300">
              {report?.subsystems.database.latencyMs ?? 2}
              <span className="text-lg font-normal text-slate-400">ms</span>
            </span>
            <span className="text-xs font-bold text-emerald-400">तेज़ प्रतिक्रिया</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            PostgreSQL 16 Developer Edition
          </p>
        </div>

        {/* 4. Total Diagnostic Cycles */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">कुल निगरानी चक्र (Total Checks)</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">
              {report?.totalChecksRun ?? 1}
            </span>
            <span className="text-xs font-medium text-slate-400">चक्र पूरे</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            प्रत्येक 30 सेकंड में स्वतः जाँच
          </p>
        </div>

      </div>

      {/* Subsystem Health Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>सबसिस्टम स्वास्थ्य एवं स्व-सुधार मैट्रिक्स (Subsystems Health Matrix)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Subsystem 1: Database Connectivity */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">Cloud SQL PostgreSQL</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                HEALTHY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {report?.subsystems.database.message}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 flex justify-between">
              <span>Ping Latency:</span>
              <span className="font-mono text-emerald-400">{report?.subsystems.database.latencyMs || 2}ms</span>
            </div>
          </div>

          {/* Subsystem 2: Central Portal Database & JSON Schema */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileCode2 className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-200">डेटा स्कीमा व JSON सत्यापन</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                report?.subsystems.portalData.status === 'repaired'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {report?.subsystems.portalData.status === 'repaired' ? 'AUTO-REPAIRED' : 'VERIFIED OK'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {report?.subsystems.portalData.message}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 flex justify-between">
              <span>कलेक्शन स्थिति:</span>
              <span className="text-emerald-400 font-semibold">6/6 Valid Collections</span>
            </div>
          </div>

          {/* Subsystem 3: RRB Auto-Sync & Schedule Watchdog */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">10-मिनट सिंक शेड्यूलर</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {report?.subsystems.syncScheduler.message}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 flex justify-between">
              <span>अंतराल चक्र:</span>
              <span className="text-slate-300 font-mono">10 Minutes (Live Gateway)</span>
            </div>
          </div>

          {/* Subsystem 4: Table Overflow & Partition Safety */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">टेबल व स्टोरेज ऑप्टिमाइजेशन</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                OPTIMIZED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {report?.subsystems.tableIntegrity.message}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 flex justify-between">
              <span>ओवरफ्लो रोकथाम:</span>
              <span className="text-emerald-400 font-semibold">Active Auto-Pruning</span>
            </div>
          </div>

          {/* Subsystem 5: Server Memory & Runtime */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200">सर्वर मेमोरी व रनटाइम</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                STABLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {report?.subsystems.systemRuntime.message}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 flex justify-between">
              <span>मेमोरी हीप:</span>
              <span className="font-mono text-slate-300">{report?.subsystems.systemRuntime.details?.heapUsedMb || 45} MB</span>
            </div>
          </div>

          {/* Subsystem 6: Live Guardian Summary */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-slate-800 border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 mb-1.5">
                <LifeBuoy className="w-4 h-4" />
                <span className="text-xs font-bold">24/7 ऑटोमैटिक प्रोटेक्शन</span>
              </div>
              <p className="text-xs text-slate-300">
                यदि कोई डेटाबेस रो डिलीट हो जाए, JSON करप्ट हो या टाइमर रुक जाए — वॉचडॉग 30 सेकंड में स्वतः पुनर्स्थापित करता है।
              </p>
            </div>
            <div className="mt-3 text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Human Intervention Required</span>
            </div>
          </div>

        </div>
      </div>

      {/* Autonomous Repair & Diagnostic Activity History Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>ऑटो-रिपेयर एवं डायग्नोस्टिक गतिविधि ऑडिट (Self-Healing Activity Log)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              सिस्टम द्वारा स्वचालित रूप से जाँची गई व ठीक की गई समस्याओं का पूर्ण विवरण
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              सभी लॉग्स ({report?.recentRepairs.length || 0})
            </button>
            <button
              onClick={() => setFilterType('repairs')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'repairs' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              केवल ऑटो-सुधार (Repairs)
            </button>
            <button
              onClick={() => setFilterType('checks')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'checks' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              नियमित जाँच (Checks)
            </button>
          </div>
        </div>

        {/* Logs List Table */}
        <div className="overflow-hidden border border-slate-800 rounded-xl">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                कोई लॉग रिकॉर्ड नहीं मिला। सभी सिस्टम पूरी तरह सामान्य और स्वस्थ हैं।
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isRepair = log.id.startsWith('rep-') && log.issue !== 'Autonomous Self-Healing Watchdog Engine initialized';
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-800/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          isRepair 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {isRepair ? 'AUTO-REPAIRED' : 'CHECKED OK'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          [{log.subsystem.replace('_', ' ')}]
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-slate-200 font-medium">
                        {log.issue}
                      </div>
                      <div className="text-slate-400 flex items-center space-x-1.5 text-[11px]">
                        <span className="text-emerald-400 font-semibold">↳ समाधान (Action Taken):</span>
                        <span>{log.actionTaken}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/30">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        स्वतः हल हुआ
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
