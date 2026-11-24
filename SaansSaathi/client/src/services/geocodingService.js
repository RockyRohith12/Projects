
const GEOCODING_API =
  'https://nominatim.openstreetmap.org/reverse';

export const getLocationName = async (latitude, longitude) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '10',
    addressdetails: '1',
  });

  const response = await fetch(
    `${GEOCODING_API}?${params}`
  );

  if (!response.ok) {
    throw new Error('Unable to retrieve location name.');
  }

  const result = await response.json();
  const address = result.address;

  if (!address) {
    throw new Error('Location details were not found.');
  }

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county;

  const state = address.state;
  const country = address.country;

  return [city, state, country]
    .filter(Boolean)
    .join(', ');
};
