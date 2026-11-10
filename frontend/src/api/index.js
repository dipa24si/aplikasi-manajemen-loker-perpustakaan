import api from './client';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me')
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats')
};

export const lokerApi = {
  getAll: (params) => api.get('/lokers', { params }),
  getById: (id) => api.get(`/lokers/${id}`),
  create: (data) => api.post('/lokers', data),
  update: (id, data) => api.put(`/lokers/${id}`, data),
  updateStatus: (id, data) => api.patch(`/lokers/${id}/status`, data),
  delete: (id) => api.delete(`/lokers/${id}`)
};

export const peminjamanApi = {
  mandiriPinjam: (data) => api.post('/peminjaman/mandiri', data),
  pinjam: (data) => api.post('/peminjaman/pinjam', data),
  kembali: (data) => api.post('/peminjaman/kembali', data),
  pulihkanKunci: (data) => api.post('/peminjaman/pulihkan-kunci', data),
  getActive: (params) => api.get('/peminjaman/active', { params })
};

export const historyApi = {
  getHistory: (params) => api.get('/history', { params })
};

export const anggotaApi = {
  search: (q) => api.get('/anggota/search', { params: { q } }),
  getById: (id) => api.get(`/anggota/${id}`),
  create: (data) => api.post('/anggota', data)
};

export const petugasApi = {
  getAll: () => api.get('/petugas'),
  create: (data) => api.post('/petugas', data),
  update: (id, data) => api.put(`/petugas/${id}`, data),
  delete: (id) => api.delete(`/petugas/${id}`)
};

export const kioskApi = {
  getAll: () => api.get('/kiosks'),
  getBySlug: (slug) => api.get(`/kiosks/slug/${slug}`),
  create: (data) => api.post('/kiosks', data),
  generateLokers: (id, data) => api.post(`/kiosks/${id}/generate-lokers`, data),
  reduceLokers: (id, data) => api.post(`/kiosks/${id}/reduce-lokers`, data),
  update: (id, data) => api.put(`/kiosks/${id}`, data),
  delete: (id) => api.delete(`/kiosks/${id}`)
};

export const healthApi = {
  check: () => api.get('/health')
};
