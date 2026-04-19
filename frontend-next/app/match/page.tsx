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
  apr_min?: number;
  apr_max?: number;
  estimated_apr?: number;
  apr_source?: string;
  affiliate_url?: string | null;
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

function aprColor(apr: number) {
  if (apr <= 12) return "text-emerald-400";
  if (apr <= 20) return "text-amber-400";
  return "text-red-400";
}

function MatchCard({ match, rank, simulatedApr }: { match: Match; rank: number; simulatedApr?: number }) {
  const [open, setOpen] = useState(rank === 1);
  const dims = Object.entries(match.breakdown);
  const scoreOutOf130 = match.score;
  const scorePercent = Math.min((scoreOutOf130 / 130) * 100, 100);
  const displayApr = simulatedApr ?? match.estimated_apr;

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/45 font-mono w-5">#{rank}</span>
          <div>
            <div className="text-sm font-semibold">{match.lender_name}</div>
            {match.affiliate_url ? (
              <a href={match.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
                className="text-xs text-emerald-400 hover:underline font-medium">
                Apply now →
              </a>
            ) : match.website ? (
              <a href={match.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#38bdf8] hover:underline">
                Visit lender →
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* APR display */}
          {displayApr != null && match.apr_min != null && (
            <div className="text-right">
              <div className={`text-xl font-bold tabular-nums ${aprColor(displayApr)}`}>
                {displayApr.toFixed(2)}%
                <span className="text-xs text-white/45 font-normal ml-0.5">APR est.</span>
              </div>
              <div className="text-xs text-white/35 tabular-nums">
                range {match.apr_min}%–{match.apr_max}%
              </div>
            </div>
          )}
          <span className={`text-sm font-bold tabular-nums ${scoreColor(scoreOutOf130)}`}>
            {scoreOutOf130}
            <span className="text-xs text-white/45 font-normal">/130</span>
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-5 pb-3">
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBg(scoreOutOf130)}`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-2.5 text-left text-xs text-white/50 hover:text-white/75 border-t border-white/6 transition-colors flex items-center justify-between"
      >
        <span>Score breakdown</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 py-4 border-t border-white/6 space-y-2">
          {dims.map(([dim, detail]) => (
            <div key={dim} className="flex items-start justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 text-white/65">
                <span>{dimIcon(detail.points)}</span>
                <span className="capitalize">{dim.replace(/_/g, " ")}</span>
              </span>
              <span className="text-right text-white/50 max-w-[55%] leading-snug">
                {detail.note}
                <span className="ml-2 font-mono text-white/65">{detail.points}pt</span>
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
    // Bonus dimensions
    income_continuity_months: 0,
    payment_behavior_score: null as number | null,
    income_source_count: 1,
  });

  // Local APR simulator — recalculates without API call
  function simulateApr(match: Match, bonusScore: number): number | undefined {
    if (match.apr_min == null || match.apr_max == null) return undefined;
    const baseScore = match.score - (match.breakdown.income_continuity?.points ?? 0)
      - (match.breakdown.payment_behavior?.points ?? 0)
      - (match.breakdown.income_diversity?.points ?? 0);
    const newScore = Math.min(baseScore + bonusScore, 130);
    return Math.round((match.apr_min + (1 - newScore / 130) * (match.apr_max - match.apr_min)) * 100) / 100;
  }

  const isGig = ["gig", "self_employed", "contractor"].includes(form.employment_type);

  // Calculate current bonus score from sliders
  function currentBonusScore(): number {
    let pts = 0;
    if (isGig) {
      if (form.income_continuity_months >= 24) pts += 10;
      else if (form.income_continuity_months >= 12) pts += 6;
      else if (form.income_continuity_months >= 6) pts += 3;

      if (form.payment_behavior_score != null) {
        if (form.payment_behavior_score >= 90) pts += 10;
        else if (form.payment_behavior_score >= 75) pts += 7;
        else if (form.payment_behavior_score >= 60) pts += 4;
      }

      if (form.income_source_count >= 5) pts += 10;
      else if (form.income_source_count >= 3) pts += 7;
      else if (form.income_source_count === 2) pts += 4;
    }
    return pts;
  }

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [plaidVerified, setPlaidVerified] = useState(false);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [plaidError, setPlaidError] = useState("");

  async function verifyWithPlaid() {
    setPlaidLoading(true);
    setPlaidError("");
    try {
      const res = await fetch(`${API}/api/plaid/link_token`, { method: "POST" });
      if (res.status === 503) {
        setPlaidError("Plaid verification coming soon — not yet configured.");
        return;
      }
      if (!res.ok) throw new Error("Failed to get link token");
      const { link_token } = await res.json();

      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as Record<string, unknown>).Plaid) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Plaid script"));
        document.head.appendChild(script);
      });

      const handler = (window as unknown as { Plaid: { create: (cfg: unknown) => { open: () => void } } }).Plaid.create({
        token: link_token,
        onSuccess: async (public_token: string) => {
          const exchRes = await fetch(`${API}/api/plaid/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_token, user_id: "anonymous" }),
          });
          if (!exchRes.ok) throw new Error("Token exchange failed");
          const dims = await exchRes.json();
          setForm(f => ({
            ...f,
            income_continuity_months: dims.income_continuity_months ?? f.income_continuity_months,
            payment_behavior_score: dims.payment_behavior_score ?? f.payment_behavior_score,
            income_source_count: dims.income_source_count ?? f.income_source_count,
          }));
          setPlaidVerified(true);
          setDone(false);
        },
        onExit: () => {},
      });
      handler.open();
    } catch {
      setPlaidError("Could not connect to Plaid. Try again.");
    } finally {
      setPlaidLoading(false);
    }
  }

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
        <div className="text-xs text-white/45 uppercase tracking-widest mb-3">Loan matching</div>
        <h1 className="text-3xl font-bold mb-2">Find your best lenders</h1>
        <p className="text-sm text-white/60">
          Fill in your details for a full dimension-by-dimension breakdown across 52+ lenders.
          No credit pull. No signup.
        </p>
      </div>

      <form onSubmit={submit}>
        {/* Form grid */}
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {/* Loan Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/65">Loan Amount ($)</Label>
            <Input
              type="number"
              min={1000}
              value={form.loan_amount_needed}
              onChange={(e) => set("loan_amount_needed", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/35 focus:border-[#38bdf8]/50"
            />
          </div>

          {/* Loan Purpose */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/65">Loan Purpose</Label>
            <select
              value={form.loan_purpose}
              onChange={(e) => set("loan_purpose", e.target.value)}
              className="w-full h-10 rounded-lg border border-white/10 bg-white/4 px-2.5 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
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
            <Label className="text-xs text-white/65">
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
            <div className="flex justify-between text-xs text-white/40">
              <span>300 — Poor</span>
              <span className="hidden sm:block">580 — Fair</span>
              <span className="hidden sm:block">700 — Good</span>
              <span>850 — Excellent</span>
            </div>
          </div>

          {/* Annual Income */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/65">Annual Income ($)</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={form.annual_income}
              onChange={(e) => set("annual_income", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/35 focus:border-[#38bdf8]/50"
            />
          </div>

          {/* Employment Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/65">Employment Type</Label>
            <select
              value={form.employment_type}
              onChange={(e) => set("employment_type", e.target.value)}
              className="w-full h-10 rounded-lg border border-white/10 bg-white/4 px-2.5 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
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
            <Label className="text-xs text-white/65">Years at Current Job / Line of Work</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={form.years_at_current_work}
              onChange={(e) => set("years_at_current_work", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/35 focus:border-[#38bdf8]/50"
            />
          </div>

          {/* Total Assets */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/65">Total Assets ($) — savings, investments, property</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={form.total_assets}
              onChange={(e) => set("total_assets", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/35 focus:border-[#38bdf8]/50"
            />
          </div>

          {/* Monthly Debt */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/65">Monthly Debt Payments ($) — cards, car, student loans</Label>
            <Input
              type="number"
              min={0}
              step={50}
              value={form.monthly_debt_payments}
              onChange={(e) => set("monthly_debt_payments", Number(e.target.value))}
              className="bg-white/4 border-white/10 text-white placeholder:text-white/35 focus:border-[#38bdf8]/50"
            />
          </div>
        </div>

        {/* Bonus dimensions — gig/self-employed only */}
        {isGig && (
          <div className="mb-8 rounded-xl border border-[#38bdf8]/20 bg-[#38bdf8]/5 p-5 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#38bdf8] text-sm">⚡</span>
              <span className="text-xs font-semibold text-[#38bdf8] uppercase tracking-wider">
                Reduce your rate — add verified gig data
              </span>
            </div>
            <p className="text-xs text-white/50 -mt-2">
              These 3 dimensions can lower your estimated APR by proving your actual risk is lower than your credit score suggests.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={verifyWithPlaid}
                disabled={plaidLoading || plaidVerified}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  plaidVerified
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                    : "bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 hover:bg-[#38bdf8]/25 disabled:opacity-50"
                }`}
              >
                {plaidVerified ? "✓ Plaid Verified — sliders auto-filled" : plaidLoading ? "Connecting…" : "Auto-fill with Plaid →"}
              </button>
              <span className="text-xs text-white/35">or set sliders manually below</span>
            </div>
            {plaidError && <p className="text-xs text-amber-400">{plaidError}</p>}

            {/* D7 — Income continuity */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/65">
                Months of continuous 1099 / gig income
                <span className="ml-2 text-[#38bdf8]">{form.income_continuity_months} mo</span>
                {form.income_continuity_months >= 24 && <span className="ml-2 text-emerald-400">✓ 2-year standard met</span>}
              </Label>
              <input type="range" min={0} max={60} value={form.income_continuity_months}
                onChange={(e) => set("income_continuity_months", Number(e.target.value))}
                className="w-full accent-[#38bdf8]" />
              <div className="flex justify-between text-xs text-white/35">
                <span>0 mo</span><span>12 mo</span><span>24 mo ✓</span><span>36 mo</span><span>60 mo</span>
              </div>
            </div>

            {/* D8 — Payment behavior */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/65">
                Off-bureau payment score — utilities, rent, subscriptions (0–100)
                <span className="ml-2 text-[#38bdf8]">{form.payment_behavior_score ?? "not set"}</span>
              </Label>
              <input type="range" min={0} max={100}
                value={form.payment_behavior_score ?? 0}
                onChange={(e) => set("payment_behavior_score", Number(e.target.value))}
                className="w-full accent-[#38bdf8]" />
              <div className="flex justify-between text-xs text-white/35">
                <span>0 — poor</span><span>60</span><span>75</span><span>90+ ✓</span>
              </div>
            </div>

            {/* D9 — Income diversity */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/65">
                Number of distinct income sources (clients / platforms)
                <span className="ml-2 text-[#38bdf8]">{form.income_source_count}</span>
              </Label>
              <input type="range" min={1} max={10} value={form.income_source_count}
                onChange={(e) => set("income_source_count", Number(e.target.value))}
                className="w-full accent-[#38bdf8]" />
              <div className="flex justify-between text-xs text-white/35">
                <span>1 — single</span><span>3</span><span>5+ ✓</span><span>10</span>
              </div>
            </div>
          </div>
        )}

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
          <span className="text-xs text-white/65 group-hover:text-white/85 transition-colors">
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
              <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line">
                {cleanText(matches[0].explanation ?? "")}
              </p>
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Your top {matches.length} matches
            </h2>
            <span className="text-xs text-white/45 border border-white/8 rounded-full px-3 py-1">
              from 52+ lenders
            </span>
          </div>

          {/* Live simulator panel — gig workers only */}
          {isGig && matches.some(m => m.apr_min != null) && (
            <div className="mb-6 rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400 text-sm">◈</span>
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Risk Simulator — live APR preview
                </span>
              </div>
              <p className="text-xs text-white/50 mb-4">
                Adjust the gig data sliders above to see your estimated APR update in real time.
              </p>
              <div className="space-y-2">
                {matches.filter(m => m.apr_min != null).slice(0, 3).map(m => {
                  const original = m.estimated_apr;
                  const simulated = simulateApr(m, currentBonusScore());
                  const saved = original != null && simulated != null ? Math.round((original - simulated) * 100) / 100 : 0;
                  return (
                    <div key={m.lender_name} className="flex items-center justify-between text-xs">
                      <span className="text-white/65 w-40 truncate">{m.lender_name}</span>
                      <div className="flex items-center gap-3">
                        {original != null && (
                          <span className="text-white/35 line-through tabular-nums">{original.toFixed(2)}%</span>
                        )}
                        {simulated != null && (
                          <span className={`font-bold tabular-nums ${aprColor(simulated)}`}>{simulated.toFixed(2)}%</span>
                        )}
                        {saved > 0 && (
                          <span className="text-emerald-400 tabular-nums">−{saved.toFixed(2)}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {matches.map((m, i) => (
              <MatchCard key={m.lender_name} match={m} rank={i + 1}
                simulatedApr={isGig ? simulateApr(m, currentBonusScore()) : undefined} />
            ))}
          </div>

          {/* Reset */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => { setMatches([]); setDone(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-xs text-white/45 hover:text-white/75 transition-colors border border-white/8 rounded-full px-4 py-2"
            >
              ↑ Adjust and search again
            </button>
          </div>

          <p className="mt-4 text-xs text-white/35 text-center">
            For informational purposes only. Not financial advice. No credit pull was performed.
          </p>
        </div>
      )}
    </div>
  );
}
