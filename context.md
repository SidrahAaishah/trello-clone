# Project Context — Trello Clone

> **For future developers and AI assistants picking up this project.**
> This file is the single source of truth for *why* the code is the way it is,
> *what* has already been built, *what* gotchas are lurking, and *how* to pick
> up work at any point. Read this before touching code.

---

## 1. Project purpose

Built for the **Scaler SDE Intern Fullstack Assignment**. The brief:
- Kanban board clone (Trello-style)
- Single default user — no real auth required
- MVP features: boards, lists, cards, drag-and-drop, card details, labels, checklists, comments, due dates
- Bonus features encouraged: multi-board, activity feed, covers, backgrounds, archived-items drawer, search, responsive layout

**Design**: 1:1 match to a Stitch/Figma design using the classic Trello palette (primary `#0079BF`, list surface `#EBECF0`, 272 px list width, 200×96 board tiles, Inter + Material Symbols Outlined).

**Owner**: Fahad Ahmed (fahadahmed982004@gmail.com) · GitHub [FahadAhmed-8](https://github.com/FahadAhmed-8)
**Repo**: https://github.com/FahadAhmed-8/Trello-Clone.git

---

## 2. High-level architecture

```
┌───────────────────┐       ┌─────────────────┐       ┌──────────────┐
│  Web (Vite+React) │ HTTP  │  API (Express)  │ SQL   │  Postgres    │
│  port 5173        ├──────►│  port 4000      ├──────►│  (Docker or  │
│  /api → proxy     │       │  /api/*         │       │   Neon)      │
└───────────────────┘       └─────────────────┘       └──────────────┘
           │                         │
           └───── shares types ──────┘
              @trello-clone/shared
              (Zod schemas + inferred TS types)
```

**pnpm 9 monorepo** with three workspaces:
- `apps/web` — React SPA
- `apps/api` — Express server
- `packages/shared` — Zod schemas → shared contract

The shared package is **ESM**, compiled with `tsc` to `dist/`. Both apps import it via workspace dependency (`"@trello-clone/shared": "workspace:*"`).

---

## 3. Data model (Prisma)

Full schema: `apps/api/prisma/schema.prisma`.

**Entities**: `User`, `Board`, `BoardMember`, `List`, `Card`, `Label`, `CardLabel`, `CardMember`, `Checklist`, `ChecklistItem`, `Comment`, `Activity`, `Template`, `TemplateList`, `TemplateCard`.

Key points:
- All ids are **cuid** strings (collision-safe, URL-friendly).
- **Positions** (`List.position`, `Card.position`, `Checklist.position`, `ChecklistItem.position`) are `Float`. We compute midpoints client-side; the server rebalances only when two neighbours are closer than `MIN_POSITION_GAP` (0.0001).
- **Soft delete = archive**: `archivedAt` timestamp on `Board`, `List`, `Card`. Setting `archivedAt: null` restores.
- **Hard delete = cascade**: `DELETE /api/boards/:id` cascades through `onDelete: Cascade` FKs — lists, cards, labels, members, checklists, comments, activities all go in one statement. This is exposed in the UI via the three-dot menu in `BoardHeader` and the hover "More" menu on each `BoardTile`.
- **Label colors** are a fixed enum of 10 values (`LABEL_COLORS` in shared) → hex map in `LABEL_COLOR_HEX`. Every new board seeds all 10 labels unnamed.
- **Activity payload** is `Json @default("{}")` — arbitrary per-type data, typed via `ActivityType` union.
- **Board background** is stored as two plain columns (`backgroundType: String`, `backgroundValue: String`). The `BackgroundSchema` Zod enum in `packages/shared/src/schemas/common.ts` constrains `type` to `'color' | 'image' | 'gradient'`. DB stores strings so widening the enum is a schema-free change.
- **Template covers** mirror the same shape (`boardBackgroundType`, `boardBackgroundValue`). On instantiate, these flow through verbatim to the new board's background, preserving the look&feel.

**Seed**: `apps/api/prisma/seed.ts` creates:
- one default user (`isDefault: true`);
- **5 demo boards**, 3 with photo backgrounds (Product Launch, Engineering Sprint 24, Q2 Marketing Campaign) and 2 with solid-color backgrounds (Design System, Company OKRs — Q2), each with 3–4 lists, all 10 labels, and a sprinkling of cards + checklists + comments;
- **6 templates**, 4 with photo covers (Agile Project Management, Design Sprint, Sales Pipeline, Marketing Campaign) and 2 with CSS gradient covers (Daily Task Tracker = amber→orange→pink, Business Plan = slate trio).

---

## 4. Backend (apps/api)

### Entry & middleware chain
`apps/api/src/index.ts`:
1. `helmet()` — security headers
2. `cors({ origin: CORS_ORIGIN.split(',') })` — comma-separated allowed origins
3. `express.json({ limit: '1mb' })`
4. `morgan('dev')` when `NODE_ENV !== 'test'`
5. `/health` → `{ ok: true }`
6. `app.use('/api', defaultUser)` — resolves `req.userId` from the seeded default user
7. Routers (see below)
8. `notFoundHandler`, `errorHandler` — turns thrown `HttpError`s and Zod errors into JSON

### Default-user middleware (`src/middleware/auth.ts`)
Finds `User` where `isDefault = true` and attaches its id to `req.userId`. All write routes funnel through this, so when real auth is added later, only this file needs to change.

### Routers
| File | Mounts under | Endpoints |
|---|---|---|
| `boards.ts` | `/api/boards` | list, create, get, patch, archived, delete |
| `lists.ts` | `/api/boards/:boardId/lists` | list-with-cards, create, patch, reorder |
| `cards.ts` | `/api` (nested paths) | create, get, patch, move, delete, label add/remove, member add/remove |
| `checklists.ts` | `/api` | create/update/delete checklist; create/update/delete items |
| `comments.ts` | `/api` | list/create/update/delete |
| `labels.ts` | `/api/boards/:boardId/labels` | CRUD |
| `activities.ts` | `/api/boards/:boardId/activities` | list (paginated) |
| `search.ts` | `/api/search` | cross-board card search, returns `{ cards, boards, labels }` |
| `users.ts` | `/api/users` | list + `me` |
| `templates.ts` | `/api/templates` | list (w/ `?category=` filter), get by id, instantiate (clones template → new Board inside a Prisma `$transaction({ maxWait: 30_000, timeout: 30_000 })`) |

### Services
- `services/mappers.ts` — Prisma entity → API DTO mappers (`mapBoard`, `mapList`, `mapCard`, `mapCardSummary`, `mapLabel`, `mapMember`, `mapActivity`, etc.). These trim internals and pack `cover` / `background` into nested objects. `backgroundType` is cast to the three-value union `'color' | 'image' | 'gradient'`.
- `services/templateMappers.ts` — Prisma `Template`/`TemplateList`/`TemplateCard` → DTO. Same treatment as board mappers, with `boardBackgroundType` widened to include `'gradient'`.
- `services/includes.ts` — reusable Prisma `include` expressions. `cardSummaryInclude` = labels + members + cover + checklist counts.
- `services/activity.ts` — `logActivity(tx, { boardId, actorId, type, payload })` called inside every mutation transaction.
- `services/position.ts` — server-side position helpers + rebalance logic.

### Error handling
`lib/errors.ts` exports `HttpError` class + `notFound()` helper. `middleware/error.ts` catches:
- `HttpError` → `res.status(err.status).json({ error: { code, message } })`
- `ZodError` → 400 with field-level issues
- everything else → 500 generic

---

## 5. Frontend (apps/web)

### Stack choices (and why)
- **Vite** — fastest React dev server; HMR works cleanly with our shared package.
- **TanStack Query v5** — server state (cache, invalidation, optimistic updates). All API calls go through hooks in `src/hooks/`.
- **Zustand** — tiny client-only UI state (`openCardId`, `archivedDrawerOpen`, `filter`). Lives in `src/stores/ui.ts`.
- **Radix UI** — headless primitives (Dialog, Popover, DropdownMenu, Tooltip). We skin them with Tailwind.
- **@dnd-kit** — accessible drag-and-drop. Used in `BoardCanvas` for both list reordering and card moves.
- **react-router-dom v6** — `/` (redirects to `/boards`), `/boards` (BoardsHome, reads `?view=starred|recent` from query), `/boards/:boardId` (BoardPage with `?card=:id` deep-link), `/templates` (TemplatesPage), `/search`, `*` → NotFoundPage.
- **axios** — `src/lib/api.ts` creates the instance with `baseURL = VITE_API_URL + '/api'` (or `/api` for the dev proxy).

### Routing & layout
```
App.tsx
 └── <AppShell>           (TopNav + SideNav + <main>)
      ├── BoardsHome      (/boards)
      │     ├── BoardsFilterBar        (search + Show/Background/Sort dropdowns)
      │     └── BoardTile × N          (hover = "More" dropdown → Delete)
      ├── BoardPage       (/boards/:boardId)
      │     ├── BoardHeader            (three-dot menu → Delete board)
      │     ├── BoardCanvas
      │     │    ├── ListColumn × N
      │     │    │    ├── CardTile × N
      │     │    │    └── QuickAddCard
      │     │    └── AddListColumn
      │     ├── CardDetailModal       (opens when ?card=:id in URL)
      │     └── ArchivedItemsDrawer   (opens from archivedDrawerOpen)
      ├── TemplatesPage   (/templates)
      │     ├── CategoryTabs
      │     ├── search input + SortMenu  (default: A → Z)
      │     ├── TemplateCard × N (hero/side/grid variants)
      │     └── CreateFromTemplateDialog (modal)
      ├── SearchResultsPage  (/search?q=...)
      └── NotFoundPage
```

### Hooks layer (`src/hooks/`)
Every API interaction is wrapped. Query keys are exported as factories (e.g. `boardKey(id) = ['board', id]`) so components and mutations share them.

| Hook | What it does |
|---|---|
| `useBoards` | GET/POST `/boards`, star/archive/rename, **`useDeleteBoard`** for hard delete |
| `useBoard` | GET `/boards/:id` (board + members + lists) |
| `useBoardLists` | GET `/boards/:id/lists` (lists + cards) |
| `useBoardLabels` | GET `/boards/:id/labels` |
| `useCreateList`, `useUpdateList`, `useReorderList` | |
| `useCreateCard`, `useMoveCard` (optimistic), `useUpdateCard`, `useDeleteCard` | |
| `useCardDetail`, `useAddChecklist`, `useToggleChecklistItem`, `useCardMemberToggle`, `useCardLabelToggle`, `useComments` | |
| `useArchived` | archived list/card query + restore + permanent delete |
| `useActivities` | per-board feed |
| `useSearch` | cross-board search |
| `useUsers` | member pickers |
| `useTemplates` | GET `/templates` (optionally filtered by category) + `useTemplate(id)` detail + `useInstantiateTemplate` mutation |

### UI state store (`src/stores/ui.ts`)
```ts
{
  openCardId, openCard(id),
  createBoardOpen, setCreateBoardOpen,
  archivedDrawerOpen, setArchivedDrawerOpen,
  filter: { query, labelIds, memberIds, due },
  setFilter, clearFilter
}
```

---

## 6. Shared package (`packages/shared`)

All runtime validators + TS types live here. The API imports the Zod schemas (`createBoardSchema`, `updateCardSchema`, etc.); the web imports the inferred types (`Board`, `CardDetail`, `CreateCardInput`, etc.).

**Critical build config** — this package is ESM with NodeNext:
- `package.json`: `"type": "module"`, exports `{ types, import, default }` pointing at `dist/index.js`.
- `tsconfig.build.json`: `module: NodeNext`, `moduleResolution: NodeNext`.
- **Every relative import inside `src/` MUST have the `.js` extension** (even though the source files are `.ts`). This is NodeNext's hard requirement.

Files:
- `enums.ts` — `LABEL_COLORS`, `LABEL_COLOR_HEX`, `BOARD_BG_PRESETS`, **`BOARD_BG_IMAGES`** (8 curated Unsplash URLs at `w=1600&q=80`), `ACTIVITY_TYPES`, `DUE_FILTER_OPTIONS`, `TEMPLATE_CATEGORIES`.
- `positions.ts` — `POSITION_STEP` (65536), `MIN_POSITION_GAP`, `positionBefore/After/Between`, `needsRebalance`.
- `schemas/*.ts` — one file per entity: `common` (contains `backgroundSchema` with the 3-way enum), `member`, `board`, `list`, `card`, `label`, `checklist`, `comment`, `activity`, `search`, `template`.
- `index.ts` — re-exports everything (with `.js` extensions).

---

## 7. Gotchas & lessons learned (read these!)

### 7.1 NodeNext requires `.js` extensions on relative imports
**Symptom**: `TS2835: Relative import paths need explicit file extensions when '--moduleResolution' is 'node16' or 'nodenext'`.
**Fix**: Every `import from './foo'` in the shared package source must be `import from './foo.js'`, and `index.ts` re-exports look like `export * from './enums.js'`. Compilation emits `.js` files; the runtime import paths match.

### 7.2 CJS vs ESM in the shared package
We tried compiling shared to CJS to dodge the `.js` extension rule. That broke Vite — it couldn't get named exports like `BOARD_BG_PRESETS` out of the CJS bundle. **Resolution**: keep shared as ESM, add `.js` extensions everywhere. Both Node (API via `tsx`) and Vite (web) are happy.

### 7.3 `forwardRef` required for Radix `asChild` triggers
Radix's `<Popover.Trigger asChild>{children}</Popover.Trigger>` clones `children` and passes a ref. If the child is a plain `function Foo()`, React throws "Function components cannot be given refs" and the popover silently does nothing (button looks dead).
**Fix**: any component used as a Radix trigger child must use `forwardRef`. Example in `CardDetailModal.tsx` — `SideButton` is `forwardRef<HTMLButtonElement, SideButtonProps>(...)`.

### 7.4 URL ↔ state effect loops
`BoardPage` syncs `?card=:id` ↔ `openCardId`. Naïve two-way effect causes an infinite loop (URL changes → state updates → URL updates → …). **Fix**: two one-way effects with narrow deps:
- Effect A: `[cardParam]` → `openCard(cardParam)`
- Effect B: `[openCardId]` → `setSearchParams(...)`
Each effect only watches its source. ESLint-disabled `exhaustive-deps` intentionally.

### 7.5 Prisma `migrate dev` on a fresh Neon DB
On first run you must pass `--name init` and Prisma will create the migration folder + apply it. If you skip `--name`, it opens a prompt, which `tsx` can't handle. Then run `pnpm db:seed` or you'll hit `NO_DEFAULT_USER` on every request.

### 7.6 `WEB_ORIGIN` vs `CORS_ORIGIN`
Early versions used `WEB_ORIGIN`. We renamed to `CORS_ORIGIN` (plural, comma-separated) everywhere: `.env.example`, `render.yaml`, `vercel.json`, `DEPLOYMENT.md`, `src/index.ts`. Don't reintroduce the old name.

### 7.7 Archive vs delete
Two separate operations. `PATCH /cards/:id { archivedAt: <ISO> }` archives; `{ archivedAt: null }` restores; `DELETE /cards/:id` is permanent. The `ArchivedItemsDrawer` exposes both "Send to board" (restore) and "Delete" (permanent).

### 7.8 CI has no `lint` step
`.github/workflows/ci.yml` was changed to `pnpm typecheck && pnpm build`. There is no ESLint config in the repo. Don't wire a lint step without adding a config first.

### 7.9 Tailwind JIT can't see dynamically-assembled class names
Gradient backgrounds were first implemented as Tailwind classes (`bg-gradient-to-br from-amber-300 to-pink-500`). These only work if Tailwind's JIT sees the exact string at build time. Because the class was stitched together from DB values at runtime, it rendered as nothing.
**Fix**: store the raw CSS `linear-gradient(...)` string in `backgroundValue` and apply it via `style={{ backgroundImage: bg.value }}`. This bypasses Tailwind entirely. Used in:
- `BoardPage.tsx` (main canvas)
- `BoardTile.tsx` (dashboard tiles)
- `SideNav.tsx` (sidebar board swatches)
- `TemplateCard.tsx` (template covers)
Each of those files has a `bg.type === 'gradient'` branch that builds a style object with `backgroundImage`.

### 7.10 Widening `background.type` from 2 to 3 values
The Prisma schema stores `backgroundType: String` (not an enum) and `backgroundValue: String`. Moving from `'color' | 'image'` to `'color' | 'image' | 'gradient'` was therefore a **code-only change**: update the Zod enum in `packages/shared/src/schemas/common.ts`, widen the TS casts in `apps/api/src/services/mappers.ts` and `templateMappers.ts`, run `pnpm shared:build`. No migration needed. If you ever switch the DB column to a Postgres enum, remember to generate a migration and keep the values in sync.

### 7.11 Template instantiation needs a longer transaction timeout
`POST /api/templates/:id/instantiate` clones a full board inside a single Prisma `$transaction`. Default `timeout` is 5s, which was tight for the richest templates + pooled Neon connections. Raised to `{ maxWait: 30_000, timeout: 30_000 }`. If you add heavier templates (checklists, covers, etc.), revisit those bounds.

### 7.12 URL-driven filter state without effect loops
`TopNav` links to `/boards?view=starred` and `/boards?view=recent`. `BoardsHome` reads the param on mount and pre-sets local filter state:
```ts
useEffect(() => {
  const v = searchParams.get('view');
  if (v && VALID_VIEWS.includes(v)) setFilters((f) => ({ ...f, view: v as BoardView }));
}, [searchParams.get('view')]);  // intentional narrow dep
```
We do **not** mirror subsequent dropdown changes back to the URL — that would cause the same infinite-loop class of bug as 7.4. The URL is the initial-state source only.

### 7.13 `BoardsHome` has two layout modes
When all filters are at defaults (`search=''`, `view='all'`, `bg='all'`, `sort='recent'`) the page renders the two-section layout (Starred boards / Your boards with the Add tile). Any non-default filter collapses it to a single flat section with a dynamic title. The `showStarredSection` boolean in `BoardsHome.tsx` gates this. Don't delete that branch — it's what preserves the original look when nothing is filtered.

### 7.14 Delete board has two entry points with different post-actions
- `BoardHeader` (inside a board) → delete → `nav('/boards')` (must leave the now-dead page).
- `BoardTile` (on the dashboard) → delete → rely on query invalidation to remove the tile in place, no navigation.
Both use the same `useDeleteBoard` hook and the same confirm-title dialog shape, but the caller decides whether to navigate. Don't add navigation inside the hook itself.

### 7.15 Create Board dialog defaults to Photos tab
`CreateBoardDialog` opens with `tab='photos'` and `DEFAULT_BG = { type: 'image', value: BOARD_BG_IMAGES[0] }`. This matches the seeded majority (3 of 5 boards use images). If the product switches preference, change the single constant — don't scatter conditions across handlers.

---

## 8. Current state of the code (as of last commit)

### ✅ Complete
- Monorepo skeleton, tooling, CI
- Full Prisma schema + migration + seed (default user, 5 demo boards, 6 templates)
- All API routes (boards, lists, cards, labels, checklists, comments, activities, search, users, **templates**)
- All web pages + components for MVP
- Optimistic drag-and-drop for cards
- Card detail modal: title, description, labels, members, due date, cover, checklists, comments
- Activity feed rendering in card modal
- **Three-type board backgrounds** — color, image (URL), or CSS gradient; applied consistently in BoardPage, BoardTile, SideNav, TemplateCard
- **Curated photo gallery** — `BOARD_BG_IMAGES` (8 Unsplash URLs) surfaced in `CreateBoardDialog` via a Photos tab (default)
- Multi-board workspace (BoardsHome)
- **Boards filter bar** — search, Show (all/starred/recent), Background (all/color/image/gradient), Sort (recent/oldest/A→Z/Z→A), active-chip row with Clear all
- **URL-driven view filters** — `/boards?view=starred` and `/boards?view=recent` from top-nav links pre-set the filter state
- **Templates gallery** (`/templates`) — category tabs, search, sort (default A→Z), hero/side/grid card layouts when sort='popular', `CreateFromTemplateDialog` for naming and instantiating
- **Template cover → board background** — template's stored `boardBackgroundType/Value` carries over to the new board on instantiate
- **Delete board** — three-dot menu in `BoardHeader` + hover "More" on `BoardTile`, both behind a confirm-title dialog, atomic via Prisma cascading FKs
- Global search (SearchResultsPage with deep-links)
- **Archived items drawer** — opens from "Archived" button in board header, Cards/Lists tabs with search, "Send to board" restore, permanent delete
- Due-date states (none/today/overdue/complete) with the exact Trello color chips
- Responsive layout (lists scroll horizontally on mobile, modal takes full width)
- Neon deployment configuration (render.yaml, vercel.json)
- Deployment documentation

### 🟡 Known limitations
- No real auth (by assignment design — `DEFAULT_USER_ID` only)
- No real-time sync (no websockets; relies on TanStack Query staleness)
- No file upload for covers — image covers take a URL string
- Search is `ILIKE` based, no full-text index yet
- No E2E tests (only shape via typechecking + manual checklist)

### 🔴 Recently fixed bugs to be aware of
- Card modal couldn't close after edits → effect loop (fixed 7.4)
- Sidebar buttons (Members, Labels, Cover, etc.) appeared dead → missing `forwardRef` on `SideButton` (fixed 7.3)
- `in list ·` placeholder showed literal dot → wired `listTitle` from `useBoardLists`
- Vite couldn't resolve named imports from shared → rolled back CJS attempt to ESM + `.js` extensions (fixed 7.1, 7.2)

---

## 9. Manual test checklist

Run `pnpm dev` then walk through:

**Boards**
- [ ] `/boards` shows all 5 seeded boards (3 photo, 2 color)
- [ ] Starred section appears above "Your boards" when nothing is filtered
- [ ] Create a new board → appears in grid, opens with 3 starter lists + 10 labels
- [ ] Create Board dialog opens on the **Photos** tab with first image pre-selected
- [ ] Switch to Colors tab → pick a preset → create → new board has color background
- [ ] Star toggle works (star icon fills, board re-sorts to top)
- [ ] Rename inline (click title → edit → blur/enter)
- [ ] Archive board via header menu → disappears from list
- [ ] Delete board via header three-dot menu → confirm dialog → navigates to `/boards`, tile gone
- [ ] Hover a dashboard tile → "More" shows → Delete board → confirm → tile removed in place

**Boards filter bar**
- [ ] Top-nav "Starred" link → URL becomes `/boards?view=starred`, filter chip shows
- [ ] Top-nav "Recent" link → URL becomes `/boards?view=recent`, recency sort applied
- [ ] Typing in the search input narrows the list live; chip shows `"query"`
- [ ] Background dropdown filters to only photo / only color boards
- [ ] Sort: A→Z / Z→A / Oldest produce deterministic order
- [ ] Clear all → returns to default two-section layout

**Templates**
- [ ] `/templates` shows all 6 seed templates
- [ ] Default sort is A → Z (not popular-first)
- [ ] Category tabs filter the list
- [ ] Search input narrows by title + description
- [ ] Switch sort back to Popular → featured hero + side tiles appear
- [ ] "Use template" on a photo-cover template → name board → open → background matches template cover
- [ ] "Use template" on a gradient template (Daily Task Tracker / Business Plan) → board has gradient background

**Lists**
- [ ] Add list (right-most "+ Add another list") → appears
- [ ] Rename list (click title)
- [ ] Drag list left/right → persists on reload
- [ ] Archive list via list menu → disappears, appears in Archived drawer

**Cards**
- [ ] Quick-add card at list bottom
- [ ] Drag card within list → persists
- [ ] Drag card between lists → persists
- [ ] Click card → modal opens, URL has `?card=:id`
- [ ] Paste `/boards/:id?card=:id` into a new tab → modal opens on load
- [ ] Close modal (×, overlay, Esc) → URL clears
- [ ] Edit title inline
- [ ] Edit description → Save button commits, Cancel reverts
- [ ] Add/remove label → chip appears on tile
- [ ] Add/remove member → avatar stack updates
- [ ] Set due date → chip on tile colored by state
- [ ] Toggle complete → chip turns green with strikethrough
- [ ] Add cover (color/image) → tile header shows cover
- [ ] Add checklist + items; check items → progress bar fills

**Comments / activity**
- [ ] Post comment → shows in feed with avatar
- [ ] Edit own comment
- [ ] Activity entries appear for create/move/archive/etc.

**Archive**
- [ ] Archive a card → gone from board
- [ ] Open Archived drawer → card visible under Cards tab
- [ ] "Send to board" restores → card reappears
- [ ] "Delete" on archived card → gone permanently
- [ ] Lists tab shows archived lists with restore button

**Search**
- [ ] Top-nav search → `/search?q=...`
- [ ] Results grouped by board → click deep-links to card

**Responsive**
- [ ] 375 px viewport: lists scroll horizontally; modal fills width
- [ ] Keyboard: Tab through buttons, Enter activates

---

## 10. How to run CI-equivalent locally

```bash
pnpm install --frozen-lockfile
pnpm shared:build
pnpm typecheck
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy   # needs DATABASE_URL
pnpm build
```

GitHub Actions (`.github/workflows/ci.yml`) does the same plus spins up a Postgres 16 service container.

---

## 11. Deployment (summary)

Full guide in `DEPLOYMENT.md`. In short:

1. **Neon** — create project, copy pooled connection string.
2. **Render** — create Web Service from `render.yaml`. Build runs `pnpm shared:build && pnpm --filter api exec prisma migrate deploy && pnpm --filter api build`. Start: `pnpm --filter api start`. Env: `DATABASE_URL`, `CORS_ORIGIN=https://<your>.vercel.app`.
3. **Vercel** — import repo. Root dir `apps/web`. Build `pnpm --filter shared build && pnpm --filter web build`. Output `apps/web/dist`. Env: `VITE_API_URL=https://<your>.onrender.com`.

Push to `main` → Render + Vercel auto-deploy.

---

## 12. Resuming work — cheat sheet

**Starting a fresh session**:
1. `cd trello-clone && pnpm install`
2. If schema changed upstream: `pnpm --filter api exec prisma migrate dev`
3. `pnpm dev`

**Adding a new field to an entity (e.g. `Card.priority`)**:
1. Edit `apps/api/prisma/schema.prisma`
2. `pnpm db:migrate` (creates migration, applies it)
3. Add Zod field in `packages/shared/src/schemas/card.ts`
4. `pnpm shared:build`
5. Update `services/mappers.ts` to include it in the DTO
6. Update `apps/api/src/routes/cards.ts` PATCH handler to read it from the parsed input
7. Update `apps/web/src/hooks/useCard.ts` / `useBoard.ts` mutations if needed
8. Wire UI in `apps/web/src/components/card/CardDetailModal.tsx`

**Adding a new route**:
1. Create `apps/api/src/routes/foo.ts` exporting a `Router`
2. Mount it in `apps/api/src/index.ts`
3. Add a Zod schema in shared if the body/response is non-trivial
4. Add a hook in `apps/web/src/hooks/useFoo.ts`

**Adding a new UI surface**:
1. Place component under `apps/web/src/components/<domain>/`
2. If it uses Radix `asChild`, use `forwardRef` (see 7.3)
3. Read/write UI state via `useUI` in `stores/ui.ts` (add fields to the Zustand interface)
4. Add a query key factory + hook in `src/hooks/` — never call `api.get` from components directly

---

## 13. Key files (quick jump)

- `apps/api/src/index.ts` — server entry
- `apps/api/src/middleware/auth.ts` — swap here for real auth
- `apps/api/prisma/schema.prisma` — data model
- `apps/api/prisma/seed.ts` — default user + sample board
- `apps/web/src/App.tsx` — routes
- `apps/web/src/routes/BoardsHome.tsx` — dashboard + filter bar wiring + URL view param
- `apps/web/src/routes/BoardPage.tsx` — board orchestration + URL sync
- `apps/web/src/routes/TemplatesPage.tsx` — templates gallery
- `apps/web/src/components/board/BoardCanvas.tsx` — dnd-kit root
- `apps/web/src/components/board/BoardHeader.tsx` — board title + three-dot menu + delete-board dialog
- `apps/web/src/components/boards/BoardsFilterBar.tsx` — dashboard search/show/bg/sort
- `apps/web/src/components/boards/BoardTile.tsx` — dashboard tile + hover "More" delete
- `apps/web/src/components/boards/CreateBoardDialog.tsx` — Colors/Photos tabs, default Photos
- `apps/web/src/components/card/CardDetailModal.tsx` — biggest component
- `apps/web/src/components/board/ArchivedItemsDrawer.tsx` — archive UI
- `apps/web/src/components/templates/CreateFromTemplateDialog.tsx` — template instantiation flow
- `apps/web/src/stores/ui.ts` — all client UI state
- `apps/api/src/routes/templates.ts` — templates routes, including `$transaction`-wrapped instantiate
- `apps/api/prisma/seed.ts` — user + 5 boards + 6 templates
- `packages/shared/src/index.ts` — shared exports
- `packages/shared/src/schemas/common.ts` — `backgroundSchema` (3-way type enum)
- `packages/shared/src/enums.ts` — `BOARD_BG_IMAGES`, `BOARD_BG_PRESETS`, `TEMPLATE_CATEGORIES`
- `packages/shared/src/positions.ts` — fractional positioning math
- `README.md` — user-facing setup
- `DEPLOYMENT.md` — production deploy
- `context.md` — this file

---

## 14. Open todos / nice-to-haves (not blocking)

- [ ] WebSocket/SSE layer for real-time collaboration
- [ ] File upload for card covers (S3 / Cloudinary presigned URLs)
- [ ] Postgres full-text search (replace `ILIKE`)
- [ ] Board-level permissions (currently every request is the default user)
- [ ] Unit tests (Vitest) + E2E tests (Playwright)
- [ ] Keyboard shortcuts (C to create card, / to focus search)
- [ ] Dark mode
- [ ] Productivity stats view (completed-cards-per-day chart over a selected date range, built off the existing `/api/boards/:boardId/activities` feed)
- [ ] Custom template authoring (save any board as a template)
- [ ] Persist filter-bar state to `localStorage` so dashboards remember how the user left them

---

**When in doubt, grep. The codebase is small (~8k LOC) and every abstraction used is documented above.**
