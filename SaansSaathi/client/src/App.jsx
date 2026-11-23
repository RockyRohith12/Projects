
import './App.css';

import { useCallback, useEffect, useState } from 'react';

import { fetchAirQuality } from './services/airQualityApi';
import { generateRecommendations } from './services/recommendationService';
import { getCurrentLocation } from './services/locationService';

import LocationHeader from './components/LocationHeader';
import AQIOverview from './components/AQIOverview';
import PollutantCards from './components/PollutantCards';
import LoadingState from './components/LoadingState';
import HealthAdvisory from './components/HealthAdvisory';
import LifestyleProfile from './components/LifestyleProfile';
import Recommendations from './components/Recommendations';

function App() {
  // Air quality states
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Location states
  const [location, setLocation] = useState({
    name: 'Detecting your location...',
    latitude: null,
    longitude: null,
  });

  const [locationLoading, setLocationLoading] = useState(true);

  // Personalization states
  const [recommendations, setRecommendations] = useState([]);
  const [profileSubmitted, setProfileSubmitted] = useState(false);

  // Detect user's current location
  useEffect(() => {
    let isMounted = true;

    const detectLocation = async () => {
      try {
        setLocationLoading(true);
        setError('');

        const coordinates = await getCurrentLocation();

        if (!isMounted) return;

        setLocation({
          name: 'Your Current Location',
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });
      } catch (err) {
        if (!isMounted) return;

        setError(err.message || 'Unable to detect your location.');
      } finally {
        if (isMounted) {
          setLocationLoading(false);
        }
      }
    };

    detectLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch air quality using detected coordinates
  const loadAirQuality = useCallback(async () => {
    if (
      location.latitude === null ||
      location.longitude === null
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await fetchAirQuality(
        location.latitude,
        location.longitude
      );

      setAirQuality(result.data);

      // Reset recommendations when AQI is refreshed
      setRecommendations([]);
      setProfileSubmitted(false);
    } catch (err) {
      setError(err.message || 'Unable to retrieve air quality data.');
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude]);

  // Automatically fetch AQI after location detection
  useEffect(() => {
    if (
      location.latitude !== null &&
      location.longitude !== null
    ) {
      loadAirQuality();
    }
  }, [location.latitude, location.longitude, loadAirQuality]);

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
          location={location.name}
          onRefresh={loadAirQuality}
          loading={loading || locationLoading}
        />

        <LoadingState
          loading={locationLoading || loading}
          error={error}
          onRetry={() => {
            if (location.latitude !== null) {
              loadAirQuality();
            }
          }}
        />

        {!locationLoading && !loading && !error && currentData && (
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
