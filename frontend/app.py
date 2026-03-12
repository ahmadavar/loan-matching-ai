import streamlit as st
import requests

import os
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
MATCH_URL = f"{API_BASE}/api/match"
CHAT_URL  = f"{API_BASE}/api/chat"

st.set_page_config(
    page_title="LoanMatch AI",
    page_icon="🏦",
    layout="centered",
    initial_sidebar_state="expanded",
)

# ─── Custom CSS ───────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .match-card {
        background: #f8f9fa;
        border-left: 4px solid #1f77b4;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 10px;
    }
    .match-card h4 { margin: 0 0 4px 0; color: #1f2937; }
    .score-badge {
        display: inline-block;
        background: #1f77b4;
        color: white;
        border-radius: 12px;
        padding: 2px 10px;
        font-size: 13px;
        font-weight: bold;
    }
    .score-badge.high { background: #16a34a; }
    .score-badge.mid  { background: #d97706; }
    .score-badge.low  { background: #dc2626; }
    .dim-row { font-size: 13px; color: #4b5563; padding: 2px 0; }
    .disclaimer { font-size: 11px; color: #9ca3af; margin-top: 8px; }
</style>
""", unsafe_allow_html=True)


# ─── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🏦 LoanMatch AI")
    st.markdown("*AI-powered loan matching for everyone — salaried, self-employed, gig workers, and beyond.*")
    st.divider()

    st.markdown("### How it works")
    st.markdown("""
1. **Describe your situation** in plain English (Chat tab)
   *or* fill in the form for a detailed breakdown
2. **AI extracts** your financial profile automatically
3. **6-dimension matching** scores you against 36+ lenders
4. **Get ranked results** with honest explanations
""")
    st.divider()

    st.markdown("### What we check")
    st.markdown("""
- Credit score fit
- Income vs. lender minimums
- Debt-to-income ratio
- Employment type acceptance
- Asset backing
- Loan purpose match
""")
    st.divider()

    # Live profile tracker — updates as user answers questions
    if "gathered_profile" in st.session_state and st.session_state.gathered_profile:
        st.divider()
        st.markdown("### 📋 Profile so far")
        p = st.session_state.gathered_profile
        fields = {
            "💰 Loan Amount":    f"${p['loan_amount_needed']:,.0f}"  if p.get("loan_amount_needed")    else "—",
            "🎯 Purpose":        p.get("loan_purpose", "—"),
            "⭐ Credit Score":   str(p["credit_score"])              if p.get("credit_score")          else "—",
            "💼 Employment":     p.get("employment_type", "—"),
            "📈 Annual Income":  f"${p['annual_income']:,.0f}"       if p.get("annual_income")          else "—",
            "📅 Years at Job":   str(p["years_at_current_work"])     if p.get("years_at_current_work")  else "—",
            "💳 Monthly Debt":   f"${p['monthly_debt_payments']:,.0f}" if p.get("monthly_debt_payments") is not None else "—",
            "🏦 Total Assets":   f"${p['total_assets']:,.0f}"        if p.get("total_assets") is not None else "—",
        }
        for label, val in fields.items():
            color = "#16a34a" if val != "—" else "#9ca3af"
            st.markdown(f'<div style="font-size:13px;padding:2px 0"><span style="color:{color}">{"✓" if val != "—" else "○"}</span> {label}: <b>{val}</b></div>', unsafe_allow_html=True)

    st.divider()
    st.markdown('<p class="disclaimer">⚠️ For informational purposes only. Not financial advice.</p>', unsafe_allow_html=True)
    st.markdown('<p class="disclaimer">Built by Ahmad Avar</p>', unsafe_allow_html=True)


# ─── Helper: render match cards ───────────────────────────────────────────────
def render_match_cards(matches: list):
    if not matches:
        return

    st.markdown("---")
    st.markdown(f"### Your Top {len(matches)} Lender Matches")

    for i, m in enumerate(matches, 1):
        score = m["score"]
        badge_class = "high" if score >= 70 else ("mid" if score >= 50 else "low")
        label = "Best Match" if i == 1 else (f"#{i}")

        with st.container():
            col_title, col_badge = st.columns([4, 1])
            with col_title:
                st.markdown(f"**{i}. {m['lender_name']}**")
            with col_badge:
                st.markdown(f'<span class="score-badge {badge_class}">{score}/100</span>', unsafe_allow_html=True)

            st.progress(score / 100)

            with st.expander("Score breakdown + details"):
                for dim, detail in m.get("breakdown", {}).items():
                    pts = detail["points"]
                    note = detail["note"]
                    icon = "✅" if pts >= 15 else ("⚠️" if pts >= 5 else "❌")
                    st.markdown(f'<div class="dim-row">{icon} <b>{dim.replace("_", " ").title()}</b>: {note} &nbsp; <code>{pts} pts</code></div>', unsafe_allow_html=True)

                if m.get("website"):
                    st.markdown(f"[Visit {m['lender_name']} →]({m['website']})", unsafe_allow_html=False)

            st.markdown("")


# ─── Tabs ─────────────────────────────────────────────────────────────────────
st.markdown("# 🏦 LoanMatch AI")
st.caption("Find your best loan options in seconds — no credit pull, no signup required.")

tab1, tab2 = st.tabs(["💬 Chat", "📋 Detailed Form"])


# ─── TAB 1: CHAT ──────────────────────────────────────────────────────────────
with tab1:
    st.markdown("**Just describe your situation** — income, credit, what you need the loan for. That's it.")

    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "chat_matches" not in st.session_state:
        st.session_state.chat_matches = []
    if "gathered_profile" not in st.session_state:
        st.session_state.gathered_profile = {}
    if "chat_done" not in st.session_state:
        st.session_state.chat_done = False
    if "pending_field" not in st.session_state:
        st.session_state.pending_field = None

    # Example prompts — only when conversation hasn't started
    if not st.session_state.messages:
        st.markdown("**Try one of these to get started:**")
        examples = [
            "I'm a freelance designer, 3 years in, earn $60K/year, credit around 700, need $25K for home renovation",
            "Uber driver for 2 years, $35K income, credit 620, need $8K personal loan",
            "Salaried nurse, $75K/yr, excellent credit, want $15K for medical expenses",
        ]
        for ex in examples:
            if st.button(ex, key=ex, use_container_width=True):
                st.session_state._prefill = ex
                st.rerun()

    # Display chat history (clean — no expanders inside messages)
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # Show match cards inline after conversation finishes
    if st.session_state.chat_done and st.session_state.chat_matches:
        render_match_cards(st.session_state.chat_matches)
        if st.button("🔄 Start a new search", key="reset_chat"):
            st.session_state.messages = []
            st.session_state.chat_matches = []
            st.session_state.gathered_profile = {}
            st.session_state.chat_done = False
            st.session_state.pending_field = None
            st.rerun()

    # Handle prefill from example buttons
    prefill = st.session_state.pop("_prefill", None)

    # Chat input — Streamlit pins this to bottom of page automatically
    if not st.session_state.chat_done:
        user_input = st.chat_input("Describe your situation or answer the question above...")
    else:
        user_input = None

    if user_input or prefill:
        message = user_input or prefill

        st.session_state.messages.append({"role": "user", "content": message})
        with st.chat_message("user"):
            st.markdown(message)

        with st.chat_message("assistant"):
            with st.spinner("..."):
                try:
                    response = requests.post(CHAT_URL, json={
                        "message": message,
                        "gathered_profile": st.session_state.gathered_profile,
                        "pending_field": st.session_state.pending_field,
                    }, timeout=30)

                    if response.status_code == 200:
                        data = response.json()
                        reply = data["reply"]
                        profile = data["profile_extracted"]
                        matches = data.get("matches", [])
                        ready = data.get("ready", False)

                        st.markdown(reply)
                        st.session_state.messages.append({"role": "assistant", "content": reply})
                        st.session_state.gathered_profile = profile
                        st.session_state.pending_field = data.get("pending_field")

                        if ready:
                            st.session_state.chat_matches = matches
                            st.session_state.chat_done = True
                            st.rerun()

                    elif response.status_code == 429:
                        st.warning("Daily limit reached (50 searches/day). Come back tomorrow.")
                    elif response.status_code == 422:
                        st.error("Couldn't understand that. Try rephrasing.")
                    else:
                        st.error("Something went wrong. Please try again.")

                except requests.exceptions.ConnectionError:
                    st.error("Backend is offline.")


# ─── TAB 2: DETAILED FORM ─────────────────────────────────────────────────────
with tab2:
    st.markdown("Fill in your details for a full breakdown with dimension-by-dimension scoring.")

    col1, col2 = st.columns(2)

    with col1:
        credit_score = st.number_input("Credit Score", min_value=300, max_value=850, value=680)
        annual_income = st.number_input("Annual Income ($)", min_value=0, value=60000, step=1000)
        employment_type = st.selectbox("Employment Type", ["salaried", "self_employed", "gig", "contractor"])
        years_at_current_work = st.number_input("Years at Current Job", min_value=0.0, value=2.0, step=0.5)

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

    if st.button("Find My Lenders", type="primary", use_container_width=True):
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

        with st.spinner("Matching you against 36 lenders..."):
            try:
                response = requests.post(MATCH_URL, json=payload, timeout=30)

                if response.status_code == 200:
                    matches = response.json()
                    st.success(f"Found {len(matches)} lenders matching your profile.")

                    if matches:
                        st.info(matches[0]["explanation"])

                    form_matches = [
                        {"lender_name": m["lender_name"], "score": m["score"],
                         "website": "", "breakdown": m["breakdown"]}
                        for m in matches
                    ]
                    render_match_cards(form_matches)

                elif response.status_code == 404:
                    st.error("No matching lenders found. Try adjusting your credit score, income, or loan amount.")
                elif response.status_code == 429:
                    st.warning("Daily limit reached (10 searches/day). Come back tomorrow.")
                elif response.status_code == 503:
                    st.error("Lender database is empty. Contact support.")
                else:
                    st.error(f"Something went wrong. ({response.status_code})")

            except requests.exceptions.ConnectionError:
                st.error("Backend is offline. Make sure the API server is running.")
