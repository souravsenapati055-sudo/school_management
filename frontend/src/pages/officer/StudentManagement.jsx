import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, UserPlus, Edit2, Trash2, X, 
    CheckCircle2, GraduationCap, Filter, Eye 
} from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [toast, setToast] = useState(null);

    // Form fields for Create/Edit
    const [formData, setFormData] = useState({
        name: '', roll_number: '', class_name: 'Class 8', section_name: 'A',
        age: '', gender: 'Male', father_name: '', mother_name: '',
        address: '', mobile_number: '', email: '', admission_number: '', dob: '', password: ''
    });

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let url = `/officer/students?search=${encodeURIComponent(searchQuery)}`;
            if (filterClass) url += `&class_name=${encodeURIComponent(filterClass)}`;
            if (filterSection) url += `&section_name=${encodeURIComponent(filterSection)}`;

            const res = await API.get(url);
            if (res.data.success) {
                setStudents(res.data.students);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [filterClass, filterSection, searchQuery]);

    // Live auto-generated User ID preview
    const previewUserId = () => {
        if (!formData.name.trim()) return 'EXAMPLE849';
        const firstName = formData.name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
        const classNum = formData.class_name.replace(/\D/g, '') || '8';
        const roll = formData.roll_number || '49';
        return `${firstName}${classNum}${roll}`.toUpperCase();
    };

    const handleSaveStudent = async (e) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                const res = await API.put(`/officer/students/${editingStudent.user_id}`, formData);
                if (res.data.success) {
                    setToast({ type: 'success', message: 'Student updated successfully' });
                    setEditingStudent(null);
                }
            } else {
                const res = await API.post('/officer/students', formData);
                if (res.data.success) {
                    setToast({ type: 'success', message: res.data.message });
                    setIsCreateModalOpen(false);
                }
            }
            resetForm();
            fetchStudents();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Error saving student' });
        }
    };

    const handleDeleteStudent = async (userId) => {
        if (!window.confirm(`Are you sure you want to delete student ID ${userId}?`)) return;
        try {
            const res = await API.delete(`/officer/students/${userId}`);
            if (res.data.success) {
                setToast({ type: 'success', message: 'Student deleted successfully' });
                fetchStudents();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to delete student' });
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', roll_number: '', class_name: 'Class 8', section_name: 'A',
            age: '', gender: 'Male', father_name: '', mother_name: '',
            address: '', mobile_number: '', email: '', admission_number: '', dob: '', password: ''
        });
        setEditingStudent(null);
    };

    const openEditModal = (st) => {
        setEditingStudent(st);
        setFormData({
            name: st.name, roll_number: st.roll_number, class_name: st.class_name, section_name: st.section_name,
            age: st.age || '', gender: st.gender || 'Male', father_name: st.father_name || '', mother_name: st.mother_name || '',
            address: st.address || '', mobile_number: st.mobile_number || '', email: st.email || '',
            admission_number: st.admission_number || '', dob: st.dob ? st.dob.split('T')[0] : '', password: ''
        });
        setIsCreateModalOpen(true);
    };

    return (
        <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Create, inspect, update, and manage student enrollments across all classes.
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Create New Student</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Search name, ID, admission..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                        />
                    </div>

                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                    >
                        <option value="">All Classes</option>
                        {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value)}
                        className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                    >
                        <option value="">All Sections</option>
                        {['A', 'B', 'C', 'D'].map((s) => (
                            <option key={s} value={s}>Section {s}</option>
                        ))}
                    </select>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Showing <span className="font-bold text-gray-900 dark:text-white">{students.length}</span> students
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">User ID</th>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Class & Sec</th>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Father Name</th>
                                <th className="p-4">Mobile</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {students.map((st) => (
                                <tr key={st.user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                                    <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                                        {st.user_id}
                                    </td>
                                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                                        {st.name}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                            {st.class_name} - {st.section_name}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-gray-700 dark:text-gray-300">
                                        #{st.roll_number}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        {st.father_name || 'N/A'}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                                        {st.mobile_number || 'N/A'}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => openEditModal(st)}
                                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40"
                                            title="Edit Student"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStudent(st.user_id)}
                                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                            title="Delete Student"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400 text-sm">
                                        No student records match the filter criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Student Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-2xl overflow-hidden my-8">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <GraduationCap className="w-5 h-5 text-brand-600" />
                                <span>{editingStudent ? `Edit Student (${editingStudent.user_id})` : 'Create New Student'}</span>
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                            
                            {!editingStudent && (
                                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                                    <span>Generated User ID Rule: <strong className="font-mono">{previewUserId()}</strong></span>
                                    <span className="text-[10px] bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded-md">Auto UpperCase & Disambiguated</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Student Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. SOURAV SENAPATI"
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Roll Number *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.roll_number}
                                        onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                                        placeholder="e.g. 49"
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Class *</label>
                                    <select
                                        value={formData.class_name}
                                        onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Section *</label>
                                    <select
                                        value={formData.section_name}
                                        onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    >
                                        {['A', 'B', 'C', 'D'].map((s) => (
                                            <option key={s} value={s}>Section {s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Father's Name</label>
                                    <input
                                        type="text"
                                        value={formData.father_name}
                                        onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mother's Name</label>
                                    <input
                                        type="text"
                                        value={formData.mother_name}
                                        onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                    <input
                                        type="text"
                                        value={formData.mobile_number}
                                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                        placeholder="10-digit mobile"
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md"
                                >
                                    {editingStudent ? 'Save Changes' : 'Create Student'}
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

export default StudentManagement;
