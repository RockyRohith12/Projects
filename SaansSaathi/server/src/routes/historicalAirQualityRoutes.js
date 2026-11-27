
import express from 'express';

import {
  getHistoricalAirQualityController,
} from '../controllers/historicalAirQualityController.js';

const router = express.Router();

// GET /api/historical-air-quality
router.get('/', getHistoricalAirQualityController);

export default router;
