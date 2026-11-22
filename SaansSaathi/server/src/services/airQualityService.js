
const AIR_QUALITY_API =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

export const getAirQuality = async (latitude, longitude) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      "pm2_5",
      "pm10",
      "carbon_monoxide",
      "nitrogen_dioxide",
      "sulphur_dioxide",
      "ozone",
      "us_aqi",
      "european_aqi",
    ].join(","),
    timezone: "auto",
  });

  const response = await fetch(`${AIR_QUALITY_API}?${params}`);

  if (!response.ok) {
    throw new Error("Unable to fetch air quality data");
  }

  return response.json();
};
