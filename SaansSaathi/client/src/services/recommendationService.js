
export const generateRecommendations = (aqi, profile) => {
  if (!Number.isFinite(aqi) || aqi < 0 || aqi > 500) {
    throw new Error('Valid AQI data is required');
  }

  const recommendations = [];

  // General air-quality guidance
  if (aqi > 100) {
    recommendations.push({
      category: 'Outdoor Activity',
      title: 'Reduce strenuous outdoor activities',
      description:
        'Consider moving intense outdoor exercise indoors while air quality is unhealthy.',
      priority: 'high',
    });
  }

  if (aqi > 150) {
    recommendations.push({
      category: 'Daily Routine',
      title: 'Plan outdoor activities carefully',
      description:
        'Limit prolonged outdoor exposure and follow local air-quality updates.',
      priority: 'high',
    });
  }

  // Occupation-based recommendations
  if (profile.activity === 'student' && aqi > 100) {
    recommendations.push({
      category: 'Student Lifestyle',
      title: 'Plan outdoor campus activities',
      description:
        'Consider indoor alternatives for sports and other strenuous campus activities.',
      priority: 'medium',
    });
  }

  if (profile.activity === 'outdoor-worker' && aqi > 100) {
    recommendations.push({
      category: 'Work Routine',
      title: 'Review outdoor work schedules',
      description:
        'Where practical, discuss reducing prolonged exposure or adjusting strenuous tasks.',
      priority: 'high',
    });
  }

  // Commute-based recommendations
  if (
    ['two-wheeler', 'cycling', 'walking'].includes(profile.commute) &&
    aqi > 100
  ) {
    recommendations.push({
      category: 'Commute',
      title: 'Review your commuting routine',
      description:
        'Consider lower-exposure travel alternatives where practical, especially during periods of poor air quality.',
      priority: 'medium',
    });
  }

  // Outdoor exposure
  if (
    ['2-4', 'more-than-4'].includes(profile.outdoorTime) &&
    aqi > 100
  ) {
    recommendations.push({
      category: 'Outdoor Exposure',
      title: 'Reduce unnecessary outdoor time',
      description:
        'Review your daily schedule and move flexible activities indoors.',
      priority: 'medium',
    });
  }

  // Optional respiratory sensitivity
  if (
    ['asthma', 'allergies', 'other'].includes(profile.sensitivity) &&
    aqi > 100
  ) {
    recommendations.push({
      category: 'Personal Precaution',
      title: 'Take additional precautions',
      description:
        'Follow your existing healthcare guidance and monitor symptoms. Seek medical advice if symptoms worsen.',
      priority: 'high',
    });
  }

  return recommendations;
};
