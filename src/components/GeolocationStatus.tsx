import React from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { GPSCoordinate, GeofenceValidation } from '../types';
import { formatCoordinates } from '../utils/geolocation';

interface GeolocationStatusProps {
  location: GPSCoordinate | null;
  error: string | null;
  loading: boolean;
  geofenceValidation?: GeofenceValidation | null;
  onRequestLocation: () => void;
}

export function GeolocationStatus({
  location,
  error,
  loading,
  geofenceValidation,
  onRequestLocation
}: GeolocationStatusProps) {
  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (geofenceValidation && !geofenceValidation.is_valid) return 'text-red-600';
    if (location) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (loading) return <Loader className="w-5 h-5 animate-spin" />;
    if (error) return <AlertCircle className="w-5 h-5" />;
    if (geofenceValidation && !geofenceValidation.is_valid) return <AlertCircle className="w-5 h-5" />;
    if (location) return <CheckCircle className="w-5 h-5" />;
    return <MapPin className="w-5 h-5" />;
  };

  const getStatusMessage = () => {
    if (loading) return 'Obtendo localização...';
    if (error) return error;
    if (geofenceValidation && !geofenceValidation.is_valid) {
      return `Fora da área permitida (${geofenceValidation.distance_from_center.toFixed(0)}m do centro)`;
    }
    if (location) {
      const coords = formatCoordinates(location.lat, location.lng);
      const accuracy = location.accuracy ? ` (±${location.accuracy.toFixed(0)}m)` : '';
      return `${coords}${accuracy}`;
    }
    return 'Localização não disponível';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Status da Localização</h3>
        <button
          onClick={onRequestLocation}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${getStatusColor()}`}>
            {getStatusMessage()}
          </p>
          
          {location && location.accuracy && (
            <p className="text-xs text-gray-500 mt-1">
              Precisão: ±{location.accuracy.toFixed(0)} metros
            </p>
          )}
          
          {geofenceValidation && (
            <div className="mt-2 text-xs">
              <p className="text-gray-600">
                Distância do centro: {geofenceValidation.distance_from_center.toFixed(0)}m
              </p>
              <p className="text-gray-600">
                Máximo permitido: {geofenceValidation.max_allowed_distance}m
              </p>
            </div>
          )}
        </div>
      </div>

      {geofenceValidation && !geofenceValidation.is_valid && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Atenção:</strong> Você está fora da área de coleta designada. 
            Aproxime-se do centro da área para iniciar uma nova entrevista.
          </p>
        </div>
      )}
    </div>
  );
}