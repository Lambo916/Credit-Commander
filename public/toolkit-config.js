// Credit Commander Configuration
// AI-powered business credit building and funding roadmaps

const CREDIT_COMMANDER_CONFIG = {
    name: "Credit Commander",
    tagline: "AI-powered business credit building and funding roadmaps",
    icon: "/favicon-32x32.png",
    logo: "creditcommander-logo.png",
    themeColor: "#4DB6E7", // Light Blue
    primaryColorRGB: "77, 182, 231",
    
    // Form configuration
    formType: "credit",
    
    // AI prompt template
    systemPromptTemplate: "credit",
    
    // PDF export settings
    pdfFilenamePrefix: "CreditCommander"
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.CREDIT_COMMANDER_CONFIG = CREDIT_COMMANDER_CONFIG;
    window.getToolkitName = function() { return CREDIT_COMMANDER_CONFIG.name; };
}
