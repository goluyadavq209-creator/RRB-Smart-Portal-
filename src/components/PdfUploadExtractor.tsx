import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Save, 
  Trash2, 
  Layers, 
  BarChart3, 
  Award, 
  Bell, 
  GraduationCap, 
  Building2, 
  RefreshCw,
  Download,
  Check,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  FullRRBDatabase, 
  CutoffRecord, 
  ResultItem, 
  NoticeItem, 
  ExamItem, 
  CutoffStage 
} from '../types';
import { 
  extractTextFromPdf, 
  analyzeRrbPdfText, 
  ExtractedPdfData, 
  fileToBase64 
} from '../utils/pdfExtractor';
import { OFFICIAL_RRB_ZONES } from '../data/defaultData';
import { saveRRBDatabase } from '../utils/storage';
import { dispatchNewDataNotification } from '../utils/notifications';
import { PdfViewerModal } from './PdfViewerModal';

interface PdfUploadExtractorProps {
  database: FullRRBDatabase;
  setDatabase?: (db: FullRRBDatabase) => void;
  onSuccessMessage?: (msg: string) => void;
  onSaveData?: (updatedDb: FullRRBDatabase, successMsg: string) => void;
}

export const PdfUploadExtractor: React.FC<PdfUploadExtractorProps> = ({
  database,
  setDatabase,
  onSuccessMessage,
  onSaveData,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPdfData | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State for Editable Extracted Record
  const [targetType, setTargetType] = useState<'cutoff' | 'result' | 'notice' | 'exam'>('cutoff');
  const [cenNumber, setCenNumber] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [zoneCode, setZoneCode] = useState('ALL');
  const [zoneName, setZoneName] = useState('All Regional RRBs');
  const [postName, setPostName] = useState('');
  const [stage, setStage] = useState<CutoffStage>('CBT-1');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  // Cutoffs
  const [urCutoff, setUrCutoff] = useState<string>('');
  const [obcCutoff, setObcCutoff] = useState<string>('');
  const [scCutoff, setScCutoff] = useState<string>('');
  const [stCutoff, setStCutoff] = useState<string>('');
  const [ewsCutoff, setEwsCutoff] = useState<string>('');
  const [exsmCutoff, setExsmCutoff] = useState<string>('');
  const [pwbdCutoff, setPwbdCutoff] = useState<string>('');
  
  // Results & Notices
  const [rollNumbersText, setRollNumbersText] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<string>('Exam Date');
  const [totalVacancies, setTotalVacancies] = useState<number>(1000);
  const [instructions, setInstructions] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file (*.pdf).');
      return;
    }

    setErrorMessage(null);
    setSaveSuccess(null);
    setIsProcessing(true);
    setPdfFile(file);

    try {
      // 1. Convert to base64 for persistent preview and storage
      const base64 = await fileToBase64(file);
      setPdfBase64(base64);

      // 2. Extract text with pdfjs
      const { fullText, totalPages } = await extractTextFromPdf(file);

      // 3. Analyze text with regex and heuristics
      const analysis = analyzeRrbPdfText(fullText, file.name, file.size, totalPages);
      setExtractedData(analysis);

      // 4. Pre-populate editable form
      setTargetType(analysis.detectedType === 'unknown' ? 'cutoff' : analysis.detectedType);
      setCenNumber(analysis.extractedCen || 'CEN 01/2024');
      setExamTitle(analysis.extractedExamTitle || 'Railway Recruitment Board Examination');
      setZoneCode(analysis.extractedZoneCode || 'ALL');
      setZoneName(analysis.extractedZoneName || 'All Regional RRBs');
      setPostName(analysis.extractedPostName || 'All Posts');
      setStage((analysis.extractedStage as CutoffStage) || 'CBT-1');
      
      // Cutoffs
      if (analysis.extractedCutoffs) {
        setUrCutoff(analysis.extractedCutoffs.UR !== undefined ? String(analysis.extractedCutoffs.UR) : '');
        setObcCutoff(analysis.extractedCutoffs.OBC !== undefined ? String(analysis.extractedCutoffs.OBC) : '');
        setScCutoff(analysis.extractedCutoffs.SC !== undefined ? String(analysis.extractedCutoffs.SC) : '');
        setStCutoff(analysis.extractedCutoffs.ST !== undefined ? String(analysis.extractedCutoffs.ST) : '');
        setEwsCutoff(analysis.extractedCutoffs.EWS !== undefined ? String(analysis.extractedCutoffs.EWS) : '');
        setExsmCutoff(analysis.extractedCutoffs.ExSM !== undefined ? String(analysis.extractedCutoffs.ExSM) : '');
        setPwbdCutoff(analysis.extractedCutoffs.PwBD !== undefined ? String(analysis.extractedCutoffs.PwBD) : '');
      }

      // Roll numbers
      if (analysis.extractedRollNumbers && analysis.extractedRollNumbers.length > 0) {
        setRollNumbersText(analysis.extractedRollNumbers.join(', '));
      }

      if (analysis.extractedTotalVacancies) {
        setTotalVacancies(analysis.extractedTotalVacancies);
      }

      setInstructions(`Extracted automatically from official PDF document: ${file.name}`);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setErrorMessage(`Failed to extract data from PDF: ${err.message || 'Corrupted or unreadable PDF document'}`);
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveToDatabase = () => {
    if (!extractedData) return;

    const uniqueId = `pdf-${Date.now()}`;
    const dateStamp = new Date().toISOString();
    const updatedDb: FullRRBDatabase = { ...database };

    const commitDatabaseUpdate = (updated: FullRRBDatabase, successMsg: string) => {
      saveRRBDatabase(updated);
      if (setDatabase) {
        setDatabase(updated);
      }
      if (onSuccessMessage) {
        onSuccessMessage(successMsg);
      }
      if (onSaveData) {
        onSaveData(updated, successMsg);
      }
      setSaveSuccess(successMsg);
    };

    if (targetType === 'cutoff') {
      const cutoffsObj: Record<string, number> = {};
      if (urCutoff) cutoffsObj.UR = parseFloat(urCutoff);
      if (obcCutoff) cutoffsObj.OBC = parseFloat(obcCutoff);
      if (scCutoff) cutoffsObj.SC = parseFloat(scCutoff);
      if (stCutoff) cutoffsObj.ST = parseFloat(stCutoff);
      if (ewsCutoff) cutoffsObj.EWS = parseFloat(ewsCutoff);
      if (exsmCutoff) cutoffsObj.ExSM = parseFloat(exsmCutoff);
      if (pwbdCutoff) cutoffsObj.PwBD = parseFloat(pwbdCutoff);

      const newRecord: CutoffRecord = {
        id: uniqueId,
        cenNumber: cenNumber.trim() || 'CEN 01/2024',
        examTitle: examTitle.trim() || 'RRB Exam',
        zoneCode,
        zoneName,
        postName: postName.trim() || 'All Posts',
        stage,
        year,
        cutoffs: cutoffsObj,
        normalizedScore: true,
        pdfReference: pdfFile?.name || 'Extracted PDF',
        updatedAt: dateStamp,
      };

      updatedDb.cutoffs = [newRecord, ...updatedDb.cutoffs];
      commitDatabaseUpdate(
        updatedDb,
        `Successfully extracted and added Cut-Off record for ${newRecord.cenNumber} (${newRecord.zoneCode}) to database!`
      );
      dispatchNewDataNotification({
        title: `📊 New Cut-Off Uploaded: ${newRecord.examTitle} (${newRecord.cenNumber})`,
        message: `${newRecord.postName} - ${newRecord.zoneName} (${newRecord.stage}) cut-off scores have been published.`,
        category: 'cutoff',
        targetTab: 'cutoffs',
        targetId: newRecord.id,
        zoneCode: newRecord.zoneCode,
        badgeText: 'Cut-Off Update',
      });
    } else if (targetType === 'result') {
      const rollNumbers = rollNumbersText
        ? rollNumbersText.split(/[\s,]+/).filter(Boolean)
        : [];

      const newResult: ResultItem = {
        id: uniqueId,
        cenNumber: cenNumber.trim() || 'CEN 01/2024',
        examTitle: examTitle.trim() || 'RRB Exam',
        zoneCode,
        zoneName,
        stage: `${stage} Result / Merit List`,
        publishDate: dateStamp.split('T')[0],
        type: rollNumbers.length > 0 ? 'Merit List PDF' : 'Final Provisional Panel',
        fileUrl: pdfBase64 || pdfFile?.name,
        totalSelectedCandidates: rollNumbers.length > 0 ? rollNumbers.length : 100,
        rollNumbersSample: rollNumbers.slice(0, 100),
        instructions: instructions || `Extracted merit list for ${cenNumber}`,
      };

      updatedDb.results = [newResult, ...updatedDb.results];
      commitDatabaseUpdate(
        updatedDb,
        `Successfully extracted and added Result Merit List (${rollNumbers.length} roll numbers) to database!`
      );
      dispatchNewDataNotification({
        title: `🏆 New Result / Merit List: ${newResult.examTitle} (${newResult.zoneName})`,
        message: `${newResult.stage} published with ${newResult.totalSelectedCandidates} shortlisted candidates.`,
        category: 'result',
        targetTab: 'results',
        targetId: newResult.id,
        zoneCode: newResult.zoneCode,
        badgeText: 'Result Out',
      });
    } else if (targetType === 'notice') {
      const newNotice: NoticeItem = {
        id: uniqueId,
        cenNumber: cenNumber.trim() || undefined,
        zoneCode,
        title: `Official Notification: ${examTitle} (${cenNumber || 'CEN'})`,
        category: noticeCategory as any,
        publishDate: dateStamp.split('T')[0],
        isImportant: true,
        isNew: true,
        pdfUrl: pdfBase64 || pdfFile?.name,
        contentSummary: instructions || extractedData.rawText.slice(0, 300) + '...',
      };

      updatedDb.notices = [newNotice, ...updatedDb.notices];
      commitDatabaseUpdate(
        updatedDb,
        `Successfully extracted and published Notice to database!`
      );
      dispatchNewDataNotification({
        title: `📢 New Official Notice: ${newNotice.title}`,
        message: newNotice.contentSummary || 'New official circular published by Railway Recruitment Board.',
        category: 'notice',
        targetTab: 'notices',
        targetId: newNotice.id,
        zoneCode: newNotice.zoneCode,
        badgeText: 'Official Notice',
      });
    } else if (targetType === 'exam') {
      const newExam: ExamItem = {
        id: uniqueId,
        cenNumber: cenNumber.trim() || 'CEN 01/2025',
        title: examTitle.trim() || 'Railway Recruitment Examination',
        shortCode: (cenNumber || 'CEN').replace(/\s+/g, '-'),
        department: 'Indian Railways (All Cadres)',
        status: 'Active Application',
        totalVacancies: totalVacancies || 5000,
        applicationStart: dateStamp.split('T')[0],
        applicationEnd: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        examDates: 'As per official schedule',
        eligibility: 'Degree / Diploma / 10th+ITI as per post',
        payScale: 'Level-2 to Level-7 (7th CPC)',
        selectionStages: ['CBT-1', 'CBT-2', 'Document Verification & Medical'],
        officialPdfUrl: pdfBase64 || pdfFile?.name,
        description: instructions || `CEN Notification extracted from ${pdfFile?.name}`,
        updatedAt: dateStamp,
      };

      updatedDb.exams = [newExam, ...updatedDb.exams];
      commitDatabaseUpdate(
        updatedDb,
        `Successfully extracted and created CEN Exam Notification in database!`
      );
      dispatchNewDataNotification({
        title: `🚆 New CEN Recruitment: ${newExam.title} (${newExam.cenNumber})`,
        message: `Total Vacancies: ${newExam.totalVacancies.toLocaleString('en-IN')}. Online applications and examination details available.`,
        category: 'exam',
        targetTab: 'exams',
        targetId: newExam.id,
        badgeText: 'New CEN Exam',
      });
    }

    setSaveSuccess('Data successfully committed to persistent storage!');
  };

  const handleReset = () => {
    setExtractedData(null);
    setPdfFile(null);
    setPdfBase64(null);
    setErrorMessage(null);
    setSaveSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & Instructions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-500/20">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Official RRB PDF Upload & Automatic Data Extraction
              </h3>
              <p className="text-xs text-slate-500">
                Upload official CEN notices, cut-off marksheets, or shortlist PDFs to auto-populate the database
              </p>
            </div>
          </div>

          {pdfFile && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear & Upload Another</span>
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 font-bold hover:underline ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
            <button
              onClick={() => setSaveSuccess(null)}
              className="text-emerald-700 font-bold hover:underline ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Drag & Drop Box */}
        {!extractedData && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-amber-500 bg-amber-50/60 scale-[1.005]'
                : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="font-bold text-sm text-slate-800">
                  Parsing PDF Document & Extracting Data...
                </p>
                <p className="text-xs text-slate-500">
                  Analyzing CEN tags, category cut-offs, RRB zone headers, and candidate roll numbers
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto border border-amber-500/20 shadow-xs">
                  <FileUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base text-slate-900">
                    Click to browse or drag & drop official RRB PDF document
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports CEN Notifications, Stage-wise Cut-off Marks, Merit Lists & Official Notices
                  </p>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-semibold text-slate-600 shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Automatic OCR & Table Extraction Engine</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extracted File Summary & Review Workspace */}
        {extractedData && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header file stats bar */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <span>{extractedData.fileName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                      {extractedData.totalPages} Page{extractedData.totalPages > 1 ? 's' : ''}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    {(extractedData.fileSize / (1024 * 1024)).toFixed(2)} MB • Auto-Detected as{' '}
                    <span className="text-amber-400 font-bold uppercase">{extractedData.detectedType}</span>
                    {' '}(Confidence: {extractedData.confidenceScore}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preview PDF & Text</span>
                </button>
              </div>
            </div>

            {/* Editable Extraction Form */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Review & Verify Extracted Fields Before Saving</span>
                </h4>

                {/* Target Record Type Switcher */}
                <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTargetType('cutoff')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      targetType === 'cutoff' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cut-Off Marks
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('result')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      targetType === 'result' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Merit Result
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('notice')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      targetType === 'notice' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('exam')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      targetType === 'exam' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    CEN Exam
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CEN Notification Number
                  </label>
                  <input
                    type="text"
                    value={cenNumber}
                    onChange={(e) => setCenNumber(e.target.value)}
                    placeholder="e.g. CEN 01/2024"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam / Recruitment Title
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g. RRB Assistant Loco Pilot"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Regional Board (Zone)
                  </label>
                  <select
                    value={zoneCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setZoneCode(code);
                      const matched = OFFICIAL_RRB_ZONES.find((z) => z.code === code);
                      if (matched) setZoneName(matched.name);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">All Regional RRBs (ALL)</option>
                    {OFFICIAL_RRB_ZONES.map((z) => (
                      <option key={z.id} value={z.code}>
                        {z.name} ({z.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Post Designation
                  </label>
                  <input
                    type="text"
                    value={postName}
                    onChange={(e) => setPostName(e.target.value)}
                    placeholder="e.g. Technician Gr-I Signal"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selection Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CutoffStage)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CBT-1">CBT-1 (1st Stage Computer Based Test)</option>
                    <option value="CBT-2 (Part-A)">CBT-2 (Part-A)</option>
                    <option value="CBT-2 (Part-B)">CBT-2 (Part-B Qualifying)</option>
                    <option value="CBAT / Psycho Test">CBAT / Psycho Aptitude Test</option>
                    <option value="Typing Skill Test">Typing Skill Test</option>
                    <option value="Document Verification (DV/Final)">Document Verification (DV/Final)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recruitment Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10) || 2025)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Conditional Cutoff Inputs */}
              {targetType === 'cutoff' && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="block text-xs font-bold text-slate-800 mb-2">
                    Extracted Category Cut-Off Marks (Normalized / Out of 100 or 75):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 block">UR (General)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={urCutoff}
                        onChange={(e) => setUrCutoff(e.target.value)}
                        placeholder="72.5"
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 block">OBC (NCL)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={obcCutoff}
                        onChange={(e) => setObcCutoff(e.target.value)}
                        placeholder="67.2"
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 block">SC</span>
                      <input
                        type="number"
                        step="0.01"
                        value={scCutoff}
                        onChange={(e) => setScCutoff(e.target.value)}
                        placeholder="58.4"
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 block">ST</span>
                      <input
                        type="number"
                        step="0.01"
                        value={stCutoff}
                        onChange={(e) => setStCutoff(e.target.value)}
                        placeholder="54.1"
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 block">EWS</span>
                      <input
                        type="number"
                        step="0.01"
                        value={ewsCutoff}
                        onChange={(e) => setEwsCutoff(e.target.value)}
                        placeholder="65.0"
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 block">Ex-SM</span>
                      <input
                        type="number"
                        step="0.01"
                        value={exsmCutoff}
                        onChange={(e) => setExsmCutoff(e.target.value)}
                        placeholder="40.0"
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 block">PwBD</span>
                      <input
                        type="number"
                        step="0.01"
                        value={pwbdCutoff}
                        onChange={(e) => setPwbdCutoff(e.target.value)}
                        placeholder="38.0"
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Result / Roll Numbers Input */}
              {targetType === 'result' && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Extracted Candidate Roll Numbers ({rollNumbersText.split(/[\s,]+/).filter(Boolean).length} detected):
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Separated by comma or spaces
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={rollNumbersText}
                    onChange={(e) => setRollNumbersText(e.target.value)}
                    placeholder="e.g. 241941230001001, 241941230001002, 241941230001003"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Instructions / Summary */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Reference & Instructions
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Official notification released by Railway Recruitment Board"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSaveToDatabase}
                  className="py-2.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save Extracted {targetType.toUpperCase()} Record to Database</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setViewerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Extracted Text ({extractedData.rawText.length} chars)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {pdfFile && (
        <PdfViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          title={extractedData?.fileName || 'Official RRB PDF'}
          pdfSource={pdfFile}
          extractedText={extractedData?.rawText}
          onExtractData={() => {
            setViewerOpen(false);
          }}
        />
      )}
    </div>
  );
};
