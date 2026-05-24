# Impl — feature 4: vercel_deploy

## Archivos creados / tocados

- `vercel.json` — config Vite + SPA rewrite + cache headers para `/assets/*`.
- `.gitignore` — añadido `*.tsbuildinfo`, `.vite-preview.log`, `.vercel` (este último tras `vercel link`).
- Repo creado: `https://github.com/helljei/porta-virtus` (público, rama `main`).
- Proyecto Vercel: `welcomerh/porta-virtus`, alias `porta-virtus.vercel.app`.

## Pasos ejecutados

1. `git init -b main`, `git config user.email febija20@gmail.com` (regla [[project_info_cv]] sobre Vercel + email febija20).
2. Commit inicial con 35 archivos / 5351 líneas.
3. `gh repo create helljei/porta-virtus --public --source=. --remote=origin --push` → repo creado y código pusheado a `main`.
4. `vercel link --yes --project porta-virtus --scope welcomerh` → proyecto creado bajo el scope `welcomerh` (mismo que Welcome RH / INFO CV). La auto-conexión a GitHub falló porque el OAuth de la cuenta Vercel `welcomerh` no tiene acceso al usuario `helljei`. **No es bloqueante** — el deploy se hizo directo desde local con `vercel deploy --prod --yes`.
5. `vercel deploy --prod --yes` → build remoto (tsc + vite build), deployment `dpl_2eb9ATeCgnJpvakFmx3vsAa6K1dr` en estado READY, alias `porta-virtus.vercel.app` asignado.

## Verificación

```
GET https://porta-virtus.vercel.app
Status: 200
Content length: 529 bytes
Title: Porta Virtus
Has root div: yes
Has built JS bundle: yes (/assets/index-B5IO3CO9.js)
```

El hash del bundle coincide con el de `npm run build` local (`index-B5IO3CO9.js`), confirmando paridad local ↔ prod.

## Acceptance

- [x] `vercel.json` con framework Vite y rewrites SPA.
- [x] Repo `helljei/porta-virtus` existe en `main`.
- [x] Vercel project conectado al código (vía `vercel link`, no GitHub auto — limitación de cross-account OAuth).
- [x] `https://porta-virtus.vercel.app` responde 200 con HTML correcto.
- [x] UI coincide con `npm run preview` local (mismo bundle hash).

## Pendiente para el usuario (no bloqueante)

- Si quiere CI/CD automático en cada push, debe ir al dashboard Vercel y conectar manualmente la integración GitHub con permisos sobre `helljei/*`. Mientras tanto, cada nuevo deploy requiere `vercel deploy --prod` desde local.
- Smoke manual de UI (crear hábito, marcar, recargar) sigue siendo responsabilidad del usuario; los 3 tests automáticos cubren la base.
