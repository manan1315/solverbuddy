import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("sb_user")?.value;
    if (!userCookie) {
      return NextResponse.json({ user: null });
    }
    const parsed = JSON.parse(userCookie);
    const existing = await db.select().from(users).where(eq(users.email, parsed.email)).limit(1);
    if (existing.length) {
      return NextResponse.json({ user: existing[0] });
    }
    return NextResponse.json({ user: parsed });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || (email ? email.split("@")[0] : "Google User")).trim();
    const avatarUrl = String(body.avatarUrl || "");
    const googleId = String(body.googleId || "");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let currentUser;
    if (existing.length) {
      const updated = await db
        .update(users)
        .set({
          name: name || existing[0].name,
          avatarUrl: avatarUrl || existing[0].avatarUrl,
          googleId: googleId || existing[0].googleId,
          lastLoginAt: new Date(),
        })
        .where(eq(users.email, email))
        .returning();
      currentUser = updated[0];
    } else {
      const inserted = await db
        .insert(users)
        .values({
          email,
          name,
          avatarUrl,
          googleId,
          provider: "google",
          lastLoginAt: new Date(),
        })
        .returning();
      currentUser = inserted[0];
    }

    const res = NextResponse.json({ ok: true, user: currentUser });
    res.cookies.set("sb_user", JSON.stringify({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
    }), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: "lax",
    });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sb_user", "", { path: "/", maxAge: 0 });
  return res;
}
