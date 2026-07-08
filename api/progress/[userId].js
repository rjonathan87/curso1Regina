// GET /api/progress/:userId
// Devuelve el progreso completo de un usuario.
//
// En producción (Vercel) usa Upstash Redis via KV_* env vars.
// En local sin Redis configurado, usa archivos JSON (server/data/).

'use strict';

const sanitize = (str, max) => String(str || '').trim().slice(0, max);

const USE_REDIS = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

let kv, path, fs, PROGRESS_DIR;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
  if (PROGRESS_DIR) return;
  path = require('path');
  fs   = require('fs');
  PROGRESS_DIR = path.join(__dirname, '..', '..', 'server', 'data', 'progress');
  if (!fs.existsSync(PROGRESS_DIR)) fs.mkdirSync(PROGRESS_DIR, { recursive: true });
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Método no permitido.' });

  const userId = sanitize(req.query.userId, 36);
  if (!/^[0-9a-f-]{36}$/.test(userId)) return res.status(400).json({ error: 'userId inválido.' });

  if (USE_REDIS) {
    const r = getRedis();
    const prog = await r.get(`progress:${userId}`);
    if (!prog) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.status(200).json(prog);
  } else {
    initJSON();
    const progressFile = require('path').join(PROGRESS_DIR, `${userId}.json`);
    if (!fs.existsSync(progressFile)) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.status(200).json(JSON.parse(fs.readFileSync(progressFile, 'utf8')));
  }
};
