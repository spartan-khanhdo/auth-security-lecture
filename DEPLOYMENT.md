# Deployment

This document describes **how this repository is deployed** — the setup, the
reasoning behind it, and the resulting workflow. It is a record of the current
deployment topology, not a step-by-step tutorial.

## Hosting

The site is hosted on **Vercel** as a Next.js (App Router) application. Vercel
auto-detects the framework and uses **pnpm** as the package manager (inferred
from `pnpm-lock.yaml`, which is committed for reproducible installs).

## Repository topology

The code lives in two GitHub repositories:

| Remote | Repository | Owner | Role |
|---|---|---|---|
| `origin` | `spartan-trucle/auth-security-lecture` | Trúc (personal) | **Source of truth** |
| `fork` | `spartan-khanhdo/auth-security-lecture` | Khánh (personal) | **Deployment source** |

Vercel is connected to the **fork** (`spartan-khanhdo`), and that is what
actually builds and serves the site.

### Why deployment goes through a fork

The canonical repository (`spartan-trucle/...`) is a **personal** account repo,
not an organization repo. On a personal account, only the account owner can
install the Vercel GitHub App. The deploying developer (`spartan-khanhdo`) is a
collaborator with `push` access but **not** `admin`, so they cannot install the
Vercel integration on Trúc's account or make that repo importable into their own
Vercel project.

To work around this without requiring the owner's intervention, the repo was
**forked** to `spartan-khanhdo`. The developer owns the fork outright, so the
Vercel GitHub App can be installed there and auto-deploys work normally.

`spartan-trucle/...` remains the single source of truth; the fork is a
deployment mirror.

## Environment variables

Three environment variables are configured in the Vercel project (Production,
Preview, and Development scopes):

| Name | Purpose | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`civtevuomtjdfyqtthds`) | build-time, public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key (`sb_publishable_…`) | build-time, public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (`sb_secret_…`) | server-only |

The two `NEXT_PUBLIC_*` values are required at build time. The service-role
(secret) key is used only on the server (middleware and admin routes) and is
never exposed to the client.

Local values live in `.env` (git-ignored). `.env.example` documents the
required keys.

> Note: the Supabase secret key must use the `sb_secret_…` format. A
> `sb_service_role_…` value is **not** a valid Supabase key.

## Supabase auth configuration

For admin email/password login to work in production, the deployed Vercel
domain is registered in **Supabase → Authentication → URL Configuration**
(Site URL and Redirect URLs).

## Deployment flow

Because the source of truth and the deployment source are different repos, code
moves like this:

```
spartan-trucle (origin)  ──pull──►  local  ──push──►  spartan-khanhdo (fork)  ──►  Vercel
        source of truth                                  deployment mirror          build & host
```

Concretely:

```bash
git pull origin main      # get the latest from the canonical repo
git push fork main        # push to the fork → Vercel auto-builds and deploys
```

- A push to `fork main` triggers a production deployment.
- Pull requests against the fork produce Vercel preview deployments.

## Current sync state

At the time this document was written, all three references were aligned on the
same commit (`pnpm-lock.yaml` + `@eslint/eslintrc` additions present in all):

- `origin/main` (Trúc) — in sync
- `fork/main` (Khánh) — in sync
- local `main` — in sync
