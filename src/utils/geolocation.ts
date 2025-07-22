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
 * Obtém a localização atual do usuário com configurações otimizadas
 */
export function getCurrentLocation(): Promise<GPSCoordinate> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada neste dispositivo'));
      return;
    }
    
    const options: PositionOptions = {
      enableHighAccuracy: true, // Usar GPS quando disponível
      timeout: 15000, // 15 segundos timeout
      maximumAge: 30000 // Cache por 30 segundos
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
            message = 'Permissão de localização negada. Por favor, habilite a localização nas configurações do navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Localização indisponível. Verifique se o GPS está ativo.';
            break;
          case error.TIMEOUT:
            message = 'Timeout ao obter localização. Tente novamente.';
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
 * REGRA CRÍTICA: Distância deve ser <= 100 metros do centro da área
 * REGRA DE BLOQUEIO: Botão "Iniciar Nova Entrevista" só fica ativo se válido
 */
export function validateGeofence(
  currentLocation: GPSCoordinate,
  areaCenter: { lat: number; lng: number },
  maxDistance: number = 100 // Padrão: 100 metros conforme especificação
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
 * Monitora a localização em tempo real com configurações otimizadas
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
    timeout: 10000, // 10 segundos para updates
    maximumAge: 15000 // Cache por 15 segundos para updates
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
      let message = 'Erro no monitoramento de localização';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Permissão de localização foi revogada';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Localização temporariamente indisponível';
          break;
        case error.TIMEOUT:
          message = 'Timeout no monitoramento de localização';
          break;
      }
      
      errorCallback?.(new Error(message));
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
export async function requestLocationPermission(): Promise<{
  granted: boolean;
  error?: string;
}> {
  if (!navigator.geolocation) {
    return {
      granted: false,
      error: 'Geolocalização não é suportada neste dispositivo'
    };
  }
  
  try {
    await getCurrentLocation();
    return { granted: true };
  } catch (error) {
    return {
      granted: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Formata coordenadas para exibição amigável
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

/**
 * Valida se as coordenadas estão dentro de limites válidos
 */
export function validateCoordinates(lat: number, lng: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (lat < -90 || lat > 90) {
    errors.push('Latitude deve estar entre -90 e 90 graus');
  }
  
  if (lng < -180 || lng > 180) {
    errors.push('Longitude deve estar entre -180 e 180 graus');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calcula a precisão estimada baseada na accuracy do GPS
 */
export function getLocationQuality(accuracy?: number): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  color: string;
} {
  if (!accuracy) {
    return {
      quality: 'poor',
      message: 'Precisão desconhecida',
      color: '#6B7280'
    };
  }
  
  if (accuracy <= 5) {
    return {
      quality: 'excellent',
      message: 'Precisão excelente',
      color: '#10B981'
    };
  } else if (accuracy <= 15) {
    return {
      quality: 'good',
      message: 'Boa precisão',
      color: '#059669'
    };
  } else if (accuracy <= 50) {
    return {
      quality: 'fair',
      message: 'Precisão aceitável',
      color: '#F59E0B'
    };
  } else {
    return {
      quality: 'poor',
      message: 'Precisão baixa',
      color: '#EF4444'
    };
  }
}