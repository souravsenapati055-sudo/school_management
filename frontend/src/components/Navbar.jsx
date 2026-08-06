import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Search, LogOut, User, School, Bell } from 'lucide-react';
import SearchModal from './SearchModal';

const Navbar = () => {
    const { user, logout, darkMode, toggleDarkMode } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 py-3 transition-colors">
                <div className="flex items-center justify-between">
                    
                    {/* Left: Brand & Mobile Menu */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <School className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white leading-none block">
                                GREENWOOD HIGH
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                School Management Portal
                            </span>
                        </div>
                    </div>

                    {/* Center: Global Search Bar */}
                    <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200/70 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-600/50 transition"
                        >
                            <span className="flex items-center space-x-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <span>Search students, teachers, subjects...</span>
                            </span>
                            <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 font-mono">
                                Ctrl K
                            </kbd>
                        </button>
                    </div>

                    {/* Right Controls: Dark Mode, Search (Mobile), User Dropdown */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="md:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        <button
                            onClick={toggleDarkMode}
                            className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            title="Toggle Dark/Light Mode"
                        >
                            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                        </button>

                        {/* User Profile Pill */}
                        {user && (
                            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                                <div className="hidden sm:block text-right">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                        {user.name || user.userId}
                                    </div>
                                    <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                                        user.role === 'Officer' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                                        user.role === 'Teacher' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                    }`}>
                                        {user.role}
                                    </span>
                                </div>

                                <button
                                    onClick={logout}
                                    className="flex items-center space-x-1 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition font-medium text-sm"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
};

export default Navbar;
