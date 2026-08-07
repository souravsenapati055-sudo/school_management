import React, { useState, useEffect, useRef } from 'react';
import { 
    Trophy, Printer, Download, Search, Filter, Award, 
    CheckCircle2, XCircle, Users, BarChart2, Eye, X, GraduationCap, Sparkles
} from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const TopperLeaderboard = () => {
    const [toppers, setToppers] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        highestPercentage: 0,
        lowestPercentage: 0,
        classAvgPercentage: 0,
        passCount: 0,
        failCount: 0
    });
    const [classes, setClasses] = useState([]);
    const [exams, setExams] = useState([]);
    
    // Filters
    const [filterClass, setFilterClass] = useState('All');
    const [filterSection, setFilterSection] = useState('All');
    const [filterExam, setFilterExam] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState('');
    const [selectedStudentModal, setSelectedStudentModal] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchClassesAndExams = async () => {
        try {
            const [resCls, resEx] = await Promise.all([
                API.get('/officer/classes'),
                API.get('/officer/exams')
            ]);
            if (resCls.data.success) setClasses(resCls.data.classes || []);
            if (resEx.data.success) setExams(resEx.data.exams || []);
        } catch (err) {
            console.error('Error fetching classes/exams:', err);
        }
    };

    const fetchTopperData = async () => {
        setLoading(true);
        try {
            let url = `/officer/toppers?class_name=${encodeURIComponent(filterClass)}&section_name=${encodeURIComponent(filterSection)}&exam_name=${encodeURIComponent(filterExam)}`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

            const res = await API.get(url);
            if (res.data.success) {
                setToppers(res.data.toppers || []);
                setStats(res.data.stats || {});
            }
        } catch (err) {
            console.error('Failed to fetch toppers:', err);
            setToast({ type: 'error', message: 'Failed to load topper leaderboard data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassesAndExams();
    }, []);

    useEffect(() => {
        fetchTopperData();
    }, [filterClass, filterSection, filterExam, searchQuery]);

    const handleDownloadStudentPDF = async (userId, examName) => {
        setDownloadingId(userId);
        try {
            const res = await API.get(`/officer/student-result-pdf?user_id=${encodeURIComponent(userId)}&exam_name=${encodeURIComponent(examName)}`, {
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SubjectWise_Marksheet_${userId}_${examName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setToast({ type: 'success', message: `Downloaded Subject-Wise PDF for Student ID ${userId}` });
        } catch (err) {
            console.error('PDF download error:', err);
            setToast({ type: 'error', message: 'Failed to generate subject-wise PDF' });
        } finally {
            setDownloadingId('');
        }
    };

    const handlePrintLeaderboard = () => {
        window.print();
    };

    const getRankBadge = (rank) => {
        if (rank === 1) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300">
                    🥇 1ST TOPPER
                </span>
            );
        }
        if (rank === 2) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 shadow-sm border border-slate-200">
                    🥈 2ND TOPPER
                </span>
            );
        }
        if (rank === 3) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 shadow-sm border border-amber-600">
                    🥉 3RD TOPPER
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono">
                RANK #{rank}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Print Header (Visible ONLY during window.print()) */}
            <div className="hidden print:block text-center p-6 border-b-2 border-gray-900 mb-6">
                <h1 className="text-2xl font-black uppercase text-gray-900 tracking-wider">
                    MAJURIA BAISPATRA S.M HIGH SCHOOL
                </h1>
                <p className="text-xs text-gray-600 font-semibold mt-1">
                    OFFICIAL TOPPER-TO-BOTTOM ACADEMIC MERIT LEADERBOARD REPORT
                </p>
                <div className="text-xs text-gray-800 mt-2 flex justify-between px-4 font-mono font-bold">
                    <span>Class: {filterClass}</span>
                    <span>Section: {filterSection}</span>
                    <span>Exam Term: {filterExam}</span>
                    <span>Printed On: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* Top Screen Banner Header */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
                <div className="space-y-2">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-amber-100 text-xs font-semibold backdrop-blur-md">
                        <Trophy className="w-4 h-4 text-amber-200" />
                        <span>Academic Excellence & Merit Portal</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Student Topper Leaderboard
                    </h1>
                    <p className="text-xs text-amber-100 font-medium">
                        Ranked Topper-to-Bottom by total score & percentage. View, print & download subject-wise PDF reports.
                    </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                    <button
                        onClick={handlePrintLeaderboard}
                        className="flex items-center space-x-2 px-5 py-3 bg-white text-slate-900 hover:bg-amber-50 rounded-2xl text-xs font-extrabold shadow-lg transition"
                    >
                        <Printer className="w-4 h-4 text-amber-600" />
                        <span>Print Topper-to-Bottom List</span>
                    </button>
                </div>
            </div>

            {/* KPI Metrics Dashboard Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Top Class Score</div>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.highestPercentage || 0}%</div>
                        <div className="text-[10px] text-gray-500 font-medium">Highest Academic Score</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                        <Trophy className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Class Average</div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.classAvgPercentage || 0}%</div>
                        <div className="text-[10px] text-gray-500 font-medium">Mean Batch Percentage</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                        <BarChart2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Evaluated</div>
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{stats.totalStudents || 0}</div>
                        <div className="text-[10px] text-gray-500 font-medium">Students Rank Processed</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pass Ratio</div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.passCount || 0} / {stats.totalStudents || 0}</div>
                        <div className="text-[10px] text-emerald-600 font-medium">{stats.failCount || 0} Requiring Support</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter Bar Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Filter className="w-4 h-4 text-brand-600" />
                        <span>Filter Leaderboard:</span>
                    </div>

                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold outline-none"
                    >
                        <option value="All">All Classes</option>
                        {classes.map((c) => (
                            <option key={c.id || c.class_name} value={c.class_name}>{c.class_name}</option>
                        ))}
                    </select>

                    <select
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value)}
                        className="px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold outline-none"
                    >
                        <option value="All">All Sections</option>
                        {['A', 'B', 'C', 'D'].map((s) => (
                            <option key={s} value={s}>Section {s}</option>
                        ))}
                    </select>

                    <select
                        value={filterExam}
                        onChange={(e) => setFilterExam(e.target.value)}
                        className="px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold outline-none"
                    >
                        <option value="All">All Exam Terms</option>
                        {exams.map((ex) => (
                            <option key={ex.id || ex.name} value={ex.name}>{ex.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search student name, roll..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                    />
                </div>
            </div>

            {/* Toppers Table (Topper-to-Bottom List) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-hidden print:border-none print:shadow-none">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 animate-pulse flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                        <span>Calculating topper rankings & subject scores...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm print:text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider print:bg-gray-200 print:text-gray-900">
                                <tr>
                                    <th className="p-4">Rank</th>
                                    <th className="p-4">Student Name</th>
                                    <th className="p-4">User ID</th>
                                    <th className="p-4">Class & Sec</th>
                                    <th className="p-4">Roll No</th>
                                    <th className="p-4">Exam Term</th>
                                    <th className="p-4">Total Score</th>
                                    <th className="p-4">Percentage</th>
                                    <th className="p-4">Grade</th>
                                    <th className="p-4 text-right print:hidden">PDF Report</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {toppers.map((st) => (
                                    <tr 
                                        key={st.result_id} 
                                        className={`transition ${
                                            st.rank === 1 
                                                ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70 font-semibold' 
                                                : st.rank === 2 
                                                ? 'bg-slate-50/50 dark:bg-slate-900/30' 
                                                : st.rank === 3 
                                                ? 'bg-amber-900/5 dark:bg-amber-950/10' 
                                                : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                                        }`}
                                    >
                                        <td className="p-4">
                                            {getRankBadge(st.rank)}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{st.student_name}</div>
                                            <div className="text-[11px] text-gray-400 font-normal">{st.email || 'No email registered'}</div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                                            {st.student_id}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300">
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                                {st.class_name} - {st.section_name}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-gray-900 dark:text-white font-bold">
                                            #{st.roll_number}
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                                            {st.exam_name}
                                        </td>
                                        <td className="p-4 font-black text-gray-900 dark:text-white">
                                            {st.total_marks}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                {st.percentage}%
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                                                st.grade === 'F' 
                                                    ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            }`}>
                                                {st.grade}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2 print:hidden">
                                            <button
                                                onClick={() => setSelectedStudentModal(st)}
                                                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition inline-flex items-center space-x-1"
                                                title="View Marks Breakdown"
                                            >
                                                <Eye className="w-4 h-4 text-blue-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadStudentPDF(st.student_id, st.exam_name)}
                                                disabled={downloadingId === st.student_id}
                                                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 inline-flex items-center space-x-1.5"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>{downloadingId === st.student_id ? 'Generating...' : 'PDF'}</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {toppers.length === 0 && (
                                    <tr>
                                        <td colSpan="10" className="p-12 text-center text-gray-400 text-xs">
                                            No topper result records found for the selected filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Print Signature Footer (Only visible on print) */}
            <div className="hidden print:flex justify-between items-end mt-16 pt-8 border-t border-gray-400">
                <div className="text-center font-bold text-xs text-gray-900">
                    <div className="w-48 border-b border-gray-900 mb-2"></div>
                    <span>Exam Controller Signature</span>
                </div>
                <div className="text-center font-bold text-xs text-gray-900">
                    <div className="w-48 border-b border-gray-900 mb-2"></div>
                    <span>Headmaster / Principal Signature</span>
                </div>
            </div>

            {/* Subject Breakdown Detail Modal */}
            {selectedStudentModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                            <div>
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">
                                    {selectedStudentModal.student_name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Class {selectedStudentModal.class_name} ({selectedStudentModal.section_name}) | Roll #{selectedStudentModal.roll_number}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedStudentModal(null)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Subject-wise Marks Breakdown ({selectedStudentModal.exam_name})</div>
                            <div className="grid grid-cols-2 gap-2">
                                {selectedStudentModal.subject_details?.map((sd, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 flex justify-between items-center text-xs">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{sd.subject_name}</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{sd.marks_obtained} / {sd.max_marks}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300 font-medium">
                                Total: <strong>{selectedStudentModal.total_marks}</strong> | Score: <strong>{selectedStudentModal.percentage}%</strong> | Grade: <strong>{selectedStudentModal.grade}</strong>
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => handleDownloadStudentPDF(selectedStudentModal.student_id, selectedStudentModal.exam_name)}
                                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-md"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download Official Subject PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TopperLeaderboard;
