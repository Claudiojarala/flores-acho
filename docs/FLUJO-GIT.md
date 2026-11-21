# Flujo de Git sugerido

Crea el repositorio en GitHub (público, o privado compartido con el docente), clona y trabaja así.
Haz los commits **cuando realmente los hagas**; GitHub guarda la fecha real de cada push.

## 1. Rama `main` y rama `test`

```bash
git init -b main
git add README.md .gitignore .env.example package.json package-lock.json tsconfig.json
git commit -m "chore: inicializa proyecto Flores de Acho"
git push -u origin main
git switch -c test
git push -u origin test
```

## 2. Commits por bloques funcionales (en `test`, o en `feature/*` y PR a `test`)

| Orden | Contenido | Mensaje sugerido |
|---|---|---|
| 1 | `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `components.json` | `chore: configura Next.js, TypeScript, Tailwind y ESLint con reglas de seguridad` |
| 2 | `src/lib/data/`, `src/lib/domain/` | `feat: catálogo semilla, zonas de delivery y reglas de precio mayorista (HU-01, HU-07, HU-16)` |
| 3 | `src/lib/validation.ts`, `auth.ts`, `rateLimit.ts`, `http.ts`, `errors.ts`, `sanitize.ts` | `feat(seguridad): validación Zod, sanitización XSS, JWT con roles y rate limiting (HU-22, HU-23, HU-24)` |
| 4 | `src/lib/repo/`, `db/schema.sql` | `feat: patrón Repository con memoria y PostgreSQL (Supabase)` |
| 5 | `src/services/` | `feat: servicios de catálogo, pedidos, pagos y comerciante (HU-02, HU-08, HU-11 a HU-13, HU-18 a HU-20)` |
| 6 | `src/app/api/**` | `feat(api): endpoints de auth, productos, puestos, pedidos y panel del comerciante` |
| 7 | `src/app/`, `src/components/`, `src/hooks/` | `feat(ui): catálogo, carrito, checkout, pedidos y panel del comerciante` |
| 8 | `tests/`, `vitest.config.mts` | `test: pruebas unitarias, de seguridad e integración de la API` |
| 9 | `.github/workflows/`, `dependabot.yml`, `pull_request_template.md` | `ci: pipeline con SAST, SCA, secretos, build, tests y deploy` |
| 10 | `docs/`, README final | `docs: arquitectura, backlog, sprints, README y despliegue` |

El pipeline corre en cada push a `test`. Si algo falla, corrige y vuelve a hacer push (esa evidencia también cuenta).

## 3. Pull Requests

1. Abre un PR `test → main` (plantilla en `.github/pull_request_template.md`).
2. Espera el pipeline en verde (SAST, SCA, secretos, build, tests).
3. Haz merge; el job `deploy` publica en producción.

Recomendado: *Settings → Branches → Add rule* para `main` con "Require a pull request" y
"Require status checks to pass" (`SAST + Lint + Typecheck`, `SCA (npm audit)`, `Tests (Vitest)`).

## 4. Evidencias para el informe

- Pestaña **Actions** con ejecuciones en verde (capturar el resumen de tests).
- Pestaña **Pull requests** con el PR `test → main`.
- Pestaña **Security → Code scanning** (CodeQL) y **Dependabot**.
- `git log --oneline --graph --all`.
- URL de la solución desplegada y `GET /api/health`.
