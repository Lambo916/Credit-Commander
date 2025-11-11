# GrantGenie Toolkit Template Design Guidelines

## Design Approach
**System-Based Approach**: Following Material Design principles with custom GrantGenie branding for a professional, productivity-focused mini-dashboard interface.

## Core Design Elements

### Color Palette
**Primary Colors:**
- Light Blue: 197 87% 64% (primary brand color #4FC3F7)
- Yellow: 56 100% 62% (accent color - use sparingly)
- White: 0 0% 100%
- Gray: 0 0% 62%
- Black: 0 0% 0%

**Usage:**
- Primary buttons and CTAs: Black backgrounds with white text
- Input focus states and active elements: Light blue
- Minimal yellow accents for success states only
- Clean white backgrounds with subtle gray borders

### Typography
**Font Stack:**
- Headings: Montserrat (600 weight for toolkit names, 500 for section headers)
- Body Text: Open Sans (400 regular, 600 semi-bold for labels)
- Button Text: Open Sans 500 semi-bold

**Hierarchy:**
- H1 (Toolkit Name): Montserrat 600, 28px desktop / 24px mobile
- Section Labels: Montserrat 500, 18px
- Body Text: Open Sans 400, 16px
- Button Text: Open Sans 500, 14px

### Layout System
**Spacing Units:** Consistent use of 4px, 8px, 16px, 24px, 32px increments
- Component padding: 16px standard, 24px for panels
- Element margins: 8px between related items, 24px between sections
- Button padding: 12px vertical, 20px horizontal

**Grid Structure:**
- Desktop: 2-column layout (40% input panel, 60% results panel)
- Mobile: Stacked single-column with input panel first
- Container max-width: 1200px with 24px side margins

### Component Library

**Panels:**
- Border radius: 16px
- Box shadow: 0 2px 8px rgba(0,0,0,0.08)
- Background: White with 1px light gray border
- Padding: 24px

**Buttons:**
- Primary: Black background, white text, 8px border radius
- Hover: Subtle scale (1.02) and shadow enhancement
- Focus: 2px light blue outline
- Padding: 12px vertical, 20px horizontal

**Form Elements:**
- Textarea/Inputs: 1px gray border, 8px border radius, 12px padding
- Focus state: Light blue border and subtle glow
- Placeholder text: Medium gray

**Results Display:**
- Each result in bordered container with timestamp
- Copy and download buttons inline with each result
- Maximum 5 stored results with scroll overflow

### Micro-Interactions
**Minimal Animation:**
- Button hover: 150ms ease scale and shadow
- Loading state: Subtle pulse on submit button
- Focus transitions: 200ms ease for outline appearance
- No distracting animations or unnecessary motion

### Visual Hierarchy
- Logo and toolkit name prominent in header
- Clear separation between input and results panels
- Results displayed chronologically with clear timestamps
- Footer attribution subtle but visible

### Mobile Considerations
- Touch-friendly button sizes (minimum 44px height)
- Adequate spacing between interactive elements
- Readable text sizes (minimum 16px for inputs)
- Optimized panel stacking with appropriate margins

### Accessibility Standards
- WCAG AA contrast ratios maintained
- Focus indicators on all interactive elements
- Proper semantic HTML structure
- Screen reader friendly labels and descriptions

This design system ensures consistency while maintaining the professional GrantGenie brand identity and optimizing for standalone use and iframe embedding.