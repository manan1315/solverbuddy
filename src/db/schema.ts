import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  browser: text("browser").default("Chrome"),
  source: text("source").default("landing"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsletterSubs = pgTable("newsletter_subs", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creditAccounts = pgTable("credit_accounts", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  plan: text("plan").notNull().default("trial"), // trial | monthly | semester
  bigUsed: integer("big_used").notNull().default(0),
  mathUsed: integer("math_used").notNull().default(0),
  ocrUsed: integer("ocr_used").notNull().default(0),
  videoUsed: integer("video_used").notNull().default(0),
  pdfUsed: integer("pdf_used").notNull().default(0),
  bonusBig: integer("bonus_big").notNull().default(0),
  bonusMath: integer("bonus_math").notNull().default(0),
  bonusOcr: integer("bonus_ocr").notNull().default(0),
  bonusVideo: integer("bonus_video").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(1),
  lastActiveDay: text("last_active_day").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const snips = pgTable("snips", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  inputText: text("input_text").notNull(),
  inputType: text("input_type").notNull().default("text"), // text|image|pdf|video|snip
  mode: text("mode").notNull(),
  language: text("language").notNull().default("English"),
  topic: text("topic").notNull().default("General"),
  route: text("route").notNull().default("Small AI"),
  answer: text("answer").notNull().default(""),
  confidence: text("confidence").notNull().default("high"),
  credits: jsonb("credits").$type<Record<string, number>>().default({}),
  favorite: boolean("favorite").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  topic: text("topic").notNull().default("General"),
  question: text("question").notNull(),
  correct: boolean("correct").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkouts = pgTable("checkouts", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").default("anonymous"),
  plan: text("plan").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("mock_completed"), // mock_completed | stripe_pending
  stripeSessionId: text("stripe_session_id").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const demoRequests = pgTable("demo_requests", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().default("anonymous"),
  day: text("day").notNull(),
  count: integer("count").notNull().default(0),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").default(""),
  avatarUrl: text("avatar_url").default(""),
  googleId: text("google_id").default(""),
  provider: text("provider").default("google"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
});
