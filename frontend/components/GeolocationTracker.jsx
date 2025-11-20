import { useEffect, useState } from 'react';

export default function GeolocationTracker({ onLocationUpdate, onError }) {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser';
      setError(errorMsg);
      setLoading(false);
      if (onError) onError(errorMsg);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        setLocation(coords);
        setAccuracy(position.coords.accuracy);
        setLoading(false);
        setError(null);
        
        if (onLocationUpdate) {
          onLocationUpdate(coords);
        }
      },
      (err) => {
        let errorMsg = 'Unable to retrieve your location';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        
        setError(errorMsg);
        setLoading(false);
        
        if (onError) onError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [onLocationUpdate, onError]);

  const getAccuracyStatus = () => {
    if (!accuracy) return { text: 'Unknown', color: 'gray' };
    if (accuracy <= 20) return { text: 'Excellent', color: 'green' };
    if (accuracy <= 50) return { text: 'Good', color: 'blue' };
    if (accuracy <= 100) return { text: 'Fair', color: 'yellow' };
    return { text: 'Poor', color: 'red' };
  };

  const accuracyStatus = getAccuracyStatus();

  return (
    <div className="geolocation-tracker bg-white rounded-lg shadow-md hover:shadow-xl p-6 transition-all duration-300 animate-fadeIn">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-6 h-6 text-primary-600 ${loading ? 'animate-pulse-slow' : ''}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
        GPS Location
      </h3>

      {loading && (
        <div className="flex items-center gap-3 text-gray-600 animate-pulse-slow">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <span>Getting your location...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 animate-slideIn">
          <p className="font-medium">⚠️ {error}</p>
          <p className="text-sm mt-2">
            Please enable location services in your browser settings.
          </p>
        </div>
      )}

      {!loading && !error && location && (
        <div className="space-y-3 animate-slideIn">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <p className="text-sm text-gray-500">Latitude</p>
              <p className="font-mono text-sm font-semibold">
                {location.latitude.toFixed(6)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <p className="text-sm text-gray-500">Longitude</p>
              <p className="font-mono text-sm font-semibold">
                {location.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">GPS Accuracy</span>
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full bg-${accuracyStatus.color}-100 text-${accuracyStatus.color}-700`}
              >
                {accuracyStatus.text}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-${accuracyStatus.color}-500`}
                style={{
                  width: `${Math.max(10, Math.min(100, 100 - accuracy))}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ±{accuracy?.toFixed(1)}m accuracy
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              📍 Location tracking active. Your position is being monitored for
              geofence validation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
