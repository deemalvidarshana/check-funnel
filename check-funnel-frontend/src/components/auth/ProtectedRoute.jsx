import { Navigate, Outlet } from "react-router-dom";
import { canViewFeature } from "../../utils/permissions";

/**
 * ProtectedRoute component that checks for authentication and optional role requirements.
 * If the user has a token in localStorage, it allows access.
 * If adminOnly is true, it further checks if the user role is 'admin'.
 */
const ProtectedRoute = ({ adminOnly = false, feature = null, manageOnly = false }) => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  
  // If there is no token, redirect to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If adminOnly is required, check the user role
  if (adminOnly) {
    try {
      const user = JSON.parse(storedUser);
      if (user?.role !== "admin") {
        // Non-admins trying to access admin pages are redirected to dashboard
        return <Navigate to="/dashboard" replace />;
      }
    } catch (error) {
      console.error("Failed to parse user role for protection", error);
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (feature) {
    try {
      const user = JSON.parse(storedUser);
      if (!canViewFeature(feature, user)) {
        return <Navigate to="/dashboard" replace />;
      }
      if (manageOnly && !(user?.role === "admin" || (user?.role === "manager" && user?.featureAccess?.includes(feature)))) {
        return <Navigate to="/dashboard" replace />;
      }
    } catch (error) {
      console.error("Failed to parse user permissions", error);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If all checks pass, render the nested routes
  return <Outlet />;
};

export default ProtectedRoute;
