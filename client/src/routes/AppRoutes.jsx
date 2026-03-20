import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth.js";

import HomePage from "../pages/HomePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import TestPage from "../pages/TestPage.jsx";
import LeaderboardPage from "../pages/LeaderboardPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import AdminDashboardPage from "../pages/AdminDashboardPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return (
          <div className="flex justify-center items-center h-64">
            Loading...
          </div>
        );
    }
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth();
    if (loading) {
        return (
          <div className="flex justify-center items-center h-64">
            Loading...
          </div>
        );
    }
    return isAuthenticated && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

const AppRoutes = () => {
    return (
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Private Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/test/:testId"
          element={
            <PrivateRoute>
              <TestPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />

        {/* Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    );
};

export default AppRoutes;
