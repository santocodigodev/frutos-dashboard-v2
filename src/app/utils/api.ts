// Get API base URL from environment variables
// Next.js exposes NEXT_PUBLIC_* variables at build time
// Variables can be defined in:
// 1. .env.local file (recommended)
// 2. next.config.ts env section (requires server restart)
// 3. System environment variables

// Read from environment (available in both client and server)
const getApiBaseUrl = (): string => {
  // Try to get from environment variable (works in .env.local or next.config.ts)
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Fallback to API_BASE_URL if available
  if (typeof process !== 'undefined' && process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // Default fallback
  return 'https://vps-5538614-x.dattaweb.com/qa/';
};

export const API_BASE_URL = getApiBaseUrl();

// Debug log in development to verify the URL being used (only on client-side)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 [API Config] API_BASE_URL:', API_BASE_URL);
  console.log('🔧 [API Config] NEXT_PUBLIC_API_BASE_URL from env:', process.env.NEXT_PUBLIC_API_BASE_URL || 'N/A');
}

// Helper function to ensure URL doesn't have trailing slash
export const getApiUrl = (path: string) => {
  const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Get socket.io base URL (without /qa/ at the end) and path
export const getSocketConfig = () => {
  const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  // Remove /qa/ from the end if present
  const socketBaseUrl = baseUrl.replace(/\/qa\/?$/, '');
  return {
    url: socketBaseUrl,
    path: '/qa/socket.io'
  };
};

// Helper function to get authentication headers with token
// Only works on client-side (browser)
export const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') {
    // Server-side, return empty headers
    return {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  // Client-side, get token from localStorage
  const userStr = localStorage.getItem('user');
  let token = '';
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      token = user?.token || '';
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }

  return {
    'accept': 'application/json',
    'Content-Type': 'application/json',
    'token': token
  };
};

