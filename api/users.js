// GET /api/users
// Lista todos los usuarios registrados (para panel de seguimiento).

'use strict';

const { Redis } = require('@upstash/redis');

const kv = Redis.fromEnv();

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Método no permitido.' });

  const ids   = await kv.lrange('users:ids', 0, -1) || [];
  const users = await Promise.all(ids.map(id => kv.get(`user:${id}`)));

  return res.status(200).json({ users: users.filter(Boolean) });
};
