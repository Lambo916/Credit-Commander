# Overview

Credit Commander is a production-grade AI-powered platform for building business credit and obtaining funding opportunities. The system delivers professional credit improvement roadmaps with database-backed report management, interactive dashboards, and a responsive desktop-first UX where the results panel fills available screen space. Built with a blue and yellow theme for a professional, modern interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Technology Stack**: Pure vanilla HTML, CSS, and JavaScript with no frameworks for maximum compatibility and minimal dependencies
- **Component Structure**: Single-page application with modular CSS variables for consistent Credit Commander branding (light blue primary, yellow accents)
- **UI Framework**: Uses shadcn/ui components with React for the client-side application, alongside Tailwind CSS for styling
- **Design System**: Material Design principles with custom Credit Commander branding, featuring a two-panel layout (40% input, 60% results on desktop, stacked on mobile)
- **Typography**: Montserrat for headings, Open Sans for body text with defined font weights and sizing hierarchy

## Backend Architecture
- **Development Environment**: Express.js server for local Replit development with static file serving
- **Production Deployment**: Vercel serverless functions for production scaling and cost efficiency
- **API Design**: RESTful endpoints with proper CORS headers for iframe embedding compatibility
- **Error Handling**: Comprehensive input validation and structured error responses with appropriate HTTP status codes

## Database and Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema Management**: Database migrations handled through drizzle-kit with proper connection configuration
- **Report Persistence**: PostgreSQL compliance_reports table stores saved reports with name, entity details, jurisdiction, filing type, deadline, HTML content, checksum, metadata (JSON), and creation timestamp
- **API Endpoints**: RESTful CRUD operations (/api/reports/save, /api/reports/list, /api/reports/:id) for report management
- **Local Storage**: Browser localStorage for caching current working report
- **Session Management**: PostgreSQL sessions with connect-pg-simple for user authentication (future feature)

## Authentication and Authorization
- **User Management**: Basic user schema with username/password authentication
- **Session Handling**: Server-side session storage using PostgreSQL with proper security configurations
- **API Security**: Environment variable protection for sensitive keys (OpenAI API, database URLs)

## AI Integration
- **Provider**: OpenAI GPT-4o integration for content generation
- **Super Smart AI Mode**: Enhanced AI system that dynamically handles ALL 50 states with state-specific forms, fees, deadlines, penalties, and official URLs
- **Hybrid Architecture**: Tries pre-built filing profiles first (e.g., California Annual Report), falls back to super smart AI for all other jurisdictions
- **API Management**: Centralized OpenAI client initialization with proper error handling and rate limiting
- **Content Processing**: Structured 6-section JSON output (summary, checklist, timeline, riskMatrix, recommendations, references) with Panel=PDF WYSIWYG parity

# External Dependencies

## Third-Party Services
- **OpenAI API**: GPT-5 model for AI-powered content generation with configurable API key management
- **Vercel Platform**: Production deployment and serverless function hosting with custom routing configuration
- **Neon Database**: PostgreSQL database service via @neondatabase/serverless for production data storage

## Development Tools
- **Package Management**: npm with lockfile for consistent dependency versions
- **Build Tools**: Vite for development server and build process with React plugin support
- **TypeScript**: Full TypeScript support with proper path aliases and type definitions
- **CSS Framework**: Tailwind CSS with custom design tokens and responsive utilities

## UI Components
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives for complex interactions
- **Lucide React**: Icon library providing consistent iconography across the application
- **React Hook Form**: Form validation and management with Zod schema validation
- **TanStack Query**: Server state management for API calls and caching strategies

## Deployment Infrastructure
- **DNS**: GoDaddy DNS management for custom domain routing
- **CDN**: Vercel's edge network for global content delivery and performance optimization
- **Static Assets**: Public folder structure for favicons, logos, and brand assets
- **Environment Management**: Separate development and production configurations with environment variable support