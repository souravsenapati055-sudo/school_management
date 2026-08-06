import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, FileText, Upload, Megaphone, Sparkles, CheckCircle2 } from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const NoticeManagement = () => {
    const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'notices'
    
    // Ticker Announcements State
    const [announcements, setAnnouncements] = useState([]);
    const [tickerText, setTickerText] = useState('');

    // Notice Board State
    const [notices, setNotices] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetAudience, setTargetAudience] = useState('All');
    const [pdfFile, setPdfFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchData = async () => {
        try {
            const [annRes, noticeRes] = await Promise.all([
                API.get('/announcements'),
                API.get('/notices')
            ]);
            if (annRes.data.success) {
                setAnnouncements(annRes.data.announcements);
            }
            if (noticeRes.data.success) {
                setNotices(noticeRes.data.notices);
            }
        } catch (err) {
            console.error('Failed to load notices/announcements:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 1. Publish Ticker Announcement
    const handlePublishAnnouncement = async (e) => {
        e.preventDefault();
        if (!tickerText.trim()) {
            setToast({ type: 'error', message: 'Please enter announcement text for the ticker' });
            return;
        }

        setLoading(true);
        try {
            const res = await API.post('/announcements', { text: tickerText.trim() });
            if (res.data.success) {
                setToast({ type: 'success', message: 'Ticker announcement added live to Landing Page!' });
                setTickerText('');
                fetchData();
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to add announcement' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm('Delete this ticker announcement?')) return;
        try {
            const res = await API.delete(`/announcements/${id}`);
            if (res.data.success) {
                setToast({ type: 'success', message: 'Announcement deleted' });
                fetchData();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to delete announcement' });
        }
    };

    // 2. Publish Notice with optional PDF attachment
    const handlePublishNotice = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setToast({ type: 'error', message: 'Title and Content are required' });
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('content', content.trim());
            formData.append('target_audience', targetAudience);
            if (pdfFile) {
                formData.append('pdf', pdfFile);
            }

            const res = await API.post('/notices', formData);

            if (res.data.success) {
                setToast({ type: 'success', message: 'Notice published with PDF attachment!' });
                setTitle('');
                setContent('');
                setPdfFile(null);
                fetchData();
            }
        } catch (err) {
            console.error('Publish notice error:', err);
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to publish notice' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNotice = async (id) => {
        if (!window.confirm('Delete this notice?')) return;
        try {
            const res = await API.delete(`/notices/${id}`);
            if (res.data.success) {
                setToast({ type: 'success', message: 'Notice deleted' });
                fetchData();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to delete notice' });
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements & Notice Board Control</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Manage the top landing page ticker announcements separately or publish detailed notices with PDF document attachments.
                </p>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm">
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                        activeTab === 'announcements'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <Megaphone className="w-4 h-4" />
                    <span>Top Landing Page Announcement Ticker ({announcements.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('notices')}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                        activeTab === 'notices'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}
                >
                    <Bell className="w-4 h-4" />
                    <span>Official Notice Board & PDF Publisher ({notices.length})</span>
                </button>
            </div>

            {/* SECTION 1: TICKER ANNOUNCEMENT MANAGER */}
            {activeTab === 'announcements' && (
                <div className="space-y-6">
                    {/* Add Announcement Form */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                            <Megaphone className="w-5 h-5 text-amber-500" />
                            <span>Add Landing Page Ticker Announcement</span>
                        </h3>

                        <form onSubmit={handlePublishAnnouncement} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Announcement Ticker Text *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 📢 Madhyamik & HS Board Exam Admit Cards distributed from 10 AM today."
                                    value={tickerText}
                                    onChange={(e) => setTickerText(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md flex items-center space-x-2 transition disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                <span>{loading ? 'Adding...' : 'Publish to Top Announcement Ticker'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Announcement Ticker Items List */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Active Ticker Announcements on Landing Page</h3>
                        <div className="space-y-3">
                            {announcements.map((ann) => (
                                <div key={ann.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                                    <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                        <span className="text-amber-500">📢</span>
                                        <span>{ann.text}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAnnouncement(ann.id)}
                                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                                        title="Delete Ticker Item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {announcements.length === 0 && (
                                <div className="text-center py-6 text-gray-400 text-xs">
                                    No custom ticker announcements added yet. Default government alerts will be displayed.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION 2: NOTICE BOARD PUBLISHER WITH PDF ATTACHMENTS */}
            {activeTab === 'notices' && (
                <div className="space-y-6">
                    {/* Notice Form Card */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                            <Bell className="w-5 h-5 text-blue-500" />
                            <span>Publish Official Notice (With Optional PDF Attachment)</span>
                        </h3>

                        <form onSubmit={handlePublishNotice} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notice Title *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Higher Secondary Examination Timetable & Circular"
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
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notice Detailed Content *</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write notice details, exam rules, or holiday information..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none resize-none"
                                />
                            </div>

                            {/* PDF Attachment Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Attach Official PDF Document (Optional)
                                </label>
                                <div className="flex items-center space-x-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                                    <Upload className="w-5 h-5 text-gray-400 shrink-0" />
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={(e) => setPdfFile(e.target.files[0] || null)}
                                        className="text-xs text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/40 dark:file:text-blue-300 hover:file:bg-blue-100"
                                    />
                                </div>
                                {pdfFile && (
                                    <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Attached: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                <span>{loading ? 'Publishing Notice...' : 'Publish Official Notice Board Document'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Published Notices List */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Published Notice Board Documents</h3>
                        <div className="space-y-4">
                            {notices.map((n) => (
                                <div key={n.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase">
                                                {n.target_audience}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{n.title}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">{n.content}</p>

                                        {n.pdf_url && (
                                            <a
                                                href={n.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold transition mt-2"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-red-500" />
                                                <span>Download Attached PDF</span>
                                            </a>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDeleteNotice(n.id)}
                                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                                        title="Delete Notice"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {notices.length === 0 && (
                                <div className="text-center py-6 text-gray-400 text-xs">
                                    No published notices found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default NoticeManagement;
