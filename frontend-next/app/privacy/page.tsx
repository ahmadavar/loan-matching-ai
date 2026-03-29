import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — LoanMatch AI",
  description: "How LoanMatch AI collects, uses, and protects your information.",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-xs text-white/45 mb-12">Last updated: March 29, 2026</p>

      <div className="space-y-10 text-sm text-white/70 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-white mb-3">1. Overview</h2>
          <p>
            LoanMatch AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the website at loanmatch.ai (the &quot;Service&quot;). This
            Privacy Policy explains what information we collect, how we use it, and your rights
            regarding that information. By using the Service, you agree to this policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">2. Information We Collect</h2>
          <p className="mb-3">
            We collect only the information you voluntarily provide when using our matching tools:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-white/60">
            <li>Loan amount requested</li>
            <li>Self-reported credit score range</li>
            <li>Employment type (gig worker, freelancer, self-employed, etc.)</li>
            <li>Annual income (self-reported)</li>
            <li>Loan purpose</li>
            <li>Any information you share in the AI chat</li>
          </ul>
          <p className="mt-3">
            We do <strong className="text-white">not</strong> collect your name, Social Security
            number, date of birth, or any information required to pull a credit report. We do{" "}
            <strong className="text-white">not</strong> perform hard or soft credit inquiries.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1.5 text-white/60">
            <li>To generate loan match results and AI-powered recommendations</li>
            <li>To improve the accuracy of our matching algorithm</li>
            <li>To understand aggregate usage patterns (anonymized)</li>
          </ul>
          <p className="mt-3">
            We do not sell, rent, or trade your personal information to third parties for
            marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">4. Third-Party Services</h2>
          <p className="mb-3">
            Our AI chat feature is powered by Anthropic&apos;s Claude API. Information you share in
            the chat may be processed by Anthropic in accordance with their{" "}
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38bdf8] hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
          <p>
            Our platform is hosted on Railway. Usage data and server logs are subject to
            Railway&apos;s privacy practices.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">5. Cookies and Analytics</h2>
          <p>
            We may use cookies or similar technologies for basic session management and
            anonymous usage analytics. We do not use advertising cookies or third-party
            tracking pixels.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">6. Data Retention</h2>
          <p>
            Session data is not persistently stored beyond your active session unless you
            explicitly save or submit a form. We do not maintain user accounts or long-term
            profiles.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">7. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed at individuals under the age of 18. We do not knowingly
            collect information from minors.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this
            page with an updated date. Continued use of the Service after changes constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">9. Contact</h2>
          <p>
            Questions about this policy? Reach us via the{" "}
            <a href="/contact" className="text-[#38bdf8] hover:underline">
              contact page
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  );
}
