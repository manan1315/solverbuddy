export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAccount, quotaView } from "@/lib/credits";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId") || "anonymous";
  const acc = await getOrCreateAccount(deviceId.slice(0, 80));
  return NextResponse.json({ quotas: quotaView(acc) });
}
