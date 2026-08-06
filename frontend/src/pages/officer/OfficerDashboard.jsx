import React, { useEffect, useState } from 'react';
import { 
    Users, GraduationCap, Calendar, Bell, 
    TrendingUp, CheckCircle2, Award, BookOpen 
} from 'lucide-react';
import API from '../../services/api';

const OfficerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await API.get('/officer/dashboard-stats');
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch (err) {
                console.error('Failed to load stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500 animate-pulse">
                Loading administrative analytics dashboard...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            
            {/* Page Banner Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Officer Administrative Dashboard
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    System-wide analytics, enrollment stats, attendance overview, and notices.
                </p>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Students</div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats?.totalStudents || 0}</div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" /> Active Enrolled
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Teachers</div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats?.totalTeachers || 0}</div>
                        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
                            Faculty Staff
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today Attendance</div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats?.todayAttendancePercentage || 0}%</div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Daily Recorded
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exams Scheduled</div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats?.totalExams || 0}</div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                            Academic Session
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Middle Section: Classwise Student Breakdown & Recent Notices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Students per Class Card */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Students per Class Distribution</h3>
                        <span className="text-xs text-gray-400">Class 1 to 12</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {stats?.classDistribution?.map((cd, i) => (
                            <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400">{cd.class_name}</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{cd.student_count} <span className="text-xs font-normal text-gray-400">students</span></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Notices Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                            <Bell className="w-4 h-4 text-blue-500" />
                            <span>Recent Notices</span>
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {stats?.recentNotices?.map((n) => (
                            <div key={n.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                                <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">{n.title}</div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{n.content}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default OfficerDashboard;
