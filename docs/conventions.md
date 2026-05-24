# Convenciones de código

> Homogeneidad extrema. La IA predice mejor cuando el repositorio se parece a sí mismo en todas partes.

## Estilo

- TypeScript 5.x, target ES2020, JSX preserve (Vite se encarga).
- Comillas dobles `"..."` para strings.
- Punto y coma al final de statements.
- Imports agrupados: React primero, luego librerías externas, luego internos (`./` o `@/`).
- Sin formateadores automáticos opinionados (Prettier opcional, no obligatorio).
- Longitud de línea: orientativa 120 caracteres; no hay enforcement estricto porque el componente original usa líneas largas a propósito.

## Nombres

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase | `PortaVirtus`, `TodayTab` |
| Funciones / variables | camelCase | `computeStreaks`, `taskStats` |
| Constantes globales | UPPER_SNAKE | `DAYS_MAP`, `MONTH_NAMES` |
| Paleta de colores | Una sola letra | `P.amber`, `P.cream` |
| Helpers privados del módulo | minúsculas cortas | `uid`, `toDateStr` |
| Archivos | PascalCase para componentes, camelCase para helpers | `PortaVirtus.tsx`, `App.tsx` |

## Estructura de archivo

El componente único `PortaVirtus.tsx` se organiza así (orden literal del original):

```
1. imports React
2. FontLoader (component)
3. Constantes (P paleta, DEFAULT_TASKS, DAYS_MAP, etc.)
4. Utilidades puras (uid, toDateStr, getTasksForDate, ...)
5. PURE COMPUTE section (computeCompletionForDate ... computeBadges)
6. INSIGHTS ENGINE (computeInsights, computePriorityTasks, computeExtendedInsights)
7. UI atoms (MiniBar, Chip, TierPill, Divider, SectionLabel, Btn, ...)
8. Sub-componentes (CheckinFlow, ResultCard, TodayTab, WeekTab, ...)
9. Icons (IconColumn, IconLaurel, ...)
10. NameModal
11. export default function PortaVirtus()
```

## Tests

- Un archivo de test por componente público externo (en este proyecto: `PortaVirtus`).
- Ubicación: `tests/<Name>.test.tsx` (espejo de `src/`).
- Nombres: `test_<acción>_<condición>_<resultado>`.
- Fixtures: usar `@testing-library/react` con `localStorage` real de jsdom (NO mockear).
- Para limpiar entre tests: `beforeEach(() => localStorage.clear())`.

## Manejo de errores

- `try/catch` solo en bordes: parseo de `localStorage.getItem`, callbacks de eventos del navegador.
- Funciones puras `compute*` **no lanzan**: si reciben datos malformados, devuelven `null`, array vacío o un default razonable.
- Si una operación falla irrecuperablemente, mostrar mensaje en UI (banner rojo), nunca un crash silencioso.

## Comentarios

Por defecto **no** se escriben. Solo se permiten cuando explican un *por qué* no obvio:
- Un workaround documentado (ej. fix de un bug específico de Safari).
- Un invariante sutil (ej. "este orden importa porque X").

Los nombres deben hacer el resto. NO escribir comentarios que repiten el código en español.

## Imports

- React: `import { useState, useEffect, useCallback, useRef } from "react";`
- Sin importar `React` por default (no se necesita con la nueva JSX transform de Vite).
- Sin importar tipos de React (`React.FC`, `React.MouseEvent`) salvo cuando se usan explícitamente.

## Componentes "soberanos" copiados desde fuente externa

Cuando un componente proviene de una fuente externa (ej. Claude artifacts) y `docs/architecture.md` lo declara soberano (no se refactoriza), el archivo lleva `// @ts-nocheck` en la primera línea. No es licencia para escribir nuevo código sin types — solo para preservar el original.

Bugs reales del archivo soberano (ej. dependencias inexistentes en producción como `window.storage`) **no se arreglan editando el archivo**: se aprovecha que el código ya tiene un fallback (`if (window.storage) {...} else { localStorage... }`), y se confía en que la rama falsa cubre el caso real del browser.

## CSS / Styling

- **Inline styles vía objeto** (no clases). El componente original usa `style={{ background: P.cream, padding: 12 }}`.
- Animaciones globales declaradas en `<FontLoader />` como `@keyframes`.
- No agregar `index.css`, `App.css`, ni archivos de estilos globales. Si Vite genera uno por defecto, eliminarlo.
