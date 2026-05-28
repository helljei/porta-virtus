# Impl — feature 9: redesign_favicon_to_torch

## Archivos tocados

- **Reescrito:** `public/favicon.svg` (corona+V → arco+antorcha+llamas, 1174 bytes).
- **Sin cambios:** `index.html` (el path `/favicon.svg` se mantiene; los `<link>` siguen válidos).

## Diseño del SVG nuevo

- viewBox 64x64, fondo crema `#F2EDE4` con rx=8.
- Arco achatado (24x18 elipse superior + bajadas rectas) en stroke `#1B4F8A` width 2.8.
- Llamas en 3 capas concéntricas:
  - Outer (`#FF6B1A` naranja oscuro) con 4 puntas características de fuego.
  - Media (`#FFA533` naranja).
  - Inner (`#FFE066` amarillo) — punto caliente.
- Antorcha en 4 piezas:
  - Copa trapezoidal `#C17F3A` con stroke oscuro `#7A4F1C`.
  - Anillo `<rect>` `#A0622A`.
  - Cuerpo cónico que se afina hacia abajo `#C17F3A`.
  - Punta `#A0622A`.

## Decisiones

- **Nueva feature en lugar de hotfix sobre feature 7.** El harness dice features `done` no se reabren — cada cambio significativo de diseño pasa por su propio ciclo. Feature 7 sigue como `done` en el JSON; queda como registro histórico del diseño previo.
- **Aspect ratio cuadrado.** El arco gótico de la referencia es vertical (4:5), pero un SVG no cuadrado se aplasta en el slot del tab del browser. Comprimí el arco a una elipse 24x18 dentro de un viewBox cuadrado para preservar legibilidad a 16x16.
- **Sin texto.** La letra "P" del primer prompt quedó descartada porque el segundo prompt mostró la imagen final sin texto. La silueta antorcha + arco es autoexplicativa.

## Verificación

```
> npm run build:
    dist/favicon.svg = 1174 bytes (era 1278)
> vercel deploy --prod:
    Deployment ready
> GET https://porta-virtus.vercel.app/favicon.svg:
    Status: 200
    Content-Type: image/svg+xml
    Arc path present, flame outer color present, old V path gone
```

## Acceptance

- [x] `public/favicon.svg` rediseñado con arco + antorcha + llamas.
- [x] Sin cambios en `index.html`.
- [x] `dist/favicon.svg` actualizado tras build.
- [x] GET prod 200 con el nuevo contenido confirmado.
- [/] Legibilidad a 16x16 — verificación visual del usuario (Ctrl+Shift+R).
