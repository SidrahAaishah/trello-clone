# Trello Clone — Deployment Guide

This document walks you through shipping the Trello Clone to production. The
recommended setup is:

| Piece | Provider | Plan | Why |
|---|---|---|---|
| PostgreSQL 16 | **Neon** | Free | Serverless Postgres, branching, generous free tier |
| Express API | **Render** (Docker) | Free | First-class Docker, simple env vars, free web service |
| React SPA | **Vercel** | Hobby | Fast global edge, zero-config for Vite |
| CI | **GitHub Actions** | Free | Lint, typecheck, build on every PR |

You can substitute any of these (Railway, Fly.io, Supabase, Netlify) without
changing the application code.

---

## 0. Prerequisites

- Node.js 20+ and pnpm 9 (`corepack enable && corepack prepare pnpm@9 --activate`)
- A GitHub account with this repo pushed to `origin`
- Free accounts on [Neon](https://neon.tech), [Render](https://render.com),
  and [Vercel](https://vercel.com)

Verify local tooling:

```bash
node -v   # v20.x
pnpm -v   # 9.x
```

---

## 1. Local smoke test (optional but recommended)

Before deploying, make sure everything builds and seeds locally.

```bash
# 1. Start Postgres
docker compose up -d db

# 2. Install, build shared, run migrations + seed
pnpm install
pnpm shared:build
pnpm --filter api exec prisma migrate dev --name init
pnpm db:seed

# 3. Run both apps
pnpm dev
```

Visit `http://localhost:5173` — you should see the seeded **Product Launch** board.

Production-style build:

```bash
pnpm build
pnpm --filter api exec node dist/index.js   # API on :4000
pnpm --filter web exec vite preview          # Web on :4173
```

---

## 2. Provision the database (Neon)

1. Sign in at <https://neon.tech> → **Create project**.
2. Region: pick the one closest to where Render will run (e.g. `us-east-2`).
3. Postgres version: **16**.
4. After creation, copy the **Pooled connection string** under *Connection
   Details*. It looks like:

   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   ```

   Keep this as **`DATABASE_URL`**. You'll paste it into Render in a moment.

5. (Optional but recommended) Create a second, non-pooled connection string for
   migrations — Neon surfaces it as *Direct connection*. Save it as
   `DIRECT_URL` if you want migrations to bypass the pooler.

> **Tip:** Neon's free tier puts the DB to sleep after inactivity. The first
> request after a cold start may take ~1 s.

---

## 3. Deploy the API (Render)

The repo ships with `render.yaml` at the root, so you can use **Blueprints**
to provision everything in one click.

### Option A — Blueprint (recommended)

1. Push the repo to GitHub.
2. Go to Render → **New +** → **Blueprint**.
3. Point it at your repo. Render detects `render.yaml` and previews the
   services it will create (`trello-clone-api` + `trello-clone-db`).
4. Click **Apply**.

   > If you already created a Neon DB and want to keep using it instead of
   > the managed Render Postgres, **delete the `databases:` block** from
   > `render.yaml` and set `DATABASE_URL` as a plain env var in step 5 below.

5. After the service is created, go to **Environment** and verify/set:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string (or auto-filled from `trello-clone-db`) |
   | `CORS_ORIGIN` | Your Vercel URL (set after step 4, e.g. `https://trello-clone.vercel.app`) |
   | `DEFAULT_USER_ID` | `user_default` |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |

6. Render will build the Docker image and run
   `prisma migrate deploy && node dist/index.js`. The health check hits
   `/health`. Wait for the **Live** badge.

7. Seed the database **once** from the Render shell (under the service
   → **Shell** tab):

   ```bash
   cd apps/api
   pnpm exec prisma db seed
   ```

   Seeding is idempotent — re-running it won't duplicate data (it upserts by
   fixed IDs).

8. Note the public URL Render gives you, e.g.
   `https://trello-clone-api.onrender.com`. You'll need it for the frontend.

### Option B — Manual Docker service

If you prefer not to use Blueprints:

1. Render → **New +** → **Web Service** → connect the repo.
2. **Runtime:** Docker. **Dockerfile path:** `apps/api/Dockerfile`.
   **Docker build context:** `.` (repo root).
3. **Health check path:** `/health`.
4. Add the env vars from the table above.
5. Deploy.

---

## 4. Deploy the web app (Vercel)

### 4.1 Import the repo

1. Vercel dashboard → **Add New… → Project** → pick this repo.
2. **Framework Preset:** *Other* (vercel.json controls the build).
3. **Root Directory:** leave as the repo root (**do not** pick `apps/web`).
   The build command in `vercel.json` handles the monorepo for you.
4. Vercel should auto-detect `vercel.json` — nothing to tweak on the build
   settings.

### 4.2 Environment variables

Under **Project Settings → Environment Variables** add:

| Name | Value | Environments |
|---|---|---|
| `VITE_API_URL` | `https://trello-clone-api.onrender.com` (your Render URL, **no trailing slash**) | Production, Preview |

Redeploy.

### 4.3 Wire the origin back to Render

Go back to Render and set `CORS_ORIGIN` to your Vercel URL
(e.g. `https://trello-clone.vercel.app`). Trigger a **Manual Deploy →
Deploy latest commit** so CORS picks up the new origin.

---

## 5. First-time verification

Visit your Vercel URL. You should see:

1. **BoardsHome** with the seeded *Product Launch* board.
2. Clicking in opens the Kanban view with four lists and sample cards.
3. Drag-and-drop persists across refreshes (confirm in Neon SQL editor:
   `SELECT id, title, position, "listId" FROM "Card" ORDER BY position;`).
4. Opening a card shows labels, members, checklist, comments, and activity.
5. Top-bar search returns live suggestions.

If you get a CORS error, re-check `CORS_ORIGIN` on Render.
If you get `ECONNREFUSED`, re-check `VITE_API_URL` on Vercel.

---

## 6. CI (GitHub Actions)

`.github/workflows/ci.yml` runs on every push and PR to `main`:

- Spins up an ephemeral Postgres 16 container
- `pnpm install` → build shared → prisma generate + migrate → lint → typecheck → build

No secrets required — CI uses the in-workflow Postgres service.

For **continuous deployment**, both Render and Vercel auto-deploy when `main`
is updated (controlled in their dashboards). To gate deploys on green CI,
enable *"Only deploy if all required checks pass"* in your Vercel branch
protection rules.

---

## 7. Environment variable reference

### API (`apps/api/.env`)

```env
DATABASE_URL=postgresql://user:pass@host:5432/trello_clone?schema=public
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://trello-clone.vercel.app
DEFAULT_USER_ID=user_default
```

### Web (`apps/web/.env`)

```env
VITE_API_URL=https://trello-clone-api.onrender.com
```

---

## 8. Running migrations in production

Migrations run automatically on container start via the Dockerfile
`CMD`:

```
pnpm exec prisma migrate deploy && node dist/index.js
```

If a migration ever fails, Render marks the deploy as failed and keeps the
previous image live — your service stays up while you fix the migration.

To create a new migration locally:

```bash
pnpm --filter api exec prisma migrate dev --name add_cover_emoji
git add apps/api/prisma/migrations
git commit -m "migration: add cover emoji"
git push
```

The next Render deploy will run `migrate deploy` and apply it.

---

## 9. Common issues

| Symptom | Fix |
|---|---|
| `PrismaClientInitializationError: Can't reach database server` | `DATABASE_URL` missing or IP not allowed. Use Neon's pooled URL; Neon allows any origin by default. |
| Web app shows blank page, console: `CORS policy` | Render's `CORS_ORIGIN` doesn't match your Vercel URL (include `https://`, no trailing `/`). |
| Drag-and-drop stops updating positions | Positions rebalance automatically when the gap drops below `MIN_POSITION_GAP`. If it still misbehaves, run `ANALYZE "Card";` to refresh planner stats. |
| Render free web service sleeps | Paid plan or use a cron (e.g. `curl https://.../health` every 10 min). Alternatively, deploy to Fly.io or Railway. |
| Prisma "binary not found" in Docker | The Dockerfile installs `openssl` — make sure you didn't swap the base image to Alpine; if you must, also add `apt-add-repository` equivalents for glibc. |

---

## 10. Cleanup

- **Neon:** *Project → Settings → Delete project*.
- **Render:** *Service → Settings → Delete Service* + delete the DB.
- **Vercel:** *Project → Settings → Delete Project*.

That's it. One coordinated `git push` → CI runs → Render rebuilds the API
image → Vercel rebuilds the SPA → everyone ships.
