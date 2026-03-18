with source as (
    select * from {{ source('loanmatch', 'match_results') }}
),

cleaned as (
    select
        id                                          as match_id,
        created_at,
        credit_score,
        annual_income,
        lower(trim(employment_type))                as employment_type,
        lower(trim(loan_purpose))                   as loan_purpose,
        loan_amount_needed,
        monthly_debt_payments,
        total_assets,
        years_at_current_work,
        income_stable,
        lenders_evaluated,
        matches_found,
        top_lender_name,
        top_lender_score,
        advisor_fired,

        -- derived: debt-to-income ratio
        round(
            cast(monthly_debt_payments * 12 / nullif(annual_income, 0) * 100 as numeric),
            2
        )                                           as dti_ratio,

        -- derived: credit band
        case
            when credit_score >= 750 then 'excellent'
            when credit_score >= 700 then 'good'
            when credit_score >= 650 then 'fair'
            else 'poor'
        end                                         as credit_band

    from source
    where credit_score is not null
      and annual_income is not null
)

select * from cleaned
