import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  const existing = await db.select().from(newsletterSubs).where(eq(newsletterSubs.email, email)).limit(1);
  if (existing.length) return NextResponse.json({ ok: true, message: "Already subscribed — you're set." });
  await db.insert(newsletterSubs).values({ email });
  return NextResponse.json({ ok: true, message: "Subscribed. One short email a month, no noise." });
}
