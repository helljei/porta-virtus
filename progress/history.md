# Historia de sesiones

> Bitácora append-only. Cada entrada documenta una sesión cerrada con feature implementada.

Formato de cada entrada:

```
## YYYY-MM-DD — Feature N: <nombre>

- **Agente:** [modelo + rol]
- **Plan:** [1-2 líneas con la intención]
- **Cambios:** [archivos tocados, con paréntesis explicativos breves]
- **Verificación:** [resultado literal: "node init.mjs verde, N tests pasan"]
- **Cierre:** [estado final + próximo paso]
```

---

## 2026-05-24 — Feature 1: scaffold_vite

- **Agente:** Claude Opus 4.7 (leader + implementer + reviewer en un solo turno)
- **Plan:** Scaffolding Vite + React 18 + TypeScript permisivo + Vitest jsdom.
- **Cambios:** `package.json`, `tsconfig{,.app,.node}.json`, `vite.config.ts`, `index.html`, `src/{main,App,vite-env.d}.tsx`, `tests/setup.ts`. Bug fix en `init.mjs` (faltaba `shell:true` para `npm.cmd` en Windows).
- **Verificación:** `node init.mjs` verde, `npm run build` 142 kB en 430 ms, `npm run typecheck` y `npm test --run` pasan.
- **Cierre:** done. Próximo: feature 2 (integrate_porta_virtus).

## 2026-05-24 — Feature 2: integrate_porta_virtus

- **Agente:** Claude Opus 4.7 (leader + implementer + reviewer)
- **Plan:** Copiar `porta_virtus.tsx` desde Downloads a `src/`, integrarlo en `App.tsx`, dejar el componente intacto.
- **Cambios:** `src/PortaVirtus.tsx` (copia + cabecera `// @ts-nocheck`), `src/App.tsx` (renderiza `<PortaVirtus />`), `docs/conventions.md` (nueva sección "Componentes soberanos").
- **Verificación:** typecheck verde, `npm run build` produce 219 kB (66 kB gzip) en 528 ms, `npm run preview` responde HTTP 200 con título "Porta Virtus" y div root.
- **Cierre:** done. Smoke manual de LocalStorage queda pendiente del usuario; cobertura ejecutable equivalente entra en feature 3. Próximo: feature 3 (smoke_test).

## 2026-05-24 — Feature 3: smoke_test

- **Agente:** Claude Opus 4.7 (leader + implementer + reviewer)
- **Plan:** Escribir `tests/PortaVirtus.test.tsx` con 3 casos cubriendo loader, modal y dashboard con user pre-poblado en localStorage.
- **Cambios:** `tests/PortaVirtus.test.tsx` (3 tests).
- **Verificación:** `npm test -- --run` → 3/3 pasan en 1.24 s. `node init.mjs` → `[OK]`.
- **Cierre:** done. Warnings `act()` aceptados (no se editan componentes soberanos). Próximo: feature 4 (vercel_deploy).
