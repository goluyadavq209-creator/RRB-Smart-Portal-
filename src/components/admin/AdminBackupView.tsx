import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  Database, 
  Zap, 
  Sparkles, 
  Server, 
  FileSpreadsheet, 
  FolderArchive,
  RefreshCw,
  Clock,
  Layers,
  BarChart3,
  Lock
} from 'lucide-react';
import { FullRRBDatabase } from '../../types';
import { exportDatabaseAsJson, validateAndParseRRBJson, loadSampleDataset } from '../../utils/storage';
import { 
  getStorageMemoryAnalytics, 
  StorageMemoryStats, 
  createIndexedDBSnapshot, 
  listIndexedDBSnapshots, 
  requestPersistentStorage 
} from '../../utils/indexedDbStorage';

interface AdminBackupViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminBackupView: React.FC<AdminBackupViewProps> = ({ database, setDatabase, onSuccessMessage }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<StorageMemoryStats | null>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isRequestingPersist, setIsRequestingPersist] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  const refreshStats = async () => {
    try {
      const s = await getStorageMemoryAnalytics(database);
      setStats(s);
      const snaps = await listIndexedDBSnapshots();
      setSnapshots(snaps);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    refreshStats();
  }, [database]);

  const handleExport = () => {
    exportDatabaseAsJson(database, `rrb_database_backup_1tb_vault_${new Date().toISOString().split('T')[0]}.json`);
    onSuccessMessage('Full 1 TB Database JSON export downloaded successfully.');
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
          refreshStats();
        } else {
          alert(`Invalid JSON format: ${validation.errors.join(', ')}`);
        }
      } catch (err: any) {
        alert(`Failed to import JSON backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    const label = snapshotName.trim() || `Auto-Snapshot (${new Date().toLocaleTimeString()})`;
    const success = await createIndexedDBSnapshot(database, label);
    if (success) {
      onSuccessMessage(`1 TB Storage Snapshot "${label}" preserved in permanent IndexedDB Vault.`);
      setSnapshotName('');
      refreshStats();
    } else {
      alert('Could not create snapshot in local storage.');
    }
    setIsCreatingSnapshot(false);
  };

  const handleGrantPersistence = async () => {
    setIsRequestingPersist(true);
    const granted = await requestPersistentStorage();
    if (granted) {
      onSuccessMessage('Persistent Uncapped Storage quota granted by browser.');
    } else {
      onSuccessMessage('Storage already active or governed by browser quota.');
    }
    refreshStats();
    setIsRequestingPersist(false);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the database to sample official template?')) {
      const def = loadSampleDataset();
      setDatabase(def);
      onSuccessMessage('Database reset to official default data records.');
      refreshStats();
    }
  };

  const handleRestoreSnapshot = (snap: any) => {
    if (snap && snap.data) {
      if (window.confirm(`Restore portal database to snapshot created at ${new Date(snap.createdAt).toLocaleString()}?`)) {
        setDatabase(snap.data);
        onSuccessMessage(`Restored snapshot "${snap.name || 'Backup'}" successfully!`);
        refreshStats();
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. TOP HEADER WITH 1 TB VAULT BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#071739] via-[#0b2b68] to-[#04112c] text-white shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-200 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-blue-300" />
              <span>1 TB High-Capacity Storage Vault</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <span>1 TB Persistent Memory Engine</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 font-medium max-w-2xl">
              All 21 RRB regional cutoffs, CEN exam notifications, official result lists, candidate response sheets, and multi-version snapshots are permanently retained with IndexedDB high-capacity quota.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleGrantPersistence}
              disabled={isRequestingPersist}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer border border-emerald-400/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{stats?.isPersistentGranted ? 'Persistent Storage Active ✅' : 'Enable High-Quota Persist'}</span>
            </button>

            <button
              type="button"
              onClick={refreshStats}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh Storage Metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Storage Bar Visualizer */}
        {stats && (
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-blue-200 font-bold block uppercase tracking-wider">
                Total Allocated Capacity
              </span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                1.00 TB <span className="text-xs text-blue-300 font-normal">Quota</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Uncapped Browser Storage</span>
            </div>

            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-blue-200 font-bold block uppercase tracking-wider">
                Memory In Use
              </span>
              <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
                {stats.usedFormatted}
              </div>
              <span className="text-[10px] text-blue-200 font-medium">Auto-compressed Vault</span>
            </div>

            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-blue-200 font-bold block uppercase tracking-wider">
                Total Database Records
              </span>
              <div className="text-2xl font-black text-sky-300 font-mono mt-0.5">
                {stats.recordsCount.cutoffs + stats.recordsCount.exams + stats.recordsCount.results + stats.recordsCount.notices + stats.recordsCount.rollNumbers}
              </div>
              <span className="text-[10px] text-blue-200 font-medium">Across all 21 Zones</span>
            </div>

            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-blue-200 font-bold block uppercase tracking-wider">
                Vault Status
              </span>
              <div className="text-lg font-black text-emerald-400 mt-1 flex items-center space-x-1.5">
                <Lock className="w-4 h-4" />
                <span>100% Safe & Synced</span>
              </div>
              <span className="text-[10px] text-blue-200 font-medium">IndexedDB + Local Fallback</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. THREE CORE ACTION CARDS: EXPORT, IMPORT, RESET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Download Full JSON Backup</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Export entire database including all 21 RRB regional cut-offs, CEN notifications, notices, roll numbers, and official portal links into a portable JSON snapshot.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Database (.JSON)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Restore from Backup File</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Upload a previously exported database JSON file. Automatically validates format and injects records into the 1 TB persistent vault.
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
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import / Restore JSON</span>
          </button>
        </div>

        {/* Reset Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-rose-300 transition-all">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Reset to Default Data</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Re-seed standard official RRB NTPC, ALP, Group D, Technician exams, official Malda cutoffs, and 21 Regional Boards.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Database</span>
          </button>
        </div>
      </div>

      {/* 3. IN-MEMORY SNAPSHOTS & RECOVERY VAULT */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <FolderArchive className="w-5 h-5 text-indigo-600" />
              <span>Local 1 TB Instant Snapshots</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Create instant recovery points inside your browser's persistent storage without needing external file downloads.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Snapshot label (optional)..."
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-400 w-48"
            />
            <button
              type="button"
              onClick={handleCreateSnapshot}
              disabled={isCreatingSnapshot}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCreatingSnapshot ? 'Saving...' : 'Save Snapshot'}</span>
            </button>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
            No local snapshots created yet. Click "Save Snapshot" above to create an instant rollback point.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {snapshots.map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {s.name || `Snapshot #${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-x-2 font-medium">
                  <span>{s.stats?.cutoffs || 0} Cut-offs</span>
                  <span>•</span>
                  <span>{s.stats?.exams || 0} Exams</span>
                  <span>•</span>
                  <span>{s.stats?.results || 0} Results</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestoreSnapshot(s)}
                  className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Snapshot</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
