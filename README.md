# 🛰️ Facility Intelligence — Sustainable Estate Dashboard

AI-assisted decision dashboard for government/institutional facilities across India:
air quality, waste, energy, water, traffic, assets, safety and sustainability — with
3D digital-twin visualizations rendered from Blender-generated GLB assets.

> **Scope note** — all demo data is synthetic and generated in-browser by a mock API.
> Outputs are *decision-support insights*, never official measurements.

---

## Quick start

```bash
npm install
npm run dev            # → http://127.0.0.1:5173  (mock API mode, fully offline)
```

Log in with any demo role button on the login page (`admin@demo.gov.in` /
`operator@demo.gov.in` / `analyst@demo.gov.in`, password `Facility@2026`).
Sessions are kept in memory only and auto-expire when idle (30 min, warning at 2 min).

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (mock API on) |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit + security test suite (Vitest) |
| `npm run lint` | ESLint (security-focused ruleset) |
| `npm run blender:models` | Regenerate all 9 GLB assets via headless Blender |

---

## Tech stack

- **React 18 + TypeScript (strict)** on **Vite 5**
- **Tailwind CSS** + custom glassmorphism / animation layers
- **Three.js + @react-three/fiber + drei** for 3D (`GLB` from Blender)
- **Recharts** for trends, gauges and heatmaps
- **Framer Motion** for UI choreography
- **TanStack Query** (cache/refetch) + **Zustand** (UI/session state)
- **React Hook Form + Zod** for validated forms
- **Vitest** for unit & security tests

## Architecture

```
src/
├─ components/
│  ├─ Dashboard/   layout shell, sidebar, header/footer, mobile bottom nav
│  ├─ ModuleCards/ MetricCard · AnomalyBadge · RecommendationCard · ForecastPanel
│  ├─ Charts/      Line · Bar · Gauge · Heatmap
│  ├─ 3D/          Scene3D · ModelLoader · AnimatedModel · ModuleViz3D · procedural fallbacks
│  ├─ Maps/        (geospatial views — roadmap)
│  ├─ Modals/      DetailModal (anomaly / recommendation detail)
│  └─ Common/      ErrorBoundary · loaders · toasts · ThemeToggle · ProtectedRoute
├─ pages/          Login · Dashboard · ModuleDetail · Settings · 404
├─ hooks/          useApi · useAuth · useRateLimit · useTheme · useWindowSize · use3DLoading
├─ services/       api (axios+interceptors) · apiClient · auth · mockApi · encryption · cache
├─ store/          authStore · dashboardStore · settingsStore · notificationStore
├─ utils/          validators · sanitizers · rateLimiter · errorHandlers · formatters ·
│                  performanceMonitor
├─ config/         environment · constants · apiEndpoints
└─ types/          shared contracts incl. blender.ts (asset manifest)
blender/scripts/   generate_all_models.py (headless build+export pipeline)
public/models/     9 optimized GLB assets (≈0.7 MB total)
tests/             unit + security suites
```

### Mock API ↔ real backend

`src/services/apiClient.ts` is the single data gateway. When `VITE_USE_MOCK_API=true`
it serves deterministic synthetic data from `services/mockApi.ts`; otherwise every
call goes through the hardened axios instance in `services/api.ts`:

- httpOnly refresh-cookie auth (`credentials: include`)
- CSRF header from the server-injected `<meta name="csrf-token">`
- `X-Requested-With` / `X-API-Version` security headers
- automatic access-token refresh on 401, friendly 429 handling
- all errors collapsed to generic, non-leaking messages

**API contract** (endpoints in `src/config/apiEndpoints.ts`) — coordinate path/shape
changes there and in `types/`:

```
POST /api/v1/auth/login | refresh-token | logout | password-reset
GET  /api/v1/facilities/{id}/dashboard | summary | alerts | anomalies | recommendations
GET  /api/v1/facilities/{id}/modules/{moduleId}          (air-quality | waste | energy |
                                                          water | traffic | assets |
                                                          safety | sustainability)
GET  /api/v1/facilities/{id}/forecast/{moduleId}
GET  /api/v1/facilities/{id}/map/zones | map/hotspots
GET/POST/PUT /api/v1/admin/users | settings | audit-log
```

## Security model

| Threat | Control |
|---|---|
| Stored / reflected XSS | `sanitizeDeep()` (DOMPurify, tags+attrs stripped) on **every** API payload; CSP in `index.html`; no `dangerouslySetInnerHTML` |
| Token theft | Access JWT in memory only; refresh token is an httpOnly, Secure, SameSite=Strict cookie set by the backend |
| Session hijack / idle misuse | Idle-timeout watcher warns at 2 min, signs out at 30 min |
| CSRF | Backend cookie + `X-CSRF-Token` header pattern |
| Brute force / hammering | Client `RateLimiter` per surface (login 5/15 min, API 100/min) — backend remains authoritative |
| Malicious uploads | MIME + size + **magic-byte** validation (Zod utilities) |
| Info leakage | Central `getErrorMessage()` — generic user text, technical detail only to console/monitoring |
| Supply chain | Pinned versions, `eslint-plugin-security`, npm audit in CI |

## 3D / Blender pipeline

`blender/scripts/generate_all_models.py` builds all nine models **procedurally**
(headless, no .blend files required) with PBR materials and 10-second looping
animations, then exports GLB with Draco when available:

```bash
npm run blender:models                          # all models → public/models
blender --background --python blender/scripts/generate_all_models.py -- \
  --out public/models --only energy-flow,waste-station   # subset
```

Models are data-bound in the app: named nodes (`Core`, `WaterLevel`, `Fill_3`,
`Hotspot`, `Beacon`, `Needle`, …) respond to live module values via
`components/3D/AnimatedModel.tsx` (colour / scale / rotation / level), while baked
clips (spins, pulses, drifting particles) loop ambiently. See `blender/README.md`.

If a GLB is missing, `ModuleViz3D` automatically falls back to a hand-built
procedural Three.js twin, so the dashboard never renders an empty panel.

## Performance

- Route-based code splitting (`React.lazy`) + manual vendor chunks
- 3D chunk loads **only** on pages that render a scene (login hero, dashboard, modules)
- Lazy GLB loading per module with size budgets (warn >2 MB; current total ≈0.7 MB)
- Production build: main JS ≈ **48 KB gzip**; three.js chunk ≈ **247 KB gzip**, off the critical path
- `prefers-reduced-motion` respected in CSS and the settings toggle
- Responsive from 360 px phones (bottom nav, 48 px touch targets) to 4K (`≥1920px`
  containment, larger root font)

## Environment

Copy `.env.example` → `.env.local` (dev) / `.env.production`. All values are
non-secret client config; real secrets belong to the backend only.

## Disclaimer

Figures, forecasts and recommendations are synthetic demonstration outputs with
stated assumptions. Validate with on-site teams before operational action.
