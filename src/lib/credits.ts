import { db } from "@/db";
import { creditAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { planById } from "./plans";

export type AccountRow = typeof creditAccounts.$inferSelect;

export async function getOrCreateAccount(deviceId: string): Promise<AccountRow> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const existing = await db.select().from(creditAccounts).where(eq(creditAccounts.deviceId, deviceId)).limit(1);
    if (existing && existing.length) {
      const acc = existing[0];
      if (acc.lastActiveDay !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const streak = acc.lastActiveDay === yesterday ? acc.streakDays + 1 : acc.lastActiveDay ? 1 : acc.streakDays;
        await db.update(creditAccounts).set({ lastActiveDay: today, streakDays: streak, updatedAt: new Date() }).where(eq(creditAccounts.deviceId, deviceId));
        return { ...acc, lastActiveDay: today, streakDays: streak };
      }
      return acc;
    }
    const inserted = await db.insert(creditAccounts).values({ deviceId, lastActiveDay: today }).returning();
    if (inserted && inserted[0]) return inserted[0];
  } catch (err) {
    console.warn("DB error or no DB:", err);
  }
  // Safe Fallback account row for Demo/No-DB mode
  return {
    id: 1,
    deviceId,
    plan: "trial",
    bigUsed: 0,
    mathUsed: 0,
    ocrUsed: 0,
    videoUsed: 0,
    pdfUsed: 0,
    bonusBig: 100,
    bonusMath: 100,
    bonusOcr: 100,
    bonusVideo: 100,
    streakDays: 1,
    lastActiveDay: today,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as AccountRow;
}

export function quotaView(acc: AccountRow) {
  const plan = planById(acc.plan);
  const q = plan.quotas;
  return {
    plan: plan.id, planName: plan.name, streakDays: acc.streakDays,
    big: { used: acc.bigUsed, total: q.big + acc.bonusBig, label: "Big-model answers" },
    math: { used: acc.mathUsed, total: q.math + acc.bonusMath, label: "Math solver calls" },
    ocr: { used: acc.ocrUsed, total: q.ocr + acc.bonusOcr, label: "OCR snips" },
    video: { used: acc.videoUsed, total: q.video + acc.bonusVideo, label: "Video minutes" },
    pdf: { used: acc.pdfUsed, total: q.pdf, label: "PDF docs" },
  };
}

export async function applyCredits(deviceId: string, credits: { big: number; math: number; ocr: number; video: number; pdf: number }) {
  const acc = await getOrCreateAccount(deviceId);
  try {
    await db.update(creditAccounts).set({
      bigUsed: acc.bigUsed + credits.big, mathUsed: acc.mathUsed + credits.math, ocrUsed: acc.ocrUsed + credits.ocr,
      videoUsed: acc.videoUsed + credits.video, pdfUsed: acc.pdfUsed + credits.pdf, updatedAt: new Date(),
    }).where(eq(creditAccounts.deviceId, deviceId));
    const fresh = await db.select().from(creditAccounts).where(eq(creditAccounts.deviceId, deviceId)).limit(1);
    if (fresh && fresh[0]) return quotaView(fresh[0]);
  } catch (err) {
    console.warn("DB error or no DB in applyCredits:", err);
  }
  return quotaView({
    ...acc,
    bigUsed: acc.bigUsed + credits.big,
    mathUsed: acc.mathUsed + credits.math,
    ocrUsed: acc.ocrUsed + credits.ocr,
    videoUsed: acc.videoUsed + credits.video,
    pdfUsed: acc.pdfUsed + credits.pdf,
  });
}

export function exceedsQuota(acc: AccountRow, credits: { big: number; math: number; ocr: number; video: number; pdf: number }): string | null {
  const v = quotaView(acc);
  if (credits.big && v.big.used + credits.big > v.big.total) return "Big-model answer quota reached. Add a Power Pack or upgrade.";
  if (credits.math && v.math.used + credits.math > v.math.total) return "Math solver quota reached. Add +100 Math calls for $2.";
  if (credits.ocr && v.ocr.used + credits.ocr > v.ocr.total) return "OCR snip quota reached. Add +200 OCR snips for $1.";
  if (credits.video && v.video.used + credits.video > v.video.total) return "Video minutes quota reached. Add +120 minutes for $3.";
  if (credits.pdf && v.pdf.used + credits.pdf > v.pdf.total) return "PDF document quota reached for this plan.";
  return null;
}
