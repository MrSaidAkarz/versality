import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  artistName: text("artist_name"),
  templateId: text("template_id").notNull(),
  format: text("format").notNull().default("square"),
  status: text("status").notNull().default("pending"),
  audioFileName: text("audio_file_name"),
  artworkFileName: text("artwork_file_name"),
  lyricsText: text("lyrics_text"),
  downloadUrl: text("download_url"),
  videoObjectPath: text("video_object_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
