import React, { useState, useEffect } from 'react';
import { Search, X, User, GraduationCap, BookOpen, ChevronRight } from 'lucide-react';
import API from '../services/api';

const SearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ students: [], teachers: [], subjects: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults({ students: [], teachers: [], subjects: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await API.get(`/officer/search?q=${encodeURIComponent(query)}`);
                if (res.data.success) {
                    setResults(res.data.results);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-2xl overflow-hidden">
                {/* Search Bar Header */}
                <div className="relative flex items-center px-4 border-b border-gray-100 dark:border-gray-700">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search students, teachers, classes, subjects..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full py-4 text-base bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                    />
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results Section */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
                    {loading && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                            Searching school records...
                        </div>
                    )}

                    {!loading && !query && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                            Type a name, User ID, roll number, or subject to search...
                        </div>
                    )}

                    {!loading && query && (
                        <>
                            {/* Students */}
                            {results.students.length > 0 && (
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
                                        Students ({results.students.length})
                                    </div>
                                    <div className="space-y-1">
                                        {results.students.map((st) => (
                                            <div key={st.user_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                                        <GraduationCap className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{st.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {st.user_id} | {st.class_name} ({st.section_name}) - Roll #{st.roll_number}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Teachers */}
                            {results.teachers.length > 0 && (
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
                                        Teachers ({results.teachers.length})
                                    </div>
                                    <div className="space-y-1">
                                        {results.teachers.map((tc) => (
                                            <div key={tc.user_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{tc.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {tc.user_id} | Subject: {tc.subject || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subjects */}
                            {results.subjects.length > 0 && (
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
                                        Subjects
                                    </div>
                                    <div className="space-y-1">
                                        {results.subjects.map((sub, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{sub.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">Code: {sub.code}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.students.length === 0 && results.teachers.length === 0 && results.subjects.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No records found matching "{query}"
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
