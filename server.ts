import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { 
  getOrCreateUser, 
  getUserByUid, 
  recordFormExport, 
  getFormExports, 
  recordSheetExport, 
  getSheetExports, 
  recordCandidateFeedback, 
  getAllFeedback, 
  getDbStats,
  getPortalDatabaseFromDB,
  savePortalDatabaseToDB,
  getLiveNotifications,
  createLiveNotificationRecord,
  getDatabaseStatus,
  getRRBSyncSettings,
  updateRRBSyncSettings,
  getRRBSyncItems,
  getRRBSyncItemById,
  updateRRBSyncItemStatus,
  updateRRBSyncItemDetails,
  getRRBSyncLogs,
  getRRBSyncStats,
  getAdminAuthConfigFromDB,
  saveAdminAuthConfigToDB
} from './src/db/queries.ts';
import { 
  runRRBAutoSyncRoutine, 
  publishSyncedItemToDatabase,
  OFFICIAL_RRB_LIVE_FEEDS 
} from './src/services/rrbSyncService.ts';
import {
  runSystemDiagnosticsAndAutoHeal,
  simulateIssueAndVerifyAutoHeal,
  getAutoMonitorSummary,
  toggleAutoMonitorWatchdog,
} from './src/services/systemMonitorService.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Security: Disable X-Powered-By header to prevent server fingerprinting
app.disable('x-powered-by');

// Security: Custom HTTP Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// Security: In-Memory IP Rate Limiter for API endpoints
const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();
  const clientRecord = ipRateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    ipRateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (clientRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a moment before trying again.',
      retryAfterSeconds: Math.ceil((clientRecord.resetTime - now) / 1000),
    });
  }

  clientRecord.count += 1;
  next();
};

app.use('/api', rateLimiter);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy-initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

const RRB_KNOWLEDGE_SYSTEM_PROMPT = `
You are "RRB AI" (आपका AI साथी), the official intelligent virtual assistant for Indian Railway Recruitment Board (RRB) candidates on the RRB SMART PORTAL.
You communicate fluently in Hindi, English, and Hinglish (as preferred by the candidate).

Your capabilities:
1. Explain Railway Exam Patterns, Syllabus (NTPC CEN 05/2024, Group D CEN 08/2024, ALP CEN 01/2024, Technician CEN 02/2024, JE CEN 03/2024, Paramedical, RPF SI & Constable).
2. Cut-Off analysis across all 21 RRB Zones (Allahabad/Prayagraj, Mumbai, Kolkata, Secunderabad, Chandigarh, Bangalore, Chennai, Patna, Ahmedabad, Bhopal, etc.).
3. Marks & Rank analysis: When candidate gives their raw marks, shift difficulty, and category (UR/OBC/SC/ST/EWS), calculate their normalized chance and qualification probability for CBT-1 / CBT-2.
4. Normalization Formula explanation:
   $M_{ij} = \\frac{\\bar{M}_t^g - M_q^g}{\\bar{M}_{ti} - M_{iq}} (M_{ij} - M_{iq}) + M_q^{gm}$
5. Medical Fitness Standards: A-1 (6/6 without glasses for ALP), A-2, A-3, B-1, B-2, C-1.
6. Answer Key, Objection submission rules (₹50 per question refund on valid objection), and Document Verification (DV) criteria.
7. Official links: rrbcdg.gov.in, rrb.digialm.com.

Tone: Highly encouraging, accurate, empathetic, structured with bullet points, bold key terms, and easy-to-read markdown. Always answer candidate questions directly and practically.
`;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    officialCentralUrl: 'https://rrb.indianrailways.gov.in/',
    timestamp: new Date().toISOString() 
  });
});

// Official RRB Live Sync & Crawl Endpoint from https://rrb.indianrailways.gov.in/
app.post('/api/rrb/sync', async (req, res) => {
  try {
    const syncResult = await runRRBAutoSyncRoutine();
    return res.json({
      success: true,
      source: 'https://rrb.indianrailways.gov.in/',
      syncedAt: new Date().toISOString(),
      ...syncResult,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error syncing with RRB central server'
    });
  }
});

// ==========================================
// RRB AUTO SYNC & PUBLISH ENGINE API ROUTES
// ==========================================

// Get Sync Engine Status, Settings & Summary Stats
app.get('/api/rrb-sync/status', async (req, res) => {
  try {
    const stats = await getRRBSyncStats();
    return res.json({
      success: true,
      source: 'https://rrb.indianrailways.gov.in/',
      ...stats,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch sync status' });
  }
});

// Trigger Manual Instant Sync Run
app.post('/api/rrb-sync/run', async (req, res) => {
  try {
    const result = await runRRBAutoSyncRoutine();
    return res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to execute sync routine' });
  }
});

// Fetch Filtered Synced Items List (for Admin review & management)
app.get('/api/rrb-sync/items', async (req, res) => {
  try {
    const { status, category, search, date, limit } = req.query;
    const items = await getRRBSyncItems({
      status: typeof status === 'string' ? status : undefined,
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search : undefined,
      date: typeof date === 'string' ? date : undefined,
      limit: limit ? parseInt(limit as string) : 100,
    });

    return res.json({
      success: true,
      total: items.length,
      items,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch sync items' });
  }
});

// Publish a single item directly to Live Central Database
app.post('/api/rrb-sync/publish/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const publishResult = await publishSyncedItemToDatabase(id, 'Admin (Manual Publish)');
    return res.json({
      success: true,
      ...publishResult,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to publish item' });
  }
});

// Reject an item from review queue
app.post('/api/rrb-sync/reject/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const updated = await updateRRBSyncItemStatus(id, 'rejected');
    return res.json({
      success: true,
      message: 'Item rejected and marked inactive.',
      item: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to reject item' });
  }
});

// Edit item details before publishing
app.post('/api/rrb-sync/edit/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const { title, cenNumber, examName, category, zoneCode, publishDate, description, officialPdfUrl, status } = req.body;
    const updated = await updateRRBSyncItemDetails(id, {
      title,
      cenNumber,
      examName,
      category,
      zoneCode,
      publishDate,
      description,
      officialPdfUrl,
      status,
    });

    return res.json({
      success: true,
      message: 'Item details updated successfully.',
      item: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to update item details' });
  }
});

// Fetch Audit / Crawler Logs
app.get('/api/rrb-sync/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 60;
    const logs = await getRRBSyncLogs(limit);
    return res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch sync logs' });
  }
});

// Update Auto-Sync Settings
app.post('/api/rrb-sync/settings', async (req, res) => {
  try {
    const { autoSyncEnabled, autoPublishEnabled, intervalMinutes } = req.body;
    const updated = await updateRRBSyncSettings({
      autoSyncEnabled: typeof autoSyncEnabled === 'boolean' ? autoSyncEnabled : undefined,
      autoPublishEnabled: typeof autoPublishEnabled === 'boolean' ? autoPublishEnabled : undefined,
      intervalMinutes: typeof intervalMinutes === 'number' ? intervalMinutes : undefined,
    });

    return res.json({
      success: true,
      message: 'RRB Auto-Sync settings updated successfully.',
      settings: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to update settings' });
  }
});

// Gemini AI Chat API
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, conversationHistory, examContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    const ai = getGenAI();

    // If no Gemini API key is configured in env, inform client so it can use fallback knowledge engine
    if (!ai) {
      return res.json({
        reply: null,
        fallbackNeeded: true,
        message: 'No GEMINI_API_KEY found in server environment, using local AI knowledge engine.',
      });
    }

    // Construct contents history
    const contents: any[] = [];

    if (Array.isArray(conversationHistory)) {
      for (const item of conversationHistory.slice(-6)) {
        if (item.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.role === 'assistant' || item.role === 'model') {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    const contextualPrompt = examContext
      ? `[Candidate Context: Active Exam Filter: ${examContext}]\n\nCandidate Question: ${message}`
      : message;

    contents.push({ role: 'user', parts: [{ text: contextualPrompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: RRB_KNOWLEDGE_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'मुझे आपकी मदद करने में खुशी होगी। कृपया अपना प्रश्न दोबारा पूछें।';

    return res.json({
      reply: replyText,
      success: true,
      fallbackNeeded: false,
    });
  } catch (error: any) {
    console.warn('Gemini API notice in server.ts (falling back to local engine):', error.message || error);
    // Return 200 with fallback flag so frontend gracefully uses the local intelligent RRB AI
    return res.json({
      reply: null,
      fallbackNeeded: true,
      error: error.message || 'Gemini API limit or error',
    });
  }
});

// ==========================================
// CLOUD SQL DATABASE ENDPOINTS & MULTI-USER SYNC
// ==========================================

// Get Full Central Portal Database for all users
app.get('/api/database', async (req, res) => {
  try {
    const result = await getPortalDatabaseFromDB();
    if (!result) {
      return res.json({
        exists: false,
        data: null,
        version: 'initial',
        message: 'No custom database saved in Cloud SQL yet',
      });
    }
    return res.json({
      exists: true,
      data: result.data,
      version: result.version,
      updatedAt: result.updatedAt,
      updatedBy: result.updatedBy,
    });
  } catch (error: any) {
    console.error('Error fetching portal database from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch database' });
  }
});

// Save or Update Full Central Portal Database (Called when Admin updates any links/data)
app.post('/api/database', async (req, res) => {
  try {
    const { database, updatedBy, notification } = req.body;
    if (!database) {
      return res.status(400).json({ error: 'Database payload is required' });
    }

    const saveResult = await savePortalDatabaseToDB(
      database,
      updatedBy || 'Admin',
      notification
    );

    return res.json({
      success: true,
      message: 'Portal database successfully saved in Cloud SQL and broadcasted to all users.',
      version: saveResult.record.version,
      updatedAt: saveResult.record.updatedAt,
      notification: saveResult.notification,
    });
  } catch (error: any) {
    console.error('Error saving portal database to Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to save database' });
  }
});

// Seed or Reset to Official Live RRB Records in Cloud SQL
app.post('/api/database/seed-official', async (req, res) => {
  try {
    const { DEFAULT_OFFICIAL_PORTAL_DATABASE } = await import('./src/data/defaultData.ts');
    const saveResult = await savePortalDatabaseToDB(
      DEFAULT_OFFICIAL_PORTAL_DATABASE,
      'System (Official Seed)',
      {
        title: '🚂 Official Railway Records Initialized',
        message: 'All CEN exams, cut-offs, circulars, and candidate links are live in Cloud SQL database.',
        category: 'notice',
        targetTab: 'home',
      }
    );

    return res.json({
      success: true,
      message: 'Official RRB records successfully seeded in Cloud SQL database.',
      version: saveResult.record.version,
      updatedAt: saveResult.record.updatedAt,
      data: DEFAULT_OFFICIAL_PORTAL_DATABASE,
    });
  } catch (error: any) {
    console.error('Error seeding official database to Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to seed database' });
  }
});

// Fast Status / Version Check for Live Polling across all connected users
app.get('/api/database/status', async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    return res.json(status);
  } catch (error: any) {
    return res.json({
      version: 'initial',
      updatedAt: null,
      updatedBy: 'System',
      latestNotification: null,
    });
  }
});

// Fetch Live Broadcast Notifications
app.get('/api/database/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 15;
    const notifications = await getLiveNotifications(limit);
    return res.json({ success: true, notifications });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// Create Manual Admin Notification Broadcast
app.post('/api/database/notify', async (req, res) => {
  try {
    const { title, message, category, targetTab, linkUrl } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    const notif = await createLiveNotificationRecord(title, message, category, targetTab, linkUrl);
    return res.json({ success: true, notification: notif });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to broadcast notification' });
  }
});

// ==========================================
// ADMIN AUTHENTICATION & CREDENTIALS (POSTGRESQL CLOUD SQL)
// ==========================================

// Helper for salted hash verification
function verifyAdminHash(plain: string, expectedHash: string): boolean {
  if (!plain || !expectedHash) return false;
  let hash = 5381;
  const salted = plain + '_rrb_secure_key_2025';
  for (let i = 0; i < salted.length; i++) {
    hash = (hash * 33) ^ salted.charCodeAt(i);
  }
  const fastH = (hash >>> 0).toString(16);
  if (fastH === expectedHash) return true;

  const cryptoH = crypto.createHash('sha256').update(plain + '_rrb_salt_2025').digest('hex');
  return cryptoH === expectedHash;
}

function computeAdminHash(plain: string): string {
  let hash = 5381;
  const salted = plain + '_rrb_secure_key_2025';
  for (let i = 0; i < salted.length; i++) {
    hash = (hash * 33) ^ salted.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

const MASTER_AUTHORIZED_IDS = ['maan841', 'ymaan841@gmail.com', 'maansinghyadav095@gmail.com', '6393445097', 'admin'];
const DEFAULT_PASSWORDS = ['Maan@1220', 'maan@1220', 'rrbadmin2025'];

// Admin Authentication Status & Config backed by Cloud SQL
app.get('/api/admin/auth-status', async (req, res) => {
  try {
    const config = await getAdminAuthConfigFromDB();
    return res.json({
      success: true,
      hasCustomCredentials: Boolean(config),
      adminId: config?.adminId || 'Maan841',
      email: config?.email || 'ymaan841@gmail.com',
      mobile: config?.mobile || '6393445097',
      lastLogin: config?.lastLogin || null,
      updatedAt: config?.updatedAt || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch admin auth status' });
  }
});

// Admin Login Route (Verifies against Cloud SQL)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { adminId, password } = req.body;
    if (!adminId || !password) {
      return res.status(400).json({ success: false, error: 'Admin ID and Password are required' });
    }

    const cleanInputId = String(adminId).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // Check Cloud SQL database for stored custom credentials
    const storedConfig = await getAdminAuthConfigFromDB();

    let isAuthenticated = false;
    let effectiveAdminId = 'Maan841';
    let effectiveEmail = 'ymaan841@gmail.com';
    let effectiveMobile = '6393445097';

    if (storedConfig && storedConfig.passwordHash) {
      const storedIdLower = String(storedConfig.adminId).trim().toLowerCase();
      const idMatches = (cleanInputId === storedIdLower) ||
                        (storedConfig.email && cleanInputId === storedConfig.email.toLowerCase()) ||
                        (storedConfig.mobile && cleanInputId === storedConfig.mobile) ||
                        MASTER_AUTHORIZED_IDS.includes(cleanInputId);

      if (idMatches && verifyAdminHash(cleanPass, storedConfig.passwordHash)) {
        isAuthenticated = true;
        effectiveAdminId = storedConfig.adminId;
        effectiveEmail = storedConfig.email || effectiveEmail;
        effectiveMobile = storedConfig.mobile || effectiveMobile;
      }
    }

    // Also verify against master default credentials
    if (!isAuthenticated) {
      const isMasterId = MASTER_AUTHORIZED_IDS.includes(cleanInputId);
      const isMasterPass = DEFAULT_PASSWORDS.includes(cleanPass);
      if (isMasterId && isMasterPass) {
        isAuthenticated = true;
        effectiveAdminId = storedConfig?.adminId || 'Maan841';
        effectiveEmail = storedConfig?.email || 'ymaan841@gmail.com';
        effectiveMobile = storedConfig?.mobile || '6393445097';
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({ success: false, error: 'Invalid Administrator ID or Password' });
    }

    // Update lastLogin in Cloud SQL
    const nowIso = new Date().toISOString();
    const updatedConfig = {
      adminId: effectiveAdminId,
      passwordHash: storedConfig?.passwordHash || computeAdminHash('Maan@1220'),
      email: effectiveEmail,
      mobile: effectiveMobile,
      lastLogin: nowIso,
      updatedAt: storedConfig?.updatedAt || nowIso,
    };
    await saveAdminAuthConfigToDB(updatedConfig);

    const token = 'rrb_adm_' + crypto.randomBytes(24).toString('hex');

    return res.json({
      success: true,
      token,
      admin: {
        adminId: effectiveAdminId,
        email: effectiveEmail,
        mobile: effectiveMobile,
        lastLogin: nowIso,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Login failed' });
  }
});

// Admin Update Credentials in Cloud SQL (Available to all admin sessions across devices)
app.post('/api/admin/update-credentials', async (req, res) => {
  try {
    const { currentPassword, newAdminId, newPassword, newEmail, newMobile } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is required to authorize changes' });
    }

    const storedConfig = await getAdminAuthConfigFromDB();
    let isCurrentPassValid = false;

    if (storedConfig && storedConfig.passwordHash) {
      isCurrentPassValid = verifyAdminHash(currentPassword, storedConfig.passwordHash);
    }
    if (!isCurrentPassValid && DEFAULT_PASSWORDS.includes(currentPassword.trim())) {
      isCurrentPassValid = true;
    }

    if (!isCurrentPassValid) {
      return res.status(403).json({ success: false, error: 'Current password verification failed' });
    }

    const effectiveNewId = (newAdminId && String(newAdminId).trim()) || storedConfig?.adminId || 'Maan841';
    const effectiveNewPass = (newPassword && String(newPassword).trim()) ? newPassword.trim() : null;
    const newHash = effectiveNewPass ? computeAdminHash(effectiveNewPass) : (storedConfig?.passwordHash || computeAdminHash('Maan@1220'));

    const updatedConfig = {
      adminId: effectiveNewId,
      passwordHash: newHash,
      email: (newEmail && String(newEmail).trim()) || storedConfig?.email || 'ymaan841@gmail.com',
      mobile: (newMobile && String(newMobile).trim()) || storedConfig?.mobile || '6393445097',
      lastLogin: storedConfig?.lastLogin || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveAdminAuthConfigToDB(updatedConfig);

    return res.json({
      success: true,
      message: 'Admin credentials saved to PostgreSQL Cloud SQL successfully across all devices',
      admin: {
        adminId: updatedConfig.adminId,
        email: updatedConfig.email,
        mobile: updatedConfig.mobile,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to update admin credentials' });
  }
});

// Admin Reset Credentials to Default in Cloud SQL
app.post('/api/admin/reset-credentials', async (req, res) => {
  try {
    const defaultConfig = {
      adminId: 'Maan841',
      passwordHash: computeAdminHash('Maan@1220'),
      email: 'ymaan841@gmail.com',
      mobile: '6393445097',
      updatedAt: new Date().toISOString(),
    };
    await saveAdminAuthConfigToDB(defaultConfig);
    return res.json({ success: true, message: 'Admin credentials reset to default in PostgreSQL Cloud SQL' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to reset credentials' });
  }
});

// Synchronize authenticated user to Cloud SQL
app.post('/api/db/sync-user', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || req.body.email;
    const displayName = req.body.displayName || req.user?.name;
    const photoURL = req.body.photoURL || req.user?.picture;

    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and Email are required' });
    }

    const userRecord = await getOrCreateUser(uid, email, displayName, photoURL);
    return res.json({ success: true, user: userRecord });
  } catch (error: any) {
    console.error('Error syncing user with Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Record Google Form export in Cloud SQL
app.post('/api/db/export-form', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await getUserByUid(uid);
    if (!user) {
      return res.status(404).json({ error: 'User record not found in database' });
    }

    const { formId, formTitle, formUrl, formType } = req.body;
    if (!formId || !formTitle || !formUrl) {
      return res.status(400).json({ error: 'Missing formId, formTitle, or formUrl' });
    }

    const record = await recordFormExport(user.id, formId, formTitle, formUrl, formType);
    return res.json({ success: true, record });
  } catch (error: any) {
    console.error('Error saving form export to Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to save form export' });
  }
});

// Record Google Sheet export in Cloud SQL
app.post('/api/db/export-sheet', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await getUserByUid(uid);
    if (!user) {
      return res.status(404).json({ error: 'User record not found in database' });
    }

    const { sheetId, sheetTitle, sheetUrl, rowCount, exportType } = req.body;
    if (!sheetId || !sheetTitle || !sheetUrl) {
      return res.status(400).json({ error: 'Missing sheetId, sheetTitle, or sheetUrl' });
    }

    const record = await recordSheetExport(user.id, sheetId, sheetTitle, sheetUrl, rowCount || 0, exportType);
    return res.json({ success: true, record });
  } catch (error: any) {
    console.error('Error saving sheet export to Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to save sheet export' });
  }
});

// Fetch user's saved exports from Cloud SQL
app.get('/api/db/user-exports', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await getUserByUid(uid);
    if (!user) {
      return res.json({ forms: [], sheets: [] });
    }

    const [forms, sheets] = await Promise.all([
      getFormExports(user.id),
      getSheetExports(user.id),
    ]);

    return res.json({ forms, sheets });
  } catch (error: any) {
    console.error('Error fetching exports from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch user exports' });
  }
});

// Submit Candidate Feedback / Query into Cloud SQL
app.post('/api/db/feedback', async (req, res) => {
  try {
    const { candidateName, rollNumber, examName, zone, feedbackText, rating } = req.body;
    if (!candidateName || !examName || !zone || !feedbackText) {
      return res.status(400).json({ error: 'Missing required feedback fields' });
    }

    const record = await recordCandidateFeedback({
      candidateName,
      rollNumber,
      examName,
      zone,
      feedbackText,
      rating: Number(rating) || 5,
    });

    return res.json({ success: true, record });
  } catch (error: any) {
    console.error('Error logging feedback to Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to record feedback' });
  }
});

// Fetch Feedback list from Cloud SQL
app.get('/api/db/feedback', async (req, res) => {
  try {
    const list = await getAllFeedback();
    return res.json({ success: true, feedback: list });
  } catch (error: any) {
    console.error('Error fetching feedback from Cloud SQL:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch feedback' });
  }
});

// Cloud SQL Database health and statistics
app.get('/api/db/stats', async (req, res) => {
  try {
    const stats = await getDbStats();
    return res.json({
      success: true,
      cloudSql: {
        engine: 'PostgreSQL 16 (Cloud SQL Developer Edition)',
        region: 'asia-southeast1',
        projectId: 'rare-cargo-jlcf1',
        ...stats,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch DB stats',
    });
  }
});

// ==========================================
// 🛡️ AUTONOMOUS SYSTEM MONITOR & SELF-HEALING API
// ==========================================

// Get real-time health diagnostics & repair logs
app.get('/api/system-monitor/status', async (req, res) => {
  try {
    const report = await runSystemDiagnosticsAndAutoHeal();
    return res.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('System monitor diagnostic check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to run system diagnostics',
    });
  }
});

// Trigger Instant Deep Diagnostics & Self-Healing Auto-Repair
app.post('/api/system-monitor/run-repair', async (req, res) => {
  try {
    console.log('🛡️ Manual trigger: Deep System Diagnostics & Self-Healing executing...');
    const report = await runSystemDiagnosticsAndAutoHeal();
    return res.json({
      success: true,
      message: 'Autonomous Self-Healing and diagnostics completed successfully.',
      report,
    });
  } catch (error: any) {
    console.error('System monitor auto-repair error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to run auto-repair',
    });
  }
});

// Simulate test issue to verify self-healing behavior
app.post('/api/system-monitor/simulate-issue', async (req, res) => {
  try {
    const simulationResult = await simulateIssueAndVerifyAutoHeal();
    return res.json({
      success: true,
      message: 'Simulated issue detected and automatically repaired by watchdog.',
      ...simulationResult,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to simulate test issue',
    });
  }
});

// Toggle watchdog state
app.post('/api/system-monitor/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const active = toggleAutoMonitorWatchdog(enabled);
    return res.json({
      success: true,
      watchdogActive: active,
      message: `Autonomous Watchdog is now ${active ? 'ACTIVE' : 'PAUSED'}`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Background Auto-Sync Scheduler
function initRRBAutoSyncScheduler() {
  console.log('🔄 Initializing RRB Official Gateway Auto-Sync Scheduler...');
  
  // Run initial sync after 3 seconds on server boot
  setTimeout(async () => {
    try {
      const settings = await getRRBSyncSettings();
      if (settings.autoSyncEnabled) {
        console.log('🚀 Running initial boot sync with https://rrb.indianrailways.gov.in/...');
        await runRRBAutoSyncRoutine();
      }
    } catch (err) {
      console.warn('Initial RRB auto-sync boot notice:', err);
    }
  }, 3000);

  // Periodic check every 30 seconds for the 10-minute auto-sync schedule
  setInterval(async () => {
    try {
      const settings = await getRRBSyncSettings();
      if (!settings.autoSyncEnabled) return;

      const now = Date.now();
      const nextSyncTime = settings.nextSyncAt ? new Date(settings.nextSyncAt).getTime() : 0;

      if (now >= nextSyncTime) {
        console.log('⏰ Scheduled auto-sync triggered for https://rrb.indianrailways.gov.in/ (10-minute cycle)');
        await runRRBAutoSyncRoutine();
      }
    } catch (err) {
      console.warn('Periodic auto-sync cycle error:', err);
    }
  }, 30 * 1000);
}

// Autonomous System Monitor & Self-Healing Watchdog (Checks & Repairs Every 30s)
function initSystemAutoMonitorWatchdog() {
  console.log('🛡️ Initializing Autonomous Self-Healing Auto-Monitor Watchdog...');
  
  // Initial check 5s after boot
  setTimeout(async () => {
    try {
      const report = await runSystemDiagnosticsAndAutoHeal();
      console.log(`🛡️ Initial Auto-Monitor Check: Health Score ${report.healthScore}%, State: ${report.overallState}`);
    } catch (err) {
      console.warn('Initial auto-monitor boot check notice:', err);
    }
  }, 5000);

  // Watchdog loop running every 30 seconds
  setInterval(async () => {
    try {
      const summary = getAutoMonitorSummary();
      if (!summary.watchdogActive) return;
      await runSystemDiagnosticsAndAutoHeal();
    } catch (err) {
      console.warn('Watchdog periodic check notice:', err);
    }
  }, 30 * 1000);
}

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RRB Smart Portal Server running on http://0.0.0.0:${PORT}`);
    initRRBAutoSyncScheduler();
    initSystemAutoMonitorWatchdog();
  });
}

startServer();
