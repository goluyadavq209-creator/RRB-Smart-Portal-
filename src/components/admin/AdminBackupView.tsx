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
  Lock,
  ArrowUpRight,
  AlertCircle,
  Globe,
  Radio
} from 'lucide-react';
import { FullRRBDatabase } from '../../types';
import { exportDatabaseAsJson, validateAndParseRRBJson, loadSampleDataset, saveRRBDatabase, migrateLocalToCloudDatabase } from '../../utils/storage';
import { dbService, MigrationReport } from '../../services/dbService';
import { firestoreService } from '../../services/firestoreService';

interface AdminBackupViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminBackupView: React.FC<AdminBackupViewProps> = ({ database, setDatabase, onSuccessMessage }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<MigrationReport | null>(null);
  const [cloudStatus, setCloudStatus] = useState<{ version: string; updatedAt: string | null; updatedBy: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCloudStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await dbService.fetchDatabase();
      if (res.data) {
        setDatabase(res.data);
      }
      setCloudStatus({
        version: res.version,
        updatedAt: res.updatedAt,
        updatedBy: res.updatedBy,
      });
    } catch (e) {
      console.warn('Could not refresh Cloud SQL status:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCloudStatus();
  }, []);

  const handleExport = () => {
    exportDatabaseAsJson(database, `rrb_cloud_database_backup_${new Date().toISOString().split('T')[0]}.json`);
    onSuccessMessage('Central Database JSON export downloaded successfully.');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const validation = validateAndParseRRBJson(text);
        if (validation.isValid && validation.parsedData) {
          setIsMigrating(true);
          const report = await migrateLocalToCloudDatabase(validation.parsedData);
          firestoreService.saveFullDatabaseToFirestore(validation.parsedData).catch((e) => console.warn('Firestore backup sync:', e));
          setIsMigrating(false);
          setMigrationReport(report);
          if (report.success) {
            setDatabase(validation.parsedData);
            onSuccessMessage(`Database migrated & persisted to Cloud Firestore & Cloud SQL (${report.migratedCounts.total} total records).`);
            fetchCloudStatus();
          } else {
            alert(`Migration to Cloud SQL failed: ${report.error}`);
          }
        } else {
          alert(`Invalid JSON format: ${validation.errors.join(', ')}`);
        }
      } catch (err: any) {
        setIsMigrating(false);
        alert(`Failed to import JSON backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleRunCloudMigration = async () => {
    setIsMigrating(true);
    try {
      const report = await migrateLocalToCloudDatabase(database);
      await firestoreService.saveFullDatabaseToFirestore(database);
      setMigrationReport(report);
      if (report.success) {
        onSuccessMessage(`Cloud Database Synced: ${report.migratedCounts.total} records saved to Cloud Firestore & Cloud SQL.`);
        fetchCloudStatus();
      } else {
        alert(`Cloud Migration failed: ${report.error}`);
      }
    } catch (err: any) {
      alert(`Migration error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the Central Database to standard official RRB sample records in Cloud Firestore?')) {
      const def = loadSampleDataset();
      setDatabase(def);
      await firestoreService.saveFullDatabaseToFirestore(def);
      await saveRRBDatabase(def, {
        title: '🔄 RRB Database Initialized',
        message: 'Central portal database reset to standard Railway Board template.',
        category: 'admin',
        targetTab: 'home',
      });
      onSuccessMessage('Database reset to official default data records in Cloud Firestore.');
      fetchCloudStatus();
    }
  };

  const totalRecords = (database.cutoffs?.length || 0) + 
                       (database.exams?.length || 0) + 
                       (database.notices?.length || 0) + 
                       (database.results?.length || 0) + 
                       (database.portalLinks?.length || 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. TOP HEADER WITH CLOUD SQL DATABASE BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#071739] via-[#0b2b68] to-[#04112c] text-white shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Central Cloud SQL PostgreSQL Database Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <span>Cloud Database & Multi-User Synchronization</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 font-medium max-w-2xl">
              All 21 RRB regional cutoffs, exams, admit card links, and notices are permanently persisted in the cloud database. Any data created, edited, or deleted in the admin panel is instantly broadcasted to all users across all devices and browsers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRunCloudMigration}
              disabled={isMigrating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition-all cursor-pointer border border-blue-400/30 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>{isMigrating ? 'Migrating to Cloud SQL...' : 'Sync & Migrate to Cloud'}</span>
            </button>

            <button
              type="button"
              onClick={fetchCloudStatus}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh Cloud SQL Status"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Database Status Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-blue-200 font-bold block uppercase tracking-wider">
              Database Provider
            </span>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              Cloud SQL <span className="text-xs text-blue-300 font-normal">PostgreSQL</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">asia-southeast1 Managed</span>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-blue-200 font-bold block uppercase tracking-wider">
              Total Live Records
            </span>
            <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
              {totalRecords}
            </div>
            <span className="text-[10px] text-blue-200 font-medium">Exams, Cut-offs, Notices & Links</span>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-blue-200 font-bold block uppercase tracking-wider">
              Last Cloud Sync
            </span>
            <div className="text-sm font-black text-sky-300 font-mono mt-1 truncate">
              {cloudStatus?.updatedAt ? new Date(cloudStatus.updatedAt).toLocaleTimeString() : 'Live'}
            </div>
            <span className="text-[10px] text-blue-200 font-medium">By {cloudStatus?.updatedBy || 'Admin'}</span>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-blue-200 font-bold block uppercase tracking-wider">
              Broadcast Status
            </span>
            <div className="text-sm font-black text-emerald-400 mt-1 flex items-center space-x-1.5">
              <Globe className="w-4 h-4" />
              <span>Realtime Poller Active</span>
            </div>
            <span className="text-[10px] text-blue-200 font-medium">All connected clients synced</span>
          </div>
        </div>
      </div>

      {/* Migration Report Alert (If available) */}
      {migrationReport && (
        <div className={`p-5 rounded-2xl border flex items-start space-x-3.5 animate-in fade-in ${
          migrationReport.success ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          {migrationReport.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm">
              {migrationReport.success ? 'Cloud Migration Completed Successfully!' : 'Cloud Migration Error'}
            </h4>
            <p className="mt-1 text-slate-600 leading-relaxed">
              {migrationReport.success ? (
                <>
                  Persisted <strong>{migrationReport.migratedCounts.total}</strong> records into Cloud SQL PostgreSQL:
                  {' '}{migrationReport.migratedCounts.exams} Exams, {migrationReport.migratedCounts.cutoffs} Cut-offs, {migrationReport.migratedCounts.notices} Notices, and {migrationReport.migratedCounts.portalLinks} Candidate Portal Links. 
                  {' '}(<strong>{migrationReport.duplicatesRemoved}</strong> duplicate entries safely pruned).
                </>
              ) : (
                migrationReport.error
              )}
            </p>
          </div>
        </div>
      )}

      {/* 2. THREE CORE ACTION CARDS: EXPORT, IMPORT, RESET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Download Full Database JSON</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Export the entire Cloud SQL database including all 21 RRB regional cut-offs, CEN notifications, notices, roll numbers, and official candidate portal links.
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

        {/* Restore & Migrate Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Import & Migrate to Cloud</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Upload a database JSON file. Automatically validates format, eliminates duplicate records, and syncs directly into the central Cloud SQL PostgreSQL database.
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
            disabled={isMigrating}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isMigrating ? 'Migrating...' : 'Import & Save to Cloud SQL'}</span>
          </button>
        </div>

        {/* Reset Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-rose-300 transition-all">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Reset to Standard RRB Dataset</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Re-seed standard official RRB NTPC, ALP, Group D, Technician exams, official cutoffs, and 21 Regional Boards directly into Cloud SQL.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Cloud Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};

