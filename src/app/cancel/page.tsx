"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { Navbar, Footer } from "@/components/Chrome";
import { planById } from "@/lib/plans";
import { startCheckout } from "@/lib/client";

function Inner() {
  const sp = useSearchParams();
  const plan = planById(sp.get("plan") || "trial");
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-16 text-center sm:px-6">
      <div className="fade-up rounded-3xl bg-white p-9 card-shadow-lg ring-1 ring-sky-100 sm:p-12">
        <XCircle className="mx-auto text-[#5b7a99]" size={52} />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-[#0b1b2b]">Checkout cancelled</h1>
        <p className="mt-3 text-[#5b7a99]">No charge was made. Your current quotas are untouched, and the free demo still works.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={() => startCheckout(plan.id)} className="btn-primary focusable inline-flex min-h-[50px] items-center rounded-full px-6 font-bold">Retry {plan.name} — {plan.price}</button>
          <a href="/pricing" className="focusable inline-flex min-h-[50px] items-center rounded-full border border-sky-200 bg-white px-6 font-bold text-[#0b1b2b] hover:bg-sky-50">Compare plans</a>
        </div>
      </div>
    </main>
  );
}

export default function CancelPage() {
  return <><Navbar /><Suspense fallback={<p className="p-16 text-center text-[#5b7a99]">Loading…</p>}><Inner /></Suspense><Footer /></>;
}
