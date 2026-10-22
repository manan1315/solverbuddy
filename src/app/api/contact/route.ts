export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 4) return NextResponse.json({ error: "Add a valid email and a short message." }, { status: 400 });
  await db.insert(contactMessages).values({ name: String(body.name || ""), email, message: message.slice(0, 3000) });
  return NextResponse.json({ ok: true, message: "Message received. We reply within 2 business days." });
}
