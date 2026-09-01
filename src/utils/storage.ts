import { CutoffRecord, ExamItem, FullRRBDatabase, NoticeItem, ResultItem, CandidatePortalLink, OFFICIAL_RRB_DIGIALM_LOGIN_URL } from '../types';
import { INITIAL_EMPTY_DATABASE, OFFICIAL_RRB_ZONES, SAMPLE_TEMPLATE_DATABASE, DEFAULT_CANDIDATE_PORTAL_LINKS, REAL_OFFICIAL_CUTOFFS } from '../data/defaultData';
import { saveToIndexedDBVault, loadFromIndexedDBVault, requestPersistentStorage } from './indexedDbStorage';

const STORAGE_KEY = 'rrb_portal_database_clean_v3';

export function loadRRBDatabase(): FullRRBDatabase {
  try {
    // Attempt to request persistent high-capacity browser quota
    if (typeof window !== 'undefined') {
      requestPersistentStorage().catch(() => {});
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EMPTY_DATABASE));
      saveToIndexedDBVault(INITIAL_EMPTY_DATABASE).catch(() => {});
      return INITIAL_EMPTY_DATABASE;
    }
    const parsed = JSON.parse(raw) as FullRRBDatabase;

    if (!parsed.metadata?.version || parsed.metadata.version !== '3.0.0-CLEAN') {
      saveRRBDatabase(INITIAL_EMPTY_DATABASE);
      return INITIAL_EMPTY_DATABASE;
    }
    
    const exams = (Array.isArray(parsed.exams) ? parsed.exams : []).filter(Boolean).map((ex) => ({
      ...ex,
      admitCardUrl: ex?.admitCardUrl || OFFICIAL_RRB_DIGIALM_LOGIN_URL,
      cityIntimationUrl: ex?.cityIntimationUrl || OFFICIAL_RRB_DIGIALM_LOGIN_URL,
    }));
    const loadedCutoffs = (Array.isArray(parsed.cutoffs) ? parsed.cutoffs : []).filter(Boolean);
    // Ensure official Malda / latest cutoffs exist
    const cutoffIdSet = new Set(loadedCutoffs.map((c) => c.id));
    const mergedCutoffs = [...loadedCutoffs];
    REAL_OFFICIAL_CUTOFFS.forEach((official) => {
      if (!cutoffIdSet.has(official.id)) {
        mergedCutoffs.push(official);
        cutoffIdSet.add(official.id);
      }
    });

    const notices = (Array.isArray(parsed.notices) ? parsed.notices : []).filter(Boolean);
    const results = (Array.isArray(parsed.results) ? parsed.results : []).filter(Boolean);
    const portalLinks = (Array.isArray(parsed.portalLinks) ? parsed.portalLinks : []).filter(Boolean).map((pl) => ({
      ...pl,
      url: pl?.url || OFFICIAL_RRB_DIGIALM_LOGIN_URL,
    }));

    const finalDatabase: FullRRBDatabase = {
      metadata: parsed.metadata || INITIAL_EMPTY_DATABASE.metadata,
      settings: parsed.settings || INITIAL_EMPTY_DATABASE.settings,
      telegramSettings: parsed.telegramSettings || INITIAL_EMPTY_DATABASE.telegramSettings,
      telegramMessages: Array.isArray(parsed.telegramMessages) && parsed.telegramMessages.length > 0 
        ? parsed.telegramMessages 
        : (INITIAL_EMPTY_DATABASE.telegramMessages || []),
      posts: Array.isArray(parsed.posts) && parsed.posts.length > 0 
        ? parsed.posts 
        : (INITIAL_EMPTY_DATABASE.posts || []),
      aiLogs: Array.isArray(parsed.aiLogs) ? parsed.aiLogs : (INITIAL_EMPTY_DATABASE.aiLogs || []),
      zones: Array.isArray(parsed.zones) && parsed.zones.length > 0 ? parsed.zones : OFFICIAL_RRB_ZONES,
      exams,
      cutoffs: mergedCutoffs,
      notices,
      results,
      portalLinks,
    };

    // Mirror in high-capacity 1TB IndexedDB vault
    saveToIndexedDBVault(finalDatabase).catch(() => {});

    return finalDatabase;
  } catch (err) {
    console.error('Failed to load RRB database from storage:', err);
    return INITIAL_EMPTY_DATABASE;
  }
}

let lastKnownServerVersion = 0;

export async function fetchServerDatabase(): Promise<FullRRBDatabase | null> {
  try {
    const res = await fetch('/api/database');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.database) {
      if (json.version) lastKnownServerVersion = json.version;
      return json.database as FullRRBDatabase;
    }
    return null;
  } catch (err) {
    console.warn('Could not reach central database API, using local vault:', err);
    return null;
  }
}

export function saveRRBDatabase(data: FullRRBDatabase): boolean {
  try {
    const dataToSave: FullRRBDatabase = {
      ...data,
      metadata: {
        ...data.metadata,
        version: '3.0.0-CLEAN',
        lastUpdated: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    
    // Save to 1TB IndexedDB High-Capacity Vault asynchronously
    saveToIndexedDBVault(dataToSave).catch((err) => {
      console.warn('1TB IndexedDB background sync warning:', err);
    });

    // Synchronize to Server so all devices receive the update in real-time
    fetch('/api/database/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.version) lastKnownServerVersion = res.version;
      })
      .catch((err) => {
        console.warn('Background server sync warning:', err);
      });

    return true;
  } catch (err) {
    console.error('Failed to save RRB database:', err);
    return false;
  }
}

// Subscribe to real-time live database updates across all devices (SSE + Fallback Polling)
export function subscribeToLiveDatabase(onUpdate: (db: FullRRBDatabase) => void): () => void {
  let isCancelled = false;
  let eventSource: EventSource | null = null;
  let pollTimer: any = null;

  // 1. Establish Server-Sent Events (SSE) stream for instantaneous push
  try {
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      eventSource = new EventSource('/api/database/events');
      
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'DATABASE_UPDATED' && payload.version) {
            if (payload.version !== lastKnownServerVersion) {
              lastKnownServerVersion = payload.version;
              fetchServerDatabase().then((db) => {
                if (db && !isCancelled) {
                  onUpdate(db);
                }
              });
            }
          }
        } catch {
          // ignore parsing error
        }
      };

      eventSource.onerror = () => {
        // SSE error, will auto-reconnect or rely on fast version polling
      };
    }
  } catch {
    // SSE fallback
  }

  // 2. Fast fallback Polling (every 2.5s) to guarantee updates on every network condition
  const checkVersion = async () => {
    if (isCancelled) return;
    try {
      const res = await fetch('/api/database/version');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.version && data.version !== lastKnownServerVersion) {
          lastKnownServerVersion = data.version;
          const freshDb = await fetchServerDatabase();
          if (freshDb && !isCancelled) {
            onUpdate(freshDb);
          }
        }
      }
    } catch {
      // ignore transient network glitch
    }
  };

  pollTimer = setInterval(checkVersion, 2500);

  return () => {
    isCancelled = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

export function clearRRBDatabase(): FullRRBDatabase {
  const empty: FullRRBDatabase = {
    ...INITIAL_EMPTY_DATABASE,
    metadata: {
      ...INITIAL_EMPTY_DATABASE.metadata,
      lastUpdated: new Date().toISOString(),
      notes: 'Cleared by Admin. Database has zero custom records.',
    },
  };
  saveRRBDatabase(empty);
  return empty;
}

export function loadSampleDataset(): FullRRBDatabase {
  saveRRBDatabase(SAMPLE_TEMPLATE_DATABASE);
  return SAMPLE_TEMPLATE_DATABASE;
}

export function exportDatabaseAsJson(data: FullRRBDatabase, filename = 'rrb_data_export.json'): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportCutoffsToCsv(cutoffs: CutoffRecord[], filename = 'rrb_cutoffs_export.csv'): void {
  const headers = ['CEN Number', 'Exam Title', 'Zone Code', 'Zone Name', 'Post Name', 'Stage', 'Year', 'UR', 'OBC', 'SC', 'ST', 'EWS', 'ExSM', 'PwBD', 'Normalized', 'PDF Reference', 'Updated At'];
  const rows = cutoffs.map((c) => [
    `"${c.cenNumber || ''}"`,
    `"${(c.examTitle || '').replace(/"/g, '""')}"`,
    `"${c.zoneCode || ''}"`,
    `"${(c.zoneName || '').replace(/"/g, '""')}"`,
    `"${(c.postName || '').replace(/"/g, '""')}"`,
    `"${c.stage || ''}"`,
    `"${c.year || ''}"`,
    c.cutoffs?.UR ?? '',
    c.cutoffs?.OBC ?? '',
    c.cutoffs?.SC ?? '',
    c.cutoffs?.ST ?? '',
    c.cutoffs?.EWS ?? '',
    c.cutoffs?.ExSM ?? '',
    c.cutoffs?.PwBD ?? '',
    c.normalizedScore ? 'Yes' : 'No',
    `"${(c.pdfReference || '').replace(/"/g, '""')}"`,
    `"${c.updatedAt || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportResultsToCsv(results: ResultItem[], filename = 'rrb_results_export.csv'): void {
  const headers = ['CEN Number', 'Exam Title', 'Zone Code', 'Zone Name', 'Stage', 'Publish Date', 'Result Type', 'Total Selected', 'Roll Numbers Count', 'Instructions'];
  const rows = results.map((r) => [
    `"${r.cenNumber || ''}"`,
    `"${(r.examTitle || '').replace(/"/g, '""')}"`,
    `"${r.zoneCode || ''}"`,
    `"${(r.zoneName || '').replace(/"/g, '""')}"`,
    `"${(r.stage || '').replace(/"/g, '""')}"`,
    `"${r.publishDate || ''}"`,
    `"${r.type || ''}"`,
    r.totalSelectedCandidates ?? '',
    r.rollNumbersSample?.length ?? 0,
    `"${(r.instructions || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportExamsToCsv(exams: ExamItem[], filename = 'rrb_exams_export.csv'): void {
  const headers = ['CEN Number', 'Title', 'Short Code', 'Department', 'Status', 'Total Vacancies', 'Application Start', 'Application End', 'Exam Dates', 'Eligibility', 'Pay Scale'];
  const rows = exams.map((e) => [
    `"${e.cenNumber || ''}"`,
    `"${(e.title || '').replace(/"/g, '""')}"`,
    `"${e.shortCode || ''}"`,
    `"${(e.department || '').replace(/"/g, '""')}"`,
    `"${e.status || ''}"`,
    e.totalVacancies || '',
    `"${e.applicationStart || ''}"`,
    `"${e.applicationEnd || ''}"`,
    `"${(e.examDates || '').replace(/"/g, '""')}"`,
    `"${(e.eligibility || '').replace(/"/g, '""')}"`,
    `"${(e.payScale || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportEmptySchemaJson(): void {
  const blankTemplate: FullRRBDatabase = {
    metadata: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      uploadedBy: 'Official Admin Name',
      source: 'Official RRB Notification CEN XX/202X',
      notes: 'Template schema to populate with official Railway Board data.',
    },
    zones: OFFICIAL_RRB_ZONES,
    exams: [
      {
        id: 'exam-cen-01-2025',
        cenNumber: 'CEN 01/2025',
        title: 'Exam Title (e.g. NTPC / Junior Engineer)',
        shortCode: 'EXAM-CODE',
        department: 'Engineering / Traffic / Commercial',
        status: 'Active Application',
        totalVacancies: 5000,
        applicationStart: '2025-01-01',
        applicationEnd: '2025-01-31',
        examDates: 'Tentative CBT-1 Month',
        eligibility: 'Degree / Diploma / 10th+ITI',
        ageLimit: '18-33 Years',
        payScale: 'Level-6 7th CPC (₹35,400)',
        selectionStages: ['CBT-1', 'CBT-2', 'Document Verification & Medical'],
        officialPdfUrl: 'https://rrbcdg.gov.in',
        description: 'Detailed description of the CEN recruitment drive.',
        updatedAt: new Date().toISOString(),
      },
    ],
    cutoffs: [
      {
        id: 'cut-001',
        cenNumber: 'CEN 01/2025',
        examTitle: 'Exam Title',
        zoneCode: 'ALD',
        zoneName: 'RRB Prayagraj (Allahabad)',
        postName: 'Post Designation',
        stage: 'CBT-1',
        year: 2025,
        cutoffs: {
          UR: 72.5,
          OBC: 67.2,
          SC: 58.4,
          ST: 54.1,
          EWS: 65.0,
          ExSM: 40.0,
        },
        normalizedScore: true,
        totalCandidatesCalled: 500,
        pdfReference: 'http://rrbald.gov.in',
        updatedAt: new Date().toISOString(),
      },
    ],
    notices: [
      {
        id: 'not-001',
        cenNumber: 'CEN 01/2025',
        zoneCode: 'ALL',
        title: 'Notice regarding CBT-1 Examination Schedule',
        category: 'Exam Date',
        publishDate: '2025-01-10',
        isImportant: true,
        isNew: true,
        pdfUrl: 'https://rrbcdg.gov.in',
        contentSummary: 'The CBT-1 schedule and instructions for candidates.',
      },
    ],
    results: [
      {
        id: 'res-001',
        cenNumber: 'CEN 01/2025',
        examTitle: 'Exam Title',
        zoneCode: 'ALD',
        zoneName: 'RRB Prayagraj (Allahabad)',
        stage: '1st Stage CBT Result',
        publishDate: '2025-02-15',
        type: 'Merit List PDF',
        fileUrl: 'http://rrbald.gov.in/result.pdf',
        totalSelectedCandidates: 1200,
        rollNumbersSample: ['11001001', '11001002'],
        instructions: 'Candidates shortlisted for 2nd stage CBT examination.',
      },
    ],
  };

  exportDatabaseAsJson(blankTemplate, 'rrb_blank_schema_template.json');
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parsedData?: FullRRBDatabase;
}

export function validateAndParseRRBJson(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const obj = JSON.parse(jsonString);

    if (!obj || typeof obj !== 'object') {
      return { isValid: false, errors: ['Uploaded file does not contain a valid JSON object.'], warnings };
    }

    // Flexible parsing: can accept root FullRRBDatabase, or partial arrays
    let exams: ExamItem[] = [];
    let cutoffs: CutoffRecord[] = [];
    let notices: NoticeItem[] = [];
    let results: ResultItem[] = [];

    if (Array.isArray(obj.exams)) {
      exams = obj.exams;
    } else if (Array.isArray(obj)) {
      // User uploaded raw array of one type
      warnings.push('Uploaded file contains a top-level array. Checking item types.');
      if (obj.length > 0) {
        if ('cenNumber' in obj[0] && 'cutoffs' in obj[0]) {
          cutoffs = obj as CutoffRecord[];
        } else if ('cenNumber' in obj[0] && 'title' in obj[0] && 'totalVacancies' in obj[0]) {
          exams = obj as ExamItem[];
        } else if ('category' in obj[0] && 'publishDate' in obj[0]) {
          notices = obj as NoticeItem[];
        } else if ('type' in obj[0] && 'publishDate' in obj[0]) {
          results = obj as ResultItem[];
        }
      }
    }

    if (Array.isArray(obj.cutoffs)) {
      cutoffs = obj.cutoffs;
    }
    if (Array.isArray(obj.notices)) {
      notices = obj.notices;
    }
    if (Array.isArray(obj.results)) {
      results = obj.results;
    }

    // Sanitize Exams
    exams = exams.map((ex, idx) => ({
      id: ex.id || `exam-${Date.now()}-${idx}`,
      cenNumber: String(ex.cenNumber || 'CEN UNKNOWN'),
      title: String(ex.title || 'Untitled Exam'),
      shortCode: String(ex.shortCode || ex.cenNumber || 'EXAM'),
      department: String(ex.department || 'Railway Board'),
      status: ex.status || 'Upcoming',
      totalVacancies: Number(ex.totalVacancies) || 0,
      applicationStart: ex.applicationStart,
      applicationEnd: ex.applicationEnd,
      examDates: ex.examDates,
      eligibility: ex.eligibility,
      ageLimit: ex.ageLimit,
      payScale: ex.payScale,
      selectionStages: Array.isArray(ex.selectionStages) ? ex.selectionStages : [],
      officialPdfUrl: ex.officialPdfUrl,
      description: ex.description,
      updatedAt: ex.updatedAt || new Date().toISOString(),
    }));

    // Sanitize Cutoffs
    cutoffs = cutoffs.map((ct, idx) => ({
      id: ct.id || `cut-${Date.now()}-${idx}`,
      cenNumber: String(ct.cenNumber || ''),
      examTitle: String(ct.examTitle || 'RRB Exam'),
      zoneCode: String(ct.zoneCode || 'ALL'),
      zoneName: String(ct.zoneName || 'All Zones'),
      postName: String(ct.postName || 'Post'),
      stage: ct.stage || 'CBT-1',
      year: ct.year || new Date().getFullYear(),
      cutoffs: ct.cutoffs && typeof ct.cutoffs === 'object' ? ct.cutoffs : {},
      normalizedScore: ct.normalizedScore !== false,
      totalCandidatesCalled: Number(ct.totalCandidatesCalled) || undefined,
      pdfReference: ct.pdfReference,
      updatedAt: ct.updatedAt || new Date().toISOString(),
    }));

    // Sanitize Notices
    notices = notices.map((nt, idx) => ({
      id: nt.id || `not-${Date.now()}-${idx}`,
      cenNumber: nt.cenNumber,
      zoneCode: String(nt.zoneCode || 'ALL'),
      title: String(nt.title || 'Official Notice'),
      category: nt.category || 'General Advisory',
      publishDate: String(nt.publishDate || new Date().toISOString().split('T')[0]),
      isImportant: Boolean(nt.isImportant),
      isNew: Boolean(nt.isNew),
      pdfUrl: nt.pdfUrl,
      contentSummary: nt.contentSummary,
    }));

    // Sanitize Results
    results = results.map((rs, idx) => ({
      id: rs.id || `res-${Date.now()}-${idx}`,
      cenNumber: String(rs.cenNumber || ''),
      examTitle: String(rs.examTitle || 'RRB Exam'),
      zoneCode: String(rs.zoneCode || 'ALL'),
      zoneName: String(rs.zoneName || 'All Zones'),
      stage: String(rs.stage || 'Result'),
      publishDate: String(rs.publishDate || new Date().toISOString().split('T')[0]),
      type: rs.type || 'Merit List PDF',
      fileUrl: rs.fileUrl,
      totalSelectedCandidates: Number(rs.totalSelectedCandidates) || undefined,
      rollNumbersSample: Array.isArray(rs.rollNumbersSample) ? rs.rollNumbersSample.map(String) : [],
      instructions: rs.instructions,
    }));

    const rawPortalLinks = (Array.isArray(obj.portalLinks) ? obj.portalLinks : DEFAULT_CANDIDATE_PORTAL_LINKS).filter(Boolean);
    const portalLinks: CandidatePortalLink[] = rawPortalLinks.map((pl: any, idx: number) => ({
      id: pl?.id || `pl-${Date.now()}-${idx}`,
      title: String(pl?.title || 'Candidate Portal Link'),
      examName: pl?.examName ? String(pl.examName) : undefined,
      cenNumber: pl?.cenNumber ? String(pl.cenNumber) : undefined,
      type: pl?.type || 'admit_card',
      url: String(pl?.url || OFFICIAL_RRB_DIGIALM_LOGIN_URL),
      badgeText: pl?.badgeText ? String(pl.badgeText) : 'Active',
      publishDate: pl?.publishDate ? String(pl.publishDate) : new Date().toISOString().split('T')[0],
      isActive: pl?.isActive !== false,
      notes: pl?.notes ? String(pl.notes) : undefined,
    }));

    const parsedData: FullRRBDatabase = {
      metadata: {
        version: obj.metadata?.version || '1.0.0',
        lastUpdated: new Date().toISOString(),
        uploadedBy: obj.metadata?.uploadedBy || 'Admin Upload',
        source: obj.metadata?.source || 'Imported File',
        notes: obj.metadata?.notes || 'Custom uploaded dataset',
      },
      zones: Array.isArray(obj.zones) && obj.zones.length > 0 ? obj.zones : OFFICIAL_RRB_ZONES,
      exams,
      cutoffs,
      notices,
      results,
      portalLinks,
    };

    const totalCount = exams.length + cutoffs.length + notices.length + results.length;
    if (totalCount === 0) {
      warnings.push('The uploaded JSON does not contain any exam, cutoff, notice, or result records.');
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      parsedData,
    };
  } catch (err: any) {
    return {
      isValid: false,
      errors: [`JSON Parse Error: ${err.message || 'Invalid syntax'}`],
      warnings,
    };
  }
}
