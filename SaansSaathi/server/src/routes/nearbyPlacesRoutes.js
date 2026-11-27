
import express from 'express';

import {
  getNearbyHospitals,
} from '../controllers/nearbyPlacesController.js';

const router = express.Router();

// GET /api/nearby-places
router.get('/', getNearbyHospitals);

export default router;
