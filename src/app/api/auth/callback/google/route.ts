export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_credentials`);
  }

  try {
    const redirectUri = `${origin}/api/auth/callback/google`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/?auth_error=token_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/?auth_error=userinfo_failed`);
    }

    const googleUser = await userRes.json();
    const email = String(googleUser.email || "").toLowerCase();
    const name = String(googleUser.name || "");
    const avatarUrl = String(googleUser.picture || "");
    const googleId = String(googleUser.id || "");

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

    const redirect = NextResponse.redirect(`${origin}/studio?signed_in=true`);
    redirect.cookies.set("sb_user", JSON.stringify({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
    }), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
    });

    return redirect;
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(`${origin}/?auth_error=server_error`);
  }
}
