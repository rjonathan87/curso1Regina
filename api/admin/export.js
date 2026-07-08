// GET /api/admin/export?token=TU_TOKEN_SECRETO
// Devuelve un CSV con el progreso de todos los usuarios.
// Protegido por token — solo el administrador puede acceder.
// Usa el mismo sistema de archivos JSON que server/server.js (server/data/).

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR     = path.join(__dirname, '..', '..', 'server', 'data');
const USERS_FILE   = path.join(DATA_DIR, 'users.json');
const PROGRESS_DIR = path.join(DATA_DIR, 'progress');

// Lista completa de ítems del curso (mismo orden que app.js)
const ALL_IDS = [
  'f0-1-1','f0-1-2','f0-1-3','f0-1-4','f0-1-5','f0-1-6',
  'f0-2-1','f0-2-2','f0-2-3','f0-2-4',
  'u1-1-1','u1-1-2','u1-1-3','u1-1-4',
  'u1-2-1','u1-2-2','u1-2-3',
  'u1-3-1','u1-3-2','u1-3-3',
  'u1-4-1','u1-4-2','u1-4-3','u1-4-4',
  'u2-1-1','u2-1-2','u2-1-3',
  'u2-2-1','u2-2-2','u2-2-3',
  'u2-3-1','u2-3-2','u2-3-3',
  'u2-4-1','u2-4-2','u2-4-3','u2-4-4',
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

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

module.exports = async function handler(req, res) {
  // Solo GET
  if (req.method !== 'GET') return res.status(405).end();

  // Verificar token
  const token = req.query?.token || '';
  const adminToken = process.env.ADMIN_TOKEN || '';
  if (!adminToken || token !== adminToken) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const db = readJSON(USERS_FILE);

  if (db.users.length === 0) {
    return res.status(200).send('Sin usuarios registrados.');
  }

  // Cargar progreso de cada usuario
  const progresses = db.users.map(u => {
    const progressFile = path.join(PROGRESS_DIR, `${u.id}.json`);
    if (fs.existsSync(progressFile)) {
      return readJSON(progressFile);
    }
    return null;
  }).filter(Boolean);

  // Construir CSV
  const headers = [
    'Nombre',
    'Correo',
    'Registrado',
    'Última actividad',
    '% Completado',
    'Ítems completados',
    ...ALL_IDS,
  ];

  const rows = progresses.map(p => {
    const itemCols = ALL_IDS.map(id => (p.progress?.[id]?.checked ? '1' : '0'));
    return [
      escapeCSV(p.name),
      escapeCSV(p.email),
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
  return res.status(200).send('\uFEFF' + csv); // BOM para que Excel abra UTF-8 correctamente
};
