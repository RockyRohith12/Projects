
const API_BASE_URL = '/api/forecast';

export const fetchAirQualityForecast = async (
  latitude,
  longitude
) => {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error('Valid location coordinates are required.');
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  const response = await fetch(
    `${API_BASE_URL}?${params}`
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Unable to fetch AQI forecast.'
    );
  }

  return result.data;
};
