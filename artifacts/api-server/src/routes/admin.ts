import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { db, adminsTable, projectsTable, showcaseVideosTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

// ── Auth guard ────────────────────────────────────────────────────────────────
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if ((req.session as any).adminId) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// ── POST /api/admin/login ─────────────────────────────────────────────────────
router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email.toLowerCase()));

  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  (req.session as any).adminId = admin.id;
  (req.session as any).adminUsername = admin.username;
  res.json({ ok: true, username: admin.username });
});

// ── POST /api/admin/logout ────────────────────────────────────────────────────
router.post("/admin/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// ── GET /api/admin/me ─────────────────────────────────────────────────────────
router.get("/admin/me", (req: Request, res: Response): void => {
  const session = req.session as any;
  if (session.adminId) {
    res.json({ authenticated: true, username: session.adminUsername });
  } else {
    res.json({ authenticated: false });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const all = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));

  const total      = all.length;
  const ready      = all.filter((p) => p.status === "ready").length;
  const processing = all.filter((p) => p.status === "processing").length;

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recent = all.filter((p) => p.createdAt.getTime() > thirtyDaysAgo);

  const byDay: Record<string, number> = {};
  for (const p of recent) {
    const day = p.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const dailyCounts = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const recentProjects = all.slice(0, 20).map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  res.json({ total, ready, processing, dailyCounts, recentProjects });
});

// ── DELETE /api/admin/projects/:id ────────────────────────────────────────────
router.delete("/admin/projects/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.sendStatus(204);
});

// ── POST /api/admin/storage/uploads/request-url ───────────────────────────────
// Admin-scoped: returns a signed URL with no per-user binding.
router.post("/admin/storage/uploads/request-url", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadURL = await objectStorage.getObjectEntityUploadURL();
    const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath });
  } catch (error) {
    req.log.error({ err: error }, "admin: failed to issue upload URL");
    res.status(500).json({ error: "Failed to issue upload URL" });
  }
});

// ── POST /api/admin/projects ──────────────────────────────────────────────────
// Admin creates a new project entry with a pre-uploaded video.
router.post("/admin/projects", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const body = req.body as {
    title?: string;
    artistName?: string | null;
    templateId?: string;
    format?: string;
    videoObjectPath?: string;
  };

  if (!body.title || !body.videoObjectPath) {
    res.status(400).json({ error: "title and videoObjectPath are required" });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({
      userId: null,
      title: body.title,
      artistName: body.artistName ?? null,
      templateId: body.templateId ?? "admin-upload",
      format: body.format ?? "square",
      videoObjectPath: body.videoObjectPath,
      status: "ready",
      downloadUrl: `/api/storage${body.videoObjectPath}`,
    })
    .returning();

  res.status(201).json({ ...project, createdAt: project.createdAt.toISOString() });
});

// ── PATCH /api/admin/projects/:id ─────────────────────────────────────────────
// Replace the video (and optionally metadata) on an existing project.
router.patch("/admin/projects/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body as {
    title?: string;
    artistName?: string | null;
    videoObjectPath?: string;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (body.artistName !== undefined) patch.artistName = body.artistName;
  if (typeof body.videoObjectPath === "string") {
    patch.videoObjectPath = body.videoObjectPath;
    patch.downloadUrl = `/api/storage${body.videoObjectPath}`;
    patch.status = "ready";
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const [updated] = await db
    .update(projectsTable)
    .set(patch)
    .where(eq(projectsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

// ── GET /api/admin/showcase ───────────────────────────────────────────────────
router.get("/admin/showcase", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const all = await db
    .select()
    .from(showcaseVideosTable)
    .orderBy(asc(showcaseVideosTable.position), desc(showcaseVideosTable.createdAt));
  res.json(all.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

// ── POST /api/admin/showcase ──────────────────────────────────────────────────
router.post("/admin/showcase", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const body = req.body as {
    title?: string;
    subtitle?: string | null;
    videoObjectPath?: string;
    posterObjectPath?: string | null;
    position?: number;
  };

  if (!body.title || !body.videoObjectPath) {
    res.status(400).json({ error: "title and videoObjectPath are required" });
    return;
  }

  const [row] = await db
    .insert(showcaseVideosTable)
    .values({
      title: body.title,
      subtitle: body.subtitle ?? null,
      videoObjectPath: body.videoObjectPath,
      posterObjectPath: body.posterObjectPath ?? null,
      position: body.position ?? 0,
    })
    .returning();

  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

// ── DELETE /api/admin/showcase/:id ────────────────────────────────────────────
router.delete("/admin/showcase/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(showcaseVideosTable).where(eq(showcaseVideosTable.id, id));
  res.sendStatus(204);
});

export default router;
