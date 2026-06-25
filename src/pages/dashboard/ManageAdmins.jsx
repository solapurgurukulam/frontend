import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Trash2, Shield, User, Mail, Phone, 
    CheckCircle, X, Users, Award, UserPlus, UserCheck, 
    Info, AlertCircle, Search, UserX
} from 'lucide-react';
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

const ManageAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    
    // Form states
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin',
    });
    
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        role: 'admin',
    });
    
    const [addExistingForm, setAddExistingForm] = useState({
        email: '',
        phone: '',
    });
    
    const [searchMethod, setSearchMethod] = useState('email');
    const [foundUser, setFoundUser] = useState(null);
    const [searching, setSearching] = useState(false);

    useEffect(() => { 
        fetchAdmins();
        // Get current user info from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUserRole(user.role);
        setCurrentUserId(user.id);
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/all');
            if (response.data.success) {
                setAdmins(response.data.data || []);
            } else {
                setAdmins([]);
            }
        } catch (error) {
            console.error('Fetch admins error:', error);
            toast.error('Failed to fetch admins');
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    };

    // Check if current user is Super Admin
    const isSuperAdmin = () => currentUserRole === 'super_admin';

    // Check if current user is the given admin
    const isCurrentUser = (adminId) => currentUserId === adminId;

    // Open Create New Admin Modal
    const handleOpenCreateModal = () => {
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can create new admins');
        }
        setCreateForm({ name: '', email: '', phone: '', password: '', role: 'admin' });
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', email: '', phone: '', password: '', role: 'admin' });
    };

    // Open Edit Admin Modal
    const handleOpenEditModal = (admin) => {
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can edit admins');
        }
        setEditingAdmin(admin);
        setEditForm({
            name: admin.name || '',
            phone: admin.phone || '',
            role: admin.role || 'admin',
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingAdmin(null);
        setEditForm({ name: '', phone: '', role: 'admin' });
    };

    // Open Add Existing User Modal
    const handleOpenAddExistingModal = (prefillEmail = '') => {
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can add existing users as admins');
        }
        setAddExistingForm({ email: prefillEmail || '', phone: '' });
        setSearchMethod('email');
        setFoundUser(null);
        setIsAddExistingModalOpen(true);
    };

    const handleCloseAddExistingModal = () => {
        setIsAddExistingModalOpen(false);
        setAddExistingForm({ email: '', phone: '' });
        setFoundUser(null);
    };

    // Search User by Email or Phone
    const handleSearchUser = async () => {
        if (!addExistingForm.email && !addExistingForm.phone) {
            return toast.error('Please enter email or phone to search');
        }

        setSearching(true);
        try {
            const params = new URLSearchParams();
            if (addExistingForm.email) params.append('email', addExistingForm.email.trim());
            if (addExistingForm.phone) params.append('phone', addExistingForm.phone.trim());

            const response = await apiClient.get(`/admin/search-user?${params.toString()}`);
            if (response.data.success) {
                setFoundUser(response.data.data);
                toast.success('User found successfully!');
                
                // Check if user is already an admin
                if (response.data.data.role === 'admin' || response.data.data.role === 'super_admin') {
                    toast.warning(`User is already an ${response.data.data.role}`);
                }
            }
        } catch (error) {
            setFoundUser(null);
            toast.error(error.response?.data?.message || 'User not found');
        } finally {
            setSearching(false);
        }
    };

    // CREATE NEW ADMIN (for new users)
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        
        if (!createForm.name.trim()) return toast.error('Name is required');
        if (!createForm.email.trim()) return toast.error('Email is required');
        if (!createForm.password || createForm.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            const payload = {
                name: createForm.name.trim(),
                email: createForm.email.trim(),
                phone: createForm.phone || '',
                password: createForm.password,
                role: createForm.role,
            };

            const response = await apiClient.post('/admin/create', payload);
            if (response.data.success) {
                toast.success(response.data.message || 'Admin created successfully');
                fetchAdmins();
                handleCloseCreateModal();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create admin';
            const statusCode = error.response?.status;
            
            if (statusCode === 400 || 
                errorMsg.toLowerCase().includes('already exists') || 
                errorMsg.toLowerCase().includes('duplicate') ||
                errorMsg.toLowerCase().includes('existing')) {
                
                toast.error(
                    (t) => (
                        <div className="max-w-xs">
                            <p className="font-semibold text-red-700">⚠️ User Already Exists!</p>
                            <p className="text-sm text-gray-600 mt-1">{errorMsg}</p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        handleCloseCreateModal();
                                        setTimeout(() => {
                                            handleOpenAddExistingModal(createForm.email);
                                        }, 100);
                                    }}
                                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
                                >
                                    Add as Existing User
                                </button>
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ),
                    { duration: 10000 }
                );
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    // UPDATE ADMIN
    const handleUpdateAdmin = async (e) => {
        e.preventDefault();
        
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can update admins');
        }
        
        if (!editForm.name.trim()) return toast.error('Name is required');

        setLoading(true);
        try {
            const payload = {
                name: editForm.name.trim(),
                phone: editForm.phone || '',
                role: editForm.role,
            };

            const response = await apiClient.put(`/admin/${editingAdmin._id}`, payload);
            if (response.data.success) {
                toast.success(response.data.message || 'Admin updated successfully');
                fetchAdmins();
                handleCloseEditModal();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update admin');
        } finally {
            setLoading(false);
        }
    };

    // ADD EXISTING USER AS ADMIN
    const handleAddExistingAdmin = async (e) => {
        e.preventDefault();
        
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can add existing users as admins');
        }
        
        if (!foundUser) {
            return toast.error('Please search and find the user first');
        }

        // Check if user is already an admin
        if (foundUser.role === 'admin' || foundUser.role === 'super_admin') {
            return toast.error(`User is already an ${foundUser.role}`);
        }

        if (foundUser.isBlocked) {
            return toast.error('Blocked users cannot be assigned as admin');
        }

        setLoading(true);
        try {
            const payload = {
                email: foundUser.email,
                phone: foundUser.phone || '',
                role: 'admin'
            };

            const response = await apiClient.post('/admin/create', payload);
            if (response.data.success) {
                toast.success(response.data.message || 'User promoted to Admin successfully');
                fetchAdmins();
                handleCloseAddExistingModal();
                setFoundUser(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add admin');
        } finally {
            setLoading(false);
        }
    };

    // DELETE ADMIN (Demote to user)
    const handleDeleteAdmin = async (admin) => {
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can delete admins');
        }
        
        if (isCurrentUser(admin._id)) {
            return toast.error('You cannot delete your own account');
        }
        
        if (admin.role === 'super_admin') {
            const superAdminCount = admins.filter(a => a.role === 'super_admin').length;
            if (superAdminCount === 1) {
                return toast.error('Cannot delete the only Super Admin');
            }
        }
        
        if (!window.confirm(`Are you sure you want to demote ${admin.name} to regular user?`)) return;

        setLoading(true);
        try {
            const response = await apiClient.delete(`/admin/${admin._id}`);
            if (response.data.success) {
                toast.success(response.data.message || 'Admin demoted to regular user successfully');
                fetchAdmins();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to demote admin');
        } finally {
            setLoading(false);
        }
    };

    if (loading && admins.length === 0) return <Loader />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium mb-3">
                            <Shield className="h-3.5 w-3.5" />
                            Admin Management
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manage Administrators</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Total {admins.length} admin {admins.length === 1 ? 'user' : 'users'}
                            {currentUserRole === 'super_admin' && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    Super Admin
                                </span>
                            )}
                        </p>
                    </div>
                    {isSuperAdmin() && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleOpenAddExistingModal}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                            >
                                <UserPlus className="h-5 w-5" />
                                Add Existing User
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                            >
                                <Plus className="h-5 w-5" />
                                Create New Admin
                            </button>
                        </div>
                    )}
                </div>

                {/* Admin Cards Grid */}
                {admins.length === 0 ? (
                    <div className="text-center py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-amber-200/40">
                        <Users className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No admins found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {admins.map((admin, idx) => {
                            const isSuperAdminUser = admin.role === 'super_admin';
                            const isSelf = isCurrentUser(admin._id);

                            return (
                                <motion.div
                                    key={admin._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-md border border-amber-200/40 overflow-hidden transition-all duration-300">
                                        <div className={`h-1.5 w-full ${
                                            isSuperAdminUser ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 
                                            'bg-gradient-to-r from-amber-400 to-amber-600'
                                        }`} />

                                        {isSelf && (
                                            <div className="absolute top-4 left-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                                    <User className="h-3 w-3" /> You
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-5">
                                            <div className="flex items-center justify-center mb-4">
                                                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${
                                                    isSuperAdminUser ? 'from-purple-100 to-purple-200' : 
                                                    'from-amber-100 to-amber-200'
                                                } flex items-center justify-center shadow-inner`}>
                                                    <User className={`h-10 w-10 ${
                                                        isSuperAdminUser ? 'text-purple-700' : 
                                                        'text-amber-700'
                                                    }`} />
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
                                                {admin.name}
                                            </h3>
                                            <div className="text-center mb-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                                                    isSuperAdminUser ? 'bg-purple-100 text-purple-700' : 
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    <Shield className="h-3 w-3" />
                                                    {isSuperAdminUser ? 'Super Admin' : 'Admin'}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Mail className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                    <span className="truncate">{admin.email}</span>
                                                </div>
                                                {admin.phone && (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <Phone className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                        <span>{admin.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons - Only Super Admin can perform actions */}
                                            {isSuperAdmin() && (
                                                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <button
                                                        onClick={() => handleOpenEditModal(admin)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                                                    >
                                                        <Edit className="h-4 w-4" /> Edit
                                                    </button>
                                                    
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleDeleteAdmin(admin)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm font-medium"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Demote
                                                        </button>
                                                    )}
                                                    {isSelf && (
                                                        <div className="w-full text-center text-xs text-gray-400 py-1">
                                                            Cannot demote your own account
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Non-Super Admin view - no action buttons */}
                                            {!isSuperAdmin() && (
                                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-400 text-center">
                                                        <Shield className="h-3 w-3 inline mr-1" />
                                                        Contact Super Admin for changes
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* MODAL 1: Create New Admin */}
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-amber-200/50 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        <UserPlus className="h-5 w-5 inline mr-2 text-amber-500" />
                                        Create New Admin
                                    </h2>
                                    <button onClick={handleCloseCreateModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateAdmin} className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={createForm.name}
                                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={createForm.email}
                                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={createForm.phone}
                                            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={createForm.password}
                                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                            minLength={6}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                        <select
                                            value={createForm.role}
                                            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            type="button"
                                            onClick={handleCloseCreateModal}
                                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Creating...' : 'Create Admin'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL 2: Edit Admin */}
                <AnimatePresence>
                    {isEditModalOpen && editingAdmin && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-amber-200/50 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        <Edit className="h-5 w-5 inline mr-2 text-amber-500" />
                                        Edit {editingAdmin.name}
                                    </h2>
                                    <button onClick={handleCloseEditModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdateAdmin} className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={editingAdmin.email}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            disabled={editingAdmin.role === 'super_admin'}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                        {editingAdmin.role === 'super_admin' && (
                                            <p className="text-xs text-gray-400 mt-1">Super Admin role cannot be changed</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            type="button"
                                            onClick={handleCloseEditModal}
                                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Updating...' : 'Update Admin'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL 3: Add Existing User as Admin - EMPTY PLACEHOLDER */}
                <AnimatePresence>
                    {isAddExistingModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-green-200/50 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        <UserCheck className="h-5 w-5 inline mr-2 text-green-500" />
                                        Add Existing User as Admin
                                    </h2>
                                    <button onClick={handleCloseAddExistingModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="p-5">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl mb-4">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>Find an existing user by email or phone to promote them as admin</span>
                                        </p>
                                    </div>

                                    <form onSubmit={handleAddExistingAdmin} className="space-y-4">
                                        {/* Search Section */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Search by
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchMethod('email');
                                                        setAddExistingForm({ email: '', phone: '' });
                                                        setFoundUser(null);
                                                    }}
                                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                                        searchMethod === 'email'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <Mail className="h-4 w-4 inline mr-1" />
                                                    Email
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchMethod('phone');
                                                        setAddExistingForm({ email: '', phone: '' });
                                                        setFoundUser(null);
                                                    }}
                                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                                        searchMethod === 'phone'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <Phone className="h-4 w-4 inline mr-1" />
                                                    Phone
                                                </button>
                                            </div>
                                        </div>

                                        {/* Email Input - EMPTY PLACEHOLDER */}
                                        {searchMethod === 'email' ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        value={addExistingForm.email}
                                                        onChange={(e) => setAddExistingForm({ 
                                                            ...addExistingForm, 
                                                            email: e.target.value, 
                                                            phone: '' 
                                                        })}
                                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        placeholder=""
                                                        required={searchMethod === 'email'}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleSearchUser}
                                                        disabled={searching}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                                                    >
                                                        {searching ? '...' : <Search className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Phone Number <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="tel"
                                                        value={addExistingForm.phone}
                                                        onChange={(e) => setAddExistingForm({ 
                                                            ...addExistingForm, 
                                                            phone: e.target.value, 
                                                            email: '' 
                                                        })}
                                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        placeholder=""
                                                        required={searchMethod === 'phone'}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleSearchUser}
                                                        disabled={searching}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                                                    >
                                                        {searching ? '...' : <Search className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Found User Details */}
                                        {foundUser && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {foundUser.name}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {foundUser.email}
                                                            </p>
                                                            {foundUser.phone && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {foundUser.phone}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {(foundUser.role === 'admin' || foundUser.role === 'super_admin') && (
                                                            <span className="block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full mb-1">
                                                                Already {foundUser.role}
                                                            </span>
                                                        )}
                                                        {foundUser.isBlocked && (
                                                            <span className="block mt-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                                                🚫 Blocked
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {(foundUser.role === 'admin' || foundUser.role === 'super_admin') && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                        <p className="text-sm text-purple-600 dark:text-purple-400 text-center">
                                                            This user is already an {foundUser.role}
                                                        </p>
                                                    </div>
                                                )}

                                                {foundUser.isBlocked && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                                            This user is blocked and cannot be promoted
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Note */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                                <span>
                                                    <strong>Note:</strong> User must already be <strong>registered</strong> before they can be promoted to Admin. No verification required.
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={handleCloseAddExistingModal}
                                                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !foundUser || foundUser.isBlocked || foundUser.role === 'admin' || foundUser.role === 'super_admin'}
                                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Processing...' : 'Add as Admin'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManageAdmins;import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Trash2, Shield, User, Mail, Phone, 
    CheckCircle, X, Users, Award, UserPlus, UserCheck, 
    Info, AlertCircle, Search, UserX
} from 'lucide-react';
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

const ManageAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    
    // Form states
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin',
    });
    
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        role: 'admin',
    });
    
    const [addExistingForm, setAddExistingForm] = useState({
        email: '',
        phone: '',
    });
    
    const [searchMethod, setSearchMethod] = useState('email');
    const [foundUser, setFoundUser] = useState(null);
    const [searching, setSearching] = useState(false);

    useEffect(() => { 
        fetchAdmins();
        // Get current user info from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUserRole(user.role);
        setCurrentUserId(user.id);
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/all');
            if (response.data.success) {
                setAdmins(response.data.data || []);
            } else {
                setAdmins([]);
            }
        } catch (error) {
            console.error('Fetch admins error:', error);
            toast.error('Failed to fetch admins');
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    };

    // Check if current user is Super Admin
    const isSuperAdmin = () => currentUserRole === 'super_admin';

    // Check if current user is the given admin
    const isCurrentUser = (adminId) => currentUserId === adminId;

    // Open Create New Admin Modal
    const handleOpenCreateModal = () => {
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can create new admins');
        }
        setCreateForm({ name: '', email: '', phone: '', password: '', role: 'admin' });
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', email: '', phone: '', password: '', role: 'admin' });
    };

    // Open Edit Admin Modal
    const handleOpenEditModal = (admin) => {
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can edit admins');
        }
        setEditingAdmin(admin);
        setEditForm({
            name: admin.name || '',
            phone: admin.phone || '',
            role: admin.role || 'admin',
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingAdmin(null);
        setEditForm({ name: '', phone: '', role: 'admin' });
    };

    // Open Add Existing User Modal
    const handleOpenAddExistingModal = (prefillEmail = '') => {
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can add existing users as admins');
        }
        setAddExistingForm({ email: prefillEmail || '', phone: '' });
        setSearchMethod('email');
        setFoundUser(null);
        setIsAddExistingModalOpen(true);
    };

    const handleCloseAddExistingModal = () => {
        setIsAddExistingModalOpen(false);
        setAddExistingForm({ email: '', phone: '' });
        setFoundUser(null);
    };

    // Search User by Email or Phone
    const handleSearchUser = async () => {
        if (!addExistingForm.email && !addExistingForm.phone) {
            return toast.error('Please enter email or phone to search');
        }

        setSearching(true);
        try {
            const params = new URLSearchParams();
            if (addExistingForm.email) params.append('email', addExistingForm.email.trim());
            if (addExistingForm.phone) params.append('phone', addExistingForm.phone.trim());

            const response = await apiClient.get(`/admin/search-user?${params.toString()}`);
            if (response.data.success) {
                setFoundUser(response.data.data);
                toast.success('User found successfully!');
                
                // Check if user is already an admin
                if (response.data.data.role === 'admin' || response.data.data.role === 'super_admin') {
                    toast.warning(`User is already an ${response.data.data.role}`);
                }
            }
        } catch (error) {
            setFoundUser(null);
            toast.error(error.response?.data?.message || 'User not found');
        } finally {
            setSearching(false);
        }
    };

    // CREATE NEW ADMIN (for new users)
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        
        if (!createForm.name.trim()) return toast.error('Name is required');
        if (!createForm.email.trim()) return toast.error('Email is required');
        if (!createForm.password || createForm.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            const payload = {
                name: createForm.name.trim(),
                email: createForm.email.trim(),
                phone: createForm.phone || '',
                password: createForm.password,
                role: createForm.role,
            };

            const response = await apiClient.post('/admin/create', payload);
            if (response.data.success) {
                toast.success(response.data.message || 'Admin created successfully');
                fetchAdmins();
                handleCloseCreateModal();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create admin';
            const statusCode = error.response?.status;
            
            if (statusCode === 400 || 
                errorMsg.toLowerCase().includes('already exists') || 
                errorMsg.toLowerCase().includes('duplicate') ||
                errorMsg.toLowerCase().includes('existing')) {
                
                toast.error(
                    (t) => (
                        <div className="max-w-xs">
                            <p className="font-semibold text-red-700">⚠️ User Already Exists!</p>
                            <p className="text-sm text-gray-600 mt-1">{errorMsg}</p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        handleCloseCreateModal();
                                        setTimeout(() => {
                                            handleOpenAddExistingModal(createForm.email);
                                        }, 100);
                                    }}
                                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
                                >
                                    Add as Existing User
                                </button>
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ),
                    { duration: 10000 }
                );
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    // UPDATE ADMIN
    const handleUpdateAdmin = async (e) => {
        e.preventDefault();
        
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can update admins');
        }
        
        if (!editForm.name.trim()) return toast.error('Name is required');

        setLoading(true);
        try {
            const payload = {
                name: editForm.name.trim(),
                phone: editForm.phone || '',
                role: editForm.role,
            };

            const response = await apiClient.put(`/admin/${editingAdmin._id}`, payload);
            if (response.data.success) {
                toast.success(response.data.message || 'Admin updated successfully');
                fetchAdmins();
                handleCloseEditModal();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update admin');
        } finally {
            setLoading(false);
        }
    };

    // ADD EXISTING USER AS ADMIN
    const handleAddExistingAdmin = async (e) => {
        e.preventDefault();
        
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can add existing users as admins');
        }
        
        if (!foundUser) {
            return toast.error('Please search and find the user first');
        }

        // Check if user is already an admin
        if (foundUser.role === 'admin' || foundUser.role === 'super_admin') {
            return toast.error(`User is already an ${foundUser.role}`);
        }

        if (foundUser.isBlocked) {
            return toast.error('Blocked users cannot be assigned as admin');
        }

        setLoading(true);
        try {
            const payload = {
                email: foundUser.email,
                phone: foundUser.phone || '',
                role: 'admin'
            };

            const response = await apiClient.post('/admin/create', payload);
            if (response.data.success) {
                toast.success(response.data.message || 'User promoted to Admin successfully');
                fetchAdmins();
                handleCloseAddExistingModal();
                setFoundUser(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add admin');
        } finally {
            setLoading(false);
        }
    };

    // DELETE ADMIN (Demote to user)
    const handleDeleteAdmin = async (admin) => {
        if (!isSuperAdmin()) {
            return toast.error('Only Super Admin can delete admins');
        }
        
        if (isCurrentUser(admin._id)) {
            return toast.error('You cannot delete your own account');
        }
        
        if (admin.role === 'super_admin') {
            const superAdminCount = admins.filter(a => a.role === 'super_admin').length;
            if (superAdminCount === 1) {
                return toast.error('Cannot delete the only Super Admin');
            }
        }
        
        if (!window.confirm(`Are you sure you want to demote ${admin.name} to regular user?`)) return;

        setLoading(true);
        try {
            const response = await apiClient.delete(`/admin/${admin._id}`);
            if (response.data.success) {
                toast.success(response.data.message || 'Admin demoted to regular user successfully');
                fetchAdmins();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to demote admin');
        } finally {
            setLoading(false);
        }
    };

    if (loading && admins.length === 0) return <Loader />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium mb-3">
                            <Shield className="h-3.5 w-3.5" />
                            Admin Management
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manage Administrators</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Total {admins.length} admin {admins.length === 1 ? 'user' : 'users'}
                            {currentUserRole === 'super_admin' && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    Super Admin
                                </span>
                            )}
                        </p>
                    </div>
                    {isSuperAdmin() && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleOpenAddExistingModal}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                            >
                                <UserPlus className="h-5 w-5" />
                                Add Existing User
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                            >
                                <Plus className="h-5 w-5" />
                                Create New Admin
                            </button>
                        </div>
                    )}
                </div>

                {/* Admin Cards Grid */}
                {admins.length === 0 ? (
                    <div className="text-center py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-amber-200/40">
                        <Users className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No admins found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {admins.map((admin, idx) => {
                            const isSuperAdminUser = admin.role === 'super_admin';
                            const isSelf = isCurrentUser(admin._id);

                            return (
                                <motion.div
                                    key={admin._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-md border border-amber-200/40 overflow-hidden transition-all duration-300">
                                        <div className={`h-1.5 w-full ${
                                            isSuperAdminUser ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 
                                            'bg-gradient-to-r from-amber-400 to-amber-600'
                                        }`} />

                                        {isSelf && (
                                            <div className="absolute top-4 left-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                                    <User className="h-3 w-3" /> You
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-5">
                                            <div className="flex items-center justify-center mb-4">
                                                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${
                                                    isSuperAdminUser ? 'from-purple-100 to-purple-200' : 
                                                    'from-amber-100 to-amber-200'
                                                } flex items-center justify-center shadow-inner`}>
                                                    <User className={`h-10 w-10 ${
                                                        isSuperAdminUser ? 'text-purple-700' : 
                                                        'text-amber-700'
                                                    }`} />
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
                                                {admin.name}
                                            </h3>
                                            <div className="text-center mb-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                                                    isSuperAdminUser ? 'bg-purple-100 text-purple-700' : 
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    <Shield className="h-3 w-3" />
                                                    {isSuperAdminUser ? 'Super Admin' : 'Admin'}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Mail className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                    <span className="truncate">{admin.email}</span>
                                                </div>
                                                {admin.phone && (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <Phone className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                        <span>{admin.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons - Only Super Admin can perform actions */}
                                            {isSuperAdmin() && (
                                                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <button
                                                        onClick={() => handleOpenEditModal(admin)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                                                    >
                                                        <Edit className="h-4 w-4" /> Edit
                                                    </button>
                                                    
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleDeleteAdmin(admin)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm font-medium"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Demote
                                                        </button>
                                                    )}
                                                    {isSelf && (
                                                        <div className="w-full text-center text-xs text-gray-400 py-1">
                                                            Cannot demote your own account
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Non-Super Admin view - no action buttons */}
                                            {!isSuperAdmin() && (
                                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-400 text-center">
                                                        <Shield className="h-3 w-3 inline mr-1" />
                                                        Contact Super Admin for changes
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* MODAL 1: Create New Admin */}
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-amber-200/50 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        <UserPlus className="h-5 w-5 inline mr-2 text-amber-500" />
                                        Create New Admin
                                    </h2>
                                    <button onClick={handleCloseCreateModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateAdmin} className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={createForm.name}
                                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={createForm.email}
                                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={createForm.phone}
                                            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={createForm.password}
                                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                            minLength={6}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                        <select
                                            value={createForm.role}
                                            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            type="button"
                                            onClick={handleCloseCreateModal}
                                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Creating...' : 'Create Admin'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL 2: Edit Admin */}
                <AnimatePresence>
                    {isEditModalOpen && editingAdmin && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-amber-200/50 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        <Edit className="h-5 w-5 inline mr-2 text-amber-500" />
                                        Edit {editingAdmin.name}
                                    </h2>
                                    <button onClick={handleCloseEditModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdateAdmin} className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={editingAdmin.email}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder=""
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            disabled={editingAdmin.role === 'super_admin'}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                        {editingAdmin.role === 'super_admin' && (
                                            <p className="text-xs text-gray-400 mt-1">Super Admin role cannot be changed</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            type="button"
                                            onClick={handleCloseEditModal}
                                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Updating...' : 'Update Admin'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL 3: Add Existing User as Admin - EMPTY PLACEHOLDER */}
                <AnimatePresence>
                    {isAddExistingModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-green-200/50 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        <UserCheck className="h-5 w-5 inline mr-2 text-green-500" />
                                        Add Existing User as Admin
                                    </h2>
                                    <button onClick={handleCloseAddExistingModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="p-5">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl mb-4">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>Find an existing user by email or phone to promote them as admin</span>
                                        </p>
                                    </div>

                                    <form onSubmit={handleAddExistingAdmin} className="space-y-4">
                                        {/* Search Section */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Search by
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchMethod('email');
                                                        setAddExistingForm({ email: '', phone: '' });
                                                        setFoundUser(null);
                                                    }}
                                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                                        searchMethod === 'email'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <Mail className="h-4 w-4 inline mr-1" />
                                                    Email
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchMethod('phone');
                                                        setAddExistingForm({ email: '', phone: '' });
                                                        setFoundUser(null);
                                                    }}
                                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                                        searchMethod === 'phone'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <Phone className="h-4 w-4 inline mr-1" />
                                                    Phone
                                                </button>
                                            </div>
                                        </div>

                                        {/* Email Input - EMPTY PLACEHOLDER */}
                                        {searchMethod === 'email' ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        value={addExistingForm.email}
                                                        onChange={(e) => setAddExistingForm({ 
                                                            ...addExistingForm, 
                                                            email: e.target.value, 
                                                            phone: '' 
                                                        })}
                                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        placeholder=""
                                                        required={searchMethod === 'email'}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleSearchUser}
                                                        disabled={searching}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                                                    >
                                                        {searching ? '...' : <Search className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Phone Number <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="tel"
                                                        value={addExistingForm.phone}
                                                        onChange={(e) => setAddExistingForm({ 
                                                            ...addExistingForm, 
                                                            phone: e.target.value, 
                                                            email: '' 
                                                        })}
                                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        placeholder=""
                                                        required={searchMethod === 'phone'}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleSearchUser}
                                                        disabled={searching}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                                                    >
                                                        {searching ? '...' : <Search className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Found User Details */}
                                        {foundUser && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {foundUser.name}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {foundUser.email}
                                                            </p>
                                                            {foundUser.phone && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {foundUser.phone}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {(foundUser.role === 'admin' || foundUser.role === 'super_admin') && (
                                                            <span className="block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full mb-1">
                                                                Already {foundUser.role}
                                                            </span>
                                                        )}
                                                        {foundUser.isBlocked && (
                                                            <span className="block mt-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                                                🚫 Blocked
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {(foundUser.role === 'admin' || foundUser.role === 'super_admin') && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                        <p className="text-sm text-purple-600 dark:text-purple-400 text-center">
                                                            This user is already an {foundUser.role}
                                                        </p>
                                                    </div>
                                                )}

                                                {foundUser.isBlocked && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                                            This user is blocked and cannot be promoted
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Note */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                                <span>
                                                    <strong>Note:</strong> User must already be <strong>registered</strong> before they can be promoted to Admin. No verification required.
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={handleCloseAddExistingModal}
                                                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !foundUser || foundUser.isBlocked || foundUser.role === 'admin' || foundUser.role === 'super_admin'}
                                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Processing...' : 'Add as Admin'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManageAdmins;