import bcrypt from "bcryptjs";
import { db, adminsTable } from "./index.js";
import { eq } from "drizzle-orm";

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("ERROR: ADMIN_PASSWORD env var is required.");
  process.exit(1);
}

const existing = await db.select().from(adminsTable).where(eq(adminsTable.username, username));

if (existing.length > 0) {
  console.log(`Admin "${username}" already exists. Updating password...`);
  const hash = await bcrypt.hash(password, 12);
  await db.update(adminsTable).set({ passwordHash: hash }).where(eq(adminsTable.username, username));
  console.log("Password updated.");
} else {
  const hash = await bcrypt.hash(password, 12);
  await db.insert(adminsTable).values({ username, passwordHash: hash });
  console.log(`Admin "${username}" created.`);
}

process.exit(0);
