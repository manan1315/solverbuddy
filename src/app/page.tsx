"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Scissors, Zap, Baby, HelpCircle, Lightbulb, Sigma, FileText, MonitorPlay, Languages, ShieldCheck, ArrowRight, ChevronDown, Sparkles, Puzzle, MousePointer2, BarChart3, Route, Check } from "lucide-react";
import { Navbar, Footer, extensionUrl } from "@/components/Chrome";
import { WaitlistModal } from "@/components/Modals";
import PricingCards from "@/components/Pricing";
import { startCheckout, useReveal } from "@/lib/client";
import type { Mode } from "@/lib/solver";

const DemoModal = dynamic(() => import("@/components/DemoModal"), { ssr: false });

const HERO_PREVIEW: Record<Mode, { label: string; body: React.ReactNode }> = {
  direct: { label: "Direct", body: <p className="font-mono text-lg font-bold text-[#0b1b2b]">x = −2, x = −3</p> },
  eli5: { label: "ELI5", body: <ul className="grid gap-1 text-sm text-[#35546f]"><li>• Find where the U-curve touches the ground line.</li><li>• It touches at −2 and −3. Done!</li></ul> },
  quiz: { label: "Quiz Me", body: <p className="text-sm text-[#35546f]"><span className="font-bold text-[#0b1b2b]">Q1.</span> Two numbers multiply to 6, add to 5. Which pair? <span className="mt-1 block text-xs text-[#5b7a99]">A) 1,6 &nbsp; B) 2,3 &nbsp; C) −2,−3</span></p> },
  hint: { label: "Hint", body: <p className="flex gap-2 text-sm text-[#35546f]"><Lightbulb size={16} className="shrink-0 text-amber-500" /> Find two numbers that multiply to +6 and add to +5…</p> },
};

const FAQ = [
  { q: "Is the demo free?", a: "Yes. The web demo runs free (fair-use daily limit per device). Small-model answers never consume big-model credits, so most everyday questions stay free inside every plan too." },
  { q: "Which languages are supported?", a: "English first, with an 11-language roadmap: Spanish, French, Portuguese, Russian, Arabic, Hindi, Chinese Simplified, German, Japanese and Indonesian. Answers can mirror your input language or a locked output language. Math notation is never translated." },
  { q: "What is the refund policy?", a: "Cancel the $0.99 trial within 7 days and it never converts. Monthly can be cancelled anytime (access until period end). Semester is refundable pro-rata within the first 14 days. Power Packs are refunded if unused." },
  { q: "What happens to my data?", a: "Snips are processed to answer you — analytics are opt-in, no PII is stored, and we're FERPA/GDPR-aligned. You can delete your history from the Studio anytime." },
  { q: "When does the extension launch?", a: "Chrome/Edge/Firefox (Manifest V3) is in final review. Join the waitlist and you'll get the store link + launch pricing the moment it's live. The web Studio works today." },
];

const FEATURES = [
  { icon: Scissors, title: "Snip Overlay", desc: "Select text, equations or images anywhere.", href: "/studio" },
  { icon: Zap, title: "4 Answer Modes", desc: "Direct. ELI5. Quiz. Hint. Strictly enforced.", demo: true },
  { icon: Sigma, title: "Math Solver + Graphs", desc: "SymPy-grade solving, steps, Desmos links.", text: "x² + 5x + 6 = 0" },
  { icon: FileText, title: "PDF → Chat + Quiz", desc: "Page-cited answers. Quiz per section.", href: "/studio" },
  { icon: MonitorPlay, title: "Video / YouTube → Chat", desc: "Timestamp-cited Q&A. Transcripts are free.", href: "/studio" },
  { icon: Languages, title: "Multilingual AI", desc: "English first. 11 languages rolling out.", text: "What is photosynthesis?" },
];

const ROUTES = [
  { id: "short", label: "Short text <300 chars", route: "Small AI (GPT-4o mini / Llama 3)", cost: "Free of big-model credit", color: "bg-emerald-100 text-emerald-800" },
  { id: "math", label: "Math / code detected", route: "SymPy solves → LLM explains", cost: "1 math credit", color: "bg-sky-100 text-[#0b4ad1]" },
  { id: "image", label: "Image / screenshot snip", route: "Gemini Flash Vision + OCR", cost: "1 OCR credit", color: "bg-sky-100 text-[#0b4ad1]" },
  { id: "long", label: "Long PDF / video transcript", route: "Chunked → Big LLM", cost: "1 big-model credit", color: "bg-violet-100 text-violet-800" },
  { id: "repeat", label: "Repeat question", route: "Cache / open-source fallback", cost: "Free", color: "bg-emerald-100 text-emerald-800" },
];

export default function HomePage() {
  useReveal();
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoText, setDemoText] = useState("");
  const [demoMode, setDemoMode] = useState<Mode>("direct");
  const [demoKey, setDemoKey] = useState(0);
  const [heroMode, setHeroMode] = useState<Mode>("direct");
  const [waitlist, setWaitlist] = useState(false);
  const [waitCount, setWaitCount] = useState<number | null>(null);
  const [route, setRoute] = useState(ROUTES[0]);
  const [faq, setFaq] = useState(0);
  const ext = extensionUrl();

  useEffect(() => { fetch("/api/waitlist").then((r) => r.json()).then((j) => setWaitCount(j.count)).catch(() => {}); }, [waitlist]);
  function openDemo(text = "", mode: Mode = "direct") { setDemoText(text); setDemoMode(mode); setDemoKey((k) => k + 1); setDemoOpen(true); }

  return (
    <>
      <Navbar onDemo={() => openDemo()} />
      <main>
        {/* ---------- HERO ---------- */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div className="fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#0b4ad1] ring-1 ring-sky-200 card-shadow"><Sparkles size={13} /> NEW • 2026 MAY UPDATE</p>
            <h1 className="font-display mt-6 text-[clamp(2.4rem,5.4vw,4rem)] font-extrabold leading-[1.04] tracking-tight text-[#0b1b2b]">
              Snip anything on your screen.<br /><span className="text-[#1463ff]">Get answers your way.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#5b7a99]">Direct. Explain like I'm 5. Quiz. Hint.<br />Math + Graphs. PDF &amp; Video chat. English first.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => openDemo()} className="btn-primary focusable inline-flex min-h-[54px] items-center gap-2 rounded-full px-7 text-base font-bold">Try Live Demo <ArrowRight size={18} /></button>
              <button onClick={() => startCheckout("trial")} className="focusable inline-flex min-h-[54px] items-center gap-2 rounded-full bg-[#10b981] px-7 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600">Start $0.99 Trial</button>
            </div>
            <p className="mt-3 text-xs text-[#5b7a99]">Card required. Auto-converts to $11.99/mo unless cancelled within 7 days.</p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#35546f]">
              <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-emerald-500" /> 4 strict modes</span>
              <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-emerald-500" /> Screen-first, not chat-first</span>
              <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-emerald-500" /> 11-language roadmap</span>
            </div>
          </div>

          {/* Floating interactive mockup */}
          <div className="relative fade-up" style={{ animationDelay: "120ms" }}>
            <div className="floaty card-shadow-lg relative overflow-hidden rounded-3xl bg-white ring-1 ring-sky-100">
              <div className="flex items-center gap-2 border-b border-sky-100 bg-sky-50/70 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-300" /><span className="h-3 w-3 rounded-full bg-amber-300" /><span className="h-3 w-3 rounded-full bg-emerald-300" />
                <span className="ml-2 truncate rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#5b7a99] ring-1 ring-sky-100">textbook.example/algebra/ch4</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#1463ff] px-2.5 py-1 text-[10px] font-bold text-white"><Scissors size={10} /> SNIP</span>
              </div>
              <div className="relative p-5">
                <p className="text-[13px] font-semibold text-[#5b7a99]">Chapter 4 · Quadratic Equations</p>
                <div className="relative mt-3 rounded-xl bg-sky-50/80 p-4">
                  <div className="pointer-events-none absolute inset-1.5 rounded-lg border-2 border-dashed border-[#1463ff]/70" aria-hidden="true">
                    <span className="absolute -top-2.5 left-3 bg-[#1463ff] px-1.5 py-0.5 text-[9px] font-bold text-white rounded">SNIPPED</span>
                  </div>
                  <p className="font-mono text-base text-[#0b1b2b]">Solve: x² + 5x + 6 = 0</p>
                  <p className="mt-1 text-xs text-[#5b7a99]">Show your working. (4 marks)</p>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-1.5" role="tablist" aria-label="Preview answer modes">
                  {(Object.keys(HERO_PREVIEW) as Mode[]).map((m) => {
                    const icons = { direct: Zap, eli5: Baby, quiz: HelpCircle, hint: Lightbulb }; const Icon = icons[m];
                    return <button key={m} role="tab" aria-selected={heroMode === m} onClick={() => setHeroMode(m)} className={`focusable flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold transition ${heroMode === m ? "bg-[#1463ff] text-white shadow-md shadow-blue-500/30" : "bg-sky-50 text-[#35546f] hover:bg-sky-100"}`}><Icon size={15} />{HERO_PREVIEW[m].label}</button>;
                  })}
                </div>
                <div key={heroMode} className="fade-up mt-3 min-h-[76px] rounded-xl border border-sky-100 bg-white p-4">{HERO_PREVIEW[heroMode].body}</div>
                <button onClick={() => openDemo("x² + 5x + 6 = 0", heroMode)} className="btn-primary focusable mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full text-sm font-bold">Solve this for real <ArrowRight size={15} /></button>
              </div>
            </div>
            <div className="floaty-slow absolute -left-3 -top-5 hidden rounded-2xl bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1b2b] card-shadow ring-1 ring-sky-100 sm:block" style={{ ["--r" as string]: "-4deg" }}>📐 SymPy solved · 0 big credits</div>
            <div className="floaty absolute -bottom-5 -right-2 hidden rounded-2xl bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1b2b] card-shadow ring-1 ring-sky-100 sm:block" style={{ ["--r" as string]: "3deg", animationDelay: "1.2s" }}>🌍 Answer in Español ✓</div>
          </div>
        </section>

        {/* ---------- EXTENSION ---------- */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="reveal grid items-center gap-8 overflow-hidden rounded-3xl bg-white p-7 card-shadow ring-1 ring-sky-100 sm:p-10 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold text-[#0b4ad1]"><Puzzle size={12} /> BROWSER EXTENSION</p>
              <h2 className="font-display mt-4 text-3xl font-extrabold text-[#0b1b2b]">Snip from anywhere.</h2>
              <p className="mt-3 max-w-md text-[#5b7a99]">Select text, equations, or images directly from any website or PDF. Chrome · Edge · Firefox, Manifest V3.</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {ext ? <a href={ext} target="_blank" rel="noreferrer" className="btn-primary focusable inline-flex min-h-[50px] items-center gap-2 rounded-full px-6 font-bold">Add to Chrome</a>
                  : <button onClick={() => setWaitlist(true)} className="btn-primary focusable inline-flex min-h-[50px] items-center gap-2 rounded-full px-6 font-bold">Join Waitlist</button>}
                <a href="/studio" className="focusable inline-flex min-h-[50px] items-center gap-2 rounded-full border border-sky-200 bg-white px-6 font-bold text-[#0b1b2b] hover:bg-sky-50">Use Web Studio now</a>
              </div>
              {waitCount !== null && <p className="mt-3 text-sm font-semibold text-emerald-600">{waitCount} learner{waitCount === 1 ? "" : "s"} already in line</p>}
            </div>
            <div className="relative rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 p-5 ring-1 ring-sky-100" aria-hidden="true">
              <div className="rounded-xl bg-white p-4 card-shadow">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5b7a99]"><MousePointer2 size={13} className="text-[#1463ff]" /> Drag to snip any region…</div>
                <div className="relative mt-3 space-y-2">
                  <div className="h-2.5 w-11/12 rounded bg-sky-100" /><div className="h-2.5 w-4/5 rounded bg-sky-100" />
                  <div className="relative rounded-lg border-2 border-dashed border-[#1463ff] bg-sky-50 p-2.5"><p className="font-mono text-sm text-[#0b1b2b]">∫ 2x dx = ?</p><span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1463ff] text-white"><Scissors size={12} /></span></div>
                  <div className="h-2.5 w-3/5 rounded bg-sky-100" />
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">DOM text = free · Image = 1 OCR credit</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- FEATURES ---------- */}
        <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <div className="reveal text-center">
            <h2 className="font-display text-3xl font-extrabold text-[#0b1b2b] sm:text-4xl">Built around your screen.</h2>
            <p className="mx-auto mt-3 max-w-lg text-[#5b7a99]">Not another chat box. Six tools, one gesture: snip.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <button key={f.title} onClick={() => f.href ? window.location.href = f.href : openDemo(f.text || "", f.title.includes("Modes") ? "quiz" : "direct")} className="reveal focusable group rounded-3xl bg-white p-6 text-left card-shadow ring-1 ring-sky-100 transition hover:-translate-y-1 hover:ring-sky-300">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-[#1463ff] transition group-hover:bg-[#1463ff] group-hover:text-white"><f.icon size={22} /></span>
                <h3 className="font-display mt-4 text-lg font-extrabold text-[#0b1b2b]">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5b7a99]">{f.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#1463ff]">Try it <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
              </button>
            ))}
          </div>
        </section>

        {/* ---------- HOW IT WORKS + ROUTING ---------- */}
        <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <div className="reveal grid gap-4 lg:grid-cols-3">
            {[["1", "Snip or Paste", "Drag over anything — text, equation, image, PDF page, video frame."], ["2", "Pick Your Mode", "Direct, ELI5, Quiz, or Hint. Strict output, every time."], ["3", "Learn Faster", "Steps, graphs, citations and mastery tracking built in."]].map(([n, t, d]) => (
              <div key={n} className="rounded-3xl bg-white p-7 card-shadow ring-1 ring-sky-100">
                <span className="font-display flex h-11 w-11 items-center justify-center rounded-full bg-[#1463ff] text-lg font-extrabold text-white">{n}</span>
                <h3 className="font-display mt-4 text-xl font-extrabold text-[#0b1b2b]">{t}</h3><p className="mt-1.5 text-sm text-[#5b7a99]">{d}</p>
              </div>
            ))}
          </div>

          <div className="reveal mt-4 rounded-3xl bg-white p-7 card-shadow ring-1 ring-sky-100 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold text-[#0b4ad1]"><Route size={12} /> SMART ROUTING</p>
                <h3 className="font-display mt-3 text-2xl font-extrabold text-[#0b1b2b]">Your credits only burn when they should.</h3>
                <p className="mt-1.5 max-w-lg text-sm text-[#5b7a99]">Tap a snip type — see exactly which engine answers and what it costs.</p></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {ROUTES.map((r) => <button key={r.id} onClick={() => setRoute(r)} className={`focusable min-h-[44px] rounded-full px-4 text-sm font-bold transition ${route.id === r.id ? "bg-[#1463ff] text-white shadow-md shadow-blue-500/30" : "bg-sky-50 text-[#35546f] hover:bg-sky-100"}`}>{r.label}</button>)}
            </div>
            <div key={route.id} className="fade-up mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-sky-50 p-5">
              <span className="font-display text-lg font-extrabold text-[#0b1b2b]">{route.route}</span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${route.color}`}>{route.cost}</span>
              <button onClick={() => openDemo(route.id === "math" ? "x² + 5x + 6 = 0" : route.id === "long" ? "Photosynthesis is the process by which green plants convert sunlight, water and carbon dioxide into glucose and oxygen. It takes place in chloroplasts and underpins nearly all life on Earth because it produces the oxygen we breathe and the food chains we depend on every single day." : "What is the water cycle?")} className="ml-auto inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-[#0b4ad1] ring-1 ring-sky-200 hover:bg-sky-100">Test this route <ArrowRight size={14} /></button>
            </div>
          </div>

          <div className="reveal mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-emerald-50 p-7 ring-1 ring-emerald-200">
              <ShieldCheck className="text-emerald-600" size={26} />
              <h3 className="font-display mt-3 text-xl font-extrabold text-[#0b1b2b]">Academic Integrity Mode</h3>
              <p className="mt-1.5 text-sm text-[#35546f]">Lock Direct Answers. Enable Quiz + Hint only. Made for classrooms and honest homework.</p>
              <button onClick={() => openDemo("x² + 5x + 6 = 0", "hint")} className="focusable mt-4 inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#10b981] px-5 text-sm font-bold text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600">Try Hint-only mode</button>
            </div>
            <div className="rounded-3xl bg-white p-7 card-shadow ring-1 ring-sky-100">
              <BarChart3 className="text-[#1463ff]" size={26} />
              <h3 className="font-display mt-3 text-xl font-extrabold text-[#0b1b2b]">Know what you actually know</h3>
              <p className="mt-1.5 text-sm text-[#5b7a99]">Topic mastery, confusion patterns, accuracy and streaks — opt-in, privacy-first, in your Studio.</p>
              <a href="/studio#analytics" className="btn-primary focusable mt-4 inline-flex min-h-[46px] items-center gap-2 rounded-full px-5 text-sm font-bold">Open my analytics <ArrowRight size={15} /></a>
            </div>
          </div>

          <p className="reveal mt-8 text-center text-xs font-semibold tracking-wide text-[#8fb2d9]">POWERED BY&nbsp; GEMINI · GROQ LLAMA 3 · SYMPY · DESMOS · PDF.JS · TESSERACT · WHISPER</p>
        </section>

        {/* ---------- PRICING ---------- */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="reveal text-center">
            <h2 className="font-display text-3xl font-extrabold text-[#0b1b2b] sm:text-4xl">Three plans. No surprises.</h2>
            <p className="mx-auto mt-3 max-w-md text-[#5b7a99]">Same features on every plan. Credits keep it fair.</p>
          </div>
          <div className="mt-10"><PricingCards /></div>
          <p className="reveal mt-4 text-center text-xs text-[#5b7a99]">YouTube transcripts don't consume minutes. DOM text doesn't consume OCR credits.</p>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-20 sm:px-6">
          <h2 className="reveal font-display text-center text-3xl font-extrabold text-[#0b1b2b]">Questions, answered.</h2>
          <div className="mt-8 grid gap-3">
            {FAQ.map((f, i) => (
              <div key={f.q} className="reveal rounded-2xl bg-white ring-1 ring-sky-100 card-shadow">
                <button onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i} className="focusable flex min-h-[56px] w-full items-center justify-between gap-3 px-5 text-left font-display font-bold text-[#0b1b2b]">{f.q}<ChevronDown size={18} className={`shrink-0 text-[#1463ff] transition ${faq === i ? "rotate-180" : ""}`} /></button>
                {faq === i && <p className="fade-up px-5 pb-5 text-sm leading-relaxed text-[#5b7a99]">{f.a}</p>}
              </div>
            ))}
          </div>
          <div className="reveal mt-10 rounded-3xl bg-[#1463ff] p-8 text-center shadow-xl shadow-blue-500/30 sm:p-10">
            <h3 className="font-display text-2xl font-extrabold text-white sm:text-3xl">Your next answer is one snip away.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-sky-100">7 days for $0.99. Cancel in two taps.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => openDemo()} className="focusable inline-flex min-h-[50px] items-center rounded-full bg-white px-6 font-bold text-[#0b4ad1] hover:bg-sky-50">Try Live Demo</button>
              <button onClick={() => startCheckout("trial")} className="focusable inline-flex min-h-[50px] items-center rounded-full bg-[#10b981] px-6 font-bold text-white hover:bg-emerald-600">Start $0.99 Trial</button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <DemoModal key={demoKey} open={demoOpen} onClose={() => setDemoOpen(false)} initialText={demoText} initialMode={demoMode} />
      <WaitlistModal open={waitlist} onClose={() => setWaitlist(false)} />
    </>
  );
}
