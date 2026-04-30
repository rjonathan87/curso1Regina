# Base de datos de usuarios y progreso

Esta carpeta es creada automáticamente por el servidor al arrancar.

## Estructura:
```
data/
├── users.json              ← registro maestro de todos los usuarios
└── progress/
    └── {userId}.json       ← progreso individual de cada usuario
```

## Ejemplo de users.json:
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "alumna@ejemplo.com",
      "name": "Regina",
      "registeredAt": "2026-04-29T10:00:00.000Z",
      "lastActivity": "2026-04-29T15:30:00.000Z"
    }
  ]
}
```

## Ejemplo de progress/{userId}.json:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alumna@ejemplo.com",
  "name": "Regina",
  "registeredAt": "2026-04-29T10:00:00.000Z",
  "lastActivity": "2026-04-29T15:30:00.000Z",
  "completedCount": 5,
  "percentComplete": 12,
  "progress": {
    "f0-1-1": { "checked": true,  "updatedAt": "2026-04-29T10:05:00.000Z" },
    "f0-1-2": { "checked": true,  "updatedAt": "2026-04-29T10:07:00.000Z" },
    "u1-1-1": { "checked": false, "updatedAt": "2026-04-29T15:30:00.000Z" }
  }
}
```
