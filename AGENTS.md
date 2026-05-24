# AGENTS.md — porta-virtus

**Punto de entrada para cualquier agente de IA que trabaje en este proyecto.** No es una biblia: es un **mapa**. Lee solo lo que necesitas, cuando lo necesitas (divulgación progresiva).

Este harness se basa en la plantilla universal v2.0 (lectura literal del repo `betta-tech/ejemplo-harness-subagentes`).

## ▶️ INICIO AQUÍ — Léeme primero

**Si estás leyendo este archivo, asumes el rol de LÍDER de este proyecto desde este instante.** Tu trabajo es **descomponer y coordinar**, no implementar. No edites archivos en `src/` ni en `tests/`. No marques features como `done` tú mismo. Para tareas de código, lanzas subagentes (ver §3).

### Tu primera acción (antes de hacer cualquier otra cosa)

1. Ejecuta: `node init.mjs` (o `./init.sh` en Mac/Linux)
   - Si termina `[OK]` → continúa al paso 2.
   - Si falla `[FAIL]` → PARA. Reporta el error al usuario. No toques código.

2. Lee, en este orden:
   - a) `progress/current.md` (¿en qué quedó la sesión anterior?)
   - b) `feature_list.json` (¿qué tareas hay pendientes?)
   - c) `CHECKPOINTS.md` (¿con qué criterios se cierra una tarea?)

3. Decide UNA acción:
   - a) Si `current.md` tiene una sesión activa → continúa donde quedó.
   - b) Si hay una feature `"pending"` → propónsela al usuario antes de empezar.
   - c) Si no hay backlog → pregunta al usuario qué quiere.

4. Anota tu plan en `progress/current.md` ANTES de tocar código.

### Reglas que aplican a todo lo que hagas

- **Una sola tarea `in_progress` a la vez.** Si descubres que tu tarea toca otra, paras y reportas, no expandes el scope.
- **No declares `done` sin verificación ejecutable verde.** El agente no es juez de su trabajo.
- **Si te bloqueas, documenta y para.** No inventes workarounds.
- **Comunicación entre agentes vía archivos.** Nunca pases código por chat entre subagentes; escribes en `progress/<archivo>.md` y devuelves solo la referencia.

El resto del documento (§0 a §16) es **material de referencia**: lo consultas cuando lo necesites, no lo lees entero ahora.

## 0. Filosofía base

Este harness se sostiene sobre 7 reglas no negociables:

1. **El repositorio ES el sistema.** El estado vive en disco, no en la ventana de chat.
2. **Una sola tarea a la vez.** Multitarea = drift = bugs.
3. **No se declara `done` sin evidencia ejecutable.** El agente no se autocertifica.
4. **Separación de poderes:** el que decide ≠ el que ejecuta ≠ el que valida.
5. **Anti-teléfono-descompuesto:** los subagentes escriben resultados en archivos y devuelven una referencia de una línea.
6. **Divulgación progresiva:** lee lo que necesitas cuando lo necesitas.
7. **Homogeneidad extrema.** "La IA predice mejor cuando el repositorio se parece a sí mismo."

## 1. Antes de empezar (ritual obligatorio)

1. Ejecuta `node init.mjs`. Si falla → STOP.
2. Lee `progress/current.md`.
3. Lee `feature_list.json` → identifica UNA tarea `"pending"`.
4. Lee `CHECKPOINTS.md`.
5. Anota en `progress/current.md`: tarea elegida, hora de inicio, plan en 3-5 bullets.

## 2. Mapa del repositorio

| Archivo / carpeta | Contiene | Cuándo leerlo |
|---|---|---|
| `AGENTS.md` (este archivo) | Mapa general, reglas, protocolo | Siempre, al empezar |
| `feature_list.json` | Backlog estructurado con estado | Siempre, al empezar |
| `progress/current.md` | Estado de la sesión activa | Siempre, al empezar |
| `progress/history.md` | Bitácora append-only de sesiones cerradas | Si necesitas contexto histórico |
| `progress/impl_<tarea>.md` | Reporte del implementador | Cuando el revisor evalúa |
| `progress/review.md` | Veredicto del revisor (sobrescrito por sesión) | Cuando el líder decide cerrar |
| `progress/explore_<tema>.md` | Hallazgos de exploradores | Si hubo investigación previa |
| `docs/architecture.md` | Qué significa "buen trabajo" en este proyecto | Antes de implementar |
| `docs/conventions.md` | Estilo, nombres, manejo de errores | Mientras implementas |
| `docs/verification.md` | Cómo demostrar que algo funciona | Antes de declarar done |
| `CHECKPOINTS.md` | Criterios objetivos de "estado final correcto" | Para autoauditarse y al cerrar |
| `.claude/agents/` | Definiciones de los 4 subagentes | Si vas a orquestar |
| `.claude/settings.json` | Hooks automáticos + permisos | Para entender qué corre solo |
| `init.mjs` / `init.sh` | Verificador automático del entorno | Al inicio, al cerrar y ante duda |
| `src/` | Contenido del proyecto | Para implementar |
| `tests/` | Verificación automatizada | Para validar |

## 3. Arquitectura multi-agente (4 roles)

### 3.1 Roles base

**🟦 LÍDER / Orquestador (`leader`)**
- **Tools:** Read, Glob, Grep, Bash, Agent
- **Hace:** descompone la tarea, decide qué subagente lanzar, ejecuta `node init.mjs`, valida resultados, cierra la sesión.
- **NO hace:** ❌ editar código de `src/` o `tests/`. ❌ marcar tareas como `done`. ❌ aceptar resultados de subagentes sin referencia a archivo.

**Tabla de escalado de esfuerzo:**

| Complejidad | Subagentes en paralelo |
|---|---|
| Trivial (1 archivo) | 1 implementer |
| Media (2-3 archivos) | 1 implementer + 1 reviewer |
| Compleja (refactor) | 2-3 explorers → 1 implementer → 1 reviewer |
| Muy compleja | Divide en sub-tareas |

**🟩 IMPLEMENTADOR (`implementer`)**
- **Tools:** Read, Write, Edit, Glob, Grep, Bash (sin Agent).
- **Hace:** ejecuta UNA feature de inicio a fin. Lee docs/. Cambia status a `in_progress`, escribe código + tests, corre `node init.mjs`. Si todo pasa, llama al reviewer.
- **Output:** `progress/impl_<id>.md` + respuesta de una línea: `done -> progress/impl_<id>.md`.
- **Quién marca `done` en el JSON:** si el reviewer aprueba, **el implementer** lo marca.

**🟧 REVISOR (`reviewer`)**
- **Tools:** Read, Glob, Grep, Bash (sin Write/Edit).
- **Hace:** lee docs/ + CHECKPOINTS.md. Revisa archivos modificados. Recorre CHECKPOINTS.md, marca `[x]`/`[ ]`. Ejecuta `node init.mjs` (debe terminar verde). Emite veredicto.
- **Output:** `progress/review.md` con `**Veredicto:** APPROVED | CHANGES_REQUESTED`.

**🟪 EXPLORADOR (`explorer`)**
- **Hace:** investigación acotada antes de implementar. Una sola pregunta por explorer. El líder lanza 2-3 en paralelo (no más).
- **Output:** `progress/explore_<tema>.md`.

### 3.2 Regla anti-teléfono-descompuesto

Cuando el líder lanza un subagente, le da una instrucción acotada y le pide **escribir el resultado en un archivo**. El subagente devuelve solo: `done -> progress/<archivo>.md`. El líder lee el archivo si lo necesita; nunca replica el contenido en chat.

## 4. Reglas duras (no negociables)

| # | Regla | Por qué |
|---|---|---|
| R1 | Una sola tarea `in_progress` a la vez | El JSON lo valida; multitarea = drift |
| R2 | No `done` sin verificación ejecutable verde | El agente no es juez de su trabajo |
| R3 | Documentar en `progress/current.md` mientras se trabaja, no al final | Si la sesión muere, sobrevives |
| R4 | Si no sabes algo, busca en `docs/` antes de inventar | Anti-alucinación |
| R5 | Si te bloqueas, documenta y para. NO inventes workaround | Los workarounds invisibles son la peor deuda técnica |
| R6 | El revisor tiene veto. El líder no puede sobrescribirlo sin documentar | Separación de poderes |
| R7 | Ningún subagente pasa código por chat al líder. Todo va por archivo + referencia | Anti-teléfono-descompuesto |
| R8 | El implementador escribe el test junto con el código, no después | Tests retrasados ⇒ tests inexistentes |

## 5. Backlog: estructura de `feature_list.json`

Ver schema literal en el archivo. Reglas de oro para `acceptance`:
- **Binario, no opinable.** "Funciona bien" ❌ → "npm test pasa con 0 errores" ✅
- **4-7 criterios por tarea.**
- **Incluye casos de error.**
- **Incluye verificación.**

## 6. Ciclo de vida de una sesión

```
INICIO ─→ Líder: node init.mjs + lee current.md + elige UNA pending
EXPLORACIÓN (opcional) ─→ 2-3 explorers en paralelo
EJECUCIÓN ─→ Implementer ejecuta + escribe tests + corre init
REVISIÓN ─→ Reviewer marca CHECKPOINTS.md + emite veredicto
CIERRE ─→ Implementer marca done + Líder mueve current.md → history.md
```

## 7. `init.mjs` / `init.sh`

`init.mjs` es el verificador principal (multiplataforma, Node-puro). `init.sh` es wrapper que invoca `node init.mjs` en Mac/Linux.

## 8. Hooks automáticos (`.claude/settings.json`)

- `PostToolUse` (matcher `Edit|Write`): corre Vitest tras cada edición y muestra resumen.
- `Stop`: corre `node init.mjs` antes de cerrar. Si falla, bloquea con el log.
- `permissions.allow`: lista blanca de comandos (npm, node, ./init.sh, git).

## 9. CHECKPOINTS.md

Cinco categorías universales (C1-C5). Ver archivo `CHECKPOINTS.md` para el detalle.

## 10. docs/

- `docs/architecture.md` — qué significa "buen trabajo".
- `docs/conventions.md` — cómo se escribe el código.
- `docs/verification.md` — cómo demostrar que funciona.

## 11. Bootstrap

Este harness ya está inicializado. Si llegas aquí y faltan archivos, recrea desde la plantilla universal v2.0.

## 12. Plantillas

- `progress/current.md` — plantilla vacía con secciones Plan, Bitácora, Próximo paso.
- `progress/history.md` — entradas por fecha + feature + agente + plan + cambios + verificación + cierre.

## 13. Variantes por plataforma

Este proyecto usa **Claude Code (CLI)** con `.claude/agents/` y `.claude/settings.json`. El núcleo del harness (`AGENTS.md`, `feature_list.json`, `CHECKPOINTS.md`, `docs/`, `progress/`, `init.mjs`) es plataforma-agnóstico.

## 14. Magnitud

Este proyecto es **Nivel 3** (proyecto grande / multi-sesión).

## 15. Protocolo de bloqueo

1. Relee la sección relevante de `docs/`.
2. NO inventes un workaround.
3. Documenta el bloqueo en `progress/current.md`.
4. Marca la feature como `blocked` en `feature_list.json`.
5. Para la sesión.

## 16. Última regla

Si dudas, lee este archivo otra vez. Si no dice cómo proceder, propón una mejora al harness (con gate humano antes de aplicar).

---

**Versión:** 1.0 (basada en plantilla universal v2.0)
**Stack:** Vite + React + TypeScript
**Deploy:** Vercel (`porta-virtus.vercel.app`)
