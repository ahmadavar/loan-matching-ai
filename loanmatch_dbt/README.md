# LoanMatch AI — dbt Analytics Layer

Transforms raw applicant match events from BigQuery into business-ready analytics tables.

## Models

**Staging** (views — always fresh):
- `stg_match_results` — cleaned match data with derived DTI ratio and credit band
- `stg_lenders` — lender reference with loan size tier classification

**Marts** (tables — optimized for dashboard queries):
- `mart_applicant_funnel` — match conversion rates by credit band × employment type × loan purpose
- `mart_lender_performance` — lender ranking by volume, average score, and quality rate

## Data Tests

- Primary key uniqueness and null checks on all models
- Credit score range validation (300–850)
- Accepted values on `employment_type` and `loan_purpose`

## Running

```bash
dbt run          # build all models
dbt test         # run data quality tests
dbt docs generate && dbt docs serve  # view lineage graph
```

Published docs: [ahmadavar.github.io/loan-matching-ai](https://ahmadavar.github.io/loan-matching-ai/)
