
const OVERPASS_API =
  'https://ovp.dresel.systems/api-as/interpreter';

export const findNearbyHospitals = async (
  latitude,
  longitude,
  radius = 5000
) => {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Invalid location coordinates.');
  }

  if (!Number.isInteger(radius) || radius < 1000 || radius > 10000) {
    throw new Error('Invalid search radius.');
  }


  const query = `
    [out:json][timeout:25];
    (
      nwr["amenity"~"^(hospital|clinic)$"]
        (around:${radius},${latitude},${longitude});

      nwr["healthcare"~"^(hospital|clinic)$"]
        (around:${radius},${latitude},${longitude});
    );
    out center tags;
  `;


  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'SaansSaathi/1.0 (environmental assistant)',
    },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    throw new Error(
      `OpenStreetMap service returned status ${response.status}.`
    );
  }

  const data = await response.json();

  return (data.elements || []).map((place) => {
    const tags = place.tags || {};

    const coordinates =
      place.type === 'node'
        ? { lat: place.lat, lon: place.lon }
        : {
            lat: place.center?.lat,
            lon: place.center?.lon,
          };

    return {
      id: `${place.type}-${place.id}`,
      name: tags.name || 'Unnamed healthcare facility',
      type: tags.healthcare || tags.amenity || 'healthcare facility',
      latitude: coordinates.lat,
      longitude: coordinates.lon,
      address: [
        tags['addr:street'],
        tags['addr:suburb'],
        tags['addr:city'],
      ]
        .filter(Boolean)
        .join(', ') || 'Address unavailable',
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || tags['contact:website'] || null,
      osmUrl: `https://www.openstreetmap.org/${place.type}/${place.id}`,
    };
  }).filter(
    (place) =>
      Number.isFinite(place.latitude) &&
      Number.isFinite(place.longitude)
  );
};
