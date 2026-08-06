import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, BookOpen, Send } from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const HomeworkModule = () => {
    const [homeworkList, setHomeworkList] = useState([]);
    const [formData, setFormData] = useState({
        class_name: 'Class 8',
        section_name: 'A',
        subject_name: 'Mathematics',
        title: '',
        description: '',
        due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    });
    const [toast, setToast] = useState(null);

    const fetchHomework = async () => {
        try {
            const res = await API.get(`/teacher/homework?class_name=${encodeURIComponent(formData.class_name)}&section_name=${encodeURIComponent(formData.section_name)}`);
            if (res.data.success) {
                setHomeworkList(res.data.homework);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchHomework();
    }, [formData.class_name, formData.section_name]);

    const handleCreateHomework = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        try {
            const res = await API.post('/teacher/homework', formData);
            if (res.data.success) {
                setToast({ type: 'success', message: 'Homework posted successfully' });
                setFormData(prev => ({ ...prev, title: '', description: '' }));
                fetchHomework();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to post homework' });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homework & Notes Upload</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Assign homework, project tasks, and study notes for students in your classes.
                </p>
            </div>

            {/* Create Form */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span>Create Homework Assignment</span>
                </h3>

                <form onSubmit={handleCreateHomework} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Class</label>
                            <select
                                value={formData.class_name}
                                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            >
                                {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Section</label>
                            <select
                                value={formData.section_name}
                                onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            >
                                {['A', 'B', 'C', 'D'].map(s => (
                                    <option key={s} value={s}>Section {s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={formData.subject_name}
                                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                            <input
                                type="date"
                                required
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Chapter 4 Trigonometry Exercise 4.2"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description & Instructions</label>
                        <textarea
                            rows={3}
                            placeholder="Detailed instructions for students..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center space-x-2"
                    >
                        <Send className="w-4 h-4" />
                        <span>Post Homework</span>
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Active Homework ({formData.class_name} - {formData.section_name})</h3>
                <div className="space-y-3">
                    {homeworkList.map((hw) => (
                        <div key={hw.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-gray-900 dark:text-white text-sm">{hw.title}</div>
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                    {hw.subject_name}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{hw.description}</p>
                            <div className="text-[11px] text-gray-400 flex items-center space-x-4 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                                <span>Due Date: <strong className="text-rose-500">{new Date(hw.due_date).toLocaleDateString()}</strong></span>
                                <span>Posted: {new Date(hw.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {homeworkList.length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-sm">
                            No homework posted yet for {formData.class_name} - {formData.section_name}
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default HomeworkModule;
