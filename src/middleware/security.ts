import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/environment.js';

// CORS configuration based on environment
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) in non-production
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    if (allowedOrigins.includes(origin) || !config.isProduction) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Helmet HTTP headers security
export const helmetMiddleware = helmet();

// General API rate limiter (generous limits for diagnostic auto-saving & development)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isProduction ? 1000 : 10000, // 1000 requests per 15 mins in prod, 10000 in dev
  skip: (req) => {
    // Skip rate limiter in development or for frequent auto-save requests
    if (!config.isProduction) return true;
    return req.path.includes('/assessment/save');
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
