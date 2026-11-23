
const GEOCODING_API =
  'https://nominatim.openstreetmap.org/reverse';

export const getLocationName = async (latitude, longitude) => {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    zoom: '10',
    addressdetails: '1',
  });

  const response = await fetch(
    `${GEOCODING_API}?${params}`,
    {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SaansSaathi/1.0',
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error('Unable to identify your location');
  }

  const result = await response.json();
  const address = result.address || {};

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county;

  const state = address.state;

  if (!city && !state) {
    throw new Error('Location name not available');
  }

  return {
    city: city || '',
    state: state || '',
    country: address.country || '',
  };
};
