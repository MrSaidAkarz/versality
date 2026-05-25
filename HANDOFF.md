# Versality — Project Handoff

> **Heads up:** I (Replit Agent) don't retain a verbatim transcript of every chat message across our entire build, so this document is a faithful *project summary* — what was built, the decisions behind it, where the code lives, current state, and known TODOs — rather than a literal copy-paste of every message. If you give this to another assistant (Base44 or anyone else), this is the context they actually need to be productive on day one.

---

## 1. Product

**Versality** — a music-video generator for independent artists.

- Artist uploads an audio track and cover art (and optionally lyrics).
- Picks one of **6 audio-reactive canvas templates**.
- App renders/exports a video they can download.
- Admin can curate a public **Showcase** of demo videos shown on the home page, upload pre-made videos as ready-to-go projects, and replace the video on any existing project.
- **Closed-source pivot** — all "free" / "open source" copy has been scrubbed from user-visible pages. Internal constants like `FREE_*` are kept; only UI strings were changed.
- **No emojis in code** (per user preference).

---

## 2. Stack & layout

pnpm monorepo. Three artifacts plus shared libs.

```
/
├── artifacts/
│   ├── openvizy/          # React + Vite web app (the actual product UI)
│   ├── api-server/        # Express API (esbuild-bundled, no HMR)
│   └── mockup-sandbox/    # Vite preview server for canvas mockups
├── lib/
│   └── db/                # Drizzle ORM schema + client, TS composite project
├── pnpm-workspace.yaml
└── package.json
```

- **DB:** Replit-managed Postgres (Drizzle ORM). Schema lives in `lib/db/src/schema/`.
- **Auth:** session cookie (`express-session`); separate `req.session.userId` (artists) and `req.session.adminId` (admin panel).
- **Object storage:** Replit Object Storage via signed PUT URLs. Object path convention: `/objects/uploads/<uuid>`. Public read URL = `/api/storage` + objectPath for owner/admin; public showcase reads via `/api/storage/showcase-objects/*` (gated to paths present in the `showcase_videos` table).
- **Workflows:**
  - `artifacts/api-server: API Server` — Express
  - `artifacts/openvizy: web` — Vite dev server
  - `artifacts/mockup-sandbox: Component Preview Server`
- **Secrets in use:** `ADMIN_PASSWORD`, `SESSION_SECRET`, `DATABASE_URL`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`.

---

## 3. What's been built (chronological from `git log`)

Most recent at the top:

| Commit | What landed |
|---|---|
| `5e5b663` | Published to production (deploy) |
| `e3f3449` | Admin video-upload feature: create from pre-made video, replace project video, manage public Showcase strip |
| `c9230b8` | Closed-source scrub — removed all "free" / "open source" copy from home, about, pricing, social-kit, index.html |
| `2840775` | New OG image |
| `8304c64` | Secure video uploads + audio-visualizer functionality |
| `72981d2` | Published |
| `204454f` | Fix login/signup so sessions persist |
| `c0ea451` | Admin users get unlimited content creation |
| `001d8c4` | Updated pricing |
| `2cde79a` / `7522421` | Admin login switched from username → email |
| `4e68d78` | Versality Pro features section |
| `27d55f6` | Pricing comparison chart |
| `5039edf`, `d2c43da`, `0bc5442`, `0c1e579`, `8e64472`, `0ced4bd` | Copy cleanup — removed credit-card / no-account / "start creating" / "create first video" prompts; capitalized "Login" |
| `a4040b6` | Auth gating on protected content |
| `d9a559b`, `dc0a96e` | Sign-in / sign-up pages |
| `9fb6c91` | Removed every "free" reference in copy |
| `c10f347` | Polished admin login page |
| `b9013c9`, `a6bf820` | Admin auth + admin dashboard (users + stats) |
| `160fc7b` | Limit free video renders to one (internal limit; UI doesn't use "free" word) |
| `075ff5e` | Home page: animated scrolling + live previews |
| `86e22c8` | General visual polish |

(There's more history before `86e22c8` — initial bootstrap, template work, etc. — but those are the active-development commits.)

---

## 4. Admin upload feature (the most recent piece)

This was the last work-stream and is fully live in production.

### Three admin flows
1. **Upload tab** — pick a video file + fill in title/artist/format → creates a project with `userId = null`, `status = ready`. Doesn't belong to any artist; downloadable from the dashboard.
2. **Dashboard → "Replace" icon** on any project row — pops `ReplaceVideoModal`, swaps the video on that existing project (also updates `downloadUrl` + sets `status = ready`).
3. **Showcase tab** — pick a video + title/subtitle/position → row in `showcase_videos`. Public home page fetches `/api/showcase` and renders a strip if non-empty.

### Backend endpoints (all in `artifacts/api-server/src/routes/admin.ts` unless noted)
- `POST /api/admin/storage/uploads/request-url` — admin-scoped signed PUT URL
- `POST /api/admin/projects` — admin creates project (`userId: null`, `status: "ready"`)
- `PATCH /api/admin/projects/:id` — replace `videoObjectPath`, refresh `downloadUrl` + `status`
- `GET /api/admin/showcase` — admin list
- `POST /api/admin/showcase` — add
- `DELETE /api/admin/showcase/:id` — remove
- `GET /api/showcase` — **public**, returns resolved video/poster URLs (does not leak DB paths)
- `GET /api/storage/showcase-objects/*` — **public** streamer, only serves paths that exist in `showcase_videos`
- `GET /api/storage/objects/*` (in `routes/storage.ts`) — extended so admins bypass per-user ownership; regular users must still own the project.

### DB schema (Drizzle, dev DB and prod DB both up-to-date)
- `projects` gained `user_id INTEGER` (nullable for admin-owned items) and `video_object_path TEXT`.
- New `showcase_videos` table: `id`, `title`, `subtitle`, `video_object_path`, `poster_object_path`, `position`, `created_at`.

### Frontend
- `artifacts/openvizy/src/pages/admin.tsx` — three tabs (Dashboard / Upload / Showcase), per-row Replace modal.
- `artifacts/openvizy/src/pages/home.tsx` — fetches `/api/showcase` on mount, renders showcase section under templates section when there's at least one entry.

### E2E verification (15/15 green, last run before deploy)
- login → request URL → PUT 1 KiB → create project → admin downloads back 1024 bytes with RIFF magic
- replace flow: new URL → PUT 2 KiB → PATCH → download confirms 2048 bytes
- showcase: PUT 3 KiB → POST showcase → public `/api/showcase` lists it → unauthenticated stream returns 200 + 3072 bytes RIFF
- Negatives: anon admin upload / create / showcase all 401; fake showcase path 404
- Cleanup: DELETE showcase 204 → DELETE project 204 → stream now 404; `/api/showcase` returns `[]`; `/` and `/admin` both 200

---

## 5. Important files

- `artifacts/api-server/src/routes/admin.ts` — all admin endpoints
- `artifacts/api-server/src/routes/storage.ts` — object-storage routes including the admin-bypass and the showcase-objects gating
- `artifacts/api-server/src/index.ts` — Express bootstrap, session, route mounts
- `artifacts/openvizy/src/pages/admin.tsx` — admin UI (Dashboard / Upload / Showcase)
- `artifacts/openvizy/src/pages/home.tsx` — home page + showcase strip
- `lib/db/src/schema/projects.ts` — project schema
- `lib/db/src/schema/showcase.ts` — new showcase schema
- `lib/db/src/schema/index.ts` — schema barrel
- `replit.md` — project overview + user preferences
- `.agents/memory/` — persistent agent memory (Babel forwardRef gotcha, composite tsconfig rule, object-storage auth caveat)

---

## 6. Lessons / gotchas worth carrying forward

These are saved in `.agents/memory/` but worth surfacing here too:

1. **API server is esbuild-bundled — no HMR.** After any backend code change you must `restart_workflow` the API server. The web app does have HMR.
2. **`lib/db` is a TS composite project.** After editing any schema file, run `pnpm --filter @workspace/db exec tsc -b` so consumers see the new exports.
3. **`drizzle-kit push` needs a TTY** and can't be used non-interactively from the agent. Dev schema changes were applied via raw SQL through the database skill; **production schema changes are applied automatically by Replit's Publish flow** (it diffs dev → prod and applies). Never write a custom migration script for prod.
4. **Object storage route auth**: the storage skill's `/storage/objects/*` template ships with auth/ACL commented out. In a multi-user app you must enforce ownership before streaming — we do this in `routes/storage.ts` (with the new admin-session bypass for the admin dashboard).
5. **`forwardRef` + Vite Babel plugin** can choke on `forwardRef<A, B>(function Name({...}, ref) {})` syntax; use an arrow callback inside `forwardRef` instead.
6. **Storage path convention:** server returns `objectPath = /objects/uploads/<uuid>`; downloadable URL = `/api/storage` + objectPath.
7. **Session keys are split:** `req.session.userId` (artists) vs `req.session.adminId` (admin panel). Don't conflate them.
8. **Closed-source copy rule:** UI strings must not contain "free" or "open source". Internal constants (`FREE_*`) are fine; only what users see matters.

---

## 7. Current production state

- Latest deploy: commit `5e5b663` ("Published your App")
- Prod DB has: `projects.user_id`, `projects.video_object_path`, and `showcase_videos` table (applied by Publish diff).
- No outstanding migrations or unmerged work.
- No emojis in code. No "free" / "open source" copy on user-facing pages.

---

## 8. What's NOT done / sensible next steps

(From the last code review — none blocking, all "harden" / "polish")

1. Codify the `showcase_videos` table into a checked-in migration artifact instead of relying on dev-side raw SQL + Publish diff. (Drizzle migrations folder.)
2. Add automated API tests for auth boundaries on `/storage/objects/*`, `/storage/showcase-objects/*`, and admin routes.
3. Add input validation on admin payloads (`videoObjectPath`, `position`, etc.) to harden against malformed requests.
4. Optional UX: drag-and-drop reordering in the Showcase tab (currently uses a numeric `position` input).
5. Optional UX: poster image upload in the Showcase tab (DB column exists, UI doesn't expose it yet).

Good luck.
