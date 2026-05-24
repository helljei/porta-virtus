# Impl — feature 1: scaffold_vite

## Archivos creados

- `package.json` (deps: react 18.3, react-dom 18.3, vite 5.4, vitest 2.1, @vitejs/plugin-react 4.3, @testing-library/react 16, jsdom 25, typescript 5.6)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` (permisivos: strict:false, noImplicitAny:false)
- `vite.config.ts` (plugin react + bloque test con jsdom + passWithNoTests)
- `index.html` (título "Porta Virtus", meta description)
- `src/main.tsx`, `src/App.tsx` (placeholder), `src/vite-env.d.ts`
- `tests/setup.ts` (importa @testing-library/jest-dom/vitest)

## Decisiones

- **No usé `npm create vite`** porque la carpeta no estaba vacía (harness ya escribido). Crear archivos a mano es más controlado.
- **`passWithNoTests: true`** en vitest config: Vitest 2.x sale con código 1 por defecto cuando no hay tests; el harness lo ejecuta antes de que existan tests (feature 3), así que ese exit code rompía `init.mjs`. Con `passWithNoTests` el smoke test posterior sigue siendo obligatorio porque CHECKPOINTS C4 lo exige.
- **TypeScript permisivo a propósito**: el componente original `porta_virtus.tsx` no tiene types. Refactorizar a TS estricto es scope creep — está prohibido por `docs/architecture.md`.

## Verificación

```
> npm install: added 176 packages in 15s
> npm run typecheck: exit 0
> npm test -- --run: "No test files found, exiting with code 0" ✓
> npm run build:
    transforming 30 modules
    dist/index.html        0.53 kB
    dist/assets/index.js   142.69 kB | gzip: 45.88 kB
    built in 430ms
> node init.mjs: [OK] Entorno listo
```

Todos los criterios del acceptance se cumplen.
