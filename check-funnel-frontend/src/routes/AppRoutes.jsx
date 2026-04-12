import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";


import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import SocialMediaAnalytics from "../pages/social-media/SocialMediaAnalytics";
import ClientDirectory from "../pages/clients/ClientDirectory";
import ClientProfile from "../pages/clients/ClientProfile";
import ClientInsights from "../pages/clients/ClientInsights";
import Reports from "../pages/reporting/Reports";
import UserManagement from "../pages/users/UserManagement";
import NotFound from "../pages/not-found/NotFound";
import PublicReport from "../pages/public/PublicReport";

/**
 * PublicRoute component that prevents logged-in users from accessing auth pages.
 */
const PublicRoute = () => {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Publicly accessible authentication routes */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
      </Route>

      {/* Publicly accessible report routes (Sidebar-less) */}
      <Route path="/public-report/:shareToken" element={<PublicReport />} />

      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/social-media" element={<SocialMediaAnalytics />} />
          <Route path="/clients" element={<ClientDirectory />} />
          <Route path="/clients/:id" element={<ClientProfile />} />
          <Route path="/clients/:id/insights" element={<ClientInsights />} />
          <Route path="/reports" element={<Reports />} />
          
          {/* Admin-only routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all route for non-existent pages */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
