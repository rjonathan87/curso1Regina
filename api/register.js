// POST /api/register
// Body: { name, email }
// Registra un usuario nuevo o devuelve el existente.
// Usa el mismo sistema de archivos JSON que server/server.js (server/data/).

'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR     = path.join(__dirname, '..', 'server', 'data');
const USERS_FILE   = path.join(DATA_DIR, 'users.json');
const PROGRESS_DIR = path.join(DATA_DIR, 'progress');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sanitize = (str, max) => String(str || '').trim().slice(0, max);

function initDataDirs() {
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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Método no permitido.' });

  initDataDirs();

  const email = sanitize(req.body?.email, 254).toLowerCase();
  const name  = sanitize(req.body?.name, 100);

  if (!email || !name)       return res.status(400).json({ error: 'Nombre y correo son requeridos.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'El correo electrónico no es válido.' });

  const db   = readJSON(USERS_FILE);
  let user   = db.users.find(u => u.email === email);
  let isNew  = false;

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

    // Crear archivo de progreso vacío para este usuario
    const progressFile = path.join(PROGRESS_DIR, `${user.id}.json`);
    writeJSON(progressFile, {
      userId:          user.id,
      email:           user.email,
      name:            user.name,
      registeredAt:    user.registeredAt,
      lastActivity:    user.registeredAt,
      completedCount:  0,
      percentComplete: 0,
      progress:        {},
    });
  }

  res.status(200).json({ userId: user.id, name: user.name, email: user.email, isNew });
};
