import { db } from './index.ts';
import { users, formExports, sheetExports, candidateFeedback } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

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
