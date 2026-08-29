import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  BarChart3, 
  Bell, 
  Award, 
  Building2, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  FileText,
  Check,
  X,
  Ticket
} from 'lucide-react';
import { FullRRBDatabase } from '../types';
import { clearRRBDatabase, saveRRBDatabase } from '../utils/storage';

interface AdminDataRemoveProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminDataRemove: React.FC<AdminDataRemoveProps> = ({
  database,
  setDatabase,
  onSuccessMessage,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'exams' | 'cutoffs' | 'notices' | 'results' | 'links'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenToDelete, setSelectedCenToDelete] = useState<string>('');
  const [selectedZoneToDelete, setSelectedZoneToDelete] = useState<string>('');
  const [showMasterPurgeModal, setShowMasterPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [confirmItemDelete, setConfirmItemDelete] = useState<{
    type: 'exams' | 'cutoffs' | 'notices' | 'results' | 'links';
    id: string;
    title: string;
  } | null>(null);

  const portalLinks = database.portalLinks || [];

  // Total items count
  const totalRecords = 
    database.exams.length + 
    database.cutoffs.length + 
    database.notices.length + 
    database.results.length +
    portalLinks.length;

  // Unique CEN numbers in database
  const availableCens = useMemo(() => {
    const set = new Set<string>();
    database.exams.forEach((e) => e.cenNumber && set.add(e.cenNumber));
    database.cutoffs.forEach((c) => c.cenNumber && set.add(c.cenNumber));
    database.notices.forEach((n) => n.cenNumber && set.add(n.cenNumber));
    database.results.forEach((r) => r.cenNumber && set.add(r.cenNumber));
    return Array.from(set).sort();
  }, [database]);

  // Zones with data
  const zonesWithData = useMemo(() => {
    const zoneCodes = new Set<string>();
    database.cutoffs.forEach((c) => c.zoneCode && zoneCodes.add(c.zoneCode));
    database.notices.forEach((n) => n.zoneCode && zoneCodes.add(n.zoneCode));
    database.results.forEach((r) => r.zoneCode && zoneCodes.add(r.zoneCode));
    return database.zones.filter((z) => zoneCodes.has(z.code));
  }, [database]);

  // Categorized search items
  const allItemsList = useMemo(() => {
    const list: Array<{
      type: 'exams' | 'cutoffs' | 'notices' | 'results' | 'links';
      id: string;
      title: string;
      subtitle: string;
      cen: string;
      zone?: string;
    }> = [];

    if (selectedType === 'all' || selectedType === 'exams') {
      database.exams.forEach((e) => {
        list.push({
          type: 'exams',
          id: e.id,
          title: e.title,
          subtitle: `${e.cenNumber} • Vacancies: ${e.totalVacancies?.toLocaleString() || 'N/A'} • Status: ${e.status}`,
          cen: e.cenNumber,
        });
      });
    }

    if (selectedType === 'all' || selectedType === 'cutoffs') {
      database.cutoffs.forEach((c) => {
        list.push({
          type: 'cutoffs',
          id: c.id,
          title: `${c.examTitle} - ${c.postName}`,
          subtitle: `${c.cenNumber} • ${c.zoneName} (${c.zoneCode}) • ${c.stage} (${c.year})`,
          cen: c.cenNumber,
          zone: c.zoneName,
        });
      });
    }

    if (selectedType === 'all' || selectedType === 'notices') {
      database.notices.forEach((n) => {
        list.push({
          type: 'notices',
          id: n.id,
          title: n.title,
          subtitle: `${n.cenNumber} • Zone: ${n.zoneCode} • Date: ${n.publishDate} • Category: ${n.category}`,
          cen: n.cenNumber,
          zone: n.zoneCode,
        });
      });
    }

    if (selectedType === 'all' || selectedType === 'results') {
      database.results.forEach((r) => {
        list.push({
          type: 'results',
          id: r.id,
          title: `${r.examTitle} - ${r.stage}`,
          subtitle: `${r.cenNumber} • ${r.zoneName} • Total Qualified: ${r.totalSelectedCandidates || r.rollNumbersSample?.length || 0}`,
          cen: r.cenNumber,
          zone: r.zoneName,
        });
      });
    }

    if (selectedType === 'all' || selectedType === 'links') {
      portalLinks.forEach((l) => {
        if (!l) return;
        list.push({
          type: 'links',
          id: l.id,
          title: l.title || 'Untitled Link',
          subtitle: `${(l.type || 'PORTAL').toUpperCase()} • ${l.examName || 'All Exams'} • ${l.url || ''}`,
          cen: l.cenNumber || '',
        });
      });
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.cen.toLowerCase().includes(q) ||
        (item.zone && item.zone.toLowerCase().includes(q))
    );
  }, [database, selectedType, searchQuery]);

  // Remove Single Item
  const handleDeleteItem = (type: 'exams' | 'cutoffs' | 'notices' | 'results' | 'links', id: string, title: string) => {
    const updated = { ...database };
    if (type === 'exams') {
      updated.exams = updated.exams.filter((x) => x.id !== id);
    } else if (type === 'cutoffs') {
      updated.cutoffs = updated.cutoffs.filter((x) => x.id !== id);
    } else if (type === 'notices') {
      updated.notices = updated.notices.filter((x) => x.id !== id);
    } else if (type === 'results') {
      updated.results = updated.results.filter((x) => x.id !== id);
    } else if (type === 'links') {
      updated.portalLinks = (updated.portalLinks || []).filter((x) => x.id !== id);
    }

    saveRRBDatabase(updated);
    setDatabase(updated);
    setConfirmItemDelete(null);
    onSuccessMessage(`Removed: "${title}" from ${type}.`);
  };

  // Category Clear Handler
  const handleClearCategory = (category: 'exams' | 'cutoffs' | 'notices' | 'results' | 'portalLinks') => {
    const count = (database[category] || []).length;
    if (count === 0) return;

    if (window.confirm(`Are you sure you want to delete all ${count} records in ${category.toUpperCase()}? This cannot be undone.`)) {
      const updated = { ...database, [category]: [] };
      saveRRBDatabase(updated);
      setDatabase(updated);
      onSuccessMessage(`All ${count} records from ${category} have been deleted.`);
    }
  };

  // CEN-Wise Batch Delete Handler
  const handleDeleteByCen = (cenNumber: string) => {
    if (!cenNumber) return;

    const examsCount = database.exams.filter((e) => e.cenNumber === cenNumber).length;
    const cutoffsCount = database.cutoffs.filter((c) => c.cenNumber === cenNumber).length;
    const noticesCount = database.notices.filter((n) => n.cenNumber === cenNumber).length;
    const resultsCount = database.results.filter((r) => r.cenNumber === cenNumber).length;
    const total = examsCount + cutoffsCount + noticesCount + resultsCount;

    if (total === 0) {
      alert(`No records found for ${cenNumber}.`);
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to remove ALL records associated with ${cenNumber}?\n\n- Exams: ${examsCount}\n- Cut-offs: ${cutoffsCount}\n- Notices: ${noticesCount}\n- Results: ${resultsCount}\nTotal: ${total} records.`
      )
    ) {
      const updated: FullRRBDatabase = {
        ...database,
        exams: database.exams.filter((e) => e.cenNumber !== cenNumber),
        cutoffs: database.cutoffs.filter((c) => c.cenNumber !== cenNumber),
        notices: database.notices.filter((n) => n.cenNumber !== cenNumber),
        results: database.results.filter((r) => r.cenNumber !== cenNumber),
      };

      saveRRBDatabase(updated);
      setDatabase(updated);
      setSelectedCenToDelete('');
      onSuccessMessage(`Successfully deleted all ${total} records for ${cenNumber}.`);
    }
  };

  // Zone-Wise Batch Delete Handler
  const handleDeleteByZone = (zoneCode: string) => {
    if (!zoneCode) return;
    const zoneObj = database.zones.find((z) => z.code === zoneCode);
    const zoneName = zoneObj ? zoneObj.name : zoneCode;

    const cutoffsCount = database.cutoffs.filter((c) => c.zoneCode === zoneCode).length;
    const noticesCount = database.notices.filter((n) => n.zoneCode === zoneCode).length;
    const resultsCount = database.results.filter((r) => r.zoneCode === zoneCode).length;
    const total = cutoffsCount + noticesCount + resultsCount;

    if (total === 0) {
      alert(`No records found for zone ${zoneName}.`);
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to remove ALL data for ${zoneName} (${zoneCode})?\n\n- Cut-offs: ${cutoffsCount}\n- Notices: ${noticesCount}\n- Results: ${resultsCount}\nTotal: ${total} records.`
      )
    ) {
      const updated: FullRRBDatabase = {
        ...database,
        cutoffs: database.cutoffs.filter((c) => c.zoneCode !== zoneCode),
        notices: database.notices.filter((n) => n.zoneCode !== zoneCode),
        results: database.results.filter((r) => r.zoneCode !== zoneCode),
      };

      saveRRBDatabase(updated);
      setDatabase(updated);
      setSelectedZoneToDelete('');
      onSuccessMessage(`Successfully removed all ${total} records for ${zoneName}.`);
    }
  };

  // Master Database Reset
  const handleExecuteMasterPurge = () => {
    if (purgeConfirmText.trim().toUpperCase() !== 'DELETE') {
      alert('Please type "DELETE" to confirm complete wipeout.');
      return;
    }

    const empty = clearRRBDatabase();
    setDatabase(empty);
    setShowMasterPurgeModal(false);
    setPurgeConfirmText('');
    onSuccessMessage('Master Database Purged: All exams, cut-offs, notices, and results have been completely deleted.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-rose-950">
              Data Removal & Database Purge Center (डेटा हटाएं)
            </h3>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              Selectively delete individual records, purge specific CEN notification datasets, clear whole categories, or execute a master database reset to zero records.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowMasterPurgeModal(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4 text-white" />
          <span>Purge All to 0 (Master Reset)</span>
        </button>
      </div>

      {/* 1. Category-Wise Quick Clear Cards */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          1. Quick Clear by Category (श्रेणी अनुसार हटाएं)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Exams Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Exams (परीक्षाएं)</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                  {database.exams.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Contains active and completed CEN recruitment notifications.
              </p>
            </div>
            <button
              onClick={() => handleClearCategory('exams')}
              disabled={database.exams.length === 0}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Exams ({database.exams.length})</span>
            </button>
          </div>

          {/* Cutoffs Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Cut-offs (कट-ऑफ)</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold font-mono">
                  {database.cutoffs.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Category-wise (UR/OBC/SC/ST/EWS) normalized cutoff records.
              </p>
            </div>
            <button
              onClick={() => handleClearCategory('cutoffs')}
              disabled={database.cutoffs.length === 0}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Cut-offs ({database.cutoffs.length})</span>
            </button>
          </div>

          {/* Notices Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Notices (सूचनाएं)</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold font-mono">
                  {database.notices.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Official date announcements, syllabus, and exam intimations.
              </p>
            </div>
            <button
              onClick={() => handleClearCategory('notices')}
              disabled={database.notices.length === 0}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Notices ({database.notices.length})</span>
            </button>
          </div>

          {/* Results Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Results & Panels</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold font-mono">
                  {database.results.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Merit lists, CBT results, and candidate roll number datasets.
              </p>
            </div>
            <button
              onClick={() => handleClearCategory('results')}
              disabled={database.results.length === 0}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Results ({database.results.length})</span>
            </button>
          </div>

          {/* Portal Direct Links Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <Ticket className="w-4 h-4 text-rose-600" />
                  <span>Candidate Links</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-bold font-mono">
                  {portalLinks.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Admit Card, Answer Key, Score Card, City Intimation direct links.
              </p>
            </div>
            <button
              onClick={() => handleClearCategory('portalLinks')}
              disabled={portalLinks.length === 0}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Links ({portalLinks.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Batch Purge Tools (CEN-wise & Zone-wise) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CEN-wise Purge */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Batch Delete by CEN Notification</span>
          </div>
          <p className="text-xs text-slate-500">
            Deletes all exams, cut-offs, notices, and merit results corresponding to a single CEN number.
          </p>

          <div className="flex gap-2">
            <select
              value={selectedCenToDelete}
              onChange={(e) => setSelectedCenToDelete(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Select CEN Number to Remove --</option>
              {availableCens.map((cen) => (
                <option key={cen} value={cen}>
                  {cen}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleDeleteByCen(selectedCenToDelete)}
              disabled={!selectedCenToDelete}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete CEN</span>
            </button>
          </div>
        </div>

        {/* Zone-wise Purge */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Batch Delete by RRB Board / Zone</span>
          </div>
          <p className="text-xs text-slate-500">
            Removes all cut-offs, result panels, and notices attached to a specific RRB zone.
          </p>

          <div className="flex gap-2">
            <select
              value={selectedZoneToDelete}
              onChange={(e) => setSelectedZoneToDelete(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Select RRB Zone to Remove --</option>
              {zonesWithData.map((z) => (
                <option key={z.code} value={z.code}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>

            <button
              onClick={() => handleDeleteByZone(selectedZoneToDelete)}
              disabled={!selectedZoneToDelete}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Zone</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Individual Record Search & Delete Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Filter className="w-4 h-4 text-amber-600" />
              <span>Individual Record Remover ({allItemsList.length} items found)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Search and delete specific exams, cutoff points, notices, or result panels.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${totalRecords})` },
              { id: 'exams', label: `Exams (${database.exams.length})` },
              { id: 'cutoffs', label: `Cut-offs (${database.cutoffs.length})` },
              { id: 'notices', label: `Notices (${database.notices.length})` },
              { id: 'results', label: `Results (${database.results.length})` },
              { id: 'links', label: `Links (${portalLinks.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, CEN number, RRB zone, or stage..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>

        {/* Items List */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
          {allItemsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found in database.
            </div>
          ) : (
            allItemsList.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="pt-2 pb-2 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        item.type === 'exams'
                          ? 'bg-amber-100 text-amber-800'
                          : item.type === 'cutoffs'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.type === 'notices'
                          ? 'bg-blue-100 text-blue-800'
                          : item.type === 'results'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                </div>

                <button
                  onClick={() => setConfirmItemDelete({ type: item.type, id: item.id, title: item.title })}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 font-bold text-xs transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                  title="Delete this record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal for Single Item Delete */}
      {confirmItemDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">
                Confirm Record Deletion
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove this record from the database?
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs font-semibold text-slate-800">
                {confirmItemDelete.title}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmItemDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(confirmItemDelete.type, confirmItemDelete.id, confirmItemDelete.title)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Purge Modal */}
      {showMasterPurgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-rose-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-lg text-rose-950">
                Master Database Reset (Zero Records)
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This action will wipe out ALL {totalRecords} records across Exams, Cut-offs, Notices, and Results. The database will be completely empty.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Type &ldquo;<span className="text-rose-600 font-mono">DELETE</span>&rdquo; to confirm:
              </label>
              <input
                type="text"
                value={purgeConfirmText}
                onChange={(e) => setPurgeConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowMasterPurgeModal(false);
                  setPurgeConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMasterPurge}
                disabled={purgeConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                Purge Complete Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
