import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Attempt refresh
          const res = await axios.post(`${API_BASE_URL}/auth/refresh?token=${refreshToken}`);
          const data = res.data;
          if (data?.success && data?.data?.accessToken) {
            localStorage.setItem('token', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.error('Refresh token expired or invalid', refreshErr);
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        // Redirect logic can be triggered by context
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
