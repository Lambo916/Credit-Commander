/**
 * YourBizGuru Toolkit Template - Vercel Serverless Function
 * Production API endpoint for OpenAI integration
 */

import OpenAI from 'openai';

// Initialize OpenAI client
// Note: the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    // Set CORS headers for iframe embedding
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed. Use POST.' 
        });
    }

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

        // Return successful response
        res.status(200).json({ 
            result,
            timestamp: new Date().toISOString(),
            model: "gpt-5"
        });

    } catch (error) {
        console.error('Error in serverless function:', error);

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
}