# GrantGenie Master Template v1.1.2

This template includes GrantGenie branding, complete theming system (Light/Dark), tokenized CSS architecture with gradient polish, increased yellow accents, and persistent theme preferences. This serves as the **master template v1.1.2** for GrantGenie and related toolkits.

## Features

- **Dual Theme System**: Professional Light and Dark themes with persistent user preference
- **Tokenized CSS Architecture**: Reusable CSS variables for colors, gradients, shadows, and typography
- **Enhanced Yellow Accents**: Tasteful use of yellow (#FFEB3B) throughout both themes
- **Complete Icon Set**: Favicon, Apple Touch Icon, Android Chrome icons, and PWA manifest
- **Theme Persistence**: Respects system preferences with localStorage override capability
- **Accessibility First**: AA contrast compliance and reduced-motion support
- **AI-Powered Backend**: OpenAI GPT-4o-mini integration with fallback support
- **Mobile Responsive**: Optimized for all device sizes with theme-aware mobile chrome
- **PWA Ready**: Complete manifest and icon set for Progressive Web App deployment

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 with custom properties
- **Backend**: Express.js with TypeScript
- **AI Integration**: OpenAI API (GPT-4o-mini with GPT-3.5-turbo fallback)
- **Database**: PostgreSQL with Drizzle ORM (optional)
- **Development**: Vite, React (for client components), Tailwind CSS

## Branding Guidelines

### Colors (Both Themes)
- **Primary**: #4FC3F7 (Light Blue)
- **Accent**: #FFEB3B (Yellow)
- **Success**: #4CAF50 (Green)
- **Error**: #F44336 (Red)

### Light Theme (v1.1.3 "Less White")
- **Background**: Enhanced blue→white gradient with dual accent washes (yellow + blue)
- **Cards**: Multi-layer with blue tint fade, gradient rims, and panel sheen
- **Panel Headers**: Gradient background with enhanced styling
- **Text**: Dark slate (#1e293b) - AA compliant on all tinted backgrounds
- **Yellow Accents**: Enhanced button glows, stronger link cues, visible brand touches
- **Visual Depth**: Visible blue tints, gradient borders, reduced flat white appearance

### Dark Theme
- **Background**: Dark gradient (#0A0A0A → #1A1A1A → #0f0f0f)
- **Cards**: Elevated dark surfaces with blue borders
- **Text**: Pure white (#FFFFFF)
- **Yellow Accents**: Enhanced glows, dual-layer button effects, accent borders

### Typography
- **Headings**: Montserrat (with theme-aware shadows)
- **Body**: Open Sans
- **Sizes**: Consistent scale from 12px to 28px

### Interactive Elements
- Theme toggle with sun/moon icons
- Buttons with gradient backgrounds and theme-specific glows
- Dual-layer hover effects (blue core + yellow halo)
- Focus states with combined blue/yellow rings for accessibility

## Setup Instructions

1. **Clone the template**
   ```bash
   git clone [repository-url]
   cd grantgenie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Add your `OPENAI_API_KEY` to the secrets panel
   - Optionally add `SESSION_SECRET` for session management

4. **Run development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5000`

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### GoHighLevel Integration
Embed the dashboard using an iframe:
```html
<iframe 
  src="https://your-app.vercel.app" 
  width="100%" 
  height="800"
  frameborder="0">
</iframe>
```

## Themes

### Theme System Architecture
The template uses a tokenized CSS variable system located in `public/style.css`:

- **Root variables**: Define brand colors as RGB values for flexible alpha usage
- **Theme classes**: `.theme-light` (default) and `.theme-dark` applied to `<html>`
- **Token categories**:
  - Colors: `--bg`, `--card`, `--text`, `--muted`, `--border`
  - Brand: `--primary`, `--accent`, `--success`, `--error`
  - Gradients: `--bg-gradient`, `--btn-gradient`, `--accent-glow`
  - Shadows: `--shadow`, `--shadow-strong`, `--glow-primary`, `--glow-accent`

### Theme Behavior
1. **First Load**: Honors system preference via `prefers-color-scheme`
2. **Manual Toggle**: Overrides system preference, persists to localStorage (`ybg-theme`)
3. **Persistence**: User choice survives page refreshes
4. **System Changes**: Only applied if no manual preference is set

### Light Theme "Less White" Pass (v1.1.3)
Enhanced from v1.1.2 with stronger visual depth and reduced flat appearance:

**New Tokens:**
- `--bg-accent-wash-2`: Additional blue accent wash for dual-layer effect
- `--panel-tint`: Visible blue fade from top (6% opacity)
- `--panel-sheen`: White overlay for dimensional depth (65% opacity)  
- `--rim-gradient`: Blue fade borders via border-image (18% to 0%)
- `--panel-shadow`: Enhanced shadow for elevated feel
- `--divider-fade`: Subtle gradient dividers

**Enhanced Features:**
- Dual accent wash: Yellow (top-right) + Blue (bottom-left)
- Three-layer panel backgrounds: Sheen + Tint + Card gradient
- Gradient rim borders using border-image for crisp edges
- Enhanced button/link yellow cues with higher opacity
- Visible blue tints throughout while maintaining AA contrast
- `--card-border`: Subtle slate border (8% opacity)
- `--panel-header-glow`: Minimal blue glow (12% opacity)

### Customizing Theme Tokens
Toolkits can override specific tokens without modifying components:
```css
/* Example: Adjust accent wash intensity */
html.theme-light {
    --bg-accent-wash: radial-gradient(1200px 800px at 85% -120px, 
        rgba(255, 235, 59, 0.15), /* Stronger yellow */
        rgba(255, 255, 255, 0) 55%);
}

/* Example: Reduce card gradient contrast */
html.theme-light {
    --card-gradient: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
}
```

### Accessibility Features
- AA contrast compliance on all text/background combinations
- `prefers-reduced-motion`: Disables heavy animations and glows
- Focus rings: Blue core with subtle yellow halo
- Theme toggle: Keyboard accessible with clear focus states

## Customization for Specific Toolkits

To customize for each toolkit:

1. Update the title and description in `public/index.html`
2. Modify the OpenAI prompt system message in `server/routes.ts`
3. Adjust the placeholder text in the textarea
4. Update the `site.webmanifest` with toolkit-specific details
5. (Optional) Override theme tokens for toolkit-specific branding

## File Structure

```
/
├── public/
│   ├── index.html          # Main HTML with GrantGenie branding
│   ├── style.css           # Dark gradient theme with neon effects
│   ├── script.js           # Frontend JavaScript
│   ├── favicon.ico         # Browser favicon
│   ├── favicon-32x32.png   # 32px favicon
│   ├── apple-touch-icon.png # iOS icon
│   ├── android-chrome-*.png # Android icons
│   └── site.webmanifest    # PWA manifest
├── server/
│   ├── index.ts            # Express server entry
│   ├── routes.ts           # API routes with OpenAI integration
│   └── storage.ts          # Storage interface
├── client/
│   └── src/                # React components (if needed)
└── package.json            # Dependencies
```

## API Endpoints

- `GET /` - Serves the main dashboard
- `POST /api/generate` - Generates AI responses
  - Request: `{ "prompt": "Your business question" }`
  - Response: `{ "result": "AI response", "timestamp": "ISO date", "model": "gpt-4o-mini" }`

## Security Features

- API key validation and secure storage
- Input validation and sanitization
- Rate limiting ready
- CORS configuration for iframe embedding
- No API key logging in production

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

© 2025 GrantGenie - All Rights Reserved

---

**Version**: 1.1.2  
**Release Date**: September 2025  
**Template Tag**: `ybg-template-v1.1.2`  

### Changelog v1.1.2 (Light Theme Gradient Polish)
- Enhanced light theme with subtle gradient backgrounds
- Added faint yellow brand accent wash to page background
- Implemented card gradients (white→soft-gray) for depth
- Added minimal panel header glow for visual hierarchy
- Included button inner highlight for dimensional effect
- Maintained AA contrast compliance (14.63:1 verified)
- Dark theme remains unchanged from v1.1.0

### Changelog v1.1.0
- Added comprehensive Light/Dark theme system
- Implemented tokenized CSS architecture for reusability
- Increased yellow accent presence across both themes
- Added persistent theme toggle with localStorage
- Enhanced accessibility with AA contrast and reduced-motion support
- Improved button hover states with dual-layer glows