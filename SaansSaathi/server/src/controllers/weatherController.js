
import { getWeatherByCity } from '../services/weatherService.js';

export const fetchWeatherByCity = async (req, res) => {
  try {
    const { city } = req.query;

    if (
      typeof city !== 'string' ||
      !city.trim() ||
      city.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid city name.',
      });
    }

    const weather = await getWeatherByCity(city.trim());

    return res.status(200).json({
      success: true,
      data: weather,
    });

  } catch (error) {
    console.error('[Weather Controller]', error.message);

    if (error.message.startsWith('No location found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('valid city name')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(502).json({
      success: false,
      message: 'Unable to retrieve weather information.',
    });
  }
};
