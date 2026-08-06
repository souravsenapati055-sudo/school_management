import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, token } = useAuth();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Force Change Password logic
    if (user.firstLogin && window.location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard if role unauthorized
        if (user.role === 'Officer') return <Navigate to="/officer/dashboard" replace />;
        if (user.role === 'Teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user.role === 'Student') return <Navigate to="/student/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
