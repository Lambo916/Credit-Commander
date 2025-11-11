/**
 * YourBizGuru Toolkit Template - Express Server for Replit Development
 * Serves static files and handles API requests with OpenAI integration
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize OpenAI client
// Note: the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: 'development'
    });
});

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for generating toolkit results
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Input validation
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid request. Prompt is required and must be a string.' 
            });
        }

        if (prompt.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Prompt cannot be empty.' 
            });
        }

        if (prompt.length > 2000) {
            return res.status(400).json({ 
                error: 'Prompt is too long. Maximum 2000 characters allowed.' 
            });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
            console.error('OpenAI API key not configured');
            return res.status(500).json({ 
                error: 'Service configuration error. Please contact support.' 
            });
        }

        console.log('Generating response for prompt:', prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''));

        // Call OpenAI API
        // Note: the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        const completion = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful business assistant powered by YourBizGuru. Provide professional, actionable advice and solutions. Be concise but comprehensive in your responses."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2048,
        });

        const result = completion.choices[0].message.content;

        console.log('Response generated successfully');

        res.json({ 
            result,
            timestamp: new Date().toISOString(),
            model: "gpt-5"
        });

    } catch (error) {
        console.error('Error in /api/generate:', error);

        // Handle specific OpenAI errors
        if (error.code === 'insufficient_quota') {
            return res.status(503).json({ 
                error: 'Service temporarily unavailable. Please try again later.' 
            });
        }

        if (error.code === 'model_not_found') {
            return res.status(503).json({ 
                error: 'AI model temporarily unavailable. Please try again later.' 
            });
        }

        if (error.status === 429) {
            return res.status(429).json({ 
                error: 'Too many requests. Please wait a moment and try again.' 
            });
        }

        if (error.status === 401) {
            return res.status(500).json({ 
                error: 'Authentication error. Please contact support.' 
            });
        }

        // Generic error response
        res.status(500).json({ 
            error: 'An unexpected error occurred. Please try again.' 
        });
    }
});


// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error' 
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`YBG Toolkit Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: development`);
    console.log(`OpenAI API configured: ${!!process.env.OPENAI_API_KEY}`);
    
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
        console.warn('   Add it to Replit Secrets or .env file for full functionality');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down server gracefully...');
    process.exit(0);
});