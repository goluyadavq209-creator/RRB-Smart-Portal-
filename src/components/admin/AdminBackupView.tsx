import React, { useRef } from 'react';
import { HardDrive, Download, Upload, Trash2, RotateCcw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { FullRRBDatabase } from '../../types';
import { exportDatabaseAsJson, validateAndParseRRBJson, clearRRBDatabase, loadSampleDataset } from '../../utils/storage';

interface AdminBackupViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminBackupView: React.FC<AdminBackupViewProps> = ({ database, setDatabase, onSuccessMessage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportDatabaseAsJson(database, `rrb_database_backup_${new Date().toISOString().split('T')[0]}.json`);
    onSuccessMessage('Full database JSON export initiated');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validation = validateAndParseRRBJson(text);
        if (validation.isValid && validation.parsedData) {
          setDatabase(validation.parsedData);
          onSuccessMessage(`Database restored successfully (${validation.parsedData.cutoffs.length} cutoffs, ${validation.parsedData.exams.length} exams).`);
        } else {
          alert(`Invalid JSON format: ${validation.errors.join(', ')}`);
        }
      } catch (err: any) {
        alert(`Failed to import JSON backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the database to sample official template?')) {
      const def = loadSampleDataset();
      setDatabase(def);
      onSuccessMessage('Database reset to official default data records.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-red-600" />
          <span>Database Backup, Export & System Restore</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Download snapshot copies of all 21 RRB regional cutoffs, exams, results & audit records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Download Full JSON Backup</h3>
            <p className="text-slate-500 text-xs">
              Export entire database including all cut-offs, CEN exams, notices, and zone links into a single portable `.json` file.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Database (.JSON)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Restore from Backup File</h3>
            <p className="text-slate-500 text-xs">
              Upload a previously exported database JSON file to restore the portal state immediately.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Import / Restore JSON</span>
          </button>
        </div>

        {/* Reset Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Reset to Default Data</h3>
            <p className="text-slate-500 text-xs">
              Re-seed standard official RRB NTPC, ALP, Group D, Technician exams and 21 Regional Boards.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
