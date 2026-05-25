import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// POST /api/auth/register
router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash: hash,
  }).returning();

  (req.session as any).userId = user.id;
  (req.session as any).userName = user.name;
  (req.session as any).userEmail = user.email;

  res.status(201).json({ ok: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
});

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    res.status(401).json({ error: "No account found with that email." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  (req.session as any).userId = user.id;
  (req.session as any).userName = user.name;
  (req.session as any).userEmail = user.email;

  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
});

// POST /api/auth/logout
router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me
router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const session = req.session as any;
  if (!session.userId) {
    res.json({ authenticated: false });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    res.json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
});

export default router;
