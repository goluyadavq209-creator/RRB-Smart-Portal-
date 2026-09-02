import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

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
