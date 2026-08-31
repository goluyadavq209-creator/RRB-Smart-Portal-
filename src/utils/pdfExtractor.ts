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

export interface ExtractedCutoffRow {
  id: string;
  catNo: string;
  department?: string; // ER, SER, NR, WR, etc.
  postTitle: string;
  stage: CutoffStage | string;
  cutoffs: CategoryCutoffs;
  rawTextRow?: string;
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
  extractedCutoffRows?: ExtractedCutoffRow[];
  extractedRollNumbers?: string[];
  extractedTotalVacancies?: number;
  extractedDates?: string[];
  suggestedRecord?: {
    type: 'cutoff' | 'result' | 'notice' | 'exam';
    cutoff?: Partial<CutoffRecord>;
    cutoffsList?: Partial<CutoffRecord>[];
    result?: Partial<ResultItem>;
    notice?: Partial<NoticeItem>;
    exam?: Partial<ExamItem>;
  };
}

export interface PdfRollSearchResult {
  found: boolean;
  searchedRoll: string;
  matchedRoll?: string;
  pageNumber?: number;
  totalPages: number;
  snippet?: string;
  fileName: string;
  detectedCen?: string;
  detectedZone?: string;
  detectedExamTitle?: string;
  detectedStage?: string;
  totalRollNumbersInPdf: number;
  allFoundRollsSample: string[];
}

/**
 * Directly search for a Roll Number across all pages of a PDF document
 */
export async function searchRollNumberInPdf(
  source: File | ArrayBuffer | string,
  fileName: string,
  targetRoll: string,
  onProgress?: (currentPage: number, totalPages: number) => void
): Promise<PdfRollSearchResult> {
  const cleanTarget = targetRoll.trim().toLowerCase().replace(/[\s\-_]/g, '');
  if (!cleanTarget) {
    throw new Error('Target Roll Number is required for searching in PDF.');
  }

  let loadingTask: any;
  if (source instanceof File) {
    const buffer = await source.arrayBuffer();
    loadingTask = pdfjsLib.getDocument({ data: buffer });
  } else if (source instanceof ArrayBuffer) {
    loadingTask = pdfjsLib.getDocument({ data: source });
  } else if (typeof source === 'string' && source.startsWith('data:')) {
    loadingTask = pdfjsLib.getDocument({ url: source });
  } else if (typeof source === 'string') {
    loadingTask = pdfjsLib.getDocument({ url: source });
  } else {
    throw new Error('Unsupported PDF source.');
  }

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  let fullPdfText = '';
  let found = false;
  let matchedRoll: string | undefined;
  let matchedPageNumber: number | undefined;
  let matchedSnippet: string | undefined;
  const allExtractedRolls: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, totalPages);
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    
    fullPdfText += `\n--- Page ${pageNum} ---\n` + pageText;

    // Extract all candidate roll numbers on this page (10 to 16 digits typical in Railway exams)
    const pageRollMatches = pageText.match(/\b[1-9][0-9]{8,15}\b/g) || [];
    pageRollMatches.forEach((r: string) => {
      if (!allExtractedRolls.includes(r)) {
        allExtractedRolls.push(r);
      }
    });

    if (!found) {
      // 1. Exact match check against extracted rolls
      const exact = pageRollMatches.find((r: string) => r.toLowerCase() === cleanTarget);
      
      // 2. Fallback check: Normalized text search
      const normalizedPageText = pageText.replace(/[\s\-_]/g, '').toLowerCase();
      const hasNormalizedMatch = normalizedPageText.includes(cleanTarget);

      if (exact || hasNormalizedMatch) {
        found = true;
        matchedRoll = exact || targetRoll;
        matchedPageNumber = pageNum;

        // Create a readable context snippet
        const idx = pageText.indexOf(exact || targetRoll);
        if (idx !== -1) {
          const start = Math.max(0, idx - 80);
          const end = Math.min(pageText.length, idx + 120);
          matchedSnippet = (start > 0 ? '...' : '') + pageText.substring(start, end).replace(/\s+/g, ' ') + (end < pageText.length ? '...' : '');
        } else {
          matchedSnippet = `Found matching roll sequence on Page ${pageNum} of ${fileName}`;
        }
      }
    }
  }

  // Analyze metadata from full PDF text (CEN, Zone, Exam, Stage)
  const analysis = analyzeRrbPdfText(fullPdfText, fileName, 0, totalPages);

  return {
    found,
    searchedRoll: targetRoll,
    matchedRoll: matchedRoll || targetRoll,
    pageNumber: matchedPageNumber,
    totalPages,
    snippet: matchedSnippet,
    fileName,
    detectedCen: analysis.extractedCen || 'CEN 01/2024',
    detectedZone: analysis.extractedZoneName || 'Regional RRB Board',
    detectedExamTitle: analysis.extractedExamTitle || 'Railway Recruitment Examination',
    detectedStage: analysis.extractedStage || 'Shortlisted for Next Stage',
    totalRollNumbersInPdf: allExtractedRolls.length,
    allFoundRollsSample: allExtractedRolls.slice(0, 100),
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
export function extractStructuredCutoffRows(
  text: string, 
  defaultStage: string, 
  cen: string, 
  zoneCode: string, 
  zoneName: string, 
  examTitle: string
): { rows: ExtractedCutoffRow[]; cutoffsList: CutoffRecord[] } {
  const rows: ExtractedCutoffRow[] = [];
  const cutoffsList: CutoffRecord[] = [];
  
  // Look for category rows like "2er 75.21368 70.37037 68.09118 74.92878 74.13793 46.26437"
  const rowPattern = /\b([0-9]{1,2}[a-zA-Z]{0,4})\s+([0-9]{1,2}(?:\.[0-9]+)?)\s+([0-9]{1,2}(?:\.[0-9]+)?)\s+([0-9]{1,2}(?:\.[0-9]+)?)\s+([0-9]{1,2}(?:\.[0-9]+)?)\s+([0-9]{1,2}(?:\.[0-9]+)?)\s+([0-9]{1,2}(?:\.[0-9]+)?)(?:\s+([0-9]{1,2}(?:\.[0-9]+)?))?(?:\s+([0-9]{1,2}(?:\.[0-9]+)?))?/gi;
  
  let match;
  while ((match = rowPattern.exec(text)) !== null) {
    const rawCat = match[1].toLowerCase();
    const ur = parseFloat(match[2]);
    const sc = parseFloat(match[3]);
    const st = parseFloat(match[4]);
    const obc = parseFloat(match[5]);
    const ews = parseFloat(match[6]);
    const esm = parseFloat(match[7]);
    const extra1 = match[8] ? parseFloat(match[8]) : undefined;
    const extra2 = match[9] ? parseFloat(match[9]) : undefined;

    // Filter out false positives (ensure scores are valid 0-100 range)
    if (ur > 100 || sc > 100 || st > 100 || obc > 100 || ews > 100) continue;

    let dept = '';
    if (rawCat.includes('ser')) dept = 'SER (South Eastern Railway)';
    else if (rawCat.includes('er')) dept = 'ER (Eastern Railway)';
    else if (rawCat.includes('wr')) dept = 'WR (Western Railway)';
    else if (rawCat.includes('cr')) dept = 'CR (Central Railway)';
    else if (rawCat.includes('nr')) dept = 'NR (Northern Railway)';

    const catNumberOnly = rawCat.replace(/[^0-9]/g, '');
    let derivedPost = `Category ${rawCat.toUpperCase()} Post`;
    if (catNumberOnly === '2') derivedPost = `Category 2 (${dept || 'ER'}) - Station Master / CBAT`;
    else if (catNumberOnly === '5') derivedPost = `Category 5 (${dept || 'ER/SER'}) - Sr. Clerk Cum Typist / CBTST`;
    else if (catNumberOnly === '1') derivedPost = `Category 1 (${dept || 'ER'}) - Commercial Apprentice`;
    else if (catNumberOnly === '3') derivedPost = `Category 3 (${dept || 'ER'}) - Goods Guard / Train Manager`;
    else if (catNumberOnly === '4') derivedPost = `Category 4 (${dept || 'ER'}) - Jr. Accounts Assistant Cum Typist`;

    // Detect stage for this context from surrounding text
    const textBefore = text.slice(Math.max(0, match.index - 350), match.index).toLowerCase();
    let rowStage: CutoffStage = defaultStage as CutoffStage;
    if (textBefore.includes('cbat') || textBefore.includes('सीबीएटी') || textBefore.includes('psycho') || catNumberOnly === '2') {
      rowStage = 'CBAT / Psycho Test';
    } else if (textBefore.includes('cbtst') || textBefore.includes('सीबीटीएसटी') || textBefore.includes('typing') || textBefore.includes('skill') || catNumberOnly === '5') {
      rowStage = 'Typing Skill Test';
    }

    const cutoffsObj: CategoryCutoffs = {
      UR: ur,
      SC: sc,
      ST: st,
      OBC: obc,
      EWS: ews,
      ExSM: esm,
    };

    if (extra1 !== undefined && extra1 < 100) {
      if (rawCat === '5er') {
        cutoffsObj['R-LD'] = extra1;
        cutoffsObj.PwBD = extra1;
      } else if (rawCat === '5ser') {
        cutoffsObj['R-VI'] = extra1;
        cutoffsObj.PwBD = extra1;
      } else {
        cutoffsObj.PwBD = extra1;
      }
    }
    if (extra2 !== undefined && extra2 < 100) {
      cutoffsObj['R-HI'] = extra2;
    }

    const rowId = `cut-row-${rawCat}-${Date.now().toString(36)}-${rows.length}`;
    rows.push({
      id: rowId,
      catNo: rawCat.toUpperCase(),
      department: dept,
      postTitle: derivedPost,
      stage: rowStage,
      cutoffs: cutoffsObj,
      rawTextRow: match[0],
    });

    cutoffsList.push({
      id: rowId,
      cenNumber: cen,
      examTitle: examTitle,
      zoneCode: zoneCode,
      zoneName: zoneName,
      postName: derivedPost,
      stage: rowStage,
      year: new Date().getFullYear(),
      cutoffs: cutoffsObj,
      normalizedScore: true,
      updatedAt: new Date().toISOString(),
    });
  }

  return { rows, cutoffsList };
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

  // 6. Multi-Row Structured Cut-Off Table Extraction
  const { rows: extractedCutoffRows, cutoffsList: extractedCutoffsList } = extractStructuredCutoffRows(
    fullText,
    extractedStage,
    extractedCen || 'CEN 01/2024',
    extractedZoneCode,
    extractedZoneName,
    extractedExamTitle
  );

  // If table rows are found, mark as cutoff type with high confidence
  if (extractedCutoffRows.length > 0) {
    detectedType = 'cutoff';
    confidenceScore = Math.max(confidenceScore, 95);
  }

  // Build suggested records
  const uniqueIdSuffix = Date.now().toString(36);

  const suggestedRecord: ExtractedPdfData['suggestedRecord'] = {
    type: detectedType,
    cutoffsList: extractedCutoffsList.length > 0 ? extractedCutoffsList : undefined,
  };

  if (detectedType === 'cutoff') {
    const primaryRow = extractedCutoffRows[0];
    const resolvedCutoffs = primaryRow ? primaryRow.cutoffs : (Object.keys(extractedCutoffs).length > 0 ? extractedCutoffs : { UR: 68.5, OBC: 62.0, SC: 54.0, ST: 49.5, EWS: 60.0 });
    const resolvedPost = primaryRow ? primaryRow.postTitle : extractedPostName;
    const resolvedStage = primaryRow ? (primaryRow.stage as CutoffStage) : extractedStage;

    suggestedRecord.cutoff = {
      id: `cut-extracted-${uniqueIdSuffix}`,
      cenNumber: extractedCen || 'CEN 01/2024',
      examTitle: extractedExamTitle,
      zoneCode: extractedZoneCode,
      zoneName: extractedZoneName,
      postName: resolvedPost,
      stage: resolvedStage,
      year: new Date().getFullYear(),
      cutoffs: resolvedCutoffs,
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
    extractedCutoffRows,
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
