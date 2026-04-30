# Arquitectura del servidor y comunicación con la app

## El problema de Vercel (por qué no funciona Express ahí)

Vercel es una plataforma **serverless**. Esto significa dos cosas críticas:

1. **No hay servidor que "corra"** — no existe un proceso Express permanente escuchando peticiones. Cada request ejecuta una función pequeña que vive ~10 segundos y muere.
2. **El sistema de archivos es de solo lectura** — no se pueden crear ni modificar archivos en disco. Los JSON que guardaba `server/data/` no funcionan en Vercel.

Por eso hay dos entornos con arquitecturas distintas:

---

## Arquitectura local (desarrollo con Live Server)

```
Navegador en :5500
    │
    ├─── HTML/CSS/JS ──► Live Server (puerto 5500)
    │
    └─── fetch('/api/..') ──► Express (puerto 3000) ──► JSON en server/data/
```

- El sitio lo sirve Live Server (VS Code)
- La API la sirve el servidor Express (`server/server.js`)
- Los datos se guardan como archivos JSON en `server/data/`
- Para usarlo: `cd server && npm start`

---

## Arquitectura en Vercel (producción)

```
Navegador en curso1-regina.vercel.app
    │
    ├─── HTML/CSS/JS ──► Vercel CDN (archivos estáticos del repo)
    │
    └─── fetch('/api/..') ──► Vercel Functions (api/*.js) ──► Vercel KV (Redis)
```

- Los archivos estáticos (HTML/CSS/JS) los sirve Vercel directamente del repo
- Las rutas `/api/*` se convierten en **Serverless Functions** (archivos en `api/`)
- Los datos se guardan en **Vercel KV**, una base de datos Redis gratuita vinculada al proyecto

### ¿Cómo detecta Vercel qué es API y qué es estático?

Vercel lee la estructura del repositorio:
- Todo lo que esté en la carpeta `api/` → Serverless Function
- Todo lo demás (HTML, CSS, JS, imágenes) → archivo estático

No hace falta configurar nada más. Al hacer push a `main`, Vercel hace el deploy automáticamente.

---

## Rutas de la API

| Método | Ruta | Función |
|--------|------|---------|
| `POST` | `/api/register` | Registra un usuario nuevo (guarda nombre + email) |
| `POST` | `/api/progress` | Actualiza un ítem del checklist para un usuario |
| `GET`  | `/api/progress/:userId` | Devuelve el progreso completo de un usuario |
| `GET`  | `/api/users` | Lista todos los usuarios registrados |

---

## Estructura de datos en Vercel KV (Redis)

Cada clave en Redis almacena un valor JSON:

| Clave | Contenido |
|-------|-----------|
| `user:email:{email}` | `"uuid-del-usuario"` (para deduplicar por correo) |
| `user:{userId}` | `{ id, email, name, registeredAt, lastActivity }` |
| `users:ids` | Lista de todos los userId (usada para listarlos) |
| `progress:{userId}` | `{ userId, email, name, completedCount, percentComplete, progress: { checkId: { checked, updatedAt } } }` |

---

## Cómo configurar Upstash Redis (una sola vez)

> Vercel eliminó KV como producto propio. Ahora se usa **Upstash** desde el Marketplace, que es exactamente lo mismo por dentro.

1. Ir a [vercel.com/marketplace](https://vercel.com/marketplace?category=storage) → buscar **Upstash** → clic en **Add Integration**
2. En Upstash, crear una base de datos Redis → elegir la región más cercana (ej: `us-east-1`)
3. Volver a Vercel → en la integración de Upstash → vincular el proyecto `curso1-regina`
4. Vercel inyecta automáticamente las variables de entorno:

```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

El paquete `@upstash/redis` las lee automáticamente en producción. No hay que escribirlas en ningún archivo del repo.

---

## Cómo probar en local con el entorno de Vercel

Si quieres probar las Serverless Functions localmente (sin Live Server + Express):

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desde la raíz del proyecto, vincular con tu proyecto en Vercel
vercel link

# Descargar las variables de entorno (incluye las de Upstash)
vercel env pull .env.local

# Instalar dependencias del root
npm install

# Arrancar el entorno local de Vercel (simula funciones + estáticos)
vercel dev
# El sitio estará en http://localhost:3000
```

Con `vercel dev` no necesitas Live Server ni el servidor Express.

---

## Cuándo usar cada entorno

| Situación | Cómo correr |
|-----------|-------------|
| Desarrollo rápido de UI | Live Server + `cd server && npm start` |
| Probar la API exactamente como en producción | `vercel dev` (requiere `vercel link` y `.env.local`) |
| Producción | Push a `main` → Vercel hace deploy automático |

---

## Flujo completo de un usuario nuevo

```
1. Usuario abre el sitio
       │
2. app.js detecta que no hay userId en localStorage
       │
3. Aparece el modal → pide nombre + email
       │
4. POST /api/register  { name, email }
       │
5. Vercel Function (api/register.js) crea en KV:
   - user:email:{email} → userId
   - user:{userId}      → { id, name, email, ... }
   - progress:{userId}  → { progress: {}, completedCount: 0, ... }
       │
6. Respuesta: { userId, name, email, isNew: true }
       │
7. app.js guarda userId en localStorage
       │
8. Cada vez que marca un ítem del checklist:
   POST /api/progress { userId, checklistId, checked, totalItems }
       │
9. Vercel Function actualiza progress:{userId} en KV
       │
10. El JSON del usuario en KV queda actualizado con cada acción
```
