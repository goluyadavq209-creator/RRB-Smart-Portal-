import { FullRRBDatabase, ExamItem, CutoffRecord, NoticeItem, ResultItem, CandidatePortalLink } from '../types';
import { INITIAL_EMPTY_DATABASE, OFFICIAL_RRB_ZONES, DEFAULT_CANDIDATE_PORTAL_LINKS } from '../data/defaultData';

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

const MEMORY_FALLBACK_KEY = 'rrb_db_transient_cache_v4';

/**
 * Clean Database Service Layer
 * Interacts directly with Cloud SQL PostgreSQL API for shared persistence.
 */
class DatabaseService {
  private inMemoryCache: FullRRBDatabase | null = null;
  private lastVersion: string = 'initial';
  private lastUpdatedAt: string | null = null;
  private isSaving: boolean = false;
  private syncListeners: Array<(db: FullRRBDatabase) => void> = [];

  /**
   * Subscribe to real-time database changes across tabs and polling
   */
  public subscribe(listener: (db: FullRRBDatabase) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(db: FullRRBDatabase) {
    this.syncListeners.forEach((listener) => {
      try {
        listener(db);
      } catch (err) {
        console.error('Error in database sync listener:', err);
      }
    });
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
        version: raw.metadata?.version || '4.0.0-PROD',
        lastUpdated: raw.metadata?.lastUpdated || new Date().toISOString(),
        uploadedBy: raw.metadata?.uploadedBy || 'Official Admin',
        source: raw.metadata?.source || 'Railway Recruitment Board Official Portal',
        notes: raw.metadata?.notes || 'Cloud SQL PostgreSQL Managed Dataset',
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
   * Fetch full central dataset from Cloud SQL database API
   */
  public async fetchDatabase(): Promise<DatabaseSyncResult> {
    try {
      const response = await fetch(`/api/database?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: Failed to reach Cloud SQL API`);
      }

      const json = await response.json();

      if (json.exists && json.data) {
        const normalized = this.normalizeDatabase(json.data);
        this.inMemoryCache = normalized;
        this.lastVersion = json.version || 'v4-prod';
        this.lastUpdatedAt = json.updatedAt || new Date().toISOString();

        // Save transient backup cache for offline network resiliency only
        try {
          sessionStorage.setItem(MEMORY_FALLBACK_KEY, JSON.stringify(normalized));
        } catch {}

        return {
          success: true,
          data: normalized,
          version: this.lastVersion,
          updatedAt: this.lastUpdatedAt,
          updatedBy: json.updatedBy || 'Admin',
        };
      }

      // No custom DB uploaded yet in Cloud SQL: return default initial sanitized schema
      const initialDb = INITIAL_EMPTY_DATABASE;
      this.inMemoryCache = initialDb;
      return {
        success: true,
        data: initialDb,
        version: 'initial',
        updatedAt: null,
        updatedBy: 'System',
      };
    } catch (error: any) {
      console.warn('Cloud SQL API fetch error, checking transient session fallback:', error);
      
      // Fallback to in-memory or transient session storage for network hiccups
      if (this.inMemoryCache) {
        return {
          success: false,
          data: this.inMemoryCache,
          version: this.lastVersion,
          updatedAt: this.lastUpdatedAt,
          updatedBy: 'System (Cached)',
          fromCache: true,
          error: error.message,
        };
      }

      try {
        const sessionRaw = sessionStorage.getItem(MEMORY_FALLBACK_KEY);
        if (sessionRaw) {
          const parsed = this.normalizeDatabase(JSON.parse(sessionRaw));
          return {
            success: false,
            data: parsed,
            version: 'session-cache',
            updatedAt: null,
            updatedBy: 'Session Cache',
            fromCache: true,
            error: error.message,
          };
        }
      } catch {}

      return {
        success: false,
        data: INITIAL_EMPTY_DATABASE,
        version: 'error-fallback',
        updatedAt: null,
        updatedBy: 'System',
        error: error.message || 'Network error connecting to database',
      };
    }
  }

  /**
   * Save database changes to Cloud SQL PostgreSQL permanently with optimistic UI rollback support
   */
  public async saveDatabase(
    newDatabase: FullRRBDatabase,
    options: SaveDatabaseOptions = {}
  ): Promise<{ success: boolean; version?: string; error?: string }> {
    if (this.isSaving) {
      // Allow rapid saves via queue or debounce
    }

    this.isSaving = true;
    const previousCache = this.inMemoryCache ? { ...this.inMemoryCache } : null;

    try {
      const normalized = this.normalizeDatabase(newDatabase);
      normalized.metadata.lastUpdated = new Date().toISOString();
      this.inMemoryCache = normalized;
      this.notifyListeners(normalized);

      // Save to transient session cache
      try {
        sessionStorage.setItem(MEMORY_FALLBACK_KEY, JSON.stringify(normalized));
      } catch {}

      const response = await fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          database: normalized,
          updatedBy: options.updatedBy || 'Admin',
          notification: options.notification || {
            title: '📢 RRB Portal Updates Published',
            message: 'Official exam links, notices, and cut-off marks have been updated.',
            category: 'notice',
            targetTab: 'notices',
          },
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server returned ${response.status} on database save`);
      }

      const resData = await response.json();
      this.lastVersion = resData.version || `v4.${Date.now()}`;
      this.lastUpdatedAt = resData.updatedAt || new Date().toISOString();
      this.isSaving = false;

      // Broadcast update event to all local components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rrb_database_updated', { detail: { database: normalized } }));
      }

      return {
        success: true,
        version: this.lastVersion,
      };
    } catch (error: any) {
      this.isSaving = false;
      console.error('Failed to save to Cloud SQL database:', error);

      // Rollback optimistic state if previousCache existed
      if (previousCache) {
        this.inMemoryCache = previousCache;
        this.notifyListeners(previousCache);
      }

      return {
        success: false,
        error: error.message || 'Could not persist data to Cloud SQL database.',
      };
    }
  }

  /**
   * Migrate and Deduplicate data from local/external source into Cloud SQL PostgreSQL database
   */
  public async migrateToCloudDatabase(sourceData: FullRRBDatabase | any): Promise<MigrationReport> {
    try {
      const normalizedSource = this.normalizeDatabase(sourceData);

      // Fetch current Cloud SQL dataset to merge without duplicates
      const currentRes = await this.fetchDatabase();
      const currentDb = currentRes.data || INITIAL_EMPTY_DATABASE;

      let duplicatesCount = 0;

      // Deduplicate Exams by cenNumber or id
      const existingExamKeys = new Set(currentDb.exams.map((e) => `${e.cenNumber}_${e.shortCode}`.toLowerCase()));
      const mergedExams = [...currentDb.exams];
      for (const ex of normalizedSource.exams) {
        const key = `${ex.cenNumber}_${ex.shortCode}`.toLowerCase();
        if (existingExamKeys.has(key)) {
          duplicatesCount++;
        } else {
          existingExamKeys.add(key);
          mergedExams.push(ex);
        }
      }

      // Deduplicate Cutoffs by cenNumber, zoneCode, postName, stage
      const existingCutoffKeys = new Set(
        currentDb.cutoffs.map((c) => `${c.cenNumber}_${c.zoneCode}_${c.postName}_${c.stage}_${c.year}`.toLowerCase())
      );
      const mergedCutoffs = [...currentDb.cutoffs];
      for (const ct of normalizedSource.cutoffs) {
        const key = `${ct.cenNumber}_${ct.zoneCode}_${ct.postName}_${ct.stage}_${ct.year}`.toLowerCase();
        if (existingCutoffKeys.has(key)) {
          duplicatesCount++;
        } else {
          existingCutoffKeys.add(key);
          mergedCutoffs.push(ct);
        }
      }

      // Deduplicate Notices by title and publishDate
      const existingNoticeKeys = new Set(
        currentDb.notices.map((n) => `${n.title}_${n.publishDate}`.toLowerCase())
      );
      const mergedNotices = [...currentDb.notices];
      for (const nt of normalizedSource.notices) {
        const key = `${nt.title}_${nt.publishDate}`.toLowerCase();
        if (existingNoticeKeys.has(key)) {
          duplicatesCount++;
        } else {
          existingNoticeKeys.add(key);
          mergedNotices.push(nt);
        }
      }

      // Deduplicate Results by cenNumber, zoneCode, stage
      const existingResultKeys = new Set(
        currentDb.results.map((r) => `${r.cenNumber}_${r.zoneCode}_${r.stage}_${r.publishDate}`.toLowerCase())
      );
      const mergedResults = [...currentDb.results];
      for (const rs of normalizedSource.results) {
        const key = `${rs.cenNumber}_${rs.zoneCode}_${rs.stage}_${rs.publishDate}`.toLowerCase();
        if (existingResultKeys.has(key)) {
          duplicatesCount++;
        } else {
          existingResultKeys.add(key);
          mergedResults.push(rs);
        }
      }

      // Deduplicate Portal Links by url
      const existingLinkUrls = new Set(currentDb.portalLinks.map((l) => l.url.trim().toLowerCase()));
      const mergedLinks = [...currentDb.portalLinks];
      for (const pl of normalizedSource.portalLinks) {
        const key = pl.url.trim().toLowerCase();
        if (existingLinkUrls.has(key)) {
          duplicatesCount++;
        } else {
          existingLinkUrls.add(key);
          mergedLinks.push(pl);
        }
      }

      const mergedDatabase: FullRRBDatabase = {
        metadata: {
          version: `migrated-${Date.now()}`,
          lastUpdated: new Date().toISOString(),
          uploadedBy: 'Admin Cloud Migration Engine',
          source: 'Cloud SQL PostgreSQL Live Sync',
          notes: `Successfully migrated and deduplicated. Removed ${duplicatesCount} redundant entries.`,
        },
        settings: normalizedSource.settings || currentDb.settings,
        zones: currentDb.zones.length > 0 ? currentDb.zones : OFFICIAL_RRB_ZONES,
        exams: mergedExams,
        cutoffs: mergedCutoffs,
        notices: mergedNotices,
        results: mergedResults,
        portalLinks: mergedLinks,
        candidateScorecards: currentDb.candidateScorecards || [],
      };

      // Persist to Cloud SQL PostgreSQL
      const saveRes = await this.saveDatabase(mergedDatabase, {
        updatedBy: 'Admin Migration Tool',
        notification: {
          title: '🚀 Cloud Database Migration Completed',
          message: `Portal database migrated to Cloud SQL with ${mergedExams.length} exams, ${mergedCutoffs.length} cutoffs, ${mergedNotices.length} notices, and ${mergedLinks.length} portal links.`,
          category: 'admin',
          targetTab: 'notices',
        },
      });

      if (!saveRes.success) {
        throw new Error(saveRes.error || 'Failed to save migrated database to Cloud SQL');
      }

      const totalCount = mergedExams.length + mergedCutoffs.length + mergedNotices.length + mergedResults.length + mergedLinks.length;

      return {
        success: true,
        migratedCounts: {
          exams: mergedExams.length,
          cutoffs: mergedCutoffs.length,
          notices: mergedNotices.length,
          results: mergedResults.length,
          portalLinks: mergedLinks.length,
          zones: mergedDatabase.zones.length,
          total: totalCount,
        },
        duplicatesRemoved: duplicatesCount,
        version: saveRes.version || 'v4-migrated',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        migratedCounts: { exams: 0, cutoffs: 0, notices: 0, results: 0, portalLinks: 0, zones: 0, total: 0 },
        duplicatesRemoved: 0,
        version: 'failed',
        timestamp: new Date().toISOString(),
        error: error.message || 'Migration failed',
      };
    }
  }

  /**
   * Fast status check for poller
   */
  public async checkStatus(): Promise<{ version: string; updatedAt: string | null; latestNotification: any }> {
    try {
      const res = await fetch('/api/database/status', {
        cache: 'no-store',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      version: this.lastVersion,
      updatedAt: this.lastUpdatedAt,
      latestNotification: null,
    };
  }
}

export const dbService = new DatabaseService();
