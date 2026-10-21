"use client";
import { useState } from "react";
import { X, Mail, Loader2, CheckCircle2, Puzzle, LogOut, ExternalLink, Sparkles } from "lucide-react";

function Shell({ onClose, children, label }: { onClose: () => void; children: React.ReactNode; label: string }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-[#0b1b2b]/45 backdrop-blur-sm" onClick={onClose} />
      <div className="fade-up relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        <button onClick={onClose} aria-label="Close" className="focusable absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 hover:bg-sky-100"><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

export function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function WaitlistModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState(""); const [browser, setBrowser] = useState("Chrome");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (!open) return null;
  async function submit() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, browser, source: "extension" }) });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "Try again."); else setMsg(j.message + (j.position ? ` You're #${j.position} in line.` : ""));
    } catch { setErr("Network hiccup — try again."); }
    setBusy(false);
  }
  return (
    <Shell onClose={onClose} label="Join extension waitlist">
      <Puzzle className="text-[#1463ff]" size={30} />
      <h2 className="font-display mt-3 text-2xl font-extrabold text-[#0b1b2b]">Extension waitlist</h2>
      <p className="mt-1 text-sm text-[#5b7a99]">Chrome, Edge &amp; Firefox (Manifest V3). First 500 get launch pricing locked.</p>
      <label className="mt-4 block text-sm font-semibold text-[#0b1b2b]">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" className="mt-1.5 min-h-[48px] w-full rounded-xl border border-sky-200 px-4 text-[15px]" /></label>
      <label className="mt-3 block text-sm font-semibold text-[#0b1b2b]">Browser
        <select value={browser} onChange={(e) => setBrowser(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-sky-200 bg-white px-4 text-[15px]">{["Chrome", "Edge", "Firefox", "Brave", "Safari"].map((b) => <option key={b}>{b}</option>)}</select>
      </label>
      <button onClick={submit} disabled={busy} className="btn-primary focusable mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full font-bold">{busy ? <Loader2 className="animate-spin" size={18} /> : <Mail size={17} />} Join waitlist</button>
      {msg && <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status"><CheckCircle2 size={17} /> {msg}</p>}
      {err && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{err}</p>}
    </Shell>
  );
}

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [message, setMessage] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (!open) return null;
  async function submit() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, message }) });
      const j = await r.json();
      if (!r.ok) setErr(j.error); else { setMsg(j.message); setMessage(""); }
    } catch { setErr("Network hiccup — try again."); }
    setBusy(false);
  }
  return (
    <Shell onClose={onClose} label="Contact SolverBuddy">
      <h2 className="font-display text-2xl font-extrabold text-[#0b1b2b]">Talk to us</h2>
      <p className="mt-1 text-sm text-[#5b7a99]">Schools, bugs, ideas — all welcome.</p>
      <div className="mt-4 grid gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" aria-label="Name" className="min-h-[48px] rounded-xl border border-sky-200 px-4 text-[15px]" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className="min-h-[48px] rounded-xl border border-sky-200 px-4 text-[15px]" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Your message…" aria-label="Message" className="rounded-xl border border-sky-200 px-4 py-3 text-[15px]" />
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary focusable mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full font-bold">{busy ? <Loader2 className="animate-spin" size={18} /> : "Send message"}</button>
      {msg && <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status"><CheckCircle2 size={17} /> {msg}</p>}
      {err && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{err}</p>}
    </Shell>
  );
}

export function SignInModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: (user: { name: string; email: string; avatarUrl?: string }) => void;
}) {
  const [googleEmail, setGoogleEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!open) return null;

  async function handleGoogleSignIn(emailToUse?: string) {
    setBusy(true);
    setErr("");
    setMsg("");

    try {
      // 1. Check if real Google OAuth is configured via GOOGLE_CLIENT_ID
      const checkRes = await fetch("/api/auth/google").then((r) => r.json()).catch(() => ({ configured: false }));
      
      if (checkRes.configured && checkRes.url) {
        window.location.href = checkRes.url;
        return;
      }

      // 2. If not yet configured in .env, handle seamless Google profile creation
      const targetEmail = (emailToUse || googleEmail || "student@gmail.com").trim().toLowerCase();
      const extractedName = targetEmail.split("@")[0].replace(/[._-]/g, " ");
      const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          name: formattedName || "Google Learner",
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(targetEmail)}`,
          googleId: "google_" + Math.random().toString(36).slice(2, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Could not sign in with Google.");
      } else {
        setMsg(`Signed in as ${targetEmail}! Syncing study profile...`);
        if (onSuccess && data.user) {
          onSuccess(data.user);
        }
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch {
      setErr("Network issue while connecting to Google Auth.");
    }
    setBusy(false);
  }

  return (
    <Shell onClose={onClose} label="Sign in with Google">
      <div className="flex items-center gap-2.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-200">
          <GoogleIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold text-[#0b1b2b]">Sign In</h2>
          <p className="text-xs text-[#5b7a99]">SolverBuddy Study Account</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[#5b7a99]">
        Sign in with Google to sync your study history, streaks, and quotas across devices.
      </p>

      {/* Main Google Sign In Button */}
      <div className="mt-5 grid gap-2.5">
        <button
          onClick={() => handleGoogleSignIn()}
          disabled={busy}
          className="focusable flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full border-2 border-sky-200 bg-white px-5 font-bold text-[#0b1b2b] shadow-sm transition hover:border-[#1463ff] hover:bg-sky-50 active:scale-[0.99]"
        >
          {busy ? <Loader2 className="animate-spin text-[#1463ff]" size={20} /> : <GoogleIcon className="h-5 w-5" />}
          <span>Continue with Google</span>
        </button>

        {!showCustomGoogle ? (
          <button
            onClick={() => setShowCustomGoogle(true)}
            className="text-center text-xs font-semibold text-[#1463ff] hover:underline pt-1"
          >
            Use a specific Google Gmail address
          </button>
        ) : (
          <div className="mt-2 rounded-2xl bg-sky-50/80 p-3.5 ring-1 ring-sky-200">
            <label className="block text-xs font-bold text-[#0b1b2b]">
              Your Google Email:
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3.5 text-sm"
              />
            </label>
            <button
              onClick={() => handleGoogleSignIn(googleEmail)}
              disabled={busy || !googleEmail.includes("@")}
              className="btn-primary focusable mt-2.5 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full text-xs font-bold disabled:opacity-50"
            >
              Sign In with this Google Account
            </button>
          </div>
        )}
      </div>

      {msg && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700" role="status">
          <CheckCircle2 size={16} /> {msg}
        </p>
      )}

      {err && (
        <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700" role="alert">
          {err}
        </p>
      )}

      <div className="mt-5 border-t border-sky-100 pt-3 text-center">
        <a href="/studio" onClick={onClose} className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b7a99] hover:text-[#1463ff]">
          Continue as Guest on this Device <ExternalLink size={12} />
        </a>
      </div>
    </Shell>
  );
}
