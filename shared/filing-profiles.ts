// CompliPilot Filing Profiles - Shared Knowledge Base
// Used by both backend (intelligence merge) and frontend (display)

export interface FilingProfile {
  slug: string;
  name: string;
  scope: {
    filingTypes: string[];
    states: string[];
    entityTypes: string[];
  };
  checklist: Array<{
    id: string;
    label: string;
    description: string;
    required: boolean;
    category: string;
  }>;
  timeline: Array<{
    milestone: string;
    owner: string;
    offsetDays: number;
    notes: string;
  }>;
  risks: Array<{
    risk: string;
    severity: string;
    likelihood: string;
    mitigation: string;
  }>;
  links: Array<{
    label: string;
    url: string;
    description: string;
  }>;
}

export const FILING_PROFILES: Record<string, FilingProfile> = {
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
        severity: "High",
        likelihood: "Medium",
        mitigation: "File at least 1 week early; set multiple calendar reminders"
      },
      {
        risk: "Entity Suspension by CA SOS",
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
      },
      {
        label: "CA Secretary of State Business Programs",
        url: "https://www.sos.ca.gov/business-programs/",
        description: "General business filing information"
      }
    ]
  },

  annual_report_generic: {
    slug: "annual_report_generic",
    name: "Annual Report (Generic)",
    scope: {
      filingTypes: ["Annual Report"],
      states: ["*"],
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
        description: "Official filing portal for your jurisdiction"
      }
    ]
  }
};

// Helper: Resolve profile by filing type + jurisdiction
export function resolveProfile(
  filingType: string, 
  jurisdiction: string, 
  entityType: string
): FilingProfile | null {
  const normalized = {
    filing: (filingType || '').toLowerCase().trim(),
    jurisdiction: (jurisdiction || '').toLowerCase().trim(),
    entity: (entityType || '').toLowerCase().trim()
  };

  // Try jurisdiction-specific match first
  if (normalized.filing.includes('annual')) {
    const caKeys = ['california', 'ca'];
    if (caKeys.some(k => normalized.jurisdiction.includes(k))) {
      return FILING_PROFILES.annual_report_ca;
    }
  }

  // Fallback to generic
  if (normalized.filing.includes('annual')) {
    return FILING_PROFILES.annual_report_generic;
  }

  return null;
}
