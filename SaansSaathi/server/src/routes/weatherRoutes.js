import express from 'express';
import { fetchWeatherByCity } from '../controllers/weatherController.js';

const router = express.Router();

// GET /api/weather?city=Bengaluru
router.get('/', fetchWeatherByCity);

export default router;