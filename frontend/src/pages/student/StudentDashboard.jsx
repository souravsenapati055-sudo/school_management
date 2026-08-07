import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    GraduationCap, Download, CheckCircle2, FileText, 
    Bell, Award, Calendar, User, TrendingUp, Sparkles,
    Filter, BookOpen, Layers, CheckSquare
} from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingExam, setDownloadingExam] = useState('');
    const [toast, setToast] = useState(null);

    // Exam & Year Filter State
    const [selectedYear, setSelectedYear] = useState('2026');
    const [selectedExamName, setSelectedExamName] = useState('All');

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
            const res = await API.get(`/student/result-pdf?exam_name=${encodeURIComponent(examName)}`, {
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Marksheet_${user?.userId || 'Student'}_${examName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setToast({ type: 'success', message: 'Official Marksheet PDF downloaded successfully!' });
        } catch (err) {
            console.error('Download PDF error:', err);
            setToast({ type: 'error', message: 'Error generating/downloading result PDF' });
        } finally {
            setDownloadingExam('');
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500 animate-pulse flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mr-3"></div>
                <span>Loading student academic profile...</span>
            </div>
        );
    }

    const student = data?.student || user;
    const att = data?.attendance || { overallPercentage: 100 };
    const results = data?.results || [];
    const homework = data?.homework || [];
    const notices = data?.notices || [];

    // Extract available exam names for dropdown
    const availableExamNames = ['All', ...new Set(results.map(r => r.exam_name))];

    // Filter results based on selected Exam Name
    const filteredResults = selectedExamName === 'All' 
        ? results 
        : results.filter(r => r.exam_name === selectedExamName);

    return (
        <div className="space-y-6">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Welcome Banner Header */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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

                {/* Circular Attendance Widget */}
                <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
                    <div className="text-right">
                        <div className="text-[11px] text-blue-200 uppercase font-semibold">Attendance Rate</div>
                        <div className="text-2xl font-black text-white">{att.overallPercentage}%</div>
                        <div className="text-[10px] text-emerald-300 font-medium">Academic Session 2026</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center font-bold text-sm">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Student Navigation Bar (Quick Right-Side Tab Controls) */}
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-x-auto">
                <button
                    onClick={() => setSearchParams({})}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'overview' 
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Overview Dashboard</span>
                </button>

                <button
                    onClick={() => setSearchParams({ tab: 'marks' })}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'marks' 
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <Award className="w-4 h-4" />
                    <span>Report Cards & Marks</span>
                </button>

                <button
                    onClick={() => setSearchParams({ tab: 'attendance' })}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'attendance' 
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <CheckSquare className="w-4 h-4" />
                    <span>My Attendance</span>
                </button>

                <button
                    onClick={() => setSearchParams({ tab: 'homework' })}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'homework' 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Homework & Notes</span>
                </button>

                <button
                    onClick={() => setSearchParams({ tab: 'notices' })}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'notices' 
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <Bell className="w-4 h-4" />
                    <span>Notice Board</span>
                </button>
            </div>

            {/* TAB VIEW 1: REPORT CARDS & MARKS MODULE */}
            {activeTab === 'marks' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-6">
                    
                    {/* Header & Filter Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Award className="w-6 h-6 text-amber-500" />
                                <span>Report Cards & Examination Marks</span>
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Select academic year and examination term to view official marks & download PDF report cards.
                            </p>
                        </div>

                        {/* Dropdown Filters: Academic Year & Exam Term */}
                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Academic Year</label>
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold outline-none"
                                >
                                    <option value="2026">2026 (Current)</option>
                                    <option value="2025">2025</option>
                                    <option value="2024">2024</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Exam Term</label>
                                <select 
                                    value={selectedExamName}
                                    onChange={(e) => setSelectedExamName(e.target.value)}
                                    className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold outline-none"
                                >
                                    {availableExamNames.map(ex => (
                                        <option key={ex} value={ex}>{ex}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Cards List */}
                    <div className="space-y-5">
                        {filteredResults.map((res) => (
                            <div key={res.id} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 space-y-5">
                                
                                {/* Exam Header Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-600 pb-4">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{res.exam_name}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">Year: {selectedYear}</span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
                                            Total Score: {res.total_marks} | Percentage: <span className="text-emerald-600 dark:text-emerald-400">{res.percentage}%</span> | Overall Grade: <span className="text-brand-600 font-black">{res.grade}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDownloadPDF(res.exam_name)}
                                        disabled={downloadingExam === res.exam_name}
                                        className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition disabled:opacity-50 shrink-0"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>{downloadingExam === res.exam_name ? 'Generating Marksheet PDF...' : 'Download Official Marksheet PDF'}</span>
                                    </button>
                                </div>

                                {/* Subject Breakdown Grid */}
                                <div>
                                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Subject-wise Marks Breakdown</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {res.subject_details?.map((sd, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-1">
                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{sd.subject_name}</div>
                                                <div className="text-base font-black text-gray-900 dark:text-white">
                                                    {sd.marks_obtained} <span className="text-xs text-gray-400 font-normal">/ {sd.max_marks}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300 italic">
                                    <strong>Teacher Evaluation & Remarks:</strong> "{res.remarks || 'Satisfactory progress and good academic performance.'}"
                                </div>

                            </div>
                        ))}

                        {filteredResults.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/20 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-400 text-xs space-y-2">
                                <Award className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                                <div>No results published for <strong>{selectedExamName}</strong> in <strong>{selectedYear}</strong>.</div>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* TAB VIEW 2: MY ATTENDANCE HISTORY */}
            {activeTab === 'attendance' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <CheckSquare className="w-6 h-6 text-emerald-500" />
                                <span>My Attendance History & Log</span>
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Daily attendance records marked by class teacher
                            </p>
                        </div>

                        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                            {att.overallPercentage}% Present Overall
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">{att.presentDays || 180}</div>
                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">Days Present</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">{att.absentDays || 5}</div>
                            <div className="text-xs font-semibold text-rose-500 mt-1">Days Absent</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">{att.totalDays || 185}</div>
                            <div className="text-xs font-semibold text-blue-500 mt-1">Total Academic Days</div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB VIEW 3: HOMEWORK & NOTES */}
            {activeTab === 'homework' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <FileText className="w-6 h-6 text-blue-500" />
                        <span>Class Homework & Study Notes</span>
                    </h2>

                    <div className="space-y-4">
                        {homework.map((hw) => (
                            <div key={hw.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{hw.title}</h3>
                                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                        {hw.subject_name}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{hw.description}</p>
                                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                                    Due Date: <strong className="text-rose-500 font-mono">{new Date(hw.due_date).toLocaleDateString()}</strong>
                                </div>
                            </div>
                        ))}
                        {homework.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-xs">
                                No active homework assigned for your class.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB VIEW 4: NOTICE BOARD */}
            {activeTab === 'notices' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <Bell className="w-6 h-6 text-purple-500" />
                        <span>School Notice Announcements</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notices.map((n) => (
                            <div key={n.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-purple-600 dark:text-purple-400">{n.target_audience} Notice</span>
                                    <span className="text-gray-400 font-mono">{new Date(n.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{n.title}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{n.content}</p>
                                {n.pdf_url && (
                                    <a
                                        href={n.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold transition mt-2"
                                    >
                                        <FileText className="w-4 h-4 text-red-500" />
                                        <span>Download Attached Notice PDF</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* OVERVIEW DASHBOARD VIEW (Default layout when tab is 'overview' or unset) */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Results Overview (2 Cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                                    <Award className="w-5 h-5 text-amber-500" />
                                    <span>Latest Exam Results & Marksheets</span>
                                </h3>
                                <button
                                    onClick={() => setSearchParams({ tab: 'marks' })}
                                    className="text-xs font-bold text-brand-600 hover:text-brand-500"
                                >
                                    View All Reports →
                                </button>
                            </div>

                            <div className="space-y-4">
                                {results.slice(0, 2).map((res) => (
                                    <div key={res.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200/70 dark:border-gray-700 space-y-4">
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

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {res.subject_details?.slice(0, 6).map((sd, i) => (
                                                <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{sd.subject_name}</span>
                                                    <span className="font-mono font-bold text-gray-900 dark:text-white">{sd.marks_obtained} / {sd.max_marks}</span>
                                                </div>
                                            ))}
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

                        {/* Homework Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <span>Class Homework Assignments</span>
                                </h3>
                                <button
                                    onClick={() => setSearchParams({ tab: 'homework' })}
                                    className="text-xs font-bold text-brand-600 hover:text-brand-500"
                                >
                                    View All Homework →
                                </button>
                            </div>

                            <div className="space-y-3">
                                {homework.slice(0, 3).map((hw) => (
                                    <div key={hw.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{hw.title}</span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                                {hw.subject_name}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">{hw.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Profile & Notices */}
                    <div className="space-y-6">
                        
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-3">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base border-b border-gray-100 dark:border-gray-700 pb-2">Student Profile Summary</h3>
                            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                                <div><span className="font-semibold text-gray-800 dark:text-white">Full Name:</span> {student.name}</div>
                                <div><span className="font-semibold text-gray-800 dark:text-white">User ID:</span> <code className="font-mono text-brand-600 dark:text-brand-400 font-bold">{student.user_id}</code></div>
                                <div><span className="font-semibold text-gray-800 dark:text-white">Father's Name:</span> {student.father_name || 'N/A'}</div>
                                <div><span className="font-semibold text-gray-800 dark:text-white">Mother's Name:</span> {student.mother_name || 'N/A'}</div>
                                <div><span className="font-semibold text-gray-800 dark:text-white">Assigned Gmail:</span> {student.email || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-3">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                                <Bell className="w-4 h-4 text-blue-500" />
                                <span>Recent Notices</span>
                            </h3>
                            <div className="space-y-3">
                                {notices.slice(0, 3).map((n) => (
                                    <div key={n.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                                        <div className="font-bold text-xs text-gray-900 dark:text-white">{n.title}</div>
                                        <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{n.content}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default StudentDashboard;
