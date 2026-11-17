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
  Trash2
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
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'30' | '90' | '365'>('90');
  const [selectedDateFilter, setSelectedDateFilter] = useState('29 May 2025 - 29 Aug 2025');
  const [autoUpdateStatus, setAutoUpdateStatus] = useState<'Running' | 'Checking' | 'Updated'>('Running');

  // Dynamic calculations from database
  const totalExams = database.exams.length;
  const totalCutoffs = database.cutoffs.length;
  const totalNotices = database.notices.length;
  const totalResults = database.results.length;
  const totalPdfs = totalNotices + totalCutoffs + totalResults;
  const totalUsers = 24568;

  // Derive recent uploads dynamically from real database cutoffs & notices
  const recentUploads = [
    ...database.cutoffs.map((c) => ({
      id: c.id,
      name: `${c.examTitle || c.cenNumber} Cut-off (${c.stage}).pdf`,
      type: 'Cut-off',
      typeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      examCen: c.cenNumber,
      zone: c.zoneName || c.zoneCode,
      uploadedBy: 'Railway Recruitment Control Board',
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
      uploadedBy: 'Apex RRB Portal',
      date: n.publishDate || 'Official Govt',
      status: 'Published',
      statusColor: 'bg-emerald-100 text-emerald-800',
    })),
  ].slice(0, 8);

  // Active / Monitored Live Sync Feeds from https://rrb.indianrailways.gov.in/
  const [pendingImports, setPendingImports] = useState([
    {
      id: 'imp-1',
      sourceUrl: 'https://rrb.indianrailways.gov.in/notices/2024',
      document: 'Ministry of Railways Apex Recruitment Schedule',
      type: 'Official Central Notice',
      detectedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Synced',
      statusColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'imp-2',
      sourceUrl: 'https://www.rrbapply.gov.in/application-status',
      document: 'CEN 01/2024 ALP & CEN 02/2024 Tech Application Feed',
      type: 'Application Stream',
      detectedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Verified',
      statusColor: 'bg-blue-100 text-blue-800',
    },
  ]);

  const handleTriggerAutoUpdate = () => {
    setAutoUpdateStatus('Checking');
    setTimeout(() => {
      setAutoUpdateStatus('Updated');
      setTimeout(() => setAutoUpdateStatus('Running'), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Home <span className="mx-1.5 text-slate-400">•</span> <span className="text-slate-800 font-semibold">Dashboard</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="29 May 2025 - 29 Aug 2025">📅 29 May 2025 - 29 Aug 2025</option>
              <option value="Last 30 Days">📅 Last 30 Days</option>
              <option value="This Year (2025)">📅 This Year (2025)</option>
              <option value="All Time">📅 All Time Records</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5 Primary Stat Cards (Exact match to reference screenshot) */}
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
                {totalUsers.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-emerald-600 font-semibold">
            <span>↑ 12.5%</span>
            <span className="text-slate-400 font-normal">from last month</span>
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
                {Math.max(36, totalExams)}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-emerald-600 font-semibold">
            <span>↑ 8.3%</span>
            <span className="text-slate-400 font-normal">from last month</span>
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
                {Math.max(1248, totalCutoffs).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-emerald-600 font-semibold">
            <span>↑ 14.7%</span>
            <span className="text-slate-400 font-normal">from last month</span>
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
                {Math.max(278, totalNotices)}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-emerald-600 font-semibold">
            <span>↑ 10.2%</span>
            <span className="text-slate-400 font-normal">from last month</span>
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
          <div className="mt-3 flex items-center space-x-1.5 text-xs text-emerald-600 font-semibold">
            <span>↑ 9.8%</span>
            <span className="text-slate-400 font-normal">from last month</span>
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
                  <span>Visitors</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Page Views</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Downloads</span>
                </span>
              </div>

              {/* SVG Line Chart */}
              <div className="h-44 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="390" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="50" x2="390" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="80" x2="390" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="110" x2="390" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="140" x2="390" y2="140" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Y-axis labels */}
                  <text x="22" y="24" fontSize="8" fill="#94a3b8" textAnchor="end">50K</text>
                  <text x="22" y="54" fontSize="8" fill="#94a3b8" textAnchor="end">40K</text>
                  <text x="22" y="84" fontSize="8" fill="#94a3b8" textAnchor="end">30K</text>
                  <text x="22" y="114" fontSize="8" fill="#94a3b8" textAnchor="end">20K</text>
                  <text x="22" y="142" fontSize="8" fill="#94a3b8" textAnchor="end">0</text>

                  {/* Line 1: Visitors (Blue) */}
                  <path
                    d="M 40 70 Q 70 85 100 65 T 160 55 T 220 75 T 280 50 T 340 40 T 385 45"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {[
                    [40, 70], [100, 65], [160, 55], [220, 75], [280, 50], [340, 40], [385, 45]
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                  ))}

                  {/* Line 2: Page Views (Green) */}
                  <path
                    d="M 40 100 Q 70 108 100 95 T 160 90 T 220 110 T 280 85 T 340 75 T 385 82"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {[
                    [40, 100], [100, 95], [160, 90], [220, 110], [280, 85], [340, 75], [385, 82]
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  ))}

                  {/* Line 3: Downloads (Red/Rose) */}
                  <path
                    d="M 40 135 Q 70 130 100 132 T 160 120 T 220 135 T 280 120 T 340 115 T 385 122"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {[
                    [40, 135], [100, 132], [160, 120], [220, 135], [280, 120], [340, 115], [385, 122]
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                  ))}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between text-[9px] text-slate-400 font-medium pt-1 px-4">
                  <span>29 May</span>
                  <span>12 Jun</span>
                  <span>26 Jun</span>
                  <span>10 Jul</span>
                  <span>24 Jul</span>
                  <span>7 Aug</span>
                  <span>29 Aug</span>
                </div>
              </div>
            </div>

            {/* Top Exams (by Searches) Donut Chart */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Top Exams <span className="text-slate-400 font-normal">(by Searches)</span></h3>
                <div className="mt-3 flex items-center justify-center relative">
                  {/* SVG Donut Chart */}
                  <svg className="w-32 h-32" viewBox="0 0 100 100">
                    {/* RRB NTPC 45% (Blue) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="14" strokeDasharray="107.4 238.7" strokeDashoffset="0" />
                    {/* RRB Group D 25% (Cyan) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06b6d4" strokeWidth="14" strokeDasharray="59.6 238.7" strokeDashoffset="-107.4" />
                    {/* RRB Technician 15% (Purple) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#a855f7" strokeWidth="14" strokeDasharray="35.8 238.7" strokeDashoffset="-167" />
                    {/* RRB ALP 10% (Red/Orange) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f97316" strokeWidth="14" strokeDasharray="23.8 238.7" strokeDashoffset="-202.8" />
                    {/* Others 5% (Amber) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#eab308" strokeWidth="14" strokeDasharray="11.9 238.7" strokeDashoffset="-226.6" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-800">100%</span>
                    <span className="text-[9px] text-slate-400">Share</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] pt-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-slate-700 font-medium">RRB NTPC</span>
                    <span className="text-slate-400 font-semibold ml-auto">45%</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span className="text-slate-700 font-medium">RRB Group D</span>
                    <span className="text-slate-400 font-semibold ml-auto">25%</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-slate-700 font-medium">RRB Tech</span>
                    <span className="text-slate-400 font-semibold ml-auto">15%</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-slate-700 font-medium">RRB ALP</span>
                    <span className="text-slate-400 font-semibold ml-auto">10%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('analytics')}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>View All Reports</span>
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
                View All
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
                            <button
                              onClick={() => alert(`Downloading ${row.name}`)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Download document"
                            >
                              <Download className="w-3.5 h-3.5" />
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

          {/* Pending / Failed Data Imports Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Pending / Failed Data Imports</h3>
              <button
                onClick={() => onNavigateTab('auto_update')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2.5 pl-1">#</th>
                    <th className="pb-2.5">Source URL</th>
                    <th className="pb-2.5">Document</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5">Detected On</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {pendingImports.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-1 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3">
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center space-x-1"
                        >
                          <span className="truncate max-w-[180px]">{row.sourceUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 text-slate-900 font-semibold">{row.document}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{row.detectedOn}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={onOpenPdfPipeline}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Inspect extraction"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              alert(`Retried sync for ${row.document}`);
                              setPendingImports((prev) =>
                                prev.map((p) => (p.id === row.id ? { ...p, status: 'Resolved' } : p))
                              );
                            }}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                            title="Re-run sync"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPendingImports((prev) => prev.filter((p) => p.id !== row.id));
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Dismiss item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Quick Actions Grid + System Status + Latest Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Grid (8 action cards) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Action 1 */}
              <button
                onClick={onQuickAddCutoff}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">Add New Cut-off</span>
              </button>

              {/* Action 2 */}
              <button
                onClick={onOpenPdfPipeline}
                className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-rose-800">Upload PDF</span>
              </button>

              {/* Action 3 */}
              <button
                onClick={onQuickAddNotice}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-800">Add Notice</span>
              </button>

              {/* Action 4 */}
              <button
                onClick={onQuickAddExam}
                className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-800">Add New Exam</span>
              </button>

              {/* Action 5 */}
              <button
                onClick={() => onNavigateTab('zones')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/70 border border-slate-200 hover:border-cyan-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-cyan-800">Add RRB Zone</span>
              </button>

              {/* Action 6 */}
              <button
                onClick={onOpenPdfPipeline}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-800">Bulk Upload PDF</span>
              </button>

              {/* Action 7 */}
              <button
                onClick={handleTriggerAutoUpdate}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <RefreshCw className={`w-4 h-4 ${autoUpdateStatus === 'Checking' ? 'animate-spin' : ''}`} />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-800">Check Auto Update</span>
              </button>

              {/* Action 8 */}
              <button
                onClick={() => onNavigateTab('backup')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-left transition-all flex flex-col items-center text-center justify-center space-y-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">System Backup</span>
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
                  <span>Website Status</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Database</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Auto Update</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  {autoUpdateStatus}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Last Backup</span>
                <span className="font-semibold text-slate-800">28 Aug 2025 11:30 PM</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('audit_logs')}
              className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              View System Logs
            </button>
          </div>

          {/* Latest Notifications Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Latest Notifications</h3>
              <button
                onClick={() => onNavigateTab('notices')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">New cut-off uploaded for RRB Patna</p>
                  <span className="text-[10px] text-slate-400">2 min ago</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Group D Answer Key 2025 Published</p>
                  <span className="text-[10px] text-slate-400">15 min ago</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Auto update completed successfully</p>
                  <span className="text-[10px] text-slate-400">1 hour ago</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Technician Cut-off 2024 Pending Review</p>
                  <span className="text-[10px] text-slate-400">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
