with source as (
    select * from {{ source('loanmatch', 'lenders') }}
),

cleaned as (
    select
        id                                          as lender_id,
        name                                        as lender_name,
        website,
        credit_score_min,
        credit_score_preferred,
        min_annual_income,
        loan_amount_min,
        loan_amount_max,
        self_employed_friendly,

        -- derived: loan amount range label
        case
            when loan_amount_max <= 10000  then 'micro'
            when loan_amount_max <= 50000  then 'small'
            when loan_amount_max <= 100000 then 'medium'
            else 'large'
        end                                         as loan_size_tier

    from source
)

select * from cleaned
