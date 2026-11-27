
import {
  Lightbulb,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

function Recommendations({ recommendations }) {
  if (!recommendations?.length) {
    return (
      <section className="recommendations-section">
        <h2>Your Personal Recommendations</h2>
        <p>No additional recommendations at the moment.</p>
      </section>
    );
  }

  return (
    <section className="recommendations-section">
      <div className="recommendations-heading">
        <div>
          <span className="recommendations-label">
            PERSONALIZED FOR YOU
          </span>
          <h2>Your Daily Recommendations</h2>
          <p>Practical steps based on your lifestyle and local air quality.</p>
        </div>

        <div className="recommendations-heading-icon">
          <Lightbulb size={23} />
        </div>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((item, index) => (
          <article className="recommendation-card" key={`${item.category}-${index}`}>
            <div className="recommendation-card-top">
              <span className="recommendation-category">
                {item.category}
              </span>

              <span className={`priority priority-${item.priority}`}>
                {item.priority === 'high'
  ? 'High priority'
  : item.priority === 'medium'
    ? 'Medium priority'
    : 'Low priority'}
              </span>
            </div>

            <h3>{item.title}</h3>
            <p>{item.description}</p>

            {item.evidence && (
  <div className="recommendation-evidence">
    <div className="evidence-heading">
      <span>Why this recommendation?</span>
      <span className="evidence-value">
        {item.evidence.pollutant}: {item.evidence.value}
      </span>
    </div>

    <p>{item.evidence.explanation}</p>

    <span className="evidence-timestamp">
      Individual US AQI · {item.evidence.timestamp || 'Time unavailable'}
    </span>
  </div>
)}

            <div className="recommendation-footer">
              {item.priority === 'high' ? (
                <ShieldAlert size={17} />
              ) : (
                <ArrowUpRight size={17} />
              )}
              <span>Personalized action</span>
            </div>
          </article>
        ))}
      </div>

      <p className="recommendations-disclaimer">
        Recommendations are general informational guidance, not medical advice.
      </p>
    </section>
  );
}

export default Recommendations;
