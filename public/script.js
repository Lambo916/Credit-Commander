/**
 * Credit Commander - Unified Rendering Architecture
 * Panel = PDF with checksum verification
 */

// Initialize toolkit configuration for PDF exports
window.currentToolkitName = "Credit Commander";
window.currentToolkitLogo = null;  // TODO: Add Credit Commander logo asset

// =====================================================
// THEME MANAGER (GG v3 with data-theme attribute)
// =====================================================
function initTheme() {
    const saved = localStorage.getItem('cc-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeButton(theme);
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cc-theme', next);
    updateThemeButton(next);
}

function updateThemeButton(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        // Use moon icon for dark theme, sun icon for light theme
        themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

// Initialize theme on page load
initTheme();

// Bind theme toggle button
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
});

class ThemeManager {
    constructor() {
        // Legacy compatibility - now handled by global functions
        this.init();
    }
    
    init() {
        // Theme already initialized by initTheme()
    }
}

// =====================================================
// COMPLIANCE TOOLKIT - UNIFIED RENDERING SYSTEM
// =====================================================
class ComplianceToolkit {
    constructor() {
        this.currentResult = null;
        this.auth = window.supabaseAuth || null;
        this.ownerId = this.getOrCreateOwnerId(); // Keep for backwards compatibility
        this.init();
    }

    // ========================================================
    // AUTHENTICATION HEADERS
    // ========================================================
    getAuthHeaders() {
        // Use Supabase auth if available, fallback to ownerId
        if (this.auth) {
            return this.auth.getAuthHeaders();
        }
        
        // Fallback for backwards compatibility
        return this.ownerId ? { 'X-Owner-Id': this.ownerId } : {};
    }

    // ========================================================
    // OWNER ID MANAGEMENT (Guest Ownership - Backwards Compatibility)
    // ========================================================
    getOrCreateOwnerId() {
        let ownerId = localStorage.getItem('ybg_owner_id');
        if (!ownerId) {
            // Generate UUID v4
            ownerId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem('ybg_owner_id', ownerId);
        }
        return ownerId;
    }

    init() {
        this.bindFormSubmit();
        this.bindActions();
        this.bindDropdownMenus();
        this.loadCurrentResult();
        this.initKpiTooltips();
        this.initFundingSimulator();
        this.initExplanationModal();
        
        // Restore form data after a brief delay to ensure DOM is fully ready
        setTimeout(() => {
            this.restoreFormData();
            this.bindFormPersistence();
        }, 100);
    }

    // ========================================================
    // INTERACTIVE KPI DASHBOARD
    // ========================================================
    getKpiStatus(type, value) {
        let percent, status;
        const guidance = {
            utilization: (v) => {
                if (v < 30) return `Excellent! Your ${v}% utilization is in the healthy range. Keep it below 30% to maximize your credit score.`;
                if (v < 50) return `Your ${v}% utilization is moderate. Aim to pay down balances to get below 30% for optimal credit health.`;
                return `Critical: ${v}% utilization is high. Immediately pay down credit balances below 30% to avoid score damage.`;
            },
            tradelines: (v) => {
                if (v >= 5) return `Great! You have ${v} trade lines, which provides strong credit diversity. Maintain these relationships.`;
                if (v >= 3) return `You have ${v} trade lines. Target 5+ active lines by opening vendor accounts (Uline, Quill, Grainger) to strengthen your profile.`;
                return `Priority action: With only ${v} trade line(s), immediately open starter vendor accounts (Office Depot, Staples, Uline) to build credit history.`;
            },
            fico: (v) => {
                if (v >= 680) return `Strong! Your ${v} FICO score qualifies for prime business credit. You can pursue premium cards and higher limits.`;
                if (v >= 620) return `Fair score at ${v}. Focus on payment history and utilization to reach 680+ for better terms and approvals.`;
                return `Your ${v} FICO needs immediate attention. Prioritize: dispute errors, pay down high balances, and avoid new hard inquiries.`;
            }
        };

        // Normalize each metric so healthy threshold = 100%
        if (type === 'utilization') {
            // Lower is better: 0-30% = 100%, 30-50% declines to 10%, 50%+ near 0%
            if (value <= 30) {
                percent = 100;
                status = 'healthy';
            } else if (value <= 50) {
                // Linear decline from 100% at 30% to 10% at 50%
                percent = 100 - ((value - 30) / 20) * 90;
                status = 'warning';
            } else {
                // Linear decline from 10% at 50% to 0% at 100%
                percent = Math.max(0, 10 - ((value - 50) / 50) * 10);
                status = 'danger';
            }
        } else if (type === 'tradelines') {
            // Higher is better: 5+ = 100%, <5 = proportional
            if (value >= 5) {
                percent = 100;
                status = 'healthy';
            } else if (value >= 3) {
                percent = (value / 5) * 100;
                status = 'warning';
            } else {
                percent = (value / 5) * 100;
                status = 'danger';
            }
        } else if (type === 'fico') {
            // Higher is better: 680+ = 100%, <680 = proportional from 300-680
            if (value >= 680) {
                percent = 100;
                status = 'healthy';
            } else if (value >= 620) {
                percent = ((value - 300) / (680 - 300)) * 100;
                status = 'warning';
            } else {
                percent = ((value - 300) / (680 - 300)) * 100;
                status = 'danger';
            }
        } else {
            return null;
        }

        return {
            percent: Math.max(0, Math.min(100, percent)),
            status,
            guidance: guidance[type](value)
        };
    }

    initKpiTooltips() {
        // Create tooltip overlay
        const overlay = document.createElement('div');
        overlay.className = 'kpi-tooltip-overlay';
        overlay.id = 'kpiTooltipOverlay';
        overlay.innerHTML = `
            <div class="kpi-tooltip-content">
                <div class="kpi-tooltip-header">
                    <div class="kpi-tooltip-title" id="tooltipTitle"></div>
                    <button class="kpi-tooltip-close" id="tooltipClose" aria-label="Close">&times;</button>
                </div>
                <div class="kpi-tooltip-body">
                    <div id="tooltipGuidance"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close handlers
        const closeBtn = overlay.querySelector('#tooltipClose');
        closeBtn.addEventListener('click', () => this.hideKpiTooltip());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.hideKpiTooltip();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideKpiTooltip();
        });

        // Bind KPI card clicks
        const cards = document.querySelectorAll('.kpi-card-interactive');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const kpiType = card.getAttribute('data-kpi');
                this.showKpiTooltip(kpiType);
            });
        });
    }

    showKpiTooltip(type) {
        if (!this.currentResult) return;

        const titles = {
            utilization: 'Credit Utilization Strategy',
            tradelines: 'Trade Lines Growth Plan',
            fico: 'FICO Score Improvement'
        };

        const values = {
            utilization: this.currentResult.payload.utilization,
            tradelines: this.currentResult.payload.tradeLines,
            fico: this.currentResult.payload.ownerFico
        };

        const status = this.getKpiStatus(type, values[type]);
        if (!status) return;

        document.getElementById('tooltipTitle').textContent = titles[type];
        document.getElementById('tooltipGuidance').innerHTML = `
            <div class="kpi-tooltip-guidance">
                ${status.guidance}
            </div>
        `;

        document.getElementById('kpiTooltipOverlay').classList.add('active');
    }

    hideKpiTooltip() {
        document.getElementById('kpiTooltipOverlay').classList.remove('active');
    }

    // ========================================================
    // EXPLAIN MY REPORT FEATURE
    // ========================================================
    initExplanationModal() {
        // Create explanation modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'explanation-modal-overlay';
        overlay.id = 'explanationModalOverlay';
        overlay.innerHTML = `
            <div class="explanation-modal-content">
                <div class="explanation-modal-header">
                    <div class="explanation-modal-title">Your Roadmap Explained</div>
                    <button class="explanation-modal-close" id="explanationClose" aria-label="Close">&times;</button>
                </div>
                <div id="explanationBody"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close handlers
        const closeBtn = overlay.querySelector('#explanationClose');
        closeBtn.addEventListener('click', () => this.hideExplanationModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.hideExplanationModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideExplanationModal();
        });

        // Bind explain button
        const explainBtn = document.getElementById('explainBtn');
        if (explainBtn) {
            explainBtn.addEventListener('click', () => this.handleExplainReport());
        }
    }

    async handleExplainReport() {
        if (!this.currentResult || !this.currentResult.roadmap) {
            console.warn('Cannot explain report: missing roadmap data');
            return;
        }

        const explanationBody = document.getElementById('explanationBody');
        if (!explanationBody) return;

        // Check cache first
        if (this.currentResult.explanation) {
            this.displayExplanation(this.currentResult.explanation);
            return;
        }

        // Show loading state
        explanationBody.innerHTML = `
            <div class="explanation-loading">
                <div class="explanation-loading-spinner"></div>
                <div>Generating your personalized explanation...</div>
            </div>
        `;
        document.getElementById('explanationModalOverlay').classList.add('active');

        try {
            const response = await fetch('/api/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roadmap: this.currentResult.roadmap,
                    formData: this.currentResult.payload
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate explanation');
            }

            const data = await response.json();
            const explanation = data.explanation;

            // Cache explanation with current result
            this.currentResult.explanation = explanation;
            this.saveCurrentResult();

            // Display explanation
            this.displayExplanation(explanation);

        } catch (error) {
            console.error('Error generating explanation:', error);
            explanationBody.innerHTML = `
                <div class="explanation-section">
                    <div class="explanation-section-title">Error</div>
                    <div class="explanation-section-content">
                        ${error.message || 'Failed to generate explanation. Please try again.'}
                    </div>
                    <div style="margin-top: 16px;">
                        <button class="cc-btn cc-btn--secondary" onclick="document.getElementById('explanationModalOverlay').classList.remove('active')">Close</button>
                        <button class="cc-btn cc-btn--primary" onclick="window.complianceToolkit.handleExplainReport()" style="margin-left: 8px;">Retry</button>
                    </div>
                </div>
            `;
        }
    }

    displayExplanation(explanation) {
        const explanationBody = document.getElementById('explanationBody');
        if (!explanationBody) return;

        explanationBody.innerHTML = `
            <div class="explanation-section">
                <div class="explanation-section-title">Key Takeaways</div>
                <div class="explanation-section-content">${explanation.keyTakeaways || 'N/A'}</div>
            </div>
            
            <div class="explanation-section">
                <div class="explanation-section-title">Priority Actions</div>
                <div class="explanation-section-content">${explanation.priorityActions || 'N/A'}</div>
            </div>
            
            <div class="explanation-section">
                <div class="explanation-section-title">Your Timeline</div>
                <div class="explanation-section-content">${explanation.timeline || 'N/A'}</div>
            </div>
            
            <div class="explanation-section">
                <div class="explanation-section-title">Bottom Line</div>
                <div class="explanation-section-content">${explanation.bottomLine || 'N/A'}</div>
            </div>
        `;

        document.getElementById('explanationModalOverlay').classList.add('active');
    }

    hideExplanationModal() {
        const overlay = document.getElementById('explanationModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // ========================================================
    // FORM PERSISTENCE (localStorage cc-form)
    // ========================================================
    saveFormData() {
        const formData = {
            businessName: document.getElementById('businessName')?.value || '',
            ein: document.getElementById('ein')?.value || '',
            entityType: document.getElementById('entityType')?.value || '',
            state: document.getElementById('state')?.value || '',
            startDate: document.getElementById('startDate')?.value || '',
            utilization: document.getElementById('utilization')?.value || '',
            tradeLines: document.getElementById('tradeLines')?.value || '',
            annualRevenue: document.getElementById('annualRevenue')?.value || '',
            latePayments: document.getElementById('latePayments')?.value || '',
            derogatories: document.getElementById('derogatories')?.value || '',
            ownerFico: document.getElementById('ownerFico')?.value || '',
            creditHistory: document.getElementById('creditHistory')?.value || '',
            fundingGoal: document.getElementById('fundingGoal')?.value || '',
            targetLimit: document.getElementById('targetLimit')?.value || '',
            timeframe: document.getElementById('timeframe')?.value || ''
        };
        localStorage.setItem('cc-form', JSON.stringify(formData));
    }

    restoreFormData() {
        try {
            const savedData = localStorage.getItem('cc-form');
            if (!savedData) {
                console.log('[Form] No saved form data found');
                return;
            }
            
            const formData = JSON.parse(savedData);
            let restoredCount = 0;
            
            Object.keys(formData).forEach(key => {
                const element = document.getElementById(key);
                if (!element) {
                    console.warn(`[Form] Element not found: ${key}`);
                    return;
                }
                if (formData[key]) {
                    element.value = formData[key];
                    restoredCount++;
                }
            });
            
            console.log(`[Form] Restored ${restoredCount} form fields from localStorage`);
        } catch (error) {
            console.error('[Form] Error restoring form data:', error);
        }
    }

    bindFormPersistence() {
        const formIds = [
            'businessName', 'ein', 'entityType', 'state', 'startDate',
            'utilization', 'tradeLines', 'annualRevenue', 'latePayments',
            'derogatories', 'ownerFico', 'creditHistory', 'fundingGoal',
            'targetLimit', 'timeframe'
        ];
        
        formIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.saveFormData());
                element.addEventListener('input', () => this.saveFormData());
            }
        });
    }

    // ========================================================
    // SMOOTH SCROLLING
    // ========================================================
    scrollToResults() {
        const resultsPanel = document.querySelector('.results-panel');
        if (resultsPanel) {
            resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // ========================================================
    // USAGE TRACKING (30-report soft launch limit)
    // ========================================================
    async checkUsageLimit() {
        try {
            const response = await fetch('/api/usage/check');
            if (!response.ok) {
                console.warn('[Usage] Check failed, allowing generation');
                return { allowed: true, count: 0 };
            }
            const data = await response.json();
            console.log(`[Usage] Current count: ${data.reportCount}/${data.limit}`);
            return {
                allowed: !data.hasReachedLimit,
                count: data.reportCount,
                limit: data.limit
            };
        } catch (error) {
            console.error('[Usage] Check error:', error);
            return { allowed: true, count: 0 }; // Fail open
        }
    }

    async incrementUsage() {
        try {
            const response = await fetch('/api/usage/increment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                console.log(`[Usage] Incremented to ${data.reportCount}/${data.limit}`);
                return data;
            }
        } catch (error) {
            console.error('[Usage] Increment error:', error);
        }
    }

    showLimitReachedAlert(count, limit) {
        const message = `You've reached your ${limit}-report limit for the Credit Commander soft launch.`;
        const upgradeUrl = 'https://creditcommander.com/checkout'; // TODO: Replace with actual checkout URL
        
        // Create modal alert
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 32px;
                max-width: 500px;
                text-align: center;
            ">
                <h2 style="color: var(--text-primary); margin-bottom: 16px;">Report Limit Reached</h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">${message}</p>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    Please upgrade or purchase additional access to continue generating compliance reports.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <a href="${upgradeUrl}" target="_blank" style="
                        background: var(--ybg-brand-primary);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 6px;
                        text-decoration: none;
                        font-weight: 600;
                    ">Upgrade Now ($97)</a>
                    <button id="closeLimit" style="
                        background: transparent;
                        border: 1px solid var(--border-color);
                        color: var(--text-primary);
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('#closeLimit');
        const handleClose = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn?.addEventListener('click', handleClose);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) handleClose();
        });
    }

    // ========================================================
    // CHECKSUM (djb2 hash for Panel=PDF verification)
    // ========================================================
    checksum(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        }
        return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
    }

    // ========================================================
    // HELPERS FOR SAFE CONTENT
    // ========================================================
    ensure(val) {
        if (Array.isArray(val)) return val.length ? val : null;
        return val && String(val).trim() ? val : null;
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    safePlaceholder(val) {
        // Returns escaped content or styled placeholder
        if (!val || (Array.isArray(val) && val.length === 0)) {
            return '<em style="color: rgb(var(--text-muted-rgb));">[Pending Input]</em>';
        }
        return this.escapeHtml(val);
    }

    // ========================================================
    // UNIFIED HTML RENDERER (single source of truth)
    // ========================================================
    renderStructuredHTML(payload, generated) {
        const {
            profileSummary = '',
            quickWins = '',
            tradeLinesPlan = '',
            vendorRecommendations = [],
            cardStrategy = '',
            cardRecommendations = [],
            bankingSignals = '',
            actionPlan = '',
            riskFlags = ''
        } = generated || {};

        // Build header metadata
        const headerBlock = `
            <div class="doc-meta">
                <div><strong>Business:</strong> ${this.safePlaceholder(payload.businessName)}</div>
                <div><strong>Entity Type:</strong> ${this.safePlaceholder(payload.entityType)}</div>
                <div><strong>Current Utilization:</strong> ${this.safePlaceholder(payload.utilization)}%</div>
                <div><strong>Target Credit Limit:</strong> ${this.safePlaceholder(payload.targetLimit)}</div>
                <div><strong>Tone:</strong> ${this.safePlaceholder(payload.tone || 'Professional')}</div>
            </div>
            <hr/>
        `;

        // Assemble final HTML with 7 Credit Commander sections in logical order
        // Flow: Analysis → Foundation → Quick Actions → Trade Credit → Card Credit → Master Plan → Risks
        const html = `
            ${headerBlock}

            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h2 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">Profile Summary</h2>
                <div class="section-content">${this.safePlaceholder(profileSummary)}</div>
            </div>

            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h3 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">Banking & Data Signals</h3>
                <div class="section-content">${this.safePlaceholder(bankingSignals)}</div>
            </div>

            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h3 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">Quick Wins (0-30 Days)</h3>
                <div class="section-content">${this.safePlaceholder(quickWins)}</div>
            </div>

            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h3 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">Tiered Trade Lines Plan</h3>
                <div class="section-content">${this.safePlaceholder(tradeLinesPlan)}</div>
            </div>

            ${this.renderVendorRecommendations(vendorRecommendations)}

            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h3 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">Card Strategy</h3>
                <div class="section-content">${this.safePlaceholder(cardStrategy)}</div>
            </div>

            ${this.renderCardRecommendations(cardRecommendations)}

            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h3 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">30/60/90-Day Action Plan</h3>
                <div class="section-content">${this.safePlaceholder(actionPlan)}</div>
            </div>

            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h3 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">Risk Flags & Compliance</h3>
                <div class="section-content">${this.safePlaceholder(riskFlags)}</div>
            </div>
        `;

        return html;
    }

    // ========================================================
    // RECOMMENDATION RENDERERS
    // ========================================================
    renderVendorRecommendations(vendors) {
        // Validate input is an array
        if (!Array.isArray(vendors) || vendors.length === 0) {
            console.log('[Recommendations] No valid vendor recommendations to display');
            return '';
        }

        const vendorCards = vendors.map(v => `
            <div class="recommendation-card" style="background: rgba(77,182,231,0.08); border: 1px solid rgba(77,182,231,0.2); border-radius: 8px; padding: 16px; margin-bottom: 12px;" data-testid="vendor-card-${this.escapeHtml(v.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #4DB6E7; font-size: 16px; font-weight: 600;">${this.escapeHtml(v.name || 'Unknown Vendor')}</h4>
                    <span class="cc-badge cc-badge--${this.getApprovalClass(v.approvalOdds)}" data-testid="badge-approval-${v.approvalOdds?.toLowerCase() || 'unknown'}">
                        ${this.escapeHtml(v.approvalOdds || 'N/A')} Approval
                    </span>
                </div>
                <div style="margin-bottom: 8px;">
                    <span class="cc-badge cc-badge--info" data-testid="badge-tier">${this.escapeHtml(v.tier || 'N/A')}</span>
                    <span class="cc-badge cc-badge--default" data-testid="badge-min-fico">Min FICO: ${v.minFico || 'N/A'}</span>
                </div>
                <p style="margin: 8px 0; color: var(--text-color); font-size: 14px;">${this.escapeHtml(v.reason || '')}</p>
                ${v.reportsBureaus && v.reportsBureaus.length > 0 ? `
                    <div style="font-size: 12px; color: var(--text-secondary);">
                        <strong>Reports to:</strong> ${v.reportsBureaus.map(b => this.escapeHtml(b)).join(', ')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        return `
            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h3 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">Recommended Vendors</h3>
                <div data-testid="vendor-recommendations">
                    ${vendorCards}
                </div>
            </div>
        `;
    }

    renderCardRecommendations(cards) {
        // Validate input is an array
        if (!Array.isArray(cards) || cards.length === 0) {
            console.log('[Recommendations] No valid card recommendations to display');
            return '';
        }

        // Sort by applyOrder if available (defensive - ensure values are numbers)
        const sortedCards = [...cards].sort((a, b) => {
            const orderA = typeof a.applyOrder === 'number' ? a.applyOrder : 99;
            const orderB = typeof b.applyOrder === 'number' ? b.applyOrder : 99;
            return orderA - orderB;
        });

        const cardCards = sortedCards.map(c => `
            <div class="recommendation-card" style="background: rgba(255,213,74,0.08); border: 1px solid rgba(255,213,74,0.2); border-radius: 8px; padding: 16px; margin-bottom: 12px;" data-testid="card-card-${this.escapeHtml(c.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <h4 class="card-name-title" style="margin: 0 0 4px 0; color: #FFD54A; font-size: 16px; font-weight: 600;">${this.escapeHtml(c.name || 'Unknown Card')}</h4>
                        <div style="font-size: 13px; color: var(--text-secondary);">${this.escapeHtml(c.issuer || '')}</div>
                    </div>
                    <span class="cc-badge cc-badge--${this.getApprovalClass(c.approvalOdds)}" data-testid="badge-approval-${c.approvalOdds?.toLowerCase() || 'unknown'}">
                        ${this.escapeHtml(c.approvalOdds || 'N/A')} Approval
                    </span>
                </div>
                <div style="margin-bottom: 8px;">
                    ${c.applyOrder ? `<span class="cc-badge cc-badge--primary" data-testid="badge-apply-order">Apply Order: #${c.applyOrder}</span>` : ''}
                    <span class="cc-badge cc-badge--default" data-testid="badge-min-fico">Min FICO: ${c.minFico || 'N/A'}</span>
                    ${c.expectedLimit ? `<span class="cc-badge cc-badge--info" data-testid="badge-expected-limit">${this.escapeHtml(c.expectedLimit)}</span>` : ''}
                </div>
                <p style="margin: 8px 0; color: var(--text-color); font-size: 14px;">${this.escapeHtml(c.reason || '')}</p>
            </div>
        `).join('');

        return `
            <div class="cc-card" style="padding: 18px; margin-bottom: 20px;">
                <h3 class="cc-section-title" style="border-left: 2px solid rgba(255,213,74,.35); padding-left: 14px; margin: 0 0 14px 0;">Recommended Business Cards</h3>
                <div data-testid="card-recommendations">
                    ${cardCards}
                </div>
            </div>
        `;
    }

    getApprovalClass(odds) {
        if (!odds) return 'default';
        const lower = odds.toLowerCase();
        if (lower.includes('high')) return 'success';
        if (lower.includes('medium')) return 'warning';
        if (lower.includes('low')) return 'danger';
        return 'default';
    }

    // ========================================================
    // FUNDING SIMULATOR
    // ========================================================
    initFundingSimulator() {
        const slider = document.getElementById('loanAmountSlider');
        const valueDisplay = document.getElementById('loanAmountValue');
        
        if (!slider) return;
        
        slider.addEventListener('input', (e) => {
            const amount = parseInt(e.target.value);
            valueDisplay.textContent = `$${amount.toLocaleString()}`;
            this.updateFundingEstimate(amount);
        });
    }

    updateFundingEstimate(loanAmount) {
        if (!this.currentResult?.payload) return;
        
        const { ownerFico, utilization, tradeLines, annualRevenue, latePayments } = this.currentResult.payload;
        
        // Calculate qualification score (0-100)
        let score = 0;
        let factors = [];
        
        // FICO score (40 points)
        if (ownerFico >= 720) { score += 40; factors.push('Excellent credit score'); }
        else if (ownerFico >= 680) { score += 30; factors.push('Good credit score'); }
        else if (ownerFico >= 640) { score += 20; factors.push('Fair credit score'); }
        else { score += 10; factors.push('Credit score needs improvement'); }
        
        // Utilization (20 points)
        if (utilization <= 10) { score += 20; factors.push('Excellent utilization'); }
        else if (utilization <= 30) { score += 15; factors.push('Good utilization'); }
        else if (utilization <= 50) { score += 10; factors.push('High utilization'); }
        else { score += 5; factors.push('Very high utilization'); }
        
        // Trade lines (20 points)
        if (tradeLines >= 10) { score += 20; factors.push('Strong tradeline history'); }
        else if (tradeLines >= 5) { score += 15; factors.push('Good tradeline mix'); }
        else if (tradeLines >= 3) { score += 10; factors.push('Building tradelines'); }
        else { score += 5; factors.push('Limited tradelines'); }
        
        // Late payments (10 points)
        if (latePayments === 0) { score += 10; factors.push('Perfect payment history'); }
        else if (latePayments <= 2) { score += 5; factors.push('Recent late payments'); }
        else { factors.push('Multiple late payments'); }
        
        // Revenue (10 points) - parse from string
        const revenueNum = parseInt(annualRevenue?.replace(/[^0-9]/g, '') || '0');
        if (revenueNum >= 500000) { score += 10; factors.push('Strong revenue'); }
        else if (revenueNum >= 250000) { score += 7; factors.push('Good revenue'); }
        else if (revenueNum >= 100000) { score += 5; factors.push('Moderate revenue'); }
        else { score += 3; factors.push('Limited revenue'); }
        
        // Determine qualification level
        let level, levelClass, estRate, estTerm, message;
        if (score >= 75) {
            level = 'High';
            levelClass = 'success';
            estRate = '6-9%';
            estTerm = '5-7 years';
            message = 'Strong qualification for traditional SBA or bank loans';
        } else if (score >= 50) {
            level = 'Medium';
            levelClass = 'warning';
            estRate = '10-15%';
            estTerm = '3-5 years';
            message = 'Likely to qualify for alternative lenders or smaller amounts';
        } else {
            level = 'Low';
            levelClass = 'danger';
            estRate = '18-30%';
            estTerm = '1-3 years';
            message = 'May need collateral, co-signer, or credit improvement first';
        }
        
        const monthlyPayment = this.estimatePayment(loanAmount, parseFloat(estRate.split('-')[0])/100, parseInt(estTerm.split('-')[0])*12);
        
        const resultsDiv = document.getElementById('fundingResults');
        resultsDiv.innerHTML = `
            <div style="background: rgba(77,182,231,0.05); border: 1px solid rgba(77,182,231,0.15); border-radius: 8px; padding: 16px; margin-bottom: 12px;" data-testid="funding-qualification">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="margin: 0; color: var(--text-color); font-size: 15px;">Qualification Likelihood</h4>
                    <span class="cc-badge cc-badge--${levelClass}" data-testid="badge-qualification">${level}</span>
                </div>
                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">${message}</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 12px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Est. Rate</div>
                        <div style="font-weight: 600; color: var(--text-color);">${estRate}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Est. Term</div>
                        <div style="font-weight: 600; color: var(--text-color);">${estTerm}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Monthly Payment</div>
                        <div style="font-weight: 600; color: var(--text-color);">~$${monthlyPayment.toLocaleString()}</div>
                    </div>
                </div>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 12px;">
                <strong>Key Factors:</strong> ${factors.join(' • ')}
            </div>
        `;
    }

    estimatePayment(principal, annualRate, months) {
        const monthlyRate = annualRate / 12;
        if (monthlyRate === 0) return Math.round(principal / months);
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        return Math.round(payment);
    }

    // ========================================================
    // CREDIT SCORE TRACKER
    // ========================================================
    generateScoreProjection() {
        if (!this.currentResult?.payload) return;
        
        const { ownerFico, utilization, tradeLines, latePayments } = this.currentResult.payload;
        
        // Calculate projected improvements over 90 days
        const currentScore = ownerFico || 650;
        const milestones = [
            { day: 0, score: currentScore, label: 'Today' },
            { day: 30, score: this.calculateProjectedScore(currentScore, utilization, tradeLines, latePayments, 30), label: '30 Days' },
            { day: 60, score: this.calculateProjectedScore(currentScore, utilization, tradeLines, latePayments, 60), label: '60 Days' },
            { day: 90, score: this.calculateProjectedScore(currentScore, utilization, tradeLines, latePayments, 90), label: '90 Days' }
        ];
        
        this.renderScoreChart(milestones);
    }

    calculateProjectedScore(current, utilization, tradeLines, latePayments, days) {
        let projected = current;
        
        // Utilization impact (+10-20 points if reduced to <30%)
        if (utilization > 30 && days >= 30) {
            projected += Math.min(15, (utilization - 30) / 2);
        }
        
        // Trade lines impact (+5-10 points per new trade line)
        if (tradeLines < 5 && days >= 60) {
            projected += Math.min(10, (5 - tradeLines) * 2);
        }
        
        // Late payment resolution (+10-15 points if addressed)
        if (latePayments > 0 && days >= 90) {
            projected += Math.min(15, latePayments * 5);
        }
        
        // Natural aging improvement (+2-5 points over 90 days)
        projected += days / 30;
        
        return Math.min(Math.round(projected), 850); // Cap at max score
    }

    renderScoreChart(milestones) {
        const chartContainer = document.getElementById('scoreChart');
        const scoreTracker = document.getElementById('scoreTracker');
        
        if (!chartContainer || !scoreTracker) return;
        
        const maxScore = 850;
        const minScore = Math.min(...milestones.map(m => m.score)) - 50;
        const range = maxScore - minScore;
        
        const currentScore = milestones[0].score;
        const projectedScore = milestones[milestones.length - 1].score;
        const improvement = projectedScore - currentScore;
        
        chartContainer.innerHTML = `
            <div style="background: rgba(77,182,231,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Current Score</div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">${currentScore}</div>
                    </div>
                    <div style="text-align: center; padding: 0 20px;">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Projected Gain</div>
                        <div style="font-size: 20px; font-weight: 600; color: ${improvement > 0 ? '#10b981' : 'var(--text-color)'};">+${improvement}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">90-Day Target</div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--accent-color);">${projectedScore}</div>
                    </div>
                </div>
                
                <div style="position: relative; height: 160px; margin-top: 20px;">
                    <!-- Vertical axis labels -->
                    <div style="position: absolute; left: -40px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: space-between; font-size: 11px; color: var(--text-secondary);">
                        <span>${maxScore}</span>
                        <span>${Math.round(minScore + range * 0.5)}</span>
                        <span>${minScore}</span>
                    </div>
                    
                    <!-- Chart area -->
                    <div style="position: relative; height: 100%; border-left: 1px solid rgba(77,182,231,0.2); border-bottom: 1px solid rgba(77,182,231,0.2); padding-left: 10px;">
                        <!-- Trend line -->
                        <svg width="100%" height="100%" style="position: absolute; left: 10px; top: 0;">
                            <polyline
                                points="${milestones.map((m, i) => {
                                    const x = (i / (milestones.length - 1)) * 100;
                                    const y = 100 - ((m.score - minScore) / range * 100);
                                    return `${x}%,${y}%`;
                                }).join(' ')}"
                                fill="none"
                                stroke="#4DB6E7"
                                stroke-width="3"
                                style="vector-effect: non-scaling-stroke;"
                            />
                            ${milestones.map((m, i) => {
                                const x = (i / (milestones.length - 1)) * 100;
                                const y = 100 - ((m.score - minScore) / range * 100);
                                return `<circle cx="${x}%" cy="${y}%" r="4" fill="#4DB6E7" />`;
                            }).join('')}
                        </svg>
                    </div>
                    
                    <!-- Horizontal axis labels -->
                    <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-left: 10px; font-size: 12px; color: var(--text-secondary);">
                        ${milestones.map(m => `<span>${m.label}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div style="font-size: 13px; color: var(--text-secondary);">
                <strong>Projection Factors:</strong> Assumes reduced utilization, added trade lines, and resolution of negative items per your roadmap.
            </div>
        `;
        
        scoreTracker.style.display = 'block';
    }

    // ========================================================
    // SMART ALERTS
    // ========================================================
    generateSmartAlerts() {
        if (!this.currentResult?.payload) return;
        
        const { ownerFico, utilization, tradeLines, latePayments, derogatories } = this.currentResult.payload;
        const alerts = [];
        
        // Critical alerts (red)
        if (latePayments > 0) {
            alerts.push({
                type: 'danger',
                icon: '⚠️',
                title: 'Action Required: Late Payments Detected',
                message: `You have ${latePayments} late payment(s). Contact creditors immediately to negotiate payment plans.`,
                testId: 'alert-late-payments'
            });
        }
        if (derogatories && derogatories.toLowerCase() !== 'none' && derogatories.toLowerCase() !== 'none reported') {
            alerts.push({
                type: 'danger',
                icon: '⚠️',
                title: 'Derogatory Marks Found',
                message: `Derogatories detected: ${derogatories}. Review your credit report and consider disputing inaccuracies.`,
                testId: 'alert-derogatories'
            });
        }
        
        // Warning alerts (yellow)
        if (utilization > 30) {
            alerts.push({
                type: 'warning',
                icon: '⚡',
                title: 'High Credit Utilization',
                message: `Your ${utilization}% utilization is above the recommended 30%. Pay down balances to improve your score quickly.`,
                testId: 'alert-utilization'
            });
        }
        if (tradeLines < 5) {
            alerts.push({
                type: 'warning',
                icon: '📊',
                title: 'Limited Trade Line Mix',
                message: `You have ${tradeLines} trade lines. Aim for 5+ to build stronger business credit profiles.`,
                testId: 'alert-tradelines'
            });
        }
        
        // Success alerts (green) - milestones
        if (ownerFico >= 720) {
            alerts.push({
                type: 'success',
                icon: '✓',
                title: 'Excellent Credit Score',
                message: `Your ${ownerFico} FICO score qualifies you for premium funding options with favorable terms.`,
                testId: 'alert-excellent-fico'
            });
        }
        if (utilization <= 10 && tradeLines >= 5 && latePayments === 0) {
            alerts.push({
                type: 'success',
                icon: '🎯',
                title: 'Credit Health Milestone Achieved',
                message: 'Excellent profile! You\'re in the top tier for business credit qualification.',
                testId: 'alert-milestone'
            });
        }
        
        this.displayAlerts(alerts);
    }

    displayAlerts(alerts) {
        const alertsContainer = document.getElementById('alertsContainer');
        const smartAlerts = document.getElementById('smartAlerts');
        
        if (!alertsContainer || !smartAlerts || alerts.length === 0) {
            if (smartAlerts) smartAlerts.style.display = 'none';
            return;
        }
        
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="cc-card alert-card alert-${alert.type}" style="padding: 16px; margin-bottom: 12px; border-left: 4px solid var(--${alert.type === 'danger' ? 'error' : alert.type === 'warning' ? 'warning' : 'success'}-color, ${alert.type === 'danger' ? '#ef4444' : alert.type === 'warning' ? '#FFD54A' : '#10b981'});" data-testid="${alert.testId}">
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <span style="font-size: 20px; flex-shrink: 0;">${alert.icon}</span>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 6px 0; color: var(--text-color); font-size: 15px; font-weight: 600;">${alert.title}</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">${alert.message}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        smartAlerts.style.display = 'block';
    }

    // ========================================================
    // FORM SUBMISSION
    // ========================================================
    bindFormSubmit() {
        const form = document.getElementById('toolkitForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleGenerate();
            });
        }
    }

    async handleGenerate() {
        try {
            // Check usage limit before generating
            const usageCheck = await this.checkUsageLimit();
            if (!usageCheck.allowed) {
                this.showLimitReachedAlert(usageCheck.count, usageCheck.limit);
                return;
            }

            // Show loading state
            this.setLoadingState(true);

            // Collect form data
            const payload = {
                businessName: document.getElementById('businessName')?.value.trim() || '',
                ein: document.getElementById('ein')?.value.trim() || '',
                entityType: document.getElementById('entityType')?.value || '',
                state: document.getElementById('state')?.value.trim() || '',
                startDate: document.getElementById('startDate')?.value || '',
                utilization: parseFloat(document.getElementById('utilization')?.value) || 0,
                tradeLines: parseInt(document.getElementById('tradeLines')?.value) || 0,
                annualRevenue: document.getElementById('annualRevenue')?.value.trim() || '',
                latePayments: parseInt(document.getElementById('latePayments')?.value) || 0,
                derogatories: document.getElementById('derogatories')?.value.trim() || '',
                ownerFico: parseInt(document.getElementById('ownerFico')?.value) || 0,
                creditHistory: parseFloat(document.getElementById('creditHistory')?.value) || 0,
                fundingGoal: document.getElementById('fundingGoal')?.value.trim() || '',
                targetLimit: document.getElementById('targetLimit')?.value.trim() || '',
                timeframe: document.getElementById('timeframe')?.value || ''
            };

            // Call backend for structured JSON
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData: payload })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'We couldn\'t generate your compliance report. Please try again.');
            }

            const generated = await response.json();

            // Build ONE HTML using unified renderer
            const html = this.renderStructuredHTML(payload, generated);

            // Display in panel
            const resultsContainer = document.getElementById('resultsContainer');
            if (resultsContainer) {
                resultsContainer.innerHTML = html;
            }

            // Compute checksum on exact HTML
            const cs = this.checksum(html);

            // Store result (single source of truth)
            this.currentResult = {
                id: 'r_' + Date.now(),
                version: '20241111', // Version tracking for cache invalidation
                payload,
                roadmap: generated,
                structured: { html, text: this.stripHTML(html) },
                createdAt: new Date().toISOString(),
                checksum: cs
            };

            this.saveCurrentResult();

            // Hide "no results" message
            const noResults = document.getElementById('noResults');
            if (noResults) {
                noResults.style.display = 'none';
            }

            // Show "Explain My Report" button
            const explainBtn = document.getElementById('explainBtn');
            if (explainBtn) {
                explainBtn.style.display = 'inline-block';
            }

            // Update KPI panel with payload data
            this.updateKPIPanel(payload);

            // Update signals badges
            this.updateSignalsBadges(payload);

            // Smooth scroll to results
            this.scrollToResults();

            this.showSuccess('Credit roadmap generated successfully!');

            // Note: Usage counter is automatically incremented by backend

        } catch (error) {
            console.error('Generation error:', error);
            
            // Handle usage limit error from backend
            if (error.message && error.message.includes('30-report limit')) {
                const usageCheck = await this.checkUsageLimit();
                this.showLimitReachedAlert(usageCheck.count, usageCheck.limit);
                return;
            }
            
            this.showError(error.message || 'Failed to generate credit roadmap');
        } finally {
            this.setLoadingState(false);
        }
    }

    // ========================================================
    // STATE PERSISTENCE
    // ========================================================
    saveCurrentResult() {
        try {
            localStorage.setItem('currentResult', JSON.stringify(this.currentResult));
        } catch (e) {
            console.warn('Failed to save result to localStorage:', e);
        }
    }

    loadCurrentResult() {
        try {
            const raw = localStorage.getItem('currentResult');
            if (raw) {
                this.currentResult = JSON.parse(raw);
                
                // Version check: invalidate old cached results (v20241111)
                const CURRENT_VERSION = '20241111';
                if (!this.currentResult.version || this.currentResult.version !== CURRENT_VERSION) {
                    console.log('[Cache] Clearing outdated cached result');
                    localStorage.removeItem('currentResult');
                    this.currentResult = null;
                    return;
                }
                
                if (this.currentResult?.structured?.html) {
                    const resultsContainer = document.getElementById('resultsContainer');
                    if (resultsContainer) {
                        resultsContainer.innerHTML = this.currentResult.structured.html;
                    }
                    const noResults = document.getElementById('noResults');
                    if (noResults) {
                        noResults.style.display = 'none';
                    }
                    
                    // Restore KPI panel and badges if payload exists
                    if (this.currentResult.payload) {
                        this.updateKPIPanel(this.currentResult.payload);
                        this.updateSignalsBadges(this.currentResult.payload);
                    }
                    
                    // Show "Explain My Report" button if roadmap exists
                    const explainBtn = document.getElementById('explainBtn');
                    if (explainBtn && this.currentResult.roadmap) {
                        explainBtn.style.display = 'inline-block';
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load result from localStorage:', e);
        }
    }

    // ========================================================
    // ACTIONS (Export, Copy, Clear, Save, Load)
    // ========================================================
    bindActions() {
        const exportBtn = document.getElementById('exportPdfBtn');
        const exportDocxBtn = document.getElementById('exportDocxBtn');
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const copyBtn = document.getElementById('copyAllBtn');
        const clearBtn = document.getElementById('clearBtn');
        const saveBtn = document.getElementById('saveReportBtn');
        const loadBtn = document.getElementById('loadReportBtn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }
        if (exportDocxBtn) {
            exportDocxBtn.addEventListener('click', () => this.handleExportDOCX());
        }
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.handleExportCSV());
        }
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.handleCopy());
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.handleClear());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.showSaveModal());
        }
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.showLoadModal());
        }
    }

    bindDropdownMenus() {
        const menuBtns = document.querySelectorAll('.menu-btn');
        
        menuBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = btn.parentElement;
                const menuContent = dropdown.querySelector('.menu-content');
                
                // Close all other dropdowns
                document.querySelectorAll('.menu-content.show').forEach(menu => {
                    if (menu !== menuContent) {
                        menu.classList.remove('show');
                    }
                });
                
                // Toggle this dropdown
                menuContent.classList.toggle('show');
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-dropdown')) {
                document.querySelectorAll('.menu-content.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });

        // Close dropdown when clicking menu item
        document.querySelectorAll('.menu-content button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.menu-content.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            });
        });
    }

    async handleExport() {
        if (!this.currentResult?.structured?.html) {
            this.showError('Please generate a compliance report first before exporting.');
            return;
        }

        try {
            // Wrap HTML for PDF with header/footer and checksum
            const pdfHTML = this.wrapForPdf(this.currentResult.structured.html, this.currentResult);
            
            // Extract metadata from payload for PDF header (use nullish coalescing to preserve 0 values)
            const metadata = {
                date: new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                fico: this.currentResult.payload?.ownerFico ?? null,
                utilization: this.currentResult.payload?.utilization ?? null,
                tradeLines: this.currentResult.payload?.tradeLines ?? null
            };
            
            // Use existing pdf-export.js functionality
            if (window.exportAllResultsToPDF) {
                await window.exportAllResultsToPDF([{
                    html: pdfHTML,
                    fileName: this.buildFileName(this.currentResult),
                    metadata: metadata
                }], { mode: 'single' });
                this.showSuccess('PDF exported successfully!');
            } else {
                this.showError('PDF export is temporarily unavailable. Please try again later.');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showError('We couldn\'t export your PDF. Please try again.');
        }
    }

    buildFileName(r) {
        const safe = (s) => String(s || '').replace(/[^a-z0-9-_]+/gi, '_');
        const date = new Date(r.createdAt || Date.now());
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return `CreditCommander_${safe(r?.payload?.businessName)}_${dateStr}.pdf`;
    }

    async handleExportDOCX() {
        if (!this.currentResult?.roadmap || !this.currentResult?.payload) {
            this.showError('Please generate a credit roadmap first before exporting DOCX.');
            return;
        }

        try {
            // Dynamically import docx and file-saver from CDN (browser-compatible ESM)
            const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('https://cdn.skypack.dev/docx@8.5.0');
            const { saveAs } = await import('https://cdn.skypack.dev/file-saver@2.0.5');

            const roadmap = this.currentResult.roadmap;
            const payload = this.currentResult.payload;

            // Create document with metadata header
            const doc = new Document({
                sections: [{
                    children: [
                        // Title
                        new Paragraph({
                            text: "Credit Commander - Business Credit Roadmap",
                            heading: HeadingLevel.TITLE,
                        }),
                        
                        // Metadata
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                                    break: 1
                                }),
                                new TextRun({
                                    text: `FICO: ${payload.ownerFico ?? 'N/A'} • Utilization: ${payload.utilization ?? 'N/A'}% • Trade Lines: ${payload.tradeLines ?? 'N/A'}`,
                                    break: 1
                                }),
                                new TextRun({
                                    text: `Business: ${payload.businessName ?? 'N/A'}`,
                                    break: 2
                                })
                            ]
                        }),
                        
                        // Profile Summary
                        new Paragraph({
                            text: "Profile Summary",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({ text: roadmap.profileSummary || 'N/A' }),
                        
                        // Banking Signals
                        new Paragraph({
                            text: "Banking & Data Signals",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({ text: roadmap.bankingSignals || 'N/A' }),
                        
                        // Quick Wins
                        new Paragraph({
                            text: "Quick Wins (0-30 Days)",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({ text: roadmap.quickWins || 'N/A' }),
                        
                        // Trade Lines Plan
                        new Paragraph({
                            text: "Tiered Trade Lines Plan",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({ text: roadmap.tradeLinesPlan || 'N/A' }),
                        
                        // Card Strategy
                        new Paragraph({
                            text: "Card Strategy",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({ text: roadmap.cardStrategy || 'N/A' }),
                        
                        // Action Plan
                        new Paragraph({
                            text: "30/60/90-Day Action Plan",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({ text: roadmap.actionPlan || 'N/A' }),
                        
                        // Risk Flags
                        new Paragraph({
                            text: "Risk Flags & Compliance Notes",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({ text: roadmap.riskFlags || 'N/A' }),
                    ],
                }],
            });

            // Generate and save
            const blob = await Packer.toBlob(doc);
            const filename = this.buildFileName(this.currentResult).replace('.pdf', '.docx');
            saveAs(blob, filename);
            
            this.showSuccess('DOCX exported successfully!');
        } catch (error) {
            console.error('DOCX export error:', error);
            this.showError('We couldn\'t export the DOCX. Please try again.');
        }
    }

    handleExportCSV() {
        if (!this.currentResult?.response) {
            this.showError('Please generate a credit roadmap first before exporting CSV.');
            return;
        }

        try {
            const data = this.currentResult.response;
            const formData = this.currentResult.payload || {};
            
            // Build CSV rows from the 7 sections in logical order
            const rows = [];
            rows.push(['Section', 'Recommendation', 'Priority', 'Timeline', 'Notes']);
            
            // Profile Summary
            if (data.profileSummary) {
                rows.push(['Profile Summary', this.cleanTextForCSV(data.profileSummary), 'Info', 'N/A', 'Current credit position analysis']);
            }
            
            // Banking Signals
            if (data.bankingSignals) {
                const actions = this.extractActions(data.bankingSignals);
                actions.forEach((action, idx) => {
                    rows.push(['Banking & Data Signals', action, 'High', '0-30 days', `Setup ${idx + 1}`]);
                });
            }
            
            // Quick Wins - Parse into individual actions
            if (data.quickWins) {
                const actions = this.extractActions(data.quickWins);
                actions.forEach((action, idx) => {
                    rows.push(['Quick Wins', action, 'High', '0-30 days', `Action ${idx + 1}`]);
                });
            }
            
            // Trade Lines Plan
            if (data.tradeLinesPlan) {
                const actions = this.extractActions(data.tradeLinesPlan);
                actions.forEach((action, idx) => {
                    rows.push(['Trade Lines Plan', action, 'Medium', '30-60 days', `Vendor tier ${idx + 1}`]);
                });
            }
            
            // Card Strategy
            if (data.cardStrategy) {
                const actions = this.extractActions(data.cardStrategy);
                actions.forEach((action, idx) => {
                    rows.push(['Card Strategy', action, 'Medium', '60-90 days', `Card application ${idx + 1}`]);
                });
            }
            
            // Action Plan
            if (data.actionPlan) {
                rows.push(['30/60/90 Action Plan', this.cleanTextForCSV(data.actionPlan), 'High', '0-90 days', 'Complete timeline']);
            }
            
            // Risk Flags
            if (data.riskFlags) {
                const actions = this.extractActions(data.riskFlags);
                actions.forEach((action, idx) => {
                    rows.push(['Risk Flags', action, 'Critical', 'Immediate', `Risk ${idx + 1}`]);
                });
            }
            
            // Convert to CSV string
            const csvContent = rows.map(row => 
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            ).join('\n');
            
            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const date = new Date();
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const filename = `CreditCommander_${formData.businessName || 'Roadmap'}_${dateStr}.csv`;
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccess('CSV exported successfully!');
        } catch (error) {
            console.error('CSV export error:', error);
            this.showError('Failed to export CSV. Please try again.');
        }
    }

    cleanTextForCSV(text) {
        return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    extractActions(text) {
        // Try to extract bullet points or numbered items
        const lines = text.split(/\n+/);
        const actions = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            // Match bullets, numbers, or sentences
            if (trimmed.match(/^[\d\.\-\*•]+\s*(.+)$/)) {
                actions.push(trimmed.replace(/^[\d\.\-\*•]+\s*/, '').trim());
            } else if (trimmed.length > 20 && trimmed.match(/[.!?]$/)) {
                actions.push(trimmed);
            }
        }
        
        // If no actions found, split by sentences
        if (actions.length === 0 && text.length > 0) {
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            return sentences.map(s => s.trim()).filter(s => s.length > 10).slice(0, 5);
        }
        
        return actions.slice(0, 10); // Limit to 10 actions per section
    }

    wrapForPdf(innerHTML, r) {
        const stamp = new Date(r.createdAt).toLocaleString();
        return `
            <div class="pdf-wrapper">
                <div class="pdf-header">
                    <div class="brand">Credit Commander</div>
                    <div class="tiny">Generated: ${stamp}</div>
                </div>
                ${innerHTML}
                <div class="footer">
                    Credit Commander • For educational purposes only. Consult a licensed credit professional before taking action.
                </div>
            </div>
        `;
    }

    updateKPIPanel(formData) {
        const kpiPanel = document.getElementById('kpiPanel');
        if (!kpiPanel) return;

        // Show the panel
        kpiPanel.style.display = 'block';

        // Update utilization
        const utilizationEl = document.getElementById('kpiUtilization');
        const utilizationBar = document.getElementById('kpiUtilizationBar');
        if (utilizationEl && formData.utilization !== undefined) {
            const util = parseFloat(formData.utilization);
            utilizationEl.textContent = `${util}%`;
            
            const status = this.getKpiStatus('utilization', util);
            if (status) {
                utilizationEl.className = 'kpi-value ' + status.status;
                if (utilizationBar) {
                    utilizationBar.style.width = `${status.percent}%`;
                    utilizationBar.className = 'kpi-progress-fill ' + status.status;
                }
            }
        }

        // Update trade lines
        const tradeLinesEl = document.getElementById('kpiTradeLines');
        const tradeLinesBar = document.getElementById('kpiTradeLinesBar');
        if (tradeLinesEl && formData.tradeLines !== undefined) {
            const lines = parseInt(formData.tradeLines);
            tradeLinesEl.textContent = lines;
            
            const status = this.getKpiStatus('tradelines', lines);
            if (status) {
                tradeLinesEl.className = 'kpi-value ' + status.status;
                if (tradeLinesBar) {
                    tradeLinesBar.style.width = `${status.percent}%`;
                    tradeLinesBar.className = 'kpi-progress-fill ' + status.status;
                }
            }
        }

        // Update FICO
        const ficoEl = document.getElementById('kpiFico');
        const ficoBar = document.getElementById('kpiFicoBar');
        if (ficoEl && formData.ownerFico !== undefined) {
            const fico = parseInt(formData.ownerFico);
            ficoEl.textContent = fico;
            
            const status = this.getKpiStatus('fico', fico);
            if (status) {
                ficoEl.className = 'kpi-value ' + status.status;
                if (ficoBar) {
                    ficoBar.style.width = `${status.percent}%`;
                    ficoBar.className = 'kpi-progress-fill ' + status.status;
                }
            }
        }

        // Update 30/60/90 progress (simulated based on current date)
        const progressFill = document.getElementById('kpiProgressFill');
        const progressText = document.getElementById('kpiProgressText');
        if (progressFill && progressText && formData.startDate) {
            try {
                const startDate = new Date(formData.startDate);
                const today = new Date();
                const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
                const daysIn90 = Math.min(Math.max(daysSinceStart, 0), 90);
                const progressPercent = (daysIn90 / 90) * 100;
                
                progressFill.style.width = `${progressPercent}%`;
                progressText.textContent = `Day ${daysIn90} of 90`;
                
                // Add color based on progress
                progressFill.className = 'kpi-progress-fill';
                if (daysIn90 < 30) progressFill.classList.add('danger');
                else if (daysIn90 < 60) progressFill.classList.add('warning');
                else progressFill.classList.add('healthy');
            } catch (e) {
                progressFill.style.width = '0%';
                progressText.textContent = 'Day 0 of 90';
            }
        }
    }

    updateSignalsBadges(payload) {
        const signalsStrip = document.getElementById('signalsStrip');
        if (!signalsStrip) return;

        // Helper: safely parse number with fallback to show "N/A"
        const safeNum = (val, precision = 0) => {
            const num = typeof val === 'number' ? val : parseFloat(val);
            return (!isNaN(num) && num >= 0) ? num.toFixed(precision) : null;
        };

        // Badge 1: Utilization (ok if <30%, warn if ≥30%)
        const badgeUtil = document.getElementById('badgeUtilization');
        if (badgeUtil) {
            const util = safeNum(payload.utilization);
            badgeUtil.textContent = util !== null ? `Utilization: ${util}%` : 'Utilization: N/A';
            badgeUtil.classList.remove('cc-badge--ok', 'cc-badge--warn');
            if (util === null) {
                badgeUtil.classList.add('cc-badge--warn'); // Flag missing data as warning
            } else {
                badgeUtil.classList.add(parseFloat(util) < 30 ? 'cc-badge--ok' : 'cc-badge--warn');
            }
        }

        // Badge 2: Late Payments (ok if 0, warn if >0)
        const badgeLate = document.getElementById('badgeLatePayments');
        if (badgeLate) {
            const lateRaw = parseInt(payload.latePayments);
            // Only accept valid numeric values (including 0); treat NaN as missing
            const late = !isNaN(lateRaw) && lateRaw >= 0 ? lateRaw : null;
            badgeLate.textContent = late !== null ? `Late Payments: ${late}` : 'Late Payments: N/A';
            badgeLate.classList.remove('cc-badge--ok', 'cc-badge--warn');
            if (late === null) {
                badgeLate.classList.add('cc-badge--warn'); // Flag missing data
            } else {
                badgeLate.classList.add(late === 0 ? 'cc-badge--ok' : 'cc-badge--warn');
            }
        }

        // Badge 3: Derogatories (ok if empty/none/n/a, warn if present)
        const badgeDero = document.getElementById('badgeDerogatories');
        if (badgeDero) {
            // Normalize input: trim whitespace and convert to lowercase
            const deroRaw = String(payload.derogatories || '').trim().toLowerCase();
            // Treat empty string, "none", "n/a", "na" as clean (no derogatories)
            const isClean = deroRaw.length === 0 || deroRaw === 'none' || deroRaw === 'n/a' || deroRaw === 'na';
            badgeDero.textContent = isClean ? 'Derogatories: None' : 'Derogatories: Yes';
            badgeDero.classList.remove('cc-badge--ok', 'cc-badge--warn');
            badgeDero.classList.add(isClean ? 'cc-badge--ok' : 'cc-badge--warn');
        }

        // Badge 4: FICO (ok if ≥680, warn if <680)
        const badgeFico = document.getElementById('badgeFico');
        if (badgeFico) {
            const ficoRaw = parseInt(payload.ownerFico) || 0;
            // FICO scores range from 300-850; treat values outside this as invalid
            const fico = (ficoRaw >= 300 && ficoRaw <= 850) ? ficoRaw.toString() : null;
            badgeFico.textContent = fico !== null ? `FICO: ${fico}` : 'FICO: N/A';
            badgeFico.classList.remove('cc-badge--ok', 'cc-badge--warn');
            if (fico === null) {
                badgeFico.classList.add('cc-badge--warn');
            } else {
                badgeFico.classList.add(parseInt(fico) >= 680 ? 'cc-badge--ok' : 'cc-badge--warn');
            }
        }

        // Badge 5: Trade Lines (ok if ≥3, warn if <3)
        const badgeTrade = document.getElementById('badgeTradeLines');
        if (badgeTrade) {
            const tradeRaw = parseInt(payload.tradeLines);
            // Accept valid numeric values ≥0; treat NaN as missing
            const trade = !isNaN(tradeRaw) && tradeRaw >= 0 ? tradeRaw : null;
            badgeTrade.textContent = trade !== null ? `Trade Lines: ${trade}` : 'Trade Lines: N/A';
            badgeTrade.classList.remove('cc-badge--ok', 'cc-badge--warn');
            if (trade === null) {
                badgeTrade.classList.add('cc-badge--warn'); // Flag missing data
            } else {
                badgeTrade.classList.add(trade >= 3 ? 'cc-badge--ok' : 'cc-badge--warn');
            }
        }

        // Show the strip
        signalsStrip.style.display = 'block';
        
        // Generate and show score projection
        this.generateScoreProjection();
        
        // Generate and show smart alerts
        this.generateSmartAlerts();
        
        // Show and update funding simulator
        const fundingSimulator = document.getElementById('fundingSimulator');
        if (fundingSimulator) {
            fundingSimulator.style.display = 'block';
            this.updateFundingEstimate(50000); // Initial calculation
        }
    }

    resetSignalsBadges() {
        const signalsStrip = document.getElementById('signalsStrip');
        if (!signalsStrip) return;

        // Hide the strip
        signalsStrip.style.display = 'none';

        // Reset all badges to neutral state
        const badges = ['badgeUtilization', 'badgeLatePayments', 'badgeDerogatories', 'badgeFico', 'badgeTradeLines'];
        badges.forEach(id => {
            const badge = document.getElementById(id);
            if (badge) {
                badge.textContent = '--';
                badge.classList.remove('cc-badge--ok', 'cc-badge--warn');
            }
        });
    }

    handleCopy() {
        if (!this.currentResult?.structured?.text) {
            this.showError('Please generate a compliance report first before copying.');
            return;
        }
        
        navigator.clipboard.writeText(this.currentResult.structured.text)
            .then(() => this.showSuccess('Results copied to clipboard!'))
            .catch(() => this.showError('We couldn\'t copy to your clipboard. Please try again.'));
    }

    handleClear() {
        // Confirmation dialog to prevent accidental data loss
        if (!confirm('Are you sure you want to clear the current results? This cannot be undone.')) {
            return;
        }

        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }

        const noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.style.display = 'block';
        }

        this.currentResult = null;
        localStorage.removeItem('currentResult');
        
        // Reset and hide signals badges
        this.resetSignalsBadges();
        
        // Hide KPI panel
        const kpiPanel = document.getElementById('kpiPanel');
        if (kpiPanel) kpiPanel.style.display = 'none';
        
        // Hide score tracker
        const scoreTracker = document.getElementById('scoreTracker');
        if (scoreTracker) scoreTracker.style.display = 'none';
        
        // Hide smart alerts
        const smartAlerts = document.getElementById('smartAlerts');
        if (smartAlerts) smartAlerts.style.display = 'none';
        
        // Hide funding simulator
        const fundingSimulator = document.getElementById('fundingSimulator');
        if (fundingSimulator) fundingSimulator.style.display = 'none';
        
        // Hide "Explain My Report" button
        const explainBtn = document.getElementById('explainBtn');
        if (explainBtn) explainBtn.style.display = 'none';
        
        this.showSuccess('Results cleared');
    }

    // ========================================================
    // UI HELPERS
    // ========================================================
    stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    setLoadingState(loading) {
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const loadingText = document.getElementById('loadingText');
        const formInputs = document.querySelectorAll('#toolkitForm input, #toolkitForm select, #toolkitForm textarea');

        if (loading) {
            if (submitBtn) submitBtn.disabled = true;
            if (submitText) submitText.classList.add('hidden');
            if (loadingText) loadingText.classList.remove('hidden');
            formInputs.forEach(input => input.disabled = true);
        } else {
            if (submitBtn) submitBtn.disabled = false;
            if (submitText) submitText.classList.remove('hidden');
            if (loadingText) loadingText.classList.add('hidden');
            formInputs.forEach(input => input.disabled = false);
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => toast.remove();
        
        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========================================================
    // MODAL HELPERS
    // ========================================================
    openModal(modal) {
        if (!modal) return;
        modal.style.display = 'flex';
    }

    closeModal(modal) {
        if (!modal) return;
        modal.style.display = 'none';
    }

    // ========================================================
    // SAVE/LOAD FUNCTIONALITY
    // ========================================================
    showSaveModal() {
        if (!this.currentResult) {
            this.showError('No report to save. Generate a report first.');
            return;
        }

        const modal = document.getElementById('saveModal');
        const reportNameInput = document.getElementById('reportName');
        const confirmBtn = document.getElementById('confirmSaveBtn');
        const cancelBtn = document.getElementById('cancelSaveBtn');
        const closeBtn = document.getElementById('saveModalClose');

        if (!modal) return;

        const suggestedName = this.generateReportName();
        if (reportNameInput) {
            reportNameInput.value = suggestedName;
        }

        this.openModal(modal);
        if (reportNameInput) {
            reportNameInput.focus();
            reportNameInput.select();
        }

        const handleSave = async () => {
            const name = reportNameInput?.value.trim();
            if (!name) {
                this.showError('Please enter a report name');
                return;
            }
            await this.saveReportToDatabase(name);
            this.closeModal(modal);
        };

        const handleCancel = () => {
            this.closeModal(modal);
        };

        confirmBtn?.addEventListener('click', handleSave, { once: true });
        cancelBtn?.addEventListener('click', handleCancel, { once: true });
        closeBtn?.addEventListener('click', handleCancel, { once: true });

        reportNameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            }
        }, { once: true });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        }, { once: true });
    }

    generateReportName() {
        if (!this.currentResult?.payload) return 'Credit Roadmap';
        
        const { businessName, entityType, state } = this.currentResult.payload;
        const parts = [];
        
        if (businessName) parts.push(businessName);
        if (entityType) parts.push(entityType);
        else if (state) parts.push(state);
        
        return parts.join(' - ') || 'Credit Roadmap';
    }

    async saveReportToDatabase(name) {
        try {
            if (!this.currentResult) {
                throw new Error('No report to save');
            }

            // Check for existing report with same name
            const listResponse = await fetch('/api/reports/list?toolkit=creditcommander', {
                headers: {
                    ...this.getAuthHeaders()
                }
            });

            if (listResponse.ok) {
                const reports = await listResponse.json();
                const existingReport = reports.find(r => r.name === name);
                
                if (existingReport) {
                    const confirmOverwrite = confirm(`A report named "${name}" already exists. Do you want to overwrite it?`);
                    if (!confirmOverwrite) {
                        return; // User cancelled, don't save
                    }
                }
            }

            const payload = {
                name: name,
                entityName: this.currentResult.payload?.businessName || '',
                entityType: this.currentResult.payload?.entityType || '',
                jurisdiction: this.currentResult.payload?.state || '',
                filingType: this.currentResult.payload?.timeframe || '',
                deadline: '',
                htmlContent: this.currentResult.structured?.html || '',
                checksum: this.currentResult.checksum || '',
                metadata: JSON.stringify(this.currentResult.payload || {}),
                toolkitCode: 'creditcommander'
            };

            const response = await fetch('/api/reports/save', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'We couldn\'t save your report. Please try again.');
            }

            const result = await response.json();
            this.showSuccess(`Report "${name}" saved successfully!`);
            return result;

        } catch (error) {
            console.error('Save error:', error);
            this.showError(error.message || 'We couldn\'t save your report. Please try again.');
            throw error;
        }
    }

    async showLoadModal() {
        const modal = document.getElementById('loadModal');
        const listContainer = document.getElementById('savedReportsList');
        const closeBtn = document.getElementById('loadModalClose');

        if (!modal || !listContainer) return;

        this.openModal(modal);
        listContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: rgb(var(--text-muted-rgb));">Loading saved reports...</div>';

        closeBtn?.addEventListener('click', () => {
            this.closeModal(modal);
        }, { once: true });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        }, { once: true });

        try {
            const response = await fetch('/api/reports/list?toolkit=creditcommander', {
                headers: {
                    ...this.getAuthHeaders()
                }
            });
            if (!response.ok) {
                throw new Error('We couldn\'t load your saved reports. Please try again.');
            }

            const reports = await response.json();

            if (!reports || reports.length === 0) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: rgb(var(--text-muted-rgb));" data-testid="text-no-reports">
                        <p style="font-size: 18px; margin-bottom: 8px;">No saved reports yet</p>
                        <p style="font-size: 14px;">Generate and save a report to see it here</p>
                    </div>
                `;
                return;
            }

            const reportsHTML = reports.map(report => {
                const createdDate = new Date(report.createdAt).toLocaleDateString();
                const createdTime = new Date(report.createdAt).toLocaleTimeString();
                
                return `
                    <div class="saved-report-item" data-report-id="${report.id}" data-testid="item-saved-report-${report.id}" 
                         style="border: 1px solid rgba(var(--border-rgb), 0.06); border-radius: 8px; padding: 16px; margin-bottom: 12px; background: rgb(var(--card-rgb));">
                        <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px;">
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: rgb(var(--text-rgb));" data-testid="text-report-name-${report.id}">
                                    ${this.escapeHtml(report.name)}
                                </h3>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 13px; color: rgb(var(--text-secondary-rgb));">
                                    <div data-testid="text-report-entity-${report.id}">
                                        <strong>Project:</strong> ${this.escapeHtml(report.entityName || 'N/A')}
                                    </div>
                                    <div data-testid="text-report-jurisdiction-${report.id}">
                                        <strong>Organization:</strong> ${this.escapeHtml(report.entityType || 'N/A')}
                                    </div>
                                    <div data-testid="text-report-filing-${report.id}">
                                        <strong>Grant Type:</strong> ${this.escapeHtml(report.filingType || 'N/A')}
                                    </div>
                                    <div data-testid="text-report-date-${report.id}">
                                        <strong>Created:</strong> ${createdDate} ${createdTime}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                                <button 
                                    class="action-btn load-report-btn" 
                                    data-report-id="${report.id}"
                                    data-testid="button-load-report-${report.id}"
                                    title="Load this report"
                                >
                                    Load
                                </button>
                                <button 
                                    class="clear-btn delete-report-btn" 
                                    data-report-id="${report.id}"
                                    data-testid="button-delete-report-${report.id}"
                                    title="Delete this report"
                                    style="padding: 8px 16px;"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            listContainer.innerHTML = reportsHTML;

            listContainer.querySelectorAll('.load-report-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const reportId = e.target.getAttribute('data-report-id');
                    await this.loadReportFromDatabase(reportId);
                    this.closeModal(modal);
                });
            });

            listContainer.querySelectorAll('.delete-report-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const reportId = e.target.getAttribute('data-report-id');
                    if (confirm('Are you sure you want to delete this report?')) {
                        await this.deleteReport(reportId);
                        await this.showLoadModal();
                    }
                });
            });

        } catch (error) {
            console.error('Load modal error:', error);
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgb(var(--error));" data-testid="text-load-error">
                    <p style="font-size: 16px; margin-bottom: 8px;">We couldn't load your saved reports</p>
                    <p style="font-size: 14px;">Please check your connection and try again.</p>
                </div>
            `;
        }
    }

    async loadReportFromDatabase(id) {
        try {
            const response = await fetch(`/api/reports/${id}`, {
                headers: {
                    ...this.getAuthHeaders()
                }
            });
            if (!response.ok) {
                throw new Error('We couldn\'t load this report. Please try again.');
            }

            const report = await response.json();

            const resultsContainer = document.getElementById('resultsContainer');
            if (resultsContainer && report.htmlContent) {
                resultsContainer.innerHTML = report.htmlContent;
            }

            const noResults = document.getElementById('noResults');
            if (noResults) {
                noResults.style.display = 'none';
            }

            let metadata = {};
            try {
                metadata = JSON.parse(report.metadata || '{}');
            } catch (e) {
                console.warn('Failed to parse metadata:', e);
            }

            this.currentResult = {
                id: report.id,
                payload: metadata,
                structured: { 
                    html: report.htmlContent,
                    text: this.stripHTML(report.htmlContent)
                },
                createdAt: report.createdAt,
                checksum: report.checksum
            };

            this.saveCurrentResult();
            
            // Restore KPI panel and badges from saved metadata
            if (metadata && Object.keys(metadata).length > 0) {
                this.updateKPIPanel(metadata);
                this.updateSignalsBadges(metadata);
            }
            
            this.showSuccess(`Report "${report.name}" loaded successfully!`);

        } catch (error) {
            console.error('Load error:', error);
            this.showError(error.message || 'We couldn\'t load this report. Please try again.');
        }
    }

    async deleteReport(id) {
        try {
            const response = await fetch(`/api/reports/${id}`, {
                method: 'DELETE',
                headers: {
                    ...this.getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error('We couldn\'t delete this report. Please try again.');
            }

            this.showSuccess('Report deleted successfully');

        } catch (error) {
            console.error('Delete error:', error);
            this.showError(error.message || 'We couldn\'t delete this report. Please try again.');
        }
    }
}

// =====================================================
// INITIALIZE ON PAGE LOAD
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.complianceToolkit = new ComplianceToolkit();
    window.toolkit = window.complianceToolkit; // Alias for backwards compatibility
});
