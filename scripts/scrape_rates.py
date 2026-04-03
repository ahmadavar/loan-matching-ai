"""
Bite 1: Scrape real APR data from public lender rate pages.
Outputs scraped_lenders.json in the same directory as this script.

Run: python scripts/scrape_rates.py

Dependencies (not in app requirements — only needed for this script):
    pip install requests beautifulsoup4
"""

import json
import re
import time
import os
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def fetch_html(url: str) -> str | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"  [FAIL] {url} — {e}")
        return None


def extract_apr_range(html: str) -> tuple[float | None, float | None]:
    """
    Find the first APR range pattern like '8.99% - 29.99%' or '8.99%–35.99%' in page HTML.
    Returns (apr_min, apr_max) as floats, or (None, None) if not found.
    """
    # Match patterns like: 8.99% - 35.99% or 8.99%–35.99% or 8.99% to 35.99%
    pattern = r"(\d{1,2}\.\d{2})\s*%\s*(?:–|-|to)\s*(\d{1,2}\.\d{2})\s*%"
    matches = re.findall(pattern, html)
    if matches:
        # Take the first match — usually the main rate range on the page
        low, high = matches[0]
        return float(low), float(high)
    return None, None


# ---------------------------------------------------------------------------
# Lender scrape configs
# Each entry: name, url to scrape, fallback APR (used if scrape fails/JS wall)
# Fallback rates are sourced from public rate disclosures (April 2026)
# ---------------------------------------------------------------------------

LENDER_CONFIGS = [
    # --- PERSONAL LOANS ---
    {"name": "SoFi", "url": "https://www.sofi.com/personal-loans/rates/", "fallback_apr_min": 8.99, "fallback_apr_max": 29.99},
    {"name": "LightStream", "url": "https://www.lightstream.com/personal-loan-rates", "fallback_apr_min": 7.49, "fallback_apr_max": 25.49},
    {"name": "Upstart", "url": "https://www.upstart.com/personal-loans", "fallback_apr_min": 7.80, "fallback_apr_max": 35.99},
    {"name": "LendingClub", "url": "https://www.lendingclub.com/personal-loan/rates-fees", "fallback_apr_min": 9.57, "fallback_apr_max": 35.99},
    {"name": "Prosper", "url": "https://www.prosper.com/personal-loans", "fallback_apr_min": 8.99, "fallback_apr_max": 35.99},
    {"name": "Discover Personal Loans", "url": "https://www.discover.com/personal-loans/rates.html", "fallback_apr_min": 7.99, "fallback_apr_max": 24.99},
    {"name": "Marcus by Goldman Sachs", "url": "https://www.marcus.com/us/en/loans/personal-loans", "fallback_apr_min": 6.99, "fallback_apr_max": 24.99},
    {"name": "Avant", "url": "https://www.avant.com/personal-loans", "fallback_apr_min": 9.95, "fallback_apr_max": 35.99},
    {"name": "Best Egg", "url": "https://www.bestegg.com/personal-loans", "fallback_apr_min": 6.99, "fallback_apr_max": 35.99},
    {"name": "Upgrade", "url": "https://www.upgrade.com/personal-loans", "fallback_apr_min": 7.74, "fallback_apr_max": 35.99},
    {"name": "Happy Money", "url": "https://www.happymoney.com/personal-loan", "fallback_apr_min": 7.99, "fallback_apr_max": 29.99},
    {"name": "Payoff", "url": "https://www.payoff.com", "fallback_apr_min": 7.99, "fallback_apr_max": 29.99},
    {"name": "Axos Bank", "url": "https://www.axosbank.com/personal-loans", "fallback_apr_min": 11.79, "fallback_apr_max": 20.84},
    {"name": "Wells Fargo Personal Loans", "url": "https://www.wellsfargo.com/personal-loans", "fallback_apr_min": 6.74, "fallback_apr_max": 25.99},
    {"name": "Citibank Personal Loans", "url": "https://www.citibank.com/us/personal-loans", "fallback_apr_min": 9.99, "fallback_apr_max": 17.49},
    {"name": "US Bank Personal Loans", "url": "https://www.usbank.com/loans/personal-loans", "fallback_apr_min": 6.74, "fallback_apr_max": 24.99},
    {"name": "TD Bank Personal Loans", "url": "https://www.td.com/us/en/personal-banking/loans", "fallback_apr_min": 6.99, "fallback_apr_max": 23.99},
    {"name": "PNC Bank Personal Loans", "url": "https://www.pnc.com/en/personal-banking/borrowing/personal-loans", "fallback_apr_min": 6.99, "fallback_apr_max": 26.94},
    {"name": "Citizens Bank Personal Loans", "url": "https://www.citizensbank.com/loans/personal-loan", "fallback_apr_min": 6.79, "fallback_apr_max": 20.88},
    {"name": "Truist Personal Loans", "url": "https://www.truist.com/loans-lines/personal-loans", "fallback_apr_min": 6.94, "fallback_apr_max": 25.29},
    {"name": "Regions Bank Personal Loans", "url": "https://www.regions.com/personal-banking/loans/personal-loans", "fallback_apr_min": 9.24, "fallback_apr_max": 29.99},

    # --- CREDIT UNIONS ---
    {"name": "Navy Federal Credit Union", "url": "https://www.navyfederal.org/loans-cards/personal-loans", "fallback_apr_min": 8.74, "fallback_apr_max": 18.00},
    {"name": "USAA Personal Loans", "url": "https://www.usaa.com/inet/wc/bank-personal-loans", "fallback_apr_min": 9.74, "fallback_apr_max": 18.51},
    {"name": "Alliant Credit Union", "url": "https://www.alliantcreditunion.org/loans/personal-loan", "fallback_apr_min": 9.49, "fallback_apr_max": 18.49},
    {"name": "PenFed Credit Union", "url": "https://www.penfed.org/personal-loans", "fallback_apr_min": 8.99, "fallback_apr_max": 17.99},

    # --- BAD CREDIT ---
    {"name": "OppLoans", "url": "https://www.opploans.com", "fallback_apr_min": 160.00, "fallback_apr_max": 195.00},
    {"name": "NetCredit", "url": "https://www.netcredit.com", "fallback_apr_min": 34.00, "fallback_apr_max": 99.99},
    {"name": "OneMain Financial", "url": "https://www.onemainfinancial.com", "fallback_apr_min": 18.00, "fallback_apr_max": 35.99},

    # --- BUSINESS ---
    {"name": "Funding Circle", "url": "https://www.fundingcircle.com/us/", "fallback_apr_min": 10.64, "fallback_apr_max": 31.85},
    {"name": "Bluevine", "url": "https://www.bluevine.com/business-line-of-credit", "fallback_apr_min": 20.00, "fallback_apr_max": 50.00},
    {"name": "OnDeck", "url": "https://www.ondeck.com/rates", "fallback_apr_min": 35.26, "fallback_apr_max": 99.00},
    {"name": "Kabbage (American Express)", "url": "https://www.kabbage.com", "fallback_apr_min": 9.00, "fallback_apr_max": 36.00},
    {"name": "Lendio", "url": "https://www.lendio.com", "fallback_apr_min": 6.00, "fallback_apr_max": 99.00},
    {"name": "Accion Opportunity Fund", "url": "https://www.accionopportunityfund.org/loans", "fallback_apr_min": 5.99, "fallback_apr_max": 24.99},

    # --- GIG & MICROFINANCE ---
    {"name": "Kiva", "url": "https://www.kiva.org/borrow", "fallback_apr_min": 0.00, "fallback_apr_max": 0.00},
    {"name": "Giggle Finance", "url": "https://www.gigglefinance.com", "fallback_apr_min": 100.00, "fallback_apr_max": 300.00},
    {"name": "Moves Financial", "url": "https://www.movesfinancial.com", "fallback_apr_min": 19.57, "fallback_apr_max": 25.27},

    # --- AUTO ---
    {"name": "myAutoloan", "url": "https://www.myautoloan.com", "fallback_apr_min": 4.05, "fallback_apr_max": 29.99},
    {"name": "Capital One Auto Finance", "url": "https://www.capitalone.com/auto-financing/rates", "fallback_apr_min": 5.99, "fallback_apr_max": 17.99},
    {"name": "AutoPay", "url": "https://www.autopay.com/auto-loan-rates", "fallback_apr_min": 4.65, "fallback_apr_max": 17.99},
    {"name": "Chase Auto Finance", "url": "https://www.chase.com/personal/auto/rates", "fallback_apr_min": 5.99, "fallback_apr_max": 24.99},
    {"name": "Bank of America Auto Loans", "url": "https://www.bankofamerica.com/auto-loans/auto-loan-rates", "fallback_apr_min": 5.34, "fallback_apr_max": 17.99},

    # --- HOME / MORTGAGE ---
    {"name": "Better Mortgage", "url": "https://www.better.com/mortgage-rates", "fallback_apr_min": 6.35, "fallback_apr_max": 8.50},
    {"name": "Rocket Mortgage", "url": "https://www.rocketmortgage.com/mortgage-rates", "fallback_apr_min": 6.88, "fallback_apr_max": 8.50},
    {"name": "Chase Mortgage", "url": "https://www.chase.com/personal/mortgage/rates", "fallback_apr_min": 6.35, "fallback_apr_max": 8.50},
    {"name": "Bank of America Mortgage", "url": "https://www.bankofamerica.com/mortgage/mortgage-rates", "fallback_apr_min": 6.35, "fallback_apr_max": 8.50},

    # --- MEDICAL ---
    {"name": "CareCredit", "url": "https://www.carecredit.com/apply/rates.html", "fallback_apr_min": 17.90, "fallback_apr_max": 32.99},
    {"name": "Prosper Healthcare Lending", "url": "https://www.prosperhealthcare.com", "fallback_apr_min": 6.99, "fallback_apr_max": 35.99},

    # --- EDUCATION ---
    {"name": "Earnest", "url": "https://www.earnest.com/student-loans/rates", "fallback_apr_min": 3.14, "fallback_apr_max": 16.74},
    {"name": "CommonBond", "url": "https://www.commonbond.co", "fallback_apr_min": 2.00, "fallback_apr_max": 9.36},

    # --- RV & VACATION ---
    {"name": "Southeast Financial", "url": "https://www.southeastfinancial.org/rv-loans", "fallback_apr_min": 6.24, "fallback_apr_max": 20.00},
    {"name": "Allegiant Travel Credit", "url": "https://www.allegiantair.com", "fallback_apr_min": 0.00, "fallback_apr_max": 36.00},
]


def scrape_lender(config: dict) -> dict:
    name = config["name"]
    print(f"Scraping {name}...")

    apr_min, apr_max = None, None
    source = "fallback"

    html = fetch_html(config["url"])
    if html:
        apr_min, apr_max = extract_apr_range(html)
        if apr_min and apr_max:
            source = "scraped"
            print(f"  [OK] {name}: {apr_min}% – {apr_max}% APR (scraped)")
        else:
            print(f"  [JS wall or no match] {name}: using fallback rates")

    if not apr_min or not apr_max:
        apr_min = config["fallback_apr_min"]
        apr_max = config["fallback_apr_max"]
        print(f"  [FALLBACK] {name}: {apr_min}% – {apr_max}% APR")

    return {
        "name": name,
        "apr_min": apr_min,
        "apr_max": apr_max,
        "apr_source": source,  # "scraped" or "fallback" — transparency
        "scraped_url": config["url"],
    }


def main():
    results = []
    for config in LENDER_CONFIGS:
        result = scrape_lender(config)
        results.append(result)
        time.sleep(1)  # polite delay between requests

    output_path = os.path.join(os.path.dirname(__file__), "scraped_rates.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nDone. Results saved to {output_path}")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
