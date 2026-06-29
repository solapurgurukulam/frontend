import axiosInstance from './axios';

// axiosInstance interceptor: return response.data
// So every call returns { success, data, pagination? } directly

export const shotramApi = {
    // Returns: { success, data: [...], pagination }
    getAll: (params) => axiosInstance.get('/shotrams', { params }),

    // Returns: { success, data: {...} }
    getById: (id) => axiosInstance.get(`/shotrams/${id}`),

    // Returns: { success, data: {...} }
    getBySlug: async (slug) => {
        const res = await axiosInstance.get(`/shotrams/slug/${slug}`);
        return res?.data || null;
    },

    // Returns: { success, data: [...], pagination }
    getByCategory: (categoryId, params) =>
        axiosInstance.get(`/shotrams/category/${categoryId}`, { params }),
    getFeatured: async () => {
    const res = await axiosInstance.get('/shotrams', { params: { isFeatured: true, limit: 6 } });
    return Array.isArray(res?.data) ? res.data : [];
},

    // CRUD
    create: (data) => axiosInstance.post('/shotrams', data),
    update: (id, data) => axiosInstance.put(`/shotrams/${id}`, data),
    delete: (id) => axiosInstance.delete(`/shotrams/${id}`),
    incrementViews: (id) => axiosInstance.post(`/shotrams/${id}/views`),
};
