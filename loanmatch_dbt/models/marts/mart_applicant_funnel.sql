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
        count(*)                                                    as total_applicants,
        count(*) filter (where matches_found > 0)                   as applicants_with_match,
        round(
            count(*) filter (where matches_found > 0)::numeric
            / nullif(count(*), 0) * 100, 1
        )                                                           as match_rate_pct,
        round(avg(matches_found)::numeric, 1)                       as avg_matches_per_applicant,
        round(avg(top_lender_score)::numeric, 1)                    as avg_top_score,
        round(avg(annual_income)::numeric, 0)                       as avg_income,
        round(avg(loan_amount_needed)::numeric, 0)                  as avg_loan_requested,
        round(avg(dti_ratio)::numeric, 1)                           as avg_dti_ratio
    from matches
    group by credit_band, employment_type, loan_purpose
)

select
    credit_band || '_' || employment_type || '_' || loan_purpose    as segment_key,
    *
from funnel
order by total_applicants desc
