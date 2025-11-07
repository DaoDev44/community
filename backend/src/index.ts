import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './api/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS - restrict to frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour for anonymous
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (outside /api/v1)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// API v1 routes will be mounted here
// Example: app.use('/api/v1/auth', authRouter);
// Example: app.use('/api/v1/donators', donatorRouter);
// Example: app.use('/api/v1/recipients', recipientRouter);
// Example: app.use('/api/v1/donations', donationRouter);
// Example: app.use('/api/v1/needs', needRouter);
// Example: app.use('/api/v1/webhooks', webhookRouter);

// Temporary root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'CommUnity API',
      version: '1.0.0',
      docs: '/api/v1/docs',
    },
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 CommUnity Backend API                                  ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  📍 Server:      http://localhost:${PORT.toString().padEnd(26)}║`);
  console.log(`║  🏥 Health:      http://localhost:${PORT}/health${' '.repeat(17)}║`);
  console.log(`║  📊 Environment: ${(process.env.NODE_ENV || 'development').padEnd(26)}║`);
  console.log(`║  🗄️  Database:    PostgreSQL                                ║`);
  console.log(`║  💾 Storage:     MinIO (S3-compatible)                     ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
