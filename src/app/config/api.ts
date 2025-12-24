export const API_BASE_URL = process.env.API_BASE_URL || 'https://multiple-nan-tecurb-5e2ba6a7.koyeb.app/';

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}${cleanEndpoint}`;
};
