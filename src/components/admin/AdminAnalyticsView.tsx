import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Download, Eye, Globe, ArrowUpRight } from 'lucide-react';
import { FullRRBDatabase } from '../../types';

interface AdminAnalyticsViewProps {
  database: FullRRBDatabase;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ database }) => {
  const [period, setPeriod] = useState('30');

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <span>Analytics & Portal Usage Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime traffic telemetry, PDF download volumes, search metrics & candidate engagement
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
          <option value="365">This Year (2025)</option>
        </select>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Unique Visitors</span>
            <span className="text-emerald-600 font-bold">↑ 18.2%</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">142,890</h3>
          <span className="text-[11px] text-slate-400 block">Across 28 Indian States</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total PDF Downloads</span>
            <span className="text-emerald-600 font-bold">↑ 24.5%</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">48,210</h3>
          <span className="text-[11px] text-slate-400 block">Cut-offs & Merit PDFs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>AI Queries Resolved</span>
            <span className="text-emerald-600 font-bold">↑ 41.0%</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">12,650</h3>
          <span className="text-[11px] text-slate-400 block">Smart RRB AI Assistant</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Average Session Time</span>
            <span className="text-blue-600 font-bold">4m 32s</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">89.4%</h3>
          <span className="text-[11px] text-slate-400 block">Mobile Web Candidates</span>
        </div>
      </div>
    </div>
  );
};
