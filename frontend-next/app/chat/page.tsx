"use client";

import { useState, useRef, useEffect } from "react";
import { track } from "@/lib/track";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Match {
  lender_name: string;
  score: number;
  website?: string;
  breakdown: Record<string, { points: number; note: string }>;
}

interface Profile {
  loan_amount_needed?: number;
  loan_purpose?: string;
  credit_score?: number;
  employment_type?: string;
  annual_income?: number;
  years_at_current_work?: number;
  monthly_debt_payments?: number;
  total_assets?: number;
}

function cleanText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/^\s*\*\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const EXAMPLES = [
  "I'm a freelance designer, 4 years in, earn $65K/year, credit around 700, need $20K for home renovation",
  "Uber driver for 2 years, $38K income, credit 630, need $8K personal loan",
  "Salaried nurse, $80K/yr, excellent credit, want $15K for medical expenses",
];

const PROFILE_LABELS: { key: keyof Profile; label: string; format: (v: unknown) => string }[] = [
  { key: "loan_amount_needed", label: "Loan Amount", format: (v) => `$${Number(v).toLocaleString()}` },
  { key: "loan_purpose", label: "Purpose", format: (v) => String(v).replace(/_/g, " ") },
  { key: "credit_score", label: "Credit Score", format: (v) => String(v) },
  { key: "employment_type", label: "Employment", format: (v) => String(v).replace(/_/g, " ") },
  { key: "annual_income", label: "Annual Income", format: (v) => `$${Number(v).toLocaleString()}` },
  { key: "years_at_current_work", label: "Years at Job", format: (v) => `${v} yrs` },
  { key: "monthly_debt_payments", label: "Monthly Debt", format: (v) => `$${Number(v).toLocaleString()}` },
  { key: "total_assets", label: "Total Assets", format: (v) => `$${Number(v).toLocaleString()}` },
];

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function MatchCard({ match, rank }: { match: Match; rank: number }) {
  const [open, setOpen] = useState(rank === 1);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <span className="text-xs text-white/45 font-mono mr-2">#{rank}</span>
          <span className="text-sm font-semibold">{match.lender_name}</span>
          {match.website && (
            <a href={match.website} target="_blank" rel="noopener noreferrer"
              className="ml-2 text-xs text-[#38bdf8] hover:underline">↗</a>
          )}
        </div>
        <span className={`text-lg font-bold tabular-nums ${scoreColor(match.score)}`}>
          {match.score}<span className="text-xs text-white/45 font-normal">/100</span>
        </span>
      </div>
      <div className="px-4 pb-2">
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <div className={`h-full rounded-full ${match.score >= 70 ? "bg-emerald-400" : match.score >= 50 ? "bg-amber-400" : "bg-red-400"}`}
            style={{ width: `${match.score}%` }} />
        </div>
      </div>
      <button onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 text-left text-xs text-white/45 hover:text-white/65 border-t border-white/6 flex justify-between transition-colors">
        <span>Breakdown</span><span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-white/6 space-y-1.5">
          {Object.entries(match.breakdown).map(([dim, d]) => (
            <div key={dim} className="flex justify-between text-xs">
              <span className="text-white/55 capitalize">{dim.replace(/_/g, " ")}</span>
              <span className="text-white/45 text-right max-w-[60%] leading-snug">
                {d.note} <span className="font-mono text-white/55">{d.points}pt</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [pendingField, setPendingField] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { track("page_view", "/chat"); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, matches]);

  const filledCount = PROFILE_LABELS.filter(({ key }) => profile[key] != null).length;

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    track("chat_message", "/chat");

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          gathered_profile: profile,
          pending_field: pendingField,
        }),
      });

      if (res.status === 429) {
        setMessages((m) => [...m, { role: "assistant", content: "Daily limit reached (50 searches/day). Come back tomorrow." }]);
        return;
      }
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: "Something went wrong. Please try again." }]);
        return;
      }

      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      setProfile(data.profile_extracted ?? {});
      setPendingField(data.pending_field ?? null);

      if (data.ready) {
        setMatches(data.matches ?? []);
        setDone(true);
        track("match_run", "/chat", { lenders_found: data.matches?.length ?? 0, via: "chat" });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Could not reach the server. Check your connection." }]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setProfile({});
    setPendingField(null);
    setMatches([]);
    setDone(false);
    setInput("");
  }

  return (
    <div className="flex h-[calc(100dvh-56px)]">

      {/* ── Left: Chat ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">

          {/* Welcome */}
          {messages.length === 0 && (
            <div className="max-w-xl mx-auto text-center pt-8">
              <div className="w-10 h-10 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#38bdf8] text-lg">✦</span>
              </div>
              <h2 className="text-lg font-semibold mb-2">Tell me your situation</h2>
              <p className="text-sm text-white/80 mb-8 leading-relaxed">
                Describe your income, credit, and what you need the loan for.
                I&apos;ll find your best lender matches.
              </p>
              <div className="space-y-2">
                {EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => send(ex)}
                    className="w-full text-left text-xs text-white/85 px-4 py-3 rounded-xl border border-white/8 hover:border-[#38bdf8]/30 hover:text-white transition-all leading-snug">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => {
            const text = msg.role === "assistant" ? cleanText(msg.content) : msg.content;
            const lines = text.split("\n");
            return (
              <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center shrink-0 mb-0.5">
                    <span className="text-[#38bdf8] text-[10px]">✦</span>
                  </div>
                )}
                <div className={`max-w-[76%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#38bdf8] text-black font-medium rounded-br-none"
                    : "bg-white/[0.04] border border-white/8 text-white/85 rounded-bl-none"
                }`}>
                  {lines.map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < lines.length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {/* Match results inline */}
          {done && matches.length > 0 && (
            <div className="max-w-xl mx-auto w-full mt-4 space-y-3">
              <div className="text-xs text-white/45 uppercase tracking-widest text-center mb-4">
                Your top {matches.length} matches
              </div>
              {matches.map((m, i) => (
                <MatchCard key={m.lender_name} match={m} rank={i + 1} />
              ))}
              <div className="text-center mt-6">
                <button onClick={reset}
                  className="text-xs text-white/45 hover:text-white/75 border border-white/8 rounded-full px-4 py-2 transition-colors">
                  ↺ Start a new search
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!done && (
          <div className="border-t border-white/8 px-4 py-4">
            <div className="max-w-2xl mx-auto flex gap-3 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Describe your situation or answer the question above…"
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#38bdf8]/40 resize-none leading-relaxed"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="px-4 py-3 rounded-xl bg-[#38bdf8] text-black text-sm font-semibold hover:bg-[#7dd3fc] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                Send
              </button>
            </div>
            <p className="text-center text-xs text-white/35 mt-2">Enter to send · Shift+Enter for new line</p>
          </div>
        )}
      </div>

      {/* ── Right: Profile Tracker (desktop only) ── */}
      <div className="hidden lg:flex w-64 border-l border-white/8 flex-col p-5 shrink-0">
        <div className="text-xs text-white/45 uppercase tracking-widest mb-4">Profile collected</div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-white/45 mb-1.5">
            <span>{filledCount} of {PROFILE_LABELS.length} fields</span>
            <span>{Math.round((filledCount / PROFILE_LABELS.length) * 100)}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/8">
            <div className="h-full rounded-full bg-[#38bdf8] transition-all duration-500"
              style={{ width: `${(filledCount / PROFILE_LABELS.length) * 100}%` }} />
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-2 flex-1">
          {PROFILE_LABELS.map(({ key, label, format }) => {
            const val = profile[key];
            const filled = val != null;
            return (
              <div key={key} className={`flex items-center justify-between py-2 border-b border-white/5 text-xs transition-colors ${filled ? "text-white/85" : "text-white/35"}`}>
                <span className="flex items-center gap-2">
                  <span className={filled ? "text-[#38bdf8]" : "text-white/15"}>
                    {filled ? "✓" : "○"}
                  </span>
                  {label}
                </span>
                <span className={`font-mono ${filled ? "text-white/75" : "text-white/15"}`}>
                  {filled ? format(val) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {filledCount === PROFILE_LABELS.length && !done && (
          <div className="mt-4 text-xs text-[#38bdf8] text-center animate-pulse">
            Matching in progress…
          </div>
        )}
      </div>

    </div>
  );
}
