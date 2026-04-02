"use client";

import { useState, useEffect } from "react";
import { track } from "@/lib/track";

interface Lender {
  name: string;
  website: string;
  description: string;
  credit_score_min: number;
  credit_score_preferred: number;
  min_annual_income: number;
  self_employed_friendly: boolean;
  loan_amount_min: number;
  loan_amount_max: number;
  loan_types: string[];
  specializations: string[];
  accepted_employment_types: string[];
}

interface Group {
  label: string;
  lenders: Lender[];
}

const GROUPS: Group[] = [
  {
    label: "Personal Loans",
    lenders: [
      { name: "SoFi", website: "https://www.sofi.com", description: "Modern online lender known for flexible underwriting and self-employed borrower acceptance.", credit_score_min: 650, credit_score_preferred: 700, min_annual_income: 45000, self_employed_friendly: true, loan_amount_min: 5000, loan_amount_max: 100000, loan_types: ["personal", "business", "debt_consolidation", "home_improvement"], specializations: ["self-employed", "high-income"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "LightStream", website: "https://www.lightstream.com", description: "Low-rate lender for borrowers with excellent credit. No fees.", credit_score_min: 680, credit_score_preferred: 740, min_annual_income: 50000, self_employed_friendly: true, loan_amount_min: 5000, loan_amount_max: 100000, loan_types: ["personal", "home", "business", "auto", "rv", "vacation", "debt_consolidation"], specializations: ["excellent-credit", "low-rate"], accepted_employment_types: ["salaried", "self_employed"] },
      { name: "Upstart", website: "https://www.upstart.com", description: "AI-powered lender that considers education and job history beyond credit score.", credit_score_min: 600, credit_score_preferred: 660, min_annual_income: 30000, self_employed_friendly: true, loan_amount_min: 1000, loan_amount_max: 50000, loan_types: ["personal", "auto", "medical", "education", "debt_consolidation"], specializations: ["thin-credit", "young-borrowers", "gig-workers"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "LendingClub", website: "https://www.lendingclub.com", description: "Peer-to-peer lender with flexible terms. Good for debt consolidation.", credit_score_min: 600, credit_score_preferred: 680, min_annual_income: 24000, self_employed_friendly: true, loan_amount_min: 1000, loan_amount_max: 40000, loan_types: ["personal", "business", "debt_consolidation"], specializations: ["debt-consolidation", "self-employed"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "Marcus by Goldman Sachs", website: "https://www.marcus.com", description: "No-fee personal loans from Goldman Sachs. Best for salaried borrowers.", credit_score_min: 660, credit_score_preferred: 720, min_annual_income: 40000, self_employed_friendly: false, loan_amount_min: 3500, loan_amount_max: 40000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["no-fees", "salaried"], accepted_employment_types: ["salaried"] },
      { name: "Avant", website: "https://www.avant.com", description: "Lender focused on near-prime borrowers. Accepts lower credit scores.", credit_score_min: 550, credit_score_preferred: 620, min_annual_income: 24000, self_employed_friendly: true, loan_amount_min: 2000, loan_amount_max: 35000, loan_types: ["personal", "debt_consolidation", "medical"], specializations: ["near-prime", "bad-credit", "gig-workers"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "Prosper", website: "https://www.prosper.com", description: "Peer-to-peer marketplace lender. Good middle ground for most borrowers.", credit_score_min: 560, credit_score_preferred: 640, min_annual_income: 25000, self_employed_friendly: true, loan_amount_min: 2000, loan_amount_max: 50000, loan_types: ["personal", "home", "debt_consolidation", "home_improvement", "medical"], specializations: ["debt-consolidation", "home-improvement"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "Best Egg", website: "https://www.bestegg.com", description: "Fast funding personal loans with competitive rates for good credit.", credit_score_min: 600, credit_score_preferred: 700, min_annual_income: 35000, self_employed_friendly: true, loan_amount_min: 2000, loan_amount_max: 50000, loan_types: ["personal", "debt_consolidation", "home_improvement", "medical"], specializations: ["fast-funding", "debt-consolidation"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "Upgrade", website: "https://www.upgrade.com", description: "Flexible personal loans with credit monitoring tools included.", credit_score_min: 560, credit_score_preferred: 650, min_annual_income: 25000, self_employed_friendly: true, loan_amount_min: 1000, loan_amount_max: 50000, loan_types: ["personal", "auto", "debt_consolidation", "home_improvement"], specializations: ["credit-building", "debt-consolidation"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "Happy Money", website: "https://www.happymoney.com", description: "Specialized in credit card debt consolidation with member-focused approach.", credit_score_min: 640, credit_score_preferred: 700, min_annual_income: 30000, self_employed_friendly: true, loan_amount_min: 5000, loan_amount_max: 40000, loan_types: ["debt_consolidation"], specializations: ["credit-card-consolidation", "debt-free"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "Discover Personal Loans", website: "https://www.discover.com/personal-loans", description: "No-fee personal loans from a trusted brand with flexible repayment.", credit_score_min: 660, credit_score_preferred: 720, min_annual_income: 25000, self_employed_friendly: true, loan_amount_min: 2500, loan_amount_max: 40000, loan_types: ["personal", "debt_consolidation", "home_improvement", "medical", "vacation"], specializations: ["no-fees", "flexible-terms"], accepted_employment_types: ["salaried", "self_employed"] },
      { name: "Payoff", website: "https://www.payoff.com", description: "Purpose-built for paying off credit card debt. Member support included.", credit_score_min: 640, credit_score_preferred: 700, min_annual_income: 25000, self_employed_friendly: true, loan_amount_min: 5000, loan_amount_max: 40000, loan_types: ["debt_consolidation"], specializations: ["credit-card-payoff", "financial-wellness"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
    ],
  },
  {
    label: "Business & Self-Employed",
    lenders: [
      { name: "Funding Circle", website: "https://www.fundingcircle.com", description: "Small business lender. Ideal for self-employed with established business.", credit_score_min: 620, credit_score_preferred: 680, min_annual_income: 50000, self_employed_friendly: true, loan_amount_min: 25000, loan_amount_max: 500000, loan_types: ["business"], specializations: ["small-business", "self-employed", "established-business"], accepted_employment_types: ["self_employed", "contractor"] },
      { name: "Bluevine", website: "https://www.bluevine.com", description: "Business line of credit for freelancers and small business owners.", credit_score_min: 625, credit_score_preferred: 700, min_annual_income: 120000, self_employed_friendly: true, loan_amount_min: 6000, loan_amount_max: 250000, loan_types: ["business"], specializations: ["freelancers", "line-of-credit", "cash-flow"], accepted_employment_types: ["self_employed", "contractor", "gig"] },
      { name: "OnDeck", website: "https://www.ondeck.com", description: "Fast small business loans with same-day funding for established businesses.", credit_score_min: 600, credit_score_preferred: 660, min_annual_income: 100000, self_employed_friendly: true, loan_amount_min: 5000, loan_amount_max: 250000, loan_types: ["business"], specializations: ["fast-funding", "small-business", "established-business"], accepted_employment_types: ["self_employed", "contractor"] },
      { name: "Kabbage (American Express)", website: "https://www.kabbage.com", description: "Flexible business line of credit backed by American Express.", credit_score_min: 560, credit_score_preferred: 640, min_annual_income: 50000, self_employed_friendly: true, loan_amount_min: 2000, loan_amount_max: 250000, loan_types: ["business"], specializations: ["line-of-credit", "flexible", "small-business"], accepted_employment_types: ["self_employed", "gig", "contractor"] },
      { name: "Lendio", website: "https://www.lendio.com", description: "Business loan marketplace connecting borrowers to 75+ lenders.", credit_score_min: 550, credit_score_preferred: 650, min_annual_income: 50000, self_employed_friendly: true, loan_amount_min: 500, loan_amount_max: 5000000, loan_types: ["business"], specializations: ["marketplace", "small-business", "startup"], accepted_employment_types: ["self_employed", "contractor", "gig"] },
      { name: "Accion Opportunity Fund", website: "https://www.accionopportunityfund.org", description: "CDFI lender focused on underserved small business owners and entrepreneurs.", credit_score_min: 0, credit_score_preferred: 580, min_annual_income: 0, self_employed_friendly: true, loan_amount_min: 300, loan_amount_max: 100000, loan_types: ["business"], specializations: ["underserved", "minority-owned", "startup", "microfinance"], accepted_employment_types: ["self_employed", "gig", "contractor"] },
    ],
  },
  {
    label: "Gig & Freelance Specialized",
    lenders: [
      { name: "Kiva", website: "https://www.kiva.org", description: "Microfinance lender. 0% interest loans up to $15K for underserved borrowers.", credit_score_min: 0, credit_score_preferred: 0, min_annual_income: 0, self_employed_friendly: true, loan_amount_min: 1000, loan_amount_max: 15000, loan_types: ["business", "personal"], specializations: ["microfinance", "underserved", "gig-workers", "no-credit"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "Giggle Finance", website: "https://www.gigglefinance.com", description: "Purpose-built cash advances for gig workers. No credit check required.", credit_score_min: 0, credit_score_preferred: 0, min_annual_income: 12000, self_employed_friendly: true, loan_amount_min: 100, loan_amount_max: 5000, loan_types: ["personal"], specializations: ["gig-workers", "no-credit-check", "cash-advance"], accepted_employment_types: ["gig"] },
      { name: "Moves Financial", website: "https://www.movesfinancial.com", description: "Banking and credit products built exclusively for gig economy workers.", credit_score_min: 0, credit_score_preferred: 580, min_annual_income: 15000, self_employed_friendly: true, loan_amount_min: 200, loan_amount_max: 3000, loan_types: ["personal"], specializations: ["gig-workers", "rideshare", "delivery-drivers"], accepted_employment_types: ["gig"] },
    ],
  },
  {
    label: "Auto Loans",
    lenders: [
      { name: "myAutoloan", website: "https://www.myautoloan.com", description: "Auto loan marketplace connecting borrowers to multiple lenders at once.", credit_score_min: 575, credit_score_preferred: 660, min_annual_income: 21600, self_employed_friendly: true, loan_amount_min: 5000, loan_amount_max: 100000, loan_types: ["auto"], specializations: ["auto", "refinance", "new-used-vehicle"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "Capital One Auto Finance", website: "https://www.capitalone.com/auto-financing", description: "Pre-qualification with no credit impact. Wide dealer network.", credit_score_min: 500, credit_score_preferred: 660, min_annual_income: 18000, self_employed_friendly: true, loan_amount_min: 4000, loan_amount_max: 75000, loan_types: ["auto"], specializations: ["auto", "pre-qualification", "bad-credit"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "AutoPay", website: "https://www.autopay.com", description: "Auto refinance specialist. Accepts self-employed with tax returns.", credit_score_min: 560, credit_score_preferred: 660, min_annual_income: 24000, self_employed_friendly: true, loan_amount_min: 2500, loan_amount_max: 100000, loan_types: ["auto"], specializations: ["auto-refinance", "self-employed"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "Chase Auto Finance", website: "https://www.chase.com/personal/auto", description: "Auto loans and refinancing from JPMorgan Chase. Wide dealer network, pre-qualification with no credit impact.", credit_score_min: 580, credit_score_preferred: 660, min_annual_income: 18000, self_employed_friendly: true, loan_amount_min: 4000, loan_amount_max: 150000, loan_types: ["auto"], specializations: ["auto", "dealer-network", "pre-qualification"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "Bank of America Auto Loans", website: "https://www.bankofamerica.com/auto-loans", description: "Auto loans from Bank of America. Preferred rewards members get rate discounts.", credit_score_min: 580, credit_score_preferred: 660, min_annual_income: 18000, self_employed_friendly: true, loan_amount_min: 7500, loan_amount_max: 150000, loan_types: ["auto"], specializations: ["auto", "preferred-rewards", "relationship-discount"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
    ],
  },
  {
    label: "Home & Mortgage",
    lenders: [
      { name: "Better Mortgage", website: "https://www.better.com", description: "Digital-first mortgage lender. Accepts self-employed with 2yr tax history.", credit_score_min: 620, credit_score_preferred: 700, min_annual_income: 40000, self_employed_friendly: true, loan_amount_min: 100000, loan_amount_max: 3000000, loan_types: ["home"], specializations: ["mortgage", "self-employed", "refinance"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "Rocket Mortgage", website: "https://www.rocketmortgage.com", description: "Largest US mortgage lender with full digital process.", credit_score_min: 580, credit_score_preferred: 680, min_annual_income: 30000, self_employed_friendly: true, loan_amount_min: 50000, loan_amount_max: 2500000, loan_types: ["home"], specializations: ["mortgage", "refinance", "FHA", "VA"], accepted_employment_types: ["salaried", "self_employed"] },
      { name: "Axos Bank", website: "https://www.axosbank.com", description: "Online bank with flexible home equity and personal loan options.", credit_score_min: 700, credit_score_preferred: 740, min_annual_income: 50000, self_employed_friendly: true, loan_amount_min: 10000, loan_amount_max: 50000, loan_types: ["home_improvement", "personal", "debt_consolidation"], specializations: ["home-equity", "high-credit"], accepted_employment_types: ["salaried", "self_employed"] },
      { name: "Chase Mortgage", website: "https://www.chase.com/personal/mortgage", description: "Home purchase and refinance loans from JPMorgan Chase. Conventional, FHA, VA, and jumbo loans.", credit_score_min: 620, credit_score_preferred: 700, min_annual_income: 40000, self_employed_friendly: true, loan_amount_min: 150000, loan_amount_max: 9500000, loan_types: ["home"], specializations: ["mortgage", "FHA", "VA", "jumbo", "refinance"], accepted_employment_types: ["salaried", "self_employed"] },
      { name: "Bank of America Mortgage", website: "https://www.bankofamerica.com/mortgage", description: "Home loans from Bank of America. Down payment assistance programs available for first-time buyers.", credit_score_min: 620, credit_score_preferred: 700, min_annual_income: 35000, self_employed_friendly: true, loan_amount_min: 100000, loan_amount_max: 5000000, loan_types: ["home"], specializations: ["mortgage", "first-time-buyer", "down-payment-assistance", "FHA", "VA"], accepted_employment_types: ["salaried", "self_employed"] },
    ],
  },
  {
    label: "Medical",
    lenders: [
      { name: "CareCredit", website: "https://www.carecredit.com", description: "Healthcare financing for medical, dental, vision and wellness expenses.", credit_score_min: 620, credit_score_preferred: 680, min_annual_income: 0, self_employed_friendly: true, loan_amount_min: 200, loan_amount_max: 25000, loan_types: ["medical"], specializations: ["healthcare", "dental", "vision", "wellness"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "Prosper Healthcare Lending", website: "https://www.prosperhealthcare.com", description: "Medical loan specialist. Partners with 10,000+ healthcare providers.", credit_score_min: 600, credit_score_preferred: 660, min_annual_income: 20000, self_employed_friendly: true, loan_amount_min: 2000, loan_amount_max: 65000, loan_types: ["medical"], specializations: ["medical", "dental", "cosmetic", "fertility"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
    ],
  },
  {
    label: "Education",
    lenders: [
      { name: "Earnest", website: "https://www.earnest.com", description: "Student loan refinancing with merit-based underwriting beyond credit scores.", credit_score_min: 650, credit_score_preferred: 700, min_annual_income: 35000, self_employed_friendly: true, loan_amount_min: 5000, loan_amount_max: 500000, loan_types: ["education"], specializations: ["student-loans", "refinancing", "freelancers"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "CommonBond", website: "https://www.commonbond.co", description: "Student loan refinancing with social mission. Accepts non-traditional income.", credit_score_min: 660, credit_score_preferred: 710, min_annual_income: 25000, self_employed_friendly: true, loan_amount_min: 5000, loan_amount_max: 500000, loan_types: ["education"], specializations: ["student-loans", "refinancing"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
    ],
  },
  {
    label: "RV & Vacation",
    lenders: [
      { name: "Southeast Financial", website: "https://www.southeastfinancial.org", description: "RV and recreational vehicle financing specialist.", credit_score_min: 600, credit_score_preferred: 680, min_annual_income: 30000, self_employed_friendly: true, loan_amount_min: 10000, loan_amount_max: 4000000, loan_types: ["rv"], specializations: ["rv", "motorhome", "travel-trailer"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "Allegiant Travel Credit", website: "https://www.allegiantair.com", description: "Vacation financing through travel-specific credit lines.", credit_score_min: 620, credit_score_preferred: 680, min_annual_income: 20000, self_employed_friendly: true, loan_amount_min: 500, loan_amount_max: 10000, loan_types: ["vacation"], specializations: ["vacation", "travel-financing"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
    ],
  },
  {
    label: "Major Banks & Credit Unions",
    lenders: [
      { name: "Wells Fargo Personal Loans", website: "https://www.wellsfargo.com/personal-loans", description: "Personal loans from one of the largest US banks. Existing customers get relationship discounts.", credit_score_min: 660, credit_score_preferred: 720, min_annual_income: 35000, self_employed_friendly: false, loan_amount_min: 3000, loan_amount_max: 100000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["existing-customers", "relationship-discount", "large-loans"], accepted_employment_types: ["salaried"] },
      { name: "Citibank Personal Loans", website: "https://www.citibank.com/us/personal-loans", description: "Unsecured personal loans from Citibank. No origination fee, fast decisions.", credit_score_min: 680, credit_score_preferred: 730, min_annual_income: 35000, self_employed_friendly: false, loan_amount_min: 2000, loan_amount_max: 30000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["no-origination-fee", "existing-customers"], accepted_employment_types: ["salaried"] },
      { name: "US Bank Personal Loans", website: "https://www.usbank.com/loans/personal-loans", description: "Personal loans with relationship discounts for existing US Bank customers.", credit_score_min: 660, credit_score_preferred: 720, min_annual_income: 30000, self_employed_friendly: false, loan_amount_min: 1000, loan_amount_max: 50000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["relationship-banking", "existing-customers"], accepted_employment_types: ["salaried"] },
      { name: "TD Bank Personal Loans", website: "https://www.td.com/us/en/personal-banking/loans", description: "Personal loans with same-day decisions. No origination or prepayment fees.", credit_score_min: 660, credit_score_preferred: 700, min_annual_income: 30000, self_employed_friendly: false, loan_amount_min: 2000, loan_amount_max: 50000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["same-day-decision", "no-fees", "northeast-us"], accepted_employment_types: ["salaried"] },
      { name: "PNC Bank Personal Loans", website: "https://www.pnc.com/en/personal-banking/borrowing/personal-loans", description: "Unsecured personal loans from PNC. Rate discounts for autopay and existing customers.", credit_score_min: 660, credit_score_preferred: 720, min_annual_income: 30000, self_employed_friendly: false, loan_amount_min: 1000, loan_amount_max: 35000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["autopay-discount", "existing-customers"], accepted_employment_types: ["salaried"] },
      { name: "Citizens Bank Personal Loans", website: "https://www.citizensbank.com/loans/personal-loan", description: "Personal loans with loyalty discounts for existing Citizens Bank customers.", credit_score_min: 680, credit_score_preferred: 720, min_annual_income: 35000, self_employed_friendly: false, loan_amount_min: 5000, loan_amount_max: 50000, loan_types: ["personal", "debt_consolidation", "home_improvement", "medical", "education"], specializations: ["loyalty-discount", "existing-customers"], accepted_employment_types: ["salaried"] },
      { name: "Truist Personal Loans", website: "https://www.truist.com/loans-lines/personal-loans", description: "Personal loans from Truist (BB&T + SunTrust merger). Wide branch network in the Southeast.", credit_score_min: 660, credit_score_preferred: 700, min_annual_income: 30000, self_employed_friendly: false, loan_amount_min: 3500, loan_amount_max: 100000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["southeast-us", "large-loans", "relationship-banking"], accepted_employment_types: ["salaried"] },
      { name: "Regions Bank Personal Loans", website: "https://www.regions.com/personal-banking/loans/personal-loans", description: "Personal loans from Regions Bank. Strong presence in the Southeast and Midwest.", credit_score_min: 640, credit_score_preferred: 700, min_annual_income: 25000, self_employed_friendly: false, loan_amount_min: 2000, loan_amount_max: 35000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["southeast-midwest", "relationship-banking"], accepted_employment_types: ["salaried"] },
      { name: "Navy Federal Credit Union", website: "https://www.navyfederal.org/loans-cards/personal-loans", description: "Personal loans exclusively for military members, veterans, and their families. Highly competitive rates.", credit_score_min: 580, credit_score_preferred: 680, min_annual_income: 20000, self_employed_friendly: true, loan_amount_min: 250, loan_amount_max: 50000, loan_types: ["personal", "debt_consolidation", "home_improvement", "auto"], specializations: ["military", "veterans", "low-rates", "member-benefits"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "USAA Personal Loans", website: "https://www.usaa.com/inet/wc/bank-personal-loans", description: "Personal loans for active military, veterans, and eligible family members.", credit_score_min: 560, credit_score_preferred: 660, min_annual_income: 15000, self_employed_friendly: true, loan_amount_min: 2500, loan_amount_max: 100000, loan_types: ["personal", "debt_consolidation", "auto", "home_improvement"], specializations: ["military", "veterans", "member-benefits"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "Alliant Credit Union", website: "https://www.alliantcreditunion.org/loans/personal-loan", description: "Online credit union with competitive rates. Membership open to most US residents.", credit_score_min: 640, credit_score_preferred: 700, min_annual_income: 25000, self_employed_friendly: true, loan_amount_min: 1000, loan_amount_max: 50000, loan_types: ["personal", "debt_consolidation", "home_improvement"], specializations: ["credit-union", "low-rates", "open-membership"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
      { name: "PenFed Credit Union", website: "https://www.penfed.org/personal-loans", description: "Pentagon Federal Credit Union. Competitive personal loan rates, open membership.", credit_score_min: 650, credit_score_preferred: 720, min_annual_income: 25000, self_employed_friendly: true, loan_amount_min: 600, loan_amount_max: 50000, loan_types: ["personal", "debt_consolidation", "auto", "home_improvement"], specializations: ["credit-union", "military-friendly", "low-rates"], accepted_employment_types: ["salaried", "self_employed", "contractor"] },
    ],
  },
  {
    label: "Bad Credit & Near-Prime",
    lenders: [
      { name: "OppLoans", website: "https://www.opploans.com", description: "Personal loans for borrowers with bad credit. No minimum credit score.", credit_score_min: 0, credit_score_preferred: 580, min_annual_income: 18000, self_employed_friendly: true, loan_amount_min: 500, loan_amount_max: 4000, loan_types: ["personal"], specializations: ["bad-credit", "no-credit-check", "emergency"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "NetCredit", website: "https://www.netcredit.com", description: "Personal loans and lines of credit for non-prime borrowers.", credit_score_min: 0, credit_score_preferred: 600, min_annual_income: 15000, self_employed_friendly: true, loan_amount_min: 1000, loan_amount_max: 10500, loan_types: ["personal"], specializations: ["bad-credit", "credit-building"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
      { name: "OneMain Financial", website: "https://www.onemainfinancial.com", description: "Secured and unsecured personal loans for near-prime borrowers.", credit_score_min: 0, credit_score_preferred: 600, min_annual_income: 7200, self_employed_friendly: true, loan_amount_min: 1500, loan_amount_max: 20000, loan_types: ["personal", "debt_consolidation", "auto"], specializations: ["bad-credit", "secured-loans", "near-prime"], accepted_employment_types: ["salaried", "self_employed", "gig", "contractor"] },
    ],
  },
];

function fmtMoney(n: number) {
  if (n === 0) return "None";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function LenderRow({ lender }: { lender: Lender }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-white/6 last:border-0 ${open ? "bg-white/[0.02]" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left group hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/75 group-hover:text-white transition-colors font-medium">
            {lender.name}
          </span>
          {lender.self_employed_friendly && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#38bdf8]/20 text-[#38bdf8]/60 hidden sm:inline">
              SE friendly
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs text-white/40 hidden sm:block font-mono">
            {fmtMoney(lender.loan_amount_min)} – {fmtMoney(lender.loan_amount_max)}
          </span>
          <span className="text-white/40 text-[10px]">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4 border-t border-white/6">
          <p className="text-sm text-white/60 leading-relaxed pt-3">{lender.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Min Credit", value: lender.credit_score_min === 0 ? "None" : String(lender.credit_score_min) },
              { label: "Preferred Credit", value: lender.credit_score_preferred === 0 ? "None" : String(lender.credit_score_preferred) },
              { label: "Min Income", value: fmtMoney(lender.min_annual_income) },
              { label: "Loan Range", value: `${fmtMoney(lender.loan_amount_min)} – ${fmtMoney(lender.loan_amount_max)}` },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                <div className="text-[10px] text-white/45 mb-1">{s.label}</div>
                <div className="text-sm font-mono font-medium">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-white/45 shrink-0">Loan types</span>
              {lender.loan_types.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-white/60">
                  {t.replace(/_/g, " ")}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-white/45 shrink-0">Employment</span>
              {lender.accepted_employment_types.map((e) => (
                <span key={e} className="px-2 py-0.5 rounded bg-white/5 text-white/60">
                  {e.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {lender.specializations.map((s) => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-full border border-white/8 text-white/45">
                {s}
              </span>
            ))}
          </div>

          <a
            href={lender.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#38bdf8] hover:underline"
          >
            Visit {lender.name} ↗
          </a>
        </div>
      )}
    </div>
  );
}

export default function LendersPage() {
  const total = GROUPS.reduce((sum, g) => sum + g.lenders.length, 0);

  useEffect(() => { track("page_view", "/lenders"); }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <div className="text-xs text-white/45 uppercase tracking-widest mb-3">Our network</div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {total} Lenders, Zero Black Boxes
        </h1>
        <p className="text-white/55 text-sm max-w-lg">
          Every lender is manually researched. Click any name to see credit requirements,
          income thresholds, loan ranges, and who they actually approve.
        </p>
      </div>

      <div className="space-y-5">
        {GROUPS.map((group) => (
          <div key={group.label} className="border border-white/8 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/8 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/65 uppercase tracking-wider">
                {group.label}
              </span>
              <span className="text-xs text-white/35">{group.lenders.length}</span>
            </div>
            {group.lenders.map((l) => (
              <LenderRow key={l.name} lender={l} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
