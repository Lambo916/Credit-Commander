// CompliPilot Compliance Intelligence Generator
// Deterministic structure generation using filing profiles

class ComplianceGenerator {
    constructor() {
        this.profiles = window.FILING_PROFILES || {};
        this.resolver = window.resolveFilingProfile || (() => null);
    }

    // Main generation method
    async generate(formData) {
        // Resolve the appropriate filing profile
        const profileMatch = this.resolver(
            formData.filingType,
            formData.jurisdiction,
            formData.entityType
        );

        if (!profileMatch) {
            throw new Error("Unable to find matching filing profile");
        }

        const { profile, isGeneric, matchType } = profileMatch;

        // Build structured output using profile data
        const sections = {
            executiveSummary: this.generateExecutiveSummary(formData, profile),
            requirementsChecklist: this.generateChecklist(formData, profile),
            timeline: this.generateTimeline(formData, profile),
            riskMatrix: this.generateRiskMatrix(formData, profile),
            recommendations: this.generateRecommendations(formData, profile),
            references: this.generateReferences(profile)
        };

        // Format as markdown
        const output = this.formatOutput(sections);

        return {
            output,
            profileUsed: profile.name,
            isGeneric,
            matchType,
            sections
        };
    }

    // ========================================================================
    // SECTION 1: Executive Compliance Summary
    // ========================================================================
    generateExecutiveSummary(formData, profile) {
        const entityDisplay = formData.entityName 
            ? `${formData.entityName} (${formData.entityType})`
            : formData.entityType;

        const jurisdictionDisplay = formData.jurisdiction || "[Jurisdiction]";
        const deadlineDisplay = formData.deadline 
            ? this.formatDate(new Date(formData.deadline))
            : "[Deadline pending]";

        // Build 2-paragraph summary
        const para1 = `This compliance report addresses the ${formData.filingType} requirement for ${entityDisplay}, operating in ${jurisdictionDisplay}. This filing ensures your business maintains good standing with regulatory authorities and preserves liability protections, operational privileges, and legal status.`;

        const para2 = `Your filing deadline is ${deadlineDisplay}. Late submission may result in penalties, loss of good standing, or administrative dissolution. This report provides a structured roadmap including required documents, key milestones, risk mitigation strategies, and actionable next steps to ensure timely and compliant submission.`;

        return `${para1}\n\n${para2}`;
    }

    // ========================================================================
    // SECTION 2: Requirements Checklist
    // ========================================================================
    generateChecklist(formData, profile) {
        const items = [];
        const userSelected = new Set(formData.requirements || []);

        // Add all profile checklist items
        profile.checklist.forEach(item => {
            const isSelected = userSelected.has(item.id) || 
                               userSelected.has(item.label) ||
                               Array.from(userSelected).some(sel => 
                                   sel.toLowerCase().includes(item.label.toLowerCase().substring(0, 10))
                               );
            
            const isSuggested = !isSelected && profile.suggestedItems?.includes(item.id);
            
            const checkbox = isSelected ? "✓" : "□";
            const badge = isSuggested ? " (Suggested by CompliPilot)" : "";
            const reqLabel = item.required ? " *" : "";
            
            items.push({
                checkbox,
                label: item.label + reqLabel + badge,
                description: item.description,
                category: item.category
            });
        });

        return items;
    }

    // ========================================================================
    // SECTION 3: Timeline
    // ========================================================================
    generateTimeline(formData, profile) {
        if (!formData.deadline) {
            return [{
                milestone: "[Timeline unavailable]",
                owner: "[Pending]",
                due: "[Deadline required]",
                notes: "Please provide filing deadline to generate timeline"
            }];
        }

        const deadlineDate = new Date(formData.deadline);
        const timeline = [];

        profile.timeline.forEach(item => {
            const dueDate = new Date(deadlineDate);
            dueDate.setDate(dueDate.getDate() + item.offsetDays);
            
            timeline.push({
                milestone: item.milestone,
                owner: item.owner,
                due: this.formatDate(dueDate),
                notes: item.notes
            });
        });

        return timeline;
    }

    // ========================================================================
    // SECTION 4: Risk Matrix
    // ========================================================================
    generateRiskMatrix(formData, profile) {
        const risks = [];

        // Add user-provided risk first if present
        if (formData.risks && formData.risks.trim()) {
            risks.push({
                risk: formData.risks.substring(0, 100),
                severity: "Medium",
                likelihood: "Medium",
                mitigation: formData.mitigation || "Review with compliance advisor"
            });
        }

        // Add profile risks
        profile.risks.forEach(risk => {
            risks.push({
                risk: risk.risk,
                severity: risk.severity,
                likelihood: risk.likelihood,
                mitigation: risk.mitigation
            });
        });

        // Ensure minimum 1 row (with placeholder if needed)
        if (risks.length === 0) {
            risks.push({
                risk: "[Pending Input]",
                severity: "[Pending Input]",
                likelihood: "[Pending Input]",
                mitigation: "[Pending Input]"
            });
        }

        return risks;
    }

    // ========================================================================
    // SECTION 5: Recommendations
    // ========================================================================
    generateRecommendations(formData, profile) {
        const recs = [];
        const hasDeadline = formData.deadline;
        const jurisdictionKnown = formData.jurisdiction;

        // Dynamic recommendations based on context
        recs.push({
            number: 1,
            action: "Create compliance calendar",
            detail: `Add all timeline milestones to your calendar with email/SMS reminders. Set first reminder ${hasDeadline ? '30 days before deadline' : 'immediately upon setting deadline'}.`
        });

        recs.push({
            number: 2,
            action: "Assign ownership and accountability",
            detail: "Designate a responsible party for each checklist item and timeline milestone. For external tasks (CPA, attorney), confirm availability now."
        });

        if (jurisdictionKnown && profile.links && profile.links.length > 0) {
            recs.push({
                number: 3,
                action: "Set up portal access",
                detail: `Create account at ${profile.links[0].label} if not already registered. Confirm login credentials and payment methods are current.`
            });
        } else {
            recs.push({
                number: 3,
                action: "Identify filing portal",
                detail: "Research official state/federal portal for online filing. Create account and verify accepted payment methods."
            });
        }

        recs.push({
            number: 4,
            action: "Pre-review all documents",
            detail: "Conduct internal review of all checklist items 14 days before deadline. Verify accuracy, completeness, and consistency across documents."
        });

        recs.push({
            number: 5,
            action: "Confirm acceptance and retain proof",
            detail: "After submission, save confirmation number, receipt, and filed documents. Verify processing within 5-7 business days and follow up if no acknowledgment received."
        });

        return recs;
    }

    // ========================================================================
    // SECTION 6: References
    // ========================================================================
    generateReferences(profile) {
        return {
            links: profile.links || [],
            disclaimer: "This report is for informational purposes only and does not constitute legal, tax, or financial advice. Consult with licensed professionals for guidance specific to your situation."
        };
    }

    // ========================================================================
    // OUTPUT FORMATTING
    // ========================================================================
    formatOutput(sections) {
        let markdown = "";

        // Section 1: Executive Summary
        markdown += "# Executive Compliance Summary\n\n";
        markdown += sections.executiveSummary + "\n\n";
        markdown += "---\n\n";

        // Section 2: Requirements Checklist
        markdown += "## Filing Requirements Checklist\n\n";
        let currentCategory = "";
        sections.requirementsChecklist.forEach(item => {
            if (item.category && item.category !== currentCategory) {
                if (currentCategory) markdown += "\n";
                markdown += `**${item.category}:**\n`;
                currentCategory = item.category;
            }
            markdown += `${item.checkbox} **${item.label}**\n`;
            markdown += `   ${item.description}\n\n`;
        });
        markdown += "---\n\n";

        // Section 3: Timeline
        markdown += "## Compliance Timeline\n\n";
        markdown += "| Milestone | Owner | Due Date | Notes |\n";
        markdown += "|-----------|-------|----------|-------|\n";
        sections.timeline.forEach(item => {
            markdown += `| ${item.milestone} | ${item.owner} | ${item.due} | ${item.notes} |\n`;
        });
        markdown += "\n---\n\n";

        // Section 4: Risk Matrix
        markdown += "## Risk Matrix\n\n";
        markdown += "| Risk | Severity | Likelihood | Mitigation |\n";
        markdown += "|------|----------|------------|------------|\n";
        sections.riskMatrix.forEach(risk => {
            markdown += `| ${risk.risk} | ${risk.severity} | ${risk.likelihood} | ${risk.mitigation} |\n`;
        });
        markdown += "\n---\n\n";

        // Section 5: Recommendations
        markdown += "## Strategic Recommendations\n\n";
        sections.recommendations.forEach(rec => {
            markdown += `${rec.number}. **${rec.action}**\n`;
            markdown += `   ${rec.detail}\n\n`;
        });
        markdown += "---\n\n";

        // Section 6: References
        markdown += "## Official References\n\n";
        if (sections.references.links.length > 0) {
            sections.references.links.forEach(link => {
                markdown += `- **${link.label}**: [${link.url}](${link.url})\n`;
                markdown += `  ${link.description}\n\n`;
            });
        } else {
            markdown += "*Contact your state or federal agency for official filing portals.*\n\n";
        }
        markdown += `**Disclaimer:** ${sections.references.disclaimer}\n`;

        return markdown;
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================
    formatDate(date) {
        if (!date || !(date instanceof Date) || isNaN(date)) {
            return "[Date pending]";
        }
        
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.ComplianceGenerator = ComplianceGenerator;
}
