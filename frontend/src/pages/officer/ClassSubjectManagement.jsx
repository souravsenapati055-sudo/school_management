import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Check, Save, Layers } from 'lucide-react';
import API from '../../services/api';
import Toast from '../../components/Toast';

const ClassSubjectManagement = () => {
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [classSubjectsMapping, setClassSubjectsMapping] = useState({});

    const [selectedClass, setSelectedClass] = useState('Class 8');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    
    const [newClassName, setNewClassName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');
    const [toast, setToast] = useState(null);

    const fetchData = async () => {
        try {
            const classRes = await API.get('/officer/classes');
            if (classRes.data.success) {
                setClasses(classRes.data.classes);
                setSections(classRes.data.sections);
            }

            const subRes = await API.get('/officer/subjects');
            if (subRes.data.success) {
                setAllSubjects(subRes.data.subjects);
                
                // Group class-subject mapping
                const map = {};
                subRes.data.classSubjects.forEach(cs => {
                    if (!map[cs.class_name]) map[cs.class_name] = [];
                    map[cs.class_name].push(cs.subject_name);
                });
                setClassSubjectsMapping(map);

                // Initialize selected subjects for current selected class
                if (map[selectedClass]) {
                    setSelectedSubjects(map[selectedClass]);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (classSubjectsMapping[selectedClass]) {
            setSelectedSubjects(classSubjectsMapping[selectedClass]);
        } else {
            setSelectedSubjects([]);
        }
    }, [selectedClass, classSubjectsMapping]);

    const toggleSubject = (subjName) => {
        setSelectedSubjects(prev => {
            if (prev.includes(subjName)) {
                return prev.filter(s => s !== subjName);
            } else {
                return [...prev, subjName];
            }
        });
    };

    const handleSaveMapping = async () => {
        try {
            const res = await API.post('/officer/class-subjects', {
                class_name: selectedClass,
                subjects: selectedSubjects
            });
            if (res.data.success) {
                setToast({ type: 'success', message: `Configured ${selectedSubjects.length} subjects for ${selectedClass}` });
                fetchData();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to save subject mapping' });
        }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim()) return;
        try {
            const res = await API.post('/officer/classes', { class_name: newClassName.trim() });
            if (res.data.success) {
                setToast({ type: 'success', message: 'Class added' });
                setNewClassName('');
                fetchData();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to add class' });
        }
    };

    const handleAddSection = async (e) => {
        e.preventDefault();
        if (!newSectionName.trim()) return;
        try {
            const res = await API.post('/officer/sections', { class_name: selectedClass, section_name: newSectionName.trim().toUpperCase() });
            if (res.data.success) {
                setToast({ type: 'success', message: `Section added to ${selectedClass}` });
                setNewSectionName('');
                fetchData();
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to add section' });
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return;
        try {
            const res = await API.post('/officer/subjects', {
                name: newSubjectName.trim(),
                code: newSubjectCode.trim()
            });
            if (res.data.success) {
                setToast({ type: 'success', message: `New Subject '${newSubjectName.trim()}' created!` });
                setNewSubjectName('');
                setNewSubjectCode('');
                fetchData();
            }
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to add subject' });
        }
    };

    return (
        <div className="space-y-6">
            
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Class & Subject Management</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Configure curriculum subjects for every class. Only configured subjects will appear for marks uploading and PDF marksheet generation.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Panel: Class & Section Manager */}
                <div className="space-y-6">
                    
                    {/* Add Class Form */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-brand-600" />
                            <span>Create New Class</span>
                        </h3>
                        <form onSubmit={handleAddClass} className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="e.g. Class 11"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                className="flex-1 px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            />
                            <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow">
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Class Selector List */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Select Active Class</h3>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                            {classes.map((cls) => {
                                const assignedCount = (classSubjectsMapping[cls.class_name] || []).length;
                                return (
                                    <button
                                        key={cls.id}
                                        onClick={() => setSelectedClass(cls.class_name)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition ${
                                            selectedClass === cls.class_name
                                                ? 'bg-brand-600 text-white shadow-md'
                                                : 'bg-gray-50 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span>{cls.class_name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                                            selectedClass === cls.class_name ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                        }`}>
                                            {assignedCount} subjects
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add Section Form */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Add Section to {selectedClass}</h3>
                        <form onSubmit={handleAddSection} className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Section Name (e.g. C)"
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                className="flex-1 px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            />
                            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow">
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Add Custom Master Subject Form */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                            <Plus className="w-4 h-4 text-purple-600" />
                            <span>Add New Subject (Not Available)</span>
                        </h3>
                        <form onSubmit={handleAddSubject} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Subject Name (e.g. Sanskrit, EVS)"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                            />
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Code (e.g. SANS)"
                                    value={newSubjectCode}
                                    onChange={(e) => setNewSubjectCode(e.target.value)}
                                    className="flex-1 px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none uppercase"
                                />
                                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow">
                                    Add Subject
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

                {/* Right Panel: Subject Mapping Matrix */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                    Configure Curriculum Subjects for <span className="text-brand-600">{selectedClass}</span>
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Click subject pills to enable/disable for this class.
                                </p>
                            </div>
                            <button
                                onClick={handleSaveMapping}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 transition transform active:scale-95"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Subjects</span>
                            </button>
                        </div>

                        {/* Subject Checkboxes Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-6">
                            {allSubjects.map((sub) => {
                                const isSelected = selectedSubjects.includes(sub.name);
                                return (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => toggleSubject(sub.name)}
                                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition ${
                                            isSelected
                                                ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-200 shadow-sm'
                                                : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                                isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                                            }`}>
                                                {isSelected ? <Check className="w-4 h-4" /> : null}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{sub.name}</div>
                                                <div className="text-[10px] font-mono text-gray-400">Code: {sub.code}</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                        Total {selectedSubjects.length} subjects currently configured for <strong className="text-gray-800 dark:text-gray-200">{selectedClass}</strong>: {selectedSubjects.join(', ') || 'None selected'}
                    </div>

                </div>

            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        </div>
    );
};

export default ClassSubjectManagement;
