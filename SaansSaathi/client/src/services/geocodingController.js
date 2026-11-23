
import { getLocationName } from '../services/geocodingService.js';

export const fetchLocationName = async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    if (
      req.query.latitude === undefined ||
      req.query.longitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required',
      });
    }

    const location = await getLocationName(latitude, longitude);

    return res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    console.error('Geocoding controller error:', error.message);

    return res.status(502).json({
      success: false,
      message: 'Unable to identify your location',
    });
  }
};
