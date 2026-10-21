"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Lightbulb, AlertTriangle, Route, Coins, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import type { SolveResult, QuizQuestion, GraphSpec } from "@/lib/solver";
import { getDeviceId, useTypewriter } from "@/lib/client";

export function GraphPlot({ g, height = 200 }: { g: GraphSpec; height?: number }) {
  const { path, zeroY, zeroX } = useMemo(() => {
    const W = 320, H = height, xMin = -8, xMax = 8, yMin = -10, yMax = 10;
    const px = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const py = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;
    let d = "";
    for (let i = 0; i <= 80; i++) {
      const x = xMin + (i / 80) * (xMax - xMin);
      const y = g.kind === "quadratic" ? g.a * x * x + g.b * x + g.c : g.b * x + g.c;
      const cy = Math.max(yMin - 2, Math.min(yMax + 2, y));
      d += `${i === 0 ? "M" : "L"}${px(x).toFixed(1)},${py(cy).toFixed(1)} `;
    }
    return { path: d, zeroY: py(0), zeroX: px(0) };
  }, [g, height]);
  const W = 320;
  const px = (x: number) => ((x + 8) / 16) * W;
  return (
    <figure className="mt-3 rounded-xl border border-sky-100 bg-gradient-to-b from-white to-sky-50 p-3">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={`Graph of ${g.label}`}>
        {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={(i * W) / 8} y1="0" x2={(i * W) / 8} y2={height} stroke="#e3f0fd" strokeWidth="1" />)}
        {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1="0" y1={(i * height) / 6} x2={W} y2={(i * height) / 6} stroke="#e3f0fd" strokeWidth="1" />)}
        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#b8d8fb" strokeWidth="1.5" />
        <line x1={zeroX} y1="0" x2={zeroX} y2={height} stroke="#b8d8fb" strokeWidth="1.5" />
        <path d={path} fill="none" stroke="#1463ff" strokeWidth="2.5" strokeLinecap="round" />
        {g.roots?.map((r, i) => r >= -8 && r <= 8 ? <g key={i}><circle cx={px(r)} cy={zeroY} r="4.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" /><text x={px(r)} y={zeroY - 9} textAnchor="middle" fontSize="10" fill="#0b1b2b" fontWeight="600">{Math.round(r * 100) / 100}</text></g> : null)}
      </svg>
      <figcaption className="mt-1 flex items-center justify-between text-xs text-[#5b7a99]">
        <span className="font-mono">{g.label}</span>
        <a href="https://www.desmos.com/calculator" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1463ff] hover:underline">Open in Desmos <ExternalLink size={11} /></a>
      </figcaption>
    </figure>
  );
}

export function QuizPlayer({ quiz, topic, onNeedHint }: { quiz: QuizQuestion[]; topic: string; onNeedHint?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = idx >= quiz.length;
  const q = quiz[idx];

  async function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === q.answerIndex;
    if (correct) setScore((s) => s + 1);
    fetch("/api/quiz/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: getDeviceId(), topic, question: q.q, correct, difficulty: q.difficulty }) }).catch(() => {});
  }
  function restart() { setIdx(0); setPicked(null); setScore(0); }

  if (done) return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
      <Trophy className="mx-auto text-emerald-500" size={28} />
      <p className="font-display mt-2 text-lg font-bold text-[#0b1b2b]">{score} / {quiz.length} correct</p>
      <p className="text-sm text-[#5b7a99]">{score === quiz.length ? "Flawless. This topic is yours." : score >= quiz.length / 2 ? "Strong. One more pass locks it in." : "Good data — now switch to Hint or ELI5 on the shaky parts."}</p>
      <button onClick={restart} className="btn-primary focusable mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-semibold"><RotateCcw size={15} /> Retake quiz</button>
    </div>
  );

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs font-semibold text-[#5b7a99]">
        <span>Question {idx + 1} of {quiz.length}</span><span>Difficulty {"●".repeat(q.difficulty)}{"○".repeat(Math.max(0, 3 - q.difficulty))}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-sky-100"><div className="h-full rounded-full bg-[#1463ff] transition-all" style={{ width: `${((idx + (picked !== null ? 1 : 0)) / quiz.length) * 100}%` }} /></div>
      <p className="mt-3 font-semibold text-[#0b1b2b]">{q.q}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((opt, i) => {
          const isRight = picked !== null && i === q.answerIndex;
          const isWrong = picked === i && i !== q.answerIndex;
          return (
            <button key={i} onClick={() => pick(i)} className={`focusable flex min-h-[44px] items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition ${isRight ? "border-emerald-400 bg-emerald-50 text-emerald-900" : isWrong ? "border-rose-300 bg-rose-50 text-rose-900" : "border-sky-200 bg-white hover:border-[#1463ff] hover:bg-sky-50"}`}>
              <span>{opt}</span>{isRight && <CheckCircle2 size={17} className="shrink-0 text-emerald-500" />}{isWrong && <XCircle size={17} className="shrink-0 text-rose-500" />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="fade-up mt-3 rounded-xl bg-sky-50 p-3 text-sm text-[#0b1b2b]">
          <span className="font-semibold">{picked === q.answerIndex ? "Correct. " : "Not quite. "}</span>{q.explanation}
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button onClick={() => { setIdx(idx + 1); setPicked(null); }} className="btn-primary focusable inline-flex min-h-[40px] items-center gap-1 rounded-full px-4 text-sm font-semibold">{idx + 1 >= quiz.length ? "See result" : "Next question"} <ChevronRight size={15} /></button>
            {picked !== q.answerIndex && onNeedHint && <button onClick={onNeedHint} className="focusable inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-800"><Lightbulb size={15} /> I need a hint instead</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export function RouteBar({ r }: { r: SolveResult }) {
  const spent = Object.entries(r.credits).filter(([, v]) => v > 0);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 font-semibold text-[#0b4ad1]" title={r.routeDetail}><Route size={12} /> {r.route}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold text-[#5b7a99] ring-1 ring-sky-100">{r.topic}</span>
      {r.confidence === "low" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800"><AlertTriangle size={12} /> Low confidence — ask to clarify?</span>}
      {spent.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold text-[#5b7a99] ring-1 ring-sky-100"><Coins size={12} /> {spent.map(([k, v]) => `${v} ${k}`).join(" · ")} credit</span>}
      {spent.length === 0 && <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">Free — small model / DOM text</span>}
      {r.mock ? (
        <span className="rounded-full bg-white px-2.5 py-1 font-medium text-[#5b7a99] ring-1 ring-sky-100">Smart local engine</span>
      ) : (
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">✨ Live Gemini Flash AI</span>
      )}
    </div>
  );
}

export function AnswerBody({ r, mode, onMoreHint, onNeedHint }: { r: SolveResult; mode: string; onMoreHint?: () => void; onNeedHint?: () => void }) {
  const typed = useTypewriter(mode === "hint" ? r.hint || "" : r.answer || "");
  if (mode === "quiz" && r.quiz) return <><p className="text-sm text-[#5b7a99]">{r.answer}</p><QuizPlayer quiz={r.quiz} topic={r.topic} onNeedHint={onNeedHint} /><RouteBar r={r} /></>;
  if (mode === "hint") return (
    <>
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Lightbulb className="mt-0.5 shrink-0 text-amber-500" size={20} />
        <div><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Hint {r.hintLevel} of 2 — no spoilers</p><p className="caret mt-1 font-medium text-[#0b1b2b]">{typed}</p></div>
      </div>
      {r.hasMoreHints && onMoreHint && <button onClick={onMoreHint} className="focusable mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-amber-300 bg-white px-5 text-sm font-semibold text-amber-800 hover:bg-amber-50"><Lightbulb size={15} /> Still stuck — stronger hint</button>}
      <RouteBar r={r} />
    </>
  );
  if (mode === "eli5" && r.bullets) return (
    <>
      <ul className="grid gap-2">{r.bullets.map((b, i) => <li key={i} className="fade-up flex gap-2.5 rounded-xl bg-sky-50 px-4 py-3 text-[15px] text-[#0b1b2b]" style={{ animationDelay: `${i * 120}ms` }}><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1463ff] text-[11px] font-bold text-white">{i + 1}</span>{b}</li>)}</ul>
      {r.graph && <GraphPlot g={r.graph} />}<RouteBar r={r} />
    </>
  );
  return (
    <>
      <p className="caret whitespace-pre-wrap text-[17px] font-semibold leading-relaxed text-[#0b1b2b]">{typed}</p>
      {r.steps.length > 0 && <ol className="mt-3 grid gap-1.5">{r.steps.map((s, i) => <li key={i} className="rounded-lg bg-sky-50 px-3.5 py-2 font-mono text-[13px] text-[#0b1b2b]"><span className="mr-2 font-sans text-[11px] font-bold text-[#1463ff]">STEP {i + 1}</span>{s}</li>)}</ol>}
      {r.graph && <GraphPlot g={r.graph} />}
      {r.citations.length > 0 && <p className="mt-3 text-xs text-[#5b7a99]">Citations: {r.citations.join(" · ")}</p>}
      <RouteBar r={r} />
    </>
  );
}
