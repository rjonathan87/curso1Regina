// POST /api/progress
// Body: { userId, checklistId, checked, totalItems }
// Actualiza el ítem marcado/desmarcado de un usuario.

'use strict';

const { Redis } = require('@upstash/redis');

const kv = Redis.fromEnv();

const sanitize = (str, max) => String(str || '').trim().slice(0, max);

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

  const prog = await kv.get(`progress:${userId}`);
  if (!prog) return res.status(404).json({ error: 'Usuario no encontrado.' });

  prog.progress[checklistId] = { checked, updatedAt: new Date().toISOString() };

  const completedCount  = Object.values(prog.progress).filter(p => p.checked).length;
  const percentComplete = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  prog.completedCount  = completedCount;
  prog.percentComplete = percentComplete;
  prog.lastActivity    = new Date().toISOString();

  await kv.set(`progress:${userId}`, prog);

  // Actualizar lastActivity en el registro del usuario
  const user = await kv.get(`user:${userId}`);
  if (user) {
    user.lastActivity = prog.lastActivity;
    await kv.set(`user:${userId}`, user);
  }

  return res.status(200).json({ ok: true, completedCount, percentComplete });
};
