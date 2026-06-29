import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, X, BookOpen, Star, Languages, TrendingUp, Calendar, Hash, ArrowRight, Image } from 'lucide-react';
import toast from 'react-hot-toast';

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
    <div className="flex justify-center items-center py-20">
        <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-amber-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
    </div>
);

// ─── Helper: build absolute image URL ───
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// ─── Get a soft pastel color based on category name ───
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

// ─── Get a gradient border color ───
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
    meaning: '',
    audioUrl: '',
    category: '',
    order: 0,
    isFeatured: false,
};

const ManageShotrams = () => {
    const [shotrams, setShotrams] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingShotram, setEditingShotram] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => { fetchCategories(); fetchShotrams(); }, []);

    const fetchCategories = async () => {
        try {
            const res = await apiClient.get('/categories');
            setCategoriesList(res.data.data || []);
        } catch {
            toast.error('Failed to load categories');
        }
    };

    const fetchShotrams = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/shotrams?limit=100');
            setShotrams(res.data.data || []);
        } catch {
            toast.error('Failed to load shotrams');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name?.trim()) return toast.error('Shotram name is required');
        if (!formData.category) return toast.error('Please select a category');
        if (!formData.sanskrit?.trim()) return toast.error('Sanskrit text is required');
        if (!formData.kannada?.trim()) return toast.error('Kannada translation is required');
        if (!formData.marathi?.trim()) return toast.error('Marathi translation is required');
        if (!formData.tamil?.trim()) return toast.error('Telugu translation is required');

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                sanskrit: formData.sanskrit.trim(),
                kannada: formData.kannada.trim(),
                marathi: formData.marathi.trim(),
                tamil: formData.tamil.trim(),
                hindi: formData.hindi || '',
                english: formData.english || '',
                meaning: formData.meaning || '',
                audioUrl: formData.audioUrl || '',
                category: formData.category,
                order: parseInt(formData.order) || 0,
                isFeatured: formData.isFeatured || false,
                isActive: true,
            };

            if (editingShotram) {
                const response = await apiClient.put(`/shotrams/${editingShotram._id}`, payload);
                if (response.data.success) {
                    toast.success('Shotram updated!');
                    fetchShotrams();
                    closeForm();
                }
            } else {
                const response = await apiClient.post('/shotrams', payload);
                if (response.data.success) {
                    toast.success('Shotram created!');
                    fetchShotrams();
                    closeForm();
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save shotram');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
    toast(
        (t) => (
            <div className="flex flex-col gap-3">
                <p className="font-semibold text-gray-900">Are you sure you want to delete this shotram? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            setLoading(true);
                            try {
                                await apiClient.delete(`/shotrams/${id}`);
                                toast.success('Shotram deleted', { duration: 2000 });
                                fetchShotrams();
                            } catch {
                                toast.error('Failed to delete', { duration: 2000 });
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        ),
        { duration: 3000, position: 'top-center' }
    );
};

    const openForm = (shotram = null) => {
        if (shotram) {
            setEditingShotram(shotram);
            setFormData({
                name: shotram.name || '',
                sanskrit: shotram.sanskrit || '',
                kannada: shotram.kannada || '',
                marathi: shotram.marathi || '',
                tamil: shotram.tamil || '',
                hindi: shotram.hindi || '',
                english: shotram.english || '',
                meaning: shotram.meaning || '',
                audioUrl: shotram.audioUrl || '',
                category: shotram.category?._id || shotram.category || '',
                order: shotram.order || 0,
                isFeatured: shotram.isFeatured || false,
            });
        } else {
            setEditingShotram(null);
            setFormData(EMPTY_FORM);
        }
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditingShotram(null); };

    const getCategoryName = (cat) => {
        if (cat?.name) return cat.name;
        const found = categoriesList.find(c => c._id === cat);
        return found ? found.name : 'Unknown';
    };

    const filteredShotrams = shotrams.filter(s => {
        const matchSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.sanskrit?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = !selectedCategory || s.category?._id === selectedCategory || s.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    if (loading && shotrams.length === 0) return <Loader />;

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
                            <BookOpen className="h-3.5 w-3.5" />
                            Content Management
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Shotrams</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {shotrams.length} {shotrams.length === 1 ? 'shotram' : 'shotrams'} total
                        </p>
                    </div>
                    <button
                        onClick={() => openForm()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="h-5 w-5" />
                        Add Shotram
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                        <input
                            type="text"
                            placeholder="Search shotrams by name or Sanskrit text..."
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
                        {categoriesList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>

                {filteredShotrams.length === 0 ? (
                    <div className="text-center py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-amber-200/40">
                        <div className="text-6xl mb-4">🙏</div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {searchTerm || selectedCategory ? 'No shotrams match your filters' : 'No shotrams yet. Click "Add Shotram" to create one.'}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredShotrams.map((s, idx) => {
                            const categoryName = getCategoryName(s.category);
                            const cat = categoriesList.find(c => c._id === (s.category?._id || s.category));
                            const catImage = cat?.image ? getImageUrl(cat.image) : null;
                            const gradientBg = getCategoryColor(categoryName);
                            const borderColor = getBorderColor(categoryName);
                            const fallbackIcon = catImage ? null : (categoryName ? categoryName.charAt(0).toUpperCase() : '?');

                            return (
                                <motion.div key={s._id} variants={cardVariants} whileHover={{ y: -6, transition: { type: 'spring', stiffness: 200 } }}>
                                    <div className={`group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border ${borderColor} hover:border-amber-400/60`}>
                                        {/* Category color accent bar – soft pastel gradient */}
                                        <div className={`h-1.5 w-full bg-gradient-to-r ${gradientBg}`} />

                                        <div className="p-5">
                                            <div className="flex items-start gap-3">
                                                {/* Category Image / Avatar */}
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border-2 border-white/50">
                                                    {catImage ? (
                                                        <img
                                                            src={catImage}
                                                            alt={categoryName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                const parent = e.target.parentElement;
                                                                parent.innerHTML = `<span class="text-xl font-bold text-amber-700">${fallbackIcon}</span>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-xl font-bold text-amber-700">{fallbackIcon}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1">
                                                        {s.name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                                                            {categoryName}
                                                        </span>
                                                        {s.isFeatured && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                                                <Star className="h-3 w-3" /> Featured
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 flex-shrink-0">
                                                    <button
                                                        onClick={() => openForm(s)}
                                                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-3.5 w-3.5 text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(s._id)}
                                                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sanskrit preview */}
                                            {s.sanskrit && (
                                                <div className="mt-3 font-devanagari text-sm text-gray-600 dark:text-gray-300 line-clamp-2 bg-amber-50/40 dark:bg-amber-900/10 rounded-xl px-3 py-2 leading-relaxed">
                                                    {s.sanskrit.slice(0, 120)}
                                                    {s.sanskrit.length > 120 && '...'}
                                                </div>
                                            )}

                                            {/* Metadata row */}
                                            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 gap-1">
                                                <span className="flex items-center gap-1">
                                                    <Hash className="h-3.5 w-3.5" /> Order: #{s.order || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="h-3.5 w-3.5" /> {(s.views || 0).toLocaleString()}
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {s.kannada && <span className="text-purple-600 font-medium">ಕ</span>}
                                                    {s.marathi && <span className="text-green-600 font-medium">म</span>}
                                                    {s.tamil && <span className="text-red-600 font-medium">த</span>}
                                                    {s.hindi && <span className="text-blue-600 font-medium">ह</span>}
                                                    {s.english && <span className="text-gray-600 font-medium">EN</span>}
                                                </div>
                                            </div>

                                            {/* Explore action */}
                                            <div className="mt-3 flex justify-end">
                                                <span className="text-amber-600 text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                                                    View <ArrowRight className="h-3.5 w-3.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Modal Form – unchanged */}
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
                                            {editingShotram ? 'Edit Shotram' : 'Add New Shotram'}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fill in all required fields</p>
                                    </div>
                                    <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    {/* ─── Form fields (unchanged) ─── */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                                Shotram Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Vishnu Sahasranama"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
                                                required
                                            >
                                                <option value="">-- Select Category --</option>
                                                {categoriesList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                            {categoriesList.length === 0 && (
                                                <p className="text-red-500 text-xs mt-1">No categories found. Create one first.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Display Order</label>
                                        <input
                                            type="number"
                                            value={formData.order}
                                            onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
                                            placeholder="0"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                            <Languages className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
                                            Sanskrit Text <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.sanskrit}
                                            onChange={e => setFormData({ ...formData, sanskrit: e.target.value })}
                                            rows={5}
                                            placeholder="संस्कृत पाठ यहाँ लिखें..."
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition font-devanagari text-lg"
                                            required
                                        />
                                    </div>

                                    <div className="border border-amber-200 dark:border-amber-800/50 rounded-xl p-5 bg-amber-50/30 dark:bg-amber-900/10">
                                        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                                            <Languages className="h-4 w-4" /> Required Translations
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ಕನ್ನಡ (Kannada) <span className="text-red-500">*</span></label>
                                                <textarea required rows={4} value={formData.kannada} onChange={e => setFormData({ ...formData, kannada: e.target.value })} placeholder="Kannada translation..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">मराठी (Marathi) <span className="text-red-500">*</span></label>
                                                <textarea required rows={4} value={formData.marathi} onChange={e => setFormData({ ...formData, marathi: e.target.value })} placeholder="Marathi translation..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">తెలుగు (Telugu) <span className="text-red-500">*</span></label>
                                                <textarea required rows={4} value={formData.tamil} onChange={e => setFormData({ ...formData, tamil: e.target.value })} placeholder="Telugu translation..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">हिन्दी (Hindi) - Optional</label>
                                            <textarea rows={3} value={formData.hindi} onChange={e => setFormData({ ...formData, hindi: e.target.value })} placeholder="Hindi translation..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">English Translation - Optional</label>
                                            <textarea rows={3} value={formData.english} onChange={e => setFormData({ ...formData, english: e.target.value })} placeholder="English translation..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Meaning / अर्थ - Optional</label>
                                            <textarea rows={3} value={formData.meaning} onChange={e => setFormData({ ...formData, meaning: e.target.value })} placeholder="Deep meaning and explanation..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition" />
                                        </div>
                                       
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
                                            disabled={loading}
                                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                        >
                                            {loading ? 'Saving...' : (editingShotram ? 'Update Shotram' : 'Create Shotram')}
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

export default ManageShotrams;
