# Trello Clone

A full-stack Kanban board app built for the **Scaler SDE Intern Fullstack Assignment**. Matches the Stitch/Figma design 1:1 and ships the MVP plus selected bonuses (responsive layout, multi-board workspace, comments, activity feed, card covers, board backgrounds including photos + gradients, archived-items drawer, global search, due-date states, a templates gallery with "use this template" instantiation, board filtering/sort, and delete-board flow).

## Tech stack

| Layer | Tech |
|---|---|
| Web | React 18, Vite 5, TypeScript, Tailwind CSS 3, @dnd-kit, TanStack Query v5, Zustand, Radix UI, react-router-dom v6 |
| API | Node 20, Express 4, TypeScript, Zod, Prisma 5 |
| DB  | PostgreSQL 16 (local Docker or Neon serverless) |
| Infra | pnpm 9 monorepo, Docker, GitHub Actions CI |
| Deploy targets | Render (API), Vercel (web), Neon (Postgres) |

## Repo layout

```
trello-clone/
├── apps/
│   ├── api/          # Express + Prisma backend
│   │   ├── prisma/   # schema.prisma, migrations, seed.ts (users, boards, labels, 6 templates)
│   │   └── src/
│   │       ├── index.ts            # express app entry
│   │       ├── middleware/         # auth (default user), error
│   │       ├── routes/             # boards, lists, cards, labels, checklists, comments, activities, search, users, templates
│   │       ├── services/           # mappers, templateMappers, includes, activity, position
│   │       └── lib/                # prisma client, errors
│   └── web/          # Vite + React frontend
│       └── src/
│           ├── App.tsx, main.tsx
│           ├── routes/             # BoardsHome, BoardPage, TemplatesPage, SearchResultsPage, NotFoundPage
│           ├── components/
│           │   ├── board/          # BoardHeader (w/ Delete), BoardCanvas, ListColumn, CardTile, QuickAddCard, AddListColumn, FilterPopover, ArchivedItemsDrawer
│           │   ├── boards/         # BoardTile (w/ hover Delete), CreateBoardDialog (Colors/Photos tabs), BoardsFilterBar
│           │   ├── card/           # CardDetailModal, LabelPicker, MemberPicker, DueDatePicker, CoverPicker, Checklist, CommentList
│           │   ├── templates/      # TemplateCard, CategoryTabs, SortMenu, CreateFromTemplateDialog
│           │   ├── common/         # Avatar, Icon, LabelChip
│           │   └── layout/         # AppShell, TopNav (w/ Starred+Recent links), SideNav
│           ├── hooks/              # useBoard, useBoards, useCard, useArchived, useLabels, useActivities, useSearch, useUsers, useTemplates
│           ├── stores/ui.ts        # Zustand UI store
│           ├── lib/api.ts          # axios instance
│           └── utils/              # due.ts, positions.ts, cn.ts
├── packages/
│   └── shared/       # Zod schemas & inferred TS types shared across web+api
│       └── src/schemas/  # board, list, card, label, member, checklist, comment, activity, search, template, common
├── docker-compose.yml
├── render.yaml
├── vercel.json
├── DEPLOYMENT.md
├── context.md        # ⭐ Deep project context — read first when handing off
└── .github/workflows/ci.yml
```

---

## Quick start (local development)

### Prerequisites
- Node 20+ (`.nvmrc` pins to `20`)
- pnpm 9 (`corepack enable && corepack prepare pnpm@9 --activate`)
- Either **Docker Desktop** (local Postgres) **or** a Neon account (hosted Postgres)

### 1. Install
```bash
pnpm install
```

### 2. Choose a database

**Option A — Docker (local Postgres)**
```bash
docker compose up -d db
cp apps/api/.env.example apps/api/.env
# .env default DATABASE_URL already points to the Docker container
```

**Option B — Neon (hosted, recommended for the assignment)**
1. Create a project at https://console.neon.tech → copy the **pooled** connection string.
2. Copy `.env.example` to `.env` and paste your string:
   ```env
   DATABASE_URL="postgresql://user:pwd@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   ```

### 3. Initialize the database
```bash
pnpm --filter api exec prisma migrate dev --name init
pnpm db:seed
```
Creates the schema, a default user, **5 demo boards** (3 with photo backgrounds, 2 with solid colors — Product Launch, Engineering Sprint 24, Q2 Marketing Campaign, Design System, Company OKRs — Q2), 10 labels per board, cards with checklists + comments, **and 6 seed templates** (Agile Project Management, Design Sprint, Sales Pipeline, Marketing Campaign, Daily Task Tracker, Business Plan) — 4 with photo covers, 2 with gradient covers that flow through to the instantiated board background.

### 4. Run the app
```bash
pnpm dev           # builds shared, then runs api + web in parallel
```

| Service | URL |
|---|---|
| Web (Vite) | http://localhost:5173 |
| API (Express) | http://localhost:4000 |
| Health check | http://localhost:4000/health |
| Prisma Studio | `pnpm db:studio` |

---

## Environment variables

### `apps/api/.env`
| Var | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Postgres connection (pooled for Neon) |
| `PORT` | `4000` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |
| `NODE_ENV` | `development` | Enables morgan logger |
| `DEFAULT_USER_ID` | `user_default` | Fallback id for the seeded default user |

### `apps/web/.env`
| Var | Example | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | API base; when blank, uses `/api` via Vite dev proxy |
| `VITE_API_PROXY` | `http://localhost:4000` | Dev-only proxy target |

---

## Scripts

```bash
pnpm dev              # build shared, then run web + api in parallel
pnpm dev:api          # api only (auto-builds shared first)
pnpm dev:web          # web only (auto-builds shared first)
pnpm build            # production build of every app
pnpm typecheck        # monorepo-wide tsc --noEmit
pnpm format           # prettier --write

pnpm shared:build     # build the @trello-clone/shared package alone
pnpm db:migrate       # prisma migrate dev
pnpm db:migrate:deploy  # prisma migrate deploy (CI/production)
pnpm db:seed          # re-seed default data
pnpm db:reset         # drop + recreate + migrate + seed
pnpm db:studio        # prisma studio
```

---

## API reference (brief)

Base: `/api`. All routes resolve the seeded default user via `defaultUser` middleware.

### Boards
- `GET    /api/boards` — list boards (owned or member-of), starred-first, `updatedAt`-desc
- `POST   /api/boards` — create board (seeds 3 lists + 10 labels). Accepts `background: { type: 'color' | 'image' | 'gradient', value: string }`
- `GET    /api/boards/:id` — board + members + active lists
- `PATCH  /api/boards/:id` — rename, star, archive, change background
- `GET    /api/boards/:id/archived` — archived lists + cards on this board
- `DELETE /api/boards/:id` — hard delete (cascades via Prisma `onDelete: Cascade` through lists, cards, labels, members, checklists, comments, activities)

### Lists (mounted under `/api/boards/:boardId/lists`)
- `GET  /` — lists + their cards (active only)
- `POST /` — create list
- `PATCH /:listId` — rename / archive / unarchive
- `PATCH /:listId/position` — reorder

### Cards (flat under `/api`)
- `POST   /api/lists/:listId/cards`
- `GET    /api/cards/:cardId`
- `PATCH  /api/cards/:cardId` — title, desc, due, cover, archive/restore
- `PATCH  /api/cards/:cardId/move` — `{listId, position}`
- `DELETE /api/cards/:cardId`
- `POST/DELETE /api/cards/:cardId/labels/:labelId`
- `POST/DELETE /api/cards/:cardId/members/:userId`

### Checklists
- `POST   /api/cards/:cardId/checklists`
- `PATCH/DELETE /api/checklists/:checklistId`
- `POST   /api/checklists/:checklistId/items`
- `PATCH/DELETE /api/checklist-items/:itemId`

### Comments
- `GET  /api/cards/:cardId/comments`
- `POST /api/cards/:cardId/comments`
- `PATCH/DELETE /api/comments/:commentId`

### Labels (`/api/boards/:boardId/labels`)
- `GET/POST /`
- `PATCH/DELETE /:labelId`

### Activities / Search / Users
- `GET /api/boards/:boardId/activities`
- `GET /api/search?q=...`
- `GET /api/users`, `GET /api/users/me`

### Templates
- `GET  /api/templates` — list templates. Optional `?category=<TemplateCategory>` filter. Ordered `isMostPopular` → `isFeatured` → `useCount` → `title`.
- `GET  /api/templates/:id` — template detail (lists + card stubs)
- `POST /api/templates/:id/instantiate` — clone into a new board. Accepts `{ title? }`. Wrapped in a Prisma `$transaction({ maxWait: 30000, timeout: 30000 })`; copies lists, cards, and carries over `boardBackgroundType` / `boardBackgroundValue` as the new board's background.

---

## Architecture highlights

- **Fractional positioning** (`packages/shared/src/positions.ts`) — lists and cards store a `Float` position. Inserting between two items uses `(prev + next) / 2`; the API rebalances when the gap drops below `MIN_POSITION_GAP`. Drag-and-drop is O(1) server-side.
- **Default-user auth** — a single seeded user owns every board (per assignment). Middleware hydrates `req.userId` on every request. Swap in real auth by replacing `apps/api/src/middleware/auth.ts`.
- **Optimistic drag & drop** — `useMoveCard` patches the TanStack Query cache synchronously, rolls back on error.
- **Shared Zod schemas** — `@trello-clone/shared` exports runtime validators (API: `schema.parse(req.body)`) and inferred TS types (web). One source of truth for the contract.
- **Three-type board backgrounds** — `background = { type: 'color' | 'image' | 'gradient', value: string }`. Color values are hex strings, image values are URLs, gradient values are raw CSS `linear-gradient(...)` strings applied via `style.backgroundImage` (bypasses Tailwind JIT, which can't detect dynamically-assembled class names).
- **URL ↔ state sync** — `BoardPage` uses `?card=:id` for deep-linkable cards with two one-way effects (URL→state, state→URL) to avoid loops. `BoardsHome` reads `?view=starred` / `?view=recent` from the top-nav links and pre-sets the filter.
- **Boards filter bar** — `BoardsFilterBar` provides search + Show (all/starred/recent) + Background (all/color/image/gradient) + Sort (recent/oldest/A→Z/Z→A) dropdowns with an active-chip row and "Clear all" button. When all filters are at defaults, `BoardsHome` preserves the original two-section layout (Starred / Your boards); otherwise it collapses to a single dynamic-titled section.
- **Templates gallery** — `/templates` route with category tabs, search, and sort (default A→Z). "Use template" opens a dialog to name the new board, then hits `POST /api/templates/:id/instantiate`. The template cover is carried over as the new board's background so the look&feel is preserved.
- **Delete board flow** — two entry points: the three-dot menu in `BoardHeader` (navigates to `/boards` after delete) and a hover-only "More" dropdown on each `BoardTile` (stays on dashboard, relies on query invalidation). Both funnel through `useDeleteBoard` with a confirm-title dialog.
- **Activity feed** — every mutating action calls `logActivity(tx, ...)` inside the same transaction for an eventually consistent per-board event log.

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — ship on **Neon + Render + Vercel** with auto-deploy on push.

---

## Handoff to another developer / AI model

Read **[context.md](./context.md)** first. It captures every design decision, every gotcha hit during development (ESM vs CJS, NodeNext extensions, forwardRef, effect loops, Prisma migrations, CORS), and the exact state of the code so work can resume from any point.

---

## License

Assignment submission — not licensed for redistribution.
