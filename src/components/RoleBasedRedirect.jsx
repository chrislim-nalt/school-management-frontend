import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RoleBasedRedirect() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const userType = localStorage.getItem("userType");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    // Super Admin goes to admin dashboard
    if (userRole === "superadmin") {
      navigate("/admin");
      return;
    }

    // School Admin goes to school dashboard
    if (userType === "school_admin" || userRole === "admin") {
      navigate("/school-dashboard");
      return;
    }

    // Teacher goes to teacher dashboard
    if (userType === "teacher") {
      navigate("/teacher-dashboard");
      return;
    }

    // Bursar goes to transport/finance
    if (userType === "bursar") {
      navigate("/transport");
      return;
    }

    // Stock Keeper goes to inventory
    if (userType === "stock_keeper") {
      navigate("/stock");
      return;
    }

    // Customer Care goes to visitors
    if (userType === "customer_care") {
      navigate("/visitors");
      return;
    }

    // Default to main dashboard
    navigate("/dashboard");
  }, [navigate, token, userRole, userType]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}