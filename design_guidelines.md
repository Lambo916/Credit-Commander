# Credit Commander Design Guidelines

## Design Approach
**System-Based Approach**: Following Material Design principles with custom Credit Commander branding for a professional, credit-focused dashboard interface with dark mode by default.

## Core Design Elements

### Color Palette
**Primary Colors:**
- Light Blue: #4DB6E7 (primary brand color)
- Gold/Yellow: #FFD54A (accent color for highlights and CTAs)
- White: #FFFFFF
- Dark Background: #0A0A0A → #1A1A1A gradient
- Success Green: #4CAF50
- Error Red: #F44336

**Usage:**
- Primary buttons: Gold backgrounds with dark text
- Secondary buttons: Blue outlines with white text (dark mode)
- Credit signals: Badge components with colored backgrounds
- Headers: Blue shield logo with Credit Commander branding
- Accents: Gold for important CTAs and highlights

### Typography
**Font Stack:**
- Headings: Montserrat (600 weight for app title, 500 for section headers)
- Body Text: Open Sans (400 regular, 600 semi-bold for labels)
- Button Text: Open Sans 500 semi-bold

**Hierarchy:**
- H1 (App Title): Montserrat 600, 28px desktop / 24px mobile
- Section Labels: Montserrat 500, 18px
- Body Text: Open Sans 400, 16px
- Button Text: Open Sans 500, 14px

### Layout System
**Spacing Units:** Consistent use of 4px, 8px, 16px, 24px, 32px increments
- Component padding: 16px standard, 24px for panels
- Element margins: 8px between related items, 24px between sections
- Button padding: 12px vertical, 20px horizontal

**Grid Structure:**
- Desktop: Single-column layout optimized for credit roadmap display
- Mobile: Responsive stacking with optimized touch targets
- Container max-width: 1200px with 24px side margins

### Component Library

**Panels:**
- Border radius: 16px
- Box shadow: 0 2px 8px rgba(0,0,0,0.08) (light mode)
- Background: Dark elevated surfaces with blue borders (dark mode)
- Padding: 24px

**Buttons:**
- Primary: Gold background (#FFD54A), dark text, 8px border radius
- Secondary: Blue outline with transparent background
- Hover: Subtle scale (1.02) and glow enhancement
- Focus: 2px blue outline for accessibility
- Padding: 12px vertical, 20px horizontal

**Credit Signal Badges:**
- Compact badge components with colored backgrounds
- Icons + text for visual recognition
- Green for positive signals, blue for neutral, red for warnings
- Border radius: 6px for rounded badge appearance

**Form Elements:**
- Textarea/Inputs: 1px border, 8px border radius, 12px padding
- Focus state: Blue border and subtle glow
- Dark mode: Light text on dark input backgrounds
- Placeholder text: Muted gray

**Results Display:**
- Clean HTML panel rendering with section headings
- PDF export with professional formatting
- CSV data export for analysis
- Save/load functionality with database persistence

### Theme System

**Dark Mode (Default):**
- Background: Dark gradient (#0A0A0A → #1A1A1A)
- Cards: Elevated dark surfaces with blue borders
- Text: Pure white (#FFFFFF)
- Accents: Gold glows and blue highlights
- Logo: 197px height with transparent background

**Light Mode:**
- Background: Blue→white gradient
- Cards: White with subtle shadows
- Text: Dark slate (#1e293b)
- Accents: Gold buttons and blue links

**Theme Persistence:**
- Stored in localStorage as 'cc-theme'
- Theme toggle with sun/moon icons
- Respects user preference across sessions

### Micro-Interactions
**Minimal Animation:**
- Button hover: 150ms ease scale and shadow
- Loading state: Subtle pulse on generate button
- Focus transitions: 200ms ease for outline appearance
- Theme toggle: Smooth transition between modes

### Visual Hierarchy
- Credit Commander logo (197px height) and title prominent in header
- Clear KPI dashboard with credit metrics
- Credit signal badges for quick status visibility
- 9-section roadmap with logical storytelling flow
- Professional PDF export matching panel design

### Mobile Considerations
- Touch-friendly button sizes (minimum 44px height)
- Adequate spacing between interactive elements
- Readable text sizes (minimum 16px for inputs)
- Responsive logo and header layout
- Optimized form field stacking

### Accessibility Standards
- WCAG AA contrast ratios maintained
- Focus indicators on all interactive elements
- Proper semantic HTML structure
- Screen reader friendly labels and descriptions
- Reduced motion support for animations

### Credit Commander Branding
- Blue shield logo at 197px height
- Light blue (#4DB6E7) + Gold (#FFD54A) color scheme
- Professional credit-focused interface
- Dark mode by default for modern aesthetic
- Clean, minimal design optimized for readability

This design system ensures consistency while maintaining the professional Credit Commander brand identity and optimizing for credit analysis workflows and client-facing use.
