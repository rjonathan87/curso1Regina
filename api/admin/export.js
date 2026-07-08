// GET /api/admin/export?token=TU_TOKEN_SECRETO
// Devuelve un CSV con el progreso de todos los usuarios.
// Protegido por token — solo el administrador puede acceder.
//
// En producción (Vercel) usa Upstash Redis via KV_* env vars.
// En local sin Redis configurado, usa archivos JSON (server/data/).

'use strict';

const USE_REDIS = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

let kv, path, fs, DATA_DIR, USERS_FILE, PROGRESS_DIR;

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
  DATA_DIR     = path.join(__dirname, '..', '..', 'server', 'data');
  USERS_FILE   = path.join(DATA_DIR, 'users.json');
  PROGRESS_DIR = path.join(DATA_DIR, 'progress');
}
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

const ALL_IDS = [
  'f0-1-1','f0-1-2','f0-1-3','f0-1-4','f0-1-5','f0-1-6',
  'f0-2-1','f0-2-2','f0-2-3','f0-2-4',
  'u1-1-1','u1-1-2','u1-1-3','u1-1-4',
  'u1-2-1','u1-2-2','u1-2-3',
  'u1-3-1','u1-3-2','u1-3-3',
  'u1-4-1','u1-4-2','u1-4-3','u1-4-4',
  // Unidad 2 · Lógica y Programación
  'u2-1-1','u2-1-2','u2-1-3','u2-1-4',
  'u2-2-1','u2-2-2','u2-2-3','u2-2-4',
  'u2-3-1','u2-3-2','u2-3-3','u2-3-4',
  'u3-1-1','u3-1-2','u3-1-3',
  'u3-2-1','u3-2-2','u3-2-3','u3-2-4',
  'u3-3-1','u3-3-2','u3-3-3',
  'u3-4-1','u3-4-2','u3-4-3','u3-4-4',
  'u3-5-1','u3-5-2','u3-5-3',
  'proy-1-1',
  'proy-2-1','proy-2-2',
  'proy-3-1','proy-3-2',
  'proy-4-1','proy-4-2','proy-4-3',
];

function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.query?.token || '';
  const adminToken = process.env.ADMIN_TOKEN || '';
  if (!adminToken || token !== adminToken) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  let users, progresses;

  if (USE_REDIS) {
    const r = getRedis();
    const ids = await r.lrange('users:ids', 0, -1) || [];
    if (ids.length === 0) return res.status(200).send('Sin usuarios registrados.');
    const userData = await Promise.all(ids.map(id => r.get(`user:${id}`)));
    users = userData.filter(Boolean);
    progresses = await Promise.all(ids.map(id => r.get(`progress:${id}`)));
  } else {
    initJSON();
    const db = readJSON(USERS_FILE);
    if (db.users.length === 0) return res.status(200).send('Sin usuarios registrados.');
    users = db.users;
    progresses = users.map(u => {
      const pfile = require('path').join(PROGRESS_DIR, `${u.id}.json`);
      return fs.existsSync(pfile) ? readJSON(pfile) : null;
    });
  }

  const headers = ['Nombre','Correo','Registrado','Última actividad','% Completado','Ítems completados',...ALL_IDS];

  const rows = progresses.filter(Boolean).map(p => {
    const itemCols = ALL_IDS.map(id => (p.progress?.[id]?.checked ? '1' : '0'));
    return [
      escapeCSV(p.name), escapeCSV(p.email),
      escapeCSV(p.registeredAt ? p.registeredAt.slice(0, 10) : ''),
      escapeCSV(p.lastActivity ? p.lastActivity.slice(0, 10) : ''),
      escapeCSV(p.percentComplete ?? 0),
      escapeCSV(p.completedCount ?? 0),
      ...itemCols,
    ].join(',');
  });

  const csv = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const fecha = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-curso-${fecha}.csv"`);
  return res.status(200).send('\uFEFF' + csv);
};
