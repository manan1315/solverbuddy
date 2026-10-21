import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolverBuddy — Snip anything on your screen. Get answers your way.",
  description: "Direct. Explain like I'm 5. Quiz. Hint. Math + graphs. PDF & video chat. Screen-first AI study help in 11 languages. Start the 7-day trial for $0.99.",
};

// Deterministic starfield positions (no hydration jitter)
const STARS = Array.from({ length: 42 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  delay: `${(i % 7) * 0.7}s`,
}));

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="sky-bg texture antialiased min-h-screen relative">
        <div className="stars" aria-hidden="true">{STARS.map((s, i) => <i key={i} style={{ left: s.left, top: s.top, animationDelay: s.delay }} />)}</div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
