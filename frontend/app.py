import streamlit as st
import requests

MATCH_URL = "http://localhost:8000/api/match"
CHAT_URL = "http://localhost:8000/api/chat"

st.set_page_config(page_title="Loan Matching AI Assistant", layout="centered")

st.title("Loan Matching AI Assistant")
st.caption("Intelligent loan matching for self-employed borrowers, gig workers, and non-traditional income profiles.")

st.divider()

tab1, tab2 = st.tabs(["Chat with AI", "Detailed Form"])


# ─── TAB 1: CHAT ─────────────────────────────────────────────────────────────
with tab1:
    st.subheader("Describe your situation")
    st.write("Tell us about yourself in plain English and we'll find your best lenders.")

    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # Chat input
    user_input = st.chat_input("e.g. I'm a freelance designer, 3 years in, earn $60K, credit around 700, need $25K for home renovation")

    if user_input:
        # Show user message
        st.session_state.messages.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.markdown(user_input)

        # Call chat API
        with st.chat_message("assistant"):
            with st.spinner("Analyzing..."):
                try:
                    response = requests.post(CHAT_URL, json={"message": user_input}, timeout=30)

                    if response.status_code == 200:
                        data = response.json()
                        reply = data["reply"]
                        profile = data["profile_extracted"]

                        st.markdown(reply)
                        st.session_state.messages.append({"role": "assistant", "content": reply})

                        # Show extracted profile in expander
                        with st.expander("Profile extracted from your message"):
                            col1, col2 = st.columns(2)
                            with col1:
                                st.write(f"**Credit Score:** {profile.get('credit_score')}")
                                st.write(f"**Annual Income:** ${profile.get('annual_income'):,.0f}")
                                st.write(f"**Employment:** {profile.get('employment_type')}")
                                st.write(f"**Years Experience:** {profile.get('years_at_current_work')}")
                            with col2:
                                st.write(f"**Loan Amount:** ${profile.get('loan_amount_needed'):,.0f}")
                                st.write(f"**Loan Purpose:** {profile.get('loan_purpose')}")
                                st.write(f"**Total Assets:** ${profile.get('total_assets'):,.0f}")
                                st.write(f"**Monthly Debt:** ${profile.get('monthly_debt_payments'):,.0f}")

                    elif response.status_code == 429:
                        st.warning("Daily limit reached (10 searches/day). Please come back tomorrow.")
                    elif response.status_code == 422:
                        st.error("Could not understand your message. Try including your credit score, income, and what you need the loan for.")
                    else:
                        st.error("Something went wrong. Please try again.")

                except requests.exceptions.ConnectionError:
                    st.error("Cannot connect to the API. Make sure the backend is running.")


# ─── TAB 2: DETAILED FORM ────────────────────────────────────────────────────
with tab2:
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
            "personal", "business", "home", "debt_consolidation",
            "auto", "rv", "vacation", "medical", "education", "home_improvement",
        ])
        total_assets = st.number_input("Total Assets ($)", min_value=0, value=50000, step=1000)
        monthly_debt_payments = st.number_input("Monthly Debt Payments ($)", min_value=0, value=500, step=100)

    income_stable = st.checkbox("Income has been consistent for 2+ years", value=True)

    st.divider()

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
                response = requests.post(MATCH_URL, json=payload, timeout=30)

                if response.status_code == 200:
                    matches = response.json()
                    st.success(f"{len(matches)} lenders matched to your profile.")
                    st.divider()

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

                    st.divider()
                    st.subheader("Advisor Verdict")
                    st.info(matches[0]["explanation"])

                elif response.status_code == 404:
                    st.error("No matching lenders found. Try adjusting your inputs.")
                elif response.status_code == 429:
                    st.warning("Daily limit reached (10 searches/day). Please come back tomorrow.")
                else:
                    st.error(f"Something went wrong. ({response.status_code})")

            except requests.exceptions.ConnectionError:
                st.error("Cannot connect to the API. Make sure the backend is running.")
