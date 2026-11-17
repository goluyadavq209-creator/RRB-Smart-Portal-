import React, { useState } from 'react';
import { Layers, FileText, CheckCircle2, Search, Plus, Calendar, Tag, ExternalLink } from 'lucide-react';
import { FullRRBDatabase } from '../../types';

interface AdminCenViewProps {
  database: FullRRBDatabase;
  onSuccessMessage: (msg: string) => void;
}

export const AdminCenView: React.FC<AdminCenViewProps> = ({ database, onSuccessMessage }) => {
  const [search, setSearch] = useState('');

  // Extract unique CEN batches from database
  const cenMap = new Map<string, { cen: string; examsCount: number; cutoffsCount: number; noticesCount: number }>();

  database.exams.forEach((e) => {
    const cen = e.cenNumber || 'CEN General';
    const entry = cenMap.get(cen) || { cen, examsCount: 0, cutoffsCount: 0, noticesCount: 0 };
    entry.examsCount += 1;
    cenMap.set(cen, entry);
  });

  database.cutoffs.forEach((c) => {
    const cen = c.cenNumber || 'CEN General';
    const entry = cenMap.get(cen) || { cen, examsCount: 0, cutoffsCount: 0, noticesCount: 0 };
    entry.cutoffsCount += 1;
    cenMap.set(cen, entry);
  });

  database.notices.forEach((n) => {
    if (n.cenNumber) {
      const entry = cenMap.get(n.cenNumber) || { cen: n.cenNumber, examsCount: 0, cutoffsCount: 0, noticesCount: 0 };
      entry.noticesCount += 1;
      cenMap.set(n.cenNumber, entry);
    }
  });

  const cenList = Array.from(cenMap.values()).filter((item) =>
    item.cen.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Tag className="w-5 h-5 text-red-600" />
            <span>CEN Management (Centralized Employment Notices)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Index, track batches & associate cut-offs, answers keys & vacancies with official CEN tags
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter CEN numbers..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {cenList.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-2">
          <Tag className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No CEN Batches Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            CEN batches will automatically appear here as exams, cut-offs, or official notices with CEN numbers are published.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cenList.map((item) => (
            <div
              key={item.cen}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-950 font-mono text-sm font-black border border-amber-500/30">
                  {item.cen}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active Batch
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold">Exams</span>
                  <span className="text-sm font-extrabold text-slate-900">{item.examsCount}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold">Cut-offs</span>
                  <span className="text-sm font-extrabold text-slate-900">{item.cutoffsCount}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold">Notices</span>
                  <span className="text-sm font-extrabold text-slate-900">{item.noticesCount}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span>Status: Synchronized</span>
                <button
                  onClick={() => onSuccessMessage(`Filtered active records for ${item.cen}`)}
                  className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                >
                  View Batch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
