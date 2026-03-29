import Link from "next/link";
import { Users, BrainCircuit, MessageSquare, ShieldCheck } from "lucide-react";

const stats = [
  { value: "52+", label: "Lender profiles" },
  { value: "6", label: "Matching dimensions" },
  { value: "AI", label: "Powered matching" },
];

const personas = [
  {
    emoji: "🚗",
    role: "Uber Driver",
    detail: "$42K/yr · 3 years · credit 640",
    tag: "Gig worker",
  },
  {
    emoji: "🎨",
    role: "Freelance Designer",
    detail: "$68K/yr · self-employed · credit 710",
    tag: "Self-employed",
  },
  {
    emoji: "🔧",
    role: "1099 Contractor",
    detail: "$95K/yr · inconsistent months · credit 680",
    tag: "Contractor",
  },
  {
    emoji: "🏪",
    role: "Small Business Owner",
    detail: "$130K revenue · 2 years · credit 720",
    tag: "Business owner",
  },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Dot grid background on hero */}
      <div className="absolute inset-0 h-[680px] dot-grid pointer-events-none" />

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-white/65 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
          AI-powered · No credit pull · Free to use
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Find your best loan.<br />
          <span className="text-[#38bdf8]">Even if banks said no.</span>
        </h1>

        <p className="text-lg text-white/65 max-w-xl mx-auto mb-10 leading-relaxed">
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
            className="px-5 py-2.5 rounded border border-white/20 text-sm text-white/80 hover:text-white hover:border-white/35 transition-colors"
          >
            Use the form
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center flex-wrap gap-8 sm:gap-12 mt-16 pt-12 border-t border-white/8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-[#38bdf8]">{s.value}</div>
              <div className="text-xs text-white/55 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-xs font-medium text-white/55 uppercase tracking-widest text-center mb-8">
          Built for people like
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {personas.map((p) => (
            <div
              key={p.role}
              className="border border-white/10 rounded-xl p-5 hover:border-[#38bdf8]/35 hover:bg-[#38bdf8]/[0.03] transition-all group cursor-default"
            >
              <div className="text-2xl mb-3">{p.emoji}</div>
              <div className="text-sm font-semibold text-white mb-1.5">{p.role}</div>
              <div className="text-xs text-white/60 leading-snug mb-4">{p.detail}</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/12 text-white/50 group-hover:border-[#38bdf8]/30 group-hover:text-[#38bdf8]/80 transition-all">
                {p.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features — bento grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-px border border-white/8 rounded-xl overflow-hidden bg-white/8">

          {/* Card 1 — spans 2 rows on desktop, hero feature */}
          <div className="bg-black p-8 sm:row-span-2 flex flex-col justify-between hover:bg-white/[0.02] transition-colors group">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center mb-5">
                <Users className="w-5 h-5 text-[#38bdf8]" />
              </div>
              <p className="text-[10px] text-[#38bdf8] uppercase tracking-widest mb-2">Who we serve</p>
              <h3 className="text-base font-semibold mb-3">Built for non-traditional workers</h3>
              <p className="text-sm text-white/65 leading-relaxed">
                Gig workers, freelancers, contractors, 1099s. We score you on how you actually earn — not just how the IRS sees you.
              </p>
            </div>
            <Link
              href="/match"
              className="mt-8 text-xs text-[#38bdf8] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Get matched →
            </Link>
          </div>

          {/* Card 2 — 6-dimension scoring */}
          <div className="bg-black p-8 hover:bg-white/[0.02] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center mb-5">
              <BrainCircuit className="w-5 h-5 text-white/65" />
            </div>
            <p className="text-[10px] text-white/45 uppercase tracking-widest mb-2">How we score</p>
            <h3 className="text-sm font-semibold mb-2">6-dimension scoring engine</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Credit, income stability, assets, employment type, DTI ratio, and loan purpose. Every factor that matters, weighted correctly.
            </p>
          </div>

          {/* Card 3 — AI explains */}
          <div className="bg-black p-8 hover:bg-white/[0.02] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center mb-5">
              <MessageSquare className="w-5 h-5 text-white/65" />
            </div>
            <p className="text-[10px] text-white/45 uppercase tracking-widest mb-2">What you get</p>
            <h3 className="text-sm font-semibold mb-2">AI explains every result</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Not just a score — a plain-English breakdown of why each lender matched and what to improve to get better offers.
            </p>
          </div>

          {/* Card 4 — full width, no credit pull */}
          <div className="bg-black p-8 sm:col-span-2 hover:bg-white/[0.02] transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white/65" />
              </div>
              <div>
                <p className="text-[10px] text-white/45 uppercase tracking-widest mb-1">Zero risk</p>
                <h3 className="text-sm font-semibold mb-1">No credit pull. No signup.</h3>
                <p className="text-sm text-white/60">
                  We don&apos;t touch your credit score. Describe your situation, get your matches. That&apos;s the whole flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="relative border border-white/8 rounded-xl p-6 sm:p-12 overflow-hidden">
          <div className="absolute inset-0 dot-grid pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#38bdf8]/5 to-transparent pointer-events-none" />
          <h2 className="relative text-2xl sm:text-3xl font-bold mb-3">Ready to find your match?</h2>
          <p className="relative text-white/60 text-sm mb-8">
            Takes 60 seconds. No credit pull. No signup required.
          </p>
          <div className="relative flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/chat"
              className="px-5 py-2.5 rounded bg-[#38bdf8] text-black text-sm font-semibold hover:bg-[#7dd3fc] transition-colors"
            >
              Start with AI Chat →
            </Link>
            <Link
              href="/match"
              className="px-5 py-2.5 rounded border border-white/20 text-sm text-white/80 hover:text-white hover:border-white/35 transition-colors"
            >
              Fill the form instead
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
