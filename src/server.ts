import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import { errorHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';
import routes from './routes';

import passport from './config/passport';

const app = express();

// Global middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiRateLimiter);
app.use(passport.initialize());

// API Routes
app.use('/api/v1', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Endpoint tidak ditemukan',
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────┐
  │                                     │
  │   🚀 KampusCuan API Server          │
  │   Running on port ${PORT}              │
  │   Environment: ${env.NODE_ENV}        │
  │                                     │
  └─────────────────────────────────────┘
  `);
});

export default app;
