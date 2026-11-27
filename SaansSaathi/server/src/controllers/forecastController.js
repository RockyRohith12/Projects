
import {
  getAirQualityForecast,
} from '../services/airQualityService.js';

export const fetchAirQualityForecast = async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    if (
      req.query.latitude === undefined ||
      req.query.longitude === undefined ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid latitude and longitude.',
      });
    }

    const forecast = await getAirQualityForecast(
      latitude,
      longitude
    );

    return res.status(200).json({
      success: true,
      data: forecast,
    });

  } catch (error) {
    console.error('[Forecast Controller]', error.message);

    return res.status(502).json({
      success: false,
      message: 'Unable to retrieve AQI forecast data.',
    });
  }
};
