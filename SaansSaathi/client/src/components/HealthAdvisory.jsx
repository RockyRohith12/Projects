
import { ShieldCheck, AlertTriangle, HeartPulse } from 'lucide-react';

function getHealthAdvisory(aqi) {
  if (!Number.isFinite(aqi) || aqi < 0 || aqi > 500) {
    return null;
  }

  if (aqi <= 50) {
    return {
      category: 'Good',
      level: 'good',
      message: 'Air quality is satisfactory.',
      precautions: [
        'Enjoy your usual outdoor activities.',
        'Continue maintaining good indoor ventilation.',
      ],
    };
  }

  if (aqi <= 100) {
    return {
      category: 'Moderate',
      level: 'moderate',
      message: 'Air quality is acceptable for most people.',
      precautions: [
        'Unusually sensitive individuals should consider reducing prolonged outdoor exertion.',
        'Monitor air quality if you experience discomfort.',
      ],
    };
  }

  if (aqi <= 150) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      level: 'sensitive',
      message: 'Sensitive individuals may experience health effects.',
      precautions: [
        'Children, older adults and people with respiratory conditions should reduce prolonged outdoor exertion.',
        'Consider moving strenuous activities indoors.',
      ],
    };
  }

  if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      level: 'unhealthy',
      message: 'Everyone may begin experiencing health effects.',
      precautions: [
        'Reduce prolonged or heavy outdoor exertion.',
        'Sensitive individuals should avoid prolonged or heavy outdoor exertion.',
        'Consider moving strenuous outdoor activities indoors.',
      ],
    };
  }

  if (aqi <= 300) {
    return {
      category: 'Very Unhealthy',
      level: 'very-unhealthy',
      message: 'Health alert: the risk of health effects is increased for everyone.',
      precautions: [
        'Avoid prolonged or heavy outdoor exertion.',
        'Sensitive individuals should avoid outdoor physical activity.',
        'Keep track of local air-quality updates.',
      ],
    };
  }

  return {
    category: 'Hazardous',
    level: 'hazardous',
    message: 'Health warning: everyone may experience more serious health effects.',
    precautions: [
      'Avoid outdoor physical activity.',
      'Remain indoors in a cleaner-air environment where possible.',
      'Follow local public-health guidance.',
    ],
  };
}

function HealthAdvisory({ aqi }) {
  const advisory = getHealthAdvisory(aqi);

  if (!advisory) return null;

  const Icon = aqi <= 100 ? ShieldCheck : AlertTriangle;

  return (
    <section
      className={`health-advisory advisory-${advisory.level}`}
      aria-labelledby="advisory-title"
    >
      <div className="advisory-header">
        <div className="advisory-icon">
          <Icon size={23} />
        </div>

        <div>
          <span className="advisory-label">HEALTH ADVISORY</span>
          <h2 id="advisory-title">{advisory.category}</h2>
        </div>
      </div>

      <p className="advisory-message">
        {advisory.message}
      </p>

      <div className="precautions-heading">
        <HeartPulse size={19} />
        <h3>Recommended precautions</h3>
      </div>

      <ul>
        {advisory.precautions.map((precaution, index) => (
          <li key={index}>{precaution}</li>
        ))}
      </ul>

      <p className="advisory-disclaimer">
        General air-quality guidance based on the US AQI scale.
        This is not a medical diagnosis or substitute for professional advice.
      </p>
    </section>
  );
}

export default HealthAdvisory;
