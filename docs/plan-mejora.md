# Plan de Mejora — Curso de Programación Regina v2

> **Objetivo:** Elevar el curso de "bueno" a "excelente" agregando las 3 carencias clave identificadas: puente Scratch→Python, debugging, y miniretos por unidad.
> **Basado en:** Análisis del curso completo tras implementar Unidades 2, 3, 4 y Proyecto Final.

---

## Diagnóstico Rápido

### ✅ El curso ya cubre
- Fundamentos: instrucciones, decisiones, bucles (U2)
- Python: variables, input, if/else, for, while, listas, funciones (U3)
- Scratch: eventos, condicionales, sensores, variables, clonación (U4)
- Proyecto integrador de 6 fases en Python
- Progreso con checklists, registro offline, glosario

### ❌ Lo que falta (3 mejoras)
| # | Mejora | Impacto |
|---|--------|---------|
| 1 | Puente Scratch ↔ Python | El estudiante no conecta los conceptos visuales con código real |
| 2 | Lección de debugging | Cuando algo falla, no sabe cómo encontrar el error → frustración |
| 3 | Miniretos por unidad | El que quiere más práctica no tiene ejercicios adicionales |

---

## Mejora 1: Puente Scratch → Python

> **Dónde:** Nueva sección al final de la Unidad 4 (después de Sesión 3, antes del entregable)
> **Duración:** Media sesión (lectura + práctica opcional)
> **Archivo a modificar:** `modules/unidad4.html`

### Contenido

#### Tabla comparativa visual (Scratch → Python)

| Concepto | Scratch | Python |
|----------|---------|--------|
| Inicio del programa | "al hacer clic en 🏴" | `while True:` o función main |
| Mostrar algo | "decir Hola por 2 segundos" | `print("Hola")` |
| Repetir para siempre | "por siempre" | `while True:` |
| Repetir N veces | "repetir 10" | `for i in range(10):` |
| Decisión | "si … entonces" | `if ... :` |
| Decisión con alternativas | "si … entonces … si no" | `if ... else ...` |
| Preguntar al usuario | "preguntar ¿Cómo te llamas? y esperar" | `input("¿Cómo te llamas? ")` |
| Guardar un dato | "variable puntuación" | `puntuacion = 0` |
| Cambiar un dato | "cambiar puntuación por 1" | `puntuacion += 1` |
| Elegir al azar | "número aleatorio entre 1 y 10" | `random.randint(1, 10)` |

#### Actividad: "Traduce tu juego a Python"

El estudiante toma uno de los juegos que hizo en Scratch y escribe el equivalente en Python usando el editor Pyodide:

```
Scratch (Juego de atrapar):
  por siempre:
    si tocando canasta?:
      cambiar puntuacion por 1

Python equivalente:
  while True:
    if tocando_canasta():
      puntuacion += 1
```

#### Checklist adicional (4 ítems)
| ID | Texto |
|----|-------|
| `u4-4-1` | Leí la tabla comparativa Scratch → Python |
| `u4-4-2` | Identifiqué las similitudes entre bloques y código |
| `u4-4-3` | Traduje al menos un programa de Scratch a Python (mentalmente) |
| `u4-4-4` | Escribí el equivalente Python de mi juego en el editor |

#### Video sugerido
- `a5DOIvjxiQ0` (ya existe en la unidad) — Curso Scratch desde cero

---

## Mejora 2: Lección de Debugging — "¿Por qué no funciona?"

> **Dónde:** Nueva unidad corta `modules/unidad3b.html` o como sesión extra en U3
> **Duración:** 1 sesión (entre U3 y U4)
> **Archivo a crear:** `modules/debugging.html`
> **Checklist IDs:** `dbg-1-1` a `dbg-1-4` (4 ítems)

### Sesión 1 — ¿Por qué no funciona mi programa?

**Teoría:**
- Todos los programas tienen errores. Incluso los programadores expertos.
- La diferencia es que saben **cómo encontrar los errores**.
- 3 tipos de errores:
  - **Error de sintaxis:** Python no entiende lo que escribiste (falta `:`, paréntesis, espacios)
  - **Error de lógica:** el programa funciona pero hace algo diferente a lo que querías
  - **Error de ejecución:** el programa se detiene a medio camino (división entre cero, variable no definida)

**Práctica — "El detective de errores":**
Se presentan 4 programas con errores y el estudiante debe:
1. Leer el mensaje de error
2. Identificar la línea del problema
3. Corregirlo

```python
# Error 1: Sintaxis
nombre = input("¿Cómo te llamas?")
if nombre == "Regina"    # ← falta :
    print("Hola profe")

# Error 2: Lógica (quería contar del 1 al 5)
for i in range(5):       # ← range(5) da 0,1,2,3,4 no 1,2,3,4,5
    print(i)

# Error 3: Ejecución
numero = int(input("Número: "))
resultado = 10 / numero  # ← si el usuario ingresa 0, explota

# Error 4: Lógica
temperatura = 30
if temperatura > 20:
    print("Hace calor")
elif temperatura > 30:   # ← este elif NUNCA se ejecuta
    print("Hace mucho calor")
```

**Herramientas de debugging:**
```python
# Truco 1: Print para ver valores intermedios
print(f"DEBUG: x vale {x}, y vale {y}")

# Truco 2: Comentar código para aislar el problema
# resultado = funcion_compleja(a, b, c)  ← comenta esto
resultado = 42                           ← prueba con un valor fijo

# Truco 3: Leer el error de arriba a abajo
# Python siempre dice DÓNDE falló (nombre del archivo y línea)
```

**Videos:** `7Z9zRwDDoG8` (Cómo leer errores en Python)

**Checklist:**
| ID | Texto |
|----|-------|
| `dbg-1-1` | Entiendo los 3 tipos de errores (sintaxis, lógica, ejecución) |
| `dbg-1-2` | Usé `print()` para ver valores intermedios |
| `dbg-1-3` | Corregí al menos 2 programas con errores |
| `dbg-1-4` | Sé leer un mensaje de error de Python |

**Archivos a modificar:**
| Archivo | Cambio |
|---------|--------|
| `modules/debugging.html` | Crear nuevo |
| `index.html` | Agregar tarjeta + sidebar |
| 6 módulos HTML | Sidebar (agregar "🐛 Debugging" entre U3 y U4) |
| `js/app.js` | Agregar `dbg-1-1` a `dbg-1-4` |
| `api/admin/export.js` | Agregar IDs |
| `docs/plan-mejora.md` | Actualizar |

---

## Mejora 3: Miniretos por Unidad

> **Dónde:** Una sección "⭐ Retos extra" al final de cada unidad (visible siempre, no requiere expandir sesión)
> **Duración:** Opcional — para estudiantes que quieren más práctica
> **Archivos a modificar:** `modules/unidad2.html`, `modules/unidad3.html`, `modules/unidad4.html`

### Unidad 2 — Retos de lógica
```markdown
⭐ Reto 1 — "El juego del limbo":
Escribe instrucciones para que una persona pase por debajo de una cuerda
sin tocarla. Incluye una decisión: "si la cuerda está muy baja, pasa agachado".

⭐ Reto 2 — "Diagrama del día":
Dibuja el diagrama de flujo de tu rutina matutina (despertar, bañarse,
desayunar, ir a la escuela). Identifica al menos 2 decisiones y 1 bucle.

⭐ Reto 3 — "Instrucciones a ciegas":
Dale tus instrucciones escritas a alguien sin decirle de qué actividad se trata.
¿Pudo adivinar la actividad solo con los pasos?
```

### Unidad 3 — Retos de Python
```markdown
⭐ Reto 1 — "Calculadora de propinas":
Pregunta el total de la cuenta y el porcentaje de propina (10, 15, 20%).
Muestra: subtotal, propina y total final. Usa input(), float() y operadores.

⭐ Reto 2 — "Adivina la palabra":
El programa elige una palabra secreta de una lista. El usuario tiene 3 intentos
para adivinarla. Pista: el programa dice cuántas letras tiene. Usa while e if.

⭐ Reto 3 — "Lista de reproducción":
Crea un programa que permita: 1) Agregar canciones, 2) Ver la lista,
3) Reproducir la siguiente (marcar como reproducida). Usa listas y funciones.
```

### Unidad 4 — Retos de Scratch
```markdown
⭐ Reto 1 — "Juego de memoria":
Crea un juego donde aparecen figuras en pantalla por 2 segundos y el jugador
debe recordar cuáles eran. Usa clones, variables y temporizador.

⭐ Reto 2 — "Carrera de animales":
Dos personajes compiten en una carrera aleatoria. Cada uno avanza un número
aleatorio de pasos por turno. El primero en llegar a la meta gana.

⭐ Reto 3 — "Pong simplificado":
Dos paletas (una con W/S y otra con flechas arriba/abajo) y una pelota
que rebota. Punto cuando la pelota pasa la paleta del oponente.
```

---

## Resumen de Archivos a Modificar/Crear

### Crear nuevos
| Archivo | Propósito |
|---------|-----------|
| `modules/debugging.html` | Lección de debugging (1 sesión) |
| `docs/plan-mejora.md` | Este documento |

### Modificar existentes
| Archivo | Cambio |
|---------|--------|
| `modules/unidad4.html` | Agregar puente Scratch→Python (tabla + checklist) + retos |
| `modules/unidad2.html` | Agregar retos extra (3) |
| `modules/unidad3.html` | Agregar retos extra (3) |
| `index.html` | Agregar tarjeta de Debugging + sidebar |
| `modules/fase0.html` | Sidebar |
| `modules/unidad1.html` | Sidebar |
| `modules/unidad2.html` | Sidebar |
| `modules/unidad3.html` | Sidebar |
| `modules/unidad4.html` | Sidebar + contenido nuevo |
| `modules/proyecto.html` | Sidebar |
| `modules/glosario.html` | Sidebar |
| `js/app.js` | Checklist IDs: `u4-4-1` a `u4-4-4` + `dbg-1-1` a `dbg-1-4` |
| `api/admin/export.js` | Mismos IDs |

---

## Orden de Implementación

```mermaid
gantt
    title Mejoras Curso Programación v2
    dateFormat  YYYY-MM-DD
    
    section Paso 1
    Debugging (nueva página)       :a1, 1d
    
    section Paso 2
    Puente Scratch→Python en U4    :b1, after a1, 1d
    
    section Paso 3
    Miniretos U2 + U3 + U4         :c1, after b1, 1d
    Sidebars + index               :c2, after c1, 1d
    
    section Paso 4
    Push a GitHub                  :d1, after c2, 1d
```

---

## Criterios de Éxito

- [ ] El estudiante puede explicar la equivalencia entre un bloque de Scratch y su código Python
- [ ] El estudiante sabe leer un mensaje de error de Python y encontrar la línea del problema
- [ ] El estudiante puede usar `print()` para depurar variables intermedias
- [ ] Cada unidad ofrece al menos 3 retos opcionales para quien quiere más práctica
- [ ] Los retos son resolubles con lo aprendido hasta esa unidad (no requieren conceptos futuros)
- [ ] Todos los videos están verificados (HTTP 200)
- [ ] Checklist IDs consistentes sin duplicados
