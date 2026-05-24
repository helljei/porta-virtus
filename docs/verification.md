# Verificación

> El agente no dice "funciona", lo demuestra.

## Nivel 1 — Tests unitarios (obligatorio)

- Toda función pública (componente, función exportada) tiene al menos un test.
- Cubre camino feliz Y al menos un camino de error/edge.
- Para `PortaVirtus`, el caso mínimo es: monta sin throw + presencia de un texto visible.
- Comando exacto: `npm test -- --run`

## Nivel 2 — Test de integración (obligatorio)

- Monta `<PortaVirtus />` real en jsdom.
- Usa `localStorage` real (no mock).
- Verifica al menos:
  - Renderiza el header/título "Porta Virtus" (o el equivalente que use el componente).
  - Se puede navegar a otra tab (click + verificar contenido).
  - El estado persiste tras un `unmount` + remount (simula reload).

Ejemplo esperado:

```tsx
import { render, screen } from "@testing-library/react";
import PortaVirtus from "../src/PortaVirtus";

beforeEach(() => localStorage.clear());

test("renders without crashing", () => {
  render(<PortaVirtus />);
  expect(screen.getByText(/porta virtus/i)).toBeTruthy();
});
```

## Nivel 3 — Smoke test manual (recomendado antes de deploy)

Flujo end-to-end en browser local:

1. `npm run dev`
2. Abrir `http://localhost:5173`
3. Verificar que carga sin errores en consola del navegador
4. Crear un hábito nuevo en la tab Tasks
5. Marcarlo como cumplido en la tab Today
6. Recargar (F5) → el hábito y la marca deben persistir
7. Navegar todas las tabs (Today, Week, Monthly, Annual, Badges, Insights, Tasks, Guide)
8. Verificar que ninguna tab lanza error en consola

## Smoke test post-deploy

Después de `vercel --prod`:

1. Abrir `https://porta-virtus.vercel.app`
2. Repetir pasos 3-8 del smoke manual
3. Verificar Lighthouse score básico (Performance > 80, no errors)
4. Verificar que el favicon y el `<title>` aparecen correctamente

## Anti-patrones (NO HACER)

- ❌ "He añadido el componente, debería funcionar." → falta test ejecutable.
- ❌ Test que solo verifica `expect(true).toBe(true)`. → debe verificar comportamiento real.
- ❌ Mock de `localStorage`. → jsdom ya lo provee.
- ❌ Marcar la feature como `done` sin pasar `node init.mjs`.
- ❌ Declarar deploy `done` sin hacer un `curl -I` o navegación manual a la URL pública.

## Verificación final antes de cerrar sesión

`node init.mjs` → debe terminar con `[OK]`.
