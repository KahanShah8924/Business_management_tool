import axios from 'axios';

const api = axios.create({
  // Vite dev server proxies /api -> http://localhost:5000/api
  baseURL: '/api',
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
