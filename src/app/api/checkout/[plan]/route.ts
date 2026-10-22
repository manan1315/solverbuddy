export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { checkouts, creditAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { planById, ADDONS } from "@/lib/plans";
import { getOrCreateAccount } from "@/lib/credits";

export async function POST(req: NextRequest, ctx: { params: Promise<{ plan: string }> }) {
  const { plan: planId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const deviceId = String(body.deviceId || "anonymous").slice(0, 80);
  const origin = req.headers.get("origin") || new URL(req.url).origin;

  const addon = ADDONS.find((a) => a.id === planId);
  const plan = planById(planId);
  const isAddon = !!addon;
  const amount = isAddon ? addon.priceCents : plan.priceCents;
  const label = isAddon ? addon.label : `${plan.name} — ${plan.price}`;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Payments not configured. Please add STRIPE_SECRET_KEY." }, { status: 500 });
  }
  const priceEnv = planId === "trial" ? process.env.STRIPE_PRICE_TRIAL : planId === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : planId === "semester" ? process.env.STRIPE_PRICE_SEMESTER : undefined;
  try {
    const form = new URLSearchParams();
    form.set("mode", planId === "trial" || isAddon ? "payment" : "subscription");
    if (priceEnv && !isAddon) { form.set("line_items[0][price]", priceEnv); form.set("line_items[0][quantity]", "1"); }
    else { form.set("line_items[0][price_data][currency]", "usd"); form.set("line_items[0][price_data][product_data][name]", `SolverBuddy ${label}`); form.set("line_items[0][price_data][unit_amount]", String(amount)); form.set("line_items[0][quantity]", "1"); if (form.get("mode") === "subscription") form.set("line_items[0][price_data][recurring][interval]", planId === "semester" ? "month" : "month"), form.set("line_items[0][price_data][recurring][interval_count]", planId === "semester" ? "3" : "1"); }
    form.set("success_url", `${origin}/success?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/cancel?plan=${planId}`);
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const j = await r.json() as { id?: string; url?: string; error?: any };
    if (!r.ok) {
       console.error("Stripe API Error:", j);
       throw new Error(`Stripe API returned ${r.status}: ${JSON.stringify(j)}`);
    }
    if (j.url) {
      await db.insert(checkouts).values({ deviceId, plan: planId, amountCents: amount, status: "stripe_pending", stripeSessionId: j.id || "" });
      return NextResponse.json({ url: j.url, stripe: true });
    }
    throw new Error("Failed to create Stripe session: No URL returned");
  } catch (e) {
    console.error("Stripe session error:", e);
    return NextResponse.json({ error: "Payment initiation failed. See server logs." }, { status: 500 });
  }
}
