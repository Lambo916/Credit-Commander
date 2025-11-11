import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { authenticateToken } from "./auth";

const app = express();

// Trust proxy - Required for accurate IP detection behind Vercel/Replit proxies
// Set to 1 to trust the first proxy (Vercel/Replit edge) but prevent header spoofing
// This allows Express to read X-Forwarded-For headers securely
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS Configuration
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction 
  ? [
      'https://grant.yourbizguru.com',
      /\.vercel\.app$/, // Allow Vercel preview deployments
    ]
  : [
      'http://localhost:5000', 
      'http://localhost:5173',
      /\.replit\.dev$/, // Allow Replit development domains
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      return allowed.test(origin);
    });
    
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Owner-Id'],
  credentials: true,
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Add authentication middleware
app.use(authenticateToken);

// Prevent aggressive caching of favicon and icon files
app.use((req, res, next) => {
  if (req.path.includes('favicon') || req.path.includes('apple-icon') || req.path.includes('chrome-')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Production-safe error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log full error server-side
    console.error('Server error:', {
      message: err.message,
      stack: err.stack,
      status,
    });
    
    // Return generic message in production, detailed in development
    if (process.env.NODE_ENV === 'production') {
      res.status(status).json({ 
        error: 'Something went wrong. Please try again later.' 
      });
    } else {
      res.status(status).json({ 
        error: err.message || 'Internal Server Error',
        stack: err.stack 
      });
    }
  });

  // Add no-cache headers for JavaScript files in development to prevent cache issues
  if (app.get("env") === "development") {
    app.use((req, res, next) => {
      if (req.url.endsWith('.js') || req.url.includes('.js?')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      next();
    });
  }

  // Serve attached_assets folder (for logos, images, etc.)
  app.use("/attached_assets", express.static("attached_assets"));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`CORS: ${isProduction ? 'Production (locked)' : 'Development (permissive)'}`);
    
    // Log API key detection (masked)
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const masked = `${apiKey.substring(0, 4)}****${apiKey.substring(apiKey.length - 4)}`;
      log(`OPENAI key detected: ${masked}`);
    } else {
      log("⚠️  OPENAI_API_KEY not found in environment variables");
    }
  });
})();
