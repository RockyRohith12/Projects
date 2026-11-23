
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error('Geolocation is not supported by this browser.')
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        resolve({
          latitude,
          longitude,
          accuracy,
        });
      },
      (error) => {
        let message;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission was denied. Please allow location access.';
            break;

          case error.POSITION_UNAVAILABLE:
            message = 'Your current location is unavailable.';
            break;

          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;

          default:
            message = 'Unable to detect your location.';
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  });
};
