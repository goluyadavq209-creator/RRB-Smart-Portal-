import fs from 'fs';
import path from 'path';
import { 
  TelegramMessageRecord, 
  WebsitePost, 
  AIProcessingLogRecord, 
  TelegramAutoPublishSettings 
} from '../types';

interface TelegramDatabaseFile {
  settings: TelegramAutoPublishSettings;
  messages: TelegramMessageRecord[];
  posts: WebsitePost[];
  logs: AIProcessingLogRecord[];
  updatedAt: string;
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'telegram_database.json');

const DEFAULT_SETTINGS: TelegramAutoPublishSettings = {
  telegram_enabled: true,
  ai_enabled: true,
  auto_publish: true,
  default_status: 'PUBLISHED',
  confidence_threshold: 0.80,
  ai_model: 'gemini-3.7-flash',
  bot_token: '8580504765:AAEAULLAiL0DZL4WNfj45Mj9pxwlduckHKk',
  target_channel_id: '@railway_recruitment_updates',
  auto_create_notices: true,
  auto_create_results: true,
  auto_create_portal_links: true,
  updated_at: new Date().toISOString(),
};

// In-memory cache
let inMemoryDb: TelegramDatabaseFile = {
  settings: DEFAULT_SETTINGS,
  messages: [],
  posts: [],
  logs: [],
  updatedAt: new Date().toISOString(),
};

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export function loadTelegramDb(): TelegramDatabaseFile {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryDb = {
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        posts: Array.isArray(parsed.posts) ? parsed.posts : [],
        logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    } else {
      saveTelegramDb(inMemoryDb);
    }
  } catch (err) {
    console.error('Error loading telegram database from disk, using memory state:', err);
  }
  return inMemoryDb;
}

export function saveTelegramDb(db: TelegramDatabaseFile): void {
  try {
    inMemoryDb = {
      ...db,
      updatedAt: new Date().toISOString(),
    };
    ensureDirectoryExistence(DB_FILE_PATH);
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving telegram database to disk:', err);
  }
}

// Initialize on module load
loadTelegramDb();

export const telegramDb = {
  getSettings(): TelegramAutoPublishSettings {
    return inMemoryDb.settings;
  },
  
  updateSettings(partial: Partial<TelegramAutoPublishSettings>): TelegramAutoPublishSettings {
    inMemoryDb.settings = {
      ...inMemoryDb.settings,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    saveTelegramDb(inMemoryDb);
    return inMemoryDb.settings;
  },

  getMessages(): TelegramMessageRecord[] {
    return inMemoryDb.messages;
  },

  findMessageByTelegramId(chatId: string | number, messageId: string | number): TelegramMessageRecord | undefined {
    return inMemoryDb.messages.find(
      (m) => String(m.telegram_chat_id) === String(chatId) && String(m.telegram_message_id) === String(messageId)
    );
  },

  saveMessage(msg: TelegramMessageRecord): TelegramMessageRecord {
    const idx = inMemoryDb.messages.findIndex((m) => m.id === msg.id);
    if (idx >= 0) {
      inMemoryDb.messages[idx] = msg;
    } else {
      inMemoryDb.messages.unshift(msg);
    }
    saveTelegramDb(inMemoryDb);
    return msg;
  },

  getPosts(): WebsitePost[] {
    return inMemoryDb.posts;
  },

  getPostById(id: string): WebsitePost | undefined {
    return inMemoryDb.posts.find((p) => p.id === id);
  },

  getPostBySlug(slug: string): WebsitePost | undefined {
    return inMemoryDb.posts.find((p) => p.slug === slug);
  },

  savePost(post: WebsitePost): WebsitePost {
    const idx = inMemoryDb.posts.findIndex((p) => p.id === post.id);
    if (idx >= 0) {
      inMemoryDb.posts[idx] = post;
    } else {
      inMemoryDb.posts.unshift(post);
    }
    saveTelegramDb(inMemoryDb);
    return post;
  },

  deletePost(id: string): boolean {
    const beforeLen = inMemoryDb.posts.length;
    inMemoryDb.posts = inMemoryDb.posts.filter((p) => p.id !== id);
    saveTelegramDb(inMemoryDb);
    return inMemoryDb.posts.length < beforeLen;
  },

  getLogs(): AIProcessingLogRecord[] {
    return inMemoryDb.logs;
  },

  saveLog(log: AIProcessingLogRecord): AIProcessingLogRecord {
    inMemoryDb.logs.unshift(log);
    // Keep max 200 logs
    if (inMemoryDb.logs.length > 200) {
      inMemoryDb.logs = inMemoryDb.logs.slice(0, 200);
    }
    saveTelegramDb(inMemoryDb);
    return log;
  },
};
