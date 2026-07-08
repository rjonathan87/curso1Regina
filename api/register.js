'use strict';

// ===== API DE REGISTRO - Curso Informática Regina =====
//
// En Vercel (serverless): registra usuario con Upstash Redis via KV_* env vars.
// Si no hay Redis configurado, usa memoria volátil (solo lectura, sin persistencia).
// El registro principal se hace desde el frontend con localStorage.
//
// Esta API SOLO se usa para:
// 1. Consultar usuarios existentes (panel admin GET /api/users)
// 2. Exportar progreso (GET /api/admin/export)
// 3. El registro real se maneja 100% desde app.js con localStorage

const crypto = require('crypto');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sanitize = (str, max) => String(str || '').trim().slice(0, max);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const email = sanitize(req.body?.email, 254).toLowerCase();
  const name  = sanitize(req.body?.name, 100);

  if (!email || !name)       return res.status(400).json({ error: 'Nombre y correo son requeridos.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'El correo electrónico no es válido.' });

  // El frontend genera su propio userId y lo guarda en localStorage.
  // Si llega hasta acá, generamos uno y lo devolvemos.
  const userId = crypto.randomUUID();
  const now    = new Date().toISOString();

  // Intentar persistir con Upstash Redis si está configurado
  const USE_REDIS = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

  if (USE_REDIS) {
    try {
      const { Redis } = require('@upstash/redis');
      const url   = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
      const kv    = new Redis({ url, token });

      // Solo intentar guardar si no existe ya (idempotente por email)
      const existingId = await kv.get(`user:email:${email}`);
      if (existingId) {
        const existing = await kv.get(`user:${existingId}`);
        if (existing) {
          return res.status(200).json({
            userId: existingId,
            name: existing.name,
            email: existing.email,
            isNew: false
          });
        }
      }

      await kv.set(`user:email:${email}`, userId);
      await kv.set(`user:${userId}`, { id: userId, email, name, registeredAt: now, lastActivity: now });
      await kv.rpush('users:ids', userId);
      await kv.set(`progress:${userId}`, {
        userId, email, name,
        registeredAt: now, lastActivity: now,
        completedCount: 0, percentComplete: 0,
        progress: {}
      });

      return res.status(200).json({ userId, name, email, isNew: true });
    } catch (err) {
      // Si Redis falla, devolvemos el userId generado y el frontend usa localStorage
      console.error('Redis error:', err.message);
    }
  }

  // Fallback: sin persistencia, pero devolvemos un userId válido
  // El frontend guarda todo en localStorage de todas formas
  return res.status(200).json({ userId, name, email, isNew: true });
};
