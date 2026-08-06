import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    GraduationCap, Download, CheckCircle2, FileText, 
    Bell, Award, Calendar, User, TrendingUp 
} from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingExam, setDownloadingExam] = useState('');
    const [toast, setToast] = useState(null);

    const fetchDashboardData = async () => {
        try {
            const res = await API.get('/student/dashboard');
            if (res.data.success) {
                setData(res.data.dashboard);
            }
        } catch (err) {
            console.error('Failed to load student dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleDownloadPDF = async (examName) => {
        setDownloadingExam(examName);
        try {
            const token = localStorage.getItem('school_token');
            const response = await fetch(`/api/student/result-pdf?exam_name=${encodeURIComponent(examName)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Marksheet_${user?.userId}_${examName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setToast({ type: 'success', message: 'Official Marksheet PDF downloaded successfully!' });
        } catch (err) {
            setToast({ type: 'error', message: 'Error downloading result PDF' });
        } finally {
            setDownloadingExam('');
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500 animate-pulse">
                Loading student academic profile...
            </div>
        );
    }

    const student = data?.student || user;
    const att = data?.attendance || { overallPercentage: 100 };
    const results = data?.results || [];
    const homework = data?.homework || [];
    const notices = data?.notices || [];

    return (
        <div className="space-y-6">
            
            {/* Welcome Banner Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-md">
                        <GraduationCap className="w-4 h-4" />
                        <span>Student Academic Portal</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Welcome, {student.name}!
                    </h1>
                    <p className="text-xs text-blue-100 font-medium">
                        Class: <span className="font-bold">{student.class_name} ({student.section_name})</span> | Roll No: <span className="font-bold">#{student.roll_number}</span> | Admission No: <span className="font-bold">{student.admission_number}</span>
                    </p>
                </div>

                {/* Circular Overall Attendance Widget */}
                <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-right">
                        <div className="text-[11px] text-blue-200 uppercase font-semibold">Attendance Rate</div>
                        <div className="text-2xl font-black text-white">{att.overallPercentage}%</div>
                        <div className="text-[10px] text-emerald-300 font-medium">Overall Session</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center font-bold text-sm">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Middle Grid: Results & Marksheet Downloads */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Academic Results List (2 Cols) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                                <Award className="w-5 h-5 text-amber-500" />
                                <span>Exam Results & Report Cards</span>
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {results.map((res) => (
                                <div key={res.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200/70 dark:border-gray-700 space-y-4">
                                    
                                    {/* Exam Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 dark:border-gray-600/50 pb-3">
                                        <div>
                                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{res.exam_name}</span>
                                            <div className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">
                                                Total Score: {res.total_marks} | Percentage: <span className="text-emerald-600 dark:text-emerald-400">{res.percentage}%</span> | Grade: <span className="text-brand-600">{res.grade}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDownloadPDF(res.exam_name)}
                                            disabled={downloadingExam === res.exam_name}
                                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>{downloadingExam === res.exam_name ? 'Generating PDF...' : 'Download Result PDF'}</span>
                                        </button>
                                    </div>

                                    {/* Subject Breakdown Cards Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {res.subject_details?.map((sd, i) => (
                                            <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">{sd.subject_name}</span>
                                                <span className="font-mono font-bold text-gray-900 dark:text-white">{sd.marks_obtained} / {sd.max_marks}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        Teacher Remarks: "{res.remarks || 'Satisfactory'}"
                                    </div>
                                </div>
                            ))}

                            {results.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No published exam results found yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Class Homework List */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <span>My Class Homework & Assignments</span>
                        </h3>

                        <div className="space-y-3">
                            {homework.map((hw) => (
                                <div key={hw.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{hw.title}</span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                            {hw.subject_name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{hw.description}</p>
                                    <div className="text-[11px] text-gray-400 pt-1">
                                        Due Date: <strong className="text-rose-500 font-mono">{new Date(hw.due_date).toLocaleDateString()}</strong>
                                    </div>
                                </div>
                            ))}
                            {homework.length === 0 && (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    No active homework assigned for your class.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column: Notices & Student Profile Info */}
                <div className="space-y-6">
                    
                    {/* Student Profile Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base border-b border-gray-100 dark:border-gray-700 pb-2">Student Profile</h3>
                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                            <div><span className="font-semibold text-gray-800 dark:text-white">Full Name:</span> {student.name}</div>
                            <div><span className="font-semibold text-gray-800 dark:text-white">User ID:</span> <code className="font-mono text-brand-600 dark:text-brand-400 font-bold">{student.user_id}</code></div>
                            <div><span className="font-semibold text-gray-800 dark:text-white">Father's Name:</span> {student.father_name || 'N/A'}</div>
                            <div><span className="font-semibold text-gray-800 dark:text-white">Mother's Name:</span> {student.mother_name || 'N/A'}</div>
                            <div><span className="font-semibold text-gray-800 dark:text-white">Date of Birth:</span> {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</div>
                            <div><span className="font-semibold text-gray-800 dark:text-white">Address:</span> {student.address || 'N/A'}</div>
                            <div><span className="font-semibold text-gray-800 dark:text-white">Contact:</span> {student.mobile_number || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Latest Notices Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                            <Bell className="w-4 h-4 text-blue-500" />
                            <span>Notice Announcements</span>
                        </h3>
                        <div className="space-y-3">
                            {notices.map((n) => (
                                <div key={n.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                                    <div className="font-bold text-xs text-gray-900 dark:text-white">{n.title}</div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{n.content}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default StudentDashboard;
