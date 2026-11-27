
const GEOCODING_API =
  'https://geocoding-api.open-meteo.com/v1/search';

const WEATHER_API =
  'https://api.open-meteo.com/v1/forecast';

const fetchApiData = async (url, params) => {
  const response = await fetch(`${url}?${params}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Weather API request failed: ${response.status}`);
  }

  return response.json();
};

// Convert a city name into geographic coordinates.
const getCityCoordinates = async (city) => {
  const params = new URLSearchParams({
    name: city,
    count: '5',
    language: 'en',
    format: 'json',
  });

  const data = await fetchApiData(GEOCODING_API, params);

  if (!data.results?.length) {
    throw new Error(`No location found for "${city}".`);
  }

  // Use the first matching result for now.
  const place = data.results[0];

  return {
    name: place.name,
    country: place.country,
    admin1: place.admin1 || null,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
};

// Fetch current weather using city coordinates.
export const getWeatherByCity = async (city) => {
  if (
    typeof city !== 'string' ||
    !city.trim() ||
    city.trim().length > 100
  ) {
    throw new Error('Please provide a valid city name.');
  }

  const location = await getCityCoordinates(city.trim());

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),

    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'showers',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_gusts_10m',
    ].join(','),

    timezone: 'auto',
    wind_speed_unit: 'kmh',
  });

  const weatherData = await fetchApiData(WEATHER_API, params);

  return {
    location: {
      name: location.name,
      country: location.country,
      state: location.admin1,
    },
    current: weatherData.current,
    units: weatherData.current_units,
    timezone: weatherData.timezone,
  };
};
