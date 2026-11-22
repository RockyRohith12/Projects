
import './App.css';

import { useCallback, useEffect, useState } from 'react';

import { fetchAirQuality } from './services/airQualityApi';
import { generateRecommendations } from './services/recommendationService';

import LocationHeader from './components/LocationHeader';
import AQIOverview from './components/AQIOverview';
import PollutantCards from './components/PollutantCards';
import LoadingState from './components/LoadingState';
import HealthAdvisory from './components/HealthAdvisory';
import LifestyleProfile from './components/LifestyleProfile';
import Recommendations from './components/Recommendations';

const LOCATION = {
  name: 'Bengaluru, India',
  latitude: 12.9716,
  longitude: 77.5946,
};

function App() {
  // API states
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Personalization states
  const [recommendations, setRecommendations] = useState([]);
  const [profileSubmitted, setProfileSubmitted] = useState(false);

  // Fetch air quality
  const loadAirQuality = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fetchAirQuality(
        LOCATION.latitude,
        LOCATION.longitude
      );

      setAirQuality(result.data);

      // Previous recommendations must be regenerated
      // against the new AQI after a refresh.
      setRecommendations([]);
      setProfileSubmitted(false);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAirQuality();
  }, [loadAirQuality]);

  // Current air quality data
  const currentData = airQuality?.current;

  const updatedAt = currentData?.time
    ? new Date(currentData.time).toLocaleString('en-IN')
    : '';

  // Generate personalized recommendations
  const handleProfileSubmit = (profile) => {
    if (!currentData || !Number.isFinite(currentData.us_aqi)) {
      return;
    }

    const results = generateRecommendations(
      currentData.us_aqi,
      profile
    );

    setRecommendations(results);
    setProfileSubmitted(true);
  };

  return (
    <main className="dashboard">
      <div className="dashboard-container">

        <div className="brand-header">
          <h1>SaansSaathi</h1>
          <p>Breathe Smarter. Live Safer.</p>
        </div>

        <LocationHeader
          location={LOCATION.name}
          onRefresh={loadAirQuality}
          loading={loading}
        />

        <LoadingState
          loading={loading}
          error={error}
          onRetry={loadAirQuality}
        />

        {!loading && !error && currentData && (
          <>
            <AQIOverview
              aqi={currentData.us_aqi}
              updatedAt={updatedAt}
            />

            <HealthAdvisory
              aqi={currentData.us_aqi}
            />

            <PollutantCards
              data={currentData}
            />

            <LifestyleProfile
              onSubmit={handleProfileSubmit}
            />

            {profileSubmitted && (
              <Recommendations
                recommendations={recommendations}
              />
            )}
          </>
        )}

      </div>
    </main>
  );
}

export default App;
