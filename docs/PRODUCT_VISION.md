# LoanMatch AI — Product Vision

## The Core Problem

Gig workers, freelancers, and self-employed borrowers are systematically
underserved by traditional lending. Not because they are actually high risk —
but because lenders rely on proxies (credit score, W-2 income, employer
verification) that were designed for salaried employees.

A freelancer earning $120K/year looks riskier on paper than a salaried employee
earning $60K. Same actual repayment ability. Worse proxies.

**LoanMatch's mission: close that gap.**

---

## What We Are Building

A **risk translation layer** between gig workers and lenders.

We collect richer, verifiable data about the borrower than any lender's
standard application asks for. We package that data into a structured,
trustworthy profile. We present that profile to lenders in a way that
demonstrates the borrower is safer than their credit score alone suggests.

The result: lower rates, higher approval odds, fairer access to credit.

```
Borrower provides rich verified data
        ↓
LoanMatch builds structured risk profile
        ↓
Profile sent to lenders with full context
        ↓
Lender sees real risk (lower) → quotes better rate
```

---

## Why This Works

Lenders price risk. They charge higher rates when they're uncertain.
Uncertainty comes from missing or unverifiable information.

**If we reduce uncertainty, we reduce the rate.**

We don't change the borrower's actual risk — we make their actual risk
*visible* to lenders who otherwise couldn't see it.

This is exactly what Upstart did for thin-credit borrowers by adding education
and employment history to credit models. We do it specifically for the gig
economy — a segment Upstart still underserves.

---

## The Data Advantage

### Current dimensions — built and live (9 total, 130 pts)

**Core 6 (100 pts) — eligibility and baseline risk:**
1. Credit score
2. Income + stability
3. Assets / net worth
4. Employment type + years experience
5. Debt-to-income ratio
6. Loan purpose

**Bonus 3 (30 pts) — alternative data for gig workers:**

| # | Dimension | What it proves | Regulatory basis |
|---|---|---|---|
| 7 | Income continuity (months of 1099) | Consistent self-employment over time | Fannie Mae 2-year self-employment guideline |
| 8 | Off-bureau payment behavior | On-time payments invisible to credit bureaus | Experian Boost precedent + CFPB alternative data guidance |
| 9 | Income source diversity | Multiple clients = resilient income, low concentration risk | Business underwriting concentration risk principles |

These 3 bonus dimensions can move a gig worker's estimated APR by 4–7% on real lender rate ranges — entirely from data they already have, before any bank verification.

### Target dimensions — next layer (verified via Plaid)

| Dimension | Data Source | What It Proves |
|---|---|---|
| 24-month income history | Plaid (bank deposits) | Income is real, not self-reported |
| Income trend | Plaid (month-over-month) | Growing vs declining business |
| True expense-to-income ratio | Plaid (bank outflows) | Actual DTI, not estimated |
| Recurring payment consistency | Plaid (recurring debits) | Verifiable on-time behavior |
| Income source count (verified) | Plaid (deposit sources) | Confirmed client diversity |
| Asset ownership | Title document upload + OCR | Verifiable collateral |
| Platform reputation | Uber/Airbnb/Stripe API | Reliability as a signal |

### Why banks don't collect this today
- Standard applications were built for W-2 employees — gig workers are an edge case
- Verification infrastructure (Plaid, open banking) is still maturing
- Lenders lack incentive to build custom flows for a segment they consider risky

**LoanMatch builds that infrastructure on behalf of the borrower.**
When lenders are ready to consume it — or when regulation pushes them there — the data layer is already built.

---

## The Verifiability Principle

Data only reduces risk perception if the lender trusts it.
Self-reported numbers are not enough.

Every dimension we collect must be verifiable:

| Data | Verification method |
|---|---|
| Bank income | Plaid read-only bank connection (borrower consents) |
| Asset ownership | Title document upload + OCR parsing |
| Employment history | Platform API (Uber, Stripe, PayPal) or tax return parsing |
| Identity | Government ID + liveness check |

We act as a **trusted data aggregator** — the lender doesn't have to verify
each piece themselves. They trust LoanMatch the same way they trust a credit
bureau: a third party that has already done the verification work.

This is the long-term moat. Data + trust = pricing power.

---

## Current State vs Target State

### v1 — Done ✅
- 9-dimension scoring engine (6 core + 3 gig bonus dimensions)
- 52 lenders with real APR ranges (6 with live-scraped rates, rest from public disclosures)
- APR estimation: score maps to position within real lender rate range
- Conversational AI interface (5-agent pipeline: extractor → screener → matcher → explainer → advisor)
- Form-based matching UI with expandable score breakdowns
- Loan calculator, lender directory, event tracking, contact form
- Deployed on Railway with Docker + CI + dbt/Airflow analytics pipeline
- D7–D9 bonus dimensions live but inferred (not verified) via enrichment.py

### v2 — Active (shipping now)

**v2a — Lender data upgrade (no external dependency)**
- [ ] Expand live-scraped APR data from 6 → 30+ lenders (all have public rate pages)
- [ ] Apply for Experian Connect API — consumer-permissioned credit data (never applied; do now)
- [ ] Apply for Credible, LendingTree, Bankrate affiliate/API programs (faster approvals than Engine/Upstart)
- [ ] Pre-Match Report: shareable 1-page summary of borrower profile, why they qualify/don't, 3 improvement actions — uses existing advisor agent, no new infrastructure

**v2b — Plaid income verification**
- Replace D7–D9 heuristic inference with verified bank data
- 24-month income history, true DTI, payment consistency — all from Plaid read-only connection
- Borrower connects bank once → LoanMatch builds their verified risk profile
- Same 9 dimensions, same scoring engine — data source upgrades from "told us" to "proved it"
- Plaid sandbox: full development with no real bank accounts, no approval needed
- Show "Verified" badge on match results when Plaid data is used
- Unlocks the verifiability principle in practice, not just theory

**v2c — Real lender feeds (pending approvals)**
- Engine by Even Financial API — applied, awaiting approval
- Upstart affiliate API — applied, awaiting approval
- Experian Connect — apply now
- Credible / LendingTree — apply now
- Clean swap point: only `providers.py` changes when APIs go live

### v3 — Target
- Full verified risk profile packaged as a structured lender-ready document
- Lender API integrations that accept enriched profiles (not just referrals)
- Borrower sees: "Your verified profile qualifies you for X% — here's why"
- Lender sees: "Bureau score 640 but verified profile = 700-equivalent risk"
- Revenue model shifts from lead-gen to profile-as-a-service

---

## The Pitch (v3)

> LoanMatch builds verified income profiles for gig workers that lenders can
> trust — turning invisible borrowers into approvable ones and bringing their
> rates down to reflect their actual risk, not their paper risk.

This is not a loan comparison site.
This is not a lead generation tool.
This is infrastructure for a borrower segment that existing credit systems
were not designed to serve.

---

## Plaid Integration — Next Step

Plaid is the key unlock for v2. It provides:
- Read-only bank connection (borrower consents, we never store credentials)
- 24 months of transaction history
- Income detection and categorization
- Identity verification

Plaid has a free sandbox environment — full development without real bank
accounts. Integration can be built and demonstrated without a single real user.

**Sandbox docs:** plaid.com/docs/sandbox

---

---

## Action Plan — Next 2 Weeks

### Week 1 (no external dependencies — ship all of this)

| Task | Why | Where |
|---|---|---|
| Apply for Experian Connect API | Consumer-permissioned credit data — never applied, do now | developer.experian.com |
| Apply for Credible affiliate API | Faster approval than Engine/Upstart, real rate feed | credible.com/partners |
| Apply for LendingTree affiliate | Same — real rates, high lender volume | lendingtree.com/partners |
| Apply for Bankrate rate feed | Rate data for APR credibility | bankrate.com/advertise |
| Expand scraped rates 6 → 30 lenders | All 52 lenders have public rate pages — credibility upgrade | `data/scraped/rates.json` |
| Build Pre-Match Report UI | Shareable artifact, uses existing advisor agent output | new `/report` page |
| Start Plaid sandbox integration | No approval needed — full dev in sandbox | `plaid.com/docs/sandbox` |

### Week 2

| Task | Why |
|---|---|
| Plaid Link on `/match` page | "Verify income for better matches" — optional, not required |
| Replace D7–D9 inference with Plaid data | Real bank data → verified badge on results |
| Polish Pre-Match Report | Screenshot-worthy, shareable |
| LinkedIn Post 1 | Bank verification milestone |

### What to skip (permanently deprioritized)

- Negotiation coaching — requires real lender relationships at scale
- Automated application submission — requires deep lender API integrations
- A/B testing framework — no traffic volume to make it meaningful
- Experian credit pull — consumer-permissioned (Experian Connect) is better and faster

---

## LinkedIn Content Plan

### Post 1 — End of Week 1 (Plaid milestone)

> Added bank verification to LoanMatch AI via Plaid.
>
> Instead of asking "how much do you make?" — you connect your bank and we see 24 months of real deposits, income trends, and payment behavior.
>
> For a gig worker, that's the difference between "irregular income, high risk" and "consistent deposits, 3 clients, 90% on-time payments."
>
> Same person. Very different picture.
>
> [screenshot of verified match result with badge]

### Post 2 — End of Week 2 (Pre-Match Report)

> Built a Pre-Match Report — a one-page breakdown of your borrower profile before you apply anywhere.
>
> It shows: your credit tier, income tier, DTI, why you qualify or don't for each loan category, and 3 specific things you can do to improve your rate.
>
> Here's what mine looks like. [screenshot]
>
> The goal: stop applying blind, start applying with a plan.

### Post 3 — When Engine/Upstart approvals land

> LoanMatch AI now has real-time pre-qualified offers from [X] lenders.
>
> Not estimated rates. Actual pre-qualification — with a soft pull, no credit impact.
>
> [demo video or screenshot]

---

## Notes

- This vision holds even if lenders don't use our enriched profile today.
  Building the data collection and verification infrastructure now positions
  us for the moment lenders are ready — or creates the leverage to push
  them there.
- The gig economy is 59 million Americans (36% of US workforce as of 2024).
  This is not a niche.
- Regulatory tailwind: CFPB open banking rules (1033) require banks to share
  consumer financial data on request by 2026 — Plaid becomes a right, not
  a privilege.
