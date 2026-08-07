import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, CheckCircle2, Trophy } from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const ExamManagement = () => {
    const [exams, setExams] = useState([]);
    const [examName, setExamName] = useState('');
    const [session, setSession] = useState('2025-2026');
    const [toast, setToast] = useState(null);

    const fetchExams = async () => {
        try {
            const res = await API.get('/officer/exams');
            if (res.data.success) {
                setExams(res.data.exams);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const handleCreateExam = async (e) => {
        e.preventDefault();
        if (!examName.trim()) return;
        try {
            const res = await API.post('/officer/exams', { name: examName.trim(), session });
            if (res.data.success) {
                setToast({ type: 'success', message: 'Exam term created successfully' });
                setExamName('');
                fetchExams();
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Error creating exam' });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Schedule Management</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Create exam terms (Unit Tests, Half-Yearly, Annual) available for teacher marks uploading and marksheet PDF generation.
                    </p>
                </div>

                <Link
                    to="/officer/toppers"
                    className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0"
                >
                    <Trophy className="w-4 h-4" />
                    <span>View Topper Leaderboard & Print</span>
                </Link>
            </div>

            {/* Create Exam Form */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <span>Create New Exam Term</span>
                </h3>

                <form onSubmit={handleCreateExam} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Exam Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Unit Test 3 / Pre-Board"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Academic Session</label>
                        <input
                            type="text"
                            value={session}
                            onChange={(e) => setSession(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-md transition"
                        >
                            Create Exam
                        </button>
                    </div>
                </form>
            </div>

            {/* Exams List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Active Exam Terms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {exams.map((ex) => (
                        <div key={ex.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold text-sm">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white text-sm">{ex.name}</div>
                                    <div className="text-xs text-gray-400">Session: {ex.session}</div>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                Active
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default ExamManagement;
