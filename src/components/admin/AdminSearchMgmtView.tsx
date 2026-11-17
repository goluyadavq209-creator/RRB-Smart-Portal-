import React, { useState } from 'react';
import { Search, TrendingUp, Tag, Plus, Trash2 } from 'lucide-react';

export const AdminSearchMgmtView: React.FC = () => {
  const [topSearches, setTopSearches] = useState([
    { query: 'NTPC Cut off Patna', count: 14200, category: 'Cut-off' },
    { query: 'Group D Answer Key 2025', count: 11350, category: 'Answer Key' },
    { query: 'ALP CBT 2 Admit Card', count: 9800, category: 'Admit Card' },
    { query: 'Technician Grade 3 Vacancies', count: 7600, category: 'Vacancy' },
    { query: 'CEN 01/2024 Exam Date', count: 6400, category: 'Notification' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
          <Search className="w-5 h-5 text-red-600" />
          <span>Search Management & Keyword Analytics</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor candidate search queries, configure synonym tags, and optimize global fast search indexing
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Top Trending Candidate Search Queries</h3>

        <div className="space-y-2">
          {topSearches.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-md bg-white text-slate-700 font-bold flex items-center justify-center border border-slate-200 text-[11px]">
                  #{idx + 1}
                </span>
                <span className="font-bold text-slate-900">{s.query}</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  {s.category}
                </span>
              </div>

              <span className="font-mono font-bold text-slate-700">
                {s.count.toLocaleString()} searches
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
