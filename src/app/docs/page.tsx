"use client";
import { Navbar, Footer } from "@/components/Chrome";
import { useReveal } from "@/lib/client";

const SECTIONS = [
  { id: "snip", title: "Snipping 101", body: [
    "In the Studio, open the Snip Canvas and click any textbook block to snip it. In the extension, drag a rectangle over any text, equation or image on any site.",
    "Clean DOM text is extracted free. Images and screenshots run OCR (Tesseract, or Gemini Vision for hard math) at 1 OCR credit per snip. Math is parsed into an equation and sent to the solver before any LLM touches it.",
  ]},
  { id: "modes", title: "The 4 answer modes", body: [
    "DIRECT — final answer only. Toggle “Show steps” if you want working. Strict means strict: no extra explanation.",
    "ELI5 — 2–5 short bullets in simple words, analogy-first, zero jargon.",
    "QUIZ ME — 3–5 adaptive questions shown one at a time with instant feedback. Difficulty escalates; asking for help switches you into Hint mode.",
    "HINT ONLY — progressive nudges (levels 1–2). The full solution is never revealed in the first response.",
  ]},
  { id: "credits", title: "Credits & routing", body: [
    "Short/simple text (<300 chars, no math) routes to a small model and costs no big-model credit. Math routes to the symbolic solver first (1 math credit). Images route to vision (1 OCR credit). Long PDFs and transcripts chunk into a big LLM (1 big-model credit). Repeats hit cache for free.",
    "YouTube transcript pulls are free. Uploaded video uses ASR and consumes video minutes. A PDF costs 1 credit once; chatting over it afterwards is free.",
  ]},
  { id: "pdf-video", title: "PDF & video", body: [
    "PDFs preserve headings and pages; answers cite page numbers and you can generate a quiz per section. Videos cite timestamps and can be quizzed by time range.",
  ]},
  { id: "languages", title: "Languages", body: [
    "English first; 11-language roadmap: English, Spanish, French, Portuguese, Russian, Arabic, Hindi, Chinese Simplified, German, Japanese, Indonesian. Input language is auto-detected, output language can be locked separately, and math notation is never translated.",
  ]},
  { id: "integrity", title: "Academic Integrity Mode", body: [
    "Teachers and honest learners can lock Direct mode from any answer panel, leaving ELI5, Quiz and Hint available. The lock persists on the device — great for shared classroom machines.",
  ]},
  { id: "api", title: "Keys & configuration", body: [
    "Set GEMINI_API_KEY (AI Studio) or GROQ_API_KEY to switch answers from the built-in smart engine to live models. Set STRIPE_SECRET_KEY (+ optional STRIPE_PRICE_TRIAL / MONTHLY / SEMESTER) for live checkout — without it, checkout runs in mock mode and still applies quotas. Set NEXT_PUBLIC_EXTENSION_URL to swap the waitlist buttons for a live “Add to Chrome”.",
  ]},
];

export default function DocsPage() {
  useReveal();
  return (
    <>
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="font-display text-2xl font-extrabold text-[#0b1b2b]">Docs</h1>
          <nav className="mt-4 flex flex-wrap gap-1.5 lg:grid" aria-label="Docs sections">
            {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="focusable flex min-h-[40px] items-center rounded-full bg-white px-3.5 text-sm font-semibold text-[#35546f] ring-1 ring-sky-100 hover:bg-sky-50 lg:rounded-xl">{s.title}</a>)}
          </nav>
        </aside>
        <div className="grid gap-5">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="reveal scroll-mt-28 rounded-3xl bg-white p-7 card-shadow ring-1 ring-sky-100">
              <h2 className="font-display text-xl font-extrabold text-[#0b1b2b]">{s.title}</h2>
              {s.body.map((p, i) => <p key={i} className="mt-2.5 leading-relaxed text-[#5b7a99]">{p}</p>)}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
