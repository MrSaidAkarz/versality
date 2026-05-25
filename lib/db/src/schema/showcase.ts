import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const showcaseVideosTable = pgTable("showcase_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  videoObjectPath: text("video_object_path").notNull(),
  posterObjectPath: text("poster_object_path"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShowcaseVideo = typeof showcaseVideosTable.$inferSelect;
