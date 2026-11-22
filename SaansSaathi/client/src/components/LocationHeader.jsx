
import { MapPin, RefreshCw } from 'lucide-react';

function LocationHeader({ location, onRefresh, loading }) {
  return (
    <header className="location-header">
      <div className="location-info">
        <MapPin size={20} />
        <div>
          <span className="location-label">YOUR LOCATION</span>
          <h2>{location}</h2>
        </div>
      </div>

      <button
        className="refresh-button"
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh air quality data"
      >
        <RefreshCw size={17} />
        {loading ? 'Updating...' : 'Refresh'}
      </button>
    </header>
  );
}

export default LocationHeader;
