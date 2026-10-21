"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Navbar, Footer } from "@/components/Chrome";
import { planById, ADDONS } from "@/lib/plans";
import { getDeviceId } from "@/lib/client";

function Inner() {
  const sp = useSearchParams();
  const planId = sp.get("plan") || "trial";
  const mock = sp.get("mock") === "true";
  const addon = ADDONS.find((a) => a.id === planId);
  const plan = planById(planId);
  const [quotaNote, setQuotaNote] = useState("");
  useEffect(() => {
    fetch(`/api/credits?deviceId=${getDeviceId()}`).then((r) => r.json()).then((j) => { if (j.quotas) setQuotaNote(`You're now on the ${j.quotas.planName} plan — ${j.quotas.big.total} big-model answers, ${j.quotas.math.total} math calls, ${j.quotas.ocr.total} OCR snips available.`); }).catch(() => {});
  }, []);
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-16 text-center sm:px-6">
      <div className="fade-up rounded-3xl bg-white p-9 card-shadow-lg ring-1 ring-sky-100 sm:p-12">
        <CheckCircle2 className="mx-auto text-emerald-500" size={56} />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-[#0b1b2b]">You're in. 🎉</h1>
        <p className="mt-3 text-[#5b7a99]">{addon ? `${addon.label} added to your balance.` : `${plan.name} (${plan.price}) is active on this device.`}</p>
        {planId === "trial" && <p className="mt-2 text-sm text-[#5b7a99]">Your 7 days start now. We'll convert to Monthly ($11.99/mo) after day 7 unless you cancel.</p>}
        {mock && <p className="mx-auto mt-4 max-w-md rounded-xl bg-sky-50 px-4 py-3 text-xs font-semibold text-[#0b4ad1]">Mock checkout — no card was charged. Add STRIPE_SECRET_KEY to enable live Stripe Checkout; quotas were still applied so you can test everything.</p>}
        {quotaNote && <p className="mt-4 text-sm font-semibold text-[#0b1b2b]">{quotaNote}</p>}
        <a href="/studio" className="btn-primary focusable mt-7 inline-flex min-h-[52px] items-center gap-2 rounded-full px-7 font-bold">Open Snip Studio <ArrowRight size={17} /></a>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return <><Navbar /><Suspense fallback={<p className="p-16 text-center text-[#5b7a99]">Confirming…</p>}><Inner /></Suspense><Footer /></>;
}
