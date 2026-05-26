import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import axios from 'axios';

const router = Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second base delay
const RETRYABLE_STATUSES = [429, 502, 503];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Setup proxy for all ML routes
router.use('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Append userId to the query parameters
    const queryParams = new URLSearchParams({
      ...req.query as Record<string, string>,
      user_id: userId
    }).toString();

    const baseUrl = ML_SERVICE_URL.endsWith('/') ? ML_SERVICE_URL.slice(0, -1) : ML_SERVICE_URL;
    const targetUrl = `${baseUrl}${req.path}${queryParams ? '?' + queryParams : ''}`;

    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`ML API Retry #${attempt} for ${req.path} after ${delay}ms...`);
          await sleep(delay);
        }

        const response = await axios({
          method: req.method,
          url: targetUrl,
          data: req.body,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000, // 30 second timeout
        });

        return res.status(response.status).json(response.data);
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;

        // Only retry on transient errors
        if (status && RETRYABLE_STATUSES.includes(status) && attempt < MAX_RETRIES) {
          console.warn(`ML API got ${status} for ${req.path}, will retry...`);
          continue;
        }

        // Non-retryable error or exhausted retries — break out
        break;
      }
    }

    // All retries exhausted or non-retryable error
    console.error('ML API Proxy Error:', lastError?.message);
    if (lastError?.response) {
      return res.status(lastError.response.status).json(lastError.response.data);
    }
    return res.status(500).json({ status: 'error', message: 'ML Service unavailable' });
  } catch (error: any) {
    console.error('ML API Proxy Error:', error.message);
    return res.status(500).json({ status: 'error', message: 'ML Service unavailable' });
  }
});

export default router;
