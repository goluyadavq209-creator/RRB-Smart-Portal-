import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Download, Eye, Globe, ArrowUpRight } from 'lucide-react';
import { FullRRBDatabase } from '../../types';

interface AdminAnalyticsViewProps {
  database: FullRRBDatabase;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ database }) => {
  const [period, setPeriod] = useState('30');

  const totalExams = database.exams.length;
  const totalCutoffs = database.cutoffs.length;
  const totalNotices = database.notices.length;
  const totalResults = database.results.length;
  const totalDocuments = totalCutoffs + totalNotices + totalResults;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <span>Analytics & Portal Usage Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime database telemetry, published document counts & candidate engagement metrics
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">This Year</option>
        </select>
      </div>

      {/* 4 Cards with real database counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Active Exams</span>
            <span className="text-emerald-600 font-bold">Real Count</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalExams}</h3>
          <span className="text-[11px] text-slate-400 block">{totalExams === 0 ? 'No exams added yet' : 'In production catalog'}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Cut-off Datasets</span>
            <span className="text-emerald-600 font-bold">Indexed</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalCutoffs}</h3>
          <span className="text-[11px] text-slate-400 block">{totalCutoffs === 0 ? 'No cut-offs added' : 'Zone & Category Matrices'}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Official Notices</span>
            <span className="text-blue-600 font-bold">Circulars</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalNotices}</h3>
          <span className="text-[11px] text-slate-400 block">{totalNotices === 0 ? 'No notices published' : 'Live Official Notices'}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Published PDFs</span>
            <span className="text-purple-600 font-bold">Verified</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalDocuments}</h3>
          <span className="text-[11px] text-slate-400 block">{totalDocuments === 0 ? 'No documents parsed' : 'Cut-offs, Results & Circulars'}</span>
        </div>
      </div>
    </div>
  );
};
