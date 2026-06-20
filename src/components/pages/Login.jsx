import { useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", schoolCode: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Forgot Password Modal states...
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetVerified, setResetVerified] = useState(false);
  
  // Forgot School Code Modal
  const [showForgotSchoolCode, setShowForgotSchoolCode] = useState(false);
  const [schoolCodeEmail, setSchoolCodeEmail] = useState("");
  const [schoolCodeQuestion, setSchoolCodeQuestion] = useState("");
  const [schoolCodeAnswer, setSchoolCodeAnswer] = useState("");
  const [recoveredSchoolCode, setRecoveredSchoolCode] = useState(null);
  const [recoveredSchoolName, setRecoveredSchoolName] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryStep, setRecoveryStep] = useState("email");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/auth/login", form);
      
      // Store token with Bearer prefix
      const token = res.data.token;
      localStorage.setItem("token", token.startsWith("Bearer ") ? token : `Bearer ${token}`);
      localStorage.setItem("userRole", res.data.user.role);
      localStorage.setItem("userType", res.data.user.userType || res.data.user.role);
      localStorage.setItem("userName", res.data.user.name);
      localStorage.setItem("userEmail", res.data.user.email);
      localStorage.setItem("schoolCode", form.schoolCode);
      localStorage.setItem("schoolName", res.data.user.school?.name || "");
      
      console.log("✅ Login successful, token stored");
      console.log("User Role:", res.data.user.role);
      console.log("User Type:", res.data.user.userType);
      
      // Redirect based on role
      if (res.data.user.role === "superadmin") {
        navigate("/admin");
      } else {
        // For non-superadmin, redirect to role-specific dashboard
        const userType = res.data.user.userType || res.data.user.role;
        
        if (userType === "teacher") {
          navigate("/teacher-dashboard");
        } else if (userType === "school_admin" || userType === "admin") {
          navigate("/school-dashboard");
        } else if (userType === "bursar") {
          navigate("/transport");
        } else if (userType === "customer_care") {
          navigate("/visitors");
        } else if (userType === "stock_keeper") {
          navigate("/stock");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Flow (keep your existing code)
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    
    try {
      const res = await API.post("/auth/request-password-reset", { email: forgotEmail });
      setSecurityQuestion(res.data.securityQuestion);
      setResetToken(res.data.resetToken);
      setForgotStep("security");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    setErrorMessage("");
    
    try {
      await API.post("/auth/verify-and-reset-password", {
        email: forgotEmail,
        answer: securityAnswer,
        resetToken: resetToken,
        newPassword: newPassword,
      });
      setResetVerified(true);
      setForgotStep("reset");
      setTimeout(() => {
        setShowForgotPassword(false);
        resetForgotState();
      }, 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid security answer");
    } finally {
      setLoading(false);
    }
  };

  const resetForgotState = () => {
    setForgotStep("email");
    setForgotEmail("");
    setSecurityQuestion("");
    setSecurityAnswer("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setResetVerified(false);
    setErrorMessage("");
  };

  // Forgot School Code Flow
  const handleSchoolCodeRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    
    try {
      const res = await API.post("/auth/request-school-code-recovery", { email: schoolCodeEmail });
      if (res.data.requiresSecurityQuestion) {
        setSchoolCodeQuestion(res.data.securityQuestion);
        setRecoveryToken(res.data.recoveryToken);
        setRecoveryStep("security");
      } else {
        setErrorMessage("No security questions set. Please contact your administrator.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySchoolCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    
    try {
      const res = await API.post("/auth/verify-security-answer", {
        email: schoolCodeEmail,
        answer: schoolCodeAnswer,
        recoveryToken: recoveryToken,
      });
      setRecoveredSchoolCode(res.data.schoolCode);
      setRecoveredSchoolName(res.data.schoolName);
      setRecoveryStep("result");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid security answer");
    } finally {
      setLoading(false);
    }
  };

  const resetSchoolCodeState = () => {
    setShowForgotSchoolCode(false);
    setSchoolCodeEmail("");
    setSchoolCodeQuestion("");
    setSchoolCodeAnswer("");
    setRecoveredSchoolCode(null);
    setRecoveredSchoolName("");
    setRecoveryToken("");
    setRecoveryStep("email");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      {/* Floating Shapes */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-white/5 rounded-full animate-float"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/5 rounded-full animate-float animation-delay-1000"></div>

      <div className="bg-white/10 backdrop-blur-xl shadow-2xl rounded-2xl p-6 w-full max-w-sm relative z-10 border border-white/20">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-60 animate-ping"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full p-3 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            School 
          </h2>
          <p className="text-indigo-200 text-sm mt-1">Management System</p>
          <div className="flex justify-center mt-3">
            <div className="h-0.5 w-12 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-400 text-red-200 px-4 py-2 rounded-lg text-sm text-center animate-shake">
              ❌ {errorMessage}
            </div>
          )}

          <div className="relative group">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-400 transition-colors text-lg">🏫</span>
            <input
              type="text"
              name="schoolCode"
              placeholder="School Code"
              value={form.schoolCode}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-400 transition-colors">📧</span>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-400 transition-colors">🔒</span>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </div>
            ) : (
              "Login to Dashboard"
            )}
          </button>
        </form>

        <div className="flex justify-between mt-5 text-sm">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-indigo-300 hover:text-white transition-colors duration-300 flex items-center gap-1 group"
          >
            <span className="group-hover:translate-x-[-2px] transition-transform">🔐</span>
            Forgot Password?
          </button>
          <button
            onClick={() => setShowForgotSchoolCode(true)}
            className="text-indigo-300 hover:text-white transition-colors duration-300 flex items-center gap-1 group"
          >
            <span className="group-hover:translate-x-[-2px] transition-transform">🏫</span>
            Forgot School Code?
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          {/* <Link to="/admin-login" className="text-indigo-300 hover:text-white text-sm transition-colors inline-flex items-center gap-1 group">
            <span>👑</span>
            Super Admin Login
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link> */}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                <h3 className="text-lg font-bold text-white">Reset Password</h3>
              </div>
            </div>

            <div className="p-6">
              {errorMessage && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm text-center">
                  ❌ {errorMessage}
                </div>
              )}

              {forgotStep === "email" && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Continue"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-slate-500 text-sm mt-2 hover:text-slate-700 transition"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {forgotStep === "security" && (
                <form onSubmit={handleVerifyAndReset} className="space-y-4">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800 font-medium">Security Question:</p>
                    <p className="text-sm text-slate-700 mt-1 font-semibold">{securityQuestion}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Answer</label>
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              )}

              {forgotStep === "reset" && resetVerified && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <span className="text-3xl">✅</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Password Reset Successfully!</h3>
                  <p className="text-sm text-slate-500 mb-4">You can now login with your new password.</p>
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forgot School Code Modal */}
      {showForgotSchoolCode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏫</span>
                <h3 className="text-lg font-bold text-white">Recover School Code</h3>
              </div>
            </div>

            <div className="p-6">
              {errorMessage && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm text-center">
                  ❌ {errorMessage}
                </div>
              )}

              {recoveryStep === "email" && (
                <form onSubmit={handleSchoolCodeRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={schoolCodeEmail}
                      onChange={(e) => setSchoolCodeEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Continue"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetSchoolCodeState()}
                    className="w-full text-slate-500 text-sm mt-2 hover:text-slate-700 transition"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {recoveryStep === "security" && (
                <form onSubmit={handleVerifySchoolCode} className="space-y-4">
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800 font-medium">Security Question:</p>
                    <p className="text-sm text-slate-700 mt-1 font-semibold">{schoolCodeQuestion}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Answer</label>
                    <input
                      type="text"
                      value={schoolCodeAnswer}
                      onChange={(e) => setSchoolCodeAnswer(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Get Code"}
                  </button>
                </form>
              )}

              {recoveryStep === "result" && recoveredSchoolCode && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">School Code Found!</h3>
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-600">School Name:</p>
                    <p className="font-bold text-slate-800 text-lg">{recoveredSchoolName}</p>
                    <p className="text-sm text-slate-600 mt-2">School Code:</p>
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-2 mt-1">
                      <code className="text-2xl font-mono font-bold text-purple-700">{recoveredSchoolCode}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(recoveredSchoolCode);
                      alert("School code copied to clipboard!");
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 rounded-lg font-semibold mb-2 hover:shadow-lg transition-all"
                  >
                    📋 Copy School Code
                  </button>
                  <button
                    onClick={() => resetSchoolCodeState()}
                    className="w-full text-slate-500 text-sm hover:text-slate-700 transition"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-shake { animation: shake 0.3s ease-out; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}