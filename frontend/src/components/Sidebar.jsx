import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, Users, UserCheck, BookOpen, 
    Calendar, Bell, FileText, CheckSquare, KeyRound, 
    GraduationCap, Award 
} from 'lucide-react';

const Sidebar = () => {
    const { user } = useAuth();
    if (!user) return null;

    const navItems = {
        Officer: [
            { label: 'Dashboard', path: '/officer/dashboard', icon: LayoutDashboard },
            { label: 'Student Management', path: '/officer/students', icon: GraduationCap },
            { label: 'Teacher Management', path: '/officer/teachers', icon: Users },
            { label: 'Classes & Subjects', path: '/officer/class-subjects', icon: BookOpen },
            { label: 'Exams & Schedule', path: '/officer/exams', icon: Calendar },
            { label: 'Notice Board', path: '/officer/notices', icon: Bell },
        ],
        Teacher: [
            { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
            { label: 'Mark Attendance', path: '/teacher/attendance', icon: CheckSquare },
            { label: 'Homework & Notes', path: '/teacher/homework', icon: FileText },
            { label: 'Upload Results', path: '/teacher/results', icon: Award },
            { label: 'Change Password', path: '/change-password', icon: KeyRound },
        ],
        Student: [
            { label: 'My Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
            { label: 'Change Password', path: '/change-password', icon: KeyRound },
        ]
    };

    const items = navItems[user.role] || [];

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/60 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-6">
                
                {/* Role Greeting Header */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-400 dark:text-gray-400 font-medium">Logged in as</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user.name || user.userId}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                        ID: {user.userId}
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="space-y-1">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
                        {user.role} Navigation
                    </div>
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                                        isActive
                                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                                    }`
                                }
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700/60 text-center">
                <span className="text-[11px] text-gray-400">
                    School Admin System v1.0
                </span>
            </div>
        </aside>
    );
};

export default Sidebar;
