
import { getHistoricalAirQuality } from '../services/historicalAirQualityService.js';

// ==========================================
// GET HISTORICAL AIR QUALITY
// ==========================================

export const getHistoricalAirQualityController = async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const date = req.query.date;

    // Validate coordinates
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required.',
      });
    }

    // Validate date
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required in YYYY-MM-DD format.',
      });
    }

    const result = await getHistoricalAirQuality(
      latitude,
      longitude,
      date
    );

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error(
      'Historical AQI Controller Error:',
      error.message
    );

    return res.status(502).json({
      success: false,
      message: error.message || 'Unable to retrieve historical air quality.',
    });
  }
};
