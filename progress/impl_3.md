# Impl — feature 3: smoke_test

## Archivos creados

- `tests/PortaVirtus.test.tsx` — 3 casos con Vitest + Testing Library + jsdom.

## Casos cubiertos

1. **`renders the loader on first paint without throwing`** — primer render síncrono muestra el splash "PORTA VIRTUS" porque `loadData()` es async y `history === null`.
2. **`shows the name modal after async load when no user is stored`** — tras el `await` del effect inicial sin user en storage, aparece el `NameModal` con el texto "¿Cómo quieres que te llame?", el input "Tu nombre" y el botón "Guardar".
3. **`renders the main dashboard when user is pre-populated in localStorage`** — pre-poblamos `porta_virtus_user`, `porta_virtus_history`, `porta_virtus_tasks` en `localStorage`, montamos el componente y verificamos que aparece el nombre del usuario + "Tracker de desarrollo personal" + las tabs Hoy/Semana/Insignias.

Sin mocks: jsdom provee `localStorage` real. `beforeEach` limpia entre tests.

## Notas técnicas

- Aparecen warnings de `act()` en consola de Vitest porque el componente hace state updates dentro de un `useEffect` async (`loadData().then(setHistory)`). `waitFor` los maneja correctamente; no fallan los tests. Arreglar los warnings requeriría editar el componente soberano, lo cual está prohibido por `docs/architecture.md`.

## Verificación

```
> npm test -- --run:
    Test Files  1 passed (1)
    Tests       3 passed (3)
    Duration    1.24s

> node init.mjs:
    [OK] Entorno listo (3 tests pasan)
```

Acceptance:
- [x] `tests/PortaVirtus.test.tsx` existe.
- [x] El test monta el componente sin lanzar error.
- [x] El test verifica elementos visibles (loader, modal, tabs del dashboard).
- [x] `npm test -- --run` pasa al 100%.
- [x] `node init.mjs` termina `[OK]`.
