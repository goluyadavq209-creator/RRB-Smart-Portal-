import { FullRRBDatabase, ExamItem, CutoffRecord, NoticeItem, ResultItem, CandidatePortalLink } from '../types';
import { INITIAL_EMPTY_DATABASE, OFFICIAL_RRB_ZONES, DEFAULT_CANDIDATE_PORTAL_LINKS } from '../data/defaultData';
import { firestoreService } from './firestoreService';

export interface DatabaseSyncResult {
  success: boolean;
  data: FullRRBDatabase | null;
  version: string;
  updatedAt: string | null;
  updatedBy: string;
  fromCache?: boolean;
  error?: string;
}

export interface SaveDatabaseOptions {
  updatedBy?: string;
  adminToken?: string;
  notification?: {
    title: string;
    message: string;
    category?: string;
    targetTab?: string;
    linkUrl?: string;
  };
}

export interface MigrationReport {
  success: boolean;
  migratedCounts: {
    exams: number;
    cutoffs: number;
    notices: number;
    results: number;
    portalLinks: number;
    zones: number;
    total: number;
  };
  duplicatesRemoved: number;
  version: string;
  timestamp: string;
  error?: string;
}

/**
 * Clean Central Database Service Layer
 * Firestore is the single source of truth for all shared portal data.
 */
class DatabaseService {
  private inMemoryCache: FullRRBDatabase | null = null;
  private lastVersion: string = 'firestore-v4';
  private lastUpdatedAt: string | null = null;

  /**
   * Subscribe to real-time Firestore database changes across all clients and tabs
   */
  public subscribe(listener: (db: FullRRBDatabase) => void): () => void {
    return firestoreService.subscribe(listener);
  }

  /**
   * Sanitize and normalize database payload structure
   */
  public normalizeDatabase(raw: any): FullRRBDatabase {
    if (!raw || typeof raw !== 'object') {
      return INITIAL_EMPTY_DATABASE;
    }

    const exams: ExamItem[] = (Array.isArray(raw.exams) ? raw.exams : []).filter(Boolean);
    const cutoffs: CutoffRecord[] = (Array.isArray(raw.cutoffs) ? raw.cutoffs : []).filter(Boolean);
    const notices: NoticeItem[] = (Array.isArray(raw.notices) ? raw.notices : []).filter(Boolean);
    const results: ResultItem[] = (Array.isArray(raw.results) ? raw.results : []).filter(Boolean);
    const portalLinks: CandidatePortalLink[] = (
      Array.isArray(raw.portalLinks) && raw.portalLinks.length > 0 
        ? raw.portalLinks 
        : DEFAULT_CANDIDATE_PORTAL_LINKS
    ).filter(Boolean);
    const candidateScorecards = (Array.isArray(raw.candidateScorecards) ? raw.candidateScorecards : []).filter(Boolean);

    return {
      metadata: {
        version: raw.metadata?.version || '4.2.0-FIRESTORE',
        lastUpdated: raw.metadata?.lastUpdated || new Date().toISOString(),
        uploadedBy: raw.metadata?.uploadedBy || 'Official Admin',
        source: raw.metadata?.source || 'Railway Recruitment Board Firestore Cloud Database',
        notes: raw.metadata?.notes || 'Direct Cloud Firestore Persistent Sync',
      },
      settings: raw.settings || INITIAL_EMPTY_DATABASE.settings,
      zones: Array.isArray(raw.zones) && raw.zones.length > 0 ? raw.zones : OFFICIAL_RRB_ZONES,
      exams,
      cutoffs,
      notices,
      results,
      portalLinks,
      candidateScorecards,
    };
  }

  /**
   * Fetch full central dataset directly from Cloud Firestore
   */
  public async fetchDatabase(): Promise<DatabaseSyncResult> {
    try {
      const freshDb = await firestoreService.fetchFullDatabase();
      const normalized = this.normalizeDatabase(freshDb);
      this.inMemoryCache = normalized;
      this.lastUpdatedAt = normalized.metadata.lastUpdated;

      return {
        success: true,
        data: normalized,
        version: this.lastVersion,
        updatedAt: this.lastUpdatedAt,
        updatedBy: 'Cloud Firestore',
      };
    } catch (error: any) {
      console.warn('Firestore fetch error, using in-memory cache:', error);
      return {
        success: false,
        data: this.inMemoryCache || INITIAL_EMPTY_DATABASE,
        version: this.lastVersion,
        updatedAt: this.lastUpdatedAt,
        updatedBy: 'System (Cached)',
        fromCache: true,
        error: error.message || 'Database error',
      };
    }
  }

  /**
   * Save database changes to Cloud Firestore permanently
   */
  public async saveDatabase(
    newDatabase: FullRRBDatabase,
    options: SaveDatabaseOptions = {}
  ): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      const normalized = this.normalizeDatabase(newDatabase);
      const res = await firestoreService.saveFullDatabaseToFirestore(normalized);

      if (!res.success) {
        return { success: false, error: res.error || 'Could not persist data to Firestore.' };
      }

      this.inMemoryCache = normalized;
      this.lastUpdatedAt = new Date().toISOString();

      // Broadcast local event for notification banner if requested
      if (typeof window !== 'undefined' && options.notification) {
        window.dispatchEvent(new CustomEvent('rrb_notifications_updated', {
          detail: {
            notification: {
              id: `notif-${Date.now()}`,
              title: options.notification.title,
              message: options.notification.message,
              category: options.notification.category || 'notice',
              targetTab: options.notification.targetTab || 'notices',
              timestamp: new Date().toISOString(),
              read: false,
              badgeText: 'Live Firestore Update',
            }
          }
        }));
      }

      return {
        success: true,
        version: `firestore-${Date.now()}`,
      };
    } catch (error: any) {
      console.error('Failed to save to Cloud Firestore:', error);
      return {
        success: false,
        error: error.message || 'Could not persist data to Cloud Firestore.',
      };
    }
  }

  /**
   * Migrate and Deduplicate data from local/external source into Cloud Firestore database
   */
  public async migrateToCloudDatabase(externalData: FullRRBDatabase): Promise<MigrationReport> {
    const raw = externalData;
    let duplicatesRemoved = 0;

    // Deduplicate Exams by CEN Number or ID
    const examMap = new Map<string, ExamItem>();
    (raw.exams || []).forEach((e) => {
      const key = (e.cenNumber || e.id || e.title).trim().toLowerCase();
      if (examMap.has(key)) duplicatesRemoved++;
      examMap.set(key, e);
    });

    // Deduplicate Cutoffs by cenNumber + zoneCode + postName + stage
    const cutoffMap = new Map<string, CutoffRecord>();
    (raw.cutoffs || []).forEach((c) => {
      const key = `${c.cenNumber}_${c.zoneCode}_${c.postName}_${c.stage}`.toLowerCase();
      if (cutoffMap.has(key)) duplicatesRemoved++;
      cutoffMap.set(key, c);
    });

    // Deduplicate Notices by title or ID
    const noticeMap = new Map<string, NoticeItem>();
    (raw.notices || []).forEach((n) => {
      const key = (n.id || n.title).trim().toLowerCase();
      if (noticeMap.has(key)) duplicatesRemoved++;
      noticeMap.set(key, n);
    });

    // Deduplicate Results by cenNumber + zoneCode + stage
    const resultMap = new Map<string, ResultItem>();
    (raw.results || []).forEach((r) => {
      const key = `${r.cenNumber}_${r.zoneCode}_${r.stage}_${r.type}`.toLowerCase();
      if (resultMap.has(key)) duplicatesRemoved++;
      resultMap.set(key, r);
    });

    // Deduplicate Portal Links by URL
    const linksMap = new Map<string, CandidatePortalLink>();
    (raw.portalLinks || []).forEach((l) => {
      const key = l.url.trim().toLowerCase();
      if (linksMap.has(key)) duplicatesRemoved++;
      linksMap.set(key, l);
    });

    const cleanExams = Array.from(examMap.values());
    const cleanCutoffs = Array.from(cutoffMap.values());
    const cleanNotices = Array.from(noticeMap.values());
    const cleanResults = Array.from(resultMap.values());
    const cleanLinks = Array.from(linksMap.values());

    const mergedDatabase: FullRRBDatabase = {
      metadata: {
        version: `4.2.0-FIRESTORE-${Date.now()}`,
        lastUpdated: new Date().toISOString(),
        uploadedBy: 'Portal Admin (Firestore Migration)',
        source: 'Railway Recruitment Board Firestore Central Cloud DB',
        notes: 'Sanitized and deduplicated dataset migrated to Cloud Firestore.',
      },
      settings: raw.settings || INITIAL_EMPTY_DATABASE.settings,
      zones: OFFICIAL_RRB_ZONES,
      exams: cleanExams,
      cutoffs: cleanCutoffs,
      notices: cleanNotices,
      results: cleanResults,
      portalLinks: cleanLinks.length > 0 ? cleanLinks : DEFAULT_CANDIDATE_PORTAL_LINKS,
      candidateScorecards: raw.candidateScorecards || [],
    };

    const saveResult = await this.saveDatabase(mergedDatabase, {
      updatedBy: 'Admin (Migration)',
      notification: {
        title: '🚀 Cloud Firestore Migration Complete',
        message: `Migrated ${cleanExams.length} exams, ${cleanNotices.length} notices, and ${cleanCutoffs.length} cutoffs to Firestore.`,
        category: 'notice',
        targetTab: 'notices',
      },
    });

    if (!saveResult.success) {
      return {
        success: false,
        migratedCounts: {
          exams: 0,
          cutoffs: 0,
          notices: 0,
          results: 0,
          portalLinks: 0,
          zones: 0,
          total: 0,
        },
        duplicatesRemoved,
        version: 'failed',
        timestamp: new Date().toISOString(),
        error: saveResult.error || 'Failed to save migrated dataset to Firestore',
      };
    }

    const total = cleanExams.length + cleanCutoffs.length + cleanNotices.length + cleanResults.length + cleanLinks.length;

    return {
      success: true,
      migratedCounts: {
        exams: cleanExams.length,
        cutoffs: cleanCutoffs.length,
        notices: cleanNotices.length,
        results: cleanResults.length,
        portalLinks: cleanLinks.length,
        zones: OFFICIAL_RRB_ZONES.length,
        total,
      },
      duplicatesRemoved,
      version: saveResult.version || 'firestore-migrated',
      timestamp: new Date().toISOString(),
    };
  }
}

export const dbService = new DatabaseService();
