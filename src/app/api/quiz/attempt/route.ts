export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  await db.insert(quizAttempts).values({
    deviceId: String(body.deviceId || "anonymous").slice(0, 80),
    topic: String(body.topic || "General").slice(0, 120),
    question: String(body.question || "").slice(0, 500),
    correct: !!body.correct,
    difficulty: Number(body.difficulty) || 1,
  });
  return NextResponse.json({ ok: true });
}
