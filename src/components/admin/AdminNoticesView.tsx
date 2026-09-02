import React, { useState } from 'react';
import { Bell, Plus, Search, Trash2, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import { FullRRBDatabase, NoticeItem, NoticeCategory } from '../../types';
import { saveRRBDatabase } from '../../utils/storage';
import { firestoreService } from '../../services/firestoreService';
import { dispatchNewDataNotification } from '../../utils/notifications';

interface AdminNoticesViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminNoticesView: React.FC<AdminNoticesViewProps> = ({ database, setDatabase, onSuccessMessage }) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    cenNumber: 'CEN 01/2024',
    category: 'Exam Date' as NoticeCategory,
    contentSummary: '',
    pdfUrl: '',
    isImportant: true,
  });

  const filteredNotices = database.notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.cenNumber && n.cenNumber.toLowerCase().includes(search.toLowerCase())) ||
      n.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingNotice(null);
    setForm({
      title: '',
      cenNumber: 'CEN 01/2024',
      category: 'Exam Date',
      contentSummary: '',
      pdfUrl: '',
      isImportant: true,
    });
    setErrorMessage(null);
    setShowAddModal(true);
  };

  const openEditModal = (notice: NoticeItem) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      cenNumber: notice.cenNumber || 'CEN 01/2024',
      category: notice.category,
      contentSummary: notice.contentSummary || '',
      pdfUrl: notice.pdfUrl || '',
      isImportant: notice.isImportant || false,
    });
    setErrorMessage(null);
    setShowAddModal(true);
  };

  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingNotice) {
        // Edit Notice directly in Cloud Firestore
        const updates: Partial<NoticeItem> = {
          title: form.title.trim(),
          cenNumber: form.cenNumber.trim(),
          category: form.category,
          contentSummary: form.contentSummary.trim(),
          pdfUrl: form.pdfUrl.trim() || undefined,
          isImportant: form.isImportant,
        };

        await firestoreService.updateNotice(editingNotice.id, updates);

        const updatedList = database.notices.map((n) =>
          n.id === editingNotice.id ? { ...n, ...updates } : n
        );
        const updatedDb = { ...database, notices: updatedList };
        setDatabase(updatedDb);
        saveRRBDatabase(updatedDb);

        onSuccessMessage(`Updated notice: "${form.title}" in Cloud Firestore`);
      } else {
        // Create Notice directly in Cloud Firestore
        const newNotice: NoticeItem = {
          id: `not-${Date.now()}`,
          title: form.title.trim(),
          cenNumber: form.cenNumber.trim(),
          zoneCode: 'ALL',
          category: form.category,
          publishDate: new Date().toISOString().split('T')[0],
          isImportant: form.isImportant,
          isNew: true,
          pdfUrl: form.pdfUrl.trim() || undefined,
          contentSummary: form.contentSummary.trim(),
        };

        await firestoreService.createNotice(newNotice);

        const updatedDb = {
          ...database,
          notices: [newNotice, ...database.notices],
        };
        setDatabase(updatedDb);
        saveRRBDatabase(updatedDb);

        dispatchNewDataNotification({
          title: `📢 ${newNotice.title}`,
          message: newNotice.contentSummary || 'New official circular published by Railway Recruitment Board.',
          category: 'notice',
          targetTab: 'notices',
          targetId: newNotice.id,
          badgeText: 'Notice Published',
        });

        onSuccessMessage(`Published new notice to Cloud Firestore: "${newNotice.title}"`);
      }

      setShowAddModal(false);
      setEditingNotice(null);
    } catch (err: any) {
      console.error('Failed to save notice to Firestore:', err);
      setErrorMessage(
        err.code === 'permission-denied'
          ? 'Permission Denied: Administrator role required to publish to Firestore.'
          : err.message || 'Could not save notice to Firestore.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete notice "${title}" from Cloud Firestore permanently?`)) {
      try {
        await firestoreService.deleteNotice(id);
        const updated = {
          ...database,
          notices: database.notices.filter((n) => n.id !== id),
        };
        setDatabase(updated);
        saveRRBDatabase(updated);
        onSuccessMessage(`Removed notice from Firestore`);
      } catch (err: any) {
        console.error('Delete error:', err);
        alert(err.message || 'Failed to delete notice from Cloud Firestore');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-red-600" />
            <span>Official Notices & Circulars ({database.notices.length} Total)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cloud Firestore real-time sync active: edits and publications reflect instantly for all candidates
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Notice</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notice by title, CEN number, or category..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs"
        />
      </div>

      <div className="space-y-3">
        {filteredNotices.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
            <Bell className="w-9 h-9 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Notices Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no official notices matching your search criteria. Click "Add New Notice" to issue a circular in Cloud Firestore.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Notice</span>
            </button>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {notice.cenNumber && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-mono text-[11px] font-bold">
                      {notice.cenNumber}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                    {notice.category}
                  </span>
                  {notice.isImportant && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase">
                      Important
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-medium">📅 {notice.publishDate}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{notice.title}</h3>
                {notice.contentSummary && (
                  <p className="text-xs text-slate-500 line-clamp-2">{notice.contentSummary}</p>
                )}
                {notice.pdfUrl && (
                  <div className="text-[11px] text-blue-600 truncate font-mono">
                    PDF Link: {notice.pdfUrl}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => openEditModal(notice)}
                  className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                  title="Edit notice"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(notice.id, notice.title)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Delete notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingNotice ? 'Edit Notice in Cloud Firestore' : 'Add Official Notice to Cloud Firestore'}
            </h3>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNotice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Schedule of CBT-1 for CEN 01/2024 (ALP)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CEN Number</label>
                  <input
                    type="text"
                    value={form.cenNumber}
                    onChange={(e) => setForm({ ...form, cenNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Exam Date">Exam Date</option>
                    <option value="City Intimation / Admit Card">City Intimation / Admit Card</option>
                    <option value="Answer Key & Objections">Answer Key & Objections</option>
                    <option value="Result & Merit List">Result & Merit List</option>
                    <option value="Corrigendum & Vacancy Revision">Corrigendum & Vacancy</option>
                    <option value="DV & Medical">DV & Medical</option>
                    <option value="General Advisory">General Advisory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PDF URL (Optional)</label>
                <input
                  type="url"
                  value={form.pdfUrl}
                  onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Content Summary</label>
                <textarea
                  rows={3}
                  value={form.contentSummary}
                  onChange={(e) => setForm({ ...form, contentSummary: e.target.value })}
                  placeholder="Short advisory text for candidates..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="noticeImportant"
                  checked={form.isImportant}
                  onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="noticeImportant" className="font-semibold text-slate-700 select-none">
                  Mark as High Priority / Important Notice
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Syncing...' : editingNotice ? 'Save Changes' : 'Publish to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
