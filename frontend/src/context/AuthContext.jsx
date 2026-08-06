import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('school_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem('school_token') || null);
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('school_theme') === 'dark');

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('school_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('school_theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    const login = async (userId, password) => {
        setLoading(true);
        try {
            const res = await API.post('/auth/login', { userId, password });
            if (res.data.success) {
                const { accessToken, user: userProfile } = res.data;
                setToken(accessToken);
                setUser(userProfile);
                localStorage.setItem('school_token', accessToken);
                localStorage.setItem('school_user', JSON.stringify(userProfile));
                return { success: true, user: userProfile };
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Login failed. Please check credentials.'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('school_token');
        localStorage.removeItem('school_user');
    };

    const refreshProfile = async () => {
        if (!token) return;
        try {
            const res = await API.get('/auth/profile');
            if (res.data.success) {
                setUser(res.data.user);
                localStorage.setItem('school_user', JSON.stringify(res.data.user));
            }
        } catch (err) {
            console.error('Failed to refresh profile:', err);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            darkMode,
            toggleDarkMode,
            login,
            logout,
            refreshProfile,
            setUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
