const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate Limiting: 100 requests per 15 minutes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false, 
    message: { status: 'error', message: 'Too many requests, please try again later.' }
});

app.use(cors());
app.use(limiter); 

// Stricter Rate Limiting for AI endpoints (20 requests per 15 minutes)
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'AI generation limit reached. Please try again in 15 minutes.' }
});

// Apply stricter limit to high-cost AI routes
app.use('/api/v1/query', aiLimiter);
app.use('/api/v1/summarize', aiLimiter);
app.use('/api/v1/draft', aiLimiter);
app.use('/api/v1/compare', aiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'API Gateway' });
});

// Proxy Configuration for RAG Service
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

const path = require('path');

// API Routes Proxy
app.use('/api/v1', createProxyMiddleware({ 
    target: RAG_SERVICE_URL, 
    changeOrigin: true,
    pathRewrite: {
        '^/api/v1': '', // Remove /api/v1 prefix when forwarding to RAG service
    },
    onProxyReq: (proxyReq, req, res) => {
        // Optional: Add logging or auth headers here
        console.log(`[Gateway] Forwarding ${req.method} request to: ${proxyReq.path}`);
    },
    proxyTimeout: 300000,
    timeout: 300000
}));

// Serve Static Files from Frontend Dist (Production)
const DIST_PATH = path.join(__dirname, '../dist');
app.use(express.static(DIST_PATH));

// Catch-all route for SPA
app.get('*', (req, res) => {
    // Check if the request is not for an API route
    if (!req.path.startsWith('/api/v1')) {
        res.sendFile(path.join(DIST_PATH, 'index.html'));
    }
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying /api/v1 -> ${RAG_SERVICE_URL}`);
});
