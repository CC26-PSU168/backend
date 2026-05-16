import cors from 'cors';
import { env } from './env';

export const corsOptions: cors.CorsOptions = {
  // Echo the request origin when in development so preflight with credentials succeeds
  origin: (origin, callback) => {
    // Allow requests without origin (like curl or server-to-server)
    if (!origin) return callback(null, true);
    // Allow configured client URL or echo origin in development
    if (origin === env.CLIENT_URL) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};
