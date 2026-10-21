"use client";
import { useState } from "react";
import { Check, Loader2, Sparkles, Plus } from "lucide-react";
import { PLANS, ADDONS } from "@/lib/plans";
import { startCheckout } from "@/lib/client";

export default function PricingCards({ showAddons = true }: { showAddons?: boolean }) {
  const [busy, setBusy] = useState("");
  async function buy(id: string) { setBusy(id); await startCheckout(id); setBusy(""); }
  return (
    <>
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {PLANS.map((p) => (
          <article key={p.id} className={`reveal relative flex flex-col rounded-3xl bg-white p-7 ${p.popular ? "card-shadow-lg ring-2 ring-[#1463ff]" : "card-shadow ring-1 ring-sky-100"}`}>
            {p.popular && <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#10b981] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30"><Sparkles size={12} /> MOST POPULAR</span>}
            <h3 className="font-display text-lg font-extrabold text-[#0b1b2b]">{p.name}</h3>
            <p className="mt-3 flex items-baseline gap-2"><span className="font-display text-[44px] font-extrabold leading-none text-[#0b1b2b]">{p.price}</span><span className="text-sm font-medium text-[#5b7a99]">{p.period}</span></p>
            {p.id === "semester" && <p className="mt-1.5 text-sm font-semibold text-emerald-600">Save ~17% vs Monthly</p>}
            <ul className="mt-5 grid flex-1 gap-2.5">
              {p.features.map((f) => <li key={f} className="flex gap-2.5 text-sm text-[#35546f]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[#1463ff]"><Check size={12} strokeWidth={3} /></span>{f}</li>)}
            </ul>
            <button onClick={() => buy(p.id)} disabled={busy === p.id} className={`focusable mt-7 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full font-bold ${p.popular ? "bg-[#10b981] text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600" : "btn-primary"}`}>
              {busy === p.id ? <Loader2 className="animate-spin" size={18} /> : null}{p.cta}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#5b7a99]">{p.note}</p>
          </article>
        ))}
      </div>
      {showAddons && (
        <div className="reveal mt-6 rounded-3xl bg-white/80 p-6 ring-1 ring-sky-100 card-shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="font-display font-extrabold text-[#0b1b2b]">Power Packs</h3><p className="text-sm text-[#5b7a99]">Top up anytime. Small-model answers are always free of big-model credit.</p></div>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {ADDONS.map((a) => (
              <button key={a.id} onClick={() => buy(a.id)} disabled={busy === a.id} className="focusable flex min-h-[52px] items-center justify-between gap-2 rounded-xl border border-sky-200 bg-white px-4 text-left text-sm font-semibold text-[#0b1b2b] transition hover:border-[#1463ff] hover:bg-sky-50">
                <span className="inline-flex items-center gap-1.5"><Plus size={14} className="text-[#1463ff]" />{a.label.replace(/^\+/, "")}</span>
                <span className="rounded-full bg-sky-100 px-2.5 py-1 font-bold text-[#0b4ad1]">{busy === a.id ? "…" : a.price}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#5b7a99]">Credit rules: big-model credit only when a big LLM is used · Math = 1 per solve · OCR = 1 per image (DOM text free) · YouTube transcript pulls free · PDF = 1 per document, chatting over it is free.</p>
        </div>
      )}
    </>
  );
}
