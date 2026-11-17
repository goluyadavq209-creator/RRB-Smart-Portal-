import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Save, 
  Layers, 
  RefreshCw,
  Eye,
  AlertTriangle,
  FileUp,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { FullRRBDatabase, ResultItem, ResultType } from '../../types';
import { OFFICIAL_RRB_ZONES } from '../../data/defaultData';
import { saveRRBDatabase } from '../../utils/storage';

interface AdminRollNumbersViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminRollNumbersView: React.FC<AdminRollNumbersViewProps> = ({
  database,
  setDatabase,
  onSuccessMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResultId, setSelectedResultId] = useState<string>('new');
  
  // Form fields
  const [cenNumber, setCenNumber] = useState('CEN 06/2025');
  const [examTitle, setExamTitle] = useState('Non-Technical Popular Categories (Graduate) - NTPC');
  const [zoneCode, setZoneCode] = useState('ALL');
  const [stage, setStage] = useState('CBT-2 Result & Shortlist for CBAT/CBTST');
  const [resultType, setResultType] = useState<ResultType>('Merit List PDF');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [fileUrl, setFileUrl] = useState('');
  const [instructions, setInstructions] = useState('Candidates shortlisted for the next stage based on computer-based test merit.');
  const [isNextStageEligible, setIsNextStageEligible] = useState(true);
  const [nextStageTitle, setNextStageTitle] = useState('CBAT / CBTST Examination & Document Verification');

  // Input Roll Numbers state
  const [rawText, setRawText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedRolls, setExtractedRolls] = useState<string[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [duplicateList, setDuplicateList] = useState<string[]>([]);
  const [validationStats, setValidationStats] = useState<{
    totalRaw: number;
    uniqueValid: number;
    duplicates: number;
    invalidFormat: number;
  } | null>(null);

  // Edit Modal State
  const [editingResult, setEditingResult] = useState<ResultItem | null>(null);
  const [editRollsText, setEditRollsText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse raw text or list into validated deduplicated roll numbers
  const processRollNumbers = (input: string) => {
    if (!input.trim()) {
      setExtractedRolls([]);
      setDuplicateCount(0);
      setDuplicateList([]);
      setValidationStats(null);
      return;
    }

    // Split by comma, whitespace, newline, tab, semicolon
    const tokens = input
      .split(/[\s,;\n\r\t]+/)
      .map((t) => t.trim().replace(/['"]/g, ''))
      .filter(Boolean);

    const validRollRegex = /^[0-9A-Za-z]{6,20}$/;
    const validTokens = tokens.filter((t) => validRollRegex.test(t));
    const invalidCount = tokens.length - validTokens.length;

    // Detect duplicates
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const uniqueRolls: string[] = [];

    validTokens.forEach((roll) => {
      const normalized = roll.toUpperCase();
      if (seen.has(normalized)) {
        duplicates.push(roll);
      } else {
        seen.add(normalized);
        uniqueRolls.push(roll);
      }
    });

    setExtractedRolls(uniqueRolls);
    setDuplicateCount(duplicates.length);
    setDuplicateList(duplicates.slice(0, 50));
    setValidationStats({
      totalRaw: tokens.length,
      uniqueValid: uniqueRolls.length,
      duplicates: duplicates.length,
      invalidFormat: invalidCount,
    });
  };

  // Handle CSV / Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    try {
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setRawText(text);
        processRollNumbers(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        let combinedText = '';

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          json.forEach((row: any) => {
            if (Array.isArray(row)) {
              combinedText += ' ' + row.join(' ');
            }
          });
        });

        setRawText(combinedText);
        processRollNumbers(combinedText);
      }
    } catch (err: any) {
      alert('Error parsing uploaded file: ' + err.message);
    }
  };

  // Handle Save / Publish Roll Numbers List
  const handleSaveRollList = (e: React.FormEvent) => {
    e.preventDefault();
    if (extractedRolls.length === 0) {
      alert('Please provide at least 1 valid roll number.');
      return;
    }

    const zoneObj = OFFICIAL_RRB_ZONES.find((z) => z.code === zoneCode);
    const zoneName = zoneCode === 'ALL' ? 'All Regional RRBs' : zoneObj?.name || `RRB ${zoneCode}`;

    if (selectedResultId === 'new') {
      // Create new Result Item
      const newResult: ResultItem = {
        id: `res-${Date.now()}`,
        cenNumber: cenNumber.trim() || 'CEN Official',
        examTitle: examTitle.trim() || 'RRB Centralized Exam',
        zoneCode: zoneCode,
        zoneName: zoneName,
        stage: stage.trim() || 'Shortlist Panel',
        publishDate: publishDate || new Date().toISOString().split('T')[0],
        type: resultType,
        fileUrl: fileUrl.trim() || undefined,
        totalSelectedCandidates: extractedRolls.length,
        rollNumbersSample: extractedRolls,
        instructions: instructions.trim() || undefined,
        isNextStageEligible: isNextStageEligible,
        nextStageTitle: nextStageTitle.trim() || undefined,
      };

      const updatedResults = [newResult, ...database.results];
      const updatedDb: FullRRBDatabase = {
        ...database,
        results: updatedResults,
        metadata: {
          ...database.metadata,
          lastUpdated: new Date().toISOString(),
          notes: `Added roll number panel with ${extractedRolls.length} candidates (${cenNumber})`,
        },
      };

      setDatabase(updatedDb);
      saveRRBDatabase(updatedDb);
      onSuccessMessage(`Successfully published ${extractedRolls.length} verified roll numbers for ${cenNumber}!`);
    } else {
      // Update existing Result Item
      const updatedResults = database.results.map((res) => {
        if (res.id === selectedResultId) {
          // Merge or replace
          const mergedRolls = Array.from(new Set([...(res.rollNumbersSample || []), ...extractedRolls]));
          return {
            ...res,
            totalSelectedCandidates: mergedRolls.length,
            rollNumbersSample: mergedRolls,
            isNextStageEligible: isNextStageEligible,
            nextStageTitle: nextStageTitle.trim() || res.nextStageTitle,
          };
        }
        return res;
      });

      const updatedDb: FullRRBDatabase = {
        ...database,
        results: updatedResults,
      };

      setDatabase(updatedDb);
      saveRRBDatabase(updatedDb);
      onSuccessMessage(`Updated result panel with ${extractedRolls.length} additional verified roll numbers!`);
    }

    // Reset Form
    setRawText('');
    setExtractedRolls([]);
    setValidationStats(null);
    setUploadedFileName(null);
  };

  // Export to CSV
  const handleExportCsv = (result: ResultItem) => {
    if (!result.rollNumbersSample || result.rollNumbersSample.length === 0) {
      alert('No roll numbers in this panel to export.');
      return;
    }

    const rows = result.rollNumbersSample.map((roll, idx) => ({
      'S.No': idx + 1,
      'Roll Number': roll,
      'CEN': result.cenNumber,
      'Exam': result.examTitle,
      'Zone': result.zoneName,
      'Stage': result.stage,
      'Eligibility': result.isNextStageEligible !== false ? 'ELIGIBLE' : 'NOT ELIGIBLE',
      'Next Stage': result.nextStageTitle || 'Next Step',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RollNumbers');
    XLSX.writeFile(workbook, `${result.cenNumber}_${result.zoneCode}_RollNumbers.csv`);
  };

  // Delete Result Panel
  const handleDeleteResult = (id: string) => {
    if (confirm('Are you sure you want to delete this roll number result panel?')) {
      const updatedResults = database.results.filter((r) => r.id !== id);
      const updatedDb: FullRRBDatabase = {
        ...database,
        results: updatedResults,
      };
      setDatabase(updatedDb);
      saveRRBDatabase(updatedDb);
      onSuccessMessage('Roll number panel deleted.');
    }
  };

  // Save Edit modal
  const handleSaveEdit = () => {
    if (!editingResult) return;
    const rolls = editRollsText
      .split(/[\s,;\n\r\t]+/)
      .map((r) => r.trim())
      .filter(Boolean);

    const uniqueRolls = Array.from(new Set(rolls));

    const updatedResults = database.results.map((r) => {
      if (r.id === editingResult.id) {
        return {
          ...r,
          totalSelectedCandidates: uniqueRolls.length,
          rollNumbersSample: uniqueRolls,
        };
      }
      return r;
    });

    const updatedDb: FullRRBDatabase = {
      ...database,
      results: updatedResults,
    };

    setDatabase(updatedDb);
    saveRRBDatabase(updatedDb);
    setEditingResult(null);
    onSuccessMessage('Updated roll numbers in panel.');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Roll Numbers & Merit Panel List Management
            </h2>
            <p className="text-xs text-slate-500">
              Upload CSV, Excel, or Text files to update verified roll numbers for the Direct Verification Tool.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload / Add Rolls
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manage' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Panels ({database.results.length})
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        /* UPLOAD & ADD FORM */
        <form onSubmit={handleSaveRollList} className="space-y-5">
          {/* Target Panel Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>1. Target Examination & Shortlist Panel</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Action</label>
                <select
                  value={selectedResultId}
                  onChange={(e) => setSelectedResultId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="new">+ Create New Merit Panel / Result Entry</option>
                  {database.results.map((r) => (
                    <option key={r.id} value={r.id}>
                      Update: {r.cenNumber} - {r.examTitle} ({r.zoneName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">CEN Number</label>
                <input
                  type="text"
                  required
                  value={cenNumber}
                  onChange={(e) => setCenNumber(e.target.value)}
                  placeholder="e.g. CEN 06/2025"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Regional RRB Zone</label>
                <select
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ALL">All Regional RRBs</option>
                  {OFFICIAL_RRB_ZONES.map((z) => (
                    <option key={z.code} value={z.code}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. Non-Technical Popular Categories (Graduate)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Stage / Panel Name</label>
                <input
                  type="text"
                  required
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  placeholder="e.g. CBT-2 Shortlist for CBAT"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Next Stage Eligibility Setting */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-950">Next Stage Eligibility Configuration</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNextStageEligible}
                    onChange={(e) => setIsNextStageEligible(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-xs text-emerald-900">Mark candidates as ELIGIBLE for next step</span>
                </label>
              </div>

              <div>
                <label className="font-bold text-emerald-900 block mb-1">Next Stage Description / Title</label>
                <input
                  type="text"
                  value={nextStageTitle}
                  onChange={(e) => setNextStageTitle(e.target.value)}
                  placeholder="e.g. CBAT & CBTST Examination (Tentatively Sept 2026)"
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs"
                />
                <p className="text-[11px] text-emerald-700 mt-1">
                  * Note: “Congratulations! You are eligible for the next step” will only be shown if this is marked verified and eligible.
                </p>
              </div>
            </div>
          </div>

          {/* File Upload or Bulk Paste */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>2. Upload CSV / Excel / Text File or Paste Roll Numbers</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-50/70 hover:bg-amber-50/30 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                  <FileUp className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    Click to select CSV, Excel (.xlsx, .xls), or TXT
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Supports files with hundreds or thousands of candidate roll numbers
                  </p>
                </div>
                {uploadedFileName && (
                  <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                    Selected: {uploadedFileName}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Text Area */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Or Paste Roll Numbers Here:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      processRollNumbers('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600"
                  >
                    Clear Text
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    processRollNumbers(e.target.value);
                  }}
                  placeholder="Paste roll numbers separated by commas, spaces, or new lines...
Example:
1962511100562555
1962511101227480
1962511101230650"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* DUPLICATE & VALIDATION STATS */}
            {validationStats && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Real-Time Roll Number Validation & Deduplication Engine</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Automatic duplicate removal active
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Total Raw Tokens</div>
                    <div className="text-base font-black text-white">{validationStats.totalRaw}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50">
                    <div className="text-emerald-300 text-[10px]">Unique Valid Numbers</div>
                    <div className="text-base font-black text-emerald-400">{validationStats.uniqueValid}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50">
                    <div className="text-amber-300 text-[10px]">Duplicates Detected</div>
                    <div className="text-base font-black text-amber-400">{validationStats.duplicates}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Filtered Non-Numeric</div>
                    <div className="text-base font-black text-slate-300">{validationStats.invalidFormat}</div>
                  </div>
                </div>

                {duplicateCount > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                    <div className="font-bold flex items-center space-x-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{duplicateCount} duplicate roll numbers were automatically consolidated:</span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-300/80 truncate">
                      {duplicateList.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={extractedRolls.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish Verified Roll Numbers ({extractedRolls.length})</span>
            </button>
          </div>
        </form>
      ) : (
        /* MANAGE EXISTING PANELS */
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search existing results, CEN, or Roll Number in database..."
              className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-xl text-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <div className="space-y-3">
            {database.results
              .filter((r) => {
                const q = searchQuery.toLowerCase();
                return (
                  !q ||
                  r.examTitle.toLowerCase().includes(q) ||
                  r.cenNumber.toLowerCase().includes(q) ||
                  r.zoneName.toLowerCase().includes(q) ||
                  (r.rollNumbersSample && r.rollNumbersSample.some((roll) => roll.includes(q)))
                );
              })
              .map((res) => (
                <div
                  key={res.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                        {res.cenNumber}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{res.examTitle}</span>
                      <span className="text-xs text-slate-500">({res.zoneName})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span>Stage: <strong>{res.stage}</strong></span>
                      <span>Total Rolls: <strong>{res.totalSelectedCandidates || res.rollNumbersSample?.length || 0}</strong></span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        res.isNextStageEligible !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {res.isNextStageEligible !== false ? 'Eligible for Next Step' : 'Non-Qualified List'}
                      </span>
                    </div>

                    {res.rollNumbersSample && res.rollNumbersSample.length > 0 && (
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-xl">
                        Sample: {res.rollNumbersSample.slice(0, 8).join(', ')}...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleExportCsv(res)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingResult(res);
                        setEditRollsText(res.rollNumbersSample ? res.rollNumbersSample.join('\n') : '');
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Rolls</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteResult(res.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Edit Roll Numbers: {editingResult.examTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingResult.cenNumber} • {editingResult.zoneName}
                </p>
              </div>
              <button
                onClick={() => setEditingResult(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              <label className="font-bold text-xs text-slate-700 block">
                Roll Numbers (One per line or comma separated):
              </label>
              <textarea
                rows={12}
                value={editRollsText}
                onChange={(e) => setEditRollsText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingResult(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
