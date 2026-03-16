import Link from "next/link";

const stats = [
  { value: "52+", label: "Lender profiles" },
  { value: "6", label: "Matching dimensions" },
  { value: "AI", label: "Powered matching" },
];

const features = [
  {
    title: "Built for non-traditional workers",
    description:
      "Gig workers, freelancers, contractors, 1099s. We score you on how you actually earn — not just how the IRS sees you.",
  },
  {
    title: "6-dimension scoring engine",
    description:
      "Credit, income stability, assets, employment type, DTI ratio, and loan purpose. Every factor that matters, weighted correctly.",
  },
  {
    title: "AI explains every result",
    description:
      "Not just a score — a plain-English breakdown of why each lender matched and what to improve to get better offers.",
  },
  {
    title: "No credit pull. No signup.",
    description:
      "We don't touch your credit score. Describe your situation, get your matches. That's the whole flow.",
  },
];

const personas = [
  { role: "Uber Driver", detail: "$42K/yr · 3 years · credit 640" },
  { role: "Freelance Designer", detail: "$68K/yr · self-employed · credit 710" },
  { role: "1099 Contractor", detail: "$95K/yr · inconsistent months · credit 680" },
  { role: "Small Business Owner", detail: "$130K revenue · 2 years · credit 720" },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Dot grid background on hero */}
      <div className="absolute inset-0 h-[680px] dot-grid pointer-events-none" />

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-white/50 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
          AI-powered · No credit pull · Free to use
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Find your best loan.<br />
          <span className="text-[#38bdf8]">Even if banks said no.</span>
        </h1>

        <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          Traditional lenders reject millions of gig workers, freelancers, and self-employed
          professionals who are financially healthy. LoanMatch AI sees the full picture.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/chat"
            className="px-5 py-2.5 rounded bg-[#38bdf8] text-black text-sm font-semibold hover:bg-[#7dd3fc] transition-colors glow-cyan"
          >
            Chat with AI →
          </Link>
          <Link
            href="/match"
            className="px-5 py-2.5 rounded border border-white/12 text-sm text-white/70 hover:text-white hover:border-white/25 transition-colors"
          >
            Use the form
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-12 mt-16 pt-12 border-t border-white/8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-[#38bdf8]">{s.value}</div>
              <div className="text-xs text-white/35 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-xs text-white/30 uppercase tracking-widest text-center mb-8">
          Built for people like
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {personas.map((p) => (
            <div
              key={p.role}
              className="border border-white/8 rounded-lg p-4 hover:border-[#38bdf8]/30 transition-colors"
            >
              <div className="text-sm font-medium mb-1">{p.role}</div>
              <div className="text-xs text-white/35 leading-snug">{p.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-px border border-white/8 rounded-xl overflow-hidden bg-white/8">
          {features.map((f) => (
            <div key={f.title} className="bg-black p-8 hover:bg-white/[0.02] transition-colors">
              <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="relative border border-white/8 rounded-xl p-12 overflow-hidden">
          <div className="absolute inset-0 dot-grid pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#38bdf8]/5 to-transparent pointer-events-none" />
          <h2 className="relative text-3xl font-bold mb-3">Ready to find your match?</h2>
          <p className="relative text-white/45 text-sm mb-8">
            Takes 60 seconds. No credit pull. No signup required.
          </p>
          <div className="relative flex items-center justify-center gap-4">
            <Link
              href="/chat"
              className="px-5 py-2.5 rounded bg-[#38bdf8] text-black text-sm font-semibold hover:bg-[#7dd3fc] transition-colors"
            >
              Start with AI Chat →
            </Link>
            <Link
              href="/match"
              className="px-5 py-2.5 rounded border border-white/12 text-sm text-white/70 hover:text-white hover:border-white/25 transition-colors"
            >
              Fill the form instead
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
