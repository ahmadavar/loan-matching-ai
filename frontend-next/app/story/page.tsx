export default function StoryPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24">

      {/* Header */}
      <div className="mb-16">
        <div className="text-xs text-white/45 uppercase tracking-widest mb-4">The story</div>
        <h1 className="text-4xl font-bold tracking-tight leading-[1.15] mb-6">
          Why I Built This
        </h1>
        <p className="text-white/55 text-base leading-relaxed">
          A broken lending system, a pattern I kept seeing from the inside, and a question I couldn&apos;t stop asking.
        </p>
      </div>

      {/* Body */}
      <div className="prose-story space-y-8 text-[15px] leading-[1.85] text-white/80 font-light">

        <p>
          I&apos;ve worn a lot of hats.
        </p>

        <p>
          W-2 employee. Freelancer. 1099 contractor. Gig worker. Each phase taught me something
          different about money — but one thing stayed consistent no matter which hat I had on:
          the moment I needed to borrow, the system treated me like a risk instead of a person.
        </p>

        <p>
          Not because my finances were bad. Because they didn&apos;t fit a box.
        </p>

        <hr className="border-white/8 my-10" />

        <p>
          The traditional loan matching process hasn&apos;t changed much in decades. You submit
          your credit score and a pay stub. An algorithm runs. You get a rate — or a rejection.
          No one asks how long you&apos;ve been in your field, whether your income has grown year
          over year, how consistently you pay your recurring bills, or whether you have assets
          that could absorb a rough month.
        </p>

        <p>
          A nurse working three per diem shifts a week has no &ldquo;employer.&rdquo; An Uber
          driver with four years of consistent $50K earnings has no W-2. A freelance developer
          billing $120K a year shows &ldquo;self-employment income&rdquo; — which triggers risk
          flags designed for someone with no steady work at all.
        </p>

        <p>
          The irony is that these borrowers are often <em className="text-white/90 not-italic font-normal">less</em> risky
          than they appear on paper. They&apos;ve built income resilience the hard way. They
          understand cash flow in a way most salaried employees never have to. They&apos;ve
          survived the gaps, managed the taxes, and kept paying their bills anyway.
        </p>

        <p>
          But the matching system never sees that.
        </p>

        <hr className="border-white/8 my-10" />

        <p>
          What frustrated me most wasn&apos;t rejection — it was the randomness of it. Two people
          with nearly identical financial health could walk away with rates that differed by three
          or four percentage points, simply because one had a traditional employment setup and the
          other didn&apos;t. Over a five-year loan, that&apos;s thousands of dollars. Not because
          of actual risk. Because of surface-level pattern matching.
        </p>

        <p>
          Banks aren&apos;t villains in this story. They&apos;re optimizing for what they can
          measure quickly. The problem is that &ldquo;quick to measure&rdquo; and &ldquo;actually
          predictive&rdquo; are not the same thing — and the gap between them is paid for entirely
          by the borrower.
        </p>

        <hr className="border-white/8 my-10" />

        <p>
          I built LoanMatch AI because I wanted to see what matching looked like when you took
          the full picture seriously.
        </p>

        <p>
          Not just credit score and salary — but income stability, employment type,
          debt-to-income ratio, assets, loan purpose, and the consistency of financial behavior
          over time. Six dimensions instead of two. Context instead of categories.
        </p>

        <p>
          The goal isn&apos;t to approve everyone. It&apos;s to make sure the people who{" "}
          <em className="text-white/90 not-italic font-normal">should</em> be approved aren&apos;t
          being turned away because the system wasn&apos;t built with them in mind — and that the
          ones who are approved aren&apos;t paying a penalty for the way they earn.
        </p>

        <p>
          A fairer match is better for borrowers. But it&apos;s also better for lenders — lower
          default risk, longer customer relationships, more stable returns. The current system
          leaves money on the table for everyone.
        </p>

        <p>
          This is my attempt to fix a small part of that.
        </p>

        {/* Signature */}
        <div className="pt-8 border-t border-white/8">
          <p className="text-white/55 text-sm">— Ahmad</p>
        </div>

      </div>
    </div>
  );
}
