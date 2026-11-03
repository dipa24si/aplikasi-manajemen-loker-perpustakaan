import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor Request: Sisipkan Token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('loker_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('loker_token');
      localStorage.removeItem('loker_user');
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan pada jaringan';
    return Promise.reject(new Error(message));
  }
);

export default api;

