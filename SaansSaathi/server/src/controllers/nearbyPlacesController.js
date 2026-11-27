
import {
  findNearbyHospitals,
} from '../services/nearbyPlacesService.js';

export const getNearbyHospitals = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = '5000',
    } = req.query;

    if (
      typeof latitude !== 'string' ||
      typeof longitude !== 'string' ||
      !latitude.trim() ||
      !longitude.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required.',
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const searchRadius = Number(radius);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !Number.isInteger(searchRadius)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location coordinates or search radius.',
      });
    }

    const hospitals = await findNearbyHospitals(
      lat,
      lon,
      searchRadius
    );

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      radius: searchRadius,
      data: hospitals,
    });

  } catch (error) {
    console.error('[Nearby Places Controller]', error.message);

    if (
      error.message.includes('Invalid location') ||
      error.message.includes('Invalid search radius')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(502).json({
      success: false,
      message: 'Unable to retrieve nearby healthcare facilities.',
    });
  }
};
