export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { snips, quizAttempts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const deviceId = (req.nextUrl.searchParams.get("deviceId") || "anonymous").slice(0, 80);
  const [history, attempts] = await Promise.all([
    db.select().from(snips).where(eq(snips.deviceId, deviceId)).orderBy(desc(snips.createdAt)).limit(50),
    db.select().from(quizAttempts).where(eq(quizAttempts.deviceId, deviceId)).orderBy(desc(quizAttempts.createdAt)).limit(200),
  ]);
  const byTopic: Record<string, { total: number; correct: number }> = {};
  for (const a of attempts) { byTopic[a.topic] ??= { total: 0, correct: 0 }; byTopic[a.topic].total++; if (a.correct) byTopic[a.topic].correct++; }
  const modeCounts: Record<string, number> = {};
  for (const h of history) modeCounts[h.mode] = (modeCounts[h.mode] || 0) + 1;
  const hintHeavy = Object.entries(byTopic).filter(([, v]) => v.total >= 2 && v.correct / v.total < 0.5).map(([k]) => k);
  return NextResponse.json({
    history, modeCounts,
    mastery: Object.entries(byTopic).map(([topic, v]) => ({ topic, total: v.total, correct: v.correct, pct: Math.round((v.correct / v.total) * 100) })).sort((a, b) => b.pct - a.pct),
    totalAttempts: attempts.length, totalCorrect: attempts.filter((a) => a.correct).length, weakAreas: hintHeavy,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const rows = await db.select().from(snips).where(eq(snips.id, id)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.update(snips).set({ favorite: !rows[0].favorite }).where(eq(snips.id, id));
  return NextResponse.json({ ok: true, favorite: !rows[0].favorite });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(snips).where(eq(snips.id, id));
  return NextResponse.json({ ok: true });
}
