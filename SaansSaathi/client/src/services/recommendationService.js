
// 1. Identify the pollutant with the highest individual AQI
const findDominantPollutant = (pollutantAqi) => {
  if (!pollutantAqi?.indices) {
    return null;
  }

  const pollutants = {
    'PM2.5': 'us_aqi_pm2_5',
    'PM10': 'us_aqi_pm10',
    'Ozone': 'us_aqi_ozone',
    'Nitrogen Dioxide': 'us_aqi_nitrogen_dioxide',
    'Sulphur Dioxide': 'us_aqi_sulphur_dioxide',
    'Carbon Monoxide': 'us_aqi_carbon_monoxide',
  };

  const readings = Object.entries(pollutants)
    .map(([name, key]) => ({
      name,
      value: pollutantAqi.indices[key],
    }))
    .filter((item) => Number.isFinite(item.value));

  if (readings.length === 0) {
    return null;
  }

  return readings.reduce((highest, current) =>
    current.value > highest.value ? current : highest
  );
};


// 2. Analyze current weather conditions
const getWeatherCondition = (weather) => {
  if (!weather) return 'unavailable';

  const {
    precipitation,
    rain,
    showers,
    apparent_temperature,
    wind_speed_10m,
  } = weather;

  if (
    precipitation > 0 ||
    rain > 0 ||
    showers > 0
  ) {
    return 'rainy';
  }

  if (
    apparent_temperature > 35 ||
    apparent_temperature < 10 ||
    wind_speed_10m > 35
  ) {
    return 'uncomfortable';
  }

  return 'pleasant';
};


// 3. Main recommendation engine
export const generateRecommendations = (
  aqi,
  profile,
  weather = null,
  pollutantAqi = null
) => {
  if (!Number.isFinite(aqi) || aqi < 0 || aqi > 500) {
    throw new Error('Valid AQI data is required');
  }

  const recommendations = [];

  const dominantPollutant =
    findDominantPollutant(pollutantAqi);

  const weatherCondition =
    getWeatherCondition(weather);

  const activity = profile?.activity || 'other';
  const commute = profile?.commute || 'other';
  const outdoorTime = profile?.outdoorTime || '1-2';
  const sensitivity = profile?.sensitivity || 'none';

  const sensitiveUser = [
    'asthma',
    'allergies',
    'other',
  ].includes(sensitivity);


  // 4. Determine overall air-quality category
  let airCategory;

  if (aqi <= 50) {
    airCategory = 'good';
  } else if (aqi <= 100) {
    airCategory = 'moderate';
  } else if (aqi <= 150) {
    airCategory = 'unhealthy-sensitive';
  } else if (aqi <= 200) {
    airCategory = 'unhealthy';
  } else if (aqi <= 300) {
    airCategory = 'very-unhealthy';
  } else {
    airCategory = 'hazardous';
  }


  // 5. Activity recommendations
  if (
    airCategory === 'good' &&
    weatherCondition === 'pleasant'
  ) {
    recommendations.push({
      category: 'Outdoor Activities',
      title: 'A good day to enjoy the outdoors',
      description:
        'Consider walking, cycling, outdoor sports or spending time in a park. Stay hydrated and adjust your activity to your comfort.',
      priority: 'medium',
    });
  } else if (
    airCategory === 'moderate' &&
    weatherCondition === 'pleasant'
  ) {
    recommendations.push({
      category: 'Outdoor Activities',
      title: 'Enjoy outdoor activities mindfully',
      description:
        'Light walking or comfortable outdoor activities may be suitable. Sensitive individuals should consider reducing prolonged or strenuous exposure.',
      priority: 'medium',
    });
  } else if (
    airCategory === 'good' ||
    airCategory === 'moderate'
  ) {
    recommendations.push({
      category: weatherCondition === 'unavailable'
        ? 'Activity Suggestions'
        : 'Indoor Activities',
      title: weatherCondition === 'unavailable'
        ? 'Check weather before outdoor activities'
        : 'Consider an indoor activity today',
      description: weatherCondition === 'unavailable'
        ? 'Weather information is currently unavailable. Check local weather conditions before planning outdoor activities.'
        : 'Current weather conditions may make outdoor activities uncomfortable. Consider indoor exercise, reading or stretching.',
      priority: 'low',
    });
  } else {
    recommendations.push({
      category: 'Indoor Activities',
      title: 'Prefer indoor activities today',
      description:
        'Air pollution is elevated. Consider indoor exercise, yoga, reading or other activities that reduce unnecessary outdoor exposure.',
      priority: 'high',
    });
  }


  // 6. AQI-specific safety measures
  if (aqi > 100 && aqi <= 150) {
    recommendations.push({
      category: 'Air Quality Precaution',
      title: 'Reduce prolonged outdoor exertion',
      description:
        'Consider shorter outdoor activities and lighter exercise. Sensitive individuals should take extra care and follow their healthcare guidance.',
      priority: 'high',
    });
  }

  if (aqi > 150 && aqi <= 200) {
    recommendations.push({
      category: 'Air Quality Precaution',
      title: 'Limit outdoor exposure',
      description:
        'Move strenuous exercise indoors, reduce unnecessary time outside and monitor changing air-quality conditions.',
      priority: 'high',
    });
  }

  if (aqi > 200) {
    recommendations.push({
      category: 'Safety Measures',
      title: 'Take stronger pollution precautions',
      description:
        'Avoid outdoor exertion and reduce outdoor exposure as much as possible. Keep windows closed when outdoor air is polluted, use effective indoor filtration if available, and follow local public-health guidance.',
      priority: 'high',
    });
  }


  // 7. Lifestyle-based recommendations
  if (activity === 'student' && aqi > 100) {
    recommendations.push({
      category: 'Student Lifestyle',
      title: 'Plan campus activities carefully',
      description:
        'Consider indoor study breaks, library activities and indoor sports instead of prolonged outdoor activities.',
      priority: 'medium',
    });
  }

  if (activity === 'outdoor-worker' && aqi > 100) {
    recommendations.push({
      category: 'Work Routine',
      title: 'Review your outdoor work routine',
      description:
        'Where practical, discuss exposure-reduction measures, suitable breaks and appropriate workplace protection with your employer.',
      priority: 'high',
    });
  }

  if (
    ['two-wheeler', 'cycling', 'walking'].includes(commute) &&
    aqi > 100
  ) {
    recommendations.push({
      category: 'Commute',
      title: 'Review your commuting route',
      description:
        'Where practical, avoid heavily trafficked roads and consider lower-exposure travel alternatives.',
      priority: 'medium',
    });
  }

  if (
    ['2-4', 'more-than-4'].includes(outdoorTime) &&
    aqi > 100
  ) {
    recommendations.push({
      category: 'Outdoor Exposure',
      title: 'Reduce unnecessary time outdoors',
      description:
        'Review your daily schedule and move flexible activities indoors while pollution levels are elevated.',
      priority: 'medium',
    });
  }


  // 8. Additional precautions for sensitive users
  if (sensitiveUser && aqi > 50) {
    recommendations.push({
      category: 'Personal Precaution',
      title: 'Take additional care',
      description:
        'Pay attention to symptoms, reduce exposure when air quality worsens and follow your existing healthcare advice.',
      priority: 'high',
    });
  }


  // 9. Weather-specific advice
  if (weatherCondition === 'rainy') {
    recommendations.push({
      category: 'Weather Advisory',
      title: 'Plan around the rain',
      description:
        'Consider indoor activities and avoid exposed outdoor exercise during rainfall or wet conditions.',
      priority: 'low',
    });
  }

  if (weatherCondition === 'uncomfortable') {
    recommendations.push({
      category: 'Weather Advisory',
      title: 'Avoid uncomfortable outdoor conditions',
      description:
        'Consider indoor activities when temperatures or wind conditions are uncomfortable. Stay hydrated and dress appropriately.',
      priority: 'medium',
    });
  }



  // 10. Pollutant-specific recommendations with explanations
  if (dominantPollutant && dominantPollutant.value > 50) {
    const pollutantAdvice = {
      'PM2.5': {
        title: 'Reduce fine-particle exposure',
        description:
          'Reduce prolonged outdoor exertion and consider effective indoor air filtration where available.',
        explanation:
          'PM2.5 has the highest individual AQI index among the available pollutants. These fine particles can penetrate deep into the respiratory system.',
      },

      'PM10': {
        title: 'Take precautions against dust particles',
        description:
          'Reduce exposure to dusty environments and avoid strenuous activity near dust sources.',
        explanation:
          'PM10 has the highest individual AQI index. These particles are commonly associated with dust and other airborne material.',
      },

      'Ozone': {
        title: 'Be mindful of ozone exposure',
        description:
          'Consider reducing prolonged outdoor exertion, particularly if you are sensitive to air pollution.',
        explanation:
          'Ozone has the highest individual AQI index. Elevated ground-level ozone can irritate the respiratory system, especially during outdoor exertion.',
      },

      'Nitrogen Dioxide': {
        title: 'Reduce traffic-related pollution exposure',
        description:
          'Where practical, avoid spending extended periods close to busy roads.',
        explanation:
          'Nitrogen dioxide has the highest individual AQI index. Road traffic and combustion sources are common contributors to nitrogen dioxide pollution.',
      },

      'Sulphur Dioxide': {
        title: 'Be mindful of sulphur dioxide exposure',
        description:
          'Reduce exposure to nearby pollution sources and monitor respiratory symptoms.',
        explanation:
          'Sulphur dioxide has the highest individual AQI index. Exposure can irritate the respiratory system.',
      },

      'Carbon Monoxide': {
        title: 'Pay attention to carbon monoxide',
        description:
          'Avoid vehicle exhaust and combustion sources. Maintain fuel-burning appliances properly and ensure appropriate ventilation.',
        explanation:
          'Carbon monoxide has the highest individual AQI index. Carbon monoxide is a harmful combustion-related pollutant.',
      },
    };

    const advice = pollutantAdvice[dominantPollutant.name];

    if (advice) {
      recommendations.push({
        category: 'Pollutant-Specific Advice',
        title: advice.title,
        description: advice.description,
        priority: dominantPollutant.value > 100
          ? 'high'
          : 'medium',

        // Evidence supporting this recommendation
        evidence: {
          type: 'pollutant-aqi',
          pollutant: dominantPollutant.name,
          value: dominantPollutant.value,
          unit: 'US AQI',
          timestamp: pollutantAqi.time || null,
          explanation: advice.explanation,
        },
      });
    }
  }


  return recommendations;
};
