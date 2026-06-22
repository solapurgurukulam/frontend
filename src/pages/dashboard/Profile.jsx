import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { z } from 'zod';
import { User, Mail, Phone, Save, Sparkles, Calendar } from 'lucide-react'; // Camera removed
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { setUser } from '../../store/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

const Profile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(false);
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const yParallax = useSpring(useTransform(scrollYProgress, [0, 1], [0, 80]), { stiffness: 100, damping: 30 });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
        },
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await authApi.updateProfile(data);
            dispatch(setUser(response.data));
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 overflow-x-hidden">
            <section ref={heroRef} className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-amber-50/20 dark:from-indigo-950/20 dark:to-amber-950/10" />
                <div className="absolute top-20 right-0 w-72 h-72 bg-amber-300/20 dark:bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />

                <motion.div style={{ y: yParallax }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium mb-4">
                            <Sparkles className="h-3.5 w-3.5" />
                            Account Settings
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Profile Settings
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account information</p>
                    </div>
                </motion.div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-md border border-amber-200/40 p-6 text-center">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto overflow-hidden ring-4 ring-amber-200/50 dark:ring-amber-900/30">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl text-white font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-5">{user?.name}</h2>
                            <span className="inline-block mt-1 px-3 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full capitalize">
                                {user?.role}
                            </span>
                            <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-4">
                                <Calendar className="h-4 w-4" />
                                <span>Member since {new Date(user?.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-md border border-amber-200/40 p-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <Input
                                    label="Full Name"
                                    icon={User}
                                    {...register('name')}
                                    error={errors.name?.message}
                                    placeholder="Your full name"
                                    className="bg-white dark:bg-gray-700"
                                />
                                <Input
                                    label="Email Address"
                                    type="email"
                                    icon={Mail}
                                    {...register('email')}
                                    error={errors.email?.message}
                                    placeholder="you@example.com"
                                    disabled
                                    className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                />
                                <Input
                                    label="Phone Number"
                                    icon={Phone}
                                    {...register('phone')}
                                    error={errors.phone?.message}
                                    placeholder="+91 1234567890"
                                    className="bg-white dark:bg-gray-700"
                                />
                                <div className="flex justify-end pt-4">
                                    <Button 
                                        type="submit" 
                                        isLoading={isLoading} 
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Profile;