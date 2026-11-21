# 🌹 Flores de Acho

Mercado de flores en línea para el **Mercado de Flores de Acho** (Rímac, Lima): catálogo digital de los puestos,
carrito con **precio mayorista automático**, pedidos por puesto, **pagos digitales** (simulados), **recojo o delivery
por distrito** y un **panel para comerciantes**.

Proyecto Final de Carrera III – Práctica Calificada 2.

| Enlace | URL |
|---|---|
| Solución desplegada | _(completar con la URL de Vercel)_ |
| Repositorio GitHub | _(completar)_ |
| Proyecto Jira | _(completar)_ |

## El problema

Acho concentra cientos de puestos que venden rosas, girasoles, arreglos y coronas a precio mayorista, con picos de
demanda en San Valentín, Día de la Madre y Todos los Santos. Casi toda la venta es presencial: no hay catálogo en
línea, ni canal de pedidos, pagos o delivery. Flores de Acho da presencia digital a los comerciantes y permite
comprar a distancia.

## Stack

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript estricto · Tailwind CSS · componentes shadcn/ui (Radix) · Lucide
- **Backend:** Next.js Route Handlers (Node.js) con API REST JSON, en capas (API → servicios → repositorio)
- **Seguridad:** Zod, JWT HS256 con roles, scrypt, sanitización XSS, rate limiting, cabeceras HTTP (CSP, X-Frame-Options…)
- **Datos:** PostgreSQL (Supabase) mediante patrón Repository; repositorio en memoria con datos de ejemplo para demo y pruebas
- **Calidad / DevSecOps:** Vitest, ESLint + `eslint-plugin-security`, CodeQL, `npm audit`, Gitleaks, GitHub Actions, Dependabot

## Arquitectura

Arquitectura en capas (presentación → API → negocio → persistencia → BD). Diagrama lógico, especificación de
componentes, decisiones (ADR) y DevSecOps por fase en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Documentación de gestión (Jira)

- [`docs/BACKLOG.md`](docs/BACKLOG.md): 6 épicas, 24 historias (Como/quiero/para + Dado/Cuando/Entonces), story points y MoSCoW.
- [`docs/jira-backlog.csv`](docs/jira-backlog.csv): archivo para importar el backlog a Jira.
- [`docs/SPRINTS.md`](docs/SPRINTS.md): 4 sprints, burndown, velocidad, Gantt y Kanban con límites WIP.

## Ejecutar en local

Windows: doble clic en `iniciar.bat` (instala dependencias, crea `.env.local` y abre el navegador).

```bash
npm install
cp .env.example .env.local   # completar JWT_SECRET
npm run dev                  # http://localhost:3000
```

Sin `DATABASE_URL` la app usa datos **en memoria** (se pierden al reiniciar). Con `DATABASE_URL` usa PostgreSQL.

Cuentas: regístrate en `/login` como **cliente** o como **comerciante** (nombre del puesto y número, p. ej. `A-12`).
Pagos: Yape/Plin con celular de 9 dígitos que empiece en 9; tarjeta de prueba `4242 4242 4242 4242` (aprobada) o
`4000 0000 0000 0002` (rechazada); contra entrega queda pendiente.

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` | ESLint (incluye reglas de seguridad) |
| `npm run typecheck` | TypeScript estricto |
| `npm test` / `npm run test:coverage` | Pruebas Vitest (con cobertura) |
| `npm run audit:deps` | Análisis de dependencias (SCA) |

## API REST

| Método y ruta | Historias | Descripción | Auth |
|---|---|---|---|
| `GET /api/products` | HU-01, HU-02, HU-05 | Catálogo con búsqueda y filtros (tipo, ocasión, puesto, precio, stock) | No |
| `GET /api/products/:id` | HU-03 | Detalle con precio minorista y mayorista | No |
| `GET /api/stalls` | HU-04 | Directorio de puestos | No |
| `GET /api/delivery-zones` | HU-16 | Distritos con tarifa y tiempo estimado | No |
| `POST /api/orders` | HU-06, 07, 08, 11–15 | Checkout: un pedido por puesto, stock atómico, cobro y delivery | Cliente |
| `GET /api/orders?scope=mine\|stall` | HU-09, HU-20 | Mis pedidos / pedidos de mi puesto | Sí |
| `PATCH /api/orders/:id` | HU-10, HU-17, HU-20 | `cancel` (cliente, solo pendiente) / `advance` (comerciante) | Sí |
| `GET /api/merchant/stall` | HU-21 | Mi puesto, productos y resumen de ventas | Comerciante |
| `POST /api/merchant/products` | HU-18 | Publicar producto | Comerciante |
| `PATCH /api/merchant/products/:id` | HU-19 | Editar precio, stock o visibilidad (solo del propio puesto) | Comerciante |
| `POST /api/auth` | HU-22 | `{ mode: "register" \| "login" }` → JWT | No |
| `GET /api/health` | — | Monitoreo | No |

Códigos usados: `400` validación, `401` sin sesión/token inválido, `402` pago rechazado, `403` sin permiso,
`404`, `409` conflicto (stock, duplicado, estado), `413` cuerpo grande, `429` rate limit.

## Seguridad implementada

| Control | Dónde |
|---|---|
| Validación estricta de entradas (teléfono, tarjeta con Luhn, distrito, cantidades) | `src/lib/validation.ts` (Zod) |
| Sanitización contra XSS | `sanitizeText` + escape de React |
| Autenticación JWT HS256 con rol (rechaza `alg: none`, expiración 2 h) | `src/lib/auth.ts` |
| Contraseñas con scrypt + sal; política mínima | `src/lib/auth.ts`, `validation.ts` |
| Control de acceso por rol (`requireRole` → 403) y por recurso (propietario del puesto/pedido) | `src/lib/http.ts`, `src/services/` |
| Rate limiting en login, checkout y escritura | `src/lib/http.ts` |
| No se almacenan datos de tarjeta: solo método, estado y referencia | `src/services/payment.service.ts` |
| Consultas SQL parametrizadas + RLS activo | `src/lib/repo/postgres.ts`, `db/schema.sql` |
| Cabeceras HTTP (CSP, X-Frame-Options, nosniff, Referrer-Policy, HSTS) | `next.config.mjs` |
| Errores sin trazas internas + logs estructurados | `src/lib/http.ts` |
| Secretos fuera del repo | `.gitignore`, `.env.example`, GitHub Secrets |

## Pipeline CI/CD (`.github/workflows/ci.yml`)

```
push/PR a test|main ─► SAST+Lint+Typecheck ─┐
                       SCA (npm audit)      ├─► Build ─► Tests (Vitest) ─► Deploy (solo main)
                       Secretos (Gitleaks)  ─┘
```

- **SAST:** ESLint con `eslint-plugin-security` + workflow `codeql.yml` (CodeQL `security-extended`).
- **SCA:** `npm audit --audit-level=high` bloquea el pipeline con CVEs altos/críticos; Dependabot abre PRs de actualización.
- **Secretos:** Gitleaks escanea todo el historial.
- **Tests:** 56 pruebas unitarias y de integración de la API (cobertura ~91 %); el resumen se ve en la ejecución.
- **Deploy:** solo en `main` y tras pasar todo lo anterior.

## Despliegue (Vercel + Supabase)

1. **Supabase:** crear proyecto → SQL Editor → ejecutar `db/schema.sql`. Copiar la cadena *Transaction pooler*
   (Project Settings → Database) como `DATABASE_URL` y, si se requiere, el certificado CA como `DATABASE_CA` (texto PEM).
2. **Vercel:** importar el repo de GitHub → variables de entorno `JWT_SECRET` (≥ 32 caracteres), `DATABASE_URL`, `DATABASE_CA`.
   Cada push a `main` despliega a producción.
3. *(Opcional)* deploy desde Actions: secretos `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Sin `DATABASE_URL`, el despliegue funciona en modo demo (memoria): en serverless los datos pueden reiniciarse entre invocaciones.
En producción `JWT_SECRET` es obligatorio (la app no arranca sin él).

## Estrategia de ramas

- `main`: producción (protegida; solo se actualiza mediante Pull Request).
- `test`: integración y pruebas; el pipeline corre en cada push.
- Ramas de trabajo `feature/*` → PR a `test` → PR de `test` a `main`.
- Commits descriptivos con prefijos `feat:`, `fix:`, `test:`, `ci:`, `docs:`, `chore:`.

Ver `docs/FLUJO-GIT.md`.

## Limitaciones conocidas

- La **pasarela de pagos es simulada** (`SimulatedGateway`): no mueve dinero. La interfaz `PaymentGateway` permite
  reemplazarla por Culqi, Niubiz o la API de Yape/Plin sin tocar el resto del código.
- Los datos de puestos y productos son **ilustrativos**; en producción los cargarían los propios comerciantes.
- El rate limiting es en memoria por instancia; en producción real se usaría Redis/Upstash.
- `PostgresRepository` está implementado con SQL parametrizado y esquema incluido, pero las pruebas automáticas
  corren contra el repositorio en memoria.
