import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, FileText, Award, Users, BookOpen, ChevronRight } from 'lucide-react';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const quickActions = [
        {
            title: 'Mark Student Attendance',
            desc: 'Select Class, Section & Date to record Present/Absent status.',
            icon: CheckSquare,
            color: 'from-emerald-500 to-teal-600',
            route: '/teacher/attendance'
        },
        {
            title: 'Upload Homework & Notes',
            desc: 'Post assignments, tasks, and notes for your assigned classes.',
            icon: FileText,
            color: 'from-blue-500 to-indigo-600',
            route: '/teacher/homework'
        },
        {
            title: 'Upload Student Marks',
            desc: 'Enter exam marks for Officer-configured subjects per class.',
            icon: Award,
            color: 'from-purple-500 to-pink-600',
            route: '/teacher/results'
        }
    ];

    return (
        <div className="space-y-6">
            
            {/* Banner Header */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex items-center justify-between">
                <div className="space-y-1">
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">Teacher Portal</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome back, {user?.name || user?.userId}!</h1>
                    <p className="text-xs text-emerald-100 font-medium">Subject Specialist: {user?.subject || 'Mathematics & Science'}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                </div>
            </div>

            {/* Quick Action Cards */}
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Core Academic Workflows</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickActions.map((qa, idx) => {
                        const Icon = qa.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => navigate(qa.route)}
                                className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-xl text-left transition transform hover:-translate-y-1 flex flex-col justify-between"
                            >
                                <div>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${qa.color} text-white flex items-center justify-center mb-4 shadow-md`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{qa.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{qa.desc}</p>
                                </div>

                                <div className="mt-6 flex items-center text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition">
                                    <span>Launch Module</span>
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default TeacherDashboard;
