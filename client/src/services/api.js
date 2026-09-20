import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

// Normalize every error into { status, message }
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status || 0;
    const message = error.response?.data?.message
      || (status === 0 ? 'Cannot reach the server. Please check your connection.' : 'Something went wrong');
    return Promise.reject(Object.assign(new Error(message), { status, data: error.response?.data }));
  },
);
export default api;
