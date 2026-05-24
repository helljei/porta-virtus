# Arquitectura — Qué significa "hacer un buen trabajo"

> Este documento define el estándar de calidad. Si no está aquí, no es un requisito.

## Principios

1. **Capas claras.** El proyecto tiene 3 capas y solo 3:
   - **Componente UI** (`src/PortaVirtus.tsx`): toda la UI, estados con `useState`, persistencia con `localStorage`.
   - **Funciones puras** (dentro del mismo archivo): `computeXP`, `computeStreaks`, `computeInsights`, etc. Sin side effects, sin DOM, sin storage.
   - **Bootstrap mínimo** (`src/main.tsx`, `src/App.tsx`): el shell de Vite que monta el componente.

2. **Dependencias.** Solo `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@testing-library/react`, `jsdom`. **No** se agregan librerías de UI (Tailwind, MUI, shadcn) — el componente usa CSS-in-JS inline. **No** se agregan librerías de estado (Redux, Zustand) — `useState` es suficiente.

3. **Errores explícitos.** El componente nunca debe lanzar excepción al usuario:
   - Si `localStorage` falla (modo privado, cuota llena), captura el error y muestra un fallback en UI.
   - Funciones puras nunca lanzan: validan input con `isValidDateStr` y similares.

4. **Inmutabilidad por defecto.** Actualizaciones de estado siempre con nueva referencia (`{...history, [ds]: ...}`). Nunca mutar `history`, `tasks`, ni los arrays internos.

5. **Atomicidad de localStorage.** Cada `setItem` escribe el objeto completo serializado. No hay escrituras parciales que dejen el estado inconsistente.

## Flujo de datos

```
Usuario → tab activa → callback (onToggle, onCreate)
       → setState (history/tasks)
       → useEffect → localStorage.setItem
       → re-render → computeX funciones puras → UI
```

LocalStorage keys:
- `pv_history` — `Record<dateStr, Record<taskId, boolean>>`
- `pv_tasks` — `Task[]`
- `pv_user` — `{ name?: string }`

## Qué NO hacer

- **No agregues librerías de UI.** El componente tiene su propio sistema de tokens (`P`) y animaciones. Mezclar Tailwind o MUI viola la homogeneidad.
- **No introduzcas SSR.** El proyecto es SPA pura. `next.js` está prohibido. `react-router` también está prohibido a menos que se justifique en una feature aparte con razón documentada.
- **No mezcles lógica de UI con cómputo.** Las funciones `computeX` viven en el mismo archivo pero son puras. Si una función pura necesita leer `localStorage`, está mal diseñada — pásale el dato por parámetro.
- **No uses `any` salvo bordes externos (parseo de localStorage, callbacks de event handlers).** El TS está permisivo pero esto no es licencia para anotar `any` everywhere.
- **No agregues un backend.** Si se necesita sync remoto, es una feature aparte que debe definirse en `feature_list.json` con su propia ADR.

## Constraint operativo

- **El componente original (`porta_virtus.tsx`) es soberano.** No reescribirlo, no refactorizarlo, no dividirlo en archivos. Si necesita cambios, deben justificarse en una feature explícita con su acceptance.
