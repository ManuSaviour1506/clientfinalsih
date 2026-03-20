import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

import HomePage            from '../pages/HomePage.jsx';
import LoginPage           from '../pages/LoginPage.jsx';
import RegisterPage        from '../pages/RegisterPage.jsx';
import DashboardPage       from '../pages/DashboardPage.jsx';
import LeaderboardPage     from '../pages/LeaderboardPage.jsx';
import ProfilePage         from '../pages/ProfilePage.jsx';
import AdminDashboardPage  from '../pages/AdminDashboardPage.jsx';
import FeedPage            from '../pages/FeedPage.jsx';
// BUG FIX 1: TestPage imported but routed to /test/:testId — this page is
// now redundant since all test uploads happen via the UploadModal on
// DashboardPage. Kept the route for direct deep-link access.
import TestPage            from '../pages/TestPage.jsx';
import NotFoundPage        from '../pages/NotFoundPage.jsx';
import Spinner             from '../components/common/Spinner.jsx';

// ── Route Guards ──────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    // BUG FIX 2: AdminRoute redirected to /dashboard on non-admin — but if
    // user is not logged in at all, it should go to /login, not /dashboard.
    // Fixed with explicit auth check first.
    return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

// BUG FIX 3: Already-authenticated users could still visit /login and /register.
// This guard redirects them to /dashboard instead.
const GuestRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* ── Public Routes ─────────────────────────── */}
            <Route path="/"            element={<HomePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* ── Guest-only Routes (redirect if logged in) */}
            <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* ── Private Routes ────────────────────────── */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/profile"   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/feed"      element={<PrivateRoute><FeedPage /></PrivateRoute>} />

            {/* BUG FIX 4: /test/:testId route existed but wasn't linked from
                anywhere in the app — users could only access it by knowing the URL.
                Kept for deep-linking but primary flow is via Dashboard modal. */}
            <Route path="/test/:testId" element={<PrivateRoute><TestPage /></PrivateRoute>} />

            {/* ── Admin Routes ──────────────────────────── */}
            <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

            {/* ── Fallback ──────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRoutes;