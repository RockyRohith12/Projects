
const AIR_QUALITY_API =
  'https://air-quality-api.open-meteo.com/v1/air-quality';

// ==========================================
// 1. FETCH API DATA
// ==========================================

const fetchApiData = async (url, params) => {
  const response = await fetch(`${url}?${params}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Air quality API failed: ${response.status}`);
  }

  return response.json();
};

// ==========================================
// 2. VALIDATE INPUTS
// ==========================================

const validateInputs = (latitude, longitude, date) => {
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

  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error('Date must be in YYYY-MM-DD format.');
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error('Invalid calendar date.');
  }
};

// ==========================================
// 3. FETCH HOURLY AIR QUALITY FOR A DATE
// ==========================================

export const getHistoricalAirQuality = async (
  latitude,
  longitude,
  date
) => {
  validateInputs(latitude, longitude, date);

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    start_date: date,
    end_date: date,

    hourly: [
      'us_aqi',
      'european_aqi',
      'pm2_5',
      'pm10',
      'ozone',
    ].join(','),

    timezone: 'auto',
  });

  const data = await fetchApiData(AIR_QUALITY_API, params);

  const hourly = data.hourly;

  if (!hourly?.time || hourly.time.length === 0) {
    throw new Error(
      'No hourly air-quality data is available for this date and location.'
    );
  }

  // ==========================================
  // 4. FORMAT HOURLY READINGS
  // ==========================================

  const readings = hourly.time.map((time, index) => ({
    time,

    us_aqi: hourly.us_aqi?.[index] ?? null,

    european_aqi:
      hourly.european_aqi?.[index] ?? null,

    pm2_5: hourly.pm2_5?.[index] ?? null,

    pm10: hourly.pm10?.[index] ?? null,

    ozone: hourly.ozone?.[index] ?? null,
  }));

  // Remove records where every requested variable is missing
  const validReadings = readings.filter((reading) =>
    [
      reading.us_aqi,
      reading.european_aqi,
      reading.pm2_5,
      reading.pm10,
      reading.ozone,
    ].some((value) => value !== null)
  );

  if (validReadings.length === 0) {
    throw new Error(
      'No usable hourly air-quality readings were returned.'
    );
  }

  return {
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
    },

    requestedDate: date,

    timezone: data.timezone,

    units: data.hourly_units,

    totalReadings: validReadings.length,

    readings: validReadings,

    source: 'Open-Meteo Air Quality API',

    disclaimer:
      'Air-quality values are model-based estimates and may not represent direct ground-station measurements.',
  };
};
