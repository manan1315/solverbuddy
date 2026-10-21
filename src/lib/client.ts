"use client";
import { useEffect, useRef, useState } from "react";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("sb_device");
  if (!id) { id = "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem("sb_device", id); }
  return id;
}

export async function startCheckout(plan: string): Promise<void> {
  const r = await fetch(`/api/checkout/${plan}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: getDeviceId() }) });
  const j = (await r.json()) as { url?: string };
  if (j.url) window.location.href = j.url;
}

export function useTypewriter(text: string, speed = 10) {
  const [out, setOut] = useState("");
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setOut("");
    if (!text) return;
    let i = 0;
    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => {
      i += 2;
      setOut(text.slice(0, i));
      if (i >= text.length && ref.current) clearInterval(ref.current);
    }, speed);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [text, speed]);
  return out;
}

export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
