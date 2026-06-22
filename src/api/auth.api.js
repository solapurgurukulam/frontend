import axiosInstance from './axios';

export const authApi = {
    register: (userData) => axiosInstance.post('/auth/register', userData),
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    verifyEmail: (token) => axiosInstance.get(`/auth/verify-email/${token}`),
    forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => axiosInstance.post(`/auth/reset-password/${token}`, { password }),
    getProfile: () => axiosInstance.get('/auth/profile'),
    updateProfile: (data) => axiosInstance.put('/auth/profile', data),
    changePassword: (data) => axiosInstance.put('/auth/change-password', data),
    logout: () => axiosInstance.post('/auth/logout'),
};


