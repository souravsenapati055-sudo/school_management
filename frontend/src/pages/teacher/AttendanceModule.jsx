import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Users, Save, CheckCircle2, XCircle, Clock } from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const AttendanceModule = () => {
    const [selectedClass, setSelectedClass] = useState('Class 8');
    const [selectedSection, setSelectedSection] = useState('A');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [students, setStudents] = useState([]);
    const [attendanceState, setAttendanceState] = useState({}); // { 'SOURAV849': 'Present', ... }
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        try {
            // 1. Fetch Students in Class & Section
            const resSt = await API.get(`/teacher/students?class_name=${encodeURIComponent(selectedClass)}&section_name=${encodeURIComponent(selectedSection)}`);
            if (resSt.data.success) {
                const stList = resSt.data.students;
                setStudents(stList);

                // 2. Fetch existing attendance records for this date if present
                const resAtt = await API.get(`/teacher/attendance?class_name=${encodeURIComponent(selectedClass)}&section_name=${encodeURIComponent(selectedSection)}&date=${selectedDate}`);
                
                const initialState = {};
                if (resAtt.data.success && resAtt.data.records.length > 0) {
                    resAtt.data.records.forEach(r => {
                        initialState[r.student_id] = r.status;
                    });
                } else {
                    // Default all to Present
                    stList.forEach(s => {
                        initialState[s.user_id] = 'Present';
                    });
                }
                setAttendanceState(initialState);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentsAndAttendance();
    }, [selectedClass, selectedSection, selectedDate]);

    const handleStatusChange = (studentId, status) => {
        setAttendanceState(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const markAll = (status) => {
        const updated = {};
        students.forEach(s => {
            updated[s.user_id] = status;
        });
        setAttendanceState(updated);
    };

    const handleSaveAttendance = async () => {
        try {
            const records = Object.keys(attendanceState).map(stId => ({
                student_id: stId,
                status: attendanceState[stId]
            }));

            const res = await API.post('/teacher/attendance', {
                class_name: selectedClass,
                section_name: selectedSection,
                date: selectedDate,
                attendance_records: records
            });

            if (res.data.success) {
                setToast({ type: 'success', message: res.data.message });
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Error saving attendance' });
        }
    };

    // Calculate Summary Stats
    const totalCount = students.length;
    const presentCount = Object.values(attendanceState).filter(s => s === 'Present').length;
    const absentCount = Object.values(attendanceState).filter(s => s === 'Absent').length;
    const leaveCount = Object.values(attendanceState).filter(s => s === 'Leave').length;
    const attendancePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-6">
            
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Student Attendance</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select Class, Section, and Date to record student attendance. Attendance percentages update automatically.
                </p>
            </div>

            {/* Selection Bar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Class</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
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
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                    >
                        {['A', 'B', 'C', 'D'].map(s => (
                            <option key={s} value={s}>Section {s}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Attendance Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                    />
                </div>
            </div>

            {/* Summary Bar & Quick Controls */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                
                <div className="flex items-center space-x-6">
                    <div>
                        <div className="text-xs text-gray-400">Total Enrolled</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{totalCount}</div>
                    </div>
                    <div>
                        <div className="text-xs text-emerald-500">Present</div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</div>
                    </div>
                    <div>
                        <div className="text-xs text-rose-500">Absent</div>
                        <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{absentCount}</div>
                    </div>
                    <div>
                        <div className="text-xs text-amber-500">Leave</div>
                        <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{leaveCount}</div>
                    </div>
                    <div className="pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-blue-500">Attendance %</div>
                        <div className="text-lg font-black text-brand-600 dark:text-brand-400">{attendancePercent}%</div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button onClick={() => markAll('Present')} className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800">
                        Mark All Present
                    </button>
                    <button onClick={() => markAll('Absent')} className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-800">
                        Mark All Absent
                    </button>
                    <button
                        onClick={handleSaveAttendance}
                        className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Attendance</span>
                    </button>
                </div>
            </div>

            {/* Students List Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Roll #</th>
                                <th className="p-4">User ID</th>
                                <th className="p-4">Student Name</th>
                                <th className="p-4 text-center">Status Selection</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {students.map((st) => {
                                const status = attendanceState[st.user_id] || 'Present';
                                return (
                                    <tr key={st.user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                                        <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">
                                            #{st.roll_number}
                                        </td>
                                        <td className="p-4 font-mono text-brand-600 dark:text-brand-400 font-semibold text-xs">
                                            {st.user_id}
                                        </td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                                            {st.name}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => handleStatusChange(st.user_id, 'Present')}
                                                    className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition ${
                                                        status === 'Present'
                                                            ? 'bg-emerald-600 text-white shadow-md'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Present</span>
                                                </button>

                                                <button
                                                    onClick={() => handleStatusChange(st.user_id, 'Absent')}
                                                    className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition ${
                                                        status === 'Absent'
                                                            ? 'bg-rose-600 text-white shadow-md'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>Absent</span>
                                                </button>

                                                <button
                                                    onClick={() => handleStatusChange(st.user_id, 'Leave')}
                                                    className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition ${
                                                        status === 'Leave'
                                                            ? 'bg-amber-500 text-white shadow-md'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Leave</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {students.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                                        No students enrolled in {selectedClass} - {selectedSection}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default AttendanceModule;
