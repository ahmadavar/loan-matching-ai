"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/chat", label: "AI Chat" },
  { href: "/match", label: "Get Matched" },
  { href: "/calculator", label: "Loan Calculator" },
  { href: "/lenders", label: "Lenders" },
  { href: "/story", label: "Story" },
  { href: "/contact", label: "Contact" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col justify-center items-center w-8 h-8 gap-1.5"
        aria-label="Toggle menu"
      >
        <span className={`block w-5 h-px bg-white/60 transition-all duration-200 ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
        <span className={`block w-5 h-px bg-white/60 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-px bg-white/60 transition-all duration-200 ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/8 py-2 z-50">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 text-sm text-white/75 hover:text-white hover:bg-white/[0.03] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
