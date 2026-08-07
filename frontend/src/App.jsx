import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import StudentManagement from './pages/officer/StudentManagement';
import TeacherManagement from './pages/officer/TeacherManagement';
import ClassSubjectManagement from './pages/officer/ClassSubjectManagement';
import ExamManagement from './pages/officer/ExamManagement';
import NoticeManagement from './pages/officer/NoticeManagement';
import OfficerProfile from './pages/officer/OfficerProfile';
import TopperLeaderboard from './pages/officer/TopperLeaderboard';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AttendanceModule from './pages/teacher/AttendanceModule';
import HomeworkModule from './pages/teacher/HomeworkModule';
import ResultUploadModule from './pages/teacher/ResultUploadModule';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';

// Dashboard Shell Layout
const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Password Reset Route */}
          <Route element={<ProtectedRoute allowedRoles={['Officer', 'Teacher', 'Student']} />}>
            <Route path="/change-password" element={<ForceChangePasswordPage />} />
          </Route>

          {/* Officer Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Officer']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/officer/dashboard" element={<OfficerDashboard />} />
              <Route path="/officer/toppers" element={<TopperLeaderboard />} />
              <Route path="/officer/students" element={<StudentManagement />} />
              <Route path="/officer/teachers" element={<TeacherManagement />} />
              <Route path="/officer/class-subjects" element={<ClassSubjectManagement />} />
              <Route path="/officer/exams" element={<ExamManagement />} />
              <Route path="/officer/notices" element={<NoticeManagement />} />
              <Route path="/officer/profile" element={<OfficerProfile />} />
            </Route>
          </Route>

          {/* Teacher Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/toppers" element={<TopperLeaderboard />} />
              <Route path="/teacher/attendance" element={<AttendanceModule />} />
              <Route path="/teacher/homework" element={<HomeworkModule />} />
              <Route path="/teacher/results" element={<ResultUploadModule />} />
            </Route>
          </Route>

          {/* Student Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
