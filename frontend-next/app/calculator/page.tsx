"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

interface LoanInput {
  amount: string;
  apr: string;
  term: string;
}

interface LoanResult {
  label: string;
  principal: number;
  monthly: number;
  totalPayment: number;
  totalInterest: number;
  interestPct: number;
  color: string;
}

const COLORS = ["#38bdf8", "#818cf8", "#34d399"];
const LABELS = ["Loan 1", "Loan 2", "Loan 3"];

const empty = (): LoanInput => ({ amount: "", apr: "", term: "" });

function calcLoan(input: LoanInput): LoanResult | null {
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
    label: "",
    principal: P,
    monthly,
    totalPayment,
    totalInterest,
    interestPct: (totalInterest / totalPayment) * 100,
    color: "",
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SortBy = "monthly" | "interest";

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; fill: string }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs space-y-1">
      {payload.map((p) => (
        <div key={p.name} className="flex gap-3 justify-between">
          <span className="text-white/50">{p.name}</span>
          <span className="font-mono text-white/80">${fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <span className="text-white/50">{payload[0].name}: </span>
      <span className="font-mono text-white/80">${fmt(payload[0].value)}</span>
    </div>
  );
};

function LoanInputGroup({
  index, value, onChange, optional,
}: {
  index: number;
  value: LoanInput;
  onChange: (v: LoanInput) => void;
  optional?: boolean;
}) {
  const label = LABELS[index];
  const color = COLORS[index];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-sm font-semibold text-white/80">
          {label}{optional && <span className="text-white/30 font-normal text-xs ml-1">(optional)</span>}
        </span>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs text-white/40 mb-1 block">
          Loan amount{optional && " (optional)"}
        </label>
        <div className="flex items-center border border-white/10 rounded-lg bg-white/[0.03] focus-within:border-[#38bdf8]/40 transition-colors">
          <span className="px-3 text-white/30 text-sm">$</span>
          <input
            type="number"
            min={0}
            placeholder="10,000"
            value={value.amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
            className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-white placeholder:text-white/20 focus:outline-none"
          />
        </div>
      </div>

      {/* APR */}
      <div>
        <label className="text-xs text-white/40 mb-1 block">
          APR{optional && " (optional)"}
        </label>
        <div className="flex items-center border border-white/10 rounded-lg bg-white/[0.03] focus-within:border-[#38bdf8]/40 transition-colors">
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="7.5"
            value={value.apr}
            onChange={(e) => onChange({ ...value, apr: e.target.value })}
            className="flex-1 bg-transparent py-2.5 pl-3 text-sm text-white placeholder:text-white/20 focus:outline-none"
          />
          <span className="px-3 text-white/30 text-sm">%</span>
        </div>
      </div>

      {/* Term */}
      <div>
        <label className="text-xs text-white/40 mb-1 block">
          Loan term (years){optional && " (optional)"}
        </label>
        <div className="flex items-center border border-white/10 rounded-lg bg-white/[0.03] focus-within:border-[#38bdf8]/40 transition-colors">
          <input
            type="number"
            min={1}
            max={30}
            placeholder="5"
            value={value.term}
            onChange={(e) => onChange({ ...value, term: e.target.value })}
            className="flex-1 bg-transparent py-2.5 pl-3 text-sm text-white placeholder:text-white/20 focus:outline-none"
          />
          <span className="px-3 text-white/30 text-sm">yrs</span>
        </div>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const [loans, setLoans] = useState<LoanInput[]>([empty(), empty(), empty()]);
  const [sortBy, setSortBy] = useState<SortBy>("monthly");

  const results: (LoanResult | null)[] = useMemo(() => {
    return loans.map((l, i) => {
      const r = calcLoan(l);
      if (!r) return null;
      return { ...r, label: LABELS[i], color: COLORS[i] };
    });
  }, [loans]);

  const valid = results.filter(Boolean) as LoanResult[];

  const sorted = [...valid].sort((a, b) =>
    sortBy === "monthly" ? a.monthly - b.monthly : a.totalInterest - b.totalInterest
  );

  const winner = sorted[0] ?? null;

  const barData = valid.map((r) => ({
    name: r.label,
    Principal: r.principal,
    Interest: r.totalInterest,
    fill: r.color,
  }));

  const pieData = winner
    ? [
        { name: "Principal", value: winner.principal, fill: winner.color },
        { name: "Interest", value: winner.totalInterest, fill: "#ffffff18" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Title */}
      <div className="mb-10">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Tools</div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Loans Comparison Calculator</h1>
        <p className="text-white/40 text-sm">
          Compare up to 3 loans side by side — see what you actually pay in interest before you sign anything.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Left: Inputs ── */}
        <div className="w-full lg:w-72 shrink-0 space-y-8">

          {loans.map((loan, i) => (
            <LoanInputGroup
              key={i}
              index={i}
              value={loan}
              optional={i === 2}
              onChange={(v) => {
                const next = [...loans];
                next[i] = v;
                setLoans(next);
              }}
            />
          ))}

          {/* Compare by */}
          <div>
            <div className="text-xs text-white/40 mb-3">Compare loans by</div>
            <div className="space-y-2">
              {(["monthly", "interest"] as SortBy[]).map((opt) => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    sortBy === opt ? "border-[#38bdf8] bg-[#38bdf8]/20" : "border-white/20 group-hover:border-white/40"
                  }`}>
                    {sortBy === opt && <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />}
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    {opt === "monthly" ? "Lowest monthly payment" : "Lowest total interest"}
                  </span>
                  <input type="radio" className="sr-only" checked={sortBy === opt} onChange={() => setSortBy(opt)} />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="flex-1 min-w-0">
          {valid.length === 0 ? (
            <div className="h-full flex items-center justify-center border border-white/8 rounded-2xl p-16 text-center">
              <div>
                <div className="text-3xl mb-3 text-white/10">⌗</div>
                <p className="text-white/30 text-sm">Enter at least one loan to see results</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Winner banner */}
              {winner && valid.length > 1 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#38bdf8]/20 bg-[#38bdf8]/5">
                  <span className="w-2 h-2 rounded-full" style={{ background: winner.color }} />
                  <span className="text-sm text-white/70">
                    <span className="text-white font-semibold">{winner.label}</span> wins on{" "}
                    {sortBy === "monthly" ? "lowest monthly payment" : "lowest total interest"} —{" "}
                    saves you{" "}
                    <span className="text-[#38bdf8] font-semibold font-mono">
                      ${fmt(
                        sortBy === "monthly"
                          ? (sorted[sorted.length - 1]?.monthly ?? 0) - winner.monthly
                          : (sorted[sorted.length - 1]?.totalInterest ?? 0) - winner.totalInterest
                      )}
                    </span>{" "}
                    vs the most expensive option.
                  </span>
                </div>
              )}

              {/* Summary cards */}
              <div className="grid gap-3">
                {sorted.map((r, i) => (
                  <div key={r.label} className={`border rounded-xl p-4 transition-colors ${
                    i === 0 ? "border-white/15 bg-white/[0.03]" : "border-white/8"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                        <span className="text-sm font-semibold">{r.label}</span>
                        {i === 0 && valid.length > 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
                            Best
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/30 font-mono">{r.interestPct.toFixed(1)}% interest</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Monthly", value: `$${fmt(r.monthly)}` },
                        { label: "Total Interest", value: `$${fmt(r.totalInterest)}` },
                        { label: "Total Cost", value: `$${fmt(r.totalPayment)}` },
                      ].map((s) => (
                        <div key={s.label} className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                          <div className="text-[10px] text-white/35 mb-1">{s.label}</div>
                          <div className="text-sm font-semibold font-mono">{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid sm:grid-cols-2 gap-6 mt-2">

                {/* Bar chart */}
                <div className="border border-white/8 rounded-xl p-5">
                  <div className="text-xs text-white/40 mb-4">Principal vs Interest</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} barSize={36}>
                      <XAxis dataKey="name" tick={{ fill: "#ffffff50", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#ffffff30", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="Principal" stackId="a" radius={[0, 0, 4, 4]}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={0.9} />
                        ))}
                      </Bar>
                      <Bar dataKey="Interest" stackId="a" radius={[4, 4, 0, 0]}>
                        {barData.map((_, i) => (
                          <Cell key={i} fill="#ffffff" fillOpacity={0.1} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie chart */}
                <div className="border border-white/8 rounded-xl p-5">
                  <div className="text-xs text-white/40 mb-1">
                    {winner ? `${winner.label} breakdown` : "Breakdown"}
                  </div>
                  {winner ? (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={76}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend
                            formatter={(value) => <span style={{ color: "#ffffff60", fontSize: 11 }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-around mt-1">
                        <div className="text-center">
                          <div className="text-[10px] text-white/30 mb-0.5">Principal</div>
                          <div className="text-sm font-mono font-semibold">${fmt(winner.principal)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-white/30 mb-0.5">Interest</div>
                          <div className="text-sm font-mono font-semibold text-white/60">${fmt(winner.totalInterest)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-white/30 mb-0.5">Total</div>
                          <div className="text-sm font-mono font-semibold">${fmt(winner.totalPayment)}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-white/20 text-xs">
                      Add a loan to see breakdown
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
