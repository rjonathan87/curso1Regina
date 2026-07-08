// POST /api/progress
// Body: { userId, checklistId, checked, totalItems }
// Actualiza el ítem marcado/desmarcado de un usuario.
// Usa el mismo sistema de archivos JSON que server/server.js (server/data/).

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR     = path.join(__dirname, '..', 'server', 'data');
const USERS_FILE   = path.join(DATA_DIR, 'users.json');
const PROGRESS_DIR = path.join(DATA_DIR, 'progress');

const sanitize = (str, max) => String(str || '').trim().slice(0, max);

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

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

  const progressFile = path.join(PROGRESS_DIR, `${userId}.json`);
  if (!fs.existsSync(progressFile)) return res.status(404).json({ error: 'Usuario no encontrado.' });

  const prog = readJSON(progressFile);

  prog.progress[checklistId] = { checked, updatedAt: new Date().toISOString() };

  const completedCount  = Object.values(prog.progress).filter(p => p.checked).length;
  const percentComplete = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  prog.completedCount  = completedCount;
  prog.percentComplete = percentComplete;
  prog.lastActivity    = new Date().toISOString();

  writeJSON(progressFile, prog);

  // Actualizar lastActivity en users.json
  const db   = readJSON(USERS_FILE);
  const user = db.users.find(u => u.id === userId);
  if (user) {
    user.lastActivity = prog.lastActivity;
    writeJSON(USERS_FILE, db);
  }

  return res.status(200).json({ ok: true, completedCount, percentComplete });
};
