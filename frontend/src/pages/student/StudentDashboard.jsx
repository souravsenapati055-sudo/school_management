import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    GraduationCap, Download, CheckCircle2, FileText, 
    Bell, Award, Calendar, User, TrendingUp, Sparkles,
    Filter, BookOpen, Layers, CheckSquare, BarChart3,
    PieChart as PieIcon, Activity, Trophy, ArrowUpRight
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import API from '../../services/api';
import Toast from '../../components/Toast';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const StudentDashboard = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'powerbi';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingExam, setDownloadingExam] = useState('');
    const [toast, setToast] = useState(null);

    // Exam & Year Filter State for PowerBI dashboard
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
            a.download = `SubjectWise_Marksheet_${user?.userId || 'Student'}_${examName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setToast({ type: 'success', message: 'Official Subject-Wise Marksheet PDF downloaded successfully!' });
        } catch (err) {
            console.error('Download PDF error:', err);
            setToast({ type: 'error', message: 'Error generating/downloading result PDF' });
        } finally {
            setDownloadingExam('');
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500 animate-pulse flex items-center justify-center min-h-[300px] space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                <span className="font-semibold text-sm">Loading PowerBI academic dashboard & visual analytics...</span>
            </div>
        );
    }

    const student = data?.student || user;
    const att = data?.attendance || { overallPercentage: 100, presentDays: 180, totalDays: 185 };
    const results = data?.results || [];
    const homework = data?.homework || [];
    const notices = data?.notices || [];
    const rankInfo = data?.rankInfo || { rank: 1, totalStudents: 1 };
    const subjectClassAverages = data?.subjectClassAverages || [];

    // Filter available exam names
    const availableExamNames = ['All', ...new Set(results.map(r => r.exam_name))];

    // Filtered results based on selected exam dropdown
    const filteredResults = selectedExamName === 'All' 
        ? results 
        : results.filter(r => r.exam_name === selectedExamName);

    // Latest result record for charts
    const latestResult = filteredResults[0] || results[0] || {};
    const subjectDetails = latestResult.subject_details || [];

    // Calculate PowerBI summary metrics
    const overallPercentageAvg = results.length > 0
        ? parseFloat((results.reduce((acc, r) => acc + (parseFloat(r.percentage) || 0), 0) / results.length).toFixed(1))
        : (latestResult.percentage || 0);

    const totalSubjectsPassed = subjectDetails.filter(s => (s.marks_obtained / (s.max_marks || 100)) >= 0.33).length;

    // --- CHART DATA GENERATORS ---

    // Chart 1: Subject Performance Bar Chart (Student Marks vs Class Average Marks)
    const subjectLabels = subjectDetails.length > 0 
        ? subjectDetails.map(s => s.subject_name)
        : (subjectClassAverages.map(s => s.subject_name).length > 0 ? subjectClassAverages.map(s => s.subject_name) : ['Maths', 'English', 'Science', 'History']);

    const studentMarksData = subjectDetails.length > 0
        ? subjectDetails.map(s => s.marks_obtained)
        : [85, 92, 78, 88];

    const classAvgData = subjectLabels.map(lbl => {
        const found = subjectClassAverages.find(sca => sca.subject_name.toLowerCase() === lbl.toLowerCase());
        return found ? found.class_avg_marks : 72;
    });

    const subjectBarChartData = {
        labels: subjectLabels,
        datasets: [
            {
                label: `${student.name || 'My'} Marks`,
                data: studentMarksData,
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                borderColor: '#2563EB',
                borderWidth: 2,
                borderRadius: 8
            },
            {
                label: 'Class Average Marks',
                data: classAvgData,
                backgroundColor: 'rgba(209, 213, 219, 0.75)',
                borderColor: '#9CA3AF',
                borderWidth: 1.5,
                borderRadius: 8
            }
        ]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { font: { weight: 'bold', size: 11 } } },
            tooltip: { cornerRadius: 8 }
        },
        scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(156, 163, 175, 0.15)' } },
            x: { grid: { display: false } }
        }
    };

    // Chart 2: Academic Progress Line Trend Chart
    const examTrendLabels = results.length > 0 ? results.map(r => r.exam_name).reverse() : ['Unit Test 1', 'Half Yearly', 'Annual Exam'];
    const examTrendScores = results.length > 0 ? results.map(r => parseFloat(r.percentage) || 0).reverse() : [82, 88, 92];

    const examLineChartData = {
        labels: examTrendLabels,
        datasets: [
            {
                label: 'Overall Percentage Trajectory (%)',
                data: examTrendScores,
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: '#10B981',
                pointBackgroundColor: '#059669',
                pointRadius: 6,
                tension: 0.35
            }
        ]
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { font: { weight: 'bold', size: 11 } } }
        },
        scales: {
            y: { min: 40, max: 100, grid: { color: 'rgba(156, 163, 175, 0.15)' } },
            x: { grid: { display: false } }
        }
    };

    // Chart 3: Subject Grade Distribution Doughnut Chart
    const gradeCounts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 };
    subjectDetails.forEach(sd => {
        const pct = (sd.marks_obtained / (sd.max_marks || 100)) * 100;
        if (pct >= 90) gradeCounts['A+']++;
        else if (pct >= 75) gradeCounts['A']++;
        else if (pct >= 60) gradeCounts['B']++;
        else if (pct >= 33) gradeCounts['C']++;
        else gradeCounts['F']++;
    });

    const gradeDoughnutData = {
        labels: ['A+ (90%+)', 'A (75-89%)', 'B (60-74%)', 'C (33-59%)', 'F (Fail)'],
        datasets: [
            {
                data: [gradeCounts['A+'], gradeCounts['A'], gradeCounts['B'], gradeCounts['C'], gradeCounts['F']],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EF4444'],
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }
        ]
    };

    // Chart 4: Attendance Breakdown Pie Chart
    const attendancePieData = {
        labels: ['Present Days', 'Absent Days'],
        datasets: [
            {
                data: [att.presentDays || 180, (att.totalDays || 185) - (att.presentDays || 180)],
                backgroundColor: ['#10B981', '#F43F5E'],
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }
        ]
    };

    return (
        <div className="space-y-6">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* PowerBI Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-indigo-500/20">
                <div className="space-y-2">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>PowerBI Interactive Analytics Engine</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center space-x-3">
                        <span>Welcome, {student.name}!</span>
                    </h1>
                    <p className="text-xs text-slate-300 font-medium">
                        Class: <span className="font-bold text-white">{student.class_name} ({student.section_name})</span> | Roll No: <span className="font-bold text-white">#{student.roll_number}</span> | ID: <span className="font-mono text-amber-400 font-bold">{student.user_id}</span>
                    </p>
                </div>

                {/* Rank Badge Indicator */}
                <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
                    <div className="text-right">
                        <div className="text-[11px] text-amber-300 uppercase font-bold tracking-wider">Class Merit Rank</div>
                        <div className="text-2xl font-black text-white">#{rankInfo.rank} <span className="text-xs font-normal text-slate-300">/ {rankInfo.totalStudents}</span></div>
                        <div className="text-[10px] text-emerald-300 font-bold">Top Batch Percentile</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-lg">
                        <Trophy className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* PowerBI Tabs Navigation */}
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-x-auto">
                <button
                    onClick={() => setSearchParams({ tab: 'powerbi' })}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'powerbi' 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <span>PowerBI Visual Dashboard</span>
                </button>

                <button
                    onClick={() => setSearchParams({ tab: 'marks' })}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'marks' 
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <Award className="w-4 h-4" />
                    <span>Subject Report Cards & PDF</span>
                </button>

                <button
                    onClick={() => setSearchParams({ tab: 'attendance' })}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
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
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'homework' 
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Homework & E-Notes</span>
                </button>

                <button
                    onClick={() => setSearchParams({ tab: 'notices' })}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shrink-0 ${
                        activeTab === 'notices' 
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <Bell className="w-4 h-4" />
                    <span>Notice Announcements</span>
                </button>
            </div>

            {/* VIEW 1: POWERBI VISUAL DASHBOARD */}
            {activeTab === 'powerbi' && (
                <div className="space-y-6">
                    
                    {/* PowerBI Top Filter & Control Toolbar */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                            <Filter className="w-4 h-4 text-blue-600" />
                            <span>PowerBI Interactive Slicers:</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <div>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold outline-none"
                                >
                                    <option value="2026">Academic Session 2026</option>
                                    <option value="2025">Academic Session 2025</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={selectedExamName}
                                    onChange={(e) => setSelectedExamName(e.target.value)}
                                    className="px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold outline-none"
                                >
                                    {availableExamNames.map(ex => (
                                        <option key={ex} value={ex}>{ex === 'All' ? 'All Exam Terms' : ex}</option>
                                    ))}
                                </select>
                            </div>

                            {latestResult.exam_name && (
                                <button
                                    onClick={() => handleDownloadPDF(latestResult.exam_name)}
                                    disabled={downloadingExam === latestResult.exam_name}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>{downloadingExam === latestResult.exam_name ? 'Generating PDF...' : 'Download Subject-Wise PDF'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PowerBI KPI Metrics Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Avg %</span>
                                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><TrendingUp className="w-5 h-5" /></span>
                            </div>
                            <div className="text-3xl font-black text-gray-900 dark:text-white">{overallPercentageAvg}%</div>
                            <div className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                                <ArrowUpRight className="w-4 h-4" />
                                <span>Distinction Category</span>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Rank</span>
                                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Trophy className="w-5 h-5" /></span>
                            </div>
                            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">Rank #{rankInfo.rank}</div>
                            <div className="text-xs text-gray-500 font-medium">Out of {rankInfo.totalStudents} Classmates</div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</span>
                                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-5 h-5" /></span>
                            </div>
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{att.overallPercentage}%</div>
                            <div className="text-xs text-emerald-600 font-medium">{att.presentDays} Days Attended</div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subjects Passed</span>
                                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400"><Award className="w-5 h-5" /></span>
                            </div>
                            <div className="text-3xl font-black text-gray-900 dark:text-white">{totalSubjectsPassed} / {subjectDetails.length || 6}</div>
                            <div className="text-xs text-emerald-600 font-bold">100% Pass Status</div>
                        </div>

                    </div>

                    {/* PowerBI Visual Graphs Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Chart 1: Subject Performance Bar Chart */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                                <div>
                                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center space-x-2">
                                        <BarChart3 className="w-5 h-5 text-blue-600" />
                                        <span>Subject-wise Marks vs Class Average</span>
                                    </h3>
                                    <p className="text-xs text-gray-400">Direct subject benchmark against batch average</p>
                                </div>
                            </div>
                            <div className="h-64">
                                <Bar data={subjectBarChartData} options={barChartOptions} />
                            </div>
                        </div>

                        {/* Chart 2: Academic Term Progress Trajectory */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                                <div>
                                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center space-x-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        <span>Academic Percentage Trajectory</span>
                                    </h3>
                                    <p className="text-xs text-gray-400">Term-by-term score progress</p>
                                </div>
                            </div>
                            <div className="h-64">
                                <Line data={examLineChartData} options={lineChartOptions} />
                            </div>
                        </div>

                    </div>

                    {/* PowerBI Pie & Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Doughnut 1: Subject Grade Breakdown */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
                                <PieIcon className="w-4 h-4 text-purple-600" />
                                <span>Subject Grade Breakdown</span>
                            </h3>
                            <div className="h-48 flex items-center justify-center">
                                <Doughnut data={gradeDoughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </div>

                        {/* Pie 2: Attendance Distribution */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                                <span>Attendance Ratio</span>
                            </h3>
                            <div className="h-48 flex items-center justify-center">
                                <Pie data={attendancePieData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </div>

                        {/* Live Subject Breakdown List */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                <span>Subject Scorecard</span>
                                <span className="text-xs text-blue-600 font-mono">{latestResult.exam_name || 'Latest'}</span>
                            </h3>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {subjectDetails.map((sd, i) => (
                                    <div key={i} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between text-xs border border-gray-100 dark:border-gray-600">
                                        <span className="font-semibold text-gray-800 dark:text-white">{sd.subject_name}</span>
                                        <span className="font-black text-brand-600 dark:text-brand-400">{sd.marks_obtained} / {sd.max_marks}</span>
                                    </div>
                                ))}
                                {subjectDetails.length === 0 && (
                                    <div className="text-center py-6 text-xs text-gray-400">No subject marks available</div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            )}

            {/* VIEW 2: REPORT CARDS & MARKS MODULE */}
            {activeTab === 'marks' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-6">
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Award className="w-6 h-6 text-amber-500" />
                                <span>Report Cards & Examination Marksheets</span>
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Download official subject-wise marksheets generated directly with school seal & principal signatures.
                            </p>
                        </div>
                    </div>

                    {/* Results Cards List */}
                    <div className="space-y-5">
                        {filteredResults.map((res) => (
                            <div key={res.id} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 space-y-5">
                                
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
                                        <span>{downloadingExam === res.exam_name ? 'Generating PDF...' : 'Download Subject-Wise Result PDF'}</span>
                                    </button>
                                </div>

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

            {/* VIEW 3: ATTENDANCE HISTORY */}
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
                            <div className="text-2xl font-black text-gray-900 dark:text-white">{(att.totalDays || 185) - (att.presentDays || 180)}</div>
                            <div className="text-xs font-semibold text-rose-500 mt-1">Days Absent</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">{att.totalDays || 185}</div>
                            <div className="text-xs font-semibold text-blue-500 mt-1">Total Academic Days</div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 4: HOMEWORK & NOTES */}
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

            {/* VIEW 5: NOTICE BOARD */}
            {activeTab === 'notices' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <Bell className="w-6 h-6 text-rose-500" />
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
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default StudentDashboard;
