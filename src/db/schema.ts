import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Central Shared Portal Database stored in Cloud SQL PostgreSQL for all users
export const portalDatabase = pgTable('portal_database', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(), // e.g. 'main_rrb_database'
  data: text('data').notNull(), // Full JSON string of FullRRBDatabase
  version: text('version').notNull().default('4.0.0-EMPTY'),
  updatedBy: text('updated_by').default('Admin'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Live Multi-User Notifications broadcasted in real-time
export const liveNotifications = pgTable('live_notifications', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  category: text('category').default('notice'), // 'notice' | 'cutoff' | 'result' | 'exam' | 'link' | 'admin'
  targetTab: text('target_tab').default('notices'),
  linkUrl: text('link_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Google Form Exports created by users
export const formExports = pgTable('form_exports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  formId: text('form_id').notNull(),
  formTitle: text('form_title').notNull(),
  formUrl: text('form_url').notNull(),
  formType: text('form_type').default('RRB Feedback'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Google Sheet Exports created by users
export const sheetExports = pgTable('sheet_exports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  sheetId: text('sheet_id').notNull(),
  sheetTitle: text('sheet_title').notNull(),
  sheetUrl: text('sheet_url').notNull(),
  rowCount: integer('row_count').default(0),
  exportType: text('export_type').default('Cut-Off Data'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Candidate Feedback & Queries logged in Cloud SQL
export const candidateFeedback = pgTable('candidate_feedback', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  candidateName: text('candidate_name').notNull(),
  rollNumber: text('roll_number'),
  examName: text('exam_name').notNull(),
  zone: text('zone').notNull(),
  feedbackText: text('feedback_text').notNull(),
  rating: integer('rating').default(5),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  formExports: many(formExports),
  sheetExports: many(sheetExports),
  feedbacks: many(candidateFeedback),
}));

export const formExportsRelations = relations(formExports, ({ one }) => ({
  author: one(users, {
    fields: [formExports.userId],
    references: [users.id],
  }),
}));

export const sheetExportsRelations = relations(sheetExports, ({ one }) => ({
  author: one(users, {
    fields: [sheetExports.userId],
    references: [users.id],
  }),
}));

export const candidateFeedbackRelations = relations(candidateFeedback, ({ one }) => ({
  author: one(users, {
    fields: [candidateFeedback.userId],
    references: [users.id],
  }),
}));

// Discovered & Synced Official RRB Items
export const rrbSyncItems = pgTable('rrb_sync_items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  cenNumber: text('cen_number'),
  examName: text('exam_name'),
  category: text('category').notNull().default('notice'), // 'notice' | 'cen' | 'result' | 'answer_key' | 'exam_schedule' | 'cutoff' | 'other'
  zoneCode: text('zone_code').default('ALL'),
  publishDate: text('publish_date'), // ISO date YYYY-MM-DD
  description: text('description'),
  officialSourceUrl: text('official_source_url'),
  officialPdfUrl: text('official_pdf_url'),
  officialLinks: text('official_links'), // JSON array string
  status: text('status').notNull().default('pending_review'), // 'pending_review' | 'published' | 'rejected'
  confidence: text('confidence').default('high'), // 'high' | 'low'
  source: text('source').default('RRB_OFFICIAL'),
  importedAt: timestamp('imported_at').defaultNow(),
  publishedAt: timestamp('published_at'),
  rawMetadata: text('raw_metadata'),
});

// Real-time RRB Synchronization Logs & Audits
export const rrbSyncLogs = pgTable('rrb_sync_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(), // 'sync_started' | 'sync_completed' | 'item_discovered' | 'item_imported' | 'item_updated' | 'duplicate_skipped' | 'item_published' | 'item_rejected' | 'error'
  details: text('details').notNull(),
  sourceUrl: text('source_url'),
  recordId: text('record_id'),
  status: text('status').default('success'), // 'success' | 'warning' | 'error'
  createdAt: timestamp('created_at').defaultNow(),
});

// Background Auto-Sync Settings
export const rrbSyncSettings = pgTable('rrb_sync_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique().default('default_settings'),
  autoSyncEnabled: boolean('auto_sync_enabled').default(true),
  autoPublishEnabled: boolean('auto_publish_enabled').default(true),
  intervalMinutes: integer('interval_minutes').default(30),
  lastSyncAt: timestamp('last_sync_at'),
  nextSyncAt: timestamp('next_sync_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
