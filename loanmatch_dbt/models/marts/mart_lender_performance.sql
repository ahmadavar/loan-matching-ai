-- Which lenders get matched most often and with what quality?
with matches as (
    select * from {{ ref('stg_match_results') }}
),

lenders as (
    select * from {{ ref('stg_lenders') }}
),

lender_stats as (
    select
        top_lender_name                                         as lender_name,
        count(*)                                                        as times_top_match,
        round(cast(avg(top_lender_score) as float64), 1)               as avg_match_score,
        round(cast(min(top_lender_score) as float64), 1)               as min_match_score,
        round(cast(max(top_lender_score) as float64), 1)               as max_match_score,
        countif(top_lender_score >= 80)                                 as high_quality_matches,
        round(
            cast(countif(top_lender_score >= 80) as float64)
            / nullif(count(*), 0) * 100, 1
        )                                                               as pct_high_quality
    from matches
    where top_lender_name is not null
    group by top_lender_name
)

select
    s.*,
    l.loan_size_tier,
    l.credit_score_min,
    l.self_employed_friendly
from lender_stats s
left join lenders l on lower(s.lender_name) = lower(l.lender_name)
order by times_top_match desc
