
import { getAirQuality } from "../services/airQualityService.js";

export const fetchAirQuality = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    const data = await getAirQuality(lat, lon);

    return res.status(200).json({
      success: true,
      location: {
        latitude: lat,
        longitude: lon,
      },
      data,
    });
  } catch (error) {
    console.error("Air quality controller error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to retrieve air quality data",
    });
  }
};
