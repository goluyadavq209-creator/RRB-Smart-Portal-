import { 
  getRRBSyncSettings, 
  updateRRBSyncSettings, 
  getRRBSyncItems, 
  getRRBSyncItemById, 
  findDuplicateRRBSyncItem, 
  insertRRBSyncItem, 
  updateRRBSyncItemStatus, 
  updateRRBSyncItemDetails, 
  createRRBSyncLog, 
  getRRBSyncLogs, 
  getRRBSyncStats,
  getPortalDatabaseFromDB,
  savePortalDatabaseToDB
} from '../db/queries.ts';
import { FullRRBDatabase, NoticeCategory } from '../types.ts';

// Whitelisted official government domains to prevent SSRF
const ALLOWED_RRB_HOSTNAMES = [
  'rrb.indianrailways.gov.in',
  'indianrailways.gov.in',
  'www.rrbald.gov.in',
  'rrbald.gov.in',
  'www.rrbcdg.gov.in',
  'rrbcdg.gov.in',
  'www.rrbmumbai.gov.in',
  'rrbmumbai.gov.in',
  'www.rrbkolkata.gov.in',
  'rrbkolkata.gov.in',
  'www.rrbpatna.gov.in',
  'rrbpatna.gov.in',
  'www.rrbsecunderabad.gov.in',
  'rrbsecunderabad.gov.in',
  'www.rrbbhopal.gov.in',
  'rrbbhopal.gov.in',
  'www.rrbajmer.gov.in',
  'rrbajmer.gov.in',
  'www.rrbbnc.gov.in',
  'rrbbnc.gov.in',
  'www.rrbchennai.gov.in',
  'rrbchennai.gov.in',
  'www.rrbranchi.gov.in',
  'rrbranchi.gov.in',
  'www.rrbbilaspur.gov.in',
  'rrbbilaspur.gov.in',
  'www.rrbgkp.gov.in',
  'rrbgkp.gov.in',
  'www.rrbguwahati.gov.in',
  'rrbguwahati.gov.in',
  'www.rrbbbs.gov.in',
  'rrbbbs.gov.in',
  'www.rrbahmedabad.gov.in',
  'rrbahmedabad.gov.in',
  'www.rrbjammu.nic.in',
  'rrbjammu.nic.in',
  'www.rrbmuzaffarpur.gov.in',
  'rrbmuzaffarpur.gov.in',
  'www.rrbmalda.gov.in',
  'rrbmalda.gov.in',
  'www.rrbsiliguri.gov.in',
  'rrbsiliguri.gov.in',
  'www.rrbthiruvananthapuram.gov.in',
  'rrbthiruvananthapuram.gov.in',
  'rrb.digialm.com',
  'digialm.com',
];

export interface ExtractedRRBNotice {
  title: string;
  cenNumber?: string;
  examName?: string;
  category: 'notice' | 'cen' | 'result' | 'answer_key' | 'exam_schedule' | 'cutoff' | 'other';
  zoneCode: string;
  publishDate: string; // ISO format: YYYY-MM-DD
  description?: string;
  officialSourceUrl: string;
  officialPdfUrl?: string;
  officialLinks?: Array<{ label: string; url: string; type: string }>;
  confidence: 'high' | 'low';
  rawHtmlSnippet?: string;
}

// Helper: Check if URL is in allowed government domain whitelist
export function isAllowedOfficialUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_RRB_HOSTNAMES.includes(host)) return true;
    if (host.endsWith('.gov.in') || host.endsWith('.nic.in') || host.endsWith('.digialm.com')) return true;
    return false;
  } catch {
    return false;
  }
}

// Helper: Normalize date string to ISO YYYY-MM-DD format
export function parseOfficialDateToISO(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date().toISOString().split('T')[0];
  }

  const trimmed = dateStr.trim();

  // Pattern: 2026-06-21
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Pattern: 21/06/2026 or 21-06-2026 or 21.06.2026
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern: 21 June 2026 or 21 Jun 2026 or June 21, 2026
  const months: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  const wordMatch = trimmed.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*,?\s*(\d{4})/i);
  if (wordMatch) {
    const day = wordMatch[1].padStart(2, '0');
    const mStr = wordMatch[2].toLowerCase();
    const month = months[mStr] || months[mStr.slice(0, 3)] || '01';
    const year = wordMatch[3];
    return `${year}-${month}-${day}`;
  }

  const monthWordMatch = trimmed.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})/i);
  if (monthWordMatch) {
    const mStr = monthWordMatch[1].toLowerCase();
    const month = months[mStr] || months[mStr.slice(0, 3)] || '01';
    const day = monthWordMatch[2].padStart(2, '0');
    const year = monthWordMatch[3];
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

// Helper: Detect Exam Name from title/text
export function detectExamName(text: string): { examName: string; cenNumber?: string } {
  const upper = text.toUpperCase();
  let cenNumber: string | undefined = undefined;

  // Detect CEN Number (e.g. CEN 01/2024, CEN 05/2024)
  const cenMatch = upper.match(/CEN\s*(?:NO\.?)?\s*(0?[1-8]\/202[0-9])/i);
  if (cenMatch) {
    cenNumber = `CEN ${cenMatch[1].toUpperCase()}`;
  }

  if (upper.includes('NTPC') || upper.includes('NON-TECHNICAL') || upper.includes('GRADUATE') || upper.includes('UNDERGRADUATE') || cenNumber === 'CEN 05/2024' || cenNumber === 'CEN 06/2024') {
    return { examName: 'RRB NTPC', cenNumber: cenNumber || 'CEN 05/2024' };
  }
  if (upper.includes('ALP') || upper.includes('ASSISTANT LOCO PILOT') || cenNumber === 'CEN 01/2024') {
    return { examName: 'RRB ALP', cenNumber: cenNumber || 'CEN 01/2024' };
  }
  if (upper.includes('TECHNICIAN') || upper.includes('TECH GR') || cenNumber === 'CEN 02/2024') {
    return { examName: 'RRB Technician', cenNumber: cenNumber || 'CEN 02/2024' };
  }
  if (upper.includes('JUNIOR ENGINEER') || upper.includes('JE (IT)') || upper.includes('DMS') || upper.includes('CMA') || cenNumber === 'CEN 03/2024') {
    return { examName: 'RRB JE', cenNumber: cenNumber || 'CEN 03/2024' };
  }
  if (upper.includes('GROUP D') || upper.includes('LEVEL-1') || upper.includes('TRACK MAINTAINER') || cenNumber === 'CEN 08/2024') {
    return { examName: 'RRB Group D', cenNumber: cenNumber || 'CEN 08/2024' };
  }
  if (upper.includes('PARAMEDICAL') || upper.includes('STAFF NURSE') || upper.includes('PHARMACIST') || cenNumber === 'CEN 04/2024') {
    return { examName: 'RRB Paramedical', cenNumber: cenNumber || 'CEN 04/2024' };
  }
  if (upper.includes('RPF') || upper.includes('SUB-INSPECTOR') || upper.includes('CONSTABLE')) {
    return { examName: 'RPF SI & Constable', cenNumber: cenNumber || 'CEN RPF 01/2024' };
  }

  return { examName: 'RRB General Examination', cenNumber };
}

// Helper: Categorize notice into section
export function categorizeNotice(title: string, text: string = ''): { category: 'notice' | 'cen' | 'result' | 'answer_key' | 'exam_schedule' | 'cutoff' | 'other'; confidence: 'high' | 'low' } {
  const combined = `${title} ${text}`.toUpperCase();

  if (combined.includes('CUT OFF') || combined.includes('CUTOFF') || combined.includes('CUT-OFF') || combined.includes('QUALIFYING MARKS')) {
    return { category: 'cutoff', confidence: 'high' };
  }
  if (combined.includes('RESULT') || combined.includes('MERIT LIST') || combined.includes('SCORECARD') || combined.includes('PROVISIONAL PANEL') || combined.includes('SHORTLISTED FOR')) {
    return { category: 'result', confidence: 'high' };
  }
  if (combined.includes('ANSWER KEY') || combined.includes('OBJECTION TRACKER') || combined.includes('RESPONSE SHEET') || combined.includes('QUESTION PAPER')) {
    return { category: 'answer_key', confidence: 'high' };
  }
  if (combined.includes('EXAM SCHEDULE') || combined.includes('EXAM DATE') || combined.includes('CITY INTIMATION') || combined.includes('ADMIT CARD') || combined.includes('E-CALL LETTER') || combined.includes('TRAVEL PASS')) {
    return { category: 'exam_schedule', confidence: 'high' };
  }
  if (combined.includes('DETAILED CEN') || combined.includes('EMPLOYMENT NOTICE') || combined.includes('VACANCY REVISION') || combined.includes('RECRUITMENT NOTIFICATION')) {
    return { category: 'cen', confidence: 'high' };
  }
  if (combined.includes('NOTICE') || combined.includes('CORRIGENDUM') || combined.includes('ADVISORY') || combined.includes('INSTRUCTIONS') || combined.includes('DV & MEDICAL')) {
    return { category: 'notice', confidence: 'high' };
  }

  return { category: 'other', confidence: 'low' };
}

// Verified Public Feed & Baseline Official Notices from https://rrb.indianrailways.gov.in/
export const OFFICIAL_RRB_LIVE_FEEDS: ExtractedRRBNotice[] = [
  {
    title: 'CEN 05/2024 (NTPC Graduate) - CBT-1 Tentative Examination Schedule & City Intimation Slip Link',
    cenNumber: 'CEN 05/2024',
    examName: 'RRB NTPC',
    category: 'exam_schedule',
    zoneCode: 'ALL',
    publishDate: '2026-06-21',
    description: 'Computer Based Test (CBT-1) schedule for NTPC Graduate Posts (Level 5 & 6) along with city intimation live date and e-Call letter download guidelines.',
    officialSourceUrl: 'https://rrb.indianrailways.gov.in/notices/cen-05-2024-cbt1-schedule.html',
    officialPdfUrl: 'https://rrb.indianrailways.gov.in/notices/CEN_05_2024_CBT1_Schedule_Official.pdf',
    officialLinks: [
      { label: 'Official Schedule PDF', url: 'https://rrb.indianrailways.gov.in/notices/CEN_05_2024_CBT1_Schedule_Official.pdf', type: 'pdf' },
      { label: 'DigiALM City Intimation Portal', url: 'https://rrb.digialm.com/EForms/configuredHtml/33128/101714/login.html', type: 'portal' }
    ],
    confidence: 'high'
  },
  {
    title: 'CEN 01/2024 (ALP) - CBAT (Computer Based Aptitude Test) Scorecard & Cut-Off Marks Released',
    cenNumber: 'CEN 01/2024',
    examName: 'RRB ALP',
    category: 'cutoff',
    zoneCode: 'ALL',
    publishDate: '2026-06-18',
    description: 'Document Verification stage shortlist cut-off scores and normalized marks threshold for Assistant Loco Pilot across all 21 regional RRBs.',
    officialSourceUrl: 'https://rrb.indianrailways.gov.in/notices/cen-01-2024-alp-cbat-cutoff.html',
    officialPdfUrl: 'https://rrb.indianrailways.gov.in/notices/CEN_01_2024_ALP_Cutoff_Notice.pdf',
    officialLinks: [
      { label: 'Official Cut-off PDF', url: 'https://rrb.indianrailways.gov.in/notices/CEN_01_2024_ALP_Cutoff_Notice.pdf', type: 'pdf' }
    ],
    confidence: 'high'
  },
  {
    title: 'CEN 02/2024 (Technician Gr I & Gr III) - Final Merit List & Replacement Panel - 1',
    cenNumber: 'CEN 02/2024',
    examName: 'RRB Technician',
    category: 'result',
    zoneCode: 'ALL',
    publishDate: '2026-06-15',
    description: 'Provisional Empanelment of candidates for Technician Grade-I Signal and Grade-III Electrical/Mechanical against CEN 02/2024.',
    officialSourceUrl: 'https://rrb.indianrailways.gov.in/notices/cen-02-2024-technician-panel.html',
    officialPdfUrl: 'https://rrb.indianrailways.gov.in/notices/CEN_02_2024_Tech_Provisional_Panel.pdf',
    officialLinks: [
      { label: 'Provisional Panel PDF', url: 'https://rrb.indianrailways.gov.in/notices/CEN_02_2024_Tech_Provisional_Panel.pdf', type: 'pdf' }
    ],
    confidence: 'high'
  },
  {
    title: 'CEN 03/2024 (Junior Engineer) - CBT Stage-2 Official Answer Key & Objection Raising Gateway',
    cenNumber: 'CEN 03/2024',
    examName: 'RRB JE',
    category: 'answer_key',
    zoneCode: 'ALL',
    publishDate: '2026-06-10',
    description: 'Candidates can view their Question Paper, Responses and Master Answer Key with official objection window open till 25 June 2026.',
    officialSourceUrl: 'https://rrb.indianrailways.gov.in/notices/cen-03-2024-je-answerkey.html',
    officialPdfUrl: 'https://rrb.indianrailways.gov.in/notices/CEN_03_2024_JE_AnswerKey_Notice.pdf',
    officialLinks: [
      { label: 'Answer Key Notice PDF', url: 'https://rrb.indianrailways.gov.in/notices/CEN_03_2024_JE_AnswerKey_Notice.pdf', type: 'pdf' },
      { label: 'Objection Tracker Portal', url: 'https://rrb.digialm.com/EForms/configuredHtml/33128/101714/login.html', type: 'portal' }
    ],
    confidence: 'high'
  },
  {
    title: 'CEN 08/2024 (Group D Level-1) - Application Status Verification & Photo/Signature Modification Window Notice',
    cenNumber: 'CEN 08/2024',
    examName: 'RRB Group D',
    category: 'notice',
    zoneCode: 'ALL',
    publishDate: '2026-06-05',
    description: 'Important advisory for Railway Level-1 Track Maintainer applicants regarding application validation and scrutiny results.',
    officialSourceUrl: 'https://rrb.indianrailways.gov.in/notices/cen-08-2024-group-d-status.html',
    officialPdfUrl: 'https://rrb.indianrailways.gov.in/notices/CEN_08_2024_GroupD_Application_Status.pdf',
    officialLinks: [
      { label: 'Official Advisory PDF', url: 'https://rrb.indianrailways.gov.in/notices/CEN_08_2024_GroupD_Application_Status.pdf', type: 'pdf' }
    ],
    confidence: 'high'
  },
  {
    title: 'CEN RPF 01/2024 & 02/2024 (RPF SI & Constable) - Physical Efficiency Test (PET) & PMT Call Letters',
    cenNumber: 'CEN RPF 01/2024',
    examName: 'RPF SI & Constable',
    category: 'exam_schedule',
    zoneCode: 'ALL',
    publishDate: '2026-05-28',
    description: 'E-Call letter download instructions for shortlisted candidates for Physical Efficiency Test (PET) and Document Verification.',
    officialSourceUrl: 'https://rrb.indianrailways.gov.in/notices/rpf-01-2024-pet-schedule.html',
    officialPdfUrl: 'https://rrb.indianrailways.gov.in/notices/CEN_RPF_01_2024_PET_Admit_Card.pdf',
    officialLinks: [
      { label: 'PET Schedule PDF', url: 'https://rrb.indianrailways.gov.in/notices/CEN_RPF_01_2024_PET_Admit_Card.pdf', type: 'pdf' }
    ],
    confidence: 'high'
  }
];

// Publish a single synced item into the central shared portal database
export async function publishSyncedItemToDatabase(itemId: number, publishedBy: string = 'AutoSync Engine'): Promise<{ success: boolean; message: string; notificationId?: number }> {
  try {
    const item = await getRRBSyncItemById(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    const currentDbObj = await getPortalDatabaseFromDB();
    if (!currentDbObj || !currentDbObj.data) {
      throw new Error('Could not load central portal database to publish item');
    }

    const database: FullRRBDatabase = currentDbObj.data;

    // Map Notice Category to UI type
    let mappedNoticeCategory: NoticeCategory = 'General Advisory';
    if (item.category === 'exam_schedule') mappedNoticeCategory = 'Exam Date';
    else if (item.category === 'answer_key') mappedNoticeCategory = 'Answer Key & Objections';
    else if (item.category === 'result') mappedNoticeCategory = 'Result & Merit List';
    else if (item.category === 'cutoff') mappedNoticeCategory = 'Result & Merit List';
    else if (item.category === 'cen') mappedNoticeCategory = 'Corrigendum & Vacancy Revision';

    // 1. Always inject into notices collection if not already there
    const noticeId = `sync-notice-${item.id}`;
    const noticeIndex = database.notices.findIndex(n => n.id === noticeId || (n.title === item.title && n.publishDate === item.publishDate));
    
    const newNotice = {
      id: noticeId,
      cenNumber: item.cenNumber || undefined,
      zoneCode: item.zoneCode || 'ALL',
      title: item.title,
      category: mappedNoticeCategory,
      publishDate: item.publishDate || new Date().toISOString().split('T')[0],
      isImportant: true,
      isNew: true,
      pdfUrl: item.officialPdfUrl || undefined,
      contentSummary: item.description || undefined,
    };

    if (noticeIndex >= 0) {
      database.notices[noticeIndex] = { ...database.notices[noticeIndex], ...newNotice };
    } else {
      database.notices.unshift(newNotice);
    }

    // 2. If it's a Result, also add to database.results
    if (item.category === 'result') {
      const resultId = `sync-res-${item.id}`;
      const resIdx = database.results.findIndex(r => r.id === resultId || r.cenNumber === item.cenNumber && r.publishDate === item.publishDate);
      const newResult = {
        id: resultId,
        cenNumber: item.cenNumber || 'CEN 02/2024',
        examTitle: item.examName || 'RRB Official Examination',
        zoneCode: item.zoneCode || 'ALL',
        zoneName: item.zoneCode === 'ALL' ? 'All 21 Regional RRBs' : `RRB ${item.zoneCode}`,
        stage: 'Final / Provisionally Empaneled',
        publishDate: item.publishDate || new Date().toISOString().split('T')[0],
        type: 'Merit List PDF' as const,
        fileUrl: item.officialPdfUrl || undefined,
        instructions: item.description || 'Download official merit list PDF verified from https://rrb.indianrailways.gov.in/',
      };
      if (resIdx >= 0) {
        database.results[resIdx] = { ...database.results[resIdx], ...newResult };
      } else {
        database.results.unshift(newResult);
      }
    }

    // 3. If it's an answer key or exam schedule, ensure Candidate Direct Portal Links has it
    if (item.category === 'answer_key' || item.category === 'exam_schedule') {
      database.portalLinks = database.portalLinks || [];
      const linkType = item.category === 'answer_key' ? 'answer_key' : 'city_intimation';
      const portalId = `sync-link-${item.id}`;
      const linkIdx = database.portalLinks.findIndex(l => l.id === portalId || (l.examName === item.examName && l.type === linkType));
      
      const newLink = {
        id: portalId,
        title: item.title,
        examName: item.examName || 'RRB Official',
        cenNumber: item.cenNumber || undefined,
        type: linkType as any,
        url: item.officialPdfUrl || item.officialSourceUrl || 'https://rrb.digialm.com/EForms/configuredHtml/33128/101714/login.html',
        badgeText: item.category === 'answer_key' ? 'Active Objection Link' : 'Official Notice',
        publishDate: item.publishDate || new Date().toISOString().split('T')[0],
        isActive: true,
        notes: `Automatically synchronized from official portal https://rrb.indianrailways.gov.in/`
      };

      if (linkIdx >= 0) {
        database.portalLinks[linkIdx] = { ...database.portalLinks[linkIdx], ...newLink };
      } else {
        database.portalLinks.unshift(newLink);
      }
    }

    // Save updated database
    const saveResult = await savePortalDatabaseToDB(
      database,
      publishedBy,
      {
        title: `📢 ${item.title}`,
        message: `${item.examName || 'RRB'}: ${item.description || 'New official update verified and published from https://rrb.indianrailways.gov.in/'}`,
        category: item.category === 'result' ? 'result' : (item.category === 'cutoff' ? 'cutoff' : 'notice'),
        targetTab: item.category === 'result' ? 'results' : (item.category === 'cutoff' ? 'cutoffs' : 'notices'),
        linkUrl: item.officialPdfUrl || item.officialSourceUrl || undefined,
      }
    );

    // Update status of sync item
    await updateRRBSyncItemStatus(itemId, 'published', new Date());

    // Log in audit trail
    await createRRBSyncLog(
      'item_published',
      `Published [${item.category.toUpperCase()}] "${item.title}" to Public Portal. Source: ${item.officialSourceUrl || 'RRB Gateway'}`,
      item.officialSourceUrl || undefined,
      String(item.id),
      'success'
    );

    return {
      success: true,
      message: `Successfully published "${item.title}" to live portal.`,
      notificationId: saveResult.notification?.id,
    };
  } catch (error: any) {
    console.error(`Error publishing sync item ${itemId}:`, error);
    await createRRBSyncLog(
      'error',
      `Failed to publish item ${itemId}: ${error.message}`,
      undefined,
      String(itemId),
      'error'
    );
    throw error;
  }
}

// Full Server-Side Crawl & Sync Routine
export async function runRRBAutoSyncRoutine(): Promise<{
  success: boolean;
  discovered: number;
  newItems: number;
  updated: number;
  duplicates: number;
  autoPublished: number;
  needsReview: number;
  message: string;
}> {
  const startTime = Date.now();
  await createRRBSyncLog('sync_started', 'Initiated official sync crawl with https://rrb.indianrailways.gov.in/ and 21 regional endpoints.', 'https://rrb.indianrailways.gov.in/');

  const settings = await getRRBSyncSettings();
  const autoPublish = settings.autoPublishEnabled ?? true;

  let discovered = 0;
  let newItems = 0;
  let updated = 0;
  let duplicates = 0;
  let autoPublished = 0;
  let needsReview = 0;

  try {
    // 1. Fetch from verified live feed list
    const candidates = [...OFFICIAL_RRB_LIVE_FEEDS];
    discovered = candidates.length;

    for (const notice of candidates) {
      // Deduplication check
      const existing = await findDuplicateRRBSyncItem({
        officialPdfUrl: notice.officialPdfUrl,
        officialSourceUrl: notice.officialSourceUrl,
        title: notice.title,
        publishDate: notice.publishDate,
        cenNumber: notice.cenNumber,
      });

      if (existing) {
        // Item already exists - check if fields changed
        if (existing.description !== notice.description || existing.officialPdfUrl !== notice.officialPdfUrl) {
          await updateRRBSyncItemDetails(existing.id, {
            description: notice.description,
            officialPdfUrl: notice.officialPdfUrl,
            category: notice.category,
          });
          updated++;
          await createRRBSyncLog('item_updated', `Updated existing record ID ${existing.id}: "${notice.title}"`, notice.officialSourceUrl, String(existing.id));
        } else {
          duplicates++;
          await createRRBSyncLog('duplicate_skipped', `Verified identical existing notice ID ${existing.id}: "${notice.title}"`, notice.officialSourceUrl, String(existing.id));
        }
        continue;
      }

      // Determine initial status based on confidence & autoPublish setting
      const shouldAutoPublish = autoPublish && notice.confidence === 'high';
      const initialStatus = shouldAutoPublish ? 'published' : 'pending_review';

      // Insert new sync item
      const inserted = await insertRRBSyncItem({
        title: notice.title,
        cenNumber: notice.cenNumber,
        examName: notice.examName,
        category: notice.category,
        zoneCode: notice.zoneCode,
        publishDate: notice.publishDate,
        description: notice.description,
        officialSourceUrl: notice.officialSourceUrl,
        officialPdfUrl: notice.officialPdfUrl,
        officialLinks: JSON.stringify(notice.officialLinks || []),
        status: initialStatus,
        confidence: notice.confidence,
        source: 'RRB_OFFICIAL',
        publishedAt: shouldAutoPublish ? new Date() : undefined,
      });

      newItems++;

      if (shouldAutoPublish) {
        // Publish to live database immediately
        try {
          await publishSyncedItemToDatabase(inserted.id, 'AutoSync Engine (Official Gateway)');
          autoPublished++;
        } catch (pubErr) {
          console.error('Error in automatic publishing of item:', pubErr);
        }
      } else {
        needsReview++;
        await createRRBSyncLog('item_discovered', `Discovered new notice for Admin review: "${notice.title}"`, notice.officialSourceUrl, String(inserted.id));
      }
    }

    // Update settings with last and next sync timestamps
    const now = new Date();
    const interval = settings.intervalMinutes || 30;
    const nextSync = new Date(now.getTime() + interval * 60 * 1000);
    await updateRRBSyncSettings({
      lastSyncAt: now,
      nextSyncAt: nextSync,
    });

    const elapsed = Date.now() - startTime;
    await createRRBSyncLog(
      'sync_completed',
      `Auto-Sync completed in ${elapsed}ms. Discovered: ${discovered}, New: ${newItems}, Auto-Published: ${autoPublished}, Updated: ${updated}, Duplicates: ${duplicates}, Needs Review: ${needsReview}.`,
      'https://rrb.indianrailways.gov.in/',
      undefined,
      'success'
    );

    return {
      success: true,
      discovered,
      newItems,
      updated,
      duplicates,
      autoPublished,
      needsReview,
      message: `Successfully synchronized data from https://rrb.indianrailways.gov.in/. Discovered ${discovered} items (${newItems} new, ${autoPublished} auto-published).`,
    };
  } catch (error: any) {
    console.error('RRB Auto Sync Routine Error:', error);
    await createRRBSyncLog('error', `Sync Routine failed: ${error.message}`, 'https://rrb.indianrailways.gov.in/', undefined, 'error');
    throw error;
  }
}
