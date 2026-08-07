import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    School, Lock, User, ShieldCheck, GraduationCap, 
    UserCheck, ArrowRight, Sparkles, KeyRound, Mail, 
    X, CheckCircle2, ArrowLeft, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import API from '../services/api';
import Toast from '../components/Toast';

const LoginPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'Student');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Forgot Password State
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: request, 2: verify, 3: reset
    const [forgotUserId, setForgotUserId] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
    const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [devOtpNotice, setDevOtpNotice] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Auto-fill demo credentials on role change for easy testing
    useEffect(() => {
        if (selectedRole === 'Officer') {
            setUserId('OFFICER01');
            setPassword('OFFICER01');
        } else if (selectedRole === 'Teacher') {
            setUserId('RAHULT01');
            setPassword('RAHULT01');
        } else {
            setUserId('SOURAV849');
            setPassword('SOURAV849');
        }
    }, [selectedRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId.trim() || !password.trim()) {
            setToast({ type: 'error', message: 'Please enter User ID and Password' });
            return;
        }

        setLoading(true);
        const result = await login(userId.trim(), password.trim());
        setLoading(false);

        if (result.success) {
            if (result.user.firstLogin) {
                navigate('/change-password');
            } else {
                if (result.user.role === 'Officer') navigate('/officer/dashboard');
                else if (result.user.role === 'Teacher') navigate('/teacher/dashboard');
                else navigate('/student/dashboard');
            }
        } else {
            setToast({ type: 'error', message: result.message });
        }
    };

    // Forgot Password Flow Handlers
    const openForgotModal = () => {
        setForgotUserId(userId.trim() || '');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotMaskedEmail('');
        setDevOtpNotice('');
        setForgotStep(1);
        setIsForgotModalOpen(true);
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        if (!forgotUserId.trim()) {
            setToast({ type: 'error', message: 'Please enter your User ID' });
            return;
        }

        setForgotLoading(true);
        try {
            const res = await API.post('/auth/forgot-password/request-otp', { userId: forgotUserId.trim() });
            if (res.data.success) {
                setForgotMaskedEmail(res.data.maskedEmail);
                setDevOtpNotice(res.data.devOtp || '');
                setForgotStep(2);
                setToast({ type: 'success', message: res.data.message });
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to send OTP' });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const cleanOtp = forgotOtp.replace(/\s+/g, '').trim();
        if (!cleanOtp || cleanOtp.length !== 6) {
            setToast({ type: 'error', message: 'Please enter a valid 6-digit OTP code' });
            return;
        }

        setForgotLoading(true);
        try {
            const res = await API.post('/auth/forgot-password/verify-otp', {
                userId: forgotUserId.trim(),
                otp: cleanOtp
            });
            if (res.data.success) {
                setForgotStep(3);
                setToast({ type: 'success', message: 'OTP verified! Set your new password.' });
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Invalid or expired OTP' });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!forgotNewPassword || forgotNewPassword.length < 4) {
            setToast({ type: 'error', message: 'Password must be at least 4 characters long' });
            return;
        }
        if (forgotNewPassword !== forgotConfirmPassword) {
            setToast({ type: 'error', message: 'Passwords do not match' });
            return;
        }

        setForgotLoading(true);
        try {
            const cleanOtp = forgotOtp.replace(/\s+/g, '').trim();
            const res = await API.post('/auth/forgot-password/reset-password', {
                userId: forgotUserId.trim(),
                otp: cleanOtp,
                newPassword: forgotNewPassword.trim()
            });
            if (res.data.success) {
                setToast({ type: 'success', message: res.data.message });
                setUserId(forgotUserId.trim());
                setPassword(forgotNewPassword.trim());
                setIsForgotModalOpen(false);
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to reset password' });
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 p-4 relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
                
                {/* Header */}
                <div className="text-center space-y-2">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <School className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-base sm:text-lg font-extrabold text-white tracking-tight text-center">MAJURIA BAISPATRA S.M HIGH SCHOOL</span>
                    </Link>
                    <h2 className="text-2xl font-bold text-white">Portal Sign In</h2>
                    <p className="text-xs text-slate-400">Select your role and enter credentials to continue</p>
                </div>

                {/* Role Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <button
                        type="button"
                        onClick={() => setSelectedRole('Student')}
                        className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl font-bold text-xs transition ${
                            selectedRole === 'Student'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        <span>Student</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedRole('Teacher')}
                        className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl font-bold text-xs transition ${
                            selectedRole === 'Teacher'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        <span>Teacher</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedRole('Officer')}
                        className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl font-bold text-xs transition ${
                            selectedRole === 'Officer'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Officer</span>
                    </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            User ID
                        </label>
                        <div className="relative">
                            <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="text"
                                required
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="e.g. SOURAV849"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm uppercase tracking-wide"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={openForgotModal}
                                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition flex items-center space-x-1"
                            >
                                <KeyRound className="w-3 h-3" />
                                <span>Forgot Password?</span>
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition transform active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}</span>
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                {/* Preset Credentials Hint Box */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <div className="font-semibold text-slate-300 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Demo Account Seed Credentials:</span>
                    </div>
                    <div>• Officer: <code className="text-purple-300 font-mono">OFFICER01</code></div>
                    <div>• Teacher: <code className="text-emerald-300 font-mono">RAHULT01</code></div>
                    <div>• Student: <code className="text-blue-300 font-mono">SOURAV849</code></div>
                </div>

                <div className="text-center pt-2">
                    <Link to="/" className="text-xs text-slate-400 hover:text-white transition">
                        ← Back to School Landing Page
                    </Link>
                </div>

            </div>

            {/* Forgot Password OTP Modal */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
                        
                        <button
                            onClick={() => setIsForgotModalOpen(false)}
                            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center shadow-inner">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Reset Password via Gmail OTP</h3>
                            <p className="text-xs text-slate-400">
                                {forgotStep === 1 && "Enter your User ID to send a 6-digit OTP code to your assigned Gmail"}
                                {forgotStep === 2 && `Enter the OTP sent to ${forgotMaskedEmail}`}
                                {forgotStep === 3 && "Create a new strong password for your account"}
                            </p>
                        </div>

                        {/* Step indicator */}
                        <div className="flex items-center justify-center space-x-2 text-xs">
                            <span className={`px-2.5 py-1 rounded-full font-bold ${forgotStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1. User ID</span>
                            <span className="text-slate-600">→</span>
                            <span className={`px-2.5 py-1 rounded-full font-bold ${forgotStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2. Gmail OTP</span>
                            <span className="text-slate-600">→</span>
                            <span className={`px-2.5 py-1 rounded-full font-bold ${forgotStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3. Reset</span>
                        </div>

                        {/* STEP 1: REQUEST OTP */}
                        {forgotStep === 1 && (
                            <form onSubmit={handleRequestOTP} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                        Your User ID
                                    </label>
                                    <div className="relative">
                                        <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                                        <input
                                            type="text"
                                            required
                                            value={forgotUserId}
                                            onChange={(e) => setForgotUserId(e.target.value)}
                                            placeholder="e.g. SOURAV849 or RAHULT01"
                                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm uppercase"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span>{forgotLoading ? 'Sending OTP to Gmail...' : 'Send OTP Code to Gmail'}</span>
                                </button>
                            </form>
                        )}

                        {/* STEP 2: VERIFY OTP */}
                        {forgotStep === 2 && (
                            <form onSubmit={handleVerifyOTP} className="space-y-4">
                                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-center space-x-2">
                                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span>OTP code has been sent to <strong className="font-mono text-white">{forgotMaskedEmail}</strong></span>
                                </div>

                                {devOtpNotice && (
                                    <div
                                        onClick={() => setForgotOtp(devOtpNotice)}
                                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1 cursor-pointer hover:bg-amber-500/20 transition group"
                                        title="Click to auto-fill OTP"
                                    >
                                        <div className="font-bold flex items-center justify-between text-amber-400">
                                            <span>🔑 Dev Test Mode Active</span>
                                            <span className="text-[10px] bg-amber-500/20 group-hover:bg-amber-500/30 px-2 py-0.5 rounded text-amber-300 transition">Click to Autofill</span>
                                        </div>
                                        <p>Your OTP Code: <strong className="font-mono text-base text-amber-300 tracking-widest">{devOtpNotice}</strong></p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                        Enter 6-Digit OTP Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        required
                                        value={forgotOtp}
                                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-center font-mono text-2xl tracking-[8px] placeholder-slate-600 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{forgotLoading ? 'Verifying...' : 'Verify OTP Code'}</span>
                                </button>

                                <div className="flex items-center justify-between text-xs pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setForgotStep(1)}
                                        className="text-slate-400 hover:text-white transition flex items-center space-x-1"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        <span>Change User ID</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleRequestOTP}
                                        className="text-blue-400 hover:text-blue-300 font-medium transition flex items-center space-x-1"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Resend OTP</span>
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* STEP 3: NEW PASSWORD */}
                        {forgotStep === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={forgotNewPassword}
                                            onChange={(e) => setForgotNewPassword(e.target.value)}
                                            placeholder="At least 6 characters"
                                            className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={forgotConfirmPassword}
                                            onChange={(e) => setForgotConfirmPassword(e.target.value)}
                                            placeholder="Re-enter new password"
                                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    <span>{forgotLoading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                                </button>
                            </form>
                        )}

                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
};

export default LoginPage;
