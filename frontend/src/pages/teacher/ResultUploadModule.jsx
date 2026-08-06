import React, { useState, useEffect } from 'react';
import { Award, Save, CheckCircle2, User, BookOpen, Sparkles } from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const ResultUploadModule = () => {
    const [exams, setExams] = useState([]);
    const [selectedYear, setSelectedYear] = useState('2026');
    const [selectedExam, setSelectedExam] = useState('Half Yearly Exam');
    const [selectedClass, setSelectedClass] = useState('Class 8');
    const [selectedSection, setSelectedSection] = useState('A');
    
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    
    // Configured subjects for selected class (e.g. English, Bengali, Mathematics, Physics, Chemistry, Biology, History, Geography, Computer)
    const [configuredSubjects, setConfiguredSubjects] = useState([]);
    const [marksInput, setMarksInput] = useState({}); // { 'English': 88, 'Mathematics': 98, ... }
    const [remarks, setRemarks] = useState('Outstanding performance!');
    
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Initial load: Fetch exams
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await API.get('/officer/exams');
                if (res.data.success && res.data.exams.length > 0) {
                    setExams(res.data.exams);
                    setSelectedExam(res.data.exams[0].name);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchExams();
    }, []);

    // Load configured subjects for class
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await API.get(`/teacher/class-subjects/${encodeURIComponent(selectedClass)}`);
                if (res.data.success) {
                    setConfiguredSubjects(res.data.subjects);
                    
                    // Initialize empty marks for subjects
                    const initialMarks = {};
                    res.data.subjects.forEach(s => {
                        initialMarks[s] = 85; // default preset for quick demo entry
                    });
                    setMarksInput(initialMarks);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchSubjects();
    }, [selectedClass]);

    // Load students for class & section
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await API.get(`/teacher/students?class_name=${encodeURIComponent(selectedClass)}&section_name=${encodeURIComponent(selectedSection)}`);
                if (res.data.success) {
                    setStudents(res.data.students);
                    if (res.data.students.length > 0) {
                        setSelectedStudentId(res.data.students[0].user_id);
                    } else {
                        setSelectedStudentId('');
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchStudents();
    }, [selectedClass, selectedSection]);

    const handleMarkChange = (subject, value) => {
        setMarksInput(prev => ({
            ...prev,
            [subject]: value
        }));
    };

    const handleUploadResults = async (e) => {
        e.preventDefault();
        if (!selectedStudentId || configuredSubjects.length === 0) {
            setToast({ type: 'error', message: 'Select a valid student and ensure class subjects are configured.' });
            return;
        }

        setLoading(true);
        try {
            const marksArray = configuredSubjects.map(sub => ({
                subject_name: sub,
                marks_obtained: parseFloat(marksInput[sub] || 0),
                max_marks: 100
            }));

            const res = await API.post('/teacher/marks', {
                exam_name: selectedExam,
                class_name: selectedClass,
                section_name: selectedSection,
                student_id: selectedStudentId,
                marks_data: marksArray,
                remarks
            });

            if (res.data.success) {
                setToast({ 
                    type: 'success', 
                    message: `Result saved! Total: ${res.data.summary.totalObtained}, Percentage: ${res.data.summary.percentage}%, Grade: ${res.data.summary.grade}` 
                });
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Error saving marks' });
        } finally {
            setLoading(false);
        }
    };

    // Calculate live total & percentage
    let liveTotal = 0;
    configuredSubjects.forEach(s => {
        liveTotal += parseFloat(marksInput[s] || 0);
    });
    const maxPossible = configuredSubjects.length * 100;
    const livePercent = maxPossible > 0 ? ((liveTotal / maxPossible) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6 max-w-4xl">
            
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Student Academic Results</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter exam marks for subjects dynamically configured by the Officer for each class.
                </p>
            </div>

            {/* Selector Grid */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none"
                    >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Exam Term</label>
                    <select
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                    >
                        {exams.map(ex => (
                            <option key={ex.id} value={ex.name}>{ex.name}</option>
                        ))}
                    </select>
                </div>

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
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Student</label>
                    <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-semibold focus:outline-none"
                    >
                        {students.map(st => (
                            <option key={st.user_id} value={st.user_id}>
                                #{st.roll_number} {st.name} ({st.user_id})
                            </option>
                        ))}
                        {students.length === 0 && <option value="">No students in section</option>}
                    </select>
                </div>
            </div>

            {/* Marks Input Panel */}
            <form onSubmit={handleUploadResults} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                            <span>Configured Subjects Marks ({configuredSubjects.length} subjects for {selectedClass})</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Maximum marks per subject = 100</p>
                    </div>

                    <div className="flex items-center space-x-4 bg-purple-50 dark:bg-purple-950/50 px-4 py-2 rounded-xl border border-purple-100 dark:border-purple-900/60">
                        <div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold uppercase">Total Score</div>
                            <div className="text-base font-extrabold text-purple-900 dark:text-purple-100">{liveTotal} / {maxPossible}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold uppercase">Percentage</div>
                            <div className="text-base font-extrabold text-purple-900 dark:text-purple-100">{livePercent}%</div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Subject Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {configuredSubjects.map((subjectName) => (
                        <div key={subjectName} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-700">
                            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">{subjectName}</label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                required
                                value={marksInput[subjectName] || ''}
                                onChange={(e) => handleMarkChange(subjectName, e.target.value)}
                                className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    ))}
                    {configuredSubjects.length === 0 && (
                        <div className="col-span-3 text-center py-6 text-rose-500 text-sm">
                            No subjects configured for {selectedClass} yet! Ask Officer to assign subjects in Class & Subject Management.
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Teacher Remarks</label>
                    <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Excellent conceptual clarity and math skills."
                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={loading || configuredSubjects.length === 0}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/30 transition transform active:scale-95 flex items-center space-x-2 disabled:opacity-50"
                    >
                        <Award className="w-4 h-4" />
                        <span>{loading ? 'Saving Marks...' : 'Save & Publish Marks'}</span>
                    </button>
                </div>

            </form>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default ResultUploadModule;
