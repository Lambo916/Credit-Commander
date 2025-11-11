// CompliPilot Filing Profiles Library
// Knowledge packs for structured compliance intelligence

const FILING_PROFILES = {
  // ============================================================================
  // ANNUAL REPORT PROFILES
  // ============================================================================
  
  annual_report_generic: {
    slug: "annual_report_generic",
    name: "Annual Report (Generic)",
    scope: {
      filingTypes: ["Annual Report"],
      states: ["*"], // Fallback for all states
      entityTypes: ["LLC", "Corporation", "S-Corporation", "C-Corporation", "LLP"]
    },
    checklist: [
      {
        id: "articles",
        label: "Articles of Incorporation/Organization",
        description: "Certified copy of your formation documents",
        required: true,
        category: "Formation Documents"
      },
      {
        id: "ein",
        label: "EIN (Employer Identification Number)",
        description: "Federal tax identification number from IRS",
        required: true,
        category: "Tax Documents"
      },
      {
        id: "financials",
        label: "Financial Statements",
        description: "Balance sheet and income statement for reporting period",
        required: false,
        category: "Financial Records"
      },
      {
        id: "operating_agreement",
        label: "Operating Agreement / Bylaws",
        description: "Current governing documents",
        required: false,
        category: "Governance"
      },
      {
        id: "registered_agent",
        label: "Registered Agent Information",
        description: "Current agent name and address",
        required: true,
        category: "Contact Information"
      }
    ],
    suggestedItems: ["operating_agreement", "financials"],
    timeline: [
      {
        milestone: "Gather Required Documents",
        owner: "Business Owner",
        offsetDays: -30,
        notes: "Collect formation docs, EIN, and financial records"
      },
      {
        milestone: "Review Filing Requirements",
        owner: "Business Owner / Advisor",
        offsetDays: -21,
        notes: "Confirm state-specific requirements and fees"
      },
      {
        milestone: "Prepare Draft Filing",
        owner: "Business Owner",
        offsetDays: -14,
        notes: "Complete annual report form with current information"
      },
      {
        milestone: "Internal Review",
        owner: "Business Owner / Advisor",
        offsetDays: -7,
        notes: "Verify accuracy of all information before submission"
      },
      {
        milestone: "Submit Annual Report",
        owner: "Business Owner",
        offsetDays: -3,
        notes: "File online or mail to state agency with payment"
      },
      {
        milestone: "Filing Deadline",
        owner: "State Agency",
        offsetDays: 0,
        notes: "Late filings may incur penalties or administrative dissolution"
      }
    ],
    risks: [
      {
        risk: "Late Filing Penalty",
        severity: "Medium",
        likelihood: "Medium",
        mitigation: "Set calendar reminders 30 days before deadline; consider auto-renewal if available"
      },
      {
        risk: "Administrative Dissolution",
        severity: "High",
        likelihood: "Low",
        mitigation: "File at least 7 days early to account for processing delays"
      },
      {
        risk: "Incorrect Information",
        severity: "Medium",
        likelihood: "Low",
        mitigation: "Cross-reference with formation documents and previous filings"
      },
      {
        risk: "Payment Processing Delays",
        severity: "Low",
        likelihood: "Medium",
        mitigation: "Use electronic payment methods; confirm receipt within 48 hours"
      }
    ],
    links: [
      {
        label: "State Business Portal",
        url: "[Contact your state's Secretary of State office]",
        description: "Official filing portal"
      }
    ]
  },

  annual_report_ca: {
    slug: "annual_report_ca",
    name: "Annual Report (California)",
    scope: {
      filingTypes: ["Annual Report"],
      states: ["California", "CA"],
      entityTypes: ["LLC", "Corporation", "S-Corporation", "C-Corporation"]
    },
    checklist: [
      {
        id: "articles",
        label: "Articles of Incorporation/Organization",
        description: "Original formation documents filed with California SOS",
        required: true,
        category: "Formation Documents"
      },
      {
        id: "ein",
        label: "EIN (Employer Identification Number)",
        description: "Federal tax ID from IRS",
        required: true,
        category: "Tax Documents"
      },
      {
        id: "soi",
        label: "Statement of Information (Form SI-550/SI-350)",
        description: "California-specific information statement",
        required: true,
        category: "State Requirements"
      },
      {
        id: "franchise_tax",
        label: "Franchise Tax Board Account",
        description: "Active FTB account in good standing",
        required: true,
        category: "Tax Compliance"
      },
      {
        id: "registered_agent",
        label: "California Registered Agent",
        description: "Agent with physical CA address (not PO Box)",
        required: true,
        category: "Contact Information"
      },
      {
        id: "operating_agreement",
        label: "Operating Agreement / Bylaws",
        description: "Current governing documents",
        required: false,
        category: "Governance"
      }
    ],
    suggestedItems: ["operating_agreement", "soi"],
    timeline: [
      {
        milestone: "Gather CA-Specific Documents",
        owner: "Business Owner",
        offsetDays: -30,
        notes: "Collect Statement of Information, FTB account info, registered agent details"
      },
      {
        milestone: "Verify FTB Account Status",
        owner: "Business Owner / CPA",
        offsetDays: -21,
        notes: "Ensure Franchise Tax Board account is current and in good standing"
      },
      {
        milestone: "Complete Statement of Information",
        owner: "Business Owner",
        offsetDays: -14,
        notes: "Fill out Form SI-550 (LLC) or SI-350 (Corp) with current data"
      },
      {
        milestone: "Review and Validate",
        owner: "Business Owner / Advisor",
        offsetDays: -7,
        notes: "Double-check officer/member names, addresses, and agent information"
      },
      {
        milestone: "File Online via BizFile",
        owner: "Business Owner",
        offsetDays: -3,
        notes: "Submit through California Secretary of State BizFile portal with $20-25 fee"
      },
      {
        milestone: "California Filing Deadline",
        owner: "CA Secretary of State",
        offsetDays: 0,
        notes: "Late penalty: $250 plus potential suspension of entity status"
      }
    ],
    risks: [
      {
        risk: "FTB Suspension",
        severity: "High",
        likelihood: "Medium",
        mitigation: "Verify FTB account is current before filing; resolve any outstanding tax issues"
      },
      {
        risk: "Late Filing Penalty ($250)",
        severity: "Medium",
        likelihood: "Medium",
        mitigation: "File at least 1 week early; set multiple calendar reminders"
      },
      {
        risk: "Entity Suspension",
        severity: "High",
        likelihood: "Low",
        mitigation: "Monitor compliance calendar; consider professional registered agent service"
      },
      {
        risk: "Incorrect Agent Address",
        severity: "Medium",
        likelihood: "Low",
        mitigation: "Confirm agent address is physical CA location, not PO Box"
      }
    ],
    links: [
      {
        label: "California BizFile Portal",
        url: "https://bizfileonline.sos.ca.gov/",
        description: "Official California Secretary of State filing system"
      },
      {
        label: "Franchise Tax Board",
        url: "https://www.ftb.ca.gov/",
        description: "Verify tax account status"
      }
    ]
  },

  annual_report_de: {
    slug: "annual_report_de",
    name: "Annual Report (Delaware)",
    scope: {
      filingTypes: ["Annual Report"],
      states: ["Delaware", "DE"],
      entityTypes: ["LLC", "Corporation", "S-Corporation", "C-Corporation"]
    },
    checklist: [
      {
        id: "articles",
        label: "Certificate of Formation/Incorporation",
        description: "Original Delaware formation documents",
        required: true,
        category: "Formation Documents"
      },
      {
        id: "ein",
        label: "EIN (Employer Identification Number)",
        description: "Federal tax ID",
        required: true,
        category: "Tax Documents"
      },
      {
        id: "franchise_tax",
        label: "Delaware Franchise Tax Payment",
        description: "Annual franchise tax must be paid",
        required: true,
        category: "Tax Compliance"
      },
      {
        id: "registered_agent",
        label: "Delaware Registered Agent",
        description: "Agent with physical DE address",
        required: true,
        category: "Contact Information"
      },
      {
        id: "file_number",
        label: "Delaware File Number",
        description: "7-digit file number from formation",
        required: true,
        category: "State Requirements"
      }
    ],
    suggestedItems: ["franchise_tax"],
    timeline: [
      {
        milestone: "Review Franchise Tax Calculation",
        owner: "Business Owner / CPA",
        offsetDays: -30,
        notes: "Calculate franchise tax based on authorized shares or assumed par value method"
      },
      {
        milestone: "Gather Delaware File Number",
        owner: "Business Owner",
        offsetDays: -21,
        notes: "Locate 7-digit file number from original Certificate"
      },
      {
        milestone: "Prepare Annual Report",
        owner: "Business Owner",
        offsetDays: -14,
        notes: "Complete report with current officer/director information"
      },
      {
        milestone: "Calculate Total Fees",
        owner: "Business Owner / CPA",
        offsetDays: -7,
        notes: "Annual report fee ($50 LLC / $50+ Corp) plus franchise tax"
      },
      {
        milestone: "File Online",
        owner: "Business Owner",
        offsetDays: -3,
        notes: "Submit via Delaware Division of Corporations online portal"
      },
      {
        milestone: "Delaware Deadline",
        owner: "DE Division of Corporations",
        offsetDays: 0,
        notes: "LLC: June 1 / Corp: March 1. Late penalty: $200 + monthly interest"
      }
    ],
    risks: [
      {
        risk: "Franchise Tax Miscalculation",
        severity: "Medium",
        likelihood: "Medium",
        mitigation: "Use Delaware tax calculator; consult CPA for complex capital structures"
      },
      {
        risk: "Late Filing Penalty ($200 + interest)",
        severity: "Medium",
        likelihood: "Low",
        mitigation: "File at least 2 weeks before deadline; set early reminders"
      },
      {
        risk: "Entity Voiding",
        severity: "High",
        likelihood: "Low",
        mitigation: "Never miss 3 consecutive years; maintain current registered agent"
      },
      {
        risk: "Payment Processing Delay",
        severity: "Low",
        likelihood: "Medium",
        mitigation: "Use credit card payment for instant processing; avoid checks near deadline"
      }
    ],
    links: [
      {
        label: "Delaware Division of Corporations",
        url: "https://corp.delaware.gov/",
        description: "Official filing portal and franchise tax calculator"
      }
    ]
  },

  // ============================================================================
  // STATE TAX REGISTRATION PROFILES
  // ============================================================================

  state_tax_registration_generic: {
    slug: "state_tax_registration_generic",
    name: "State Tax Registration (Generic)",
    scope: {
      filingTypes: ["State Tax Registration"],
      states: ["*"],
      entityTypes: ["LLC", "Corporation", "S-Corporation", "C-Corporation", "Sole Proprietorship", "Partnership"]
    },
    checklist: [
      {
        id: "ein",
        label: "Federal EIN",
        description: "Employer Identification Number from IRS",
        required: true,
        category: "Federal Documents"
      },
      {
        id: "articles",
        label: "Formation Documents",
        description: "Articles of Incorporation/Organization or DBA filing",
        required: true,
        category: "Business Documents"
      },
      {
        id: "business_address",
        label: "Physical Business Address",
        description: "Physical location in state (not PO Box)",
        required: true,
        category: "Location Information"
      },
      {
        id: "business_description",
        label: "Business Activity Description",
        description: "NAICS code and detailed description of operations",
        required: true,
        category: "Business Information"
      },
      {
        id: "start_date",
        label: "Business Start Date",
        description: "Date of first business activity in state",
        required: true,
        category: "Business Information"
      }
    ],
    suggestedItems: ["business_description", "start_date"],
    timeline: [
      {
        milestone: "Determine Tax Obligations",
        owner: "Business Owner / CPA",
        offsetDays: -30,
        notes: "Identify sales tax, use tax, payroll tax, and income tax requirements"
      },
      {
        milestone: "Gather Registration Documents",
        owner: "Business Owner",
        offsetDays: -21,
        notes: "Collect EIN, formation docs, NAICS code, business location details"
      },
      {
        milestone: "Complete Registration Application",
        owner: "Business Owner",
        offsetDays: -14,
        notes: "Fill out state tax agency registration forms online or paper"
      },
      {
        milestone: "Review for Accuracy",
        owner: "Business Owner / CPA",
        offsetDays: -7,
        notes: "Verify all tax types selected, addresses correct, and signatures obtained"
      },
      {
        milestone: "Submit Registration",
        owner: "Business Owner",
        offsetDays: -3,
        notes: "File with state tax agency; receive confirmation number"
      },
      {
        milestone: "Registration Deadline",
        owner: "State Tax Agency",
        offsetDays: 0,
        notes: "Register before starting taxable activities to avoid penalties"
      }
    ],
    risks: [
      {
        risk: "Late Registration Penalty",
        severity: "Medium",
        likelihood: "High",
        mitigation: "Register before first taxable transaction; retroactive registration may incur fines"
      },
      {
        risk: "Incorrect Tax Type Selection",
        severity: "Medium",
        likelihood: "Medium",
        mitigation: "Consult with CPA to identify all applicable tax obligations"
      },
      {
        risk: "Nexus Determination Error",
        severity: "High",
        likelihood: "Low",
        mitigation: "Review state nexus rules; consider economic nexus thresholds for remote sellers"
      },
      {
        risk: "Ongoing Compliance Burden",
        severity: "Medium",
        likelihood: "High",
        mitigation: "Set up quarterly/monthly filing calendar; consider using tax automation software"
      }
    ],
    links: [
      {
        label: "State Tax Agency Portal",
        url: "[Contact your state's Department of Revenue or Taxation]",
        description: "Official tax registration portal"
      }
    ]
  },

  state_tax_registration_ca: {
    slug: "state_tax_registration_ca",
    name: "State Tax Registration (California)",
    scope: {
      filingTypes: ["State Tax Registration"],
      states: ["California", "CA"],
      entityTypes: ["LLC", "Corporation", "S-Corporation", "C-Corporation", "Sole Proprietorship", "Partnership"]
    },
    checklist: [
      {
        id: "ein",
        label: "Federal EIN",
        description: "IRS Employer Identification Number",
        required: true,
        category: "Federal Documents"
      },
      {
        id: "articles",
        label: "CA Formation Documents",
        description: "Articles filed with California Secretary of State",
        required: true,
        category: "Business Documents"
      },
      {
        id: "cdtfa_account",
        label: "CDTFA Online Services Account",
        description: "Create account at onlineservices.cdtfa.ca.gov",
        required: true,
        category: "Registration Requirements"
      },
      {
        id: "naics_code",
        label: "NAICS Business Code",
        description: "6-digit code describing primary business activity",
        required: true,
        category: "Business Information"
      },
      {
        id: "seller_permit",
        label: "Seller's Permit Application",
        description: "Required if selling tangible goods in California",
        required: false,
        category: "Sales Tax"
      },
      {
        id: "use_tax",
        label: "Use Tax Registration",
        description: "Required for purchases of taxable items for business use",
        required: false,
        category: "Sales Tax"
      }
    ],
    suggestedItems: ["seller_permit", "use_tax"],
    timeline: [
      {
        milestone: "Determine Tax Nexus",
        owner: "Business Owner / CPA",
        offsetDays: -30,
        notes: "Confirm if physical presence or economic nexus exists in California"
      },
      {
        milestone: "Create CDTFA Account",
        owner: "Business Owner",
        offsetDays: -21,
        notes: "Register at onlineservices.cdtfa.ca.gov for online access"
      },
      {
        milestone: "Complete Registration Forms",
        owner: "Business Owner",
        offsetDays: -14,
        notes: "Fill CDTFA-101-DMV or online registration; select applicable tax types"
      },
      {
        milestone: "Gather Supporting Documents",
        owner: "Business Owner",
        offsetDays: -10,
        notes: "EIN confirmation, CA formation docs, lease or property deed"
      },
      {
        milestone: "Submit Registration",
        owner: "Business Owner",
        offsetDays: -5,
        notes: "File online or mail to CDTFA; processing takes 5-10 business days"
      },
      {
        milestone: "Begin Business Operations",
        owner: "Business Owner",
        offsetDays: 0,
        notes: "Must be registered before first taxable sale or use"
      }
    ],
    risks: [
      {
        risk: "Unregistered Sales (10% Penalty)",
        severity: "High",
        likelihood: "Medium",
        mitigation: "Register immediately upon establishing nexus; never delay for convenience"
      },
      {
        risk: "Security Deposit Requirement",
        severity: "Medium",
        likelihood: "Low",
        mitigation: "New businesses may owe deposit equal to estimated quarterly tax; plan cash flow accordingly"
      },
      {
        risk: "Incorrect Tax Type Selection",
        severity: "Medium",
        likelihood: "Medium",
        mitigation: "Consult CPA to identify sales tax, use tax, and special district tax obligations"
      },
      {
        risk: "Quarterly Filing Burden",
        severity: "Low",
        likelihood: "High",
        mitigation: "Set up automated reminders; consider POS system with tax calculation features"
      }
    ],
    links: [
      {
        label: "CDTFA Online Services",
        url: "https://onlineservices.cdtfa.ca.gov/",
        description: "California Department of Tax and Fee Administration portal"
      },
      {
        label: "Seller's Permit Information",
        url: "https://www.cdtfa.ca.gov/taxes-and-fees/sales-and-use-tax-permit.htm",
        description: "Requirements and application process"
      }
    ]
  },

  // ============================================================================
  // BOIR PROFILE
  // ============================================================================

  boir: {
    slug: "boir",
    name: "BOIR (Beneficial Ownership Information Report)",
    scope: {
      filingTypes: ["BOIR", "BOIR (Beneficial Ownership Information Report)"],
      states: ["*"],
      entityTypes: ["LLC", "Corporation", "S-Corporation", "C-Corporation"]
    },
    checklist: [
      {
        id: "beneficial_owners",
        label: "Beneficial Owner Information",
        description: "Name, DOB, address, ID for each person owning 25%+ or exercising substantial control",
        required: true,
        category: "Ownership Data"
      },
      {
        id: "company_applicant",
        label: "Company Applicant Details",
        description: "Person who filed formation documents (if formed after Jan 1, 2024)",
        required: false,
        category: "Formation Data"
      },
      {
        id: "identification_docs",
        label: "Government-Issued ID",
        description: "Driver's license, passport, or state ID for each beneficial owner",
        required: true,
        category: "Identification"
      },
      {
        id: "entity_info",
        label: "Entity Information",
        description: "Legal name, DBA, EIN, formation jurisdiction, and address",
        required: true,
        category: "Business Documents"
      },
      {
        id: "ownership_structure",
        label: "Ownership Structure Chart",
        description: "Diagram showing ownership percentages and control relationships",
        required: false,
        category: "Supporting Documents"
      }
    ],
    suggestedItems: ["ownership_structure", "identification_docs"],
    timeline: [
      {
        milestone: "Identify Beneficial Owners",
        owner: "Business Owner / Attorney",
        offsetDays: -30,
        notes: "List all individuals with 25%+ ownership or substantial control"
      },
      {
        milestone: "Collect ID Documents",
        owner: "Business Owner",
        offsetDays: -21,
        notes: "Obtain scan/photo of driver's license or passport for each owner"
      },
      {
        milestone: "Gather Entity Details",
        owner: "Business Owner",
        offsetDays: -14,
        notes: "Compile legal name, EIN, formation date, jurisdiction, and registered address"
      },
      {
        milestone: "Complete BOIR Form",
        owner: "Business Owner / Attorney",
        offsetDays: -7,
        notes: "Fill FinCEN BOIR form with all beneficial owner and entity data"
      },
      {
        milestone: "Review for Accuracy",
        owner: "Business Owner / Attorney",
        offsetDays: -3,
        notes: "Verify all names, DOBs, addresses, and ID numbers are correct"
      },
      {
        milestone: "File with FinCEN",
        owner: "Business Owner",
        offsetDays: 0,
        notes: "Submit electronically via FinCEN BOSS portal; deadline varies by formation date"
      }
    ],
    risks: [
      {
        risk: "Civil Penalty (Up to $500/day)",
        severity: "High",
        likelihood: "Medium",
        mitigation: "File before deadline; set early reminder 60 days out"
      },
      {
        risk: "Criminal Penalties (Willful Violation)",
        severity: "High",
        likelihood: "Low",
        mitigation: "Never intentionally omit beneficial owners; consult attorney if uncertain"
      },
      {
        risk: "Incomplete Ownership Disclosure",
        severity: "High",
        likelihood: "Medium",
        mitigation: "Review all ownership tiers; include indirect owners through trusts or entities"
      },
      {
        risk: "Failure to Update Changes",
        severity: "Medium",
        likelihood: "High",
        mitigation: "Update BOIR within 30 days of any ownership or control changes"
      }
    ],
    links: [
      {
        label: "FinCEN BOSS Portal",
        url: "https://www.fincen.gov/boi",
        description: "Official Beneficial Ownership Information Reporting portal"
      },
      {
        label: "BOIR Small Entity Compliance Guide",
        url: "https://www.fincen.gov/boi-faqs",
        description: "FAQs and exemptions"
      }
    ]
  },

  // ============================================================================
  // DBE / MBE CERTIFICATION PROFILE
  // ============================================================================

  dbe_mbe_certification: {
    slug: "dbe_mbe_certification",
    name: "DBE / MBE Certification",
    scope: {
      filingTypes: ["DBE Certification", "MBE Certification"],
      states: ["*"],
      entityTypes: ["LLC", "Corporation", "S-Corporation", "C-Corporation", "Sole Proprietorship"]
    },
    checklist: [
      {
        id: "personal_net_worth",
        label: "Personal Net Worth Statement",
        description: "Detailed financial statement showing assets, liabilities, and net worth under threshold",
        required: true,
        category: "Financial Documents"
      },
      {
        id: "tax_returns",
        label: "Business & Personal Tax Returns",
        description: "Last 3 years of filed tax returns (business and owner)",
        required: true,
        category: "Financial Documents"
      },
      {
        id: "ownership_proof",
        label: "Ownership Documentation",
        description: "Stock certificates, operating agreement, or partnership agreement showing 51%+ ownership",
        required: true,
        category: "Ownership Proof"
      },
      {
        id: "control_proof",
        label: "Control Documentation",
        description: "Resolutions, bylaws, or agreements showing operational control by disadvantaged owner",
        required: true,
        category: "Control Proof"
      },
      {
        id: "citizenship_proof",
        label: "Citizenship/Residency Proof",
        description: "Birth certificate, passport, or naturalization papers",
        required: true,
        category: "Identification"
      },
      {
        id: "industry_expertise",
        label: "Industry Expertise Evidence",
        description: "Resume, licenses, prior work history demonstrating sector knowledge",
        required: false,
        category: "Qualifications"
      }
    ],
    suggestedItems: ["industry_expertise", "control_proof"],
    timeline: [
      {
        milestone: "Review Eligibility Requirements",
        owner: "Business Owner / Consultant",
        offsetDays: -90,
        notes: "Confirm 51% ownership by disadvantaged individual; verify net worth limits"
      },
      {
        milestone: "Gather Financial Documents",
        owner: "Business Owner / CPA",
        offsetDays: -75,
        notes: "Collect 3 years tax returns, personal net worth statement, bank statements"
      },
      {
        milestone: "Compile Ownership Proof",
        owner: "Business Owner / Attorney",
        offsetDays: -60,
        notes: "Assemble stock certificates, operating agreement, formation documents"
      },
      {
        milestone: "Document Control",
        owner: "Business Owner / Attorney",
        offsetDays: -45,
        notes: "Prepare affidavits, resolutions, and organizational charts showing operational control"
      },
      {
        milestone: "Complete Certification Application",
        owner: "Business Owner / Consultant",
        offsetDays: -30,
        notes: "Fill state-specific DBE/MBE application with supporting documentation"
      },
      {
        milestone: "Submit Application",
        owner: "Business Owner",
        offsetDays: -14,
        notes: "File with state DOT or certification agency; typical review: 60-90 days"
      },
      {
        milestone: "Application Deadline",
        owner: "Certification Agency",
        offsetDays: 0,
        notes: "No statutory deadline, but allow 90+ days before bid submission needs"
      }
    ],
    risks: [
      {
        risk: "Application Denial (Insufficient Control)",
        severity: "High",
        likelihood: "Medium",
        mitigation: "Document day-to-day management; avoid nominee arrangements or passive ownership"
      },
      {
        risk: "Net Worth Exceeds Threshold",
        severity: "High",
        likelihood: "Low",
        mitigation: "Calculate net worth carefully; exclude primary residence equity per federal rules"
      },
      {
        risk: "Incomplete Documentation",
        severity: "Medium",
        likelihood: "High",
        mitigation: "Use certification consultant; prepare comprehensive evidence package upfront"
      },
      {
        risk: "Onsite Visit Findings",
        severity: "Medium",
        likelihood: "Medium",
        mitigation: "Ensure physical business location, equipment, and staff demonstrate operational control"
      }
    ],
    links: [
      {
        label: "State DBE Certification Office",
        url: "[Contact your state Department of Transportation]",
        description: "State-specific DBE certification program"
      },
      {
        label: "Federal DBE Program Overview",
        url: "https://www.transportation.gov/civil-rights/disadvantaged-business-enterprise",
        description: "USDOT DBE program guidance"
      }
    ]
  },

  // ============================================================================
  // SAM REGISTRATION PROFILE
  // ============================================================================

  sam_registration: {
    slug: "sam_registration",
    name: "SAM.gov Registration",
    scope: {
      filingTypes: ["SAM Registration", "SAM.gov Registration"],
      states: ["*"],
      entityTypes: ["LLC", "Corporation", "S-Corporation", "C-Corporation", "Sole Proprietorship", "Partnership"]
    },
    checklist: [
      {
        id: "ein",
        label: "EIN (Employer Identification Number)",
        description: "Federal tax ID from IRS",
        required: true,
        category: "Federal Documents"
      },
      {
        id: "duns",
        label: "UEI (Unique Entity Identifier)",
        description: "Formerly DUNS number; now auto-assigned by SAM.gov",
        required: true,
        category: "Federal Documents"
      },
      {
        id: "bank_account",
        label: "Bank Account Information",
        description: "Routing and account numbers for electronic funds transfer",
        required: true,
        category: "Financial Information"
      },
      {
        id: "naics_codes",
        label: "NAICS Codes (up to 10)",
        description: "6-digit codes describing your business capabilities",
        required: true,
        category: "Business Information"
      },
      {
        id: "psc_codes",
        label: "Product/Service Codes",
        description: "Federal PSC codes matching your offerings",
        required: false,
        category: "Business Information"
      },
      {
        id: "executive_info",
        label: "Executive Compensation Data",
        description: "Names and compensation for top 5 executives (if >$25k federal revenue)",
        required: false,
        category: "Financial Information"
      },
      {
        id: "reps_certs",
        label: "Representations & Certifications",
        description: "Annual certifications about business size, ownership, and compliance",
        required: true,
        category: "Compliance"
      }
    ],
    suggestedItems: ["psc_codes", "executive_info"],
    timeline: [
      {
        milestone: "Obtain EIN",
        owner: "Business Owner",
        offsetDays: -45,
        notes: "Apply for EIN via IRS if not already obtained"
      },
      {
        milestone: "Create SAM.gov Account",
        owner: "Business Owner",
        offsetDays: -30,
        notes: "Register at SAM.gov; receive UEI assignment (replaces DUNS)"
      },
      {
        milestone: "Gather Bank & Tax Info",
        owner: "Business Owner / CPA",
        offsetDays: -21,
        notes: "Collect bank routing/account, tax returns, and financial statements"
      },
      {
        milestone: "Select NAICS & PSC Codes",
        owner: "Business Owner",
        offsetDays: -14,
        notes: "Identify up to 10 NAICS codes that match capabilities; prioritize primary code"
      },
      {
        milestone: "Complete SAM Registration",
        owner: "Business Owner",
        offsetDays: -7,
        notes: "Fill entity profile, NAICS codes, banking info, and reps & certs"
      },
      {
        milestone: "Submit & Await Validation",
        owner: "SAM.gov / IRS",
        offsetDays: 0,
        notes: "Initial registration takes 7-10 days for IRS TIN validation"
      },
      {
        milestone: "Registration Active",
        owner: "Business Owner",
        offsetDays: 10,
        notes: "Status changes to Active; eligible to bid on federal contracts"
      }
    ],
    risks: [
      {
        risk: "TIN Validation Failure",
        severity: "High",
        likelihood: "Medium",
        mitigation: "Verify EIN matches IRS records exactly; resolve any IRS discrepancies first"
      },
      {
        risk: "Annual Renewal Lapse",
        severity: "High",
        likelihood: "High",
        mitigation: "Registration expires annually; set calendar reminder 60 days before expiration"
      },
      {
        risk: "Incorrect NAICS Code Selection",
        severity: "Medium",
        likelihood: "Medium",
        mitigation: "Research NAICS carefully; primary code affects small business size standards"
      },
      {
        risk: "Incomplete Reps & Certs",
        severity: "Medium",
        likelihood: "Medium",
        mitigation: "Answer all certification questions; update annually or when circumstances change"
      }
    ],
    links: [
      {
        label: "SAM.gov Registration Portal",
        url: "https://sam.gov/",
        description: "Official System for Award Management"
      },
      {
        label: "NAICS Code Lookup",
        url: "https://www.census.gov/naics/",
        description: "Search and identify appropriate business codes"
      }
    ]
  }
};

// Profile resolver function
function resolveFilingProfile(filingType, jurisdiction, entityType) {
  // Normalize inputs
  const normalizedFiling = (filingType || "").toLowerCase().trim();
  const normalizedJurisdiction = (jurisdiction || "").toLowerCase().trim();
  const normalizedEntity = (entityType || "").toLowerCase().trim();

  // Build profile key search order (most specific to generic)
  const searchKeys = [];
  
  // Check for specific filing type + jurisdiction combinations
  if (normalizedFiling.includes("annual report")) {
    if (normalizedJurisdiction.includes("california") || normalizedJurisdiction === "ca") {
      searchKeys.push("annual_report_ca");
    }
    if (normalizedJurisdiction.includes("delaware") || normalizedJurisdiction === "de") {
      searchKeys.push("annual_report_de");
    }
    searchKeys.push("annual_report_generic");
  }
  
  if (normalizedFiling.includes("state tax") || normalizedFiling.includes("tax registration")) {
    if (normalizedJurisdiction.includes("california") || normalizedJurisdiction === "ca") {
      searchKeys.push("state_tax_registration_ca");
    }
    searchKeys.push("state_tax_registration_generic");
  }
  
  if (normalizedFiling.includes("boir") || normalizedFiling.includes("beneficial ownership")) {
    searchKeys.push("boir");
  }
  
  if (normalizedFiling.includes("dbe") || normalizedFiling.includes("mbe") || normalizedFiling.includes("certification")) {
    searchKeys.push("dbe_mbe_certification");
  }
  
  if (normalizedFiling.includes("sam") || normalizedFiling.includes("sam.gov")) {
    searchKeys.push("sam_registration");
  }

  // Return first matching profile
  for (const key of searchKeys) {
    if (FILING_PROFILES[key]) {
      return {
        profile: FILING_PROFILES[key],
        isGeneric: key.includes("_generic"),
        matchType: key.includes("_generic") ? "generic" : "specific"
      };
    }
  }

  // No profile found
  return null;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.FILING_PROFILES = FILING_PROFILES;
  window.resolveFilingProfile = resolveFilingProfile;
}
