import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import axios from 'axios';

const router = Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

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

    const targetUrl = `${ML_SERVICE_URL}${req.path}${queryParams ? '?' + queryParams : ''}`;
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('ML API Proxy Error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ status: 'error', message: 'ML Service unavailable' });
  }
});

export default router;
