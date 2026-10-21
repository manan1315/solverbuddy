import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { snips, demoRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { solve, maybeGemini, type Mode, type InputType } from "@/lib/solver";
import { getOrCreateAccount, applyCredits, exceedsQuota, quotaView } from "@/lib/credits";

const DEMO_LIMIT = 4; // Exactly 4 questions allowed in Try Live Demo before locking

export async function GET(req: NextRequest) {
  const deviceId = (req.nextUrl.searchParams.get("deviceId") || "anonymous").slice(0, 80);
  const rows = await db.select().from(demoRequests).where(eq(demoRequests.deviceId, deviceId));
  const totalAsked = rows.reduce((acc, r) => acc + (r.count || 0), 0);
  const isLocked = totalAsked >= DEMO_LIMIT;
  return NextResponse.json({
    totalAsked,
    limit: DEMO_LIMIT,
    remaining: Math.max(0, DEMO_LIMIT - totalAsked),
    isLocked,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text ?? "").trim();
    const mode = (["direct", "eli5", "quiz", "hint"].includes(body.mode) ? body.mode : "direct") as Mode;
    const deviceId = String(body.deviceId || "anonymous").slice(0, 80);
    const inputType = (body.inputType || "text") as InputType;
    if (!text && !body.hasImage) return NextResponse.json({ error: "Add some text, snip a sample, or upload an image first." }, { status: 400 });

    // Total demo limit per device (4 questions max)
    const allRows = await db.select().from(demoRequests).where(eq(demoRequests.deviceId, deviceId));
    const totalCount = allRows.reduce((acc, r) => acc + (r.count || 0), 0);
    if (totalCount >= DEMO_LIMIT) {
      return NextResponse.json({
        error: "Free demo limit of 4 questions reached. Subscribe to continue.",
        rateLimited: true,
        isLocked: true,
        limit: DEMO_LIMIT,
      }, { status: 429 });
    }

    const day = new Date().toISOString().slice(0, 10);
    const todayRow = allRows.find((r) => r.day === day);
    if (todayRow) await db.update(demoRequests).set({ count: todayRow.count + 1 }).where(eq(demoRequests.id, todayRow.id));
    else await db.insert(demoRequests).values({ deviceId, day, count: 1 });

    const effectiveText = text || "x^2 + 5x + 6 = 0 (read from uploaded image)";
    const result = solve(effectiveText, mode, {
      showSteps: !!body.showSteps, hintLevel: Number(body.hintLevel) || 1,
      language: String(body.language || "English"), inputType, hasImage: !!body.hasImage, fileName: String(body.fileName || ""),
    });

    const acc = await getOrCreateAccount(deviceId);
    const over = exceedsQuota(acc, result.credits);
    if (over) return NextResponse.json({ error: over, quotaExceeded: true, quotas: quotaView(acc) }, { status: 402 });

    // Real model call when a key is configured — narration only for non-quiz/hint modes
    let liveText: string | null = null;
    if ((process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY) && mode !== "quiz") {
      liveText = await maybeGemini(effectiveText, mode);
    }
    if (liveText && mode === "direct") result.answer = liveText.slice(0, 1200);
    if (liveText && mode === "eli5") result.bullets = liveText.split("\n").filter(Boolean).slice(0, 5);

    const quotas = await applyCredits(deviceId, result.credits);

    await db.insert(snips).values({
      deviceId, inputText: effectiveText.slice(0, 4000), inputType, mode, language: String(body.language || result.detectedLanguage),
      topic: result.topic, route: result.route, answer: (result.answer || result.hint || "").slice(0, 4000), confidence: result.confidence, credits: result.credits,
    });

    const newTotal = totalCount + 1;
    return NextResponse.json({
      ok: true,
      result,
      quotas,
      liveModel: !!liveText,
      totalAsked: newTotal,
      limit: DEMO_LIMIT,
      demoRemaining: Math.max(0, DEMO_LIMIT - newTotal),
      isLocked: newTotal >= DEMO_LIMIT,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something hiccuped. Try again in a second." }, { status: 500 });
  }
}
