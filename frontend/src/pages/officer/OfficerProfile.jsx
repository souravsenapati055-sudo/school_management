import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import Toast from '../../components/Toast';
import { 
    User, Mail, Phone, ShieldCheck, KeyRound, 
    Save, CheckCircle2, AlertCircle, Sparkles, Building
} from 'lucide-react';

const OfficerProfile = () => {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Profile form state
    const [name, setName] = useState('');
    const [newUserId, setNewUserId] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [designation, setDesignation] = useState('Administrator');

    // Security password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get('/officers/profile');
                if (res.data.success && res.data.officer) {
                    const off = res.data.officer;
                    setName(off.name || '');
                    setNewUserId(off.user_id || '');
                    setEmail(off.email || '');
                    setMobile(off.mobile || '');
                    setDesignation(off.designation || 'Administrator');
                }
            } catch (err) {
                console.error('Failed to load officer profile:', err);
                setToast({ type: 'error', message: 'Failed to load profile details' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setToast({ type: 'error', message: 'Officer Name is required' });
            return;
        }

        if (!newUserId.trim()) {
            setToast({ type: 'error', message: 'User ID is required' });
            return;
        }

        if (newPassword) {
            if (!currentPassword) {
                setToast({ type: 'error', message: 'Please enter your Current Password to set a new password' });
                return;
            }
            if (newPassword.length < 4) {
                setToast({ type: 'error', message: 'New password must be at least 4 characters long' });
                return;
            }
            if (newPassword !== confirmPassword) {
                setToast({ type: 'error', message: 'New Password and Confirm Password do not match' });
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                newUserId: newUserId.trim(),
                email: email.trim(),
                mobile: mobile.trim(),
                designation: designation.trim(),
                currentPassword: currentPassword ? currentPassword.trim() : undefined,
                newPassword: newPassword ? newPassword.trim() : undefined
            };

            const res = await API.put('/officers/profile', payload);

            if (res.data.success) {
                setToast({ type: 'success', message: res.data.message || 'Profile & Security settings updated!' });
                
                // If token or user updated, refresh local AuthContext
                if (res.data.token && res.data.user) {
                    login(res.data.user, res.data.token);
                }

                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            console.error('Update officer profile error:', err);
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {toast && (
                <Toast 
                    type={toast.type} 
                    message={toast.message} 
                    onClose={() => setToast(null)} 
                />
            )}

            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-medium backdrop-blur-sm">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Administrator Control Center</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Officer Profile & Security Settings
                        </h1>
                        <p className="text-sm text-blue-100/90 max-w-xl">
                            Manage your admin display name, login User ID, password reset Gmail address, and security credentials.
                        </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shrink-0">
                        <User className="w-9 h-9" />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Account Details Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6 shadow-sm space-y-5">
                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Account Info</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Personal details and identification</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Officer / Admin Full Name *
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Principal S. K. Sharma"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* User ID */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Login User ID * <span className="text-[11px] text-gray-400 font-normal">(Used to sign in)</span>
                            </label>
                            <div className="relative">
                                <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={newUserId} 
                                    onChange={(e) => setNewUserId(e.target.value)}
                                    placeholder="OFFICER01"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Designation */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Designation / Role Title
                            </label>
                            <div className="relative">
                                <Building className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={designation} 
                                    onChange={(e) => setDesignation(e.target.value)}
                                    placeholder="Headmaster / Admin"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Mobile */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={mobile} 
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder="9876543210"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* 2. Password Reset Email Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6 shadow-sm space-y-4">
                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Password Reset Gmail Address</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Where password recovery OTP codes will be delivered</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Admin Gmail / Email Address *
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="souravsenapati055@gmail.com"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                required
                            />
                        </div>
                        
                        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                            <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold">How OTP Reset Works:</strong> When you click <em>"Forgot Password?"</em> on the sign-in screen and enter your User ID, a 6-digit OTP security code will be sent directly to this Gmail address.
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Security Password Change */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6 shadow-sm space-y-4">
                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Change Admin Password</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Leave blank if you do not wish to change your password</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Current Password
                            </label>
                            <input 
                                type="password" 
                                value={currentPassword} 
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                New Password
                            </label>
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Confirm New Password
                            </label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Action Bar */}
                <div className="flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center space-x-2 transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <span>Saving Changes...</span>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save Officer Profile & Security Settings</span>
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default OfficerProfile;
