-- How do different applicant segments convert through the matching funnel?
{{ config(materialized='incremental', unique_key='segment_key') }}

with matches as (
    select * from {{ ref('stg_match_results') }}

    {% if is_incremental() %}
        where created_at > (select max(created_at) from {{ this }})
    {% endif %}
),

funnel as (
    select
        credit_band,
        employment_type,
        loan_purpose,
        count(*)                                                        as total_applicants,
        countif(matches_found > 0)                                      as applicants_with_match,
        round(
            cast(countif(matches_found > 0) as float64)
            / nullif(count(*), 0) * 100, 1
        )                                                               as match_rate_pct,
        round(cast(avg(matches_found) as float64), 1)                  as avg_matches_per_applicant,
        round(cast(avg(top_lender_score) as float64), 1)               as avg_top_score,
        round(cast(avg(annual_income) as float64), 0)                  as avg_income,
        round(cast(avg(loan_amount_needed) as float64), 0)             as avg_loan_requested,
        round(cast(avg(dti_ratio) as float64), 1)                      as avg_dti_ratio
    from matches
    group by credit_band, employment_type, loan_purpose
)

select
    concat(credit_band, '_', employment_type, '_', loan_purpose)        as segment_key,
    *
from funnel
order by total_applicants desc
