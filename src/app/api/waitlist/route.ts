import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { eq, count } from "drizzle-orm";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const rows = await db.select({ n: count() }).from(waitlist);
  return NextResponse.json({ count: rows[0]?.n ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  const existing = await db.select().from(waitlist).where(eq(waitlist.email, email)).limit(1);
  if (existing.length) return NextResponse.json({ ok: true, already: true, message: "Already on list." });
  await db.insert(waitlist).values({ email, browser: String(body.browser || "Chrome"), source: String(body.source || "landing") });
  const rows = await db.select({ n: count() }).from(waitlist);
  return NextResponse.json({ ok: true, message: "You're in.", position: rows[0]?.n ?? 1 });
}
