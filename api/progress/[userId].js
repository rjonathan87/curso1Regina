// GET /api/progress/:userId
// Devuelve el progreso completo de un usuario.

'use strict';

const { Redis } = require('@upstash/redis');

const kv = Redis.fromEnv();

const sanitize = (str, max) => String(str || '').trim().slice(0, max);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Método no permitido.' });

  const userId = sanitize(req.query.userId, 36);
  if (!/^[0-9a-f-]{36}$/.test(userId)) return res.status(400).json({ error: 'userId inválido.' });

  const prog = await kv.get(`progress:${userId}`);
  if (!prog) return res.status(404).json({ error: 'Usuario no encontrado.' });

  return res.status(200).json(prog);
};
