import { useState, useEffect, useCallback } from 'react';
import type { GPSCoordinate } from '../types';
import { getCurrentLocation, watchLocation, stopWatchingLocation } from '../utils/geolocation';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

interface UseGeolocationReturn {
  location: GPSCoordinate | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => Promise<void>;
  clearError: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [location, setLocation] = useState<GPSCoordinate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter localização');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.watch) {
      const id = watchLocation(
        (newLocation) => {
          setLocation(newLocation);
          setError(null);
        },
        (err) => {
          setError(err.message);
        }
      );

      if (id !== null) {
        setWatchId(id);
      }

      return () => {
        if (id !== null) {
          stopWatchingLocation(id);
        }
      };
    }
  }, [options.watch]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        stopWatchingLocation(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    error,
    loading,
    requestLocation,
    clearError
  };
}