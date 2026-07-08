// GET /api/users
// Lista todos los usuarios registrados (para panel de seguimiento).
//
// En producción (Vercel) usa Upstash Redis via KV_* env vars.
// En local sin Redis configurado, usa archivos JSON (server/data/).

'use strict';

const USE_REDIS = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

let kv, path, fs, DATA_DIR, USERS_FILE, PROGRESS_DIR;

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
  if (DATA_DIR) return;
  path = require('path');
  fs   = require('fs');
  DATA_DIR     = path.join(__dirname, '..', 'server', 'data');
  USERS_FILE   = path.join(DATA_DIR, 'users.json');
  PROGRESS_DIR = path.join(DATA_DIR, 'progress');
}
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Método no permitido.' });

  if (USE_REDIS) {
    const r = getRedis();
    const ids   = await r.lrange('users:ids', 0, -1) || [];
    const users = await Promise.all(ids.map(id => r.get(`user:${id}`)));
    return res.status(200).json({ users: users.filter(Boolean) });
  } else {
    initJSON();
    const db = readJSON(USERS_FILE);
    const users = db.users.map(u => {
      const pfile = require('path').join(PROGRESS_DIR, `${u.id}.json`);
      let progress = null;
      if (fs.existsSync(pfile)) progress = readJSON(pfile);
      return { ...u, progress };
    });
    return res.status(200).json({ users });
  }
};
