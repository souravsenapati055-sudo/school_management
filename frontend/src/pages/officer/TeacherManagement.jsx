import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, X, GraduationCap, CheckCircle2, Mail } from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const TeacherManagement = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '', subject: 'Mathematics', designation: 'Senior Lecturer',
        mobile: '', email: '', qualification: '', password: ''
    });

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const res = await API.get('/officer/teachers');
            if (res.data.success) {
                setTeachers(res.data.teachers);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const previewTeacherId = () => {
        if (!formData.name.trim()) return 'RAHULT01';
        const firstName = formData.name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
        return `${firstName}T01`;
    };

    const handleSaveTeacher = async (e) => {
        e.preventDefault();
        try {
            if (editingTeacher) {
                const res = await API.put(`/officer/teachers/${editingTeacher.user_id}`, formData);
                if (res.data.success) {
                    setToast({ type: 'success', message: 'Teacher updated successfully' });
                }
            } else {
                const res = await API.post('/officer/teachers', formData);
                if (res.data.success) {
                    setToast({ type: 'success', message: res.data.message });
                }
            }
            setIsCreateModalOpen(false);
            resetForm();
            fetchTeachers();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to save teacher' });
        }
    };

    const handleDeleteTeacher = async (userId) => {
        if (!window.confirm(`Are you sure you want to delete teacher ID ${userId}?`)) return;
        try {
            const res = await API.delete(`/officer/teachers/${userId}`);
            if (res.data.success) {
                setToast({ type: 'success', message: 'Teacher deleted successfully' });
                fetchTeachers();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to delete teacher' });
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', subject: 'Mathematics', designation: 'Senior Lecturer',
            mobile: '', email: '', qualification: '', password: ''
        });
        setEditingTeacher(null);
    };

    const openEditModal = (t) => {
        setEditingTeacher(t);
        setFormData({
            name: t.name, subject: t.subject || 'Mathematics', designation: t.designation || 'Teacher',
            mobile: t.mobile || '', email: t.email || '', qualification: t.qualification || '', password: ''
        });
        setIsCreateModalOpen(true);
    };

    return (
        <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Management</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Register faculty staff, assign teaching subjects, and manage credentials.
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-md transition"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Create New Teacher</span>
                </button>
            </div>

            {/* Teachers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teachers.map((t) => (
                    <div key={t.user_id} className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                    {t.user_id}
                                </span>
                                <div className="space-x-1">
                                    <button onClick={() => openEditModal(t)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 rounded-lg">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteTeacher(t.user_id)} className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">{t.name}</h3>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">{t.designation}</p>
                            </div>

                            <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <div><span className="font-medium text-gray-700 dark:text-gray-300">Subject:</span> {t.subject || 'Unassigned'}</div>
                                <div><span className="font-medium text-gray-700 dark:text-gray-300">Qualification:</span> {t.qualification || 'N/A'}</div>
                                <div><span className="font-medium text-gray-700 dark:text-gray-300">Mobile:</span> {t.mobile || 'N/A'}</div>
                                <div className="flex items-center space-x-1 pt-1">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Gmail:</span> 
                                    {t.email ? (
                                        <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                            <Mail className="w-3 h-3" />
                                            <span>{t.email}</span>
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic">Not assigned</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-700/60 pt-3">
                            Registered on: {new Date(t.created_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create / Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingTeacher ? `Edit Teacher (${editingTeacher.user_id})` : 'Create New Teacher'}
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTeacher} className="p-6 space-y-4">
                            {!editingTeacher && (
                                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 text-xs text-purple-900 dark:text-purple-200">
                                    Generated Teacher ID Rule: <strong className="font-mono">{previewTeacherId()}</strong>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Teacher Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Rahul Verma"
                                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Primary Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="e.g. Mathematics"
                                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Designation</label>
                                <input
                                    type="text"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    placeholder="e.g. Senior Lecturer"
                                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
                                    <input
                                        type="text"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        placeholder="10-digit mobile"
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Gmail / Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="teacher@gmail.com"
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md">
                                    {editingTeacher ? 'Save Changes' : 'Create Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default TeacherManagement;
