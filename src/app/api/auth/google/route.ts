import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/google`;

  if (!clientId) {
    return NextResponse.json({
      configured: false,
      message: "GOOGLE_CLIENT_ID not configured in .env",
    });
  }

  const scope = encodeURIComponent("openid email profile");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;

  const wantRedirect = req.nextUrl.searchParams.get("redirect") === "true";
  if (wantRedirect) {
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({
    configured: true,
    url: authUrl,
  });
}
