import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ShieldAlert, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import API from '../services/api';
import Toast from '../components/Toast';

const ForceChangePasswordPage = () => {
    const { user, setUser, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            setToast({ type: 'error', message: 'New password must be at least 6 characters long' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setToast({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            const res = await API.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            if (res.data.success) {
                setToast({ type: 'success', message: 'Password updated! Redirecting to dashboard...' });
                
                // Update local storage token & profile
                if (res.data.accessToken) {
                    localStorage.setItem('school_token', res.data.accessToken);
                }
                
                await refreshProfile();

                setTimeout(() => {
                    if (user?.role === 'Officer') navigate('/officer/dashboard');
                    else if (user?.role === 'Teacher') navigate('/teacher/dashboard');
                    else navigate('/student/dashboard');
                }, 1200);
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                        <ShieldAlert className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">First Login Password Reset</h2>
                    <p className="text-xs text-slate-400">
                        For security reasons, you must change your default password before accessing your dashboard.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!user?.firstLogin && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition transform active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <KeyRound className="w-4 h-4" />
                        <span>{loading ? 'Updating Password...' : 'Save & Enter Dashboard'}</span>
                    </button>
                </form>

            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ForceChangePasswordPage;
