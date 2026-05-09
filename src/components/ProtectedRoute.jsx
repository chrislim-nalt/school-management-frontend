import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // No token → send to appropriate login
  if (!token || token === "undefined" || token === "null") {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("schoolName");
    
    // Redirect to admin login if trying to access admin route, else main login
    if (requiredRole === "superadmin") {
      return <Navigate to="/admin-login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Check role if required
  if (requiredRole === "superadmin" && userRole !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Token exists → allow access
  return children;
}