
const AIR_QUALITY_API =
  'https://air-quality-api.open-meteo.com/v1/air-quality';

const WEATHER_API =
  'https://api.open-meteo.com/v1/forecast';

const fetchApiData = async (url, params) => {
  const response = await fetch(`${url}?${params}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};

const getPollutantAqi = (airQualityData) => {
  const currentTime = airQualityData.current?.time;
  const hourly = airQualityData.hourly;

  if (!currentTime || !hourly?.time) {
    return null;
  }

  // Match the current reading to its local hourly forecast.
  const currentHour = currentTime.slice(0, 13);

  const index = hourly.time.findIndex(
    (time) => time.slice(0, 13) === currentHour
  );

  if (index === -1) {
    return null;
  }

  const variables = [
    'us_aqi_pm2_5',
    'us_aqi_pm10',
    'us_aqi_ozone',
    'us_aqi_nitrogen_dioxide',
    'us_aqi_sulphur_dioxide',
    'us_aqi_carbon_monoxide',
  ];

  const result = {};

  for (const variable of variables) {
    result[variable] = hourly[variable]?.[index] ?? null;
  }

  return {
    time: hourly.time[index],
    indices: result,
  };
};

export const getAirQuality = async (latitude, longitude) => {
  const coordinates = {
    latitude: String(latitude),
    longitude: String(longitude),
  };

  const airQualityParams = new URLSearchParams({
    ...coordinates,

    current: [
      'pm2_5',
      'pm10',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'us_aqi',
      'european_aqi',
    ].join(','),

    hourly: [
      'us_aqi_pm2_5',
      'us_aqi_pm10',
      'us_aqi_ozone',
      'us_aqi_nitrogen_dioxide',
      'us_aqi_sulphur_dioxide',
      'us_aqi_carbon_monoxide',
    ].join(','),

    timezone: 'auto',
  });

  const weatherParams = new URLSearchParams({
    ...coordinates,

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

  const [airResult, weatherResult] = await Promise.allSettled([
    fetchApiData(AIR_QUALITY_API, airQualityParams),
    fetchApiData(WEATHER_API, weatherParams),
  ]);

  if (airResult.status === 'rejected') {
    throw new Error('Unable to fetch air-quality data');
  }

  const airQualityData = airResult.value;

  const weather =
    weatherResult.status === 'fulfilled'
      ? {
          current: weatherResult.value.current,
          units: weatherResult.value.current_units,
          timezone: weatherResult.value.timezone,
        }
      : null;

  if (!weather) {
    console.warn('Weather data is currently unavailable.');
  }

  const pollutantAqi = getPollutantAqi(airQualityData);

  return {
    ...airQualityData,
    weather,
    pollutantAqi,
  };
};
