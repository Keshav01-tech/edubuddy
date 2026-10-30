import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider } from './context/StudyContext';
import Login from './pages/Login';
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
import Contact from './pages/Contact';
import { Spinner } from './components/Spinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <Spinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudyProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/" element={<MobileLandingPage />} />
            <Route path="/mobile" element={<MobileLandingPage />} />
            <Route path="/landing" element={<MobileLandingPage />} />
            <Route path="/edubuddy" element={<LandingPage />} />
            <Route path="/zapline" element={<ZaplinePage />} />
            <Route path="/dark" element={<ZaplinePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tests" element={<ProtectedRoute><TestGenerator /></ProtectedRoute>} />
            <Route path="/papers" element={<ProtectedRoute><Papers /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
            <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/test" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
            {/* Legacy redirect */}
            <Route path="/study" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
