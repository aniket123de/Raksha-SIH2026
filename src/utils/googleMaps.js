/**
 * Google Maps App Utilities
 * 
 * Deep links to Google Maps app on iOS/Android/Desktop:
 * - Search / Pin location
 * - Directions / Turn-by-turn driving navigation
 * - Embedded Google Maps iframe
 */

export const getGoogleMapsLocationUrl = (lat, lng, label = '') => {
  if (!lat || !lng) return 'https://www.google.com/maps';
  const query = label ? `${lat},${lng} (${encodeURIComponent(label)})` : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export const getGoogleMapsDirectionsUrl = (destLat, destLng, originLat = null, originLng = null) => {
  if (!destLat || !destLng) return 'https://www.google.com/maps';
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
  if (originLat && originLng) {
    url += `&origin=${originLat},${originLng}`;
  }
  return url;
};

export const getGoogleMapsEmbedUrl = (lat, lng, zoom = 14) => {
  if (!lat || !lng) {
    // Default to Kolkata emergency center (Exide Crossing / AJC Bose Road)
    return `https://maps.google.com/maps?q=22.5415,88.3485&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }
  return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
};

export const getGoogleMapsRouteEmbedUrl = (originLat, originLng, destLat, destLng, zoom = 14) => {
  if (!destLat || !destLng) return getGoogleMapsEmbedUrl(originLat, originLng, zoom);
  if (!originLat || !originLng) return getGoogleMapsEmbedUrl(destLat, destLng, zoom);
  // dirflg=d enforces driving navigation (shortest driving path, prevents transit/walking detours)
  return `https://maps.google.com/maps?saddr=${originLat},${originLng}&daddr=${destLat},${destLng}&dirflg=d&hl=en&z=${zoom}&output=embed`;
};

export const openInGoogleMapsApp = (lat, lng, label = '') => {
  const url = getGoogleMapsLocationUrl(lat, lng, label);
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const navigateInGoogleMapsApp = (destLat, destLng, originLat = null, originLng = null) => {
  const url = getGoogleMapsDirectionsUrl(destLat, destLng, originLat, originLng);
  window.open(url, '_blank', 'noopener,noreferrer');
};
