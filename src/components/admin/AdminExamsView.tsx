import React, { useState } from 'react';
import { Layers, Plus, Search, Edit3, Trash2, CheckCircle2, FileText, Calendar, Users } from 'lucide-react';
import { FullRRBDatabase, ExamItem, ExamStatus } from '../../types';
import { saveRRBDatabase } from '../../utils/storage';

interface AdminExamsViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminExamsView: React.FC<AdminExamsViewProps> = ({ database, setDatabase, onSuccessMessage }) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);

  const [newExam, setNewExam] = useState<Partial<ExamItem>>({
    cenNumber: 'CEN 02/2025',
    title: '',
    shortCode: 'NTPC-2025',
    department: 'Operating & Commercial',
    status: 'Active Application',
    totalVacancies: 5000,
    applicationStart: new Date().toISOString().split('T')[0],
    applicationEnd: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    examDates: 'TBA',
    eligibility: 'Graduate Degree / 12th Pass',
    payScale: 'Level-2 to Level-6',
    selectionStages: ['CBT-1', 'CBT-2', 'Document Verification'],
    description: '',
  });

  const filteredExams = database.exams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.cenNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.title || !newExam.cenNumber) return;

    const examToAdd: ExamItem = {
      id: `exam-${Date.now()}`,
      cenNumber: newExam.cenNumber || 'CEN 01/2025',
      title: newExam.title,
      shortCode: newExam.shortCode || 'EXAM',
      department: newExam.department || 'Indian Railways',
      status: (newExam.status as ExamStatus) || 'Active Application',
      totalVacancies: Number(newExam.totalVacancies) || 1000,
      applicationStart: newExam.applicationStart,
      applicationEnd: newExam.applicationEnd,
      examDates: newExam.examDates,
      eligibility: newExam.eligibility,
      payScale: newExam.payScale,
      selectionStages: ['CBT-1', 'CBT-2', 'DV & Medical'],
      description: newExam.description,
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...database,
      exams: [examToAdd, ...database.exams],
    };

    saveRRBDatabase(updated);
    setDatabase(updated);
    setShowAddModal(false);
    onSuccessMessage(`Added CEN Exam: "${examToAdd.title}"`);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete exam "${title}"?`)) {
      const updated = {
        ...database,
        exams: database.exams.filter((e) => e.id !== id),
      };
      saveRRBDatabase(updated);
      setDatabase(updated);
      onSuccessMessage(`Removed exam: "${title}"`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-red-600" />
            <span>Exams Management ({database.exams.length} Active recruitments)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure CEN notices, stages, vacancy distribution, application windows & syllabus
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exam or CEN..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Exam</span>
          </button>
        </div>
      </div>

      {/* Exams Table / Cards */}
      {filteredExams.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
          <Layers className="w-9 h-9 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Recruitment Exams Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your database is currently empty and clean. Click "Add New Exam" to register an official CEN recruitment.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Exam</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-900 border border-amber-500/30 text-xs font-bold font-mono">
                  {exam.cenNumber}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    exam.status === 'Active Application'
                      ? 'bg-emerald-100 text-emerald-800'
                      : exam.status === 'Exam Underway'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {exam.status}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900">{exam.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{exam.department} • {exam.payScale}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Vacancies</span>
                  <span className="font-bold text-slate-900">{exam.totalVacancies?.toLocaleString() || 'N/A'} Posts</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Eligibility</span>
                  <span className="font-semibold text-slate-800 truncate block">{exam.eligibility || 'Graduate'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400">Stages: {exam.selectionStages?.join(' → ')}</span>
                <button
                  onClick={() => handleDelete(exam.id, exam.title)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Add New CEN Recruitment Exam</h3>

            <form onSubmit={handleSaveExam} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CEN Number</label>
                <input
                  type="text"
                  value={newExam.cenNumber}
                  onChange={(e) => setNewExam({ ...newExam, cenNumber: e.target.value })}
                  placeholder="CEN 01/2025"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="e.g. RRB Non-Technical Popular Categories (NTPC)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Vacancies</label>
                  <input
                    type="number"
                    value={newExam.totalVacancies}
                    onChange={(e) => setNewExam({ ...newExam, totalVacancies: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={newExam.status}
                    onChange={(e) => setNewExam({ ...newExam, status: e.target.value as ExamStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Active Application">Active Application</option>
                    <option value="Exam Underway">Exam Underway</option>
                    <option value="Results Announced">Results Announced</option>
                  </select>
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
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
