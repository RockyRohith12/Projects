
import { generateRecommendations } from './recommendationService.js';

const profile = {
  activity: 'student',
  commute: 'two-wheeler',
  sensitivity: 'none',
  outdoorTime: '2-4',
};

const scenarios = [
  
{
  name: 'PM2.5 Dominant',
  aqi: 55,
  pollutantAqi: {
    indices: {
      us_aqi_pm2_5: 55,
      us_aqi_pm10: 11,
      us_aqi_ozone: 30,
      us_aqi_nitrogen_dioxide: 4,
      us_aqi_sulphur_dioxide: 5,
      us_aqi_carbon_monoxide: 2,
    },
  },
},
{
  name: 'Ozone Dominant',
  aqi: 75,
  pollutantAqi: {
    indices: {
      us_aqi_pm2_5: 20,
      us_aqi_pm10: 15,
      us_aqi_ozone: 75,
      us_aqi_nitrogen_dioxide: 8,
      us_aqi_sulphur_dioxide: 5,
      us_aqi_carbon_monoxide: 2,
    },
  },
},
{
  name: 'PM10 Dominant',
  aqi: 80,
  pollutantAqi: {
    indices: {
      us_aqi_pm2_5: 20,
      us_aqi_pm10: 80,
      us_aqi_ozone: 25,
      us_aqi_nitrogen_dioxide: 8,
      us_aqi_sulphur_dioxide: 5,
      us_aqi_carbon_monoxide: 2,
    },
  },
},

];

scenarios.forEach((scenario) => {
  console.log(`\n--- ${scenario.name} ---`);

const results = generateRecommendations(
  scenario.aqi,
  profile,
  scenario.weather || {
    precipitation: 0,
    rain: 0,
    showers: 0,
    apparent_temperature: 25,
    wind_speed_10m: 10,
  },
  scenario.pollutantAqi || null
);

  results.forEach((item) => {
    console.log(`[${item.priority}] ${item.title}`);
  });
});
