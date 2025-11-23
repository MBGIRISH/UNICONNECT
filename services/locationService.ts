/**
 * Location Service - Distance calculations and location utilities
 */

// Haversine formula to calculate distance between two coordinates
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 0.1) {
    return 'On Campus';
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 10) / 10} km away`;
  } else if (distanceKm < 10) {
    return `${Math.round(distanceKm * 10) / 10} km away`;
  } else {
    return `${Math.round(distanceKm)} km away`;
  }
};

// Get user's current location using browser Geolocation API
export const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

// City to coordinates mapping (for major Indian cities)
export const CITY_COORDINATES: { [key: string]: { lat: number; lon: number } } = {
  // Karnataka
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Mysore': { lat: 12.2958, lon: 76.6394 },
  'Mangalore': { lat: 12.9141, lon: 74.8560 },
  'Hubli': { lat: 15.3647, lon: 75.1240 },
  'Hubballi': { lat: 15.3647, lon: 75.1240 },
  'Belgaum': { lat: 15.8497, lon: 74.4977 },
  'Dharwad': { lat: 15.4589, lon: 75.0078 },
  'Tumkur': { lat: 13.3409, lon: 77.1013 },
  'Manipal': { lat: 13.3470, lon: 74.7890 },
  
  // Major IIT/NIT cities
  'Delhi': { lat: 28.6139, lon: 77.2090 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'Jaipur': { lat: 26.9124, lon: 75.7873 },
  'Kanpur': { lat: 26.4499, lon: 80.3319 },
  'Kharagpur': { lat: 22.3460, lon: 87.2320 },
  'Roorkee': { lat: 29.8543, lon: 77.8880 },
  'Guwahati': { lat: 26.1445, lon: 91.7362 },
  'Indore': { lat: 22.7196, lon: 75.8577 },
  'Bhubaneswar': { lat: 20.2961, lon: 85.8245 },
  'Gandhinagar': { lat: 23.2156, lon: 72.6369 },
  'Patna': { lat: 25.5941, lon: 85.1376 },
  'Ropar': { lat: 30.9650, lon: 76.5260 },
  'Mandi': { lat: 31.7083, lon: 76.9314 },
  'Varanasi': { lat: 25.3176, lon: 82.9739 },
  'Jodhpur': { lat: 26.2389, lon: 73.0243 },
  'Bhilai': { lat: 21.2092, lon: 81.4285 },
  'Goa': { lat: 15.2993, lon: 74.1240 },
  'Jammu': { lat: 32.7266, lon: 74.8570 },
  'Palakkad': { lat: 10.7867, lon: 76.6548 },
  'Tirupati': { lat: 13.6288, lon: 79.4192 },
  'Dhanbad': { lat: 23.7957, lon: 86.4304 },
  
  // NIT cities
  'Trichy': { lat: 10.7905, lon: 78.7047 },
  'Tiruchirappalli': { lat: 10.7905, lon: 78.7047 },
  'Surathkal': { lat: 13.0083, lon: 74.7942 },
  'Warangal': { lat: 17.9689, lon: 79.5941 },
  'Calicut': { lat: 11.2588, lon: 75.7804 },
  'Kozhikode': { lat: 11.2588, lon: 75.7804 },
  'Rourkela': { lat: 22.2604, lon: 84.8536 },
  'Durgapur': { lat: 23.5204, lon: 87.3119 },
  'Kurukshetra': { lat: 29.9695, lon: 76.8783 },
  'Nagpur': { lat: 21.1458, lon: 79.0882 },
  'Silchar': { lat: 24.8333, lon: 92.7789 },
  'Hamirpur': { lat: 31.6869, lon: 76.5256 },
  'Jalandhar': { lat: 31.3260, lon: 75.5762 },
  'Raipur': { lat: 21.2514, lon: 81.6296 },
  'Allahabad': { lat: 25.4358, lon: 81.8463 },
  'Prayagraj': { lat: 25.4358, lon: 81.8463 },
  'Bhopal': { lat: 23.2599, lon: 77.4126 },
  'Jamshedpur': { lat: 22.8046, lon: 86.2029 },
  'Surat': { lat: 21.1702, lon: 72.8311 },
  'Agartala': { lat: 23.8315, lon: 91.2868 },
  'Srinagar': { lat: 34.0837, lon: 74.7973 },
  
  // Other major cities
  'Vellore': { lat: 12.9166, lon: 79.1333 },
  'Coimbatore': { lat: 11.0168, lon: 76.9558 },
  'Pilani': { lat: 28.3670, lon: 75.5880 },
};

// Get coordinates for a city name
export const getCityCoordinates = (cityName: string): { lat: number; lon: number } | null => {
  // Try exact match first
  if (CITY_COORDINATES[cityName]) {
    return CITY_COORDINATES[cityName];
  }
  
  // Try case-insensitive match
  const cityKey = Object.keys(CITY_COORDINATES).find(
    key => key.toLowerCase() === cityName.toLowerCase()
  );
  
  if (cityKey) {
    return CITY_COORDINATES[cityKey];
  }
  
  return null;
};

// Extract coordinates from Google Maps URL
export const extractCoordinatesFromGoogleMapsUrl = async (url: string): Promise<{ lat: number; lon: number; address?: string } | null> => {
  try {
    // Handle short URLs (maps.app.goo.gl) - try to resolve
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
      try {
        // Try to resolve short URL (may fail due to CORS, but worth trying)
        const response = await fetch(url, { 
          method: 'HEAD', 
          redirect: 'follow',
          mode: 'no-cors' // Bypass CORS for redirect following
        });
        // If we can't get the final URL due to CORS, try parsing the short URL directly
        // Short URLs often have the coordinates in the path
        const shortUrlMatch = url.match(/\/[A-Za-z0-9]+$/);
        if (shortUrlMatch) {
          // For now, return null and let user enter coordinates manually
          // In production, you'd use a backend service to resolve short URLs
          console.log('Short URL detected. Please use full Google Maps URL or enter coordinates manually.');
          return null;
        }
      } catch (error) {
        // CORS error - can't resolve short URL in browser
        console.log('Cannot resolve short URL due to CORS. Please use full Google Maps URL.');
        return null;
      }
    }
    
    // Handle full Google Maps URLs
    return extractCoordinatesFromFullUrl(url);
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
    return null;
  }
};

// Extract coordinates from full Google Maps URL
const extractCoordinatesFromFullUrl = (url: string): { lat: number; lon: number; address?: string } | null => {
  try {
    // Pattern 1: https://www.google.com/maps?q=lat,lng
    const qMatch = url.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      const qValue = decodeURIComponent(qMatch[1]);
      // Try to parse as lat,lng
      const coordsMatch = qValue.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coordsMatch) {
        return {
          lat: parseFloat(coordsMatch[1]),
          lon: parseFloat(coordsMatch[2]),
          address: qValue
        };
      }
    }
    
    // Pattern 2: https://www.google.com/maps/@lat,lng,zoom
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return {
        lat: parseFloat(atMatch[1]),
        lon: parseFloat(atMatch[2])
      };
    }
    
    // Pattern 3: https://www.google.com/maps/place/.../@lat,lng
    const placeMatch = url.match(/\/place\/[^@]+@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) {
      return {
        lat: parseFloat(placeMatch[1]),
        lon: parseFloat(placeMatch[2])
      };
    }
    
    // Pattern 4: https://maps.google.com/?ll=lat,lng
    const llMatch = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llMatch) {
      return {
        lat: parseFloat(llMatch[1]),
        lon: parseFloat(llMatch[2])
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error);
    return null;
  }
};

// Generate Google Maps URL from coordinates or address
export const getGoogleMapsUrl = (lat?: number, lon?: number, address?: string): string => {
  if (lat !== undefined && lon !== undefined) {
    return `https://www.google.com/maps?q=${lat},${lon}`;
  } else if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return 'https://www.google.com/maps';
};

// Parse location input - can be city name, coordinates, or Google Maps URL
export const parseLocationInput = async (input: string): Promise<{
  city?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}> => {
  const trimmed = input.trim();
  
  // Check if it's a Google Maps URL (full URL only - short URLs need backend)
  if (trimmed.includes('maps.google.com') || trimmed.includes('google.com/maps')) {
    const coords = await extractCoordinatesFromGoogleMapsUrl(trimmed);
    if (coords) {
      return {
        latitude: coords.lat,
        longitude: coords.lon,
        address: coords.address
      };
    }
  }
  
  // Check if it's a short Google Maps URL - show helpful message
  if (trimmed.includes('maps.app.goo.gl') || trimmed.includes('goo.gl/maps')) {
    // Try to extract, but likely will fail due to CORS
    const coords = await extractCoordinatesFromGoogleMapsUrl(trimmed);
    if (coords) {
      return {
        latitude: coords.lat,
        longitude: coords.lon,
        address: coords.address
      };
    }
    // If extraction fails, return null so user knows to use full URL
    return {};
  }
  
  // Check if it's coordinates (lat,lng format)
  const coordsMatch = trimmed.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
  if (coordsMatch) {
    return {
      latitude: parseFloat(coordsMatch[1]),
      longitude: parseFloat(coordsMatch[2])
    };
  }
  
  // Otherwise, treat as city name
  const cityCoords = getCityCoordinates(trimmed);
  if (cityCoords) {
    return {
      city: trimmed,
      latitude: cityCoords.lat,
      longitude: cityCoords.lon
    };
  }
  
  // Return as city name even if coordinates not found
  return {
    city: trimmed
  };
};

// Calculate distance between user and event
export const getEventDistance = (
  userLat: number | undefined,
  userLon: number | undefined,
  eventLat: number | undefined,
  eventLon: number | undefined,
  userCity?: string,
  eventCity?: string
): number | null => {
  // If both have coordinates, use them
  if (userLat && userLon && eventLat && eventLon) {
    return calculateDistance(userLat, userLon, eventLat, eventLon);
  }
  
  // Try to get coordinates from city names
  if (userCity && eventCity) {
    const userCoords = getCityCoordinates(userCity);
    const eventCoords = getCityCoordinates(eventCity);
    
    if (userCoords && eventCoords) {
      return calculateDistance(userCoords.lat, userCoords.lon, eventCoords.lat, eventCoords.lon);
    }
  }
  
  return null;
};

