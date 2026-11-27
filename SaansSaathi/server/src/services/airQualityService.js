
const AIR_QUALITY_API =
  'https://air-quality-api.open-meteo.com/v1/air-quality';

const WEATHER_API =
  'https://api.open-meteo.com/v1/forecast';

// ==========================================
// 1. COMMON API FETCH FUNCTION
// ==========================================

const fetchApiData = async (url, params, timeout = 15000) => {
  const response = await fetch(`${url}?${params}`, {
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};

// ==========================================
// 2. GET CURRENT POLLUTANT-SPECIFIC AQI
// ==========================================

const getPollutantAqi = (airQualityData) => {
  const currentTime = airQualityData.current?.time;
  const hourly = airQualityData.hourly;

  if (!currentTime || !hourly?.time) {
    return null;
  }

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

// ==========================================
// 3. FETCH CURRENT AIR QUALITY AND WEATHER
// ==========================================

export const getAirQuality = async (latitude, longitude) => {
  const coordinates = {
    latitude: String(latitude),
    longitude: String(longitude),
  };

  const airQualityParams = new URLSearchParams({
    ...coordinates,

    // Current air quality
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

    // Hourly air quality and pollutant indices
    hourly: [
      'us_aqi',
      'european_aqi',
      'pm2_5',
      'pm10',
      'ozone',
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

  // Fetch AQI and weather independently
  const [airResult, weatherResult] = await Promise.allSettled([
    fetchApiData(AIR_QUALITY_API, airQualityParams),
    fetchApiData(WEATHER_API, weatherParams, 5000),
  ]);

  // AQI is essential
  if (airResult.status === 'rejected') {
    console.error('Air quality API error:', airResult.reason);

    throw new Error('Unable to fetch air-quality data');
  }

  const airQualityData = airResult.value;

  // Weather is optional
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

// ==========================================
// 4. FETCH NEXT 24 HOURS OF AQI FORECAST
// ==========================================

export const getAirQualityForecast = async (latitude, longitude) => {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Invalid location coordinates.');
  }

  const forecastParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: 'us_aqi',

    hourly: [
      'us_aqi',
      'pm2_5',
      'pm10',
      'ozone',
    ].join(','),

    forecast_days: '2',
    timezone: 'auto',
  });

  const forecastData = await fetchApiData(
    AIR_QUALITY_API,
    forecastParams
  );

  const currentTime = forecastData.current?.time;
  const hourly = forecastData.hourly;

  if (!currentTime || !hourly?.time) {
    throw new Error('AQI forecast data is unavailable.');
  }

  const currentHour = currentTime.slice(0, 13);

  const startIndex = hourly.time.findIndex(
    (time) => time.slice(0, 13) === currentHour
  );

  if (startIndex === -1) {
    throw new Error('Unable to identify the forecast start time.');
  }

  const forecast = [];

  for (
    let index = startIndex;
    index < Math.min(startIndex + 24, hourly.time.length);
    index++
  ) {
    forecast.push({
      time: hourly.time[index],
      us_aqi: hourly.us_aqi?.[index] ?? null,
      pm2_5: hourly.pm2_5?.[index] ?? null,
      pm10: hourly.pm10?.[index] ?? null,
      ozone: hourly.ozone?.[index] ?? null,
    });
  }

  if (forecast.length === 0) {
    throw new Error('No hourly forecast readings available.');
  }

  return {
    location: {
      latitude,
      longitude,
    },
    timezone: forecastData.timezone,
    units: forecastData.hourly_units,
    forecastHours: forecast.length,
    forecast,
    source: 'Open-Meteo Air Quality API',
  };
};
