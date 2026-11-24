
function getAQICategory(aqi) {
  if (aqi <= 50) return { label: 'Good', color: '#16a34a' };
  if (aqi <= 100) return { label: 'Moderate', color: '#ca8a04' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#ea580c' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#dc2626' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#9333ea' };
  return { label: 'Hazardous', color: '#7f1d1d' };
}

function AQIOverview({ aqi, readingTime, fetchedTime }) {
  const category = getAQICategory(aqi);

  return (
    <section className="aqi-overview">
      <div className="aqi-heading">
        <span>LIVE AIR QUALITY</span>
        <span className="live-indicator">● LIVE</span>
      </div>

      <div className="aqi-reading">
        <h1 style={{ color: category.color }}>
          {Math.round(aqi)}
        </h1>

        <div>
          <h2>US AQI</h2>
          <p style={{ color: category.color }}>
            {category.label}
          </p>
        </div>
      </div>

      <div className="aqi-timestamps">
        <p>Reading time: {readingTime}</p>
        <p>Last fetched: {fetchedTime}</p>
      </div>
    </section>
  );
}

export default AQIOverview;
