import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  add: (bookData) => api.post('/books', bookData),
  update: (id, bookData) => api.put(`/books/${id}`, bookData),
  delete: (id) => api.delete(`/books/${id}`),
  getCategories: () => api.get('/books/categories/all'),
};

export const borrowingsAPI = {
  borrow: (bookId) => api.post('/borrowings/borrow', { bookId }),
  return: (borrowingId) => api.post(`/borrowings/return/${borrowingId}`),
  renew: (borrowingId) => api.post(`/borrowings/renew/${borrowingId}`),
  getMyBorrowings: (params) => api.get('/borrowings/my-borrowings', { params }),
  getAll: (params) => api.get('/borrowings/all', { params }),
};

export const reservationsAPI = {
  create: (bookId) => api.post('/reservations', { bookId }),
  getMyReservations: (params) => api.get('/reservations/my-reservations', { params }),
  cancel: (id) => api.put(`/reservations/${id}/cancel`),
  getAll: (params) => api.get('/reservations/all', { params }),
  fulfill: (id) => api.put(`/reservations/${id}/fulfill`),
  checkExpired: () => api.post('/reservations/check-expired'),
  getStats: () => api.get('/reservations/stats'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  sendOverdueReminders: () => api.post('/admin/send-overdue-reminders'),
  getFines: (params) => api.get('/admin/fines', { params }),
  payFine: (id) => api.put(`/admin/fines/${id}/pay`),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getBorrowingHistory: (params) => api.get('/users/borrowing-history', { params }),
  getFines: (params) => api.get('/users/fines', { params }),
  getDashboard: () => api.get('/users/dashboard'),
  deleteAccount: () => api.delete('/users/account'),
};

export default api;