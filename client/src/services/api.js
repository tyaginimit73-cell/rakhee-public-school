import axios from 'axios';
import { getStored, removeStored } from '../utils/storage.js';

export const AUTH_TOKEN_KEY = 'rps_auth_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // The HTTP-only cookie is the primary credential. The session-scoped Bearer
  // fallback keeps authentication working when a browser blocks or drops a
  // cross-origin cookie; the server still validates both through protect().
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getStored(AUTH_TOKEN_KEY, 'session');
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize every error into { status, message }
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status || 0;
    if (status === 401) removeStored(AUTH_TOKEN_KEY, 'session');
    const message = error.response?.data?.message
      || (status === 0 ? 'Cannot reach the server. Please check your connection.' : 'Something went wrong');
    return Promise.reject(Object.assign(new Error(message), { status, data: error.response?.data }));
  },
);
export default api;
