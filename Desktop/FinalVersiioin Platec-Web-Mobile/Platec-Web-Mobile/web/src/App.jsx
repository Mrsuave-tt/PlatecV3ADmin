import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AttendanceReport from './pages/AttendanceReport';
import UserManagement from './pages/UserManagement';
import FacultyMembers from './pages/FacultyMembers';
import EnrolledStudents from './pages/EnrolledStudents';
import PresentToday from './pages/PresentToday';
import AbsentToday from './pages/AbsentToday';
import TodayAttendanceSummary from './pages/TodayAttendanceSummary';
import ProfileSettings from './pages/ProfileSettings';
import Departments from './pages/Departments';

// Component to handle automatic navigation based on role
const RoleBasedRedirect = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('RoleBasedRedirect:', { loading, user: !!user, userData });
    if (!loading && user && userData) {
      // Redirect to appropriate dashboard based on role
      if (userData.role === 'admin') {
        console.log('Navigating to /admin');
        navigate('/admin', { replace: true });
      } else if (userData.role === 'teacher') {
        console.log('Navigating to /teacher');
        navigate('/teacher', { replace: true });
      }
    }
  }, [user, userData, loading, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Redirecting...</p>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Root redirects to role-based dashboard */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Protected routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance-report"
            element={
              <ProtectedRoute>
                <AttendanceReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <ProtectedRoute requiredRole="admin">
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty-members"
            element={
              <ProtectedRoute requiredRole="admin">
                <FacultyMembers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/enrolled-students"
            element={
              <ProtectedRoute requiredRole="admin">
                <EnrolledStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/present-today"
            element={
              <ProtectedRoute>
                <PresentToday />
              </ProtectedRoute>
            }
          />

          <Route
            path="/absent-today"
            element={
              <ProtectedRoute>
                <AbsentToday />
              </ProtectedRoute>
            }
          />

          <Route
            path="/today-attendance-summary"
            element={
              <ProtectedRoute requiredRole="admin">
                <TodayAttendanceSummary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile-settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <ProtectedRoute requiredRole="admin">
                <Departments />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
