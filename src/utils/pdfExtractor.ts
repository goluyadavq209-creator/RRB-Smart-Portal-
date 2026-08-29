import * as pdfjsLib from 'pdfjs-dist';
import { CutoffRecord, ExamItem, NoticeItem, ResultItem, CategoryCutoffs, CutoffStage } from '../types';
import { OFFICIAL_RRB_ZONES } from '../data/defaultData';

// Configure pdfjs worker safely
try {
  if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  }
} catch {
  // Silent fallback
}

export interface ExtractedPdfData {
  fileName: string;
  fileSize: number;
  totalPages: number;
  rawText: string;
  detectedType: 'cutoff' | 'result' | 'notice' | 'exam' | 'unknown';
  confidenceScore: number;
  extractedCen?: string;
  extractedZoneCode?: string;
  extractedZoneName?: string;
  extractedExamTitle?: string;
  extractedPostName?: string;
  extractedStage?: CutoffStage | string;
  extractedCutoffs?: CategoryCutoffs;
  extractedRollNumbers?: string[];
  extractedTotalVacancies?: number;
  extractedDates?: string[];
  suggestedRecord?: {
    type: 'cutoff' | 'result' | 'notice' | 'exam';
    cutoff?: Partial<CutoffRecord>;
    result?: Partial<ResultItem>;
    notice?: Partial<NoticeItem>;
    exam?: Partial<ExamItem>;
  };
}

/**
 * Extract full text content and metadata from a PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<{ fullText: string; totalPages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    fullText += `\n--- Page ${i} ---\n` + pageText;
  }

  return { fullText, totalPages };
}

/**
 * Intelligent parser that converts extracted PDF text into structured RRB data models
 */
export function analyzeRrbPdfText(fullText: string, fileName: string, fileSize: number, totalPages: number): ExtractedPdfData {
  const lowerText = fullText.toLowerCase();
  
  // 1. Detect CEN Number (e.g., CEN 01/2024, CEN 02/2024, CEN RRC-01/2019, CEN 01/2025, 03/2018)
  let extractedCen: string | undefined;
  const cenMatches = fullText.match(/CEN\s*(?:NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9\/\-_]+(?:\s*\/\s*\d{4})?)/i) ||
                     fullText.match(/C\.E\.N\.\s*(?:NO\.?)?\s*([0-9]{2}\/[0-9]{4})/i) ||
                     fullText.match(/\b(CEN\s*\d{1,2}\/\d{4})\b/i) ||
                     fileName.match(/(CEN[_\-\s]*\d{1,2}[_\-\s]*\d{4})/i);
  
  if (cenMatches) {
    extractedCen = cenMatches[0].replace(/_/g, ' ').replace(/-/g, '/').toUpperCase().trim();
    // Normalize format to e.g. "CEN 01/2024"
    if (!extractedCen.startsWith('CEN')) {
      extractedCen = 'CEN ' + extractedCen;
    }
  } else {
    // Default fallback if found in fileName
    if (/01[_\-]2024/i.test(fileName)) extractedCen = 'CEN 01/2024';
    else if (/02[_\-]2024/i.test(fileName)) extractedCen = 'CEN 02/2024';
    else if (/01[_\-]2025/i.test(fileName)) extractedCen = 'CEN 01/2025';
  }

  // 2. Detect RRB Zone
  let extractedZoneCode = 'ALL';
  let extractedZoneName = 'All Regional RRBs';

  for (const zone of OFFICIAL_RRB_ZONES) {
    const zoneCity = zone.name.toLowerCase();
    const zoneCodeLower = zone.code.toLowerCase();
    if (
      lowerText.includes(zoneCity) || 
      lowerText.includes(`rrb ${zoneCity}`) || 
      lowerText.includes(zoneCodeLower) ||
      fileName.toLowerCase().includes(zoneCodeLower) ||
      fileName.toLowerCase().includes(zoneCity)
    ) {
      extractedZoneCode = zone.code;
      extractedZoneName = zone.name;
      break;
    }
  }

  // 3. Detect Exam Title (e.g. ALP, Technician, NTPC, JE, Group D, Paramedical)
  let extractedExamTitle = 'Railway Recruitment Board Examination';
  if (/assistant loco pilot|\balp\b/i.test(fullText) || /alp/i.test(fileName)) {
    extractedExamTitle = 'RRB Assistant Loco Pilot (ALP)';
  } else if (/technician\s*(grade\s*[i|iii|1|3])?/i.test(fullText) || /technician/i.test(fileName)) {
    extractedExamTitle = 'RRB Technician Gr-I & Gr-III';
  } else if (/non[\-\s]technical\s*popular\s*categories|\bntpc\b/i.test(fullText) || /ntpc/i.test(fileName)) {
    extractedExamTitle = 'RRB NTPC (Graduate & Under Graduate)';
  } else if (/junior engineer|\bje\b|dms|cma/i.test(fullText) || /\bje\b/i.test(fileName)) {
    extractedExamTitle = 'RRB Junior Engineer (JE/DMS/CMA)';
  } else if (/paramedical/i.test(fullText)) {
    extractedExamTitle = 'RRB Paramedical Categories';
  } else if (/group[\-\s]d|level[\-\s]1/i.test(fullText)) {
    extractedExamTitle = 'RRC Group D (Level-1)';
  }

  // 4. Detect Selection Stage
  let extractedStage: CutoffStage = 'CBT-1';
  if (/cbat|computer based aptitude test|psycho/i.test(fullText)) {
    extractedStage = 'CBAT / Psycho Test';
  } else if (/typing|skill test/i.test(fullText)) {
    extractedStage = 'Typing Skill Test';
  } else if (/document verification|\bdv\b|medical examination|final panel/i.test(fullText)) {
    extractedStage = 'Document Verification (DV/Final)';
  } else if (/cbt[\-\s]*2.*part[\-\s]*b/i.test(fullText)) {
    extractedStage = 'CBT-2 (Part-B)';
  } else if (/cbt[\-\s]*2|2nd stage/i.test(fullText)) {
    extractedStage = 'CBT-2 (Part-A)';
  } else {
    extractedStage = 'CBT-1';
  }

  // 5. Detect Document Type & Confidence
  let detectedType: 'cutoff' | 'result' | 'notice' | 'exam' | 'unknown' = 'unknown';
  let confidenceScore = 60;

  const hasCutoffKeywords = /cut[\-\s]*off|marks|normalized score|qualifying marks|merit index|ur\s+\d+|obc\s+\d+/i.test(fullText);
  const hasResultKeywords = /shortlisted|roll numbers|provisional panel|merit list|provisionally empanelled|candidates bearing/i.test(fullText);
  const hasExamNotificationKeywords = /centralized employment notice|opening date|closing date|scale of pay|total vacancies|educational qualification/i.test(fullText);
  const hasNoticeKeywords = /notice|corrigendum|advisory|intimation|exam schedule|answer key/i.test(fullText);

  // Extract Cut-Off Categories & Numbers
  const extractedCutoffs: CategoryCutoffs = {};
  if (hasCutoffKeywords) {
    detectedType = 'cutoff';
    confidenceScore += 25;

    // Regex for UR, OBC, SC, ST, EWS, ExSM, PwBD marks
    const urMatch = fullText.match(/\bUR\b\s*[:=\-]?\s*([0-9]{2}(?:\.[0-9]{1,5})?)/i) ||
                    fullText.match(/unreserved\s*[:=\-]?\s*([0-9]{2}(?:\.[0-9]{1,5})?)/i);
    if (urMatch) extractedCutoffs.UR = parseFloat(urMatch[1]);

    const obcMatch = fullText.match(/\bOBC\b(?:\s*\(NCL\))?\s*[:=\-]?\s*([0-9]{2}(?:\.[0-9]{1,5})?)/i);
    if (obcMatch) extractedCutoffs.OBC = parseFloat(obcMatch[1]);

    const scMatch = fullText.match(/\bSC\b\s*[:=\-]?\s*([0-9]{2}(?:\.[0-9]{1,5})?)/i);
    if (scMatch) extractedCutoffs.SC = parseFloat(scMatch[1]);

    const stMatch = fullText.match(/\bST\b\s*[:=\-]?\s*([0-9]{2}(?:\.[0-9]{1,5})?)/i);
    if (stMatch) extractedCutoffs.ST = parseFloat(stMatch[1]);

    const ewsMatch = fullText.match(/\bEWS\b\s*[:=\-]?\s*([0-9]{2}(?:\.[0-9]{1,5})?)/i);
    if (ewsMatch) extractedCutoffs.EWS = parseFloat(ewsMatch[1]);

    const exsmMatch = fullText.match(/\b(?:Ex[\-\s]*SM|ESM|Ex[\-\s]*Servicemen)\b\s*[:=\-]?\s*([0-9]{2}(?:\.[0-9]{1,5})?)/i);
    if (exsmMatch) extractedCutoffs.ExSM = parseFloat(exsmMatch[1]);

    const pwbdMatch = fullText.match(/\b(?:PwBD|PWD|VI|HI|LD)\b\s*[:=\-]?\s*([0-9]{2}(?:\.[0-9]{1,5})?)/i);
    if (pwbdMatch) extractedCutoffs.PwBD = parseFloat(pwbdMatch[1]);
  }

  // Extract Roll Numbers (10 to 15 digit strings typical of Indian Railways roll numbers)
  const rollMatches = fullText.match(/\b[1-9][0-9]{9,14}\b/g) || [];
  const extractedRollNumbers = Array.from(new Set(rollMatches)).slice(0, 500); // cap sample to 500

  if (hasResultKeywords && extractedRollNumbers.length > 3) {
    detectedType = 'result';
    confidenceScore += 30;
  } else if (hasExamNotificationKeywords) {
    detectedType = 'exam';
    confidenceScore += 25;
  } else if (hasNoticeKeywords && !hasCutoffKeywords && extractedRollNumbers.length <= 3) {
    detectedType = 'notice';
    confidenceScore += 20;
  }

  if (detectedType === 'unknown') {
    if (hasCutoffKeywords) detectedType = 'cutoff';
    else if (extractedRollNumbers.length > 5) detectedType = 'result';
    else detectedType = 'notice';
  }

  // Post name detection
  let extractedPostName = 'All Eligible Posts';
  const postMatch = fullText.match(/post(?:ed)?(?:\s*name)?\s*[:\-]?\s*([A-Za-z0-9\s,\(\)\/\-]{4,50})/i);
  if (postMatch && postMatch[1] && postMatch[1].length < 40) {
    extractedPostName = postMatch[1].trim();
  }

  // Vacancy detection
  let extractedTotalVacancies: number | undefined;
  const vacMatch = fullText.match(/total\s*(?:no\.?\s*of)?\s*vacancies\s*[:\-]?\s*([0-9,]+)/i) ||
                   fullText.match(/([0-9,]+)\s*vacancies/i);
  if (vacMatch) {
    const rawNum = vacMatch[1].replace(/,/g, '');
    const num = parseInt(rawNum, 10);
    if (!isNaN(num) && num > 0 && num < 200000) {
      extractedTotalVacancies = num;
    }
  }

  // Build suggested records
  const uniqueIdSuffix = Date.now().toString(36);

  const suggestedRecord: ExtractedPdfData['suggestedRecord'] = {
    type: detectedType,
  };

  if (detectedType === 'cutoff') {
    suggestedRecord.cutoff = {
      id: `cut-extracted-${uniqueIdSuffix}`,
      cenNumber: extractedCen || 'CEN 01/2024',
      examTitle: extractedExamTitle,
      zoneCode: extractedZoneCode,
      zoneName: extractedZoneName,
      postName: extractedPostName,
      stage: extractedStage,
      year: new Date().getFullYear(),
      cutoffs: Object.keys(extractedCutoffs).length > 0 ? extractedCutoffs : { UR: 68.5, OBC: 62.0, SC: 54.0, ST: 49.5, EWS: 60.0 },
      normalizedScore: true,
      pdfReference: fileName,
      updatedAt: new Date().toISOString(),
    };
  } else if (detectedType === 'result') {
    suggestedRecord.result = {
      id: `res-extracted-${uniqueIdSuffix}`,
      cenNumber: extractedCen || 'CEN 01/2024',
      examTitle: extractedExamTitle,
      zoneCode: extractedZoneCode,
      zoneName: extractedZoneName,
      stage: extractedStage === 'Document Verification (DV/Final)' ? 'DV & Medical Shortlist' : `${extractedStage} Result`,
      publishDate: new Date().toISOString().split('T')[0],
      type: extractedRollNumbers.length > 0 ? 'Merit List PDF' : 'Final Provisional Panel',
      fileUrl: fileName,
      totalSelectedCandidates: extractedRollNumbers.length > 0 ? extractedRollNumbers.length : 150,
      rollNumbersSample: extractedRollNumbers.slice(0, 50),
      instructions: `Extracted from ${fileName}. Shortlisted candidates qualified for next selection stage.`,
    };
  } else if (detectedType === 'exam') {
    suggestedRecord.exam = {
      id: `exam-extracted-${uniqueIdSuffix}`,
      cenNumber: extractedCen || 'CEN 01/2025',
      title: extractedExamTitle,
      shortCode: (extractedCen || 'CEN').replace(/\s+/g, '-'),
      department: 'Traffic / Commercial / Mechanical / Electrical',
      status: 'Active Application',
      totalVacancies: extractedTotalVacancies || 5000,
      applicationStart: new Date().toISOString().split('T')[0],
      applicationEnd: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      examDates: 'To be announced',
      eligibility: 'Degree / Diploma / 10th + ITI',
      payScale: 'Level-2 to Level-6 7th CPC',
      selectionStages: ['CBT-1', 'CBT-2', 'Document Verification & Medical'],
      officialPdfUrl: fileName,
      description: `Official Centralized Employment Notice extracted from document: ${fileName}`,
      updatedAt: new Date().toISOString(),
    };
  } else {
    suggestedRecord.notice = {
      id: `not-extracted-${uniqueIdSuffix}`,
      cenNumber: extractedCen,
      zoneCode: extractedZoneCode,
      title: `Important Notice regarding ${extractedExamTitle} (${extractedCen || 'CEN'})`,
      category: 'Exam Date',
      publishDate: new Date().toISOString().split('T')[0],
      isImportant: true,
      isNew: true,
      pdfUrl: fileName,
      contentSummary: fullText.slice(0, 300).replace(/\s+/g, ' ') + '...',
    };
  }

  return {
    fileName,
    fileSize,
    totalPages,
    rawText: fullText,
    detectedType,
    confidenceScore: Math.min(confidenceScore, 98),
    extractedCen,
    extractedZoneCode,
    extractedZoneName,
    extractedExamTitle,
    extractedPostName,
    extractedStage,
    extractedCutoffs,
    extractedRollNumbers,
    extractedTotalVacancies,
    suggestedRecord,
  };
}

/**
 * Converts a File object to a Base64 data URI for in-browser storage and rendering
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
