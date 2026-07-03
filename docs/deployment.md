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
| `ADMIN_PASSWORD_HASH` | Admin panel login — bcrypt hash of the password (never the plain password) |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie (random, 32+ chars) |
| `ORDER_ACCESS_SECRET` | Optional. Signs the order-ownership cookie; falls back to `ADMIN_SESSION_SECRET` |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | iyzico Checkout Form credentials. Empty → payment step runs in local mock mode |
| `IYZICO_BASE_URL` | `https://sandbox-api.iyzipay.com` (default) or `https://api.iyzipay.com` (live). Keys and base URL must match |
| `IYZICO_INSTALLMENTS` | Optional. Comma-separated installment options (e.g. `1,2,3`); empty = single payment |
| `RESEND_API_KEY` | Order notification e-mails. Empty → notifications silently skipped |
| `ORDER_EMAIL_FROM` / `ORDER_EMAIL_TO` | Sender identity / seller notification address |
| `ORDER_EMAIL_CUSTOMER` | `1` → also send the buyer a confirmation e-mail (requires verified domain in Resend) |
| `SITE_URL` | Public base URL for payment callbacks and e-mail links. Empty in prod → defaults to `https://www.maiamari.art`; set to the tunnel URL during local sandbox testing |
| `NEXT_PUBLIC_CHECKOUT_ENABLED` | `1` opens cart/checkout to visitors. **Build-time inlined**: after changing it in Vercel, redeploy **without build cache** or the old value may persist |

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

`.github/workflows/ci.yml` runs on every pull request and on pushes to `master`. It installs dependencies with `npm ci`, then runs `npm run lint`, `npm run test:unit` (payment signature unit tests via `tsx --test`), `npm run build` and the Playwright smoke tests (`npm run test:e2e`). The workflow is intentionally minimal: it guards against broken builds and regressions without adding deployment logic (Vercel owns deployment).

## Release workflow

Releases follow a `vX.Y` semver tag scheme, kept in sync with the `version` field in `package.json`.

After a change is merged to `master` and verified:

```bash
git tag v1.25
git push origin v1.25
```

Bump `package.json` `version` to match the tag (for example `1.25.0`) in the same release commit so the package metadata and the git tag never disagree.

> Pushing to `master` and pushing tags require explicit approval. Do not push without it.
