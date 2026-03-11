import streamlit as st
import requests

API_URL = "http://localhost:8000/api/match"

st.set_page_config(page_title="Loan Matching AI Assistant", layout="centered")

st.title("Loan Matching AI Assistant")
st.caption("Intelligent loan matching for self-employed borrowers, gig workers, and non-traditional income profiles.")

st.divider()

# --- Borrower Form ---
st.subheader("Your Financial Profile")

col1, col2 = st.columns(2)

with col1:
    credit_score = st.number_input("Credit Score", min_value=300, max_value=850, value=680)
    annual_income = st.number_input("Annual Income ($)", min_value=0, value=60000, step=1000)
    employment_type = st.selectbox(
        "Employment Type",
        ["salaried", "self_employed", "gig", "contractor"]
    )
    years_at_current_work = st.number_input("Years at Current Work", min_value=0.0, value=2.0, step=0.5)

with col2:
    loan_amount_needed = st.number_input("Loan Amount Needed ($)", min_value=1000, value=25000, step=1000)
    loan_purpose = st.selectbox("Loan Purpose", [
        "personal",
        "business",
        "home",
        "debt_consolidation",
        "auto",
        "rv",
        "vacation",
        "medical",
        "education",
        "home_improvement",
    ])
    total_assets = st.number_input("Total Assets ($)", min_value=0, value=50000, step=1000)
    monthly_debt_payments = st.number_input("Monthly Debt Payments ($)", min_value=0, value=500, step=100)

income_stable = st.checkbox("Income has been consistent for 2+ years", value=True)

st.divider()

# --- Submit ---
if st.button("Analyze & Match Lenders", type="primary", use_container_width=True):
    payload = {
        "credit_score": credit_score,
        "annual_income": annual_income,
        "employment_type": employment_type,
        "years_at_current_work": years_at_current_work,
        "loan_amount_needed": loan_amount_needed,
        "loan_purpose": loan_purpose,
        "total_assets": total_assets,
        "monthly_debt_payments": monthly_debt_payments,
        "income_stable": income_stable,
    }

    with st.spinner("Analyzing your profile..."):
        try:
            response = requests.post(API_URL, json=payload, timeout=30)

            if response.status_code == 200:
                matches = response.json()

                st.success(f"{len(matches)} lenders matched to your profile.")
                st.divider()

                # Show each lender match
                for i, match in enumerate(matches, 1):
                    with st.expander(f"#{i} {match['lender_name']} — Score: {match['score']}/100", expanded=(i == 1)):
                        st.progress(match["score"] / 100)

                        st.subheader("Score Breakdown")
                        for dimension, detail in match["breakdown"].items():
                            col_a, col_b = st.columns([3, 1])
                            with col_a:
                                st.write(f"**{dimension.replace('_', ' ').title()}** — {detail['note']}")
                            with col_b:
                                st.write(f"`{detail['points']} pts`")

                # Final verdict — one Claude call for top match only
                st.divider()
                st.subheader("Advisor Verdict")
                st.info(matches[0]["explanation"])

            elif response.status_code == 404:
                st.error("No matching lenders found for your profile. Try adjusting your inputs.")
            elif response.status_code == 429:
                st.warning("Daily limit reached (10 searches/day). Please come back tomorrow.")
            else:
                st.error(f"Something went wrong. Please try again. ({response.status_code})")

        except requests.exceptions.ConnectionError:
            st.error("Cannot connect to the API. Make sure the backend is running.")
