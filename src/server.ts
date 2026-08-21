import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/environment.js';
import { connectDatabase } from './config/database.js';
import { corsMiddleware, helmetMiddleware, apiRateLimiter } from './middleware/security.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app: Express = express();

// Security and utility middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRateLimiter);

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  // Connect to database (handles missing URI gracefully)
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`🚀 UD Diagnostic Backend running on http://localhost:${config.port}`);
    console.log(`📡 Health endpoint: http://localhost:${config.port}/api/health`);
    console.log(`🌐 Environment: ${config.nodeEnv}`);
  });

  // Set HTTP socket timeout to 2 minutes for deep AI report generation
  server.setTimeout(120000);
};

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
