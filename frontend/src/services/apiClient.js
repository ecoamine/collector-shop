import axios from 'axios';

// Empty string => relative URLs (same origin, e.g. Nginx at https://localhost).
// Undefined / unset => dev default http://localhost:8080.
const baseURL =
  import.meta.env.VITE_API_URL === ''
    ? ''
    : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

