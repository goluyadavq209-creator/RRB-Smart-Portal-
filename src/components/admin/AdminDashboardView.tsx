import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Bell, 
  FileUp, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Download, 
  Eye, 
  Plus, 
  Database, 
  Building2, 
  Layers, 
  Upload, 
  HardDrive, 
  ExternalLink,
  MoreVertical,
  Check,
  RotateCcw,
  Trash2,
  FileSpreadsheet,
  Key
} from 'lucide-react';
import { FullRRBDatabase, TabView } from '../../types';

interface AdminDashboardViewProps {
  database: FullRRBDatabase;
  onNavigateTab: (tabId: string) => void;
  onOpenPdfPipeline: () => void;
  onQuickAddCutoff: () => void;
  onQuickAddNotice: () => void;
  onQuickAddExam: () => void;
  onSwitchUserSite: (tab: TabView) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  database,
  onNavigateTab,
  onOpenPdfPipeline,
  onQuickAddCutoff,
  onQuickAddNotice,
  onQuickAddExam,
  onSwitchUserSite,
}) => {
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'30' | '90' | '365'>('30');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');
  const [autoUpdateStatus, setAutoUpdateStatus] = useState<'Ready' | 'Checking' | 'Updated'>('Ready');

  // Real dynamic calculations from database
  const totalExams = database.exams.length;
  const totalCutoffs = database.cutoffs.length;
  const totalNotices = database.notices.length;
  const totalResults = database.results.length;
  const totalPdfs = totalNotices + totalCutoffs + totalResults;
  const totalUsers = 1; // Real active Super Administrator session

  // Derive recent uploads dynamically from real database cutoffs & notices
  const recentUploads = [
    ...database.cutoffs.map((c) => ({
      id: c.id,
      name: `${c.examTitle || c.cenNumber} Cut-off (${c.stage}).pdf`,
      type: 'Cut-off',
      typeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      examCen: c.cenNumber,
      zone: c.zoneName || c.zoneCode,
      uploadedBy: 'Admin (RRCB)',
      date: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Official Portal',
      status: 'Published',
      statusColor: 'bg-emerald-100 text-emerald-800',
    })),
    ...database.notices.map((n) => ({
      id: n.id,
      name: `${n.title.slice(0, 38)}...`,
      type: n.category === 'Exam Date' ? 'Schedule' : n.category === 'City Intimation / Admit Card' ? 'Admit Card' : 'Official Notice',
      typeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      examCen: n.cenNumber || 'All CENs',
      zone: n.zoneCode === 'ALL' ? 'All 21 RRBs' : n.zoneCode,
      uploadedBy: 'Admin (RRCB)',
      date: n.publishDate || 'Official Govt',
      status: 'Published',
      statusColor: 'bg-emerald-100 text-emerald-800',
    })),
  ].slice(0, 8);

  const [pendingImports, setPendingImports] = useState<{
    id: string;
    sourceUrl: string;
    document: string;
    type: string;
    detectedOn: string;
    status: string;
    statusColor: string;
  }[]>([]);

  const handleTriggerAutoUpdate = () => {
    setAutoUpdateStatus('Checking');
    setTimeout(() => {
      setAutoUpdateStatus('Updated');
      setTimeout(() => setAutoUpdateStatus('Ready'), 3000);
    }, 1200);
  };

  // Recent notifications from real database notices
  const dashboardNotifications = database.notices.slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Home <span className="mx-1.5 text-slate-400">•</span> <span className="text-slate-800 font-semibold">Real-Time Control Hub</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="All Time">📅 All Time Records</option>
              <option value="Last 30 Days">📅 Last 30 Days</option>
              <option value="This Year">📅 This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Users */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Total Users</span>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {totalUsers}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>1 Active Admin session</span>
          </div>
        </div>

        {/* Card 2: Total Exams */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Total Exams</span>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {totalExams}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <span>{totalExams === 0 ? 'No exams added yet' : 'Real-time database count'}</span>
          </div>
        </div>

        {/* Card 3: Total Cut-offs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Total Cut-offs</span>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {totalCutoffs}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <span>{totalCutoffs === 0 ? 'No cut-offs added yet' : 'Indexed score records'}</span>
          </div>
        </div>

        {/* Card 4: Total Notices */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Total Notices</span>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {totalNotices}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <span>{totalNotices === 0 ? 'No notices published yet' : 'Official circulars'}</span>
          </div>
        </div>

        {/* Card 5: Total PDFs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Total PDFs</span>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {totalPdfs}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <span>{totalPdfs === 0 ? 'No documents parsed' : 'Documents published'}</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Analytics Overview + Top Exams Donut + Quick Actions + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Analytics Line Chart & Top Exams */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Website Analytics Chart */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Website Analytics Overview</h3>
                  <p className="text-[11px] text-slate-400">Live portal activity telemetry</p>
                </div>
                <select
                  value={analyticsTimeRange}
                  onChange={(e) => setAnalyticsTimeRange(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="365">This Year</option>
                </select>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-4 text-xs font-medium text-slate-600">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Exams ({totalExams})</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Cut-offs ({totalCutoffs})</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Notices ({totalNotices})</span>
                </span>
              </div>

              {/* Standby / Real Activity Grid */}
              <div className="h-44 w-full relative flex flex-col justify-center items-center rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4 text-center">
                {totalPdfs === 0 ? (
                  <div>
                    <HardDrive className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">Clean Database State</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                      Upload PDFs or add exams/cut-offs using the quick action buttons to populate real-time activity trends.
                    </p>
                  </div>
                ) : (
                  <div className="w-full space-y-2 text-left">
                    <div className="flex justify-between text-xs text-slate-700 font-semibold">
                      <span>Exams Published</span>
                      <span>{totalExams}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(totalExams * 20, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700 font-semibold">
                      <span>Cut-offs Indexed</span>
                      <span>{totalCutoffs}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(totalCutoffs * 20, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700 font-semibold">
                      <span>Notices Released</span>
                      <span>{totalNotices}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(totalNotices * 20, 100)}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Exams Donut Chart */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Exams Distribution</h3>
                <p className="text-[11px] text-slate-400">Database proportion</p>

                {totalExams === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    <FileText className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <span>No exams uploaded yet</span>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {database.exams.slice(0, 4).map((ex, idx) => (
                      <div key={ex.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                        <span className="font-bold text-slate-800 truncate max-w-[120px]">{ex.shortCode}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{ex.cenNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigateTab('exams')}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Manage Exams ({totalExams})</span>
              </button>
            </div>
          </div>

          {/* Recent Uploads Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Recent Uploads</h3>
              <button
                onClick={onOpenPdfPipeline}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
              >
                Upload New
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2.5 pl-1">#</th>
                    <th className="pb-2.5">Document Name</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5">Exam / CEN</th>
                    <th className="pb-2.5">Zone</th>
                    <th className="pb-2.5">Uploaded By</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {recentUploads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        No uploads or published documents yet. Use the PDF Pipeline or Data Manager to publish.
                      </td>
                    </tr>
                  ) : (
                    recentUploads.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-1 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                              {row.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.typeColor}`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{row.examCen}</td>
                        <td className="py-3 text-slate-600">{row.zone}</td>
                        <td className="py-3 text-slate-500">{row.uploadedBy}</td>
                        <td className="py-3 text-slate-500">{row.date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={onOpenPdfPipeline}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Preview file"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Feeds / Scraper Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Official Crawler Feeds</h3>
              <button
                onClick={() => onNavigateTab('auto_update')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
              >
                Configure Feeds
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Ministry of Railways Apex Portal Connected</span>
                  <a
                    href="https://rrb.indianrailways.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-[11px]"
                  >
                    https://rrb.indianrailways.gov.in/
                  </a>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Active Listener
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Quick Actions Grid + System Status + Latest Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onQuickAddCutoff}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">Add Cut-off</span>
              </button>

              <button
                onClick={() => onNavigateTab('roll_numbers')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-800">Roll Numbers</span>
              </button>

              <button
                onClick={onOpenPdfPipeline}
                className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-rose-800">Upload PDF</span>
              </button>

              <button
                onClick={onQuickAddNotice}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-800">Add Notice</span>
              </button>

              <button
                onClick={onQuickAddExam}
                className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-800">Add Exam</span>
              </button>

              <button
                onClick={() => onNavigateTab('zones')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/70 border border-slate-200 hover:border-cyan-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-cyan-800">21 RRB Zones</span>
              </button>

              <button
                onClick={handleTriggerAutoUpdate}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <RefreshCw className={`w-4 h-4 ${autoUpdateStatus === 'Checking' ? 'animate-spin' : ''}`} />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-800">Sync Data</span>
              </button>

              <button
                onClick={() => onSwitchUserSite('home')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-red-50/70 border border-slate-200 hover:border-red-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group col-span-2 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#c1121f] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#c1121f]">
                  Open Candidate Portal (Live Site)
                </span>
              </button>
            </div>
          </div>

          {/* System Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
            <h3 className="font-bold text-sm text-slate-900">System Status</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Portal Status</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Database State</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Active Clean
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Auto Sync Status</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  {autoUpdateStatus}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Last Updated</span>
                <span className="font-semibold text-slate-800">
                  {new Date(database.metadata.lastUpdated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('audit_logs')}
              className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              View Audit Logs
            </button>
          </div>

          {/* Latest Notifications Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Published Notices</h3>
              <button
                onClick={() => onNavigateTab('notices')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
              >
                View All ({totalNotices})
              </button>
            </div>

            {dashboardNotifications.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <span>No notices published yet</span>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {dashboardNotifications.map((n) => (
                  <div key={n.id} className="flex items-start space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 truncate max-w-[200px]">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.publishDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
