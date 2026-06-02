# Architecture

Maiamari Studio is a content-driven, statically generated site built on the Next.js 16 App Router with React 19. There is no runtime database: all content is JSON read at build time, which keeps the site fast, cheap to host, and trivial to reason about.

## Rendering model

- **App Router** (`app/`) with file-based routing. Dynamic segments are pre-rendered via `generateStaticParams`:
  - `app/galeri/[series]` — one page per print series (8)
  - `app/shop/[category]` — one page per product category
  - `app/urun/[slug]` — one page per product
- Pages are React Server Components by default. Interactivity (lightbox, search, mobile menu, product gallery) is isolated into small client components.
- A single API route, `app/api/search`, backs the site search.

## Data flow

```
data/*.json  (source of truth, committed)
     │
     ▼
lib/data.ts  (server-only readers: getSeries, getPortfolio, getProducts, …)
     │
     ▼
app/**/page.tsx  (Server Components, build-time render)
     │
     ▼
components/**  (presentational + small client islands)
```

- `lib/data.ts` reads JSON from the filesystem with `fs`, so it is **server-only** and must never be imported from a client component.
- Client-safe constants (phone, Instagram, WhatsApp) live in `lib/contact.ts` so client components can import them without pulling in `fs`.

## lib modules

| Module | Responsibility |
| --- | --- |
| `lib/data.ts` | Server-only data access over `data/*.json` |
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
