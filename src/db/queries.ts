import { db } from './index.ts';
import { 
  users, 
  formExports, 
  sheetExports, 
  candidateFeedback, 
  portalDatabase, 
  liveNotifications,
  rrbSyncItems,
  rrbSyncLogs,
  rrbSyncSettings
} from './schema.ts';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';

// Portal Database Cloud SQL Central Store
export async function getPortalDatabaseFromDB() {
  try {
    const result = await db.select().from(portalDatabase).where(eq(portalDatabase.key, 'main_rrb_database')).limit(1);
    if (!result || result.length === 0) {
      return null;
    }
    const record = result[0];
    const parsedData = JSON.parse(record.data);
    return {
      data: parsedData,
      version: record.version,
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
    };
  } catch (error) {
    console.error('Database getPortalDatabaseFromDB error:', error);
    return null;
  }
}

export async function savePortalDatabaseToDB(databaseData: any, updatedBy: string = 'Admin', notificationInfo?: { title?: string; message?: string; category?: string; targetTab?: string; linkUrl?: string }) {
  try {
    const jsonString = typeof databaseData === 'string' ? databaseData : JSON.stringify(databaseData);
    const version = `v4.${Date.now()}`;
    const now = new Date();

    const result = await db.insert(portalDatabase)
      .values({
        key: 'main_rrb_database',
        data: jsonString,
        version,
        updatedBy,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: portalDatabase.key,
        set: {
          data: jsonString,
          version,
          updatedBy,
          updatedAt: now,
        },
      })
      .returning();

    // Also create live notification so all active users see immediate popup alert
    let notifRecord = null;
    if (notificationInfo?.title && notificationInfo?.message) {
      notifRecord = await createLiveNotificationRecord(
        notificationInfo.title,
        notificationInfo.message,
        notificationInfo.category || 'notice',
        notificationInfo.targetTab || 'notices',
        notificationInfo.linkUrl
      );
    } else {
      // Automatic general update notification
      notifRecord = await createLiveNotificationRecord(
        '📢 Portal Data Updated by Admin',
        'New examination notices, links, and official portal updates are now live for all candidates.',
        'admin',
        'notices'
      );
    }

    return {
      success: true,
      record: result[0],
      notification: notifRecord,
    };
  } catch (error) {
    console.error('Database savePortalDatabaseToDB error:', error);
    throw new Error('Failed to save portal database to Cloud SQL', { cause: error });
  }
}

// Live Notifications
export async function createLiveNotificationRecord(
  title: string,
  message: string,
  category: string = 'notice',
  targetTab: string = 'notices',
  linkUrl?: string
) {
  try {
    const result = await db.insert(liveNotifications)
      .values({
        title,
        message,
        category,
        targetTab,
        linkUrl: linkUrl || null,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database createLiveNotificationRecord error:', error);
    return null;
  }
}

export async function getLiveNotifications(limit: number = 15) {
  try {
    return await db.select()
      .from(liveNotifications)
      .orderBy(desc(liveNotifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Database getLiveNotifications error:', error);
    return [];
  }
}

export async function getDatabaseStatus() {
  try {
    const dbRecord = await db.select({
      version: portalDatabase.version,
      updatedAt: portalDatabase.updatedAt,
      updatedBy: portalDatabase.updatedBy,
    }).from(portalDatabase).where(eq(portalDatabase.key, 'main_rrb_database')).limit(1);

    const latestNotifs = await db.select()
      .from(liveNotifications)
      .orderBy(desc(liveNotifications.createdAt))
      .limit(1);

    return {
      version: dbRecord[0]?.version || 'initial',
      updatedAt: dbRecord[0]?.updatedAt || null,
      updatedBy: dbRecord[0]?.updatedBy || 'System',
      latestNotification: latestNotifs[0] || null,
    };
  } catch (error) {
    return {
      version: 'initial',
      updatedAt: null,
      updatedBy: 'System',
      latestNotification: null,
    };
  }
}

// Upsert user in Cloud SQL PostgreSQL
export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoURL?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoURL: photoURL || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          photoURL: photoURL || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Failed to synchronize user in database.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Database getUserByUid failed:', error);
    throw new Error('Failed to fetch user from database.', { cause: error });
  }
}

// Form Exports
export async function recordFormExport(
  userId: number,
  formId: string,
  formTitle: string,
  formUrl: string,
  formType: string = 'RRB Feedback'
) {
  try {
    const result = await db.insert(formExports)
      .values({
        userId,
        formId,
        formTitle,
        formUrl,
        formType,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database recordFormExport failed:', error);
    throw new Error('Failed to save Google Form export record.', { cause: error });
  }
}

export async function getFormExports(userId: number) {
  try {
    return await db.select()
      .from(formExports)
      .where(eq(formExports.userId, userId))
      .orderBy(desc(formExports.createdAt));
  } catch (error) {
    console.error('Database getFormExports failed:', error);
    throw new Error('Failed to fetch Google Form export records.', { cause: error });
  }
}

// Sheet Exports
export async function recordSheetExport(
  userId: number,
  sheetId: string,
  sheetTitle: string,
  sheetUrl: string,
  rowCount: number = 0,
  exportType: string = 'Cut-Off Data'
) {
  try {
    const result = await db.insert(sheetExports)
      .values({
        userId,
        sheetId,
        sheetTitle,
        sheetUrl,
        rowCount,
        exportType,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database recordSheetExport failed:', error);
    throw new Error('Failed to save Google Sheet export record.', { cause: error });
  }
}

export async function getSheetExports(userId: number) {
  try {
    return await db.select()
      .from(sheetExports)
      .where(eq(sheetExports.userId, userId))
      .orderBy(desc(sheetExports.createdAt));
  } catch (error) {
    console.error('Database getSheetExports failed:', error);
    throw new Error('Failed to fetch Google Sheet export records.', { cause: error });
  }
}

// Feedback
export async function recordCandidateFeedback(data: {
  userId?: number;
  candidateName: string;
  rollNumber?: string;
  examName: string;
  zone: string;
  feedbackText: string;
  rating?: number;
}) {
  try {
    const result = await db.insert(candidateFeedback)
      .values({
        userId: data.userId || null,
        candidateName: data.candidateName,
        rollNumber: data.rollNumber || null,
        examName: data.examName,
        zone: data.zone,
        feedbackText: data.feedbackText,
        rating: data.rating || 5,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database recordCandidateFeedback failed:', error);
    throw new Error('Failed to record candidate feedback.', { cause: error });
  }
}

export async function getAllFeedback() {
  try {
    return await db.select()
      .from(candidateFeedback)
      .orderBy(desc(candidateFeedback.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Database getAllFeedback failed:', error);
    throw new Error('Failed to fetch feedback logs.', { cause: error });
  }
}

// DB Stats
export async function getDbStats() {
  try {
    const userCount = await db.select().from(users);
    const formCount = await db.select().from(formExports);
    const sheetCount = await db.select().from(sheetExports);
    const feedbackCount = await db.select().from(candidateFeedback);

    return {
      totalUsers: userCount.length,
      totalFormExports: formCount.length,
      totalSheetExports: sheetCount.length,
      totalFeedbacks: feedbackCount.length,
      status: 'connected',
    };
  } catch (error) {
    console.error('Database getDbStats failed:', error);
    return {
      totalUsers: 0,
      totalFormExports: 0,
      totalSheetExports: 0,
      totalFeedbacks: 0,
      status: 'disconnected',
    };
  }
}

// ==========================================
// RRB AUTO SYNC & PUBLISH DATABASE QUERIES
// ==========================================

export async function getRRBSyncSettings() {
  try {
    const result = await db.select().from(rrbSyncSettings).where(eq(rrbSyncSettings.key, 'default_settings')).limit(1);
    if (result && result.length > 0) {
      return result[0];
    }
    // Create initial default settings
    const initial = await db.insert(rrbSyncSettings)
      .values({
        key: 'default_settings',
        autoSyncEnabled: true,
        autoPublishEnabled: true,
        intervalMinutes: 30,
        lastSyncAt: new Date(),
        nextSyncAt: new Date(Date.now() + 30 * 60 * 1000),
      })
      .returning();
    return initial[0];
  } catch (error) {
    console.error('Error fetching RRB sync settings:', error);
    return {
      id: 1,
      key: 'default_settings',
      autoSyncEnabled: true,
      autoPublishEnabled: true,
      intervalMinutes: 30,
      lastSyncAt: new Date(),
      nextSyncAt: new Date(Date.now() + 30 * 60 * 1000),
      updatedAt: new Date(),
    };
  }
}

export async function updateRRBSyncSettings(settingsData: {
  autoSyncEnabled?: boolean;
  autoPublishEnabled?: boolean;
  intervalMinutes?: number;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
}) {
  try {
    const now = new Date();
    const result = await db.insert(rrbSyncSettings)
      .values({
        key: 'default_settings',
        autoSyncEnabled: settingsData.autoSyncEnabled ?? true,
        autoPublishEnabled: settingsData.autoPublishEnabled ?? true,
        intervalMinutes: settingsData.intervalMinutes ?? 30,
        lastSyncAt: settingsData.lastSyncAt || now,
        nextSyncAt: settingsData.nextSyncAt || new Date(now.getTime() + (settingsData.intervalMinutes || 30) * 60 * 1000),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: rrbSyncSettings.key,
        set: {
          ...(settingsData.autoSyncEnabled !== undefined ? { autoSyncEnabled: settingsData.autoSyncEnabled } : {}),
          ...(settingsData.autoPublishEnabled !== undefined ? { autoPublishEnabled: settingsData.autoPublishEnabled } : {}),
          ...(settingsData.intervalMinutes !== undefined ? { intervalMinutes: settingsData.intervalMinutes } : {}),
          ...(settingsData.lastSyncAt ? { lastSyncAt: settingsData.lastSyncAt } : {}),
          ...(settingsData.nextSyncAt ? { nextSyncAt: settingsData.nextSyncAt } : {}),
          updatedAt: now,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating RRB sync settings:', error);
    throw new Error('Failed to update sync settings', { cause: error });
  }
}

export async function getRRBSyncItems(filters?: {
  status?: string;
  category?: string;
  search?: string;
  date?: string;
  limit?: number;
}) {
  try {
    let query = db.select().from(rrbSyncItems).$dynamic();

    const conditions = [];
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(rrbSyncItems.status, filters.status));
    }
    if (filters?.category && filters.category !== 'all') {
      conditions.push(eq(rrbSyncItems.category, filters.category));
    }
    if (filters?.date) {
      conditions.push(eq(rrbSyncItems.publishDate, filters.date));
    }
    if (filters?.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(rrbSyncItems.title, term),
          ilike(rrbSyncItems.cenNumber, term),
          ilike(rrbSyncItems.examName, term),
          ilike(rrbSyncItems.description, term)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const items = await query.orderBy(desc(rrbSyncItems.importedAt)).limit(filters?.limit || 100);
    return items;
  } catch (error) {
    console.error('Error fetching RRB sync items:', error);
    return [];
  }
}

export async function getRRBSyncItemById(id: number) {
  try {
    const result = await db.select().from(rrbSyncItems).where(eq(rrbSyncItems.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching RRB sync item by id:', error);
    return null;
  }
}

export async function findDuplicateRRBSyncItem(params: {
  officialSourceUrl?: string;
  officialPdfUrl?: string;
  title: string;
  publishDate?: string;
  cenNumber?: string;
}) {
  try {
    // 1. Check official PDF URL if provided
    if (params.officialPdfUrl) {
      const byPdf = await db.select().from(rrbSyncItems).where(eq(rrbSyncItems.officialPdfUrl, params.officialPdfUrl)).limit(1);
      if (byPdf.length > 0) return byPdf[0];
    }
    // 2. Check official Source URL if provided
    if (params.officialSourceUrl) {
      const bySource = await db.select().from(rrbSyncItems).where(eq(rrbSyncItems.officialSourceUrl, params.officialSourceUrl)).limit(1);
      if (bySource.length > 0) return bySource[0];
    }
    // 3. Normalized Title + Publish Date match
    if (params.title && params.publishDate) {
      const byTitleDate = await db.select().from(rrbSyncItems).where(
        and(
          eq(rrbSyncItems.title, params.title),
          eq(rrbSyncItems.publishDate, params.publishDate)
        )
      ).limit(1);
      if (byTitleDate.length > 0) return byTitleDate[0];
    }
    return null;
  } catch (error) {
    console.error('Error checking duplicate RRB sync item:', error);
    return null;
  }
}

export async function insertRRBSyncItem(item: {
  title: string;
  cenNumber?: string;
  examName?: string;
  category: string;
  zoneCode?: string;
  publishDate?: string;
  description?: string;
  officialSourceUrl?: string;
  officialPdfUrl?: string;
  officialLinks?: string;
  status?: string;
  confidence?: string;
  source?: string;
  rawMetadata?: string;
  publishedAt?: Date;
}) {
  try {
    const result = await db.insert(rrbSyncItems)
      .values({
        title: item.title,
        cenNumber: item.cenNumber || null,
        examName: item.examName || null,
        category: item.category || 'notice',
        zoneCode: item.zoneCode || 'ALL',
        publishDate: item.publishDate || null,
        description: item.description || null,
        officialSourceUrl: item.officialSourceUrl || null,
        officialPdfUrl: item.officialPdfUrl || null,
        officialLinks: item.officialLinks || null,
        status: item.status || 'pending_review',
        confidence: item.confidence || 'high',
        source: item.source || 'RRB_OFFICIAL',
        importedAt: new Date(),
        publishedAt: item.publishedAt || null,
        rawMetadata: item.rawMetadata || null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error inserting RRB sync item:', error);
    throw error;
  }
}

export async function updateRRBSyncItemStatus(id: number, status: string, publishedAt?: Date) {
  try {
    const result = await db.update(rrbSyncItems)
      .set({
        status,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      })
      .where(eq(rrbSyncItems.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating RRB sync item status:', error);
    throw error;
  }
}

export async function updateRRBSyncItemDetails(id: number, data: {
  title?: string;
  cenNumber?: string;
  examName?: string;
  category?: string;
  zoneCode?: string;
  publishDate?: string;
  description?: string;
  officialPdfUrl?: string;
  status?: string;
}) {
  try {
    const result = await db.update(rrbSyncItems)
      .set({
        ...data,
      })
      .where(eq(rrbSyncItems.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating RRB sync item details:', error);
    throw error;
  }
}

export async function createRRBSyncLog(
  action: string,
  details: string,
  sourceUrl?: string,
  recordId?: string,
  status: string = 'success'
) {
  try {
    const result = await db.insert(rrbSyncLogs)
      .values({
        action,
        details,
        sourceUrl: sourceUrl || null,
        recordId: recordId || null,
        status,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating RRB sync log:', error);
    return null;
  }
}

export async function getRRBSyncLogs(limit: number = 60) {
  try {
    return await db.select()
      .from(rrbSyncLogs)
      .orderBy(desc(rrbSyncLogs.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching RRB sync logs:', error);
    return [];
  }
}

export async function getRRBSyncStats() {
  try {
    const allItems = await db.select().from(rrbSyncItems);
    const published = allItems.filter(i => i.status === 'published').length;
    const pendingReview = allItems.filter(i => i.status === 'pending_review').length;
    const rejected = allItems.filter(i => i.status === 'rejected').length;
    const total = allItems.length;

    const settings = await getRRBSyncSettings();

    return {
      total,
      published,
      pendingReview,
      rejected,
      autoSyncEnabled: settings.autoSyncEnabled ?? true,
      autoPublishEnabled: settings.autoPublishEnabled ?? true,
      intervalMinutes: settings.intervalMinutes ?? 30,
      lastSyncAt: settings.lastSyncAt,
      nextSyncAt: settings.nextSyncAt,
    };
  } catch (error) {
    console.error('Error getting RRB sync stats:', error);
    return {
      total: 0,
      published: 0,
      pendingReview: 0,
      rejected: 0,
      autoSyncEnabled: true,
      autoPublishEnabled: true,
      intervalMinutes: 30,
      lastSyncAt: null,
      nextSyncAt: null,
    };
  }
}

