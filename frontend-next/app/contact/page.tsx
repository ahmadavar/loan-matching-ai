"use client";

import { useState, useEffect } from "react";
import { track } from "@/lib/track";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.loanmatchai.app";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    track("page_view", "/contact");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Something went wrong");
      }

      track("contact_submitted", "/contact");
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-24">
      {/* Header */}
      <div className="mb-12">
        <div className="text-xs text-white/65 uppercase tracking-widest mb-4">Get in touch</div>
        <h1 className="text-4xl font-bold tracking-tight leading-[1.15] mb-4">Contact Us</h1>
        <p className="text-white/80 text-base leading-relaxed">
          Questions, partnerships, or feedback — we read everything.
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-lg border border-[#38bdf8]/30 bg-[#38bdf8]/5 px-6 py-8 text-center">
          <div className="text-2xl mb-2">✓</div>
          <p className="text-white/90 font-medium">Message received</p>
          <p className="text-white/55 text-sm mt-1">We&apos;ll get back to you shortly.</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-6 text-xs text-[#38bdf8] hover:text-[#7dd3fc] transition-colors"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-white/80 mb-1.5 uppercase tracking-wide">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              className="w-full bg-white/[0.04] border border-white/10 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full bg-white/[0.04] border border-white/10 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1.5 uppercase tracking-wide">Message</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="What's on your mind?"
              className="w-full bg-white/[0.04] border border-white/10 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#38bdf8]/50 transition-colors resize-none"
            />
          </div>

          {status === "error" && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-2.5 rounded bg-[#38bdf8] text-black text-sm font-medium hover:bg-[#7dd3fc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "sending" ? "Sending…" : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}
