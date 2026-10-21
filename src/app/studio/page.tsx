"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Scissors, Type, ImagePlus, FileText, MonitorPlay, Loader2, Flame, Star, Trash2, RotateCcw, ShieldCheck, BarChart3, Coins, Sparkles, Clock3, BookOpen } from "lucide-react";
import { Navbar, Footer } from "@/components/Chrome";
import { MODES } from "@/components/DemoModal";
import { AnswerBody } from "@/components/AnswerKit";
import type { SolveResult, Mode, InputType } from "@/lib/solver";
import { LANGUAGES, ADDONS } from "@/lib/plans";
import { getDeviceId, startCheckout } from "@/lib/client";

interface Quotas { plan: string; planName: string; streakDays: number; big: Q; math: Q; ocr: Q; video: Q; pdf: Q }
interface Q { used: number; total: number; label: string }
interface Hist { id: number; inputText: string; mode: string; topic: string; route: string; answer: string; inputType: string; favorite: boolean; createdAt: string }
interface Analytics { mastery: { topic: string; total: number; correct: number; pct: number }[]; totalAttempts: number; totalCorrect: number; weakAreas: string[]; modeCounts: Record<string, number> }

const SNIPPETS = [
  { tag: "Algebra · p.42", text: "x² + 5x + 6 = 0", kind: "math" },
  { tag: "Calculus · p.88", text: "Find the derivative of 3x^2 + 2x + 5", kind: "math" },
  { tag: "Biology · p.17", text: "Photosynthesis is the process where plants use sunlight, water and carbon dioxide to make glucose and oxygen in chloroplasts.", kind: "text" },
  { tag: "Earth Science · p.63", text: "Explain the water cycle: evaporation, condensation, precipitation and collection.", kind: "text" },
  { tag: "Physics · p.31", text: "How does Newton's law of gravity work, and what is F = ma?", kind: "text" },
  { tag: "Geometry · p.54", text: "A right triangle has sides 3 and 4. Use Pythagoras to find the hypotenuse.", kind: "math" },
  { tag: "Literature · p.112", text: "How does Shakespeare present ambition in Macbeth?", kind: "text" },
  { tag: "Numbers · p.9", text: "What is 25% of 80?", kind: "math" },
];

const TRANSCRIPT = [
  { t: "00:42", text: "Photosynthesis happens inside chloroplasts, where chlorophyll captures sunlight." },
  { t: "02:15", text: "The plant takes in carbon dioxide through stomata and water through roots." },
  { t: "04:30", text: "Glucose is stored as starch; oxygen is released back into the air." },
];

type Tab = "snip" | "paste" | "image" | "pdf" | "video";
const TABS: { id: Tab; label: string; icon: typeof Scissors; type: InputType }[] = [
  { id: "snip", label: "Snip Canvas", icon: Scissors, type: "snip" },
  { id: "paste", label: "Paste", icon: Type, type: "text" },
  { id: "image", label: "Image", icon: ImagePlus, type: "image" },
  { id: "pdf", label: "PDF", icon: FileText, type: "pdf" },
  { id: "video", label: "Video", icon: MonitorPlay, type: "video" },
];

function Bar({ q }: { q: Q }) {
  const pct = Math.min(100, (q.used / Math.max(1, q.total)) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="font-semibold text-[#35546f]">{q.label}</span><span className="font-bold text-[#0b1b2b]">{q.used} / {q.total}</span></div>
      <div className="mt-1 h-2 rounded-full bg-sky-100"><div className={`h-full rounded-full transition-all ${pct > 85 ? "bg-rose-400" : pct > 60 ? "bg-amber-400" : "bg-[#1463ff]"}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function StudioPage() {
  const [tab, setTab] = useState<Tab>("snip");
  const [text, setText] = useState("");
  const [snippedIdx, setSnippedIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("direct");
  const [lang, setLang] = useState("English");
  const [showSteps, setShowSteps] = useState(true);
  const [integrity, setIntegrity] = useState(false);
  const [hasImage, setHasImage] = useState(false); const [imgUrl, setImgUrl] = useState(""); const [fileName, setFileName] = useState("");
  const [pdfPages, setPdfPages] = useState(0);
  const [ytUrl, setYtUrl] = useState("https://www.youtube.com/watch?v=8IlzKri08kk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SolveResult | null>(null);
  const [usedMode, setUsedMode] = useState<Mode>("direct");
  const [hintLevel, setHintLevel] = useState(1);
  const [quotas, setQuotas] = useState<Quotas | null>(null);
  const [history, setHistory] = useState<Hist[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [histFilter, setHistFilter] = useState("all");
  const imgRef = useRef<HTMLInputElement>(null); const pdfRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const id = getDeviceId();
    const [c, h] = await Promise.all([fetch(`/api/credits?deviceId=${id}`).then((r) => r.json()).catch(() => null), fetch(`/api/history?deviceId=${id}`).then((r) => r.json()).catch(() => null)]);
    if (c?.quotas) setQuotas(c.quotas);
    if (h) { setHistory(h.history ?? []); setAnalytics(h); }
  }, []);
  useEffect(() => { refresh(); const saved = localStorage.getItem("sb_integrity"); if (saved === "1") { setIntegrity(true); setMode("hint"); } const l = localStorage.getItem("sb_lang"); if (l) setLang(l); }, [refresh]);

  const inputType: InputType = TABS.find((t) => t.id === tab)!.type;
  const ytId = ytUrl.match(/(?:v=|youtu\.be\/)([\w-]{6,})/)?.[1] ?? "";

  async function ask(nextHint?: number, forceMode?: Mode, overrideText?: string) {
    const m = forceMode ?? mode;
    if (integrity && m === "direct") { setError("Academic Integrity Mode is on — Direct answers are locked. Switch to Quiz or Hint."); return; }
    const payloadText = overrideText ?? (tab === "video" && !text ? `Summarise this video ${ytUrl} — what is photosynthesis?` : text);
    setLoading(true); setError(""); setUsedMode(m);
    try {
      const r = await fetch("/api/demo/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: payloadText, mode: m, language: lang, showSteps, hintLevel: nextHint ?? hintLevel, hasImage, inputType, fileName, deviceId: getDeviceId() }) });
      const j = await r.json();
      if (!r.ok) setError(j.error || "Something went wrong.");
      else { setResult(j.result); if (j.quotas) setQuotas(j.quotas); refresh(); }
    } catch { setError("Network hiccup — try again."); }
    setLoading(false);
  }

  function snip(i: number) { setSnippedIdx(i); setText(SNIPPETS[i].text); setHasImage(false); }
  function replay(h: Hist) { setText(h.inputText); setTab(h.inputType === "pdf" ? "pdf" : h.inputType === "video" ? "video" : h.inputType === "image" ? "image" : "paste"); setMode(h.mode as Mode); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function toggleFav(h: Hist) { await fetch("/api/history", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: h.id }) }); refresh(); }
  async function remove(h: Hist) { await fetch(`/api/history?id=${h.id}`, { method: "DELETE" }); refresh(); }

  const filtered = history.filter((h) => histFilter === "all" ? true : histFilter === "fav" ? h.favorite : h.mode === histFilter);
  const accuracy = analytics && analytics.totalAttempts ? Math.round((analytics.totalCorrect / analytics.totalAttempts) * 100) : 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
        <div className="fade-up flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#0b4ad1] ring-1 ring-sky-200"><BookOpen size={12} /> SNIP STUDIO</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold text-[#0b1b2b] sm:text-4xl">Your study cockpit.</h1>
            <p className="mt-1.5 text-[#5b7a99]">Snip the sample page, or bring your own anything.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-[#0b1b2b] ring-1 ring-sky-200 card-shadow"><Flame size={16} className="text-orange-500" /> {quotas?.streakDays ?? 1}-day streak</span>
            <span className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-[#0b1b2b] ring-1 ring-sky-200 card-shadow"><Sparkles size={16} className="text-[#1463ff]" /> {quotas?.planName ?? "Trial"} plan</span>
            <a href="/pricing" className="btn-primary focusable inline-flex min-h-[44px] items-center rounded-full px-5 text-sm font-bold">Upgrade</a>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="grid gap-5">
            {/* Input lab */}
            <section className="rounded-3xl bg-white p-5 card-shadow ring-1 ring-sky-100 sm:p-6" aria-label="Input">
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Input type">
                {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`focusable inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition ${tab === t.id ? "bg-[#1463ff] text-white shadow-md shadow-blue-500/25" : "bg-sky-50 text-[#35546f] hover:bg-sky-100"}`}><t.icon size={15} />{t.label}</button>)}
              </div>

              {tab === "snip" && (
                <div className="mt-4">
                  <p className="text-sm text-[#5b7a99]">This is a sample textbook page. <span className="font-semibold text-[#0b1b2b]">Click any block to snip it</span> — exactly like the extension overlay.</p>
                  <div className="mt-3 grid gap-2 rounded-2xl bg-gradient-to-b from-sky-50/80 to-white p-3.5 ring-1 ring-sky-100 sm:grid-cols-2">
                    {SNIPPETS.map((s, i) => (
                      <button key={i} onClick={() => snip(i)} className={`focusable group relative min-h-[64px] rounded-xl border-2 border-dashed p-3 text-left transition ${snippedIdx === i ? "border-[#1463ff] bg-sky-50 ring-2 ring-sky-200" : "border-sky-200 bg-white hover:border-[#1463ff]"}`} aria-label={`Snip: ${s.text}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#5b7a99]">{s.tag}</span>
                        <span className={`mt-0.5 block text-[13px] leading-snug text-[#0b1b2b] ${s.kind === "math" ? "font-mono font-semibold" : ""}`}>{s.text}</span>
                        <span className={`absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white transition ${snippedIdx === i ? "bg-[#1463ff]" : "bg-sky-300 group-hover:bg-[#1463ff]"}`}><Scissors size={12} /></span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === "paste" && <p className="mt-4 text-sm text-[#5b7a99]">DOM / pasted text is <span className="font-semibold text-emerald-600">free</span> — no OCR credit, ever.</p>}

              {tab === "image" && (
                <div className="mt-4">
                  <button onClick={() => imgRef.current?.click()} className="focusable flex min-h-[110px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/60 text-sm font-semibold text-[#35546f] hover:border-[#1463ff]">
                    {imgUrl ? <img src={imgUrl} alt="Your uploaded snip" className="max-h-40 rounded-xl object-contain" /> : <><ImagePlus size={26} className="text-[#1463ff]" /> Drop a screenshot of a problem<span className="text-xs font-medium text-[#5b7a99]">OCR reads it · 1 OCR credit</span></>}
                  </button>
                  <input ref={imgRef} type="file" accept="image/*" className="hidden" aria-label="Upload image" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setHasImage(true); setFileName(f.name); setImgUrl(URL.createObjectURL(f)); if (!text) setText("x² + 5x + 6 = 0"); } }} />
                  {hasImage && <p className="mt-2 text-xs text-[#5b7a99]">OCR preview text is in the box below — edit it if the scan misread anything.</p>}
                </div>
              )}

              {tab === "pdf" && (
                <div className="mt-4">
                  <button onClick={() => pdfRef.current?.click()} className="focusable flex min-h-[100px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/60 text-sm font-semibold text-[#35546f] hover:border-[#1463ff]">
                    <FileText size={26} className="text-[#1463ff]" />{fileName ? `${fileName} · ~${pdfPages} pages detected` : "Upload a PDF to chat + quiz over it"}<span className="text-xs font-medium text-[#5b7a99]">1 PDF credit per document · chatting after is free · page citations included</span>
                  </button>
                  <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" aria-label="Upload PDF" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); setPdfPages(Math.max(1, Math.round(f.size / 60000))); if (!text) setText("Photosynthesis is the process where plants use sunlight, water and carbon dioxide to make glucose and oxygen in chloroplasts."); } }} />
                </div>
              )}

              {tab === "video" && (
                <div className="mt-4 grid gap-3">
                  <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="Paste a YouTube URL…" aria-label="YouTube URL" className="min-h-[48px] rounded-xl border border-sky-200 px-4 text-sm" />
                  {ytId && <div className="overflow-hidden rounded-2xl ring-1 ring-sky-100"><iframe src={`https://www.youtube.com/embed/${ytId}`} title="Video preview" className="aspect-video w-full" allowFullScreen /></div>}
                  <div className="grid gap-1.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5b7a99]">Transcript · free pull, no minutes used — click a segment to ask about it</p>
                    {TRANSCRIPT.map((s) => <button key={s.t} onClick={() => setText(`At ${s.t} the video says: "${s.text}" Explain this.`)} className="focusable flex min-h-[44px] items-center gap-3 rounded-xl bg-sky-50 px-3.5 text-left text-sm text-[#35546f] hover:bg-sky-100"><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#0b4ad1] ring-1 ring-sky-200"><Clock3 size={11} />{s.t}</span>{s.text}</button>)}
                  </div>
                </div>
              )}

              <label className="mt-4 block">
                <span className="text-sm font-bold text-[#0b1b2b]">{tab === "snip" ? "Snipped content" : "Your content / question"}</span>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="…or type anything here" className="mt-1.5 w-full rounded-xl border border-sky-200 p-4 text-[15px] placeholder:text-[#8fb2d9]" />
              </label>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Answer modes">
                {MODES.map((m) => {
                  const locked = integrity && m.id === "direct";
                  return <button key={m.id} role="tab" aria-selected={mode === m.id} disabled={locked} onClick={() => { setMode(m.id); setHintLevel(1); }} className={`focusable min-h-[60px] rounded-xl border p-3 text-left transition ${mode === m.id ? "border-[#1463ff] bg-sky-50 ring-2 ring-sky-200" : "border-sky-100 hover:border-sky-300"} ${locked ? "cursor-not-allowed opacity-40" : ""}`}><m.icon size={16} className="text-[#1463ff]" /><span className="mt-1 block text-sm font-bold text-[#0b1b2b]">{m.label}{locked ? " 🔒" : ""}</span><span className="block text-[11px] text-[#5b7a99]">{m.desc}</span></button>;
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select value={lang} onChange={(e) => { setLang(e.target.value); localStorage.setItem("sb_lang", e.target.value); }} aria-label="Answer language" className="focusable min-h-[44px] rounded-full border border-sky-200 bg-white px-3.5 text-sm font-semibold">{LANGUAGES.map((l) => <option key={l.code} value={l.label}>{l.native}</option>)}</select>
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-sky-50 px-3.5 text-sm font-semibold"><input type="checkbox" checked={showSteps} onChange={(e) => setShowSteps(e.target.checked)} className="h-4 w-4 accent-[#1463ff]" /> Show steps</label>
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-emerald-50 px-3.5 text-sm font-semibold text-emerald-800"><ShieldCheck size={15} /><input type="checkbox" checked={integrity} onChange={(e) => { setIntegrity(e.target.checked); localStorage.setItem("sb_integrity", e.target.checked ? "1" : "0"); if (e.target.checked && mode === "direct") setMode("hint"); }} className="h-4 w-4 accent-emerald-600" /> Integrity mode</label>
                <button onClick={() => { setHintLevel(1); ask(1); }} disabled={loading} className="btn-primary focusable ml-auto inline-flex min-h-[50px] items-center gap-2 rounded-full px-7 font-bold">{loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={17} />} Ask SolverBuddy</button>
              </div>
              {error && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</p>}
            </section>

            {/* Result */}
            <section className="rounded-3xl bg-white p-5 card-shadow ring-1 ring-sky-100 sm:p-6" aria-label="Answer" aria-live="polite">
              <h2 className="font-display text-lg font-extrabold text-[#0b1b2b]">Answer</h2>
              {loading && <div className="mt-4 grid gap-2"><div className="h-4 w-2/3 animate-pulse rounded bg-sky-100" /><div className="h-4 w-1/2 animate-pulse rounded bg-sky-100" /><p className="text-sm text-[#5b7a99]">Routing: detecting type → picking the cheapest accurate engine…</p></div>}
              {!loading && !result && <p className="mt-3 text-sm text-[#5b7a99]">Nothing yet. Snip a block above, pick <span className="font-semibold text-[#0b1b2b]">Quiz Me</span>, and watch adaptive questions appear — answers feed your mastery analytics.</p>}
              {!loading && result && <div className="mt-3"><AnswerBody r={result} mode={usedMode} onMoreHint={() => { const n = hintLevel + 1; setHintLevel(n); ask(n, "hint"); }} onNeedHint={() => { setMode("hint"); setHintLevel(1); ask(1, "hint"); }} /></div>}
            </section>

            {/* History */}
            <section className="rounded-3xl bg-white p-5 card-shadow ring-1 ring-sky-100 sm:p-6" aria-label="Snip history">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-extrabold text-[#0b1b2b]">Snip history</h2>
                <div className="flex flex-wrap gap-1.5">
                  {[["all", "All"], ["fav", "★ Saved"], ["direct", "Direct"], ["eli5", "ELI5"], ["quiz", "Quiz"], ["hint", "Hint"]].map(([v, l]) => <button key={v} onClick={() => setHistFilter(v)} className={`focusable min-h-[38px] rounded-full px-3 text-xs font-bold ${histFilter === v ? "bg-[#1463ff] text-white" : "bg-sky-50 text-[#35546f] hover:bg-sky-100"}`}>{l}</button>)}
                </div>
              </div>
              {filtered.length === 0 && <p className="mt-3 text-sm text-[#5b7a99]">No snips here yet. Your asked questions will stack up here — star the keepers.</p>}
              <ul className="mt-3 grid gap-2">
                {filtered.map((h) => (
                  <li key={h.id} className="flex items-start gap-3 rounded-xl bg-sky-50/70 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0b1b2b]">{h.inputText}</p>
                      <p className="mt-0.5 truncate text-xs text-[#5b7a99]">{h.topic} · {h.mode} · {h.route}</p>
                      {h.answer && <p className="mt-1 line-clamp-2 text-xs text-[#35546f]">{h.answer}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => replay(h)} aria-label="Ask again" className="focusable flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1463ff] ring-1 ring-sky-200 hover:bg-sky-100"><RotateCcw size={15} /></button>
                      <button onClick={() => toggleFav(h)} aria-label="Save snip" className={`focusable flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-sky-200 ${h.favorite ? "bg-amber-100 text-amber-600" : "bg-white text-[#5b7a99] hover:bg-sky-100"}`}><Star size={15} fill={h.favorite ? "currentColor" : "none"} /></button>
                      <button onClick={() => remove(h)} aria-label="Delete snip" className="focusable flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-500 ring-1 ring-sky-200 hover:bg-rose-50"><Trash2 size={15} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right rail */}
          <div className="grid content-start gap-5">
            <section className="rounded-3xl bg-white p-5 card-shadow ring-1 ring-sky-100 sm:p-6" aria-label="Credits">
              <h2 className="font-display flex items-center gap-2 text-lg font-extrabold text-[#0b1b2b]"><Coins size={19} className="text-[#1463ff]" /> Credits · {quotas?.planName ?? "…"}</h2>
              <div className="mt-4 grid gap-3.5">{quotas && ([quotas.big, quotas.math, quotas.ocr, quotas.video, quotas.pdf] as Q[]).map((q) => <Bar key={q.label} q={q} />)}</div>
              <p className="mt-4 text-xs leading-relaxed text-[#5b7a99]">Small-model + DOM text + YouTube transcripts are free. Credits only move on big-model, math, OCR, video ASR and PDF ingestion.</p>
              <div className="mt-4 grid gap-2">
                {ADDONS.map((a) => <button key={a.id} onClick={() => startCheckout(a.id)} className="focusable flex min-h-[46px] items-center justify-between rounded-xl border border-sky-200 px-4 text-sm font-semibold text-[#0b1b2b] hover:border-[#1463ff] hover:bg-sky-50"><span>{a.label}</span><span className="rounded-full bg-sky-100 px-2.5 py-1 font-bold text-[#0b4ad1]">{a.price}</span></button>)}
              </div>
            </section>

            <section id="analytics" className="scroll-mt-24 rounded-3xl bg-white p-5 card-shadow ring-1 ring-sky-100 sm:p-6" aria-label="Analytics">
              <h2 className="font-display flex items-center gap-2 text-lg font-extrabold text-[#0b1b2b]"><BarChart3 size={19} className="text-[#1463ff]" /> Mastery analytics</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-sky-50 p-3"><p className="font-display text-2xl font-extrabold text-[#0b1b2b]">{analytics?.totalAttempts ?? 0}</p><p className="text-[11px] font-semibold text-[#5b7a99]">Quiz answers</p></div>
                <div className="rounded-xl bg-sky-50 p-3"><p className="font-display text-2xl font-extrabold text-[#0b1b2b]">{accuracy}%</p><p className="text-[11px] font-semibold text-[#5b7a99]">Accuracy</p></div>
                <div className="rounded-xl bg-sky-50 p-3"><p className="font-display text-2xl font-extrabold text-[#0b1b2b]">{history.length}</p><p className="text-[11px] font-semibold text-[#5b7a99]">Snips asked</p></div>
              </div>
              {analytics?.modeCounts && Object.keys(analytics.modeCounts).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5b7a99]">Mode mix</p>
                  <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-sky-100">
                    {Object.entries(analytics.modeCounts).map(([m, n], i) => <span key={m} title={`${m}: ${n}`} className={["bg-[#1463ff]", "bg-sky-400", "bg-emerald-400", "bg-amber-400"][i % 4]} style={{ width: `${(n / Math.max(1, history.length)) * 100}%` }} />)}
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#5b7a99]">{Object.entries(analytics.modeCounts).map(([m, n]) => `${m} ${n}`).join(" · ")}</p>
                </div>
              )}
              <div className="mt-4 grid gap-3">
                {analytics?.mastery.length ? analytics.mastery.map((m) => (
                  <div key={m.topic}><div className="flex justify-between text-xs"><span className="font-semibold text-[#35546f]">{m.topic}</span><span className="font-bold">{m.correct}/{m.total} · {m.pct}%</span></div>
                    <div className="mt-1 h-2 rounded-full bg-sky-100"><div className={`h-full rounded-full ${m.pct >= 70 ? "bg-emerald-500" : m.pct >= 40 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${m.pct}%` }} /></div></div>
                )) : <p className="text-sm text-[#5b7a99]">Take a quiz and mastery bars appear per topic.</p>}
              </div>
              {analytics?.weakAreas && analytics.weakAreas.length > 0 && <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800">Confusion pattern: {analytics.weakAreas.join(", ")} — try Hint mode there, then re-quiz.</p>}
              <p className="mt-3 text-[11px] text-[#5b7a99]">Opt-in, on-device identity, no PII stored. Delete history anytime.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
