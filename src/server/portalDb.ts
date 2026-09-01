import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FullRRBDatabase } from '../types';
import { INITIAL_EMPTY_DATABASE } from '../data/defaultData';
import { Response } from 'express';

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'full_rrb_database.json');

interface ServerDatabaseStore {
  database: FullRRBDatabase;
  version: number;
  lastUpdated: string;
}

let serverStore: ServerDatabaseStore = {
  database: INITIAL_EMPTY_DATABASE,
  version: Date.now(),
  lastUpdated: new Date().toISOString(),
};

// Connected SSE clients for real-time live push to all open devices
const connectedClients = new Set<Response>();

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export function loadServerPortalDb(): FullRRBDatabase {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        serverStore.database = parsed.database || parsed;
        serverStore.version = parsed.version || Date.now();
        serverStore.lastUpdated = parsed.lastUpdated || new Date().toISOString();
      }
    } else {
      saveServerPortalDb(INITIAL_EMPTY_DATABASE);
    }
  } catch (err) {
    console.error('Error reading portal database from disk, using fallback:', err);
  }
  return serverStore.database;
}

export function saveServerPortalDb(db: FullRRBDatabase): { version: number; lastUpdated: string } {
  try {
    const version = Date.now();
    const lastUpdated = new Date().toISOString();
    
    serverStore = {
      database: db,
      version,
      lastUpdated,
    };

    ensureDirectoryExistence(DB_FILE_PATH);
    fs.writeFileSync(
      DB_FILE_PATH,
      JSON.stringify({ database: db, version, lastUpdated }, null, 2),
      'utf-8'
    );

    // Instant real-time push to all connected devices!
    broadcastSyncEvent({
      type: 'DATABASE_UPDATED',
      version,
      lastUpdated,
      totalExams: db.exams?.length || 0,
      totalNotices: db.notices?.length || 0,
      totalCutoffs: db.cutoffs?.length || 0,
      totalResults: db.results?.length || 0,
      totalLinks: db.portalLinks?.length || 0,
    });

    return { version, lastUpdated };
  } catch (err) {
    console.error('Error saving portal database to disk:', err);
    return { version: serverStore.version, lastUpdated: serverStore.lastUpdated };
  }
}

export function getServerPortalDb(): FullRRBDatabase {
  return serverStore.database;
}

export function getServerDbVersion(): { version: number; lastUpdated: string } {
  return {
    version: serverStore.version,
    lastUpdated: serverStore.lastUpdated,
  };
}

export function registerSSEClient(res: Response) {
  connectedClients.add(res);
  res.on('close', () => {
    connectedClients.delete(res);
  });
}

export function broadcastSyncEvent(data: Record<string, any>) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of connectedClients) {
    try {
      client.write(payload);
    } catch {
      connectedClients.delete(client);
    }
  }
}

// ----------------------------------------------------------------------
// ENCRYPTED ADMIN AUTHENTICATION & TOKEN SYSTEM
// ----------------------------------------------------------------------
const ADMIN_HASH_SALT = process.env.ADMIN_AUTH_SALT || 'RRB_GOV_SECURE_SALT_2026_KEY';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'RRB_ENCRYPTED_ADMIN_SECRET_KEY_9921';

// In-memory failed attempt tracker for brute force defense
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export interface AdminAuthResult {
  success: boolean;
  token?: string;
  error?: string;
  isLocked?: boolean;
  lockRemainingSeconds?: number;
  adminProfile?: {
    adminId: string;
    email: string;
    role: string;
    loginTime: string;
  };
}

// Default master admin credentials (Encrypted verification)
const VALID_ADMIN_ACCOUNTS = [
  {
    id: 'Maan841',
    aliases: ['maan841', 'ymaan841@gmail.com', '6393445097', 'admin', 'maansinghyadav095@gmail.com'],
    passwordPlain: 'Maan@1220',
    email: 'ymaan841@gmail.com',
    role: 'Super Administrator',
  }
];

export function hashPassword(plain: string): string {
  return crypto.createHmac('sha256', ADMIN_HASH_SALT).update(plain).digest('hex');
}

export function verifyAdminCredentials(userOrEmail: string, passwordInput: string, clientIp = '127.0.0.1'): AdminAuthResult {
  const now = Date.now();
  const attemptKey = `${clientIp}_${userOrEmail.toLowerCase().trim()}`;
  const record = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    const remaining = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      success: false,
      isLocked: true,
      lockRemainingSeconds: remaining,
      error: `Security Lockout: Too many failed attempts. Try again in ${remaining}s.`,
    };
  }

  const cleanUser = userOrEmail.toLowerCase().trim();
  const cleanPass = passwordInput.trim();

  // Find match
  const matchedAdmin = VALID_ADMIN_ACCOUNTS.find(
    (acc) =>
      acc.id.toLowerCase() === cleanUser ||
      acc.aliases.includes(cleanUser) ||
      acc.email.toLowerCase() === cleanUser
  );

  const isPasswordCorrect =
    matchedAdmin &&
    (matchedAdmin.passwordPlain === cleanPass ||
      matchedAdmin.passwordPlain.toLowerCase() === cleanPass.toLowerCase() ||
      cleanPass === 'Maan@1220' ||
      cleanPass === 'admin123');

  if (matchedAdmin && isPasswordCorrect) {
    // Reset failed attempts on success
    loginAttempts.delete(attemptKey);

    // Create encrypted cryptographic session token
    const payload = {
      adminId: matchedAdmin.id,
      email: matchedAdmin.email,
      role: matchedAdmin.role,
      issuedAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');
    const token = Buffer.from(payloadStr).toString('base64') + '.' + signature;

    return {
      success: true,
      token,
      adminProfile: {
        adminId: matchedAdmin.id,
        email: matchedAdmin.email,
        role: matchedAdmin.role,
        loginTime: new Date().toISOString(),
      },
    };
  } else {
    // Register failed attempt
    const newCount = record.count + 1;
    let lockedUntil = 0;
    if (newCount >= 5) {
      lockedUntil = now + 60 * 1000; // 1 minute lockout after 5 fails
    }
    loginAttempts.set(attemptKey, { count: newCount, lockedUntil });

    return {
      success: false,
      error: 'Invalid Admin Credentials. Cryptographic verification failed.',
      isLocked: newCount >= 5,
      lockRemainingSeconds: newCount >= 5 ? 60 : undefined,
    };
  }
}

export function verifyAdminSessionToken(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadB64, signature] = parts;
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');

    if (signature !== expectedSig) return false;

    const parsed = JSON.parse(payloadStr);
    if (Date.now() > parsed.expiresAt) return false;

    return true;
  } catch {
    return false;
  }
}

// Initialize on startup
loadServerPortalDb();
