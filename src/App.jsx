import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider } from './context/StudyContext';
import { I18nProvider } from './i18n';
import { homeFor } from './services/roles';
import { Spinner } from './components/Spinner';
import { useRoleManifest } from './services/pwa';

// The home page loads right away. Every other page is downloaded only when it is
// opened, so a visitor on a phone gets the landing page much faster.
const Login = lazy(() => import('./pages/Login'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MobileLandingPage = lazy(() => import('./pages/MobileLandingPage'));
const ZaplinePage = lazy(() => import('./zapline/ZaplinePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TestGenerator = lazy(() => import('./pages/TestGenerator'));
const TestPage = lazy(() => import('./pages/TestPage'));
const Papers = lazy(() => import('./pages/Papers'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Students = lazy(() => import('./pages/Students'));
const Classes = lazy(() => import('./pages/Classes'));
const Fees = lazy(() => import('./pages/Fees'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Leads = lazy(() => import('./pages/Leads'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Contact = lazy(() => import('./pages/Contact'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const ScanReceipt = lazy(() => import('./pages/ScanReceipt'));
const Marks = lazy(() => import('./pages/Marks'));
const Notes = lazy(() => import('./pages/Notes'));
const Quizzes = lazy(() => import('./pages/Quizzes'));
const ParentPanel = lazy(() => import('./pages/ParentPanel'));

// The marketing home page is a static page (public/home.html, built with the kit in public/kit) so phones load it
// without the app's JavaScript. Vercel serves it at "/"; a link inside the app to "/" loads it the same way.
function StaticHome() {
  useEffect(() => {
    window.location.replace('/home.html');
  }, []);
  return null;
}

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-paper">
    <Spinner size="lg" />
  </div>
);

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
  // A parent only has the parent panel.
  if (user.role === 'parent') return <Navigate to="/parent" replace />;
  return children;
};

const ParentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <Spinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'parent') return <Navigate to={homeFor(user)} replace />;
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

// Fees and fee receipts belong to the admin and the front desk.
const ReceiptRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'teacher') return <Navigate to={homeFor(user)} replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

// The Meta Pixel in index.html records the first page. In this single-page app,
// later page changes don't reload, so send a PageView for each one here.
function PixelPageViews() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try { if (typeof window.fbq === 'function') window.fbq('track', 'PageView'); } catch { /* ignore */ }
  }, [pathname]);
  return null;
}

// The admin, a teacher or a parent installs their own app; the front desk uses the admin app.
function RoleApp() {
  const { user } = useAuth();
  useRoleManifest(user?.role === 'receptionist' ? 'admin' : user?.role);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <PixelPageViews />
      <AuthProvider>
        <RoleApp />
        <I18nProvider>
        <StudyProvider>
          <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/" element={<StaticHome />} />
            <Route path="/mobile" element={<MobileLandingPage />} />
            <Route path="/landing" element={<MobileLandingPage />} />
            <Route path="/edubuddy" element={<LandingPage />} />
            <Route path="/zapline" element={<ZaplinePage />} />
            <Route path="/dark" element={<ZaplinePage />} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/tests" element={<StaffRoute><TestGenerator /></StaffRoute>} />
            <Route path="/papers" element={<StaffRoute><Papers /></StaffRoute>} />
            <Route path="/marks" element={<StaffRoute><Marks /></StaffRoute>} />
            <Route path="/notes" element={<StaffRoute><Notes /></StaffRoute>} />
            <Route path="/quizzes" element={<StaffRoute><Quizzes /></StaffRoute>} />
            <Route path="/parent" element={<ParentRoute><ParentPanel /></ParentRoute>} />
            <Route path="/scan-receipt" element={<ReceiptRoute><ScanReceipt /></ReceiptRoute>} />
            <Route path="/attendance" element={<StaffRoute><Attendance /></StaffRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/classes" element={<StaffRoute><Classes /></StaffRoute>} />
            <Route path="/fees" element={<ReceiptRoute><Fees /></ReceiptRoute>} />
            <Route path="/teachers" element={<AdminRoute><Teachers /></AdminRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/profile" element={<AdminRoute><Profile /></AdminRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/test" element={<StaffRoute><TestPage /></StaffRoute>} />
            {/* Legacy redirect */}
            <Route path="/study" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </StudyProvider>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
