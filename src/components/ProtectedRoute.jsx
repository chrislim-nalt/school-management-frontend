import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole, requiredUserType }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const userType = localStorage.getItem("userType");

  // No token → send to appropriate login
  if (!token || token === "undefined" || token === "null") {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userType");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
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
    return <Navigate to="/" replace />;
  }

  // Check userType if required (for school-level role checking)
  if (requiredUserType && requiredUserType.length > 0) {
    const hasRequiredType = requiredUserType.includes(userType);
    if (!hasRequiredType && userRole !== "superadmin") {
      // Redirect to role-appropriate dashboard
      if (userType === "teacher") {
        return <Navigate to="/teacher-dashboard" replace />;
      }
      if (userType === "school_admin" || userType === "admin") {
        return <Navigate to="/school-dashboard" replace />;
      }
      if (userType === "bursar") {
        return <Navigate to="/transport" replace />;
      }
      if (userType === "customer_care") {
        return <Navigate to="/visitors" replace />;
      }
      if (userType === "stock_keeper") {
        return <Navigate to="/stock" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Token exists → allow access
  return children;
}