# Architecture

Maiamari Studio is a content-driven site built on the Next.js 16 App Router with React 19. Content lives in **Supabase Postgres** (managed through `/admin`) and is read at runtime through Drizzle; committed JSON files act as the **build-time and no-database fallback**. Orders (cart/checkout) are DB-only.

## Rendering model

- **App Router** (`app/`) with file-based routing. Dynamic segments are pre-rendered via `generateStaticParams`:
  - `app/galeri/[series]` — one page per print series (8)
  - `app/shop/[category]` — one page per product category
  - `app/urun/[slug]` — one page per product
- **ISR over SSG:** DB-backed public pages export `revalidate = 60` (home, shop, product, gallery) or `dynamic = "force-dynamic"` (`/atolyeler`, `/journal`, `/admin/*`, checkout). Admin mutations additionally trigger surgical `revalidatePath` calls (see `revalidateStore` in `app/admin/actions.ts`) so edits appear immediately.
- Pages are React Server Components by default. Interactivity (lightbox, search, mobile menu, product gallery, cart) is isolated into small client components.
- A single API route, `app/api/search`, backs the site search (ISR, 1h).

## Data flow

```
Supabase Postgres  (operational source of truth; edited via /admin)
     │  lib/db/*  (Drizzle; getDb() → null during build or without DATABASE_URL)
     ▼
lib/data.ts  (server-only getters; fallback chain per entity:
     │        DB  →  data/snapshot/*.json  →  legacy data/*.json)
     ▼
app/**/page.tsx  (Server Components; build prerenders from JSON, runtime is DB-authoritative)
     │
     ▼
components/**  (presentational + small client islands)
```

- **Build-time DB skip:** `lib/db/client.ts` returns `null` while `NEXT_PHASE === "phase-production-build"` so 150+ static pages don't exhaust the Supabase pooler. The whole build therefore renders from JSON; runtime requests re-render DB-authoritative content via ISR.
- **Snapshot fallback:** `npm run db:snapshot` (`scripts/export-snapshot.mjs`) exports the current DB state to `data/snapshot/*.json` in the exact shapes `lib/db/*` mappers produce. Run it before each release so builds prerender fresh content (prices, sold-out flags, panel-added records). The output is committed; never hand-edit it.
- **Legacy JSON:** `data/*.json` (Shopier scrape, art-archive sync) remains the last-resort fallback and the original seed source. Art/series data is still derived from the external archive; if archive and DB conflict, the archive wins and the DB is re-seeded.
- `lib/data.ts` reads JSON from the filesystem with `fs`, so it is **server-only** and must never be imported from a client component.
- Client-safe constants (phone, Instagram, WhatsApp) live in `lib/contact.ts` so client components can import them without pulling in `fs`.

## lib modules

| Module | Responsibility |
| --- | --- |
| `lib/data.ts` | Server-only getters; DB-first with snapshot/legacy JSON fallback |
| `lib/db/*` | Drizzle schema, client (build-skip, pooled singleton), per-entity CRUD, slug repository factory |
| `lib/contact.ts` | Client-safe contact constants and links |
| `lib/types.ts` | Shared TypeScript types (Series, PortfolioWork, Product, …) |
| `lib/structured-data.ts` | JSON-LD builders (Store, Product, VisualArtwork, CollectionPage, Breadcrumb) |
| `lib/og-image.tsx` | Per-page Open Graph image template (Satori / `next/og`) |
| `lib/format.ts` | Formatting helpers (currency, etc.) |
| `lib/workshop-images.ts` | Shared workshop image map |
| `lib/product-tutorials.ts` | Optional per-product tutorial reels |
| `lib/utils.ts` | Generic helpers |

## Component organization

Components are grouped by role under `components/`:

- `sections/` — page-level editorial blocks (`production-hero`, `home-destination-cards`, `feature-banner`, `interest-hero`).
- `portfolio/` — `works-detail-list` (gallery series page: per-work card + lightbox).
- `product/` — `product-card`, `product-gallery` (lightbox), `product-tutorial-reel`.
- `layout/` — `site-header`, `site-footer`, `mobile-menu`.
- `inquiry/` — contact CTAs: `phone-cta` (5 variants), `whatsapp-cta`, `instagram-inquiry-button`.
- `brand/` — `watermark` (single CSS-variable-driven watermark, one shared decode/GPU texture).
- `search/`, `motion/`, `instructor/`, `transit/` — focused single-purpose components.

### Notable component notes

- **`ProductionHero`** is the home hero: a single-focus, full-bleed dark block centered on the "production trace" visual language.
- **`HomeDestinationCards`** is the home 2-card grid (Gallery + Shop). Its prop names (`workshop`/`shop`) are legacy and not semantic; it operates on a generic `Destination` type. The `fit: "cover" | "contain"` prop distinguishes a passe-partout gallery artwork from a cover-filled studio photo.

## SEO infrastructure

- `app/sitemap.ts` and `app/robots.ts` are generated.
- `lib/structured-data.ts` emits JSON-LD across the relevant pages.
- Open Graph images are generated per page with Satori. Constraints: WOFF2 and variable fonts are not supported (use static TTF in `assets/`), and the JSX must use flex layout.

## Image pipeline

Helper scripts under `scripts/` and `data/scripts/` are reproducible, run-on-demand tools (HEIC→JPG conversion, portfolio processing, milestone screenshots). They are not part of the build.
