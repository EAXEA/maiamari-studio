# Maiamari Studio

The official website for **Maiamari Baskı Atölyesi**, a printmaking studio in Çankaya, Ankara, and a showcase for the work of artist Duygu Sinan.

It combines four things in one editorial site: a curated **gallery** of print series, a **shop** for studio materials and gift items, a **workshop program**, and a **journal** documenting the studio. The interface language is Turkish.

🔗 **Live:** [www.maiamari.art](https://www.maiamari.art)

---

## Overview

Maiamari Studio is a content-driven marketing and catalog site. There is no runtime database: all content (series, artworks, products, journal entries, business details) lives as JSON in `data/` and is read at build time, which keeps the site fully static, fast, and cheap to host.

The design follows an editorial, gallery-like language: a cream-white ground, walnut accents, and the Cormorant Garamond and Inter typefaces. Gallery artworks are always presented uncropped in a passe-partout frame, while studio photography fills its frame for atmosphere.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Motion | [Framer Motion 12](https://www.framer.com/motion/) |
| Search | [Fuse.js](https://www.fusejs.io) (typo-tolerant fuzzy search) |
| Tooling | [Playwright](https://playwright.dev) for preview and screenshot scripts |
| Language | TypeScript |
| Hosting | [Vercel](https://vercel.com) |

## Features

- **Gallery** — eight print series, each work rendered uncropped with a full museum label (artist, series, technique, paper, year, edition) and a keyboard-navigable lightbox.
- **Shop** — product catalog organized by category, with detail pages, related products, and optional usage tutorials.
- **Workshops** (`/atolyeler`) — the studio's recurring workshop program.
- **Journal** — a chronological timeline of studio milestones and events.
- **Handmade paper guide** (`/kagit`) — an illustrated, step-by-step walkthrough.
- **Site search** — fuzzy autocomplete across products, series, the artist, and instructors.
- **SEO** — dynamic per-page Open Graph images (Satori / `next/og`), JSON-LD structured data (Store, Product, VisualArtwork, CollectionPage, Breadcrumb), plus a generated sitemap and robots rules.
- **Brand watermark system** — a single CSS-variable-driven watermark reused across components for one shared decode and GPU texture.

## Folder Structure

```
maimari-studio/
├── app/                 # App Router: routes, layouts, dynamic OG images
│   ├── about/           # Studio story
│   ├── api/             # Search endpoint
│   ├── atolyeler/       # Workshops
│   ├── cart/            # Cart (placeholder)
│   ├── contact/         # Contact and visit
│   ├── galeri/          # Gallery landing + [series] pages
│   ├── journal/         # Studio journal
│   ├── kagit/           # Handmade paper guide
│   ├── shop/            # Shop landing + [category] pages
│   └── urun/            # Product detail [slug] pages
├── components/          # Editorial sections, portfolio, brand, layout, inquiry CTAs
├── lib/                 # Data access (server-only), structured data, OG image, contact
├── data/               # JSON source of truth (business, portfolio, series, journal, products)
├── public/              # Images and brand assets
├── scripts/             # Image pipeline (HEIC→JPG) and Playwright helpers
└── assets/              # Fonts used by OG image generation
```

A few conventions worth knowing:

- `data/*.json` is the **source of truth**; the site reads it at build time.
- `lib/data.ts` is **server-only** (it reads from the filesystem) and must not be imported into client components. Client-safe constants live in `lib/contact.ts`.
- Tailwind 4 does not parse arbitrary color tokens like `text-[color:var(--color-x)]`; use an inline `style` for CSS-variable colors instead.

## Development Setup

**Prerequisites:** Node.js 20 or later and npm.

```bash
# install dependencies
npm install

# start the dev server (Turbopack)
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The page hot-reloads as you edit.

## Build Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Deployment

The site is deployed on **Vercel** and auto-deploys on every push to the `master` branch. No environment variables are required for a standard build, since all content is static JSON read at build time. Any platform that supports Next.js 16 (Node.js 20+) will also serve the production build from `npm run build` and `npm run start`.

## License

No open-source license is currently granted. All rights to the content, artwork, and branding are reserved by Maiamari Baskı Atölyesi and Duygu Sinan.
