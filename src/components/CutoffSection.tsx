import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink,
  Layers,
  FileSpreadsheet,
  Globe,
  Plus
} from 'lucide-react';
import { CutoffRecord, CutoffStage, FullRRBDatabase, TabView } from '../types';

interface CutoffSectionProps {
  database: FullRRBDatabase;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  setCurrentTab: (tab: TabView) => void;
}

export const CutoffSection: React.FC<CutoffSectionProps> = ({
  database,
  selectedZoneFilter,
  setSelectedZoneFilter,
  setCurrentTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenFilter, setSelectedCenFilter] = useState('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'UR' | 'postName' | 'zoneName' | 'year'>('UR');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Unique CENs and Stages in existing data
  const availableCens = useMemo(() => {
    const set = new Set<string>();
    database.cutoffs.forEach((c) => {
      if (c.cenNumber) set.add(c.cenNumber);
    });
    return Array.from(set);
  }, [database.cutoffs]);

  const availableStages = useMemo(() => {
    const set = new Set<string>();
    database.cutoffs.forEach((c) => {
      if (c.stage) set.add(c.stage);
    });
    return Array.from(set);
  }, [database.cutoffs]);

  // Filtered and Sorted Cutoffs
  const filteredCutoffs = useMemo(() => {
    return database.cutoffs
      .filter((item) => {
        const matchesSearch =
          item.postName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.examTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.zoneCode.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesZone =
          selectedZoneFilter === 'ALL' || item.zoneCode === selectedZoneFilter;

        const matchesCen =
          selectedCenFilter === 'ALL' || item.cenNumber === selectedCenFilter;

        const matchesStage =
          selectedStageFilter === 'ALL' || item.stage === selectedStageFilter;

        return matchesSearch && matchesZone && matchesCen && matchesStage;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof CutoffRecord];
        let valB: any = b[sortField as keyof CutoffRecord];

        if (sortField === 'UR') {
          valA = Number(a.cutoffs.UR) || 0;
          valB = Number(b.cutoffs.UR) || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    database.cutoffs,
    searchQuery,
    selectedZoneFilter,
    selectedCenFilter,
    selectedStageFilter,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: 'UR' | 'postName' | 'zoneName' | 'year') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportFilteredToCsv = () => {
    if (filteredCutoffs.length === 0) return;

    const headers = [
      'CEN Number',
      'Exam Title',
      'Zone Code',
      'Zone Name',
      'Post Name',
      'Stage',
      'Year',
      'UR Cutoff',
      'OBC Cutoff',
      'SC Cutoff',
      'ST Cutoff',
      'EWS Cutoff',
      'Ex-SM Cutoff',
      'Normalized Score',
    ];

    const rows = filteredCutoffs.map((item) => [
      `"${item.cenNumber}"`,
      `"${item.examTitle}"`,
      `"${item.zoneCode}"`,
      `"${item.zoneName}"`,
      `"${item.postName}"`,
      `"${item.stage}"`,
      `"${item.year}"`,
      item.cutoffs.UR ?? '',
      item.cutoffs.OBC ?? '',
      item.cutoffs.SC ?? '',
      item.cutoffs.ST ?? '',
      item.cutoffs.EWS ?? '',
      item.cutoffs.ExSM ?? '',
      item.normalizedScore ? 'Yes' : 'No',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rrb_cutoffs_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950">
                RRB Qualifying Cut-Off Marks Table
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Official category-wise normalized and raw cut-off scores across 21 railway recruitment boards
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          {filteredCutoffs.length > 0 && (
            <button
              onClick={exportFilteredToCsv}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all border border-slate-200 cursor-pointer shadow-xs"
              title="Download table data as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setCurrentTab('admin')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Upload / Add Cut-Offs</span>
          </button>
        </div>
      </div>

      {/* Multi-Parameter Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Search Post / Keyword
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Station Master, ALP, etc..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* RRB Zone Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              RRB Zone ({database.zones.length})
            </label>
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Regional Boards (All India)</option>
              {database.zones.map((zone) => (
                <option key={zone.id} value={zone.code}>
                  {zone.name} ({zone.code})
                </option>
              ))}
            </select>
          </div>

          {/* CEN Exam Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              CEN Exam Filter
            </label>
            <select
              value={selectedCenFilter}
              onChange={(e) => setSelectedCenFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All CEN Notifications</option>
              {availableCens.map((cen) => (
                <option key={cen} value={cen}>
                  {cen}
                </option>
              ))}
            </select>
          </div>

          {/* Selection Stage Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Selection Stage
            </label>
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Stages (CBT 1, 2, DV)</option>
              {availableStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary & Quick Reset */}
        {(searchQuery || selectedZoneFilter !== 'ALL' || selectedCenFilter !== 'ALL' || selectedStageFilter !== 'ALL') && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing <strong>{filteredCutoffs.length}</strong> matching cut-off records
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedZoneFilter('ALL');
                setSelectedCenFilter('ALL');
                setSelectedStageFilter('ALL');
              }}
              className="text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Cut-Off Table */}
      {filteredCutoffs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {database.cutoffs.length === 0 ? 'No Cut-Off Marks Available Currently' : 'No Cut-Offs Match Your Filters'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            {database.cutoffs.length === 0
              ? 'Official post-wise and category-wise cut-off scores will be listed here once declared by RRB.'
              : 'Try clearing the search query or selecting "All Regional Boards".'}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setCurrentTab('admin')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Go to Admin Panel & Upload JSON
            </button>
            {(searchQuery || selectedZoneFilter !== 'ALL' || selectedCenFilter !== 'ALL' || selectedStageFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedZoneFilter('ALL');
                  setSelectedCenFilter('ALL');
                  setSelectedStageFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th 
                    onClick={() => handleSort('postName')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Post / Designation</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('zoneName')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>RRB Board</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Stage</th>
                  <th 
                    onClick={() => handleSort('UR')}
                    className="py-3 px-3 text-center bg-amber-50/80 text-amber-950 cursor-pointer font-bold border-x border-amber-100"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>UR</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-700" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">OBC</th>
                  <th className="py-3 px-3 text-center">SC</th>
                  <th className="py-3 px-3 text-center">ST</th>
                  <th className="py-3 px-3 text-center">EWS</th>
                  <th className="py-3 px-3 text-center">Ex-SM</th>
                  <th className="py-3 px-3 text-center">Score Type</th>
                  <th className="py-3 px-3 text-right">PDF Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCutoffs.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Post & CEN */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-950 text-sm leading-snug">
                        {item.postName}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold border border-slate-200">
                          {item.cenNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">{item.examTitle}</span>
                      </div>
                    </td>

                    {/* Zone */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{item.zoneName}</div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {item.zoneCode}
                      </span>
                    </td>

                    {/* Stage */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {item.stage}
                      </span>
                    </td>

                    {/* UR Score */}
                    <td className="py-3 px-3 text-center bg-amber-50/40 font-black text-slate-950 text-sm border-x border-amber-100/60">
                      {item.cutoffs.UR !== undefined ? (
                        <div className="space-y-0.5">
                          <span>{item.cutoffs.UR}</span>
                          {typeof item.cutoffs.UR === 'number' && (
                            <div className="w-12 mx-auto bg-amber-100 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, item.cutoffs.UR))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* OBC */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-800 text-xs">
                      {item.cutoffs.OBC ?? <span className="text-slate-300">-</span>}
                    </td>

                    {/* SC */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-800 text-xs">
                      {item.cutoffs.SC ?? <span className="text-slate-300">-</span>}
                    </td>

                    {/* ST */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-800 text-xs">
                      {item.cutoffs.ST ?? <span className="text-slate-300">-</span>}
                    </td>

                    {/* EWS */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-800 text-xs">
                      {item.cutoffs.EWS ?? <span className="text-slate-300">-</span>}
                    </td>

                    {/* Ex-SM */}
                    <td className="py-3 px-3 text-center font-medium text-slate-600 text-xs">
                      {item.cutoffs.ExSM ?? <span className="text-slate-300">-</span>}
                    </td>

                    {/* Score Type */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          item.normalizedScore
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.normalizedScore ? 'Normalized' : 'Raw Marks'}
                      </span>
                    </td>

                    {/* PDF Reference Link */}
                    <td className="py-3 px-3 text-right">
                      {item.pdfReference ? (
                        <a
                          href={item.pdfReference}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                        >
                          <span>PDF</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Official</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Total Records: <strong>{filteredCutoffs.length}</strong> (Out of {database.cutoffs.length} uploaded)
            </div>
            <div className="text-[11px]">
              Note: Cut-off marks are out of 100 or 120 as specified in the respective CEN official prospectus.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
