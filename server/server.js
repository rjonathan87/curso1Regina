// ===== SERVIDOR DE TRAZABILIDAD - Curso Informática Regina =====
// Sirve los archivos estáticos del sitio Y gestiona la BD de usuarios/progreso.
// Ejecutar: node server.js  (desde la carpeta /server)
// El sitio estará en: http://localhost:3000

'use strict';

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Rutas de datos ──────────────────────────────────────────────────────────
const DATA_DIR     = path.join(__dirname, 'data');
const USERS_FILE   = path.join(DATA_DIR, 'users.json');
const PROGRESS_DIR = path.join(DATA_DIR, 'progress');

// Crear carpetas y archivo base si no existen
if (!fs.existsSync(DATA_DIR))     fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PROGRESS_DIR)) fs.mkdirSync(PROGRESS_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE))   fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));

// ── Middlewares ──────────────────────────────────────────────────────────────

// CORS — permite peticiones desde Live Server (puerto 5500) y otros orígenes locales
app.use((req, res, next) => {
  const allowed = ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'];
  const origin  = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10kb' }));

// Servir el sitio estático desde la carpeta padre (/curso1Regina)
app.use(express.static(path.join(__dirname, '..')));

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function sanitizeText(str, maxLen) {
  return String(str || '').trim().slice(0, maxLen);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── API: Registrar usuario ────────────────────────────────────────────────────
// POST /api/register
// Body: { email: string, name: string }
// Devuelve: { userId, name, email, isNew }
app.post('/api/register', (req, res) => {
  const email = sanitizeText(req.body.email, 254).toLowerCase();
  const name  = sanitizeText(req.body.name, 100);

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
      lastActivity: new Date().toISOString()
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
      progress:        {}   // { checklistId: { checked, updatedAt } }
    });
  }

  res.json({ userId: user.id, name: user.name, email: user.email, isNew });
});

// ── API: Actualizar progreso ──────────────────────────────────────────────────
// POST /api/progress
// Body: { userId: string, checklistId: string, checked: boolean, totalItems: number }
// Devuelve: { ok, completedCount, percentComplete }
app.post('/api/progress', (req, res) => {
  const userId      = sanitizeText(req.body.userId, 36);
  const checklistId = sanitizeText(req.body.checklistId, 60);
  const checked     = !!req.body.checked;
  const totalItems  = parseInt(req.body.totalItems, 10) || 0;

  if (!userId || !checklistId) return res.status(400).json({ error: 'userId y checklistId son requeridos.' });

  // Validar que userId tenga formato UUID básico (solo hex + guiones)
  if (!/^[0-9a-f\-]{36}$/.test(userId)) return res.status(400).json({ error: 'userId inválido.' });

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
  if (user) { user.lastActivity = prog.lastActivity; writeJSON(USERS_FILE, db); }

  res.json({ ok: true, completedCount, percentComplete });
});

// ── API: Obtener progreso de un usuario ───────────────────────────────────────
// GET /api/progress/:userId
app.get('/api/progress/:userId', (req, res) => {
  const userId = sanitizeText(req.params.userId, 36);
  if (!/^[0-9a-f\-]{36}$/.test(userId)) return res.status(400).json({ error: 'userId inválido.' });

  const progressFile = path.join(PROGRESS_DIR, `${userId}.json`);
  if (!fs.existsSync(progressFile)) return res.status(404).json({ error: 'Usuario no encontrado.' });

  res.json(readJSON(progressFile));
});

// ── API: Listar todos los usuarios (panel admin) ──────────────────────────────
// GET /api/users
app.get('/api/users', (req, res) => {
  res.json(readJSON(USERS_FILE));
});

// ── Inicio ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Servidor corriendo → http://localhost:${PORT}`);
  console.log(`   Datos guardados en: ${DATA_DIR}`);
});
