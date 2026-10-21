"use client";
import { useState } from "react";
import { Navbar, Footer } from "@/components/Chrome";
import PricingCards from "@/components/Pricing";
import { useReveal } from "@/lib/client";

const COMPARE: [string, string, string, string][] = [
  ["Big-model answers", "40 (7 days)", "300 / mo", "330 / mo"],
  ["Math solver calls", "30", "200 / mo", "220 / mo"],
  ["OCR snips (image)", "30", "120 / mo", "132 / mo"],
  ["Video upload minutes", "30", "180 / mo", "198 / mo"],
  ["PDF docs", "3 · ≤20 pages", "20 / mo · ≤50 pages", "22 / mo"],
  ["YouTube transcript Q&A", "Unlimited", "Unlimited", "Unlimited"],
  ["Small-model answers", "Free", "Free", "Free"],
  ["Queue", "Standard", "Standard", "Light priority"],
  ["Rollover", "—", "—", "Within 3-month term"],
];

export default function PricingPage() {
  useReveal();
  const [view, setView] = useState<"plan" | "month">("plan");
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6">
        <div className="fade-up text-center">
          <h1 className="font-display text-4xl font-extrabold text-[#0b1b2b]">Pricing</h1>
          <p className="mx-auto mt-3 max-w-md text-[#5b7a99]">Every plan includes all 4 modes and every tool. Credits control cost — fairly.</p>
          <div className="mt-6 inline-flex rounded-full bg-white p-1 ring-1 ring-sky-200 card-shadow" role="tablist" aria-label="Price view">
            <button role="tab" aria-selected={view === "plan"} onClick={() => setView("plan")} className={`focusable min-h-[42px] rounded-full px-5 text-sm font-bold ${view === "plan" ? "bg-[#1463ff] text-white" : "text-[#35546f]"}`}>Plan price</button>
            <button role="tab" aria-selected={view === "month"} onClick={() => setView("month")} className={`focusable min-h-[42px] rounded-full px-5 text-sm font-bold ${view === "month" ? "bg-[#1463ff] text-white" : "text-[#35546f]"}`}>Per-month view</button>
          </div>
          {view === "month" && <p className="fade-up mx-auto mt-4 max-w-lg rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1b2b] ring-1 ring-sky-200">Trial: $0.99 for 7 days · Monthly: $11.99/mo · Semester: <span className="text-emerald-600">$9.99/mo effective</span> ($29.99 / 3 months)</p>}
        </div>
        <div className="mt-10"><PricingCards /></div>

        <section className="reveal mt-12 overflow-hidden rounded-3xl bg-white ring-1 ring-sky-100 card-shadow">
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-sky-100 bg-sky-50/70 text-[#0b1b2b]"><th className="px-5 py-4 font-display">Quota</th><th className="px-5 py-4 font-display">Trial $0.99</th><th className="px-5 py-4 font-display">Monthly $11.99</th><th className="px-5 py-4 font-display">Semester $29.99</th></tr></thead>
              <tbody>{COMPARE.map((r) => <tr key={r[0]} className="border-b border-sky-50 last:border-0"><td className="px-5 py-3.5 font-semibold text-[#0b1b2b]">{r[0]}</td><td className="px-5 py-3.5 text-[#5b7a99]">{r[1]}</td><td className="px-5 py-3.5 text-[#5b7a99]">{r[2]}</td><td className="px-5 py-3.5 font-semibold text-[#0b4ad1]">{r[3]}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <div className="reveal mt-6 grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-sky-100 card-shadow"><p className="font-display font-extrabold text-[#0b1b2b]">Why it stays sustainable</p><p className="mt-1.5 text-[#5b7a99]">Simple queries route to small models. Math solves locally first. Heavy work is credit-capped with daily soft caps.</p></div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-sky-100 card-shadow"><p className="font-display font-extrabold text-[#0b1b2b]">Trial guardrails</p><p className="mt-1.5 text-[#5b7a99]">Card required, one trial per device/user. Auto-converts to Monthly unless cancelled within 7 days.</p></div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-sky-100 card-shadow"><p className="font-display font-extrabold text-[#0b1b2b]">Refunds, plainly</p><p className="mt-1.5 text-[#5b7a99]">Cancel Monthly anytime. Semester pro-rata within 14 days. Unused Power Packs refunded. <a className="font-bold text-[#1463ff]" href="/terms#refunds">Full terms →</a></p></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
