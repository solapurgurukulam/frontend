import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, X, Music, Clock, TrendingUp, Star, Languages, Info, ArrowRight, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
                if (response.data.success) {
                    localStorage.setItem('accessToken', response.data.data.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
                    return apiClient(originalRequest);
                }
            } catch (err) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

const Loader = () => (
    <div className="flex flex-col justify-center items-center py-20">
        <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-amber-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Loading mantras...</p>
    </div>
);

const ErrorDisplay = ({ message, onRetry }) => (
    <div className="text-center py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-red-200/40">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
            >
                <RefreshCw className="h-4 w-4" /> Retry
            </button>
        )}
    </div>
);

const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const getCategoryColor = (categoryName) => {
    if (!categoryName) return 'from-amber-100 to-orange-200';
    const name = categoryName.toLowerCase();
    if (name.includes('shiva') || name.includes('mahadev')) return 'from-indigo-100 to-purple-200';
    if (name.includes('ganesh')) return 'from-red-100 to-orange-200';
    if (name.includes('durga')) return 'from-pink-100 to-rose-200';
    if (name.includes('vishnu')) return 'from-teal-100 to-cyan-200';
    if (name.includes('lakshmi')) return 'from-yellow-100 to-amber-200';
    if (name.includes('saraswati')) return 'from-blue-100 to-indigo-200';
    if (name.includes('hanuman')) return 'from-orange-100 to-red-200';
    return 'from-amber-100 to-orange-200';
};

const getBorderColor = (categoryName) => {
    if (!categoryName) return 'border-amber-200';
    const name = categoryName.toLowerCase();
    if (name.includes('shiva') || name.includes('mahadev')) return 'border-indigo-300';
    if (name.includes('ganesh')) return 'border-red-300';
    if (name.includes('durga')) return 'border-pink-300';
    if (name.includes('vishnu')) return 'border-teal-300';
    if (name.includes('lakshmi')) return 'border-yellow-300';
    if (name.includes('saraswati')) return 'border-blue-300';
    if (name.includes('hanuman')) return 'border-orange-300';
    return 'border-amber-300';
};

const EMPTY_FORM = {
    name: '',
    sanskrit: '',
    kannada: '',
    marathi: '',
    tamil: '',
    hindi: '',
    english: '',
    benefits: '',
    howToChant: '',
    bestTime: '',
    recommendedCount: 108,
    meaning: '',
    audioUrl: '',
    category: '',
    order: 0,
    isFeatured: false,
};

const ManageMantras = () => {
    const [mantras, setMantras] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingMantra, setEditingMantra] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        
        try {
            const [categoriesResponse, mantrasResponse] = await Promise.all([
                apiClient.get('/categories?limit=100').catch(() => ({ data: { success: false, data: [] } })),
                apiClient.get('/mantras?limit=100').catch(() => ({ data: { success: false, data: [] } }))
            ]);

            if (categoriesResponse.data.success) {
                setCategoriesList(categoriesResponse.data.data || []);
            }

            if (mantrasResponse.data.success) {
                setMantras(mantrasResponse.data.data || []);
            } else {
                setMantras([]);
            }
        } catch (error) {
            console.error('Fetch data error:', error);
            setFetchError('Failed to load data. Please try again.');
            setMantras([]);
            setCategoriesList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const validateForm = () => {
        const errors = {};
        
        if (!formData.name?.trim()) errors.name = 'Mantra name is required';
        if (!formData.category) errors.category = 'Please select a category';
        if (!formData.sanskrit?.trim()) errors.sanskrit = 'Sanskrit text is required';
        if (!formData.kannada?.trim()) errors.kannada = 'Kannada translation is required';
        if (!formData.marathi?.trim()) errors.marathi = 'Marathi translation is required';
        if (!formData.tamil?.trim()) errors.tamil = 'Telugu translation is required';
        if (!formData.benefits?.trim()) errors.benefits = 'Benefits are required';
        if (!formData.howToChant?.trim()) errors.howToChant = 'How to chant is required';
        if (!formData.bestTime?.trim()) errors.bestTime = 'Best time is required';
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setValidationErrors({});

        if (categoriesList.length === 0) {
            toast.error('No categories available. Please create a category first.');
            return;
        }

        if (!validateForm()) {
            const firstError = Object.values(validationErrors)[0];
            toast.error(firstError);
            return;
        }

        setIsSubmitting(true);
        
        try {
            const payload = {
                name: formData.name.trim(),
                sanskrit: formData.sanskrit.trim(),
                kannada: formData.kannada.trim(),
                marathi: formData.marathi.trim(),
                tamil: formData.tamil.trim(),
                hindi: formData.hindi?.trim() || '',
                english: formData.english?.trim() || '',
                benefits: formData.benefits.trim(),
                howToChant: formData.howToChant.trim(),
                bestTime: formData.bestTime.trim(),
                recommendedCount: formData.recommendedCount || 108,
                meaning: formData.meaning?.trim() || '',
                audioUrl: formData.audioUrl?.trim() || '',
                category: formData.category,
                order: parseInt(formData.order) || 0,
                isFeatured: formData.isFeatured || false,
            };

            console.log('Sending payload:', payload);

            let response;
            if (editingMantra) {
                response = await apiClient.put(`/mantras/${editingMantra._id}`, payload);
                if (response.data.success) {
                    toast.success('Mantra updated successfully!');
                    await fetchData();
                    closeForm();
                }
            } else {
                response = await apiClient.post('/mantras', payload);
                if (response.data.success) {
                    toast.success('Mantra created successfully!');
                    await fetchData();
                    closeForm();
                }
            }
        } catch (error) {
            console.error('Save mantra error:', error);
            
            let errorMsg = 'Failed to save mantra. Please try again.';
            
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                
                if (error.response.data?.message) {
                    errorMsg = error.response.data.message;
                    if (errorMsg.toLowerCase().includes('already exists')) {
                        errorMsg = 'A mantra with this name already exists. Please use a different name.';
                    }
                } else if (error.response.status === 400) {
                    errorMsg = 'Validation error. Please check all required fields.';
                } else if (error.response.status === 403) {
                    errorMsg = 'You do not have permission to perform this action.';
                } else if (error.response.status === 500) {
                    errorMsg = 'Server error. Please try again later.';
                }
            } else if (error.request) {
                errorMsg = 'No response from server. Please check your connection.';
            }
            
            toast.error(errorMsg);
            setError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await apiClient.delete(`/mantras/${id}`);
            if (response.data.success) {
                toast.success('Mantra deleted successfully!');
                await fetchData();
            }
        } catch (error) {
            console.error('Delete mantra error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete mantra');
        }
    };

    const openForm = (mantra = null) => {
        if (mantra) {
            setEditingMantra(mantra);
            setFormData({
                name: mantra.name || '',
                sanskrit: mantra.sanskrit || '',
                kannada: mantra.kannada || '',
                marathi: mantra.marathi || '',
                tamil: mantra.tamil || '',
                hindi: mantra.hindi || '',
                english: mantra.english || '',
                benefits: mantra.benefits || '',
                howToChant: mantra.howToChant || '',
                bestTime: mantra.bestTime || '',
                recommendedCount: mantra.recommendedCount || 108,
                meaning: mantra.meaning || '',
                audioUrl: mantra.audioUrl || '',
                category: mantra.category?._id || mantra.category || '',
                order: mantra.order || 0,
                isFeatured: mantra.isFeatured || false,
            });
        } else {
            setEditingMantra(null);
            setFormData(EMPTY_FORM);
        }
        setError(null);
        setValidationErrors({});
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingMantra(null);
        setError(null);
        setValidationErrors({});
    };

    const getCategoryName = useCallback((cat) => {
        if (!cat) return 'Unknown';
        if (cat?.name) return cat.name;
        const found = categoriesList.find(c => c._id === cat);
        return found ? found.name : 'Unknown';
    }, [categoriesList]);

    const filteredMantras = useMemo(() => {
        return (mantras || []).filter(m => {
            const matchSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               m.sanskrit?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = !selectedCategory || 
                                 m.category?._id === selectedCategory || 
                                 m.category === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [mantras, searchTerm, selectedCategory]);

    const field = (label, key, type = 'text', required = false, rows = null, placeholder = '') => {
        const hasError = validationErrors[key];
        
        return (
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {rows ? (
                    <textarea
                        value={formData[key] || ''}
                        onChange={e => {
                            setFormData({ ...formData, [key]: e.target.value });
                            if (validationErrors[key]) {
                                setValidationErrors({ ...validationErrors, [key]: '' });
                            }
                        }}
                        rows={rows}
                        placeholder={placeholder}
                        className={`w-full px-4 py-2.5 border ${hasError ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition`}
                        required={required}
                    />
                ) : (
                    <input
                        type={type}
                        value={formData[key] || ''}
                        onChange={e => {
                            setFormData({ ...formData, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value });
                            if (validationErrors[key]) {
                                setValidationErrors({ ...validationErrors, [key]: '' });
                            }
                        }}
                        placeholder={placeholder}
                        className={`w-full px-4 py-2.5 border ${hasError ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition`}
                        required={required}
                    />
                )}
                {hasError && (
                    <p className="text-red-500 text-xs mt-1">{hasError}</p>
                )}
            </div>
        );
    };

    if (loading && mantras.length === 0) {
        return <Loader />;
    }

    if (fetchError) {
        return <ErrorDisplay message={fetchError} onRetry={fetchData} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium mb-3">
                            <Music className="h-3.5 w-3.5" />
                            Content Management
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Mantras</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {filteredMantras.length} of {mantras.length} {mantras.length === 1 ? 'mantra' : 'mantras'} displayed
                        </p>
                    </div>
                    <button
                        onClick={() => openForm()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
                        disabled={loading}
                    >
                        <Plus className="h-5 w-5" />
                        Add Mantra
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                        <input
                            type="text"
                            placeholder="Search by name or Sanskrit text..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-amber-200/50 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition shadow-sm"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-amber-200/50 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition shadow-sm sm:w-64"
                    >
                        <option value="">All Categories</option>
                        {categoriesList.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                    {(searchTerm || selectedCategory) && (
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
                            className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {filteredMantras.length === 0 ? (
                    <div className="text-center py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-amber-200/40">
                        <div className="text-6xl mb-4">🔱</div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {searchTerm || selectedCategory ? 'No mantras match your filters' : 'No mantras yet. Click "Add Mantra" to create one.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMantras.map((m) => {
                            const categoryName = getCategoryName(m.category);
                            const cat = categoriesList.find(c => c._id === (m.category?._id || m.category));
                            const catImage = cat?.image ? getImageUrl(cat.image) : null;
                            const gradientBg = getCategoryColor(categoryName);

                            return (
                                <motion.div
                                    key={m._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ y: -4 }}
                                    className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border hover:border-amber-400/60"
                                >
                                    <div className={`h-1.5 w-full bg-gradient-to-r ${gradientBg}`} />
                                    
                                    <div className="p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border-2 border-white/50">
                                                {catImage ? (
                                                    <img
                                                        src={catImage}
                                                        alt={categoryName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            const parent = e.target.parentElement;
                                                            parent.innerHTML = `<span class="text-xl font-bold text-amber-700">${categoryName.charAt(0).toUpperCase()}</span>`;
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-xl font-bold text-amber-700">{categoryName.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1">
                                                    {m.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                                                        {categoryName}
                                                    </span>
                                                    {m.isFeatured && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                                            <Star className="h-3 w-3" /> Featured
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                <button
                                                    onClick={() => openForm(m)}
                                                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(m._id, m.name)}
                                                    className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                </button>
                                            </div>
                                        </div>

                                        {m.sanskrit && (
                                            <div className="mt-3 font-devanagari text-sm text-gray-600 dark:text-gray-300 line-clamp-2 bg-amber-50/40 dark:bg-amber-900/10 rounded-xl px-3 py-2 leading-relaxed">
                                                {m.sanskrit}
                                            </div>
                                        )}

                                        {m.benefits && (
                                            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                                                {m.benefits}
                                            </p>
                                        )}

                                        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 gap-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" /> {m.bestTime || 'Any time'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="h-3.5 w-3.5" /> {m.recommendedCount || 108}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                👁 {(m.views || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                <AnimatePresence>
                    {showForm && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeForm}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-amber-200/50"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-5 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {editingMantra ? 'Edit Mantra' : 'Add New Mantra'}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fill in all required fields</p>
                                    </div>
                                    <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {categoriesList.length === 0 && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-yellow-700 dark:text-yellow-400 text-sm flex items-start gap-2">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                            <span>⚠️ No categories available. Please create a category first before adding mantras.</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {field('Mantra Name', 'name', 'text', true, null, 'e.g., Gayatri Mantra')}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={e => {
                                                    setFormData({ ...formData, category: e.target.value });
                                                    if (validationErrors.category) {
                                                        setValidationErrors({ ...validationErrors, category: '' });
                                                    }
                                                }}
                                                className={`w-full px-4 py-2.5 border ${validationErrors.category ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition`}
                                                required
                                            >
                                                <option value="">-- Select Category --</option>
                                                {categoriesList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                            {validationErrors.category && (
                                                <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                            <Languages className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
                                            Sanskrit Text <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.sanskrit}
                                            onChange={e => {
                                                setFormData({ ...formData, sanskrit: e.target.value });
                                                if (validationErrors.sanskrit) {
                                                    setValidationErrors({ ...validationErrors, sanskrit: '' });
                                                }
                                            }}
                                            rows={4}
                                            placeholder="संस्कृत पाठ यहाँ लिखें..."
                                            className={`w-full px-4 py-2.5 border ${validationErrors.sanskrit ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition font-devanagari text-lg`}
                                            required
                                        />
                                        {validationErrors.sanskrit && (
                                            <p className="text-red-500 text-xs mt-1">{validationErrors.sanskrit}</p>
                                        )}
                                    </div>

                                    <div className="border border-amber-200 dark:border-amber-800/50 rounded-xl p-5 bg-amber-50/30 dark:bg-amber-900/10">
                                        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                                            <Languages className="h-4 w-4" /> Required Translations
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            All translations are required for multi-language support
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ಕನ್ನಡ (Kannada) <span className="text-red-500">*</span></label>
                                                <textarea 
                                                    required 
                                                    rows={4} 
                                                    value={formData.kannada} 
                                                    onChange={e => {
                                                        setFormData({ ...formData, kannada: e.target.value });
                                                        if (validationErrors.kannada) {
                                                            setValidationErrors({ ...validationErrors, kannada: '' });
                                                        }
                                                    }}
                                                    placeholder="Kannada translation..." 
                                                    className={`w-full px-3 py-2 border ${validationErrors.kannada ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500`} 
                                                />
                                                {validationErrors.kannada && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors.kannada}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">मराठी (Marathi) <span className="text-red-500">*</span></label>
                                                <textarea 
                                                    required 
                                                    rows={4} 
                                                    value={formData.marathi} 
                                                    onChange={e => {
                                                        setFormData({ ...formData, marathi: e.target.value });
                                                        if (validationErrors.marathi) {
                                                            setValidationErrors({ ...validationErrors, marathi: '' });
                                                        }
                                                    }}
                                                    placeholder="Marathi translation..." 
                                                    className={`w-full px-3 py-2 border ${validationErrors.marathi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500`} 
                                                />
                                                {validationErrors.marathi && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors.marathi}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">తెలుగు (Telugu) <span className="text-red-500">*</span></label>
                                                <textarea 
                                                    required 
                                                    rows={4} 
                                                    value={formData.tamil} 
                                                    onChange={e => {
                                                        setFormData({ ...formData, tamil: e.target.value });
                                                        if (validationErrors.tamil) {
                                                            setValidationErrors({ ...validationErrors, tamil: '' });
                                                        }
                                                    }}
                                                    placeholder="Telugu translation..." 
                                                    className={`w-full px-3 py-2 border ${validationErrors.tamil ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500`} 
                                                />
                                                {validationErrors.tamil && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors.tamil}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {field('हिन्दी (Hindi) - Optional', 'hindi', 'text', false, 3, 'Hindi translation...')}
                                        {field('English Translation - Optional', 'english', 'text', false, 3, 'English translation...')}
                                    </div>

                                    {field('Benefits / लाभ', 'benefits', 'text', true, 3, 'Benefits of chanting this mantra...')}
                                    {field('Meaning / अर्थ', 'meaning', 'text', false, 3, 'Deep meaning and explanation...')}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {field('How to Chant', 'howToChant', 'text', true, 2, 'Instructions...')}
                                        {field('Best Time', 'bestTime', 'text', true, null, 'e.g., Morning, Sunrise')}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {field('Recommended Count', 'recommendedCount', 'number', false)}
                                        {field('Display Order', 'order', 'number', false)}
                                    </div>

                                    {field('Audio URL (Optional)', 'audioUrl', 'url', false, null, 'https://example.com/mantra.mp3')}

                                    <div className="flex items-center gap-3 pt-2">
                                        <input 
                                            type="checkbox" 
                                            id="mantraFeatured" 
                                            checked={formData.isFeatured} 
                                            onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} 
                                            className="h-4 w-4 text-amber-600 rounded focus:ring-amber-500"
                                        />
                                        <label htmlFor="mantraFeatured" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                            <Star className="h-4 w-4 text-amber-500" /> Featured Mantra
                                        </label>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
                                        <button
                                            type="button"
                                            onClick={closeForm}
                                            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || categoriesList.length === 0}
                                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 flex items-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                editingMantra ? 'Update Mantra' : 'Create Mantra'
                                            )}
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

export default ManageMantras;