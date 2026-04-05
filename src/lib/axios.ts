import axios from 'axios';

// Create a globally configured Axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach the JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // We will use Zustand's localStorage persistence to store the token
    const storedAuth = localStorage.getItem('auth-storage');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        const token = parsed?.state?.tokens?.accessToken;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to parse auth token", error);
      }
    }
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Future: Implement automatic token refresh logic here
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // Kick them out if token expires
        // window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);
