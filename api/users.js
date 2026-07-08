// GET /api/users
// Lista todos los usuarios registrados (para panel de seguimiento).
// Usa el mismo sistema de archivos JSON que server/server.js (server/data/).

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, '..', 'server', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROGRESS_DIR = path.join(DATA_DIR, 'progress');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Método no permitido.' });

  const db = readJSON(USERS_FILE);

  // Para compatibilidad: devolver también el progreso de cada usuario
  const users = db.users.map(u => {
    const progressFile = path.join(PROGRESS_DIR, `${u.id}.json`);
    let progress = null;
    if (fs.existsSync(progressFile)) {
      progress = readJSON(progressFile);
    }
    return { ...u, progress };
  });

  return res.status(200).json({ users });
};
