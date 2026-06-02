# Deployment

## Hosting

The site is hosted on **Vercel** and auto-deploys on every push to the `master` branch. Production domain: [www.maiamari.art](https://www.maiamari.art).

No environment variables are required for a standard build: all content is static JSON read at build time.

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
