import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { eq, and, or } from "drizzle-orm";
import { db, projectsTable, showcaseVideosTable } from "@workspace/db";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function getUserId(req: Request): number | null {
  const session = req.session as unknown as { userId?: number };
  return session?.userId ?? null;
}
function getAdminId(req: Request): number | null {
  const session = req.session as unknown as { adminId?: number };
  return session?.adminId ?? null;
}

async function streamObjectPath(objectPath: string, res: Response, log: Request["log"]): Promise<void> {
  try {
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
}

/**
 * POST /storage/uploads/request-url — requires authenticated session.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/* — unconditionally public.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    const response = await objectStorageService.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/showcase-objects/* — public read, gated to paths that appear
 * in the showcase_videos table (video or poster).
 */
router.get("/storage/showcase-objects/*path", async (req: Request, res: Response) => {
  const raw = req.params.path;
  const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
  const objectPath = `/objects/${wildcardPath}`;

  const [row] = await db
    .select({ id: showcaseVideosTable.id })
    .from(showcaseVideosTable)
    .where(
      or(
        eq(showcaseVideosTable.videoObjectPath, objectPath),
        eq(showcaseVideosTable.posterObjectPath, objectPath),
      ),
    )
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Not a showcase asset" });
    return;
  }

  await streamObjectPath(objectPath, res, req.log);
});

/**
 * GET /storage/objects/* — requires either:
 *   (a) admin session, OR
 *   (b) a user session that owns a project whose videoObjectPath matches.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const adminId = getAdminId(req);

  if (!userId && !adminId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const raw = req.params.path;
  const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
  const objectPath = `/objects/${wildcardPath}`;

  if (!adminId) {
    const [owned] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.userId, userId!),
          eq(projectsTable.videoObjectPath, objectPath),
        ),
      )
      .limit(1);

    if (!owned) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  await streamObjectPath(objectPath, res, req.log);
});

/**
 * GET /showcase — public list of showcase videos for the marketing pages.
 */
router.get("/showcase", async (_req: Request, res: Response) => {
  const all = await db.select().from(showcaseVideosTable);
  const sorted = all
    .sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      videoUrl: `/api/storage/showcase-objects${s.videoObjectPath.replace(/^\/objects/, "")}`,
      posterUrl: s.posterObjectPath
        ? `/api/storage/showcase-objects${s.posterObjectPath.replace(/^\/objects/, "")}`
        : null,
    }));
  res.json(sorted);
});

export default router;
