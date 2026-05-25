import { Router, type IRouter, type Request, type Response } from "express";
import { desc, eq, and, gte } from "drizzle-orm";
import { db, projectsTable, usersTable } from "@workspace/db";
import { CreateProjectBody } from "@workspace/api-zod";

const router: IRouter = Router();

const FREE_RENDER_LIMIT = 1;
const PRO_MONTHLY_LIMIT = 10;

const TEMPLATES = [
  { id: "waveform-classic", name: "Waveform Classic", description: "Clean white waveform line with album art — timeless and elegant", style: "waveform", previewColor: "#7C3AED", supportedFormats: ["square", "vertical", "horizontal"], tags: ["minimal", "clean", "classic"] },
  { id: "bass-bars", name: "Bass Bars", description: "Colorful frequency bars that react to every beat drop", style: "bars", previewColor: "#06B6D4", supportedFormats: ["square", "vertical", "horizontal"], tags: ["energetic", "colorful", "electronic"] },
  { id: "vinyl-circle", name: "Vinyl Circle", description: "Spinning album art with radiating frequency lines — retro-modern", style: "circular", previewColor: "#F59E0B", supportedFormats: ["square", "vertical", "horizontal"], tags: ["retro", "vinyl", "artistic"] },
  { id: "particle-storm", name: "Particle Storm", description: "200 particles that swarm and pulse with the music", style: "particles", previewColor: "#10B981", supportedFormats: ["square", "vertical", "horizontal"], tags: ["experimental", "abstract", "dynamic"] },
  { id: "spectrum-glow", name: "Spectrum Glow", description: "Gradient spectrum with a cinematic glow bloom effect", style: "spectrum", previewColor: "#EF4444", supportedFormats: ["square", "vertical", "horizontal"], tags: ["cinematic", "gradient", "moody"] },
  { id: "album-float", name: "Album Float", description: "Album art centered with a pulsing glow border — made for covers", style: "album-float", previewColor: "#8B5CF6", supportedFormats: ["square", "vertical", "horizontal"], tags: ["minimal", "cover", "clean"] },
];

function getUserId(req: Request): number | null {
  const session = req.session as any;
  return session?.userId ?? null;
}

router.get("/templates", async (_req, res): Promise<void> => {
  res.json(TEMPLATES);
});

router.get("/projects/stats", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const allProjects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, userId))
    .orderBy(desc(projectsTable.createdAt));

  const total = allProjects.length;
  const ready = allProjects.filter((p) => p.status === "ready").length;
  const processing = allProjects.filter((p) => p.status === "processing").length;
  const recentActivity = allProjects.slice(0, 5).map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));

  res.json({ total, ready, processing, recentActivity });
});

// GET /api/projects/render-status — returns server-side render quota info for the current user
router.get("/projects/render-status", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const plan: string = user.plan;

  if (plan === "pro") {
    // Count renders this calendar month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const allProjects = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.userId, userId), gte(projectsTable.createdAt, monthStart)));
    const used = allProjects.length;
    res.json({ plan, limit: PRO_MONTHLY_LIMIT, used, remaining: Math.max(0, PRO_MONTHLY_LIMIT - used), blocked: used >= PRO_MONTHLY_LIMIT });
    return;
  }

  if (plan === "starter") {
    const allProjects = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId));
    const used = allProjects.length;
    res.json({ plan, limit: FREE_RENDER_LIMIT, used, remaining: Math.max(0, FREE_RENDER_LIMIT - used), blocked: used >= FREE_RENDER_LIMIT });
    return;
  }

  // Any other plan (admin-assigned, etc.) — unlimited
  res.json({ plan, limit: null, used: 0, remaining: null, blocked: false });
});

router.get("/projects", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, userId))
    .orderBy(desc(projectsTable.createdAt));

  res.json(projects.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.post("/projects", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Server-side render limit enforcement
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const plan: string = user.plan;

  if (plan === "starter") {
    const existingProjects = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId));
    if (existingProjects.length >= FREE_RENDER_LIMIT) {
      res.status(403).json({ error: "render_limit_reached", message: "Starter render used. Upgrade to Pro for more." });
      return;
    }
  } else if (plan === "pro") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthProjects = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.userId, userId), gte(projectsTable.createdAt, monthStart)));
    if (monthProjects.length >= PRO_MONTHLY_LIMIT) {
      res.status(403).json({ error: "monthly_limit_reached", message: "Monthly render limit reached. Resets on the 1st." });
      return;
    }
  }
  // Any other plan value is treated as unlimited (e.g. custom/enterprise plans set via admin)

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const hasVideo = !!parsed.data.videoObjectPath;
  const [project] = await db
    .insert(projectsTable)
    .values({
      userId,
      title: parsed.data.title,
      artistName: parsed.data.artistName ?? null,
      templateId: parsed.data.templateId,
      format: parsed.data.format,
      lyricsText: parsed.data.lyricsText ?? null,
      videoObjectPath: parsed.data.videoObjectPath ?? null,
      status: hasVideo ? "ready" : "processing",
      downloadUrl: hasVideo ? `/api/storage${parsed.data.videoObjectPath}` : null,
    })
    .returning();

  res.status(201).json({ ...project, createdAt: project.createdAt.toISOString() });
});

router.get("/projects/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json({ ...project, createdAt: project.createdAt.toISOString() });
});

router.delete("/projects/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  await db.delete(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)));
  res.sendStatus(204);
});

export default router;
