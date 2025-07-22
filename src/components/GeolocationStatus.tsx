import React from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader, Wifi, WifiOff } from 'lucide-react';
import type { GPSCoordinate, GeofenceValidation } from '../types';
import { formatCoordinates, getLocationQuality } from '../utils/geolocation';

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

  const locationQuality = location?.accuracy ? getLocationQuality(location.accuracy) : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Status da Localização</h3>
        <div className="flex items-center space-x-2">
          {locationQuality && (
            <div className="flex items-center space-x-1">
              <Wifi 
                className="w-4 h-4" 
                style={{ color: locationQuality.color }}
              />
              <span 
                className="text-xs font-medium"
                style={{ color: locationQuality.color }}
              >
                {locationQuality.quality.toUpperCase()}
              </span>
            </div>
          )}
          <button
            onClick={onRequestLocation}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>
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
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Precisão GPS:</span>
                <span 
                  className="font-medium"
                  style={{ color: locationQuality?.color || '#6B7280' }}
                >
                  ±{location.accuracy.toFixed(0)}m ({locationQuality?.message})
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="h-1 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: locationQuality?.color || '#6B7280',
                    width: `${Math.max(10, Math.min(100, 100 - (location.accuracy / 2)))}%`
                  }}
                />
              </div>
            </div>
          )}
          
          {geofenceValidation && (
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Distância do centro:</span>
                <span className={geofenceValidation.is_valid ? 'text-green-600' : 'text-red-600'}>
                  {geofenceValidation.distance_from_center.toFixed(0)}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Máximo permitido:</span>
                <span className="text-gray-600">
                  {geofenceValidation.max_allowed_distance}m
                </span>
              </div>
              
              {/* Barra de progresso da distância */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    geofenceValidation.is_valid ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (geofenceValidation.distance_from_center / geofenceValidation.max_allowed_distance) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Regra de Bloqueio - Mensagem Crítica */}
      {geofenceValidation && !geofenceValidation.is_valid && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-red-800 font-medium mb-1">
                REGRA DE BLOQUEIO ATIVA
              </p>
              <p className="text-red-700">
                Você está fora da área de coleta designada. O botão "Iniciar Nova Entrevista" 
                permanecerá bloqueado até que você se aproxime do centro da área 
                (máximo {geofenceValidation.max_allowed_distance}m de distância).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informações Técnicas (apenas para debug em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && location && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-500">
          <p>Debug: Lat {location.lat.toFixed(6)}, Lng {location.lng.toFixed(6)}</p>
          <p>Timestamp: {new Date(location.timestamp).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
}