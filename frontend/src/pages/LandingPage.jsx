import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    School, GraduationCap, UserCheck, ShieldCheck,
    Bell, MapPin, Phone, Mail, ChevronRight, Landmark,
    Award, BookOpen, Utensils, Laptop, Sparkles, CheckCircle2,
    FileText, HelpCircle, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import API from '../services/api';

const LandingPage = () => {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [notices, setNotices] = useState([]);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [annRes, noticeRes] = await Promise.all([
                    API.get('/announcements'),
                    API.get('/notices?audience=All')
                ]);

                if (annRes.data.success) {
                    setAnnouncements(annRes.data.announcements);
                }
                if (noticeRes.data.success) {
                    setNotices(noticeRes.data.notices);
                }
            } catch (err) {
                console.error('Failed to load portal announcements & notices:', err);
            }
        };
        fetchData();
    }, []);

    const filteredNotices = activeTab === 'All'
        ? notices
        : notices.filter(n => n.target_audience === activeTab);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">

            {/* 1. Tricolor Top Government Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600"></div>

            {/* 2. Top Department Information Bar */}
            <div className="bg-slate-900 border-b border-slate-800 text-xs py-2 px-4 sm:px-8 text-slate-300">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center space-x-3 flex-wrap justify-center sm:justify-start">
                        <span className="font-semibold text-amber-400 flex items-center">
                            <Landmark className="w-3.5 h-3.5 mr-1" /> Govt. Recognized School
                        </span>
                        <span className="text-slate-600">|</span>
                        <span>UDISE+ Code: <strong>19180100204</strong></span>
                        <span className="text-slate-600 hidden md:inline">|</span>
                        <span className="hidden md:inline">Index No: <strong>S.M-40291</strong></span>
                        <span className="text-slate-600 hidden lg:inline">|</span>
                        <span className="hidden lg:inline text-slate-400">Estd. 1953</span>
                    </div>

                    <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                        <span className="flex items-center"><Phone className="w-3 h-3 mr-1 text-emerald-400" /> Helpline: 033-2456-7890</span>
                        <span className="text-slate-600">|</span>
                        <span className="flex items-center"><Mail className="w-3 h-3 mr-1 text-blue-400" /> info@majpuriabaispatra.edu.in</span>
                    </div>
                </div>
            </div>

            {/* 3. Main Government School Navigation Header */}
            <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 py-3.5 px-4 sm:px-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">

                    {/* School Emblem & Name */}
                    <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-blue-700 to-emerald-700 p-0.5 shadow-lg shadow-blue-900/20 shrink-0">
                            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400 font-bold border border-amber-500/20">
                                <School className="w-7 h-7 text-amber-400" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                                    MAJURIA BAISPATRA S.M HIGH SCHOOL
                                </h1>
                                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase">
                                    Govt. Aided H.S
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">
                                Department of School Education | Higher Secondary (Class V - XII)
                            </p>
                        </div>
                    </div>

                    {/* Right Header Actions */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Quick Sign In</span>
                        </button>
                    </div>

                </div>
            </header>

            {/* 4. SEPARATE ANNOUNCEMENT TICKER (Controlled exclusively via Admin Announcement Panel) */}
            <div className="bg-slate-900 border-b border-slate-800 py-2 px-4 text-xs flex items-center overflow-hidden">
                <div className="max-w-7xl mx-auto w-full flex items-center space-x-3">
                    <div className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shrink-0 flex items-center">
                        <Bell className="w-3 h-3 mr-1 animate-pulse" /> ANNOUNCEMENT
                    </div>
                    <div className="overflow-hidden relative w-full text-slate-300">
                        <div className="whitespace-nowrap inline-block animate-marquee">
                            {announcements && announcements.length > 0 ? (
                                announcements.map((ann) => (
                                    <span key={ann.id} className="mr-8">
                                        📢 <strong className="text-white font-bold">{ann.text}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    </span>
                                ))
                            ) : (
                                <>
                                    <span className="mr-8">📢 <strong>Madhyamik & Higher Secondary Admit Cards:</strong> Download admit cards & room allotments from student portal. &nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    <span className="mr-8">🍲 <strong>Mid-Day Meal Scheme:</strong> Weekly nutritious meal schedule updated as per Govt. norms. &nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    <span className="mr-8">🏆 <strong>National Scholarship Portal (NSP):</strong> Kanyashree & Merit Scholarship applications open.</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Hero Section */}
            <section className="relative py-12 lg:py-16 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -z-10"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                    {/* Left Column: School Motto & Role Sign-In Cards */}
                    <div className="lg:col-span-7 space-y-6">

                        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>सा विद्या या विमुक्तये • Knowledge Leads to Liberation</span>
                        </div>

                        <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                            Empowering Youth Through <span className="bg-gradient-to-r from-amber-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">Quality Education</span>
                        </h2>

                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            Welcome to the official digital portal of <strong>Majuria Baispatra S.M High School</strong>. Serving the community since 1953 with excellence in academics, sports, science labs, and holistic student welfare schemes.
                        </p>

                        {/* Role Portal Sign-In Buttons */}
                        <div className="pt-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                                <span>Select Your Role to Access Portal</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                                {/* Student Portal Button */}
                                <button
                                    onClick={() => navigate('/login?role=Student')}
                                    className="group p-4 rounded-2xl bg-slate-900 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/60 text-left transition-all duration-200 shadow-md hover:shadow-blue-500/10"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <div className="font-bold text-sm text-white group-hover:text-blue-300">Student Portal</div>
                                    <div className="text-[11px] text-slate-400 mt-1 flex items-center">
                                        <span>Marksheets & Notes</span>
                                        <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>

                                {/* Teacher Portal Button */}
                                <button
                                    onClick={() => navigate('/login?role=Teacher')}
                                    className="group p-4 rounded-2xl bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/60 text-left transition-all duration-200 shadow-md hover:shadow-emerald-500/10"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    <div className="font-bold text-sm text-white group-hover:text-emerald-300">Teacher Portal</div>
                                    <div className="text-[11px] text-slate-400 mt-1 flex items-center">
                                        <span>Attendance & Marks</span>
                                        <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>

                                {/* Officer / Admin Button */}
                                <button
                                    onClick={() => navigate('/login?role=Officer')}
                                    className="group p-4 rounded-2xl bg-slate-900 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/60 text-left transition-all duration-200 shadow-md hover:shadow-amber-500/10"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div className="font-bold text-sm text-white group-hover:text-amber-300">HM / Admin Portal</div>
                                    <div className="text-[11px] text-slate-400 mt-1 flex items-center">
                                        <span>Full Admin Control</span>
                                        <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>

                            </div>
                        </div>

                    </div>

                    {/* Right Column: Campus Picture with Govt. Stamp */}
                    <div className="lg:col-span-5">
                        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group">

                            {/* Govt. Seal Badge */}
                            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center space-x-1.5 shadow-lg">
                                <Landmark className="w-3.5 h-3.5" />
                                <span>Govt. Recognized Campus</span>
                            </div>

                            <img
                                src="/pic.jpg"
                                alt="Majuria Baispatra S.M High School Campus"
                                className="w-full h-72 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
                            />

                            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                                <div>
                                    <div className="font-bold text-white">School Main Campus Building</div>
                                    <div className="text-[11px] text-slate-400">Majuria Baispatra, West Bengal</div>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
                                    Active Campus
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* 6. Key School Statistics Bar */}
            <section className="py-8 bg-slate-900 border-y border-slate-800 px-4 sm:px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <div className="text-3xl font-black text-blue-400">1,250+</div>
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">Students Enrolled</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Class V to XII</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <div className="text-3xl font-black text-emerald-400">100%</div>
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">Board Exam Pass Rate</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Madhyamik & HS</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <div className="text-3xl font-black text-purple-400">45+</div>
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">Qualified Teachers</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">M.Sc, M.A, B.Ed Faculty</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <div className="text-3xl font-black text-amber-400">56 Years</div>
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">Academic Excellence</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Established 1953</div>
                    </div>

                </div>
            </section>

            {/* 7. Government Student Welfare Schemes & Infrastructure Grid */}
            <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Government Schemes & Student Facilities</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Welfare Schemes & Modern Infrastructure
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                        Comprehensive government welfare programs and academic facilities provided to every student.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Mid-Day Meal Card */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <Utensils className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-base text-white">Mid-Day Meal (MDM) Scheme</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Fresh, hot, and highly nutritious meals served daily to all students from Class 5 to 8 following state government dietary guidelines.
                        </p>
                        <div className="text-[11px] font-semibold text-amber-400 flex items-center pt-1">
                            <span>Daily Menu Monitored</span>
                            <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>

                    {/* Free Books & Uniforms */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-base text-white">Free Textbooks & Uniforms</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            100% free textbook distribution and official school uniforms provided to every enrolled student under state education policy.
                        </p>
                        <div className="text-[11px] font-semibold text-blue-400 flex items-center pt-1">
                            <span>Government Funded</span>
                            <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>

                    {/* ICT Computer Lab */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <Laptop className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-base text-white">ICT & Smart Classrooms</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            High-speed computer laboratary, smart interactive projectors, and digital literacy classes integrated into the weekly timetable.
                        </p>
                        <div className="text-[11px] font-semibold text-emerald-400 flex items-center pt-1">
                            <span>Digital India Learning</span>
                            <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>

                </div>
            </section>

            {/* 8. Official Notice Board Section */}
            <section className="py-12 bg-slate-900 border-t border-slate-800 px-4 sm:px-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Official School Notice Board</h3>
                                <p className="text-xs text-slate-400">Public circulars, exam schedules, and holiday announcements</p>
                            </div>
                        </div>

                        {/* Audience Filter Tabs */}
                        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                            {['All', 'Student', 'Teacher'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === tab
                                            ? 'bg-amber-500 text-slate-950 shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {tab === 'All' ? 'All Notices' : `${tab}s`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {filteredNotices.slice(0, 6).map((n) => (
                            <div key={n.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold">
                                        {n.target_audience}
                                    </span>
                                    <span className="text-slate-500 font-mono">
                                        {new Date(n.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="font-bold text-sm text-white leading-snug">{n.title}</h4>
                                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{n.content}</p>
                                
                                {n.pdf_url && (
                                    <a
                                        href={n.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold transition mt-2"
                                    >
                                        <FileText className="w-4 h-4 text-red-400" />
                                        <span>Download Attached Notice PDF</span>
                                    </a>
                                )}
                            </div>
                        ))}

                        {filteredNotices.length === 0 && (
                            <div className="col-span-3 text-center py-10 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 text-xs">
                                <Info className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                                No active announcements for {activeTab}.
                            </div>
                        )}
                    </div>

                </div>
            </section>

            {/* 9. Headmaster's Message Block */}
            <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
                <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                        <div className="lg:col-span-3 text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 text-3xl font-bold shadow-lg">
                                HM
                            </div>
                            <div className="mt-3 font-bold text-white text-sm">Principal / Headmaster</div>
                            <div className="text-xs text-amber-400 font-medium">Majuria Baispatra S.M High School</div>
                        </div>

                        <div className="lg:col-span-9 space-y-3">
                            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center">
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Headmaster's Desk
                            </div>
                            <blockquote className="text-sm sm:text-base text-slate-200 italic leading-relaxed">
                                "Our mission is to foster an inclusive, disciplined, and technologically sound environment where every student from our region receives equal opportunity to excel in academics, sports, and moral values."
                            </blockquote>
                        </div>

                    </div>
                </div>
            </section>

            {/* 10. Official Government Footer */}
            <footer className="mt-auto bg-slate-950 border-t border-slate-800 text-xs text-slate-400 pt-10 pb-6 px-4 sm:px-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">

                        {/* Col 1: School Identity */}
                        <div className="space-y-3 md:col-span-2">
                            <div className="flex items-center space-x-2">
                                <School className="w-5 h-5 text-amber-400" />
                                <div className="font-extrabold text-white text-sm">
                                    MAJURIA BAISPATRA S.M HIGH SCHOOL
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                                Govt. Aided Higher Secondary Educational Institution. Recognized by the Department of School Education. Dedicated to public academic service since 1953.
                            </p>
                            <div className="text-[11px] text-slate-500 font-mono">
                                UDISE+ Code: 19180100204 | School Index: S.M-40291
                            </div>
                        </div>

                        {/* Col 2: Quick Links */}
                        <div className="space-y-2">
                            <div className="font-bold text-white text-xs uppercase tracking-wider">Portal Access</div>
                            <ul className="space-y-1.5 text-slate-400 text-xs">
                                <li><a href="/login?role=Student" className="hover:text-amber-400 transition">Student Login & Marksheets</a></li>
                                <li><a href="/login?role=Teacher" className="hover:text-amber-400 transition">Teacher Login & Attendance</a></li>
                                <li><a href="/login?role=Officer" className="hover:text-amber-400 transition">HM / Officer Admin Portal</a></li>
                            </ul>
                        </div>

                        {/* Col 3: Contact Details */}
                        <div className="space-y-2">
                            <div className="font-bold text-white text-xs uppercase tracking-wider">School Address</div>
                            <div className="space-y-1.5 text-slate-400 text-xs">
                                <div className="flex items-start"><MapPin className="w-3.5 h-3.5 mr-1.5 text-amber-400 shrink-0 mt-0.5" /> BAISPATRA, SARENGA, BANKURA, WEST BENGAL</div>
                                <div className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" /> 033-2456-7890</div>
                                <div className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1.5 text-blue-400 shrink-0" /> info@majpuriabaispatra.edu.in</div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Copyright & National Emblem Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
                        <div>
                            © {new Date().getFullYear()} Majuria Baispatra S.M High School. Department of School Education. All rights reserved.
                        </div>
                        <div className="flex items-center space-x-4">
                            <span>Designed for Government School Management</span>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold">Digital India Initiative</span>
                        </div>
                    </div>

                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
