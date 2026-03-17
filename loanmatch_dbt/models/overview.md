{% docs __overview__ %}

## LoanMatch AI — Data Pipeline

Analytics pipeline for [LoanMatch AI](https://loanmatchai.app), a loan matching platform built for gig workers, freelancers, and self-employed professionals that traditional banks overlook.

---

## Why dbt?

The LoanMatch scoring engine writes raw match results directly to PostgreSQL — messy, inconsistent, with no guarantees on data quality. Business questions like *"which lenders perform best?"* or *"which applicant profiles convert?"* can't be answered from raw data directly.

dbt sits between raw data and answers. It handles transformation, testing, documentation, and dependency ordering — so every model downstream can trust what it receives.

**Without dbt:** write SQL views manually, no tests, no docs, no guaranteed order of execution.
**With dbt:** tested, documented, dependency-aware pipeline that fails loudly when data breaks.

---

## How to explore this project

**Lineage graph** — click the blue icon in the bottom-right corner. This shows the full dependency graph: raw PostgreSQL tables on the left, business-ready marts on the right. dbt enforces this order automatically — if staging breaks, marts never run.

**Project tab** — browse models organized by layer (staging → marts).

**Database tab** — explore models as they exist in PostgreSQL, grouped by schema.

---

## Pipeline architecture

```
PostgreSQL (Railway)
  ├── match_results (1,135 rows)  ──►  stg_match_results  ──►  mart_lender_performance
  └── lenders (52 rows)           ──►  stg_lenders         ──►  mart_applicant_funnel
```

| Layer | Models | What it does |
|-------|--------|--------------|
| **Staging** | `stg_match_results`, `stg_lenders` | Cleans raw data: lowercases strings, casts types, computes derived fields (DTI ratio, credit band, loan size tier). No business logic — just trust. |
| **Marts** | `mart_lender_performance`, `mart_applicant_funnel` | Answers business questions. Each mart has one job. |

---

## Key design decisions

### Staging layer is business-logic-free
Staging cleans and standardizes only. It never answers business questions — that's the mart's job. This separation means: if a business question changes, only the mart changes. The staging layer stays stable.

### mart_applicant_funnel is incremental
```sql
{% raw %}
{% if is_incremental() %}
  WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}
{% endraw %}
```
On the first run, dbt processes all rows. On every subsequent run, it only processes rows newer than the last run. At scale with millions of rows, this is the difference between a 5-second run and a 5-minute run.

### Tests run on every execution
9 automated tests validate the data on every dbt run:
- `unique` and `not_null` on all primary keys
- `accepted_values` on `employment_type` and `loan_purpose`
- Custom `between_values` test ensuring `credit_score` stays between 300–850

When tests first ran, they caught 3 real data issues: a missing `contractor` employment type, a missing `home_improvement` loan purpose, and 36 rows with null match scores (legitimate — applicants with zero matches). Tests caught these before any downstream report showed bad numbers.

### dbt compiles to plain SQL
dbt is not magic. Every model compiles to a SQL query that runs directly against PostgreSQL. Click any model → **Compiled** tab to see exactly what runs. This means every transformation is readable, debuggable, and optimizable like any SQL query.

---

## Business metrics produced

**mart_lender_performance**
- Which lenders are top-matched most often
- Average, min, and max match score per lender
- % of high-quality matches (score ≥ 80) per lender

**mart_applicant_funnel**
- Match rate by credit band × employment type × loan purpose
- Average matches per applicant by segment
- Average DTI ratio and loan amount requested by segment

---

## Stack

- **Database**: PostgreSQL on Railway
- **Transformation**: dbt Core 1.11
- **Language**: SQL + Jinja2 templating
- **Tests**: 9 automated data quality tests
- **CI**: models run on-demand; incremental mart processes only new rows

{% enddocs %}
