
import express from 'express';

import {
  fetchAirQualityForecast,
} from '../controllers/forecastController.js';

const router = express.Router();

// GET /api/forecast?latitude=...&longitude=...
router.get('/', fetchAirQualityForecast);

export default router;
