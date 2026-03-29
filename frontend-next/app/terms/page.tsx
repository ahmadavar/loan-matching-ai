import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — LoanMatch AI",
  description: "Terms governing your use of the LoanMatch AI platform.",
};

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-xs text-white/45 mb-12">Last updated: March 29, 2026</p>

      <div className="space-y-10 text-sm text-white/70 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using LoanMatch AI (the &quot;Service&quot;), you agree to be bound by
            these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">2. Description of Service</h2>
          <p>
            LoanMatch AI is an informational platform that helps users explore potential loan
            options based on self-reported financial information. We use an AI-powered matching
            algorithm to surface lender profiles that may be relevant to your situation.
          </p>
          <p className="mt-3">
            LoanMatch AI is <strong className="text-white">not a lender, broker, or financial
            advisor</strong>. We do not originate loans, guarantee approval, or make credit
            decisions. All results are for informational purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">3. No Financial Advice</h2>
          <p>
            Nothing on this platform constitutes financial, legal, or tax advice. Loan terms,
            rates, and eligibility shown are illustrative and subject to change. Always verify
            directly with lenders before making financial decisions. Consult a licensed
            financial advisor for personalized guidance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">4. Eligibility</h2>
          <p>
            You must be at least 18 years old and a resident of the United States to use this
            Service. By using the Service, you represent that you meet these requirements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">5. Accuracy of Information</h2>
          <p>
            You are responsible for the accuracy of information you provide. LoanMatch AI
            relies on self-reported data to generate results. Inaccurate inputs will produce
            inaccurate results. We make no warranties about the completeness or accuracy of
            match results.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">6. Intellectual Property</h2>
          <p>
            All content, design, code, and materials on the Service are owned by LoanMatch AI
            and protected by applicable intellectual property laws. You may not reproduce,
            distribute, or create derivative works without written permission.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">7. Prohibited Uses</h2>
          <p className="mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-1.5 text-white/60">
            <li>Use the Service for any unlawful purpose</li>
            <li>Submit false or misleading information</li>
            <li>Attempt to scrape, reverse-engineer, or automate access to the Service</li>
            <li>Interfere with the operation of the Service or its infrastructure</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
            express or implied. We do not warrant that the Service will be uninterrupted,
            error-free, or that results will be accurate or complete.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, LoanMatch AI shall not be liable for any
            indirect, incidental, special, or consequential damages arising from your use of
            the Service, including any financial decisions made based on information presented
            here.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted on
            this page with an updated date. Continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the United States. Any disputes shall be
            resolved in the applicable jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">12. Contact</h2>
          <p>
            Questions about these Terms? Reach us via the{" "}
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
