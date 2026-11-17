import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider } from './context/StudyContext';
import Login from './pages/Login';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import MobileLandingPage from './pages/MobileLandingPage';
import ZaplinePage from './zapline/ZaplinePage';
import Dashboard from './pages/Dashboard';
import TestGenerator from './pages/TestGenerator';
import TestPage from './pages/TestPage';
import Papers from './pages/Papers';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Fees from './pages/Fees';
import SettingsPage from './pages/Settings';
import Profile from './pages/Profile';
import Leads from './pages/Leads';
import Teachers from './pages/Teachers';
import Contact from './pages/Contact';
import SuperAdmin from './pages/SuperAdmin';
import ScanReceipt from './pages/ScanReceipt';
import { homeFor } from './services/roles';
import { Spinner } from './components/Spinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <Spinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  // The super admin only manages admin accounts; institute pages are not theirs.
  if (user.role === 'superadmin') return <Navigate to="/super-admin" replace />;
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <Spinner size="lg" />
    </div>
  );
  if (user?.role !== 'superadmin') return <Navigate to="/login" replace />;
  return children;
};

// Pages that belong to the institute owner. Teachers and the front desk are sent to their own start page.
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'teacher' || user?.role === 'receptionist') return <Navigate to={homeFor(user)} replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

// Pages the front desk does not use (batches, tests, attendance).
const StaffRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'receptionist') return <Navigate to={homeFor(user)} replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

// Fee receipts are read by the admin and the front desk.
const ReceiptRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'teacher') return <Navigate to={homeFor(user)} replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

// Attendance is a teacher's job; an admin opening it is sent to the dashboard.
const TeacherRoute = ({ children }) => {
  const { user } = useAuth();
  if (user && user.role !== 'teacher') return <Navigate to={homeFor(user)} replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudyProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/" element={<Home />} />
            <Route path="/mobile" element={<MobileLandingPage />} />
            <Route path="/landing" element={<MobileLandingPage />} />
            <Route path="/edubuddy" element={<LandingPage />} />
            <Route path="/zapline" element={<ZaplinePage />} />
            <Route path="/dark" element={<ZaplinePage />} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/tests" element={<StaffRoute><TestGenerator /></StaffRoute>} />
            <Route path="/papers" element={<StaffRoute><Papers /></StaffRoute>} />
            <Route path="/scan-receipt" element={<ReceiptRoute><ScanReceipt /></ReceiptRoute>} />
            <Route path="/attendance" element={<TeacherRoute><Attendance /></TeacherRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/classes" element={<StaffRoute><Classes /></StaffRoute>} />
            <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
            <Route path="/teachers" element={<AdminRoute><Teachers /></AdminRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/profile" element={<AdminRoute><Profile /></AdminRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/test" element={<StaffRoute><TestPage /></StaffRoute>} />
            {/* Legacy redirect */}
            <Route path="/study" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
