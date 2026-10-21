"use client";
import { useEffect, useRef, useState } from "react";
import { X, Zap, Baby, HelpCircle, Lightbulb, ImagePlus, Loader2, ShieldCheck, Sparkles, Lock, Check, ArrowRight } from "lucide-react";
import type { SolveResult, Mode } from "@/lib/solver";
import { LANGUAGES, PLANS } from "@/lib/plans";
import { getDeviceId, startCheckout } from "@/lib/client";
import { AnswerBody } from "./AnswerKit";

export const MODES: { id: Mode; label: string; desc: string; icon: typeof Zap }[] = [
  { id: "direct", label: "Direct", desc: "Answer only", icon: Zap },
  { id: "eli5", label: "ELI5", desc: "Explain like I'm 5", icon: Baby },
  { id: "quiz", label: "Quiz Me", desc: "3–5 adaptive questions", icon: HelpCircle },
  { id: "hint", label: "Hint Only", desc: "A nudge, no spoilers", icon: Lightbulb },
];

const EXAMPLES = ["x² + 5x + 6 = 0", "What is photosynthesis?", "Derivative of 3x^2 + 2x + 5", "Explain the water cycle"];

export default function DemoModal({ open, onClose, initialText = "", initialMode = "direct" as Mode }: { open: boolean; onClose: () => void; initialText?: string; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [text, setText] = useState(initialText);
  const [lang, setLang] = useState("English");
  const [showSteps, setShowSteps] = useState(true);
  const [integrity, setIntegrity] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [imgName, setImgName] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SolveResult | null>(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [usedMode, setUsedMode] = useState<Mode>("direct");
  const [busyPlan, setBusyPlan] = useState("");
  
  // 4-question demo lock system
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalAsked, setTotalAsked] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Check demo question usage on mount / open
  useEffect(() => {
    if (!open) return;
    const deviceId = getDeviceId();
    fetch(`/api/demo/ask?deviceId=${deviceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.remaining === "number") {
          setRemaining(data.remaining);
          setTotalAsked(data.totalAsked || 0);
          if (data.isLocked || data.remaining <= 0) {
            setIsLocked(true);
            setShowSubscription(true);
          }
        }
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  async function handleBuy(planId: string) {
    setBusyPlan(planId);
    await startCheckout(planId);
    setBusyPlan("");
  }

  async function ask(nextHintLevel?: number, forceMode?: Mode) {
    if (isLocked) {
      setShowSubscription(true);
      return;
    }

    const m = forceMode ?? mode;
    if (integrity && m === "direct") {
      setError("Academic Integrity Mode is on — Direct answers are locked. Use Quiz or Hint.");
      return;
    }
    const hl = nextHintLevel ?? hintLevel;
    setLoading(true);
    setError("");
    setUsedMode(m);

    try {
      const r = await fetch("/api/demo/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mode: m,
          language: lang,
          showSteps,
          hintLevel: hl,
          hasImage,
          inputType: hasImage ? "image" : "text",
          fileName: imgName,
          deviceId: getDeviceId(),
        }),
      });
      const j = await r.json();

      if (!r.ok) {
        if (j.isLocked || j.rateLimited) {
          setIsLocked(true);
          setShowSubscription(true);
          setRemaining(0);
          setError(j.error || "Free demo limit of 4 questions reached. Subscribe to continue.");
        } else {
          setError(j.error || "Something went wrong.");
        }
      } else {
        setResult(j.result);
        if (typeof j.demoRemaining === "number") {
          setRemaining(j.demoRemaining);
          setTotalAsked(j.totalAsked || 4 - j.demoRemaining);
          if (j.isLocked || j.demoRemaining <= 0) {
            setIsLocked(true);
          }
        }
      }
    } catch {
      setError("Network hiccup — try again.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="SolverBuddy live demo">
      <div className="absolute inset-0 bg-[#0b1b2b]/45 backdrop-blur-sm" onClick={onClose} />
      <div className="fade-up relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7 thin-scroll">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-[#0b4ad1]">
                <Sparkles size={12} /> LIVE DEMO
              </p>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                  <Lock size={11} /> 4/4 QUESTIONS USED — DEMO LOCKED
                </span>
              ) : remaining !== null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                  {remaining} of 4 free questions remaining
                </span>
              ) : null}
            </div>
            <h2 className="font-display mt-2 text-2xl font-extrabold text-[#0b1b2b]">
              {showSubscription ? "Choose a plan to continue" : "Ask your way."}
            </h2>
            <p className="text-sm text-[#5b7a99]">
              {showSubscription
                ? "You've used your 4 free questions. Start your 7-day trial for $0.99 to unlock unlimited AI solving."
                : "Paste anything. Pick a mode. Watch the routing."}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close demo" className="focusable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[#0b1b2b] hover:bg-sky-100">
            <X size={19} />
          </button>
        </div>

        {/* SUBSCRIPTION BUY VIEW (WHEN LOCKED OR TOGGLED) */}
        {showSubscription ? (
          <div className="mt-5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Lock size={20} />
              </div>
              <p className="mt-2 font-display text-base font-bold text-[#0b1b2b]">
                Free Demo Limit Reached (4 / 4 Questions Used)
              </p>
              <p className="mt-1 text-xs text-[#5b7a99]">
                Upgrade to continue solving with Google Gemini Flash AI, SymPy math engine, and Desmos graphs.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PLANS.map((p) => {
                const isPopular = p.popular;
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                      isPopular
                        ? "border-[#1463ff] bg-white ring-2 ring-[#1463ff]/20 shadow-md"
                        : "border-sky-100 bg-white hover:border-sky-300"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-[#10b981] px-2 py-0.5 text-[10px] font-bold text-white">
                        POPULAR
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-bold text-[#0b1b2b]">{p.name}</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#0b1b2b]">{p.price}</p>
                      <p className="text-[11px] text-[#5b7a99]">{p.period}</p>
                      <ul className="mt-3 space-y-1 text-xs text-[#35546f]">
                        <li className="flex items-center gap-1.5">
                          <Check size={12} className="text-[#1463ff] shrink-0" />
                          <span>{p.quotas.big} big-model answers</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check size={12} className="text-[#1463ff] shrink-0" />
                          <span>{p.quotas.math} math solver calls</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check size={12} className="text-[#1463ff] shrink-0" />
                          <span>All 4 modes included</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleBuy(p.id)}
                      disabled={busyPlan === p.id}
                      className={`focusable mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full text-xs font-bold transition ${
                        isPopular
                          ? "bg-[#10b981] text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                          : "btn-primary"
                      }`}
                    >
                      {busyPlan === p.id ? <Loader2 size={14} className="animate-spin" /> : null}
                      {p.cta}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-center text-[11px] text-[#5b7a99]">
              Card required for trial. Auto-converts to $11.99/mo unless cancelled within 7 days.
            </p>

            <div className="mt-4 flex justify-center">
              <a
                href="/pricing"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1463ff] hover:underline"
              >
                View full quota comparison &amp; Power Packs <ArrowRight size={12} />
              </a>
            </div>
          </div>
        ) : (
          /* STANDARD DEMO VIEW (BEFORE LOCK) */
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Answer modes">
              {MODES.map((m) => {
                const locked = integrity && m.id === "direct";
                return (
                  <button
                    key={m.id}
                    role="tab"
                    aria-selected={mode === m.id}
                    disabled={locked}
                    onClick={() => {
                      setMode(m.id);
                      setHintLevel(1);
                    }}
                    className={`focusable min-h-[64px] rounded-xl border p-3 text-left transition ${
                      mode === m.id
                        ? "border-[#1463ff] bg-sky-50 ring-2 ring-sky-200"
                        : "border-sky-100 bg-white hover:border-sky-300"
                    } ${locked ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <m.icon size={17} className="text-[#1463ff]" />
                    <span className="mt-1 block text-sm font-bold text-[#0b1b2b]">
                      {m.label}
                      {locked ? " 🔒" : ""}
                    </span>
                    <span className="block text-[11px] text-[#5b7a99]">{m.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  onClick={() => setText(e)}
                  className="focusable min-h-[36px] rounded-full bg-sky-50 px-3 text-xs font-semibold text-[#0b4ad1] hover:bg-sky-100"
                >
                  {e}
                </button>
              ))}
            </div>

            <label className="sr-only" htmlFor="demo-text">
              Your question or snipped content
            </label>
            <textarea
              id="demo-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Type or paste anything — an equation, a paragraph, a question…"
              className="mt-3 w-full rounded-xl border border-sky-200 bg-white p-4 text-[15px] text-[#0b1b2b] placeholder:text-[#8fb2d9]"
            />

            {imgUrl && (
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-sky-50 p-2.5">
                <img src={imgUrl} alt="Uploaded snip preview" className="h-12 w-16 rounded-lg object-cover" />
                <p className="text-xs text-[#5b7a99]">
                  <span className="font-semibold text-[#0b1b2b]">{imgName}</span> — will use 1 OCR credit.
                </p>
                <button
                  onClick={() => {
                    setHasImage(false);
                    setImgUrl("");
                    setImgName("");
                  }}
                  className="ml-auto text-xs font-bold text-rose-600"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="focusable inline-flex min-h-[44px] items-center gap-2 rounded-full border border-sky-200 bg-white px-4 text-sm font-semibold text-[#0b1b2b] hover:bg-sky-50"
              >
                <ImagePlus size={16} className="text-[#1463ff]" /> Image snip
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Upload image snip"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setHasImage(true);
                    setImgName(f.name);
                    setImgUrl(URL.createObjectURL(f));
                    if (!text) setText("x² + 5x + 6 = 0");
                  }
                }}
              />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Answer language"
                className="focusable min-h-[44px] rounded-full border border-sky-200 bg-white px-3.5 text-sm font-semibold text-[#0b1b2b]"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.label}>
                    {l.native}
                  </option>
                ))}
              </select>
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-sky-50 px-3.5 text-sm font-semibold text-[#0b1b2b]">
                <input
                  type="checkbox"
                  checked={showSteps}
                  onChange={(e) => setShowSteps(e.target.checked)}
                  className="h-4 w-4 accent-[#1463ff]"
                />
                Show steps
              </label>
              <label
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-emerald-50 px-3.5 text-sm font-semibold text-emerald-800"
                title="Academic Integrity Mode locks Direct answers"
              >
                <ShieldCheck size={15} />
                <input
                  type="checkbox"
                  checked={integrity}
                  onChange={(e) => {
                    setIntegrity(e.target.checked);
                    if (e.target.checked && mode === "direct") setMode("hint");
                  }}
                  className="h-4 w-4 accent-emerald-600"
                />
                Integrity mode
              </label>
            </div>

            <button
              onClick={() => {
                setHintLevel(1);
                ask(1);
              }}
              disabled={loading}
              className="btn-primary focusable mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full text-base font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={19} /> Routing to the right brain…
                </>
              ) : (
                <>Ask SolverBuddy {remaining !== null && `(${remaining} left)`}</>
              )}
            </button>
            <p className="mt-2 text-center text-[11px] text-emerald-700 font-medium">
              ✨ Powered by Live Google Gemini Flash + SymPy Math Engine
            </p>

            {error && (
              <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
                {error}
              </p>
            )}

            {result && !error && (
              <div className="mt-4 rounded-2xl border border-sky-100 bg-white p-4 sm:p-5">
                <AnswerBody
                  r={result}
                  mode={usedMode}
                  onMoreHint={() => {
                    const n = hintLevel + 1;
                    setHintLevel(n);
                    ask(n, "hint");
                  }}
                  onNeedHint={() => {
                    setMode("hint");
                    setHintLevel(1);
                    ask(1, "hint");
                  }}
                />
                {lang !== "English" && (
                  <p className="mt-2 text-xs text-[#5b7a99]">
                    Answer language locked to {lang} — math notation stays untranslated.
                  </p>
                )}

                {/* If this answer hit the 4-question limit, show a polite unlock banner */}
                {isLocked && (
                  <div className="fade-up mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-amber-900">
                      🔒 You completed your 4 free questions! Subscribe to unlock unlimited questions.
                    </p>
                    <button
                      onClick={() => setShowSubscription(true)}
                      className="btn-primary focusable inline-flex min-h-[38px] items-center gap-1 rounded-full px-4 text-xs font-bold"
                    >
                      View Plans &amp; Start Trial <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
