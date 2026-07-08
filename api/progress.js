// POST /api/progress
// Body: { userId, checklistId, checked, totalItems }
// Actualiza el ítem marcado/desmarcado de un usuario.
//
// En producción (Vercel) usa Upstash Redis via KV_* env vars.
// En local sin Redis configurado, usa archivos JSON (server/data/).

'use strict';

const sanitize = (str, max) => String(str || '').trim().slice(0, max);

const USE_REDIS = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

let kv, path, fs, DATA_DIR, USERS_FILE, PROGRESS_DIR;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getRedis() {
  if (kv) return kv;
  const { Redis } = require('@upstash/redis');
  const url  = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  kv = new Redis({ url, token });
  return kv;
}

function initJSON() {
  if (DATA_DIR) return;
  path = require('path');
  fs   = require('fs');
  DATA_DIR     = path.join(__dirname, '..', 'server', 'data');
  USERS_FILE   = path.join(DATA_DIR, 'users.json');
  PROGRESS_DIR = path.join(DATA_DIR, 'progress');
  if (!fs.existsSync(DATA_DIR))     fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROGRESS_DIR)) fs.mkdirSync(PROGRESS_DIR, { recursive: true });
}

function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Método no permitido.' });

  const userId      = sanitize(req.body?.userId, 36);
  const checklistId = sanitize(req.body?.checklistId, 60);
  const checked     = !!req.body?.checked;
  const totalItems  = parseInt(req.body?.totalItems, 10) || 0;

  if (!userId || !checklistId) return res.status(400).json({ error: 'userId y checklistId son requeridos.' });
  if (!/^[0-9a-f-]{36}$/.test(userId)) return res.status(400).json({ error: 'userId inválido.' });

  if (USE_REDIS) {
    // ── Ruta Redis ──
    const r = getRedis();
    const prog = await r.get(`progress:${userId}`);
    if (!prog) return res.status(404).json({ error: 'Usuario no encontrado.' });

    prog.progress[checklistId] = { checked, updatedAt: new Date().toISOString() };
    const completedCount  = Object.values(prog.progress).filter(p => p.checked).length;
    const percentComplete = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    prog.completedCount  = completedCount;
    prog.percentComplete = percentComplete;
    prog.lastActivity    = new Date().toISOString();

    await r.set(`progress:${userId}`, prog);

    const user = await r.get(`user:${userId}`);
    if (user) {
      user.lastActivity = prog.lastActivity;
      await r.set(`user:${userId}`, user);
    }

    return res.status(200).json({ ok: true, completedCount, percentComplete });

  } else {
    // ── Ruta JSON local ──
    initJSON();
    const progressFile = require('path').join(PROGRESS_DIR, `${userId}.json`);
    if (!fs.existsSync(progressFile)) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const prog = readJSON(progressFile);
    prog.progress[checklistId] = { checked, updatedAt: new Date().toISOString() };
    const completedCount  = Object.values(prog.progress).filter(p => p.checked).length;
    const percentComplete = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    prog.completedCount  = completedCount;
    prog.percentComplete = percentComplete;
    prog.lastActivity    = new Date().toISOString();
    writeJSON(progressFile, prog);

    const db   = readJSON(USERS_FILE);
    const user = db.users.find(u => u.id === userId);
    if (user) { user.lastActivity = prog.lastActivity; writeJSON(USERS_FILE, db); }

    return res.status(200).json({ ok: true, completedCount, percentComplete });
  }
};
