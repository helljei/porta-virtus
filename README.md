# Porta Virtus

App de tracking de hábitos estilo estoico. SPA construida con Vite + React + TypeScript.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest
npm run build    # dist/
npm run preview  # sirve el build local
```

## Verificación del harness

```bash
node init.mjs    # verifica entorno + estado del backlog
```

## Estructura

- `src/PortaVirtus.tsx` — componente principal (self-contained).
- `src/App.tsx` — bootstrap mínimo de Vite.
- `tests/` — tests con Vitest + Testing Library.
- `AGENTS.md` — instrucciones para agentes de IA que trabajen el proyecto.
- `docs/` — arquitectura, convenciones, verificación.
- `progress/` — bitácora de sesiones.

## Deploy

Producción: [porta-virtus.vercel.app](https://porta-virtus.vercel.app)
