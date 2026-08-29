import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Copy, 
  Check, 
  Printer, 
  Share2, 
  Sparkles, 
  Sun, 
  Award, 
  Calendar, 
  Building2, 
  Layers, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  ListFilter,
  CheckCheck,
  Clock,
  ArrowRight,
  AlertTriangle,
  Upload,
  FileCheck,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FullRRBDatabase, ResultItem, TabView } from '../types';
import { searchRollNumberInPdf, PdfRollSearchResult } from '../utils/pdfExtractor';
import { PdfViewerModal } from './PdfViewerModal';

interface DirectRollNumberVerifierProps {
  database: FullRRBDatabase;
  onOpenFullPanelModal?: (result: ResultItem) => void;
  setCurrentTab?: (tab: TabView) => void;
  compactMode?: boolean;
}

export interface VerificationResultState {
  searched: boolean;
  query: string;
  timestamp: string;
  sourceType: 'database' | 'pdf_file';
  matchedResults: {
    result?: ResultItem;
    matchedRoll: string;
    isEligible: boolean;
    nextStage: string;
    pdfDetails?: {
      fileName: string;
      pageNumber: number;
      totalPages: number;
      snippet?: string;
      detectedCen?: string;
      detectedZone?: string;
      detectedExamTitle?: string;
    };
  }[];
  pdfScanSummary?: {
    fileName: string;
    totalPages: number;
    totalRollNumbersFound: number;
  };
}

export const DirectRollNumberVerifier: React.FC<DirectRollNumberVerifierProps> = ({
  database,
  onOpenFullPanelModal,
  setCurrentTab,
  compactMode = false,
}) => {
  const [activeMode, setActiveMode] = useState<'database' | 'pdf'>('database');
  const [rollInput, setRollInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedRoll, setCopiedRoll] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);
  
  // PDF Mode State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedPresetPdfUrl, setSelectedPresetPdfUrl] = useState<string>('');
  const [pdfScanProgress, setPdfScanProgress] = useState<{ current: number; total: number } | null>(null);
  const [activePdfModal, setActivePdfModal] = useState<{ title: string; source: string | File } | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const [verificationState, setVerificationState] = useState<VerificationResultState>({
    searched: false,
    query: '',
    timestamp: '',
    sourceType: 'database',
    matchedResults: [],
  });

  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#fbbf24', '#34d399'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#fbbf24', '#34d399'],
        });
      }, 250);
    } catch {
      // Confetti fallback
    }
  };

  const getFormattedTimestamp = () => {
    const now = new Date();
    return `${now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}, ${now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })} IST`;
  };

  // 1. Verify Online against Database
  const handleVerifyDatabase = (targetRoll?: string) => {
    const cleanRoll = (targetRoll || rollInput).trim();
    if (!cleanRoll) return;

    setIsVerifying(true);

    setTimeout(() => {
      const formattedTimestamp = getFormattedTimestamp();
      const matches: VerificationResultState['matchedResults'] = [];

      database.results.forEach((res) => {
        if (res.rollNumbersSample && res.rollNumbersSample.length > 0) {
          const exact = res.rollNumbersSample.find(
            (r) => r.trim().toLowerCase() === cleanRoll.toLowerCase()
          );
          if (exact) {
            const isEligible = res.isNextStageEligible !== false;
            const nextStage = res.nextStageTitle || (isEligible ? 'You are eligible for the next step.' : 'Non-Qualified in this Stage');
            matches.push({
              result: res,
              matchedRoll: exact,
              isEligible,
              nextStage,
            });
          } else {
            const partial = res.rollNumbersSample.find(
              (r) => r.trim().toLowerCase().includes(cleanRoll.toLowerCase())
            );
            if (partial && cleanRoll.length >= 6) {
              const isEligible = res.isNextStageEligible !== false;
              const nextStage = res.nextStageTitle || (isEligible ? 'You are eligible for the next step.' : 'Non-Qualified in this Stage');
              matches.push({
                result: res,
                matchedRoll: partial,
                isEligible,
                nextStage,
              });
            }
          }
        }
      });

      const newState: VerificationResultState = {
        searched: true,
        query: cleanRoll,
        timestamp: formattedTimestamp,
        sourceType: 'database',
        matchedResults: matches,
      };

      setVerificationState(newState);
      setIsVerifying(false);

      if (matches.length > 0) {
        triggerConfetti();
      }

      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }, 350);
  };

  // 2. Verify Directly from PDF File
  const handleVerifyPdf = async (targetRoll?: string, overridePdf?: File | string) => {
    const cleanRoll = (targetRoll || rollInput).trim();
    const pdfSource = overridePdf || selectedPdfFile || selectedPresetPdfUrl;

    if (!cleanRoll) return;
    if (!pdfSource) {
      alert('Please upload or select an RRB Result PDF file first.');
      return;
    }

    setIsVerifying(true);
    setPdfScanProgress({ current: 1, total: 1 });

    const fileName = selectedPdfFile 
      ? selectedPdfFile.name 
      : (typeof pdfSource === 'string' ? 'Official_RRB_Result_Panel.pdf' : 'RRB_Result.pdf');

    try {
      const searchResult: PdfRollSearchResult = await searchRollNumberInPdf(
        pdfSource,
        fileName,
        cleanRoll,
        (current, total) => {
          setPdfScanProgress({ current, total });
        }
      );

      const formattedTimestamp = getFormattedTimestamp();
      const matches: VerificationResultState['matchedResults'] = [];

      if (searchResult.found) {
        matches.push({
          matchedRoll: searchResult.matchedRoll || cleanRoll,
          isEligible: true,
          nextStage: searchResult.detectedStage || 'Selected for Next Stage • You are qualified and eligible for the next step.',
          pdfDetails: {
            fileName: searchResult.fileName,
            pageNumber: searchResult.pageNumber || 1,
            totalPages: searchResult.totalPages,
            snippet: searchResult.snippet,
            detectedCen: searchResult.detectedCen,
            detectedZone: searchResult.detectedZone,
            detectedExamTitle: searchResult.detectedExamTitle,
          },
        });
      }

      setVerificationState({
        searched: true,
        query: cleanRoll,
        timestamp: formattedTimestamp,
        sourceType: 'pdf_file',
        matchedResults: matches,
        pdfScanSummary: {
          fileName: searchResult.fileName,
          totalPages: searchResult.totalPages,
          totalRollNumbersFound: searchResult.totalRollNumbersInPdf,
        },
      });

      if (matches.length > 0) {
        triggerConfetti();
      }

      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      console.error('PDF Roll search error:', err);
      alert('Error searching PDF: ' + (err?.message || 'Failed to read PDF pages'));
    } finally {
      setIsVerifying(false);
      setPdfScanProgress(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeMode === 'database') {
      handleVerifyDatabase();
    } else {
      handleVerifyPdf();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF file.');
        return;
      }
      setSelectedPdfFile(file);
      setSelectedPresetPdfUrl('');
      if (verificationState.searched) {
        setVerificationState((prev) => ({ ...prev, searched: false }));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedPdfFile(file);
        setSelectedPresetPdfUrl('');
        if (verificationState.searched) {
          setVerificationState((prev) => ({ ...prev, searched: false }));
        }
      } else {
        alert('Please drop an official PDF document.');
      }
    }
  };

  const handleCopyRoll = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRoll(text);
      setTimeout(() => setCopiedRoll(null), 2500);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleShareSlip = () => {
    if (!verificationState.searched || verificationState.matchedResults.length === 0) return;
    const match = verificationState.matchedResults[0];
    const examName = match.result?.examTitle || match.pdfDetails?.detectedExamTitle || 'Railway Recruitment Examination';
    const cenNum = match.result?.cenNumber || match.pdfDetails?.detectedCen || 'CEN 2024-2026';
    const zoneName = match.result?.zoneName || match.pdfDetails?.detectedZone || 'Regional RRB Board';
    const locationInfo = match.pdfDetails ? `\nFound in PDF: ${match.pdfDetails.fileName} (Page ${match.pdfDetails.pageNumber} of ${match.pdfDetails.totalPages})` : '';

    const text = `🎉 RRB Roll Number Verification Slip\n\nVerified Roll Number: ${match.matchedRoll}\nStatus: VERIFIED (Selected for Next Stage)\nNext Stage: ${match.nextStage}\nExam: ${examName} (${cenNum})\nZone: ${zoneName}${locationInfo}\nVerified At: ${verificationState.timestamp}\n\nVerified via Official RRB Smart Portal.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  // Find sample roll number from database if available
  const sampleRollFromDb = database.results.find((r) => r.rollNumbersSample && r.rollNumbersSample.length > 0)?.rollNumbersSample?.[0] || '1962511100562555';

  // Available result PDFs with roll samples in database
  const availableResultPdfs = database.results.filter(
    (r) => r.rollNumbersSample && r.rollNumbersSample.length > 0
  );

  return (
    <div className="space-y-4">
      {/* Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">Verification slip copied to clipboard!</span>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {activePdfModal && (
        <PdfViewerModal
          isOpen={true}
          onClose={() => setActivePdfModal(null)}
          title={activePdfModal.title}
          pdfSource={activePdfModal.source}
        />
      )}

      {/* Main Tool Card */}
      <div className="bg-gradient-to-br from-[#0c142b] via-[#101c40] to-[#080d20] rounded-3xl p-5 sm:p-7 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Roll Number Check
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    डायरेक्ट रोल नंबर चेक • Online & PDF
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Check eligibility instantly online or directly search your Roll Number inside official RRB Result PDF files.
                </p>
              </div>
            </div>

            {/* Quick Test Sample */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Quick Test:</span>
              <button
                type="button"
                onClick={() => {
                  setRollInput(sampleRollFromDb);
                  setActiveMode('database');
                  handleVerifyDatabase(sampleRollFromDb);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Real Roll ({sampleRollFromDb.slice(0, 8)}...)</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md">
            <button
              type="button"
              onClick={() => {
                setActiveMode('database');
                if (verificationState.searched && verificationState.sourceType !== 'database') {
                  setVerificationState({ searched: false, query: '', timestamp: '', sourceType: 'database', matchedResults: [] });
                }
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeMode === 'database'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Online Portal Search</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('pdf');
                if (verificationState.searched && verificationState.sourceType !== 'pdf_file') {
                  setVerificationState({ searched: false, query: '', timestamp: '', sourceType: 'pdf_file', matchedResults: [] });
                }
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeMode === 'pdf'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Direct PDF File se Check</span>
            </button>
          </div>

          {/* PDF Mode File Selector / Dropzone */}
          {activeMode === 'pdf' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Select or Upload RRB Result PDF File:</span>
                </div>

                {availableResultPdfs.length > 0 && (
                  <div className="text-[11px] text-slate-400">
                    Or choose from loaded official CEN panels below
                  </div>
                )}
              </div>

              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPdf(true);
                }}
                onDragLeave={() => setIsDraggingPdf(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
                  isDraggingPdf
                    ? 'border-amber-400 bg-amber-500/10'
                    : selectedPdfFile
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                  className="hidden"
                />

                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPdfFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedPdfFile ? <FileCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    {selectedPdfFile ? (
                      <div>
                        <div className="text-sm font-bold text-emerald-300 flex items-center space-x-1.5">
                          <span>{selectedPdfFile.name}</span>
                          <span className="text-xs font-normal text-slate-400">
                            ({(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          PDF loaded & ready to scan. Click to change file.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white">
                          Click to browse or drag & drop RRB Result PDF here
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Supports multi-page CBT-1, CBT-2, Psycho/CBAT & Final Merit List PDFs.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer shrink-0 border border-slate-700"
                >
                  {selectedPdfFile ? 'Replace PDF' : 'Upload PDF'}
                </button>
              </div>

              {/* Loaded Official Panels Quick Select */}
              {availableResultPdfs.length > 0 && !selectedPdfFile && (
                <div className="pt-1">
                  <div className="text-[11px] text-slate-400 font-bold mb-1.5">
                    Fast Select from Published Result Panels:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableResultPdfs.slice(0, 4).map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          setSelectedPdfFile(null);
                          setSelectedPresetPdfUrl(res.fileUrl || 'Official_Panel.pdf');
                          if (res.rollNumbersSample?.[0]) {
                            setRollInput(res.rollNumbersSample[0]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                          selectedPresetPdfUrl === res.fileUrl
                            ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        📄 {res.zoneName} ({res.cenNumber}) - {res.stage}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Box Form */}
          <form onSubmit={handleFormSubmit} className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={rollInput}
                  onChange={(e) => {
                    setRollInput(e.target.value);
                    if (verificationState.searched) {
                      setVerificationState((prev) => ({ ...prev, searched: false }));
                    }
                  }}
                  placeholder={
                    activeMode === 'pdf'
                      ? 'Enter Roll Number to search inside PDF (e.g. 1962511100562555)...'
                      : 'Enter your 10 to 16-Digit Roll Number (e.g. 1962511100562555)...'
                  }
                  className="w-full bg-slate-900/90 border-2 border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 rounded-2xl pl-11 pr-24 py-3.5 text-sm sm:text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />

                {rollInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setRollInput('');
                      setVerificationState({ searched: false, query: '', timestamp: '', sourceType: activeMode, matchedResults: [] });
                    }}
                    className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying || !rollInput.trim()}
                className={`px-6 py-3.5 rounded-2xl disabled:opacity-50 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer shrink-0 ${
                  activeMode === 'pdf'
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 hover:shadow-amber-500/25'
                    : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/25'
                }`}
              >
                {isVerifying ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>
                      {pdfScanProgress
                        ? `SCANNING PAGE ${pdfScanProgress.current}/${pdfScanProgress.total}...`
                        : 'VERIFYING...'}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 stroke-[3] text-slate-950" />
                    <span>
                      {activeMode === 'pdf' ? 'Search Inside PDF' : 'Verify Roll Number'}
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {activeMode === 'pdf'
                    ? 'Extracts and verifies roll numbers directly from PDF pages in real-time'
                    : 'Matches against official uploaded merit lists & candidate provisional panels'}
                </span>
              </span>
              <span>Supported: CEN 2024-2026</span>
            </div>
          </form>

          {/* VERIFICATION FEEDBACK SECTION */}
          {verificationState.searched && (
            <div ref={resultCardRef} className="pt-2 animate-in fade-in slide-in-from-top-3 duration-300">
              {verificationState.matchedResults.length > 0 ? (
                /* MATCH FOUND SUCCESS CARD */
                <div className="space-y-4">
                  {verificationState.matchedResults.map(({ result, matchedRoll, isEligible, nextStage, pdfDetails }, idx) => {
                    const examTitle = result?.examTitle || pdfDetails?.detectedExamTitle || 'Railway Recruitment Examination';
                    const cenNumber = result?.cenNumber || pdfDetails?.detectedCen || 'CEN 01/2024';
                    const zoneName = result?.zoneName || pdfDetails?.detectedZone || 'Regional RRB Board';
                    const stageName = result?.stage || pdfDetails?.detectedExamTitle || 'CBT-1 / CBT-2 Result';

                    return (
                      <div
                        key={idx}
                        className="rounded-3xl bg-gradient-to-b from-emerald-950/90 via-slate-900/95 to-slate-900/90 border-2 border-emerald-500/80 p-5 sm:p-7 shadow-2xl text-white space-y-5 relative overflow-hidden ring-4 ring-emerald-500/10"
                      >
                        {/* Top Congratulatory Banner (Sabse Prominent) */}
                        <div className="text-center space-y-2 pb-4 border-b border-emerald-800/60">
                          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold text-xs uppercase tracking-wider animate-pulse">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span>
                              {pdfDetails ? `PDF Verification Match Found` : `Official Verification Success`}
                            </span>
                          </div>

                          {/* ✅ Congratulations! Most Prominent Display */}
                          <h3 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-emerald-200 tracking-tight">
                            ✅ Congratulations!
                          </h3>

                          <p className="text-sm sm:text-base font-bold text-emerald-200">
                            🎉 Your Roll Number has been successfully verified.
                          </p>
                        </div>

                        {/* Highlighted Roll Number Card (Bada, Bold aur Prominent Highlight) */}
                        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-400 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                          <div className="space-y-1">
                            <div className="text-xs uppercase font-extrabold tracking-widest text-amber-300 flex items-center justify-center sm:justify-start space-x-1.5">
                              <Sun className="w-4 h-4 text-amber-400" />
                              <span>🔢 Verified Roll Number</span>
                            </div>

                            {/* BADA BOLD PROMINENT ROLL NUMBER */}
                            <div className="text-2xl sm:text-4xl font-mono font-black tracking-wider text-amber-300 drop-shadow-sm select-all">
                              {matchedRoll}
                            </div>

                            {pdfDetails && (
                              <div className="text-xs text-amber-200/90 font-medium pt-1">
                                📍 Found on <strong>Page {pdfDetails.pageNumber}</strong> of {pdfDetails.totalPages} in <span className="underline">{pdfDetails.fileName}</span>
                              </div>
                            )}
                          </div>

                          {/* Status: VERIFIED Badge */}
                          <div className="flex flex-col items-center sm:items-end space-y-1.5 shrink-0">
                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm sm:text-base tracking-wide shadow-md">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
                              <span>🟢 Status: VERIFIED (Selected for Next Stage)</span>
                            </div>

                            <div className="text-[11px] text-slate-300 font-mono flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{verificationState.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        {/* PDF Snippet Preview (When verified via PDF) */}
                        {pdfDetails?.snippet && (
                          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                            <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                              <span className="flex items-center space-x-1.5 text-amber-300">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Direct PDF Extract on Page {pdfDetails.pageNumber}:</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Match Confirmed
                              </span>
                            </div>
                            <div className="font-mono text-xs text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 leading-relaxed break-all">
                              {pdfDetails.snippet.split(new RegExp(`(${matchedRoll})`, 'gi')).map((part, i) =>
                                part.toLowerCase() === matchedRoll.toLowerCase() ? (
                                  <mark key={i} className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded mx-0.5 shadow-sm">
                                    {part}
                                  </mark>
                                ) : (
                                  part
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Next Stage & Eligibility Section */}
                        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-start space-x-3.5 ${
                          isEligible
                            ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-100'
                            : 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                        }`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                            isEligible ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                          }`}>
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                              Next Stage Qualification Status
                            </div>
                            <div className="text-sm sm:text-base font-extrabold text-white">
                              {isEligible ? (
                                <span className="text-emerald-300">
                                  Selected for Next Stage • You are qualified and eligible for the next step.
                                </span>
                              ) : (
                                <span className="text-amber-300">
                                  Next Stage: Non-Qualified as per this shortlist panel.
                                </span>
                              )}
                            </div>
                            {result?.nextStageTitle && (
                              <p className="text-xs text-slate-300 pt-0.5">
                                Target Stage: <strong>{result.nextStageTitle}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Examination Details Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Examination</div>
                            <div className="font-bold text-white truncate">{examTitle}</div>
                            <div className="text-[11px] text-amber-300 font-mono font-bold">{cenNumber}</div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Railway Board & Stage</div>
                            <div className="font-bold text-white truncate">{zoneName}</div>
                            <div className="text-[11px] text-slate-300">{stageName}</div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Verification Source</div>
                            <div className="font-bold text-white truncate">
                              {pdfDetails ? `PDF: ${pdfDetails.fileName}` : (result?.type || 'Official Merit Panel')}
                            </div>
                            <div className="text-[11px] text-slate-300">{verificationState.timestamp.split(',')[0]}</div>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-800">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                            <button
                              type="button"
                              onClick={() => handleCopyRoll(matchedRoll)}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                            >
                              {copiedRoll === matchedRoll ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Roll Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Roll Number</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={handleShareSlip}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share Slip</span>
                            </button>

                            <button
                              type="button"
                              onClick={handlePrintSlip}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Slip</span>
                            </button>
                          </div>

                          {/* PDF Preview or Full Panel View */}
                          <div className="flex items-center space-x-2">
                            {selectedPdfFile && (
                              <button
                                type="button"
                                onClick={() => setActivePdfModal({
                                  title: `Page ${pdfDetails?.pageNumber || 1} - ${selectedPdfFile.name}`,
                                  source: selectedPdfFile,
                                })}
                                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview Page in PDF</span>
                              </button>
                            )}

                            {result && onOpenFullPanelModal && (
                              <button
                                type="button"
                                onClick={() => onOpenFullPanelModal(result)}
                                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer"
                              >
                                <ListFilter className="w-3.5 h-3.5" />
                                <span>View Full Shortlist Panel</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ROLL NUMBER NOT FOUND CARD */
                <div className="rounded-3xl bg-slate-900/90 border-2 border-rose-500/50 p-5 sm:p-7 shadow-xl text-white space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        {/* ❌ Roll Number Not Found */}
                        <h3 className="text-lg sm:text-xl font-black text-rose-300">
                          {verificationState.sourceType === 'pdf_file'
                            ? `❌ Roll Number Not Found in this PDF`
                            : `❌ Roll Number Not Found`}
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-slate-300">
                          “Please check your roll number and try again.”
                        </p>
                      </div>
                    </div>

                    {/* Status: NOT VERIFIED */}
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/30 shrink-0">
                      <span>Status: NOT VERIFIED</span>
                    </div>
                  </div>

                  {/* Summary of Scan */}
                  {verificationState.pdfScanSummary && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono">
                      Scanned all <strong>{verificationState.pdfScanSummary.totalPages} pages</strong> ({verificationState.pdfScanSummary.totalRollNumbersFound} candidate roll numbers found) in <em>{verificationState.pdfScanSummary.fileName}</em>.
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Troubleshooting Tips:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Ensure you entered the full 10 to 16 digit Roll Number without spaces or hyphens.</li>
                      {verificationState.sourceType === 'pdf_file' ? (
                        <li>Verify if you uploaded the correct stage and regional board PDF for your examination.</li>
                      ) : (
                        <li>Double check if your exam's regional board panel has been officially declared.</li>
                      )}
                      <li>Try uploading your regional RRB result PDF directly using the "Direct PDF File se Check" tab above.</li>
                    </ul>
                    <div className="text-[11px] text-slate-500 pt-1 font-mono">
                      Query checked at: {verificationState.timestamp}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
