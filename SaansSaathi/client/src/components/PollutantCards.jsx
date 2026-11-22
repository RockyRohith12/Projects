
import { Wind, Cloud, Factory, FlaskConical } from 'lucide-react';

const pollutants = [
  {
    key: 'pm2_5',
    name: 'PM2.5',
    description: 'Fine particulate matter',
    unit: 'µg/m³',
    icon: Wind,
  },
  {
    key: 'pm10',
    name: 'PM10',
    description: 'Coarse particulate matter',
    unit: 'µg/m³',
    icon: Cloud,
  },
  {
    key: 'ozone',
    name: 'Ozone',
    description: 'Ground-level ozone',
    unit: 'µg/m³',
    icon: FlaskConical,
  },
  {
    key: 'nitrogen_dioxide',
    name: 'Nitrogen Dioxide',
    description: 'Combustion-related pollutant',
    unit: 'µg/m³',
    icon: Factory,
  },
  {
    key: 'sulphur_dioxide',
    name: 'Sulphur Dioxide',
    description: 'Industrial and fuel emissions',
    unit: 'µg/m³',
    icon: Factory,
  },
  {
    key: 'carbon_monoxide',
    name: 'Carbon Monoxide',
    description: 'Incomplete combustion pollutant',
    unit: 'µg/m³',
    icon: Cloud,
  },
];

function PollutantCards({ data }) {
  return (
    <section className="pollutant-section">
      <div className="section-heading">
        <h2>Pollutant Breakdown</h2>
        <p>Current atmospheric pollutant concentrations</p>
      </div>

      <div className="pollutant-grid">
        {pollutants.map((pollutant) => {
          const Icon = pollutant.icon;
          const value = data[pollutant.key];

          return (
            <article className="pollutant-card" key={pollutant.key}>
              <div className="pollutant-icon">
                <Icon size={21} />
              </div>

              <h3>{pollutant.name}</h3>
              <p>{pollutant.description}</p>

              <div className="pollutant-value">
                {value ?? '—'}
                <span>{pollutant.unit}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PollutantCards;
