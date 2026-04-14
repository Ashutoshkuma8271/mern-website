import axios from 'axios';

function resolveApiBaseUrl() {
  // Dev should use Vite proxy so frontend talks to local backend automatically.
  if (import.meta.env.DEV) return '/api';

  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, '');
  }
  // Production (e.g. GitHub Pages): must set VITE_API_BASE_URL at build time to your public HTTPS API
  if (import.meta.env.PROD) {
    console.warn(
      '[FaceAttend] Missing VITE_API_BASE_URL in production build. Create frontend/.env.production with your deployed API URL, then rebuild.'
    );
  }
  return '/api';
}

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
        window.location.href = `${base}/login`;
      }
    }
    return Promise.reject(error);
  }
);

export default API;
