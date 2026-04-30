// POST /api/register
// Body: { name, email }
// Registra un usuario nuevo o devuelve el existente.

'use strict';

const { Redis } = require('@upstash/redis');
const crypto    = require('crypto');

const kv = Redis.fromEnv();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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

  const email = sanitize(req.body?.email, 254).toLowerCase();
  const name  = sanitize(req.body?.name, 100);

  if (!email || !name)       return res.status(400).json({ error: 'Nombre y correo son requeridos.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'El correo electrónico no es válido.' });

  // Revisar si el usuario ya existe (dedup por email)
  let userId = await kv.get(`user:email:${email}`);
  let isNew  = false;

  if (!userId) {
    isNew      = true;
    userId     = crypto.randomUUID();
    const now  = new Date().toISOString();
    const user = { id: userId, email, name, registeredAt: now, lastActivity: now };

    await kv.set(`user:email:${email}`, userId);
    await kv.set(`user:${userId}`, user);
    await kv.rpush('users:ids', userId);

    // Crear registro de progreso vacío
    await kv.set(`progress:${userId}`, {
      userId, email, name,
      registeredAt: now, lastActivity: now,
      completedCount: 0, percentComplete: 0,
      progress: {}
    });
  }

  const user = await kv.get(`user:${userId}`);
  return res.status(200).json({ userId, name: user.name, email: user.email, isNew });
};
