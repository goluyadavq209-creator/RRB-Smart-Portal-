import React, { useMemo } from 'react';
import { BarChart3, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';

interface CutOffTablePreviewProps {
  database: FullRRBDatabase;
  appliedFilters: {
    examId?: string;
    year?: string;
    zoneCode?: string;
    category?: string;
    stage?: string;
  };
  setCurrentTab: (tab: TabView) => void;
}

export const CutOffTablePreview: React.FC<CutOffTablePreviewProps> = ({
  database,
  appliedFilters,
  setCurrentTab,
}) => {
  // Filter matching cutoffs
  const filteredRows = useMemo(() => {
    return database.cutoffs.filter((c) => {
      if (appliedFilters.examId && c.cenNumber !== appliedFilters.examId && c.examTitle !== appliedFilters.examId) {
        // match on id or title
        const matchCen = c.cenNumber.toLowerCase().includes(appliedFilters.examId.toLowerCase());
        const matchTitle = c.examTitle.toLowerCase().includes(appliedFilters.examId.toLowerCase());
        if (!matchCen && !matchTitle) return false;
      }
      if (appliedFilters.year && c.year.toString() !== appliedFilters.year) return false;
      if (appliedFilters.zoneCode && c.zoneCode !== appliedFilters.zoneCode) return false;
      if (appliedFilters.stage && !c.stage.toLowerCase().includes(appliedFilters.stage.toLowerCase())) return false;
      return true;
    });
  }, [database.cutoffs, appliedFilters]);

  const hasFilterActive = Object.values(appliedFilters).some(Boolean);

  return (
    <div id="cutoff-table-preview-section" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-950 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#c1121f]" />
            <span>Cut-Off Table Preview</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time normalized qualifying scores from official CEN datasets.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('cutoffs')}
          className="text-xs font-bold text-[#c1121f] hover:text-[#991b1b] flex items-center space-x-1 cursor-pointer"
        >
          <span>Open Full Cut-Off Explorer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Exam</th>
              <th className="px-3 py-3">Year</th>
              <th className="px-3 py-3">Zone</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Stage</th>
              <th className="px-3 py-3 text-right">Cut-Off Marks</th>
              <th className="px-4 py-3 text-right">Normalized Score</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredRows.length > 0 ? (
              filteredRows.slice(0, 6).flatMap((c) => {
                const cutoffsObj = c.cutoffs || (c as any).categoryWise || {};
                const categories = [
                  { name: 'UR', val: cutoffsObj.UR },
                  { name: 'OBC', val: cutoffsObj.OBC },
                  { name: 'SC', val: cutoffsObj.SC },
                  { name: 'ST', val: cutoffsObj.ST },
                  { name: 'EWS', val: cutoffsObj.EWS },
                ].filter((cat) => !appliedFilters.category || cat.name === appliedFilters.category);

                return categories.map((cat) => (
                  <tr key={`${c.id}-${cat.name}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {c.examTitle}
                      <span className="block text-[10px] font-normal text-slate-500">{c.cenNumber} • {c.postName}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-700">{c.year}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-slate-800">{c.zoneName}</span>
                      <span className="text-[10px] text-slate-500 block">({c.zoneCode})</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {cat.name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{c.stage}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                      {cat.val !== undefined && cat.val !== null ? cat.val : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                      {c.normalizedScore ? 'Yes (Normalized)' : 'Raw Score'}
                    </td>
                  </tr>
                ));
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-700 text-xs sm:text-sm">
                      {database.cutoffs.length === 0
                        ? 'Official cut-off data will appear here once declared.'
                        : 'No cut-off records matched the selected filter criteria.'}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Please select filters in the Cut-Off Explorer above and click on &ldquo;View Cut-Off&rdquo; to see results.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
