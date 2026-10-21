"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GraduationCap, Menu, X, Globe, Loader2, CheckCircle2, Puzzle } from "lucide-react";
import { LANGUAGES } from "@/lib/plans";
import { startCheckout } from "@/lib/client";
import { WaitlistModal, ContactModal, SignInModal } from "./Modals";

const DemoModal = dynamic(() => import("./DemoModal"), { ssr: false });

export const EXTENSION_URL = ""; // set via NEXT_PUBLIC_EXTENSION_URL below
export function extensionUrl() { return process.env.NEXT_PUBLIC_EXTENSION_URL || ""; }

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="focusable flex items-center gap-2.5" aria-label="SolverBuddy home">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1463ff] text-white shadow-lg shadow-blue-500/30"><GraduationCap size={20} /></span>
      <span className="font-display text-[19px] font-extrabold tracking-tight text-[#0b1b2b]">Solver<span className="text-[#1463ff]">Buddy</span></span>
    </a>
  );
}

export function Navbar({ onDemo }: { onDemo?: () => void }) {
  const [menu, setMenu] = useState(false);
  const [waitlist, setWaitlist] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const [demo, setDemo] = useState(false);
  const [lang, setLang] = useState("English");
  const [langNote, setLangNote] = useState("");
  const [user, setUser] = useState<{ id?: number; name: string; email: string; avatarUrl?: string } | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const ext = extensionUrl();

  // Load user session on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  async function handleSignOut() {
    setUserMenu(false);
    setUser(null);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {}
  }

  function openDemo() { if (onDemo) onDemo(); else setDemo(true); }
  function extClick() { if (ext) window.open(ext, "_blank"); else setWaitlist(true); }
  function pickLang(v: string) { setLang(v); localStorage.setItem("sb_lang", v); setLangNote(v === "English" ? "" : `UI language set to ${v}. Full native UI rolls out with the 11-language launch — answers already mirror ${v} in the demo.`); setTimeout(() => setLangNote(""), 5000); }

  const links = [["Features", "/#features"], ["How It Works", "/#how"], ["Pricing", "/pricing"], ["Studio", "/studio"], ["Docs", "/docs"]] as const;

  return (
    <>
      <header className="glass sticky top-0 z-[60] border-b border-white/60 shadow-[0_8px_30px_-18px_rgba(20,99,255,.35)]">
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6" aria-label="Main">
          <Logo />
          <div className="ml-6 hidden items-center gap-1 lg:flex">
            {links.map(([l, h]) => <a key={l} href={h} className="focusable flex min-h-[44px] items-center rounded-full px-3.5 text-sm font-semibold text-[#35546f] hover:bg-sky-100/70 hover:text-[#0b1b2b]">{l}</a>)}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="relative hidden md:block">
              <Globe size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5b7a99]" />
              <select value={lang} onChange={(e) => pickLang(e.target.value)} aria-label="Language" className="focusable min-h-[44px] appearance-none rounded-full border border-sky-200 bg-white/80 pl-9 pr-4 text-sm font-semibold text-[#0b1b2b]">
                {LANGUAGES.map((l) => <option key={l.code} value={l.label}>{l.native}</option>)}
              </select>
            </label>

            {/* Google User Profile or Sign In Button */}
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="focusable flex min-h-[44px] items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-bold text-[#0b1b2b] hover:bg-sky-50 shadow-sm"
                  aria-label="User account menu"
                  aria-expanded={userMenu}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1463ff] text-white font-bold text-xs uppercase overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      user.name ? user.name[0] : "G"
                    )}
                  </span>
                  <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                </button>

                {userMenu && (
                  <div className="fade-up absolute right-0 top-12 z-50 w-52 rounded-2xl border border-sky-100 bg-white p-2 shadow-xl ring-1 ring-sky-100">
                    <div className="px-3 py-2 border-b border-sky-100">
                      <p className="text-xs font-bold text-[#0b1b2b] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#5b7a99] truncate">{user.email}</p>
                    </div>
                    <a
                      href="/studio"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#0b1b2b] hover:bg-sky-50"
                    >
                      Snip Studio
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setSignIn(true)}
                className="focusable hidden min-h-[44px] items-center rounded-full px-4 text-sm font-bold text-[#0b1b2b] hover:bg-sky-100/70 sm:flex"
              >
                Sign In
              </button>
            )}

            <button onClick={extClick} className="focusable hidden min-h-[44px] items-center gap-1.5 rounded-full border border-sky-200 bg-white px-4 text-sm font-bold text-[#0b1b2b] hover:bg-sky-50 md:inline-flex"><Puzzle size={15} className="text-[#1463ff]" /> {ext ? "Add to Chrome" : "Join Waitlist"}</button>
            <button onClick={openDemo} className="focusable hidden min-h-[44px] items-center rounded-full bg-sky-100 px-4 text-sm font-bold text-[#0b4ad1] hover:bg-sky-200 sm:inline-flex">Try Live Demo</button>
            <button onClick={() => startCheckout("trial")} className="btn-primary focusable inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-bold sm:px-5">Start $0.99 Trial</button>
            <button onClick={() => setMenu(!menu)} aria-label="Toggle menu" aria-expanded={menu} className="focusable flex h-11 w-11 items-center justify-center rounded-full hover:bg-sky-100 lg:hidden">{menu ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </nav>
        {langNote && <p className="bg-sky-100 px-4 py-2 text-center text-xs font-medium text-[#0b4ad1]" role="status">{langNote}</p>}
        {menu && (
          <div className="border-t border-sky-100 px-4 py-3 lg:hidden">
            <div className="grid gap-1">
              {links.map(([l, h]) => <a key={l} href={h} onClick={() => setMenu(false)} className="flex min-h-[44px] items-center rounded-xl px-3 font-semibold text-[#0b1b2b] hover:bg-sky-50">{l}</a>)}
              <button onClick={() => { setMenu(false); openDemo(); }} className="flex min-h-[44px] items-center rounded-xl px-3 text-left font-semibold text-[#0b4ad1] hover:bg-sky-50">Try Live Demo</button>
              <button onClick={() => { setMenu(false); extClick(); }} className="flex min-h-[44px] items-center rounded-xl px-3 text-left font-semibold text-[#0b1b2b] hover:bg-sky-50">{ext ? "Add to Chrome" : "Join Extension Waitlist"}</button>
              {user ? (
                <div className="border-t border-sky-100 pt-2 mt-1">
                  <p className="px-3 text-xs text-[#5b7a99]">Signed in as <span className="font-bold text-[#0b1b2b]">{user.name}</span></p>
                  <button onClick={() => { setMenu(false); handleSignOut(); }} className="flex min-h-[44px] items-center rounded-xl px-3 text-left font-semibold text-rose-600 hover:bg-rose-50 w-full">Sign Out</button>
                </div>
              ) : (
                <button onClick={() => { setMenu(false); setSignIn(true); }} className="flex min-h-[44px] items-center rounded-xl px-3 text-left font-semibold text-[#0b1b2b] hover:bg-sky-50">Sign In with Google</button>
              )}
            </div>
          </div>
        )}
      </header>
      <WaitlistModal open={waitlist} onClose={() => setWaitlist(false)} />
      <SignInModal
        open={signIn}
        onClose={() => setSignIn(false)}
        onSuccess={(u) => setUser(u)}
      />
      {!onDemo && <DemoModal open={demo} onClose={() => setDemo(false)} />}
    </>
  );
}

export function Footer() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState(false); const [waitlist, setWaitlist] = useState(false);
  const ext = extensionUrl();
  async function subscribe() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const j = await r.json(); setMsg(j.message || j.error || "Done.");
      if (r.ok) setEmail("");
    } catch { setMsg("Network hiccup — try again."); }
    setBusy(false);
  }
  return (
    <footer className="relative mt-0 border-t border-white/70 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#5b7a99]">Snip anything on your screen. Get answers your way. English first, 11 languages on the roadmap.</p>
          <p className="mt-3 text-xs text-[#5b7a99]">Privacy first: opt-in analytics, no PII storage, FERPA/GDPR-aligned.</p>
        </div>
        <nav aria-label="Product">
          <p className="font-display text-sm font-bold text-[#0b1b2b]">Product</p>
          <ul className="mt-3 grid gap-2 text-sm text-[#5b7a99]">
            <li><a className="hover:text-[#1463ff]" href="/#features">Features</a></li>
            <li><a className="hover:text-[#1463ff]" href="/studio">Snip Studio</a></li>
            <li><a className="hover:text-[#1463ff]" href="/pricing">Pricing</a></li>
            <li><button className="hover:text-[#1463ff]" onClick={() => ext ? window.open(ext, "_blank") : setWaitlist(true)}>Download Extension</button></li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="font-display text-sm font-bold text-[#0b1b2b]">Company</p>
          <ul className="mt-3 grid gap-2 text-sm text-[#5b7a99]">
            <li><a className="hover:text-[#1463ff]" href="/docs">Docs</a></li>
            <li><a className="hover:text-[#1463ff]" href="/docs#integrity">Academic Integrity</a></li>
            <li><button className="hover:text-[#1463ff]" onClick={() => setContact(true)}>Contact us</button></li>
            <li><a className="hover:text-[#1463ff]" href="/#faq">FAQ</a></li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="font-display text-sm font-bold text-[#0b1b2b]">Legal</p>
          <ul className="mt-3 grid gap-2 text-sm text-[#5b7a99]">
            <li><a className="hover:text-[#1463ff]" href="/privacy">Privacy</a></li>
            <li><a className="hover:text-[#1463ff]" href="/terms">Terms</a></li>
            <li><a className="hover:text-[#1463ff]" href="/terms#refunds">Refunds</a></li>
          </ul>
        </nav>
        <div>
          <p className="font-display text-sm font-bold text-[#0b1b2b]">Join updates</p>
          <p className="mt-2 text-sm text-[#5b7a99]">One short email a month.</p>
          <div className="mt-3 flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && subscribe()} placeholder="you@school.edu" aria-label="Email for updates" className="min-h-[46px] w-full rounded-full border border-sky-200 bg-white px-4 text-sm" />
            <button onClick={subscribe} disabled={busy} className="btn-primary focusable flex min-h-[46px] shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold">{busy ? <Loader2 size={15} className="animate-spin" /> : "Join"}</button>
          </div>
          {msg && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700" role="status"><CheckCircle2 size={13} /> {msg}</p>}
        </div>
      </div>
      <div className="border-t border-sky-100/80 py-5 text-center text-xs text-[#5b7a99]">© {new Date().getFullYear()} SolverBuddy. Made for learners everywhere. · YouTube transcripts never consume minutes · DOM text never consumes OCR credits</div>
      <ContactModal open={contact} onClose={() => setContact(false)} />
      <WaitlistModal open={waitlist} onClose={() => setWaitlist(false)} />
    </footer>
  );
}
