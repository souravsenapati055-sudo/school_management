import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send } from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const NoticeManagement = () => {
    const [notices, setNotices] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetAudience, setTargetAudience] = useState('All');
    const [toast, setToast] = useState(null);

    const fetchNotices = async () => {
        try {
            const res = await API.get('/notices');
            if (res.data.success) {
                setNotices(res.data.notices);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handlePublishNotice = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        try {
            const res = await API.post('/notices', { title, content, target_audience: targetAudience });
            if (res.data.success) {
                setToast({ type: 'success', message: 'Notice published successfully' });
                setTitle('');
                setContent('');
                fetchNotices();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to publish notice' });
        }
    };

    const handleDeleteNotice = async (id) => {
        if (!window.confirm('Delete this notice?')) return;
        try {
            const res = await API.delete(`/notices/${id}`);
            if (res.data.success) {
                setToast({ type: 'success', message: 'Notice deleted' });
                fetchNotices();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to delete notice' });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notice Board Publisher</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Publish official school announcements visible on landing page, student dashboards, or teacher portals.
                </p>
            </div>

            {/* Form Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-blue-500" />
                    <span>Publish Announcement</span>
                </h3>

                <form onSubmit={handlePublishNotice} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notice Title *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Annual Cultural Fest Registration"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            >
                                <option value="All">All (Public & Everyone)</option>
                                <option value="Student">Students Only</option>
                                <option value="Teacher">Teachers Only</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notice Content *</label>
                        <textarea
                            rows={4}
                            required
                            placeholder="Write notice details..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center space-x-2"
                    >
                        <Send className="w-4 h-4" />
                        <span>Publish Notice</span>
                    </button>
                </form>
            </div>

            {/* Notices History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Published Notices</h3>
                <div className="space-y-3">
                    {notices.map((n) => (
                        <div key={n.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{n.title}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                        {n.target_audience}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{n.content}</p>
                                <div className="text-[11px] text-gray-400">Published on {new Date(n.created_at).toLocaleDateString()}</div>
                            </div>
                            <button onClick={() => handleDeleteNotice(n.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default NoticeManagement;
