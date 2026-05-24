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

## 2026-05-24 — Backlog ampliado (features 5-8 añadidas como pending)

- **Agente:** Claude Opus 4.7 (leader, anotación de backlog tras petición del usuario "anota en el harness").
- **Cambios:** `feature_list.json` ahora lista 4 features `done` + 4 `pending` (5: smoke_manual_ui, 6: github_vercel_oauth, 7: add_favicon, 8: expand_readme). Ninguna toca código todavía.
- **Verificación:** `node init.mjs` verde (0 features `in_progress`, regla R1 respetada).
- **Cierre:** ninguna feature `in_progress`. La próxima sesión puede elegir cualquiera de 5-8 como punto de entrada.

## 2026-05-24 — Feature 4: vercel_deploy

- **Agente:** Claude Opus 4.7 (leader + implementer + reviewer), con confirmación humana antes de las acciones externas.
- **Plan:** vercel.json + git init + commit local → gh repo create (helljei/porta-virtus público) → vercel link --scope welcomerh → vercel deploy --prod.
- **Cambios:** `vercel.json` (framework vite + SPA rewrite + cache headers), `.gitignore` (+ `.vercel`, `*.tsbuildinfo`). Repo creado en https://github.com/helljei/porta-virtus. Proyecto Vercel `welcomerh/porta-virtus` con alias `porta-virtus.vercel.app`.
- **Verificación:** `GET https://porta-virtus.vercel.app` → 200, title "Porta Virtus", root div presente, bundle `/assets/index-B5IO3CO9.js` idéntico al build local.
- **Cierre:** done. Auto-conexión GitHub↔Vercel quedó pendiente (cross-account OAuth no autorizado). Deploys futuros requieren `vercel deploy --prod` desde local hasta que se autorice la integración.
