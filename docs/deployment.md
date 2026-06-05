# Deployment

## Hosting

The site is hosted on **Vercel** and auto-deploys on every push to the `master` branch. Production domain: [www.maiamari.art](https://www.maiamari.art).

## Environment variables

Content is served from a **Supabase Postgres** database at runtime, with the admin panel and image uploads relying on secrets. These must be set in the Vercel project (**Production** and **Preview**). See [`.env.example`](../.env.example) for the full list and format:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres (Transaction pooler, port 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; image upload to Storage. Never exposed to the client. |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name (`product-images`) |
| `ADMIN_PASSWORD` | Admin panel login |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie (random, 32+ chars) |

> **The build never connects to the database.** During `next build` (`NEXT_PHASE=phase-production-build`) the data layer falls back to `data/*.json`, so static generation is fast and never blocked by the connection pool. The database is authoritative at **runtime** (ISR / on-demand); admin edits refresh pages via `revalidatePath`. Because of this, the build still succeeds even if `DATABASE_URL` is unset — but then the live site would serve JSON instead of DB content, so the variables above must be present in Vercel.

Secrets live only in `.env.local` (gitignored) locally and in the Vercel dashboard in production. Never commit them.

## Build commands

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint |

Any host that supports Next.js 16 (Node.js 20+) can serve `npm run build` followed by `npm run start`.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `master`. It installs dependencies with `npm ci`, then runs `npm run lint` and `npm run build`. The workflow is intentionally minimal: it guards against broken builds and lint regressions without adding deployment logic (Vercel owns deployment).

## Release workflow

Releases follow a `vX.Y` semver tag scheme, kept in sync with the `version` field in `package.json`.

After a change is merged to `master` and verified:

```bash
git tag v1.25
git push origin v1.25
```

Bump `package.json` `version` to match the tag (for example `1.25.0`) in the same release commit so the package metadata and the git tag never disagree.

> Pushing to `master` and pushing tags require explicit approval. Do not push without it.
