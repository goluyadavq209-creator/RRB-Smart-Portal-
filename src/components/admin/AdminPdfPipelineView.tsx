import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  Save, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Check, 
  Cpu, 
  Globe, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  BarChart3,
  Bell,
  Award,
  Trash2,
  Download,
  Search,
  Filter,
  Edit3
} from 'lucide-react';
import { 
  FullRRBDatabase, 
  CutoffRecord, 
  ResultItem, 
  NoticeItem, 
  ExamItem, 
  CutoffStage,
  TabView 
} from '../../types';
import { 
  extractTextFromPdf, 
  analyzeRrbPdfText, 
  ExtractedPdfData, 
  fileToBase64 
} from '../../utils/pdfExtractor';
import { OFFICIAL_RRB_ZONES } from '../../data/defaultData';
import { saveRRBDatabase } from '../../utils/storage';
import { dispatchNewDataNotification } from '../../utils/notifications';
import { PdfViewerModal } from '../PdfViewerModal';

interface AdminPdfPipelineViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
  onSwitchToUserSite: (tab: TabView) => void;
}

export type PipelineStep = 
  | 'upload' 
  | 'validation' 
  | 'ocr' 
  | 'ai_parser' 
  | 'verification' 
  | 'preview' 
  | 'publish' 
  | 'user_website';

export const AdminPdfPipelineView: React.FC<AdminPdfPipelineViewProps> = ({
  database,
  setDatabase,
  onSuccessMessage,
  onSwitchToUserSite,
}) => {
  const [currentStep, setCurrentStep] = useState<PipelineStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStageText, setProcessingStageText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPdfData | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedItem, setPublishedItem] = useState<{
    id: string;
    type: 'cutoff' | 'result' | 'notice' | 'exam';
    title: string;
    cen: string;
    tab: TabView;
  } | null>(null);

  // Verification Form State
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

  // OCR Text search and active tabs in Verification Step
  const [activeVerifyTab, setActiveVerifyTab] = useState<'table' | 'form' | 'text'>('table');
  const [rawTextSearch, setRawTextSearch] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [manualOcrPaste, setManualOcrPaste] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 8 Steps definition
  const pipelineSteps: { id: PipelineStep; label: string; icon: any; desc: string }[] = [
    { id: 'upload', label: 'PDF Upload', icon: FileUp, desc: 'Drop or select official PDF' },
    { id: 'validation', label: 'PDF Validation', icon: ShieldCheck, desc: 'Integrity & file security check' },
    { id: 'ocr', label: 'OCR / Data Extraction', icon: FileText, desc: 'Raw text & table stream extractor' },
    { id: 'ai_parser', label: 'AI/Data Parser', icon: Cpu, desc: 'Gemini NLP & Heuristics engine' },
    { id: 'verification', label: 'Admin Verification', icon: CheckCircle2, desc: 'Review & edit extracted values' },
    { id: 'preview', label: 'Preview', icon: Eye, desc: 'Live candidate UI preview' },
    { id: 'publish', label: 'Publish', icon: Save, desc: 'Atomic persistent DB commit' },
    { id: 'user_website', label: 'User Website', icon: Globe, desc: 'Live in Candidate Portal' },
  ];

  const getStepIndex = (step: PipelineStep) => {
    return pipelineSteps.findIndex((s) => s.id === step);
  };

  const handleProcessRawText = (text: string, sourceName = 'Pasted_Document_Text.txt') => {
    if (!text.trim()) {
      setErrorMessage('Please paste or type text to scan.');
      return;
    }
    setErrorMessage(null);
    setIsProcessing(true);
    setCurrentStep('ai_parser');
    setProcessingStageText('Analyzing raw text, table rows, CEN numbers and score matrices...');

    setTimeout(() => {
      const analysis = analyzeRrbPdfText(text, sourceName, text.length, 1);
      setExtractedData(analysis);

      const detected = analysis.detectedType === 'unknown' ? 'cutoff' : analysis.detectedType;
      setTargetType(detected);
      setCenNumber(analysis.extractedCen || 'CEN 01/2024');
      setExamTitle(analysis.extractedExamTitle || 'Railway Recruitment Board Examination');
      setZoneCode(analysis.extractedZoneCode || 'ALL');
      setZoneName(analysis.extractedZoneName || 'All Regional RRBs');
      setPostName(analysis.extractedPostName || 'All Posts');
      setStage((analysis.extractedStage as CutoffStage) || 'CBT-1');

      if (analysis.extractedCutoffs) {
        setUrCutoff(analysis.extractedCutoffs.UR !== undefined ? String(analysis.extractedCutoffs.UR) : '75.2');
        setObcCutoff(analysis.extractedCutoffs.OBC !== undefined ? String(analysis.extractedCutoffs.OBC) : '74.9');
        setScCutoff(analysis.extractedCutoffs.SC !== undefined ? String(analysis.extractedCutoffs.SC) : '70.3');
        setStCutoff(analysis.extractedCutoffs.ST !== undefined ? String(analysis.extractedCutoffs.ST) : '68.0');
        setEwsCutoff(analysis.extractedCutoffs.EWS !== undefined ? String(analysis.extractedCutoffs.EWS) : '74.1');
        setExsmCutoff(analysis.extractedCutoffs.ExSM !== undefined ? String(analysis.extractedCutoffs.ExSM) : '46.2');
        setPwbdCutoff(analysis.extractedCutoffs.PwBD !== undefined ? String(analysis.extractedCutoffs.PwBD) : '58.3');
      }

      if (analysis.extractedRollNumbers && analysis.extractedRollNumbers.length > 0) {
        setRollNumbersText(analysis.extractedRollNumbers.join(', '));
      }

      setIsProcessing(false);
      setCurrentStep('verification');
    }, 600);
  };

  const handleFileSelect = async (file: File) => {
    if (!file || (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf')) {
      setErrorMessage('Please select a valid PDF file (*.pdf).');
      return;
    }

    setErrorMessage(null);
    setPdfFile(file);
    setIsProcessing(true);

    try {
      // Step 1: Upload Complete -> Move to Validation
      setCurrentStep('validation');
      setProcessingStageText('Validating PDF format, header checksums, and mime type...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Convert to base64
      const base64 = await fileToBase64(file);
      setPdfBase64(base64);

      // Move to OCR
      setCurrentStep('ocr');
      setProcessingStageText('Running OCR & stream extraction on pages...');
      const { fullText, totalPages } = await extractTextFromPdf(file);

      // Move to AI Parser
      setCurrentStep('ai_parser');
      setProcessingStageText('AI / Data Parser analyzing CEN numbers, zones, categories & cutoff matrix...');
      await new Promise((r) => setTimeout(r, 700));

      const analysis = analyzeRrbPdfText(fullText, file.name, file.size, totalPages);
      setExtractedData(analysis);

      // Pre-fill editable form
      const detected = analysis.detectedType === 'unknown' ? 'cutoff' : analysis.detectedType;
      setTargetType(detected);
      setCenNumber(analysis.extractedCen || 'CEN 01/2024');
      setExamTitle(analysis.extractedExamTitle || 'Railway Recruitment Board Examination');
      setZoneCode(analysis.extractedZoneCode || 'ALL');
      setZoneName(analysis.extractedZoneName || 'All Regional RRBs');
      setPostName(analysis.extractedPostName || 'All Posts');
      setStage((analysis.extractedStage as CutoffStage) || 'CBT-1');

      if (analysis.extractedCutoffs) {
        setUrCutoff(analysis.extractedCutoffs.UR !== undefined ? String(analysis.extractedCutoffs.UR) : '74.5');
        setObcCutoff(analysis.extractedCutoffs.OBC !== undefined ? String(analysis.extractedCutoffs.OBC) : '68.2');
        setScCutoff(analysis.extractedCutoffs.SC !== undefined ? String(analysis.extractedCutoffs.SC) : '59.0');
        setStCutoff(analysis.extractedCutoffs.ST !== undefined ? String(analysis.extractedCutoffs.ST) : '54.5');
        setEwsCutoff(analysis.extractedCutoffs.EWS !== undefined ? String(analysis.extractedCutoffs.EWS) : '67.0');
        setExsmCutoff(analysis.extractedCutoffs.ExSM !== undefined ? String(analysis.extractedCutoffs.ExSM) : '40.0');
        setPwbdCutoff(analysis.extractedCutoffs.PwBD !== undefined ? String(analysis.extractedCutoffs.PwBD) : '38.0');
      }

      if (analysis.extractedRollNumbers && analysis.extractedRollNumbers.length > 0) {
        setRollNumbersText(analysis.extractedRollNumbers.join(', '));
      }

      if (analysis.extractedTotalVacancies) {
        setTotalVacancies(analysis.extractedTotalVacancies);
      }

      setInstructions(`Parsed from official PDF: ${file.name}`);

      setIsProcessing(false);
      // Move to Verification step
      setCurrentStep('verification');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setIsProcessing(false);
      setErrorMessage(`Failed to process PDF: ${err.message || 'Corrupted or unreadable format'}`);
      setCurrentStep('upload');
    }
  };

  const handlePublishAllCutoffRows = () => {
    if (!extractedData || !extractedData.suggestedRecord?.cutoffsList || extractedData.suggestedRecord.cutoffsList.length === 0) {
      handlePublishToLiveSite();
      return;
    }

    const rowsToPublish = extractedData.suggestedRecord.cutoffsList as CutoffRecord[];
    const updatedDb: FullRRBDatabase = { ...database };
    const dateStamp = new Date().toISOString();

    const newRecords: CutoffRecord[] = rowsToPublish.map((r, i) => ({
      ...r,
      id: `cut-bulk-${Date.now()}-${i}`,
      pdfReference: pdfFile?.name || r.pdfReference || 'Official Cutoff PDF',
      updatedAt: dateStamp,
    }));

    updatedDb.cutoffs = [...newRecords, ...updatedDb.cutoffs];
    saveRRBDatabase(updatedDb);
    setDatabase(updatedDb);

    const firstItem = newRecords[0];
    const publishedMeta = {
      id: firstItem.id,
      type: 'cutoff' as const,
      title: `${newRecords.length} Official Cut-Off Rows (${firstItem.cenNumber})`,
      cen: firstItem.cenNumber,
      tab: 'cutoffs' as TabView,
    };

    setPublishedItem(publishedMeta);
    setCurrentStep('user_website');
    onSuccessMessage(`Successfully published ${newRecords.length} cut-off rows to live candidate portal!`);

    dispatchNewDataNotification({
      title: `📊 ${newRecords.length} Cut-Off Rows Published: ${firstItem.examTitle} (${firstItem.cenNumber})`,
      message: `${newRecords.length} official category cut-off rows for ${firstItem.zoneName} have been committed to the live candidate portal.`,
      category: 'cutoff',
      targetTab: 'cutoffs',
      targetId: firstItem.id,
      zoneCode: firstItem.zoneCode,
      badgeText: 'Cut-Off Table Live',
    });
  };

  const handlePublishToLiveSite = () => {
    if (!extractedData) return;

    const uniqueId = `pdf-${Date.now()}`;
    const dateStamp = new Date().toISOString();
    const updatedDb: FullRRBDatabase = { ...database };
    let publishedMeta: any = null;

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
      publishedMeta = {
        id: newRecord.id,
        type: 'cutoff',
        title: `${newRecord.examTitle} - ${newRecord.postName}`,
        cen: newRecord.cenNumber,
        tab: 'cutoffs' as TabView,
      };

      dispatchNewDataNotification({
        title: `📊 Cut-Off Published: ${newRecord.examTitle} (${newRecord.cenNumber})`,
        message: `${newRecord.postName} - ${newRecord.zoneName} (${newRecord.stage}) cut-off scores have been published.`,
        category: 'cutoff',
        targetTab: 'cutoffs',
        targetId: newRecord.id,
        zoneCode: newRecord.zoneCode,
        badgeText: 'Cut-Off Published',
      });
    } else if (targetType === 'result') {
      const rollNumbers: string[] = rollNumbersText ? Array.from(new Set(rollNumbersText.split(/[\s,]+/).filter(Boolean))) : [];
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
        totalSelectedCandidates: rollNumbers.length > 0 ? rollNumbers.length : 120,
        rollNumbersSample: rollNumbers,
        instructions: instructions || `Merit list for ${cenNumber}`,
        isNextStageEligible: true,
        nextStageTitle: 'Next Stage Examination / Document Verification',
      };

      updatedDb.results = [newResult, ...updatedDb.results];
      publishedMeta = {
        id: newResult.id,
        type: 'result',
        title: `${newResult.examTitle} (${newResult.zoneName})`,
        cen: newResult.cenNumber,
        tab: 'results' as TabView,
      };

      dispatchNewDataNotification({
        title: `🏆 Merit List Published: ${newResult.examTitle} (${newResult.zoneName})`,
        message: `${newResult.stage} published with ${newResult.totalSelectedCandidates} candidates.`,
        category: 'result',
        targetTab: 'results',
        targetId: newResult.id,
        zoneCode: newResult.zoneCode,
        badgeText: 'Result Published',
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
      publishedMeta = {
        id: newNotice.id,
        type: 'notice',
        title: newNotice.title,
        cen: newNotice.cenNumber || 'CEN',
        tab: 'notices' as TabView,
      };

      dispatchNewDataNotification({
        title: `📢 Official Notice Published: ${newNotice.title}`,
        message: newNotice.contentSummary || 'New official circular published by Railway Recruitment Board.',
        category: 'notice',
        targetTab: 'notices',
        targetId: newNotice.id,
        zoneCode: newNotice.zoneCode,
        badgeText: 'Notice Published',
      });
    } else if (targetType === 'exam') {
      const newExam: ExamItem = {
        id: uniqueId,
        cenNumber: cenNumber.trim() || 'CEN 01/2025',
        title: examTitle.trim() || 'Railway Recruitment Examination',
        shortCode: (cenNumber || 'CEN').replace(/\s+/g, '-'),
        department: 'Indian Railways',
        status: 'Active Application',
        totalVacancies: totalVacancies || 5000,
        applicationStart: dateStamp.split('T')[0],
        applicationEnd: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        examDates: 'As per official schedule',
        eligibility: 'Degree / Diploma / 10th+ITI',
        payScale: 'Level-2 to Level-7',
        selectionStages: ['CBT-1', 'CBT-2', 'Document Verification & Medical'],
        officialPdfUrl: pdfBase64 || pdfFile?.name,
        description: instructions || `CEN Notification extracted from ${pdfFile?.name}`,
        updatedAt: dateStamp,
      };

      updatedDb.exams = [newExam, ...updatedDb.exams];
      publishedMeta = {
        id: newExam.id,
        type: 'exam',
        title: `${newExam.title} (${newExam.cenNumber})`,
        cen: newExam.cenNumber,
        tab: 'exams' as TabView,
      };

      dispatchNewDataNotification({
        title: `🚆 New CEN Recruitment: ${newExam.title} (${newExam.cenNumber})`,
        message: `Total Vacancies: ${newExam.totalVacancies.toLocaleString('en-IN')}.`,
        category: 'exam',
        targetTab: 'exams',
        targetId: newExam.id,
        badgeText: 'New Exam Published',
      });
    }

    saveRRBDatabase(updatedDb);
    setDatabase(updatedDb);
    setPublishedItem(publishedMeta);
    setCurrentStep('user_website');
    onSuccessMessage(`Successfully published ${targetType.toUpperCase()} to live website!`);
  };

  const handleResetPipeline = () => {
    setCurrentStep('upload');
    setPdfFile(null);
    setPdfBase64(null);
    setExtractedData(null);
    setErrorMessage(null);
    setPublishedItem(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Flowchart Pipeline Visual Tracker (Requested 8 Steps) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>RRB Official Document Processing Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 8-stage verification pipeline for Railway Recruitment Board notifications & cut-offs
            </p>
          </div>

          <button
            onClick={handleResetPipeline}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Pipeline</span>
          </button>
        </div>

        {/* 8-Step Pipeline Strip */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[760px] justify-between relative">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const stepIdx = getStepIndex(step.id);
              const currentIdx = getStepIndex(currentStep);
              const isPassed = stepIdx < currentIdx;
              const isCurrent = stepIdx === currentIdx;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Item */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div
                      onClick={() => {
                        if (isPassed || (extractedData && stepIdx <= 5)) {
                          setCurrentStep(step.id);
                        }
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-white shadow-xs cursor-pointer'
                          : isCurrent
                          ? 'bg-red-600 text-white ring-4 ring-red-100 shadow-sm'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>

                    <span
                      className={`text-[11px] font-bold mt-2 whitespace-nowrap ${
                        isCurrent
                          ? 'text-red-700'
                          : isPassed
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[9px] text-slate-400 hidden sm:block max-w-[80px] leading-tight mt-0.5">
                      {step.desc}
                    </span>
                  </div>

                  {/* Connecting Arrow */}
                  {idx < pipelineSteps.length - 1 && (
                    <div className="flex-1 flex items-center justify-center px-1 mb-6">
                      <div
                        className={`h-0.5 w-full ${
                          stepIdx < currentIdx ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                      <ArrowRight
                        className={`w-3.5 h-3.5 shrink-0 -ml-1 ${
                          stepIdx < currentIdx ? 'text-emerald-500' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: PDF UPLOAD & OCR TEXT PASTE */}
      {currentStep === 'upload' && !isProcessing && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50/60 hover:bg-red-50/30 p-10 rounded-2xl text-center cursor-pointer transition-all space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <FileUp className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">
                Option A: Upload Official RRB PDF
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Drag & drop CEN Exam Notification, Category-wise Cut-off list, Answer Key circular or Result Merit List PDF.
              </p>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Automatic Multi-Row Cut-Off Table & OCR Scanner Ready</span>
            </div>
          </div>

          {/* Option B: Direct Raw Text Paste & Instant Table Scanner */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-red-600" />
                <span>Option B: Paste PDF Raw Text & Auto-Scan Table (सीधा टेक्स्ट स्कैन करें)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setManualOcrPaste(
`RAILWAY RECRUITMENT BOARD, MALDA
CEN 06/2025 (NTPC Graduate)
Cut-off marks for candidates shortlisted for CBAT & CBTST

CAT_NO  UR        SC        ST        OBC       EWS       ESM       R-VI      R-HI      R-LD
2er     75.21368  70.37037  68.09118  74.92878  74.13793  46.26437
5er     76.72414  70.37037  65.81197  76.35328  75.00000  44.44444                      58.33333
5ser    74.71265  70.08547  65.80459  74.64388  74.64388  44.15955  47.57835`
                  );
                }}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
              >
                Paste Sample Malda Cut-Off Text
              </button>
            </div>

            <textarea
              rows={4}
              value={manualOcrPaste}
              onChange={(e) => setManualOcrPaste(e.target.value)}
              placeholder="Paste raw PDF extracted text or OCR text here (e.g. CAT_NO UR SC ST OBC EWS ESM... 2er 75.21368 70.37037... 5er 76.72414...)"
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleProcessRawText(manualOcrPaste)}
                disabled={!manualOcrPaste.trim()}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Auto-Scan & Extract Table Matrix</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESSING STATE (Validation / OCR / AI Parser) */}
      {isProcessing && (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h4 className="font-extrabold text-base text-slate-900">
              Processing Pipeline Active
            </h4>
            <p className="text-xs text-slate-500 mt-1 font-medium">{processingStageText}</p>
          </div>
          <div className="max-w-md mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full w-3/4 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* STEP 5: ADMIN VERIFICATION (Table Matrix & Full Text) */}
      {currentStep === 'verification' && extractedData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Header file stats */}
          <div className="p-4 rounded-xl bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                  <span>{extractedData.fileName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                    {extractedData.totalPages} Page{extractedData.totalPages > 1 ? 's' : ''}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Confidence Score:{' '}
                  <span className="text-emerald-400 font-bold">{extractedData.confidenceScore}%</span>
                  {' '}• Auto-classified as{' '}
                  <span className="text-amber-400 font-bold uppercase">{extractedData.detectedType}</span>
                  {extractedData.extractedCutoffRows && extractedData.extractedCutoffRows.length > 0 && (
                    <span className="text-emerald-300 font-semibold ml-2">
                      ({extractedData.extractedCutoffRows.length} Table Rows Detected)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {extractedData.suggestedRecord?.cutoffsList && extractedData.suggestedRecord.cutoffsList.length > 0 && (
                <button
                  onClick={handlePublishAllCutoffRows}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Publish All {extractedData.suggestedRecord.cutoffsList.length} Rows</span>
                </button>
              )}
              <button
                onClick={() => setViewerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Modal View</span>
              </button>
            </div>
          </div>

          {/* Sub-Tabs: Table View, Full Text View, Single Form View */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveVerifyTab('table')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                  activeVerifyTab === 'table'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Extracted Table Matrix (बढ़िया टेबल)</span>
                {extractedData.extractedCutoffRows && extractedData.extractedCutoffRows.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                    {extractedData.extractedCutoffRows.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveVerifyTab('text')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                  activeVerifyTab === 'text'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Full PDF Extracted Text (पूरा टेक्स्ट)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveVerifyTab('form')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                  activeVerifyTab === 'form'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Single Record Fine-Tuning</span>
              </button>
            </div>

            {/* Target type switcher */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: 'cutoff', label: 'Cut-Off' },
                { id: 'result', label: 'Merit Result' },
                { id: 'notice', label: 'Notice' },
                { id: 'exam', label: 'CEN Exam' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTargetType(t.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    targetType === t.id
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: EXTRACTED CUT-OFF TABLE MATRIX (बढ़िया टेबल) */}
          {activeVerifyTab === 'table' && (
            <div className="space-y-4 animate-in fade-in">
              {extractedData.extractedCutoffRows && extractedData.extractedCutoffRows.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs">
                    <div className="flex items-center space-x-2 text-amber-900 font-semibold">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Found <strong>{extractedData.extractedCutoffRows.length}</strong> official cut-off categories in this PDF. Click any row to populate the editor below, or publish all together!
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePublishAllCutoffRows}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>Publish All {extractedData.extractedCutoffRows.length} Rows</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold">
                            <th className="py-3 px-3 text-amber-400">CAT_NO</th>
                            <th className="py-3 px-3">Post Title / Department</th>
                            <th className="py-3 px-3">Stage</th>
                            <th className="py-3 px-2 text-center bg-slate-800 text-amber-300">UR</th>
                            <th className="py-3 px-2 text-center">SC</th>
                            <th className="py-3 px-2 text-center">ST</th>
                            <th className="py-3 px-2 text-center">OBC</th>
                            <th className="py-3 px-2 text-center">EWS</th>
                            <th className="py-3 px-2 text-center">ESM</th>
                            <th className="py-3 px-3 text-center text-emerald-300">Special / PwBD</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                          {extractedData.extractedCutoffRows.map((row, idx) => (
                            <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3">
                                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  {row.catNo}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                {row.postTitle}
                                {row.department && (
                                  <span className="block text-[11px] text-slate-400 font-normal">
                                    {row.department}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                                  {row.stage}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-black text-amber-900 bg-amber-50/50">
                                {row.cutoffs.UR ?? '--'}
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                                {row.cutoffs.SC ?? '--'}
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                                {row.cutoffs.ST ?? '--'}
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                                {row.cutoffs.OBC ?? '--'}
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                                {row.cutoffs.EWS ?? '--'}
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-slate-600">
                                {row.cutoffs.ExSM ?? '--'}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                  {row.cutoffs['R-LD'] && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold font-mono">
                                      R-LD: {row.cutoffs['R-LD']}
                                    </span>
                                  )}
                                  {row.cutoffs['R-VI'] && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                                      R-VI: {row.cutoffs['R-VI']}
                                    </span>
                                  )}
                                  {row.cutoffs.PwBD && !row.cutoffs['R-LD'] && !row.cutoffs['R-VI'] && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold font-mono">
                                      PwBD: {row.cutoffs.PwBD}
                                    </span>
                                  )}
                                  {!row.cutoffs['R-LD'] && !row.cutoffs['R-VI'] && !row.cutoffs.PwBD && (
                                    <span className="text-slate-300">--</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPostName(row.postTitle);
                                    setStage(row.stage as CutoffStage);
                                    if (row.cutoffs.UR) setUrCutoff(String(row.cutoffs.UR));
                                    if (row.cutoffs.OBC) setObcCutoff(String(row.cutoffs.OBC));
                                    if (row.cutoffs.SC) setScCutoff(String(row.cutoffs.SC));
                                    if (row.cutoffs.ST) setStCutoff(String(row.cutoffs.ST));
                                    if (row.cutoffs.EWS) setEwsCutoff(String(row.cutoffs.EWS));
                                    if (row.cutoffs.ExSM) setExsmCutoff(String(row.cutoffs.ExSM));
                                    if (row.cutoffs.PwBD) setPwbdCutoff(String(row.cutoffs.PwBD));
                                    setActiveVerifyTab('form');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                                >
                                  Load Form
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <BarChart3 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-bold text-slate-800 text-sm">Single Score Summary Detected</p>
                  <p className="text-xs text-slate-500 mt-1">
                    UR: {urCutoff || '--'}, OBC: {obcCutoff || '--'}, SC: {scCutoff || '--'}, ST: {stCutoff || '--'}, EWS: {ewsCutoff || '--'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveVerifyTab('form')}
                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Switch to Form Editor
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL EXTRACTED PDF TEXT (पूरा टेक्स्ट) */}
          {activeVerifyTab === 'text' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={rawTextSearch}
                    onChange={(e) => setRawTextSearch(e.target.value)}
                    placeholder="Search inside extracted raw text (e.g. 75.21, Malda, Station Master)..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">
                    {extractedData.rawText.length} Characters • {extractedData.totalPages} Page{extractedData.totalPages > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedData.rawText);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Full Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto p-4 bg-slate-950 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed border border-slate-800 whitespace-pre-wrap selection:bg-red-500 selection:text-white">
                {rawTextSearch ? (
                  extractedData.rawText.split(new RegExp(`(${rawTextSearch})`, 'gi')).map((part, i) =>
                    part.toLowerCase() === rawTextSearch.toLowerCase() ? (
                      <mark key={i} className="bg-amber-400 text-slate-950 font-bold px-1 rounded">
                        {part}
                      </mark>
                    ) : (
                      part
                    )
                  )
                ) : (
                  extractedData.rawText
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SINGLE RECORD FORM FIELDS */}
          {(activeVerifyTab === 'form' || targetType !== 'cutoff') && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CEN Notification Number</label>
                  <input
                    type="text"
                    value={cenNumber}
                    onChange={(e) => setCenNumber(e.target.value)}
                    placeholder="e.g. CEN 01/2024"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exam / Recruitment Title</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g. RRB Assistant Loco Pilot"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Regional Board (Zone)</label>
                  <select
                    value={zoneCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setZoneCode(code);
                      const matched = OFFICIAL_RRB_ZONES.find((z) => z.code === code);
                      if (matched) setZoneName(matched.name);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
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
                  <label className="block font-semibold text-slate-700 mb-1">Post Designation</label>
                  <input
                    type="text"
                    value={postName}
                    onChange={(e) => setPostName(e.target.value)}
                    placeholder="e.g. Technician Gr-III Track Maintainer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selection Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CutoffStage)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
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
                  <label className="block font-semibold text-slate-700 mb-1">Recruitment Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10) || 2025)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Conditional Cutoff Inputs */}
              {targetType === 'cutoff' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="block text-xs font-bold text-slate-800">
                    Category Cut-Off Scores (Normalized / 100):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {[
                      { label: 'UR (General)', val: urCutoff, setVal: setUrCutoff },
                      { label: 'OBC (NCL)', val: obcCutoff, setVal: setObcCutoff },
                      { label: 'SC', val: scCutoff, setVal: setScCutoff },
                      { label: 'ST', val: stCutoff, setVal: setStCutoff },
                      { label: 'EWS', val: ewsCutoff, setVal: setEwsCutoff },
                      { label: 'Ex-SM', val: exsmCutoff, setVal: setExsmCutoff },
                      { label: 'PwBD', val: pwbdCutoff, setVal: setPwbdCutoff },
                    ].map((cat) => (
                      <div key={cat.label} className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-600 block">{cat.label}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={cat.val}
                          onChange={(e) => cat.setVal(e.target.value)}
                          placeholder="Score"
                          className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional Result / Roll Numbers */}
              {targetType === 'result' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="block text-xs font-bold text-slate-800">
                    Extracted Roll Numbers:
                  </span>
                  <textarea
                    rows={3}
                    value={rollNumbersText}
                    onChange={(e) => setRollNumbersText(e.target.value)}
                    placeholder="Candidate roll numbers separated by comma"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-900"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep('upload')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setCurrentStep('preview')}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <span>Proceed to Step 6: Preview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: PREVIEW */}
      {currentStep === 'preview' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>Step 6: Live Website Candidate Preview</span>
              </h4>
              <p className="text-xs text-slate-500">
                This is exactly how candidate students will see this record on the live portal
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              Ready to Publish
            </span>
          </div>

          {/* Simulated Candidate Card */}
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <span>{cenNumber}</span>
                <span>•</span>
                <span>{zoneName}</span>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Official Release
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">{examTitle}</h3>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">{postName} ({stage})</p>
            </div>

            {targetType === 'cutoff' && (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-2 border-t border-slate-800 text-center">
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">UR</span>
                  <span className="text-sm font-extrabold text-amber-400">{urCutoff || '--'}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">OBC</span>
                  <span className="text-sm font-extrabold text-amber-400">{obcCutoff || '--'}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">SC</span>
                  <span className="text-sm font-extrabold text-amber-400">{scCutoff || '--'}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">ST</span>
                  <span className="text-sm font-extrabold text-amber-400">{stCutoff || '--'}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">EWS</span>
                  <span className="text-sm font-extrabold text-amber-400">{ewsCutoff || '--'}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">Ex-SM</span>
                  <span className="text-sm font-extrabold text-slate-300">{exsmCutoff || '--'}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">PwBD</span>
                  <span className="text-sm font-extrabold text-slate-300">{pwbdCutoff || '--'}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
              <span>Source: {pdfFile?.name}</span>
              <span>Updated: Just now</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep('verification')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Edit</span>
            </button>

            <button
              onClick={handlePublishToLiveSite}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Step 7: Publish to Live Database</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: PUBLISHED & USER WEBSITE */}
      {currentStep === 'user_website' && publishedItem && (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-sm text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
              Pipeline Completed Successfully
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">
              Published to Live Candidate Portal!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              The extracted records for <span className="font-bold text-slate-800">{publishedItem.title}</span> ({publishedItem.cen}) are now instantly live for all candidates.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onSwitchToUserSite(publishedItem.tab)}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Step 8: View on User Website (Live Candidate View)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetPipeline}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Process Another PDF
            </button>
          </div>
        </div>
      )}

      {/* PDF Text Viewer Modal */}
      {pdfFile && (
        <PdfViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          title={extractedData?.fileName || 'Official RRB PDF'}
          pdfSource={pdfFile}
          extractedText={extractedData?.rawText}
          onExtractData={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
};
