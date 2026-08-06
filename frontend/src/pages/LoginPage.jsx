import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, Lock, User, ShieldCheck, GraduationCap, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
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
                        <span className="text-xl font-extrabold text-white tracking-tight">GREENWOOD HIGH</span>
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
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Password
                        </label>
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

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
};

export default LoginPage;
