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

### Current dimensions (rule-based matching)
1. Credit score
2. Income + stability
3. Assets / net worth
4. Employment type + years experience
5. Debt-to-income ratio
6. Loan purpose

### Target dimensions (verified risk profile)

| Dimension | Data Source | What It Proves |
|---|---|---|
| 24-month income history | Plaid (bank deposits) | Income is real and consistent |
| Income trend | Plaid (month-over-month) | Growing vs declining business |
| Expense-to-income ratio | Plaid (bank outflows) | True DTI, not estimated |
| Payment consistency | Plaid (recurring payments) | On-time behavior outside credit bureau |
| Income source diversity | Plaid (deposit sources) | Multiple clients = lower concentration risk |
| Asset ownership | Self-reported + title docs | Collateral and financial cushion |
| Business tenure | Self-reported + verified | Stability of self-employment |
| Platform ratings | Uber/Airbnb/Etsy API | Reputation as a signal of reliability |

### Why banks don't collect this today
- Standard applications are built for W-2 employees — the gig worker is an edge case
- Verification infrastructure (Plaid, open banking) is still maturing
- Lenders lack the incentive to build custom flows for a segment they consider risky

**LoanMatch builds that infrastructure on behalf of the borrower.**

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

### Today (v1)
- 6-dimension rule-based matching
- Synthetic lender data (APR ranges from public disclosures)
- Claude explains match results in plain English
- No bank data, no verification layer

### Near term (v2)
- Plaid integration — real income verification
- Expanded dimensions (income trend, expense ratio, payment consistency)
- "What If" coaching — show borrower what to improve and by how much
- Real APR ranges from scraped public data ✅ (done)

### Target state (v3)
- Full verified risk profile packaged as a structured document
- Lender API integrations that accept enriched profiles
- Borrower sees: "Your verified profile qualifies you for X% — here's why"
- Lender sees: "This borrower's bureau score is 640 but their verified profile
  indicates repayment risk equivalent to a 700 borrower"

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
