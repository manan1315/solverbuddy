import { Navbar, Footer } from "@/components/Chrome";

export default function PrivacyPage() {
  const secs: [string, string][] = [
    ["What we process", "Snipped text, images, PDFs and video links you submit are processed to generate your answer. OCR may run in-browser (Tesseract.js) or via a vision model you trigger."],
    ["What we store", "On this deployment: your snip history and quiz attempts are tied to an anonymous device ID (no name, no school ID). Emails are stored only if you join the waitlist, subscribe to updates, or contact us. No PII is sold or shared for advertising."],
    ["Analytics", "Mastery analytics (topics, accuracy, hint frequency, streaks) power your Studio dashboard. They are opt-in product data, FERPA/GDPR-aligned, and you can delete your history item-by-item in the Studio."],
    ["Payments", "Payments are handled by Stripe when configured; card data never touches our servers. In mock mode, no payment data exists at all."],
    ["Your controls", "Delete snips anytime. Unsubscribe from emails with one click. To erase a device's data entirely, contact us and we'll wipe the device ID and everything attached to it."],
  ];
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold text-[#0b1b2b]">Privacy</h1>
        <p className="mt-2 text-sm text-[#5b7a99]">Short version: your screen is yours. We process what you snip, store as little as possible, and never sell data.</p>
        <div className="mt-8 grid gap-4">
          {secs.map(([t, b]) => <section key={t} className="rounded-3xl bg-white p-6 card-shadow ring-1 ring-sky-100"><h2 className="font-display font-extrabold text-[#0b1b2b]">{t}</h2><p className="mt-2 leading-relaxed text-[#5b7a99]">{b}</p></section>)}
        </div>
      </main>
      <Footer />
    </>
  );
}
