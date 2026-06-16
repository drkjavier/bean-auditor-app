/**
 * MapTiler Configuration
 * 
 * Centralized configuration for MapTiler maps integration.
 * Supports both web (MapTiler SDK JS) and native (MapLibre React Native).
 */

// Get API key from environment variables
// For Vite (web): use import.meta.env.VITE_MAPTILER_API_KEY
// For React Native (native): use process.env.MAPTILER_API_KEY
const getApiKey = (): string => {
  // Web environment (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as any).VITE_MAPTILER_API_KEY || 'YOUR_MAPTILER_API_KEY_HERE';
  }
  
  // Native environment (React Native)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.MAPTILER_API_KEY || 'YOUR_MAPTILER_API_KEY_HERE';
  }
  
  return 'YOUR_MAPTILER_API_KEY_HERE';
};

export const MAPTILER_CONFIG = {
  // API Key - Get yours at https://cloud.maptiler.com/account/keys/
  // For development, you can use a free tier key
  apiKey: getApiKey(),
  
  // Base URL for MapTiler API
  baseUrl: 'https://api.maptiler.com',
  
  // Maximum zoom level supported by MapTiler tiles
  maxZoom: 22,
  
  // Minimum zoom level
  minZoom: 0,
  
  // Default zoom level for initial map view
  defaultZoom: 12,
  
  // Map styles available
  styles: {
    street: 'streets-v2',
    satellite: 'satellite',
    hybrid: 'hybrid',
    outdoor: 'outdoor-v2',
    basic: 'basic-v2',
    bright: 'bright-v2',
    dataviz: 'dataviz',
    topo: 'topo-v2',
    voyager: 'voyager-v2',
  },
  
  // Tile size (256px is standard, 512px for retina)
  tileSize: 256,
  
  // Attribution (required by MapTiler ToS)
  attribution: '© MapTiler © OpenStreetMap contributors',
} as const;

/**
 * Get MapTiler style URL
 */
export function getMapTilerStyleUrl(style: keyof typeof MAPTILER_CONFIG.styles = 'street'): string {
  return `${MAPTILER_CONFIG.baseUrl}/maps/${MAPTILER_CONFIG.styles[style]}/style.json?key=${MAPTILER_CONFIG.apiKey}`;
}

/**
 * Get MapTiler tile URL template
 */
export function getMapTilerTileUrl(
  type: 'street' | 'satellite' | 'hybrid' = 'street'
): string {
  const style = MAPTILER_CONFIG.styles[type];
  return `${MAPTILER_CONFIG.baseUrl}/maps/${style}/{z}/{x}/{y}.png?key=${MAPTILER_CONFIG.apiKey}`;
}

/**
 * Get MapLibre style object for React Native
 */
export function getMapLibreStyle(type: 'street' | 'satellite' | 'hybrid' = 'street') {
  const tileUrl = getMapTilerTileUrl(type);
  
  return {
    version: 8 as const,
    sources: {
      'maptiler-tiles': {
        type: 'raster' as const,
        tiles: [tileUrl],
        tileSize: MAPTILER_CONFIG.tileSize,
        maxzoom: MAPTILER_CONFIG.maxZoom,
        attribution: MAPTILER_CONFIG.attribution,
      },
    },
    layers: [
      {
        id: 'maptiler-layer',
        type: 'raster' as const,
        source: 'maptiler-tiles',
      },
    ],
  };
}
