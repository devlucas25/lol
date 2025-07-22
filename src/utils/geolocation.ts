/**
 * Utilitários para geolocalização e geofencing
 * Implementa validação por GPS conforme especificação
 */

import type { GPSCoordinate, GeofenceValidation } from '../types';

/**
 * Converte graus para radianos
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * Considera a curvatura da Terra para maior precisão
 * 
 * Fórmula de Haversine:
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2( √a, √(1−a) )
 * d = R ⋅ c
 * 
 * onde φ é latitude, λ é longitude, R é o raio da Terra (6371km)
 */
export function calculateHaversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371000; // Raio da Terra em metros
  
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLatRad = toRadians(point2.lat - point1.lat);
  const deltaLngRad = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Obtém a localização atual do usuário
 */
export function getCurrentLocation(): Promise<GPSCoordinate> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada neste dispositivo'));
      return;
    }
    
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache por 1 minuto
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        });
      },
      (error) => {
        let message = 'Erro ao obter localização';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permissão de localização negada pelo usuário';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Localização indisponível';
            break;
          case error.TIMEOUT:
            message = 'Timeout ao obter localização';
            break;
        }
        
        reject(new Error(message));
      },
      options
    );
  });
}

/**
 * Valida se o usuário está dentro da área permitida (geofencing)
 * Regra: Distância deve ser <= 100 metros do centro da área
 */
export function validateGeofence(
  currentLocation: GPSCoordinate,
  areaCenter: { lat: number; lng: number },
  maxDistance: number = 100
): GeofenceValidation {
  const distance = calculateHaversineDistance(currentLocation, areaCenter);
  
  return {
    is_valid: distance <= maxDistance,
    distance_from_center: distance,
    max_allowed_distance: maxDistance,
    current_location: currentLocation,
    area_center: {
      lat: areaCenter.lat,
      lng: areaCenter.lng,
      timestamp: Date.now()
    }
  };
}

/**
 * Monitora a localização em tempo real
 */
export function watchLocation(
  callback: (location: GPSCoordinate) => void,
  errorCallback?: (error: Error) => void
): number | null {
  if (!navigator.geolocation) {
    errorCallback?.(new Error('Geolocalização não é suportada'));
    return null;
  }
  
  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 30000
  };
  
  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      });
    },
    (error) => {
      errorCallback?.(new Error(`Erro no monitoramento: ${error.message}`));
    },
    options
  );
}

/**
 * Para o monitoramento de localização
 */
export function stopWatchingLocation(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

/**
 * Verifica se a localização está disponível e solicita permissão
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false;
  }
  
  try {
    await getCurrentLocation();
    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissão de localização:', error);
    return false;
  }
}

/**
 * Formata coordenadas para exibição
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
}

/**
 * Calcula a área de cobertura de um ponto com raio
 */
export function calculateCoverageArea(
  center: { lat: number; lng: number },
  radiusMeters: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const earthRadius = 6371000; // metros
  
  // Conversão aproximada para graus
  const latDelta = (radiusMeters / earthRadius) * (180 / Math.PI);
  const lngDelta = (radiusMeters / earthRadius) * (180 / Math.PI) / Math.cos(toRadians(center.lat));
  
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta
  };
}