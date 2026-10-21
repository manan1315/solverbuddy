import { Navbar, Footer } from "@/components/Chrome";

export default function TermsPage() {
  const secs: [string, string][] = [
    ["The service", "SolverBuddy provides AI-assisted study answers in four modes (Direct, ELI5, Quiz, Hint). Answers can be wrong — check important work, especially when we show a low-confidence badge."],
    ["Plans & quotas", "Trial $0.99/7 days (card required, one per device/user, auto-converts to Monthly unless cancelled), Monthly $11.99/mo, Semester $29.99/3 months. Quotas and credit rules are listed on the Pricing page and enforced by routing. Daily soft caps may apply to prevent burst abuse."],
    ["Fair use", "Don't scrape, resell, or automate bulk querying. Don't use SolverBuddy to violate your school's rules — that's what Quiz, Hint and Academic Integrity Mode are for."],
    ["Cancellation", "Cancel anytime; access continues to the end of the paid period. Cancelling the trial within 7 days prevents conversion entirely."],
  ];
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold text-[#0b1b2b]">Terms</h1>
        <p className="mt-2 text-sm text-[#5b7a99]">Plain-English terms for the Trial, Monthly and Semester plans.</p>
        <div className="mt-8 grid gap-4">
          {secs.map(([t, b]) => <section key={t} className="rounded-3xl bg-white p-6 card-shadow ring-1 ring-sky-100"><h2 className="font-display font-extrabold text-[#0b1b2b]">{t}</h2><p className="mt-2 leading-relaxed text-[#5b7a99]">{b}</p></section>)}
          <section id="refunds" className="scroll-mt-28 rounded-3xl bg-white p-6 card-shadow ring-1 ring-sky-100">
            <h2 className="font-display font-extrabold text-[#0b1b2b]">Refunds</h2>
            <p className="mt-2 leading-relaxed text-[#5b7a99]">Trial: cancel within 7 days and you're never charged again. Monthly: no partial-month refunds, but cancellation stops all future charges. Semester: pro-rata refund within the first 14 days. Power Packs: fully refunded if unused; partially used packs are refunded for the unused balance on request. To request a refund, use the contact form in the footer.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
