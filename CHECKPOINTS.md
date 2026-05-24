# CHECKPOINTS — Evaluación del estado final

> No evaluamos el camino, evaluamos el destino. Cada box es binario.

## C1 — El arnés está completo

- [ ] Existen `AGENTS.md`, `init.mjs`, `init.sh`, `feature_list.json`, `progress/current.md`
- [ ] Existen `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`
- [ ] Existen `.claude/agents/leader.md`, `implementer.md`, `reviewer.md`, `explorer.md`
- [ ] Existe `.claude/settings.json` con hooks PostToolUse y Stop
- [ ] `node init.mjs` termina con exit code 0

## C2 — El estado es coherente

- [ ] Máximo 1 feature `in_progress` en `feature_list.json`
- [ ] Toda feature `done` tiene tests/validación asociados que pasan
- [ ] `progress/current.md` está vacío o describe SOLO la sesión activa
- [ ] `progress/history.md` tiene una entrada por cada feature cerrada

## C3 — El producto respeta la arquitectura

- [ ] El código solo contiene los módulos previstos en `docs/architecture.md`
- [ ] No hay debug suelto: `console.log`, `debugger`, TODOs sin contexto
- [ ] Dependencias declaradas en `package.json` (sin imports fantasma)
- [ ] El componente `PortaVirtus` sigue siendo self-contained: solo React + Google Fonts CDN

## C4 — La verificación es real

- [ ] Existe al menos un test de integración para `PortaVirtus`
- [ ] Los tests NO usan mocks de `localStorage` cuando se puede usar el real de `jsdom`
- [ ] `npm test -- --run` pasa al 100%
- [ ] `npm run build` pasa sin warnings críticos
- [ ] `npm run typecheck` pasa

## C5 — La sesión se cerró bien

- [ ] No hay archivos basura sin trackear (revisar `git status`)
- [ ] `progress/history.md` tiene una entrada por la última sesión
- [ ] Estados en `feature_list.json` son consistentes (no quedan `in_progress` huérfanos)
- [ ] Si la feature involucra deploy, la URL pública responde 200

**Cómo lo usa el reviewer:** recorre cada box, marca `[x]`/`[ ]`. Si queda cualquier box vacío en C1-C5 sin justificación, veredicto = `CHANGES_REQUESTED`.
