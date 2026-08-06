import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    School, GraduationCap, UserCheck, ShieldCheck, 
    Bell, MapPin, Phone, Mail, ChevronRight, Landmark
} from 'lucide-react';
import API from '../services/api';

const LandingPage = () => {
    const navigate = useNavigate();
    const [notices, setNotices] = useState([]);

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const res = await API.get('/notices?audience=All');
                if (res.data.success) {
                    setNotices(res.data.notices);
                }
            } catch (err) {
                console.error('Failed to load notices:', err);
            }
        };
        fetchNotices();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            
            {/* Header */}
            <header className="bg-slate-950 border-b border-slate-800 py-4 px-4 sm:px-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                            <School className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">
                                Govt. Higher Secondary School
                            </h1>
                            <p className="text-xs text-slate-400">
                                Department of School Education | Estd. 1968
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                    >
                        Portal Sign In
                    </button>
                </div>
            </header>

            {/* Simple Hero */}
            <section className="py-12 px-4 sm:px-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    
                    {/* Left Column: Text & Login Buttons */}
                    <div className="md:col-span-7 space-y-6">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                            <Landmark className="w-3.5 h-3.5" />
                            <span>UDISE+ Code: 19180100204</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                            Welcome to Govt. Higher Secondary School Portal
                        </h2>

                        <p className="text-sm text-slate-300 leading-relaxed">
                            Official digital management platform for students, teachers, and administration. Access report cards, homework, attendance, and official notices.
                        </p>

                        {/* Three Simple Login Buttons */}
                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                onClick={() => navigate('/login?role=Student')}
                                className="p-4 rounded-xl bg-slate-800 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500 text-left transition"
                            >
                                <GraduationCap className="w-6 h-6 text-blue-400 mb-2" />
                                <div className="font-bold text-sm text-white">Student Login</div>
                                <div className="text-[11px] text-slate-400 mt-1 flex items-center">
                                    <span>Marks & PDF</span>
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/login?role=Teacher')}
                                className="p-4 rounded-xl bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500 text-left transition"
                            >
                                <UserCheck className="w-6 h-6 text-emerald-400 mb-2" />
                                <div className="font-bold text-sm text-white">Teacher Login</div>
                                <div className="text-[11px] text-slate-400 mt-1 flex items-center">
                                    <span>Attendance & Marks</span>
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/login?role=Officer')}
                                className="p-4 rounded-xl bg-slate-800 hover:bg-amber-900/40 border border-slate-700 hover:border-amber-500 text-left transition"
                            >
                                <ShieldCheck className="w-6 h-6 text-amber-400 mb-2" />
                                <div className="font-bold text-sm text-white">Officer / Admin</div>
                                <div className="text-[11px] text-slate-400 mt-1 flex items-center">
                                    <span>Full Admin Control</span>
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: School Picture (pic.jpg) */}
                    <div className="md:col-span-5">
                        <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-slate-800">
                            <img 
                                src="/pic.jpg" 
                                alt="Govt Higher Secondary School" 
                                className="w-full h-64 sm:h-80 object-cover"
                            />
                            <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-800">
                                School Campus View
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Simple Notice Board Section */}
            <section className="py-10 bg-slate-950 border-t border-slate-800 px-4 sm:px-8">
                <div className="max-w-6xl mx-auto space-y-4">
                    <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-white">Official Notice Board</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {notices.slice(0, 3).map((n) => (
                            <div key={n.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-xs text-amber-400">
                                    <span className="font-semibold">{n.target_audience}</span>
                                    <span className="text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-sm text-white">{n.title}</h4>
                                <p className="text-xs text-slate-400 line-clamp-3">{n.content}</p>
                            </div>
                        ))}
                        {notices.length === 0 && (
                            <div className="col-span-3 text-center py-6 text-slate-500 text-xs">
                                No active notices.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Simple Contact Footer */}
            <footer className="py-8 bg-slate-950 border-t border-slate-800/60 px-4 sm:px-8 text-xs text-slate-400">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center md:text-left">
                        <div className="font-bold text-white">Govt. Higher Secondary School</div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 pt-1">
                            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> Main Road, City Center</span>
                            <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> 033-2456-7890</span>
                            <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1" /> info@govtschool.edu.in</span>
                        </div>
                    </div>

                    <div className="text-slate-500 text-center md:text-right">
                        © 2026 Government Higher Secondary School. All rights reserved.
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
