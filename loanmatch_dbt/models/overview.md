{% docs __overview__ %}

## LoanMatch AI — Data Pipeline

Analytics pipeline for [LoanMatch AI](https://loanmatchai.app), a loan matching platform built for gig workers, freelancers, and self-employed professionals that traditional banks overlook.

### What this pipeline does

Transforms raw applicant match results from the LoanMatch scoring engine into business-ready analytics across two layers:

| Layer | Models | Purpose |
|-------|--------|---------|
| **Staging** | `stg_match_results`, `stg_lenders` | Clean, type-cast, and enrich raw source data |
| **Marts** | `mart_lender_performance`, `mart_applicant_funnel` | Business KPIs: lender rankings, applicant conversion by segment |

### Key metrics tracked

- **Lender performance**: which lenders win the most matches and at what quality score
- **Applicant funnel**: match rates by credit band, employment type, and loan purpose
- **Data quality**: 9 automated tests catch nulls, invalid values, and out-of-range scores on every run

### Stack

- **Database**: PostgreSQL on Railway
- **Transformation**: dbt Core 1.11
- **Source tables**: `match_results` (1,135 rows), `lenders` (52 rows)

### Explore

Use the **Project** tab to browse models by layer, or click the blue lineage icon (bottom-right) to see the full dependency graph.

{% enddocs %}
