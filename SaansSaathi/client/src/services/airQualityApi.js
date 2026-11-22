
const API_BASE_URL = '/api/air-quality';

export const fetchAirQuality = async (latitude, longitude) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  const response = await fetch(`${API_BASE_URL}?${params}`);

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Unable to fetch air quality data'
    );
  }

  return result;
};
