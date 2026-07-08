// POST /api/register
// Body: { name, email }
// Registra un usuario nuevo o devuelve el existente.
//
// En producción (Vercel) usa Upstash Redis via KV_* env vars.
// En local sin Redis configurado, usa archivos JSON (server/data/).

'use strict';

const crypto = require('crypto');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sanitize = (str, max) => String(str || '').trim().slice(0, max);

// ── Backend selector ──
// Si están las env vars de Vercel KV / Upstash, usa Redis.
// Si no, usa archivos JSON locales (compatible con server Express).
const USE_REDIS = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

let kv, path, fs, DATA_DIR, USERS_FILE, PROGRESS_DIR;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Redis helpers ──
function getRedis() {
  if (kv) return kv;
  const { Redis } = require('@upstash/redis');
  // Soporta tanto Vercel KV (KV_REST_*) como Upstash directo (UPSTASH_*)
  const url  = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  kv = new Redis({ url, token });
  return kv;
}

// ── JSON helpers (fallback local) ──
function initJSON() {
  if (DATA_DIR) return;
  path = require('path');
  fs   = require('fs');
  const baseDir = path.join(__dirname, '..', 'server', 'data');
  DATA_DIR     = baseDir;
  USERS_FILE   = path.join(baseDir, 'users.json');
  PROGRESS_DIR = path.join(baseDir, 'progress');
  if (!fs.existsSync(DATA_DIR))     fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROGRESS_DIR)) fs.mkdirSync(PROGRESS_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE))   fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Método no permitido.' });

  const email = sanitize(req.body?.email, 254).toLowerCase();
  const name  = sanitize(req.body?.name, 100);

  if (!email || !name)       return res.status(400).json({ error: 'Nombre y correo son requeridos.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'El correo electrónico no es válido.' });

  let userId, isNew = false, user;

  if (USE_REDIS) {
    // ── Ruta Redis (Vercel) ──
    const r = getRedis();
    userId = await r.get(`user:email:${email}`);
    if (!userId) {
      isNew   = true;
      userId  = crypto.randomUUID();
      const now = new Date().toISOString();
      user  = { id: userId, email, name, registeredAt: now, lastActivity: now };

      await r.set(`user:email:${email}`, userId);
      await r.set(`user:${userId}`, user);
      await r.rpush('users:ids', userId);

      await r.set(`progress:${userId}`, {
        userId, email, name,
        registeredAt: now, lastActivity: now,
        completedCount: 0, percentComplete: 0,
        progress: {},
      });
    } else {
      user = await r.get(`user:${userId}`);
    }
    return res.status(200).json({ userId, name: user.name, email: user.email, isNew });

  } else {
    // ── Ruta JSON local (desarrollo) ──
    initJSON();
    const db = readJSON(USERS_FILE);
    user = db.users.find(u => u.email === email);

    if (!user) {
      isNew = true;
      user  = {
        id:           crypto.randomUUID(),
        email,
        name,
        registeredAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };
      db.users.push(user);
      writeJSON(USERS_FILE, db);

      const progressFile = require('path').join(PROGRESS_DIR, `${user.id}.json`);
      writeJSON(progressFile, {
        userId: user.id, email: user.email, name: user.name,
        registeredAt: user.registeredAt, lastActivity: user.registeredAt,
        completedCount: 0, percentComplete: 0, progress: {},
      });
    }
    return res.status(200).json({ userId: user.id, name: user.name, email: user.email, isNew });
  }
};
