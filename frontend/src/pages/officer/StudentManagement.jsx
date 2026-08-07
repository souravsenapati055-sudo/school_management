import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, UserPlus, Edit2, Trash2, X, 
    CheckCircle2, GraduationCap, Filter, Eye, Mail, Printer, TrendingUp, AlertTriangle
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
    const [rollConflictModal, setRollConflictModal] = useState(null);

    // Promote Modal State
    const [promotingStudent, setPromotingStudent] = useState(null);
    const [promoteData, setPromoteData] = useState({
        target_class_name: 'Class 9',
        target_section_name: 'A',
        new_roll_number: ''
    });

    // Form fields for Create/Edit
    const [formData, setFormData] = useState({
        name: '', roll_number: '', class_name: 'Class 8', section_name: 'A',
        age: '', gender: 'Male', father_name: '', mother_name: '',
        address: '', mobile_number: '', email: '', admission_number: '', dob: '', password: ''
    });

    const suggestNextRollNumber = (cls, sec) => {
        const matching = students.filter(s => s.class_name === cls && s.section_name === sec);
        if (matching.length === 0) return 1;
        const rolls = matching.map(s => Number(s.roll_number) || 0);
        return Math.max(...rolls, 0) + 1;
    };

    const openCreateModal = () => {
        resetForm();
        const defaultCls = 'Class 8';
        const defaultSec = 'A';
        const nextRoll = suggestNextRollNumber(defaultCls, defaultSec);
        setFormData({
            name: '', roll_number: nextRoll, class_name: defaultCls, section_name: defaultSec,
            age: '', gender: 'Male', father_name: '', mother_name: '',
            address: '', mobile_number: '', email: '', admission_number: '', dob: '', password: ''
        });
        setIsCreateModalOpen(true);
    };

    const handleClassChange = (newCls) => {
        if (!editingStudent) {
            const nextRoll = suggestNextRollNumber(newCls, formData.section_name);
            setFormData(prev => ({ ...prev, class_name: newCls, roll_number: nextRoll }));
        } else {
            setFormData(prev => ({ ...prev, class_name: newCls }));
        }
    };

    const handleSectionChange = (newSec) => {
        if (!editingStudent) {
            const nextRoll = suggestNextRollNumber(formData.class_name, newSec);
            setFormData(prev => ({ ...prev, section_name: newSec, roll_number: nextRoll }));
        } else {
            setFormData(prev => ({ ...prev, section_name: newSec }));
        }
    };

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
        if (!formData.name.trim()) return 'SOURAV949';
        const firstName = formData.name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
        const classNum = formData.class_name.replace(/\D/g, '') || '8';
        const roll = formData.roll_number || '49';
        return `${firstName}${classNum}${roll}`.toUpperCase();
    };

    // Live auto-generated Admission ID preview: UPPERCASE(FirstName + Year + Roll + Section) e.g. SOURAV202649A
    const previewAdmissionId = () => {
        if (!formData.name.trim()) return 'SOURAV202649A';
        const firstName = formData.name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
        const year = new Date().getFullYear();
        const roll = formData.roll_number || '49';
        const section = (formData.section_name || 'A').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return `${firstName}${year}${roll}${section}`;
    };

    // Live auto-generated Default Password preview (Name + Class Digit + Roll Number + Section)
    const previewDefaultPassword = () => {
        if (!formData.name.trim()) return 'SOURAV949A';
        const firstName = formData.name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
        const classMatch = formData.class_name ? formData.class_name.match(/\d+/) : null;
        const classNum = classMatch ? classMatch[0] : (formData.class_name || '').replace(/\s+/g, '').toUpperCase();
        const roll = formData.roll_number || '49';
        const section = (formData.section_name || 'A').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return `${firstName}${classNum}${roll}${section}`;
    };

    const handleSaveStudent = async (e) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                const res = await API.put(`/officer/students/${editingStudent.user_id}`, formData);
                if (res.data.success) {
                    setToast({ type: 'success', message: 'Student updated successfully' });
                    setEditingStudent(null);
                    setIsCreateModalOpen(false);
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
            const errData = err.response?.data;
            if (errData?.inUse) {
                setRollConflictModal({
                    existingStudent: errData.existingStudent,
                    usedRoll: errData.usedRoll,
                    suggestedRoll: errData.suggestedRoll,
                    className: formData.class_name,
                    sectionName: formData.section_name,
                    message: errData.message
                });
            } else {
                setToast({ type: 'error', message: errData?.message || 'Error saving student' });
            }
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

    const openPromoteModal = (st) => {
        setPromotingStudent(st);
        let nextClass = 'Class 9';
        const classMatch = st.class_name ? st.class_name.match(/\d+/) : null;
        if (classMatch) {
            const nextNum = parseInt(classMatch[0]) + 1;
            if (nextNum <= 12) nextClass = `Class ${nextNum}`;
            else nextClass = 'Graduated';
        }
        setPromoteData({
            target_class_name: nextClass,
            target_section_name: st.section_name || 'A',
            new_roll_number: st.roll_number || ''
        });
    };

    const handlePromoteStudent = async (e) => {
        e.preventDefault();
        if (!promotingStudent) return;
        try {
            const res = await API.post('/officer/students/promote', {
                user_id: promotingStudent.user_id,
                target_class_name: promoteData.target_class_name,
                target_section_name: promoteData.target_section_name,
                new_roll_number: promoteData.new_roll_number
            });
            if (res.data.success) {
                setToast({ type: 'success', message: res.data.message });
                setPromotingStudent(null);
                fetchStudents();
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to promote student' });
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Create, inspect, update, and manage student enrollments across all classes.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm shadow-md transition"
                        title="Print Student Directory Roster"
                    >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span>Print Student Directory</span>
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Create New Student</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar (Hidden during print) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
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

            {/* Print Only Official Document Roster (Visible ONLY during window.print()) */}
            <div className="hidden print:block p-4">
                <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
                    <h1 className="text-2xl font-black uppercase text-gray-900 tracking-wider">
                        MAJURIA BAISPATRA S.M HIGH SCHOOL
                    </h1>
                    <p className="text-xs text-gray-700 font-semibold mt-1">
                        OFFICIAL STUDENT ENROLLMENT & CONTACT DIRECTORY ROSTER
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-800 font-mono font-bold mt-4 pt-2 border-t border-gray-300">
                        <span>CLASS: {filterClass || 'ALL CLASSES'}</span>
                        <span>SECTION: {filterSection ? `SECTION ${filterSection}` : 'ALL SECTIONS'}</span>
                        <span>TOTAL STUDENTS: {students.length}</span>
                        <span>DATE: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-gray-900">
                    <thead>
                        <tr className="bg-gray-200 border-b-2 border-gray-900 text-gray-900 uppercase font-black">
                            <th className="p-2 border border-gray-900 text-center">#</th>
                            <th className="p-2 border border-gray-900">Admission ID / User ID</th>
                            <th className="p-2 border border-gray-900">Student Name</th>
                            <th className="p-2 border border-gray-900">Class & Sec</th>
                            <th className="p-2 border border-gray-900">Roll No</th>
                            <th className="p-2 border border-gray-900">Father's Name</th>
                            <th className="p-2 border border-gray-900">Mobile Number</th>
                            <th className="p-2 border border-gray-900">Assigned Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((st, index) => (
                            <tr key={st.user_id} className="border-b border-gray-400 font-sans">
                                <td className="p-2 border border-gray-400 text-center font-mono font-bold">{index + 1}</td>
                                <td className="p-2 border border-gray-400 font-mono font-bold text-gray-900">{st.admission_number || st.user_id}</td>
                                <td className="p-2 border border-gray-400 font-bold text-gray-900">{st.name}</td>
                                <td className="p-2 border border-gray-400 font-semibold">{st.class_name} - {st.section_name}</td>
                                <td className="p-2 border border-gray-400 font-mono font-bold">#{st.roll_number}</td>
                                <td className="p-2 border border-gray-400">{st.father_name || 'N/A'}</td>
                                <td className="p-2 border border-gray-400 font-mono font-bold">{st.mobile_number || 'N/A'}</td>
                                <td className="p-2 border border-gray-400 text-gray-800">{st.email || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-between items-end mt-16 pt-8 border-t-2 border-gray-900">
                    <div className="text-center font-bold text-xs text-gray-900">
                        <div className="w-52 border-b border-gray-900 mb-2"></div>
                        <span>Office Administrator Signature</span>
                    </div>
                    <div className="text-center font-bold text-xs text-gray-900">
                        <div className="w-52 border-b border-gray-900 mb-2"></div>
                        <span>Headmaster / Principal Signature</span>
                    </div>
                </div>
            </div>

            {/* Students Table (Hidden during print) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden print:hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Admission ID / User ID</th>
                                <th className="p-4">Default Password</th>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Class & Sec</th>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Assigned Email</th>
                                <th className="p-4">Mobile</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {students.map((st) => (
                                <tr key={st.user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                                    <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                        {st.admission_number || st.user_id}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold border border-amber-200/60 dark:border-amber-800/40">
                                            {st.default_password || st.user_id}
                                        </span>
                                    </td>
                                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                                        {st.name}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                            {st.class_name} - {st.section_name}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-gray-900 dark:text-white font-bold">
                                        #{st.roll_number}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300 text-xs font-medium">
                                        {st.email ? (
                                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>{st.email}</span>
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">No email</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                                        {st.mobile_number || 'N/A'}
                                    </td>
                                    <td className="p-4 text-right space-x-1.5">
                                        <button
                                            onClick={() => openPromoteModal(st)}
                                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50"
                                            title="Promote Student to Next Class"
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(st)}
                                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40"
                                            title="Edit Student Profile"
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
                                    <td colSpan={9} className="p-8 text-center text-gray-400 text-sm">
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
                                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/50 dark:to-emerald-950/50 border border-blue-100 dark:border-blue-900/60 space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                                        <span>Admission ID (Login Identifier): <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{previewAdmissionId()}</strong></span>
                                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded-md font-bold">Unique Formula</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1.5 border-t border-blue-100/70 dark:border-blue-900/50 text-blue-900 dark:text-blue-200">
                                        <span>Internal User ID: <strong className="font-mono text-brand-600 dark:text-brand-400 font-bold">{previewUserId()}</strong></span>
                                        <span className="text-[10px] bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded-md">System Key</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1.5 border-t border-blue-100/70 dark:border-blue-900/50 text-amber-900 dark:text-amber-200">
                                        <span>Default Password: <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold">{formData.password ? formData.password : previewDefaultPassword()}</strong></span>
                                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-md font-medium">Name + Class + Roll + Sec</span>
                                    </div>
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
                                        onChange={(e) => handleClassChange(e.target.value)}
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
                                        onChange={(e) => handleSectionChange(e.target.value)}
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
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                                        <span>Gmail / Email Address *</span>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Required for Password Reset OTP</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="e.g. student@gmail.com"
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
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

            {/* Promote Student Modal */}
            {promotingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md overflow-hidden my-8">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                <span>Promote Student to Next Class</span>
                            </h3>
                            <button onClick={() => setPromotingStudent(null)} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handlePromoteStudent} className="p-6 space-y-4">
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
                                <div className="font-bold text-sm text-emerald-900 dark:text-emerald-100">{promotingStudent.name}</div>
                                <div>User ID: <span className="font-mono font-bold">{promotingStudent.user_id}</span></div>
                                <div>Current Class: <span className="font-bold">{promotingStudent.class_name} - Section {promotingStudent.section_name} (Roll #{promotingStudent.roll_number})</span></div>
                                <div>Admission ID: <span className="font-mono font-bold">{promotingStudent.admission_number}</span></div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Class *</label>
                                    <select
                                        value={promoteData.target_class_name}
                                        onChange={(e) => setPromoteData({ ...promoteData, target_class_name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                        <option value="Graduated">Graduated / Passed Out</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Section *</label>
                                    <select
                                        value={promoteData.target_section_name}
                                        onChange={(e) => setPromoteData({ ...promoteData, target_section_name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    >
                                        {['A', 'B', 'C', 'D'].map((s) => (
                                            <option key={s} value={s}>Section {s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">New Roll Number in Promoted Class *</label>
                                    <input
                                        type="number"
                                        required
                                        value={promoteData.new_roll_number}
                                        onChange={(e) => setPromoteData({ ...promoteData, new_roll_number: e.target.value })}
                                        placeholder="e.g. 49"
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setPromotingStudent(null)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 transition"
                                >
                                    Confirm Student Promotion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Roll Number Conflict Warning Popup Modal */}
            {rollConflictModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-200 dark:border-amber-900/50 space-y-5 text-center relative">
                        <button
                            type="button"
                            onClick={() => setRollConflictModal(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
                            <AlertTriangle className="w-7 h-7" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Roll Number Already In Use</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                Roll Number <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">#{rollConflictModal.usedRoll}</strong> is already assigned in <strong className="text-gray-900 dark:text-white">{rollConflictModal.className} - Section {rollConflictModal.sectionName}</strong> to:
                            </p>
                            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-center space-x-2">
                                <span>👤 {rollConflictModal.existingStudent}</span>
                                <span>•</span>
                                <span>Roll #{rollConflictModal.usedRoll}</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                            <p className="font-medium">Recommended Next Available Roll Number:</p>
                            <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">
                                Roll Number #{rollConflictModal.suggestedRoll}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({ ...formData, roll_number: rollConflictModal.suggestedRoll });
                                    setRollConflictModal(null);
                                }}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition flex items-center justify-center space-x-1.5"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Use Roll #{rollConflictModal.suggestedRoll}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRollConflictModal(null)}
                                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xs transition"
                            >
                                Change Manually
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default StudentManagement;
