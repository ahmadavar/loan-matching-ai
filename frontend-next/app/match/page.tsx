"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { track } from "@/lib/track";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function cleanText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")          // headings
    .replace(/\*\*(.*?)\*\*/g, "$1")       // bold
    .replace(/\*(.*?)\*/g, "$1")           // italic
    .replace(/`(.*?)`/g, "$1")             // inline code
    .replace(/^[-*]\s+/gm, "• ")           // bullets
    .replace(/^\s*\*\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Breakdown = Record<string, { points: number; note: string }>;

interface Match {
  lender_name: string;
  score: number;
  website?: string;
  breakdown: Breakdown;
  explanation?: string;
}

const EMPLOYMENT_OPTIONS = [
  { value: "salaried", label: "Salaried / W-2" },
  { value: "self_employed", label: "Self-Employed / Freelancer" },
  { value: "gig", label: "Gig Worker (Uber, DoorDash…)" },
  { value: "contractor", label: "Contractor / 1099" },
];

const PURPOSE_OPTIONS = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "home", label: "Home Purchase" },
  { value: "home_improvement", label: "Home Improvement" },
  { value: "debt_consolidation", label: "Debt Consolidation" },
  { value: "auto", label: "Auto" },
  { value: "medical", label: "Medical" },
  { value: "education", label: "Education" },
  { value: "vacation", label: "Vacation" },
  { value: "rv", label: "RV" },
];

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-emerald-400";
  if (score >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function dimIcon(pts: number) {
  if (pts === 0) return "❌";
  return "✅";
}

function MatchCard({ match, rank }: { match: Match; rank: number }) {
  const [open, setOpen] = useState(rank === 1); // top match open by default
  const dims = Object.entries(match.breakdown);
  const maxPts = { credit_score: 20, income: 20, employment: 20, dti: 15, assets: 15, loan_purpose: 10 } as Record<string, number>;

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 font-mono w-5">#{rank}</span>
          <div>
            <div className="text-sm font-semibold">{match.lender_name}</div>
            {match.website && (
              <a
                href={match.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#38bdf8] hover:underline"
              >
                Visit lender →
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold tabular-nums ${scoreColor(match.score)}`}>
            {match.score}
            <span className="text-xs text-white/30 font-normal">/100</span>
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-5 pb-3">
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBg(match.score)}`}
            style={{ width: `${match.score}%` }}
          />
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-2.5 text-left text-xs text-white/35 hover:text-white/60 border-t border-white/6 transition-colors flex items-center justify-between"
      >
        <span>Score breakdown</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 py-4 border-t border-white/6 space-y-2">
          {dims.map(([dim, detail]) => (
            <div key={dim} className="flex items-start justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 text-white/50">
                <span>{dimIcon(detail.points)}</span>
                <span className="capitalize">{dim.replace(/_/g, " ")}</span>
              </span>
              <span className="text-right text-white/35 max-w-[55%] leading-snug">
                {detail.note}
                <span className="ml-2 font-mono text-white/50">{detail.points}pt</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  const [form, setForm] = useState({
    credit_score: 680,
    annual_income: 60000,
    employment_type: "salaried",
    years_at_current_work: 2,
    loan_amount_needed: 25000,
    loan_purpose: "personal",
    total_assets: 50000,
    monthly_debt_payments: 500,
    income_stable: true,
  });

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => { track("page_view", "/match"); }, []);

  function set(key: string, value: string | number | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    setDone(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMatches([]);

    try {
      const res = await fetch(`${API}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 404) {
        setError("No matching lenders found. Try adjusting your credit score, income, or loan amount.");
      } else if (res.status === 429) {
        setError("Daily limit reached. Come back tomorrow.");
      } else if (!res.ok) {
        setError("Something went wrong. Please try again.");
      } else {
        const data = await res.json();
        setMatches(data);
        setDone(true);
        track("match_run", "/match", { lenders_found: data.length, employment_type: form.employment_type, loan_purpose: form.loan_purpose });
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Loan matching</div>
        <h1 className="text-3xl font-bold mb-2">Find your best lenders</h1>
        <p className="text-sm text-white/45">
          Fill in your details for a full dimension-by-dimension breakdown across 52+ lenders.
          No credit pull. No signup.
        </p>
      </div>

      <form onSubmit={submit}>
        {/* Form grid */}
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {/* Loan Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Loan Amount ($)</Label>
            <Input
              type="number"
              min={1000}
              value={form.loan_amount_needed}
              onChange={(e) => set("loan_amount_needed", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/20 focus:border-[#38bdf8]/50"
            />
          </div>

          {/* Loan Purpose */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Loan Purpose</Label>
            <select
              value={form.loan_purpose}
              onChange={(e) => set("loan_purpose", e.target.value)}
              className="w-full h-8 rounded-lg border border-white/10 bg-white/4 px-2.5 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
            >
              {PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-zinc-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Credit Score */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">
              Credit Score
              <span className="ml-2 text-[#38bdf8]">{form.credit_score}</span>
            </Label>
            <input
              type="range"
              min={300}
              max={850}
              value={form.credit_score}
              onChange={(e) => set("credit_score", Number(e.target.value))}
              className="w-full accent-[#38bdf8]"
            />
            <div className="flex justify-between text-xs text-white/25">
              <span>300 — Poor</span>
              <span>580 — Fair</span>
              <span>700 — Good</span>
              <span>850 — Excellent</span>
            </div>
          </div>

          {/* Annual Income */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Annual Income ($)</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={form.annual_income}
              onChange={(e) => set("annual_income", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/20 focus:border-[#38bdf8]/50"
            />
          </div>

          {/* Employment Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Employment Type</Label>
            <select
              value={form.employment_type}
              onChange={(e) => set("employment_type", e.target.value)}
              className="w-full h-8 rounded-lg border border-white/10 bg-white/4 px-2.5 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
            >
              {EMPLOYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-zinc-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Years at Job */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Years at Current Job / Line of Work</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={form.years_at_current_work}
              onChange={(e) => set("years_at_current_work", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/20 focus:border-[#38bdf8]/50"
            />
          </div>

          {/* Total Assets */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Total Assets ($) — savings, investments, property</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={form.total_assets}
              onChange={(e) => set("total_assets", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/20 focus:border-[#38bdf8]/50"
            />
          </div>

          {/* Monthly Debt */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Monthly Debt Payments ($) — cards, car, student loans</Label>
            <Input
              type="number"
              min={0}
              step={50}
              value={form.monthly_debt_payments}
              onChange={(e) => set("monthly_debt_payments", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/20 focus:border-[#38bdf8]/50"
            />
          </div>
        </div>

        {/* Income stable toggle */}
        <label className="flex items-center gap-3 mb-8 cursor-pointer group">
          <div
            onClick={() => set("income_stable", !form.income_stable)}
            className={`w-9 h-5 rounded-full transition-colors ${form.income_stable ? "bg-[#38bdf8]" : "bg-white/15"}`}
          >
            <div
              className={`w-4 h-4 mt-0.5 rounded-full bg-white shadow transition-transform ${form.income_stable ? "translate-x-4.5" : "translate-x-0.5"}`}
            />
          </div>
          <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
            My income has been consistent for 2+ years
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-[#38bdf8] text-black text-sm font-semibold hover:bg-[#7dd3fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-cyan flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Analysing your profile…
            </>
          ) : "Find My Lenders →"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-6 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/8 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {done && matches.length > 0 && (
        <div className="mt-12">

          {/* AI Advisor Summary */}
          {matches[0]?.explanation && (
            <div className="mb-8 rounded-xl border border-[#38bdf8]/20 bg-[#38bdf8]/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#38bdf8] text-sm">✦</span>
                <span className="text-xs font-semibold text-[#38bdf8] uppercase tracking-wider">
                  AI Advisor Summary
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                {cleanText(matches[0].explanation ?? "")}
              </p>
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Your top {matches.length} matches
            </h2>
            <span className="text-xs text-white/30 border border-white/8 rounded-full px-3 py-1">
              from 52+ lenders
            </span>
          </div>

          <div className="space-y-3">
            {matches.map((m, i) => (
              <MatchCard key={m.lender_name} match={m} rank={i + 1} />
            ))}
          </div>

          {/* Reset */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => { setMatches([]); setDone(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors border border-white/8 rounded-full px-4 py-2"
            >
              ↑ Adjust and search again
            </button>
          </div>

          <p className="mt-4 text-xs text-white/20 text-center">
            For informational purposes only. Not financial advice. No credit pull was performed.
          </p>
        </div>
      )}
    </div>
  );
}
