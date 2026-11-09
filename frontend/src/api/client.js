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

// Sensor pesan error agar tidak membocorkan IP internal server, port, atau error teknis database
function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') {
    return 'Terjadi kendala pada jaringan server. Silakan coba beberapa saat lagi.';
  }

  // Jika pesan mengandung format IP address (misal 172.16.x.x:24004 atau IP lainnya)
  const hasIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/.test(msg);
  // Jika pesan mengandung error driver koneksi database
  const isDbRefused = /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENOTFOUND|ECONNRESET|PROTOCOL_CONNECTION_LOST|Network Error/i.test(msg);

  if (hasIp || isDbRefused) {
    return 'Koneksi ke server database terputus atau tidak dapat dijangkau. Silakan hubungi administrator.';
  }

  return msg;
}

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
    const rawMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan pada jaringan';
    const cleanMessage = sanitizeErrorMessage(rawMessage);
    return Promise.reject(new Error(cleanMessage));
  }
);

export default api;

