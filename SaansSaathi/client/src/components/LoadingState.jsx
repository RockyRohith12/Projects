
import { LoaderCircle, AlertCircle, RefreshCw } from 'lucide-react';

function LoadingState({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="status-container" role="status">
        <LoaderCircle className="loading-icon" size={36} />
        <h3>Checking your air quality...</h3>
        <p>Fetching the latest environmental readings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container error-container" role="alert">
        <AlertCircle size={36} />
        <h3>Unable to load air quality data</h3>
        <p>{error}</p>

        <button onClick={onRetry} className="retry-button">
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  return null;
}

export default LoadingState;
