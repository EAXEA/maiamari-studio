@AGENTS.md

# CLAUDE.md

Maiamari Studio — a Next.js 16 printmaking studio site (live at www.maiamari.art). This file holds the rules an AI agent must follow when working in this repo. Long-form documentation lives in [`docs/`](./docs).

## Project rules (must follow)

- **Push only with explicit approval.** Every push to `master` ships a `vX.Y` semver git tag to origin and a matching `package.json` version bump.
- **Do not change application behavior** unless asked. This is a live production site.
- **Art/series data is derived**, synced from an external art source archive into `data/*.json`. Don't hand-edit derived data; change it at the source and re-sync.
- **`data/snapshot/*.json` is generated** by `npm run db:snapshot` (DB → build fallback). Never hand-edit; refresh and commit it before each release.

## Conventions

- `lib/data.ts` is **server-only** (reads from `fs`); never import it into client components. Client-safe constants live in `lib/contact.ts`.
- Tailwind 4 does not parse arbitrary color tokens (`text-[color:var(--color-x)]`); use inline `style={{ color: "var(--color-x)" }}`.
- `data/` lives at the repo root (there is no `web/` subfolder).

## Writing & brand rules

- No em-dash (—) and no "+" in site copy; use a period and a separate sentence.
- Refer to the artist as "Duygu Sinan", never with a "Sanatçı" prefix.
- Gallery artworks are always shown uncropped in a passe-partout frame (`object-contain`); studio photos fill the frame (`object-cover`).
- No showroom / drone / facade / posed-people imagery; keep a "production trace" visual language.

## Documentation map

- [docs/architecture.md](./docs/architecture.md) — system design, data flow, lib modules, components
- [docs/content-model.md](./docs/content-model.md) — `data/*.json` shapes and the source-of-truth sync
- [docs/brand-guidelines.md](./docs/brand-guidelines.md) — visual language, typography, writing and imagery rules
- [docs/deployment.md](./docs/deployment.md) — build, hosting, CI, and the release/tag workflow
