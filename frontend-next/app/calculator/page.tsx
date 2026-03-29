"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface LoanInput {
  amount: string;
  apr: string;
  term: string;
}

const TERM_PRESETS = [3, 5, 10, 15, 20, 30];

function calcLoan(input: LoanInput) {
  const P = parseFloat(input.amount);
  const apr = parseFloat(input.apr);
  const years = parseFloat(input.term);
  if (!P || !apr || !years || P <= 0 || apr <= 0 || years <= 0) return null;
  const r = apr / 100 / 12;
  const n = years * 12;
  const monthly = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = monthly * n;
  const totalInterest = totalPayment - P;
  return {
    principal: P,
    monthly,
    totalPayment,
    totalInterest,
    interestPct: (totalInterest / totalPayment) * 100,
    months: Math.round(n),
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <span className="text-white/75">{payload[0].name}: </span>
      <span className="font-mono text-white">${fmt(payload[0].value)}</span>
    </div>
  );
};

export default function CalculatorPage() {
  const [loan, setLoan] = useState<LoanInput>({ amount: "", apr: "", term: "" });

  const result = useMemo(() => calcLoan(loan), [loan]);

  const pieData = result
    ? [
        { name: "Principal", value: result.principal, fill: "#38bdf8" },
        { name: "Interest", value: result.totalInterest, fill: "#ffffff18" },
      ]
    : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Title */}
      <div className="mb-10">
        <div className="text-xs text-white/45 uppercase tracking-widest mb-3">Tools</div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Loan Calculator</h1>
        <p className="text-white/65 text-sm">
          Enter your loan details to see your monthly payment and total cost breakdown.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Left: Inputs ── */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] space-y-6">

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-white/75 mb-2 block uppercase tracking-wider">
                Loan Amount
              </label>
              <div className="flex items-center border border-white/10 rounded-xl bg-white/[0.03] focus-within:border-[#38bdf8]/50 focus-within:bg-[#38bdf8]/[0.02] transition-all">
                <span className="px-4 text-white/65 text-sm font-mono">$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="50,000"
                  value={loan.amount}
                  onChange={(e) => setLoan({ ...loan, amount: e.target.value })}
                  className="flex-1 bg-transparent py-3 pr-4 text-base text-white placeholder:text-white/35 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* APR */}
            <div>
              <label className="text-xs font-medium text-white/75 mb-2 block uppercase tracking-wider">
                Annual Interest Rate (APR)
              </label>
              <div className="flex items-center border border-white/10 rounded-xl bg-white/[0.03] focus-within:border-[#38bdf8]/50 focus-within:bg-[#38bdf8]/[0.02] transition-all">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="7.5"
                  value={loan.apr}
                  onChange={(e) => setLoan({ ...loan, apr: e.target.value })}
                  className="flex-1 bg-transparent py-3 pl-4 text-base text-white placeholder:text-white/35 focus:outline-none font-mono"
                />
                <span className="px-4 text-white/65 text-sm font-mono">%</span>
              </div>
            </div>

            {/* Term */}
            <div>
              <label className="text-xs font-medium text-white/75 mb-2 block uppercase tracking-wider">
                Loan Term
              </label>
              {/* Quick-select pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {TERM_PRESETS.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setLoan({ ...loan, term: String(yr) })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      loan.term === String(yr)
                        ? "bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40"
                        : "border border-white/10 text-white/65 hover:border-white/25 hover:text-white/90"
                    }`}
                  >
                    {yr}yr
                  </button>
                ))}
              </div>
              <div className="flex items-center border border-white/10 rounded-xl bg-white/[0.03] focus-within:border-[#38bdf8]/50 focus-within:bg-[#38bdf8]/[0.02] transition-all">
                <input
                  type="number"
                  min={1}
                  max={30}
                  placeholder="5"
                  value={loan.term}
                  onChange={(e) => setLoan({ ...loan, term: e.target.value })}
                  className="flex-1 bg-transparent py-3 pl-4 text-base text-white placeholder:text-white/35 focus:outline-none font-mono"
                />
                <span className="px-4 text-white/65 text-sm">yrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="flex-1 min-w-0">
          {!result ? (
            <div className="h-full flex items-center justify-center border border-white/8 rounded-2xl p-16 text-center min-h-[300px]">
              <div>
                <div className="text-5xl mb-4 font-mono text-white/10">$</div>
                <p className="text-white/55 text-sm">Fill in your loan details to see the breakdown</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Hero: Monthly Payment */}
              <div className="border border-[#38bdf8]/20 rounded-2xl p-6 bg-[#38bdf8]/[0.04] glow-cyan-sm">
                <div className="text-xs font-medium text-white/65 uppercase tracking-widest mb-2">
                  Monthly Payment
                </div>
                <div className="text-5xl font-bold font-mono text-[#38bdf8] tracking-tight">
                  ${fmt(result.monthly)}
                </div>
                <div className="mt-3 text-xs text-white/55">
                  over {result.months} months &middot; {result.interestPct.toFixed(1)}% of total goes to interest
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Total Interest",
                    value: `$${fmt(result.totalInterest)}`,
                    sub: `${result.interestPct.toFixed(0)}% of total`,
                  },
                  { label: "Total Cost", value: `$${fmt(result.totalPayment)}` },
                  { label: "Payments", value: String(result.months), sub: "months" },
                ].map((s) => (
                  <div key={s.label} className="border border-white/8 rounded-xl p-4 bg-white/[0.02]">
                    <div className="text-[10px] text-white/55 uppercase tracking-wider mb-2">{s.label}</div>
                    <div className="text-lg font-semibold font-mono text-white">{s.value}</div>
                    {s.sub && <div className="text-[10px] text-white/45 mt-1">{s.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Principal vs Interest ratio bar */}
              <div className="border border-white/8 rounded-xl p-5 bg-white/[0.02]">
                <div className="flex justify-between text-xs text-white/65 mb-3">
                  <span>Principal</span>
                  <span>Interest</span>
                </div>
                <div className="h-3 rounded-full bg-white/8 overflow-hidden flex">
                  <div
                    className="h-full bg-[#38bdf8] transition-all duration-500"
                    style={{ width: `${100 - result.interestPct}%` }}
                  />
                  <div
                    className="h-full bg-white/20"
                    style={{ width: `${result.interestPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-[#38bdf8] font-mono">${fmt(result.principal)}</span>
                  <span className="text-white/55 font-mono">${fmt(result.totalInterest)}</span>
                </div>
              </div>

              {/* Donut chart */}
              <div className="border border-white/8 rounded-xl p-5 bg-white/[0.02]">
                <div className="text-xs text-white/65 uppercase tracking-wider mb-4">Cost Breakdown</div>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={56}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 pr-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                        <span className="text-xs text-white/75">Principal</span>
                      </div>
                      <div className="text-sm font-mono font-semibold">${fmt(result.principal)}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <span className="text-xs text-white/75">Interest</span>
                      </div>
                      <div className="text-sm font-mono font-semibold text-white/75">
                        ${fmt(result.totalInterest)}
                      </div>
                    </div>
                    <div className="border-t border-white/8 pt-3">
                      <div className="text-[10px] text-white/55 mb-1 uppercase tracking-wider">Total</div>
                      <div className="text-sm font-mono font-semibold">${fmt(result.totalPayment)}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
