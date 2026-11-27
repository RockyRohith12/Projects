
import './App.css';

import { useCallback, useEffect, useState } from 'react';

import { fetchAirQuality } from './services/airQualityApi';
import { fetchAirQualityForecast } from './services/forecastApi';
import { generateRecommendations } from './services/recommendationService';
import { getCurrentLocation } from './services/locationService';
import { getLocationName } from './services/geocodingService';

import LocationHeader from './components/LocationHeader';
import AQIOverview from './components/AQIOverview';
import AQIForecast from './components/AQIForecast';
import PollutantCards from './components/PollutantCards';
import LoadingState from './components/LoadingState';
import HealthAdvisory from './components/HealthAdvisory';
import LifestyleProfile from './components/LifestyleProfile';
import Recommendations from './components/Recommendations';
import AIChat from './components/AIChat';

function App() {
  // ==========================================
  // 1. AIR QUALITY STATES
  // ==========================================

  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastFetched, setLastFetched] = useState(null);

  // ==========================================
  // 2. AQI FORECAST STATES
  // ==========================================

  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState('');

  // ==========================================
  // 3. LOCATION STATES
  // ==========================================

  const [location, setLocation] = useState({
    name: 'Detecting your location...',
    latitude: null,
    longitude: null,
  });

  const [locationLoading, setLocationLoading] = useState(true);

  // ==========================================
  // 4. PERSONALIZATION STATES
  // ==========================================

  const [recommendations, setRecommendations] = useState([]);
  const [profileSubmitted, setProfileSubmitted] = useState(false);

  // ==========================================
  // 5. DETECT CURRENT LOCATION
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const detectLocation = async () => {
      try {
        setLocationLoading(true);
        setError('');

        const coordinates = await getCurrentLocation();

        if (!isMounted) return;

        // Store coordinates immediately
        setLocation({
          name: 'Resolving your location...',
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });

        // Resolve coordinates into a readable address
        try {
          const locationName = await getLocationName(
            coordinates.latitude,
            coordinates.longitude
          );

          if (!isMounted) return;

          setLocation((previous) => ({
            ...previous,
            name: locationName,
          }));
        } catch (geocodingError) {
          console.error(
            'Geocoding error:',
            geocodingError.message
          );

          if (isMounted) {
            setLocation((previous) => ({
              ...previous,
              name: 'Your Current Location',
            }));
          }
        }
      } catch (err) {
        if (!isMounted) return;

        setError(
          err.message || 'Unable to detect your location.'
        );
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

  // ==========================================
  // 6. FETCH CURRENT AIR QUALITY
  // ==========================================

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
      setLastFetched(new Date());

      // Reset recommendations when AQI is refreshed
      setRecommendations([]);
      setProfileSubmitted(false);

    } catch (err) {
      setError(
        err.message || 'Unable to retrieve air quality data.'
      );
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude]);

  // ==========================================
  // 7. FETCH 24-HOUR AQI FORECAST
  // ==========================================

  useEffect(() => {
    if (
      location.latitude === null ||
      location.longitude === null
    ) {
      return;
    }

    let isMounted = true;

    const loadForecast = async () => {
      setForecastLoading(true);
      setForecastError('');

      try {
        const result = await fetchAirQualityForecast(
          location.latitude,
          location.longitude
        );

        if (isMounted) {
          setForecast(result);
        }

      } catch (err) {
        if (isMounted) {
          setForecastError(
            err.message || 'Unable to load AQI forecast.'
          );
        }
      } finally {
        if (isMounted) {
          setForecastLoading(false);
        }
      }
    };

    loadForecast();

    return () => {
      isMounted = false;
    };
  }, [location.latitude, location.longitude]);

  // ==========================================
  // 8. AUTOMATICALLY FETCH AQI AFTER LOCATION
  // ==========================================

  useEffect(() => {
    if (
      location.latitude !== null &&
      location.longitude !== null
    ) {
      loadAirQuality();
    }
  }, [
    location.latitude,
    location.longitude,
    loadAirQuality,
  ]);

  // ==========================================
  // 9. CURRENT AIR QUALITY DATA
  // ==========================================

  const currentData = airQuality?.current;

  // Timestamp of the air-quality model reading
  const readingTime = currentData?.time
    ? new Date(currentData.time).toLocaleString('en-IN')
    : 'Unavailable';

  // Timestamp when our application fetched the data
  const fetchedTime = lastFetched
    ? lastFetched.toLocaleString('en-IN')
    : 'Unavailable';

  // ==========================================
  // 10. GENERATE PERSONALIZED RECOMMENDATIONS
  // ==========================================

  const handleProfileSubmit = (profile) => {
    if (
      !currentData ||
      !Number.isFinite(currentData.us_aqi)
    ) {
      return;
    }

    const results = generateRecommendations(
      currentData.us_aqi,
      profile,
      airQuality?.weather?.current,
      airQuality?.pollutantAqi
    );

    setRecommendations(results);
    setProfileSubmitted(true);
  };

  // ==========================================
  // 11. DASHBOARD UI
  // ==========================================

  return (
    <main className="dashboard">
      <div className="dashboard-container">

        {/* Brand Header */}
        <div className="brand-header">
          <h1>SaansSaathi</h1>
          <p>Breathe Smarter. Live Safer.</p>
        </div>

        {/* Location Header */}
        <LocationHeader
          location={location.name}
          onRefresh={loadAirQuality}
          loading={loading || locationLoading}
        />

        {/* Loading and Error State */}
        <LoadingState
          loading={locationLoading || loading}
          error={error}
          onRetry={() => {
            if (
              location.latitude !== null &&
              location.longitude !== null
            ) {
              loadAirQuality();
            }
          }}
        />

        {/* Dashboard Content */}
        {!locationLoading && !loading && !error && currentData && (
          <>

            {/* Current AQI Overview */}
            <AQIOverview
              aqi={currentData.us_aqi}
              readingTime={readingTime}
              fetchedTime={fetchedTime}
            />

            {/* 24-Hour AQI Forecast */}
            <AQIForecast
              forecast={forecast}
              loading={forecastLoading}
              error={forecastError}
            />

            {/* Health Advisory */}
            <HealthAdvisory
              aqi={currentData.us_aqi}
            />

            {/* Pollutant Information */}
            <PollutantCards
              data={currentData}
            />

            {/* Lifestyle Profile */}
            <LifestyleProfile
              onSubmit={handleProfileSubmit}
            />

            {/* Personalized Recommendations */}
            {profileSubmitted && (
              <Recommendations
                recommendations={recommendations}
              />
            )}

            {/* AI Environmental Assistant */}
            <AIChat
              environmentalContext={{
                location: location.name,
                latitude: location.latitude,
                longitude: location.longitude,
                airQuality: currentData,
                weather: airQuality?.weather?.current || null,
                readingTime: readingTime,
              }}
            />

          </>
        )}

      </div>
    </main>
  );
}

export default App;
