import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe"; // Need to check if this exists

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // TODO: Handle subscription/payment logic
      console.log("Payment succeeded:", session.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}
