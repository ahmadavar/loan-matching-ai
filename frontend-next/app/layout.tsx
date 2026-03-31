import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoanMatch AI — Smart Lending for Everyone",
  description:
    "AI-powered loan matching for gig workers, freelancers, and self-employed professionals. Find your best loan options in seconds.",
  metadataBase: new URL("https://www.loanmatchai.app"),
  openGraph: {
    title: "LoanMatch AI — Smart Lending for Everyone",
    description:
      "AI-powered loan matching for gig workers, freelancers, and self-employed professionals. Find your best loan options in seconds.",
    url: "https://www.loanmatchai.app",
    siteName: "LoanMatch AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoanMatch AI — Smart Lending for Everyone",
    description:
      "AI-powered loan matching for gig workers, freelancers, and self-employed professionals. Find your best loan options in seconds.",
  },
  alternates: {
    canonical: "https://www.loanmatchai.app",
  },
  verification: {
    google: "1yl8W5L0xyOcBkTLD6ZGroMuB-ALG9r1bFoWpe1nw4s",
  },
  other: {
    "fo-verify": "28d92d70-4f44-4009-80b3-0c617dcd78d3",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}>
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-black/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="LoanMatch AI"
                width={28}
                height={28}
                className="rounded-sm"
              />
              <span className="text-sm font-semibold tracking-tight">LoanMatch AI</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/chat" className="text-xs text-white/85 hover:text-white transition-colors">
                AI Chat
              </Link>
              <Link href="/calculator" className="text-xs text-white/85 hover:text-white transition-colors">
                Loan Calculator
              </Link>
              <Link href="/lenders" className="text-xs text-white/85 hover:text-white transition-colors">
                Lenders
              </Link>
              <Link href="/story" className="text-xs text-white/85 hover:text-white transition-colors">
                Story
              </Link>
              <Link href="/contact" className="text-xs text-white/85 hover:text-white transition-colors">
                Contact
              </Link>
              <Link
                href="/match"
                className="text-xs px-3 py-1.5 rounded bg-[#38bdf8] text-black font-medium hover:bg-[#7dd3fc] transition-colors"
              >
                Get Matched
              </Link>
            </div>

            {/* Mobile: CTA + hamburger */}
            <div className="flex md:hidden items-center gap-3">
              <Link
                href="/match"
                className="text-xs px-3 py-1.5 rounded bg-[#38bdf8] text-black font-medium hover:bg-[#7dd3fc] transition-colors"
              >
                Get Matched
              </Link>
              <MobileNav />
            </div>
          </div>
        </nav>

        {/* Page content — padded below fixed nav */}
        <main className="pt-14">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/8 mt-24">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="LoanMatch AI" width={20} height={20} className="rounded-sm opacity-60" />
              <span className="text-xs text-white/45">LoanMatch AI</span>
            </div>
            <p className="text-xs text-white/40 text-center">
              For informational purposes only. Not financial advice.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
