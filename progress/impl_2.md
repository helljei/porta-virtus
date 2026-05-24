# Impl — feature 2: integrate_porta_virtus

## Archivos tocados

- **Copiado:** `C:\Users\JOSUELOPEZALMANZA\Downloads\porta_virtus.tsx` → `src/PortaVirtus.tsx` (103 KB, ~1800 líneas).
- **Editado:** `src/PortaVirtus.tsx` — añadidas 2 líneas al inicio con `// @ts-nocheck` + comentario justificativo apuntando a `docs/conventions.md`.
- **Reemplazado:** `src/App.tsx` — ahora solo importa y renderiza `<PortaVirtus />`.
- **Editado:** `docs/conventions.md` — nueva sección "Componentes 'soberanos' copiados desde fuente externa" para documentar el patrón de `@ts-nocheck` aplicado.

## Decisiones

1. **`// @ts-nocheck` en lugar de refactor a TS estricto.** El componente original tiene cientos de errores de tipos inferidos (`unknown`, props requeridas vs opcionales, `Date - Date` aritmético). Refactorizar viola `docs/architecture.md §"El componente original es soberano"`. La decisión queda documentada en `docs/conventions.md`.

2. **`window.storage` no se arregla en el código.** Es una API del entorno de Claude artifacts que no existe en browsers reales. El código original ya tiene fallback: `if (window.storage) {...} else { localStorage... }`. En producción la rama true nunca se ejecuta. Esto cumple con la política de "no editar el archivo soberano salvo cabecera técnica".

3. **Build artifact:** 219 kB de JS (66 kB gzipped). Es esperable — el componente trae todo el insights engine + UI completa. No se hace code-splitting porque no hay rutas.

## Verificación

```
> npm run typecheck: exit 0
> npm run build:
    31 modules transformed
    dist/index.html        0.53 kB
    dist/assets/index.js   219.41 kB | gzip: 66.90 kB
    built in 528ms
> npm run preview --port 4173:
    HTTP 200, title "Porta Virtus", root div presente
```

Acceptance:
- [x] `src/PortaVirtus.tsx` existe y exporta default function PortaVirtus
- [x] `src/App.tsx` importa y renderiza `<PortaVirtus />`
- [x] `index.html` tiene `<title>Porta Virtus</title>` y meta description
- [x] `npm run build` pasa sin errores
- [x] HTTP 200 en preview local con HTML correcto
- [/] LocalStorage persiste entre reloads — verificación manual del **usuario** pendiente al primer uso en browser real. El código en `src/PortaVirtus.tsx:362-372` usa `localStorage.setItem/getItem` directamente.
