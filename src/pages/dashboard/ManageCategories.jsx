import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, X, Image, Tag, FileText, Hash, Globe, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const orig = error.config;
        if (error.response?.status === 401 && !orig._retry) {
            orig._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
                if (res.data.success) {
                    localStorage.setItem('accessToken', res.data.data.accessToken);
                    orig.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
                    return apiClient(orig);
                }
            } catch {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

const categoryApi = {
    getAll: (params) => apiClient.get('/categories', { params }).then(r => r.data),
    create: (data) => apiClient.post('/categories', data).then(r => r.data.data),
    update: (id, data) => apiClient.put(`/categories/${id}`, data).then(r => r.data.data),
    delete: (id) => apiClient.delete(`/categories/${id}`).then(r => r.data),
};

const DEITY_ICONS = ['🕉️', '🔱', '🪔', '🌺', '☸️', '🐚', '🌸', '🙏', '🏵️', '⚜️'];

// ─── Helper: build absolute image URL ───
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const ManageCategories = () => {
    const queryClient = useQueryClient();
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [formData, setFormData] = useState({ name: '', description: '', image: '' });

    const { isLoading } = useQuery({
        queryKey: ['categories-admin'],
        queryFn: async () => {
            const data = await categoryApi.getAll({ limit: 200 });
            const cats = data?.data || data?.categories || [];
            setCategories(cats);
            return cats;
        },
    });

    const createMutation = useMutation({
        mutationFn: categoryApi.create,
        onSuccess: (data) => {
            setCategories(prev => [data, ...prev]);
            queryClient.invalidateQueries(['categories-admin']);
            toast.success('Category created successfully');
            closeForm();
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create category'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => categoryApi.update(id, data),
        onSuccess: (data) => {
            setCategories(prev => prev.map(c => c._id === data._id ? data : c));
            queryClient.invalidateQueries(['categories-admin']);
            toast.success('Category updated successfully');
            closeForm();
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update category'),
    });

    const deleteMutation = useMutation({
        mutationFn: categoryApi.delete,
        onSuccess: (_, id) => {
            setCategories(prev => prev.filter(c => c._id !== id));
            queryClient.invalidateQueries(['categories-admin']);
            toast.success('Category deleted successfully');
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete category'),
    });

    const openForm = (cat = null) => {
        if (cat) {
            setEditingCategory(cat);
            setFormData({ name: cat.name || '', description: cat.description || '', image: cat.image || '' });
            setImagePreview(cat.image || '');
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', image: '' });
            setImagePreview('');
        }
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', image: '' });
        setImagePreview('');
    };

    const handleImageUrlChange = (url) => {
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error('Category name is required'); return; }
        const payload = {
            name: formData.name.trim(),
            description: formData.description || '',
            image: formData.image || '',
        };
        if (editingCategory) updateMutation.mutate({ id: editingCategory._id, data: payload });
        else createMutation.mutate(payload);
    };

    const handleDelete = (id) => {
    toast(
        (t) => (
            <div className="flex flex-col gap-3">
                <p className="font-semibold text-gray-900">Are you sure you want to delete this category? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { toast.dismiss(t.id); deleteMutation.mutate(id); }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        ),
        { duration: 2000, position: 'top-center' }
    );
};

    const filtered = categories.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const isPending = createMutation.isPending || updateMutation.isPending;

    if (isLoading) return <Loader />;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
    };
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium mb-3">
                            <Sparkles className="h-3.5 w-3.5" />
                            Content Management
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {categories.length} {categories.length === 1 ? 'category' : 'categories'} total
                        </p>
                    </div>
                    <button
                        onClick={() => openForm()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="h-5 w-5" />
                        Add Category
                    </button>
                </div>

                <div className="relative max-w-md mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-amber-200/50 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition shadow-sm"
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-amber-200/40">
                        <div className="text-6xl mb-4">🕉️</div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {searchTerm ? 'No categories match your search' : 'No categories yet. Click "Add Category" to create one.'}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {filtered.map((cat, idx) => {
                            const icon = DEITY_ICONS[idx % DEITY_ICONS.length];
                            const imageUrl = getImageUrl(cat.image);
                            return (
                                <motion.div
                                    key={cat._id}
                                    variants={cardVariants}
                                    whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 300 } }}
                                    className="group cursor-default"
                                >
                                    <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-amber-200/40 dark:border-gray-700/50 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                        {/* Gradient border glow on hover */}
                                        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-amber-400/0 via-amber-400/0 to-amber-400/0 group-hover:from-amber-400/50 group-hover:via-amber-400/30 group-hover:to-amber-400/50 transition-all duration-700" />
                                        
                                        <div className="relative p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            {/* Icon / Image section with fallback */}
                                            <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={cat.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            const parent = e.target.parentElement;
                                                            const iconSpan = document.createElement('span');
                                                            iconSpan.className = 'text-3xl';
                                                            iconSpan.textContent = icon;
                                                            parent.appendChild(iconSpan);
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-3xl">{icon}</span>
                                                )}
                                            </div>
                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-amber-600 transition-colors">
                                                    {cat.name}
                                                </h3>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                                                    {cat.description || 'Explore sacred mantras, shlokas and shotrams from this tradition.'}
                                                </p>
                                                {/* Decorative progress bar */}
                                                <div className="mt-2 w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700 group-hover:w-full w-1/3"
                                                        style={{ width: `${Math.min(100, (cat.mantraCount || 0) * 5)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {/* Action buttons */}
                                            <div className="flex-shrink-0 flex gap-1.5">
                                                <button
                                                    onClick={() => openForm(cat)}
                                                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4 text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat._id)}
                                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                        {/* Count badge */}
                                        <div className="absolute top-2 right-2">
                                            <span className="inline-block text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full">
                                                {cat.mantraCount || 0} mantras
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                <AnimatePresence>
                    {showForm && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeForm}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-amber-200/50 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-gray-800 dark:to-gray-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {editingCategory ? 'Edit Category' : 'New Category'}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {editingCategory ? 'Update category details' : 'Add a new spiritual category'}
                                        </p>
                                    </div>
                                    <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                            <Tag className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
                                            Category Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Gayatri Mantra, Shiva Stotram"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                            <FileText className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
                                            Description
                                        </label>
                                        <textarea
                                            placeholder="Brief description of this category..."
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                            <Globe className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
                                            Image URL <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.image}
                                            onChange={(e) => handleImageUrlChange(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use a default spiritual icon</p>
                                        {imagePreview && (
                                            <div className="mt-3 relative rounded-xl overflow-hidden h-32 bg-gray-100 dark:bg-gray-700">
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                                <button
                                                    type="button"
                                                    onClick={() => { setImagePreview(''); setFormData(prev => ({ ...prev, image: '' })); }}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeForm}
                                            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isPending}
                                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                        >
                                            {isPending ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManageCategories;
