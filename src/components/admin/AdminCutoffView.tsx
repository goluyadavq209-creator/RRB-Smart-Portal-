import React, { useState } from 'react';
import { BarChart3, Plus, Search, Trash2, Edit3, Filter, CheckCircle2 } from 'lucide-react';
import { FullRRBDatabase, CutoffRecord, CutoffStage } from '../../types';
import { saveRRBDatabase } from '../../utils/storage';
import { OFFICIAL_RRB_ZONES } from '../../data/defaultData';

interface AdminCutoffViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
  onOpenPdfPipeline: () => void;
}

export const AdminCutoffView: React.FC<AdminCutoffViewProps> = ({
  database,
  setDatabase,
  onSuccessMessage,
  onOpenPdfPipeline,
}) => {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    cenNumber: 'CEN 01/2024',
    examTitle: 'RRB ALP 2024',
    zoneCode: 'ALL',
    zoneName: 'All Regional RRBs',
    postName: 'Assistant Loco Pilot (Electrical)',
    stage: 'CBT-1' as CutoffStage,
    year: 2024,
    ur: '68.5',
    obc: '63.2',
    sc: '54.0',
    st: '49.8',
    ews: '61.5',
    exsm: '40.0',
  });

  const filteredCutoffs = database.cutoffs.filter((c) => {
    const matchesSearch =
      c.examTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.postName.toLowerCase().includes(search.toLowerCase()) ||
      c.cenNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.zoneName.toLowerCase().includes(search.toLowerCase());
    const matchesZone = selectedZone === 'ALL' || c.zoneCode === selectedZone;
    return matchesSearch && matchesZone;
  });

  const handleAddCutoff = (e: React.FormEvent) => {
    e.preventDefault();
    const cutoffsObj: Record<string, number> = {};
    if (form.ur) cutoffsObj.UR = parseFloat(form.ur);
    if (form.obc) cutoffsObj.OBC = parseFloat(form.obc);
    if (form.sc) cutoffsObj.SC = parseFloat(form.sc);
    if (form.st) cutoffsObj.ST = parseFloat(form.st);
    if (form.ews) cutoffsObj.EWS = parseFloat(form.ews);
    if (form.exsm) cutoffsObj.ExSM = parseFloat(form.exsm);

    const newRecord: CutoffRecord = {
      id: `cut-${Date.now()}`,
      cenNumber: form.cenNumber,
      examTitle: form.examTitle,
      zoneCode: form.zoneCode,
      zoneName: form.zoneName,
      postName: form.postName,
      stage: form.stage,
      year: form.year,
      cutoffs: cutoffsObj,
      normalizedScore: true,
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...database,
      cutoffs: [newRecord, ...database.cutoffs],
    };

    saveRRBDatabase(updated);
    setDatabase(updated);
    setShowAddModal(false);
    onSuccessMessage(`Added cut-off score for ${newRecord.postName} (${newRecord.zoneName})`);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete cut-off record for "${title}"?`)) {
      const updated = {
        ...database,
        cutoffs: database.cutoffs.filter((c) => c.id !== id),
      };
      saveRRBDatabase(updated);
      setDatabase(updated);
      onSuccessMessage(`Removed cut-off record`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <span>Cut-off Marks Management ({database.cutoffs.length} Total records)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Category-wise (UR, OBC, SC, ST, EWS, Ex-SM, PwBD) score matrices across all 21 regional RRBs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenPdfPipeline}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <span>Upload Cut-off PDF</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Score</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by post, exam, or CEN..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
        >
          <option value="ALL">All RRB Zones</option>
          {OFFICIAL_RRB_ZONES.map((z) => (
            <option key={z.id} value={z.code}>
              {z.name} ({z.code})
            </option>
          ))}
        </select>
      </div>

      {/* Cutoffs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">CEN / Exam</th>
                <th className="py-3 px-4">Post & Stage</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-2 text-center text-amber-900">UR</th>
                <th className="py-3 px-2 text-center text-amber-900">OBC</th>
                <th className="py-3 px-2 text-center text-amber-900">SC</th>
                <th className="py-3 px-2 text-center text-amber-900">ST</th>
                <th className="py-3 px-2 text-center text-amber-900">EWS</th>
                <th className="py-3 px-2 text-center text-slate-600">Ex-SM</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCutoffs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No Cut-off Marks Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Upload score PDFs via the PDF Pipeline or click "Add Cut-off Record" to add scores.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCutoffs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block w-max">
                        {item.cenNumber}
                      </span>
                      <span className="font-bold text-slate-900 block mt-1">{item.examTitle}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{item.postName}</span>
                      <span className="text-[11px] text-slate-400 block">{item.stage}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.zoneName}</td>
                    <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-900 bg-amber-50/30">
                      {item.cutoffs.UR ?? '--'}
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-900 bg-amber-50/30">
                      {item.cutoffs.OBC ?? '--'}
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-900 bg-amber-50/30">
                      {item.cutoffs.SC ?? '--'}
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-900 bg-amber-50/30">
                      {item.cutoffs.ST ?? '--'}
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-900 bg-amber-50/30">
                      {item.cutoffs.EWS ?? '--'}
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-600">
                      {item.cutoffs.ExSM ?? '--'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id, item.postName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Add Manual Cut-off Score</h3>
            <form onSubmit={handleAddCutoff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CEN Number</label>
                <input
                  type="text"
                  value={form.cenNumber}
                  onChange={(e) => setForm({ ...form, cenNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  value={form.examTitle}
                  onChange={(e) => setForm({ ...form, examTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Post Name</label>
                <input
                  type="text"
                  value={form.postName}
                  onChange={(e) => setForm({ ...form, postName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UR</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.ur}
                    onChange={(e) => setForm({ ...form, ur: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">OBC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.obc}
                    onChange={(e) => setForm({ ...form, obc: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.sc}
                    onChange={(e) => setForm({ ...form, sc: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Save Cut-off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
