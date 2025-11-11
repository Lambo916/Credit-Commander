# Credit Commander

**AI-Powered Business Credit Building & Funding Roadmaps**

Credit Commander is a production-grade platform that delivers professional credit improvement roadmaps using AI. Built with a modern tech stack featuring a blue and yellow theme, dark mode by default, and comprehensive credit analysis across 9 strategic sections.

## Features

- **AI-Powered Credit Analysis**: GPT-4o generates personalized credit building roadmaps
- **9-Section Strategic Framework**: Profile Summary → Banking Signals → Quick Wins → Trade Lines → Vendors → Card Strategy → Cards → Action Plan → Risk Flags
- **Professional Export Options**: Clean PDF export, HTML panel view, and CSV data export
- **Data Persistence**: Save and load reports with PostgreSQL backend
- **Dark/Light Theme**: Persistent theme preferences with localStorage
- **Credit Signal Badges**: Visual indicators for banking, data foundation, and business setup
- **Version Control**: Automatic cache invalidation for stale results
- **Mobile Responsive**: Optimized for all device sizes
- **30-Report Usage Tracking**: IP-based rate limiting for soft launch

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 with custom CSS variables
- **Backend**: Express.js with TypeScript
- **AI Integration**: OpenAI GPT-4o
- **Database**: PostgreSQL via Neon with Drizzle ORM
- **PDF Export**: jsPDF with custom rendering engine
- **Deployment**: Vercel serverless functions
- **Development**: Vite dev server with hot reload

## Color Scheme

### Credit Commander Branding
- **Primary Blue**: #4DB6E7 (Light Blue)
- **Accent Gold**: #FFD54A (Yellow/Gold)
- **Success Green**: #4CAF50
- **Error Red**: #F44336

### Dark Theme (Default)
- **Background**: Dark gradient (#0A0A0A → #1A1A1A)
- **Cards**: Elevated dark surfaces with blue borders
- **Text**: Pure white (#FFFFFF)
- **Accents**: Gold glows and blue highlights

### Light Theme
- **Background**: Enhanced blue→white gradient
- **Cards**: White with subtle shadows
- **Text**: Dark slate (#1e293b)
- **Accents**: Gold buttons and blue links

## Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/Lambo916/Credit-Commander.git
cd Credit-Commander
npm install
```

### 2. Environment Variables
Add to Replit Secrets or `.env`:
```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
```

### 3. Run Development Server
```bash
npm run dev
```
Application runs at `http://localhost:5000`

### 4. Database Setup
```bash
npm run db:push
```

## Deployment

### Vercel Deployment (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `DATABASE_URL`
   - `SESSION_SECRET`
3. Deploy automatically on push to main branch

### Custom Domain
Point your domain DNS to Vercel and configure in Vercel dashboard.

## File Structure

```
/
├── public/
│   ├── index.html              # Main application
│   ├── style.css               # Credit Commander theming
│   ├── script.js               # Core application logic
│   ├── pdf-export.js           # PDF generation engine
│   ├── privacy.html            # Privacy policy
│   ├── terms.html              # Terms of service
│   └── attached_assets/        # Logos and images
├── server/
│   ├── index.ts                # Express server
│   ├── routes.ts               # API endpoints
│   ├── db.ts                   # Database connection
│   └── auth.ts                 # Authentication
├── shared/
│   ├── schema.ts               # Database schema
│   └── filing-profiles.ts      # Credit filing profiles
├── api/                        # Vercel serverless functions
└── package.json
```

## API Endpoints

- `POST /api/generate` - Generate credit roadmap
  - Request: Business and credit profile data
  - Response: Structured 9-section roadmap with HTML

- `POST /api/reports/save` - Save report to database
- `GET /api/reports/list` - List saved reports
- `GET /api/reports/:id` - Get specific report
- `DELETE /api/reports/:id` - Delete report

- `POST /api/usage/check` - Check usage limit
- `POST /api/usage/increment` - Increment usage counter

## Credit Roadmap Sections

1. **Profile Summary** - Current state overview with KPIs
2. **Banking & Data Signals** - Foundation building blocks
3. **Quick Wins** - Immediate 30-day actions
4. **Trade Lines** - Credit building accounts
5. **Recommended Vendors** - Vendor credit opportunities
6. **Card Strategy** - Strategic card approach
7. **Recommended Cards** - Specific card recommendations
8. **90-Day Action Plan** - Phased implementation timeline
9. **Risk Flags** - Warnings and considerations

## Security Features

- Environment variable protection for API keys
- HTML sanitization to prevent XSS
- IP-based rate limiting (30 reports per tool)
- Session management with PostgreSQL storage
- CORS configuration for iframe embedding
- Secure client ID system for anonymous users

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Production Optimizations

- Version-based cache invalidation
- Checksum verification for report integrity
- localStorage for form field persistence
- Automatic workflow restarts after changes
- Clean PDF export (no duplicate metadata)
- Backward compatibility for legacy data

## License

© 2025 Credit Commander - All Rights Reserved

---

**Version**: 1.0.0 (Production Ready)  
**Last Updated**: November 2025  
**GitHub**: https://github.com/Lambo916/Credit-Commander

## Changelog

### v1.0.0 (November 2025)
- Initial production release
- Complete rebrand from GrantGenie to Credit Commander
- 9-section credit roadmap framework
- Clean PDF export with no HR separators
- Backward compatibility for legacy reports
- Toolkit identifier migration (grantgenie → creditcommander)
- Simplified configuration (removed multi-toolkit architecture)
- Credit signal badge system
- Version-based cache invalidation
