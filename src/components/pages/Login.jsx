import { useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", schoolCode: "" });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("login");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState("email"); // email, otp, reset
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotSchoolCode, setShowForgotSchoolCode] = useState(false);
  const [forgotSchoolCodeEmail, setForgotSchoolCodeEmail] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/auth/login", form);
      setUserEmail(form.email);
      setSchoolInfo({
        schoolName: res.data.schoolName,
        schoolCode: res.data.schoolCode,
      });
      setStep("otp");
      startResendTimer();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Verify Login OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
  
    try {
      const res = await API.post("/auth/verify-login-otp", { 
        email: userEmail, 
        otp,
        schoolCode: form.schoolCode 
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("schoolCode", form.schoolCode);
      localStorage.setItem("schoolName", res.data.user?.school?.name || schoolInfo?.schoolName);
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await API.post("/auth/resend-otp", { email: userEmail });
      startResendTimer();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // ==================== FORGOT PASSWORD ====================
  
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      await API.post("/auth/forgot-password", { email: forgotSchoolCodeEmail });
      setForgotStep("otp");
      startResendTimer();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      await API.post("/auth/verify-reset-otp", { 
        email: forgotSchoolCodeEmail, 
        otp: resetOtp 
      });
      setForgotStep("reset");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
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
      await API.post("/auth/reset-password", { 
        email: forgotSchoolCodeEmail, 
        otp: resetOtp,
        newPassword: newPassword
      });
      setShowForgotPassword(false);
      setForgotStep("email");
      setResetOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setForgotSchoolCodeEmail("");
      alert("Password reset successfully! Please login with your new password.");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // ==================== FORGOT SCHOOL CODE ====================
  
  const handleForgotSchoolCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      await API.post("/auth/forgot-school-code", { email: forgotSchoolCodeEmail });
      alert("School code sent to your email!");
      setShowForgotSchoolCode(false);
      setForgotSchoolCodeEmail("");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to send school code");
    } finally {
      setLoading(false);
    }
  };

  // OTP Step
  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-sm relative z-10 transition-all duration-500 hover:shadow-2xl">
          <div className="text-center mb-5">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-40 animate-ping"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-green-500 rounded-full p-2 shadow-lg animate-bounce-slow">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] whitespace-nowrap">
                Verify Your Identity
              </h2>
            </div>
            <div className="flex justify-center mt-2">
              <div className="h-0.5 w-12 bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-3">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center">
                ❌ {errorMessage}
              </div>
            )}
            
            <p className="text-center text-sm text-gray-600">
              We've sent a verification code to <br />
              <strong className="text-blue-600">{userEmail}</strong>
            </p>

            {schoolInfo && (
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-xs text-blue-700">
                  🏫 {schoolInfo.schoolName}<br />
                  📋 Code: <span className="font-mono font-bold">{schoolInfo.schoolCode}</span>
                </p>
              </div>
            )}

            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              className="w-full px-3 py-2 text-sm text-center text-2xl font-mono tracking-wider border rounded-lg focus:ring-2 focus:ring-blue-400 transition-all duration-300 focus:scale-105"
              autoFocus
            />

            <button
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all duration-300 flex justify-center items-center transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-xs text-gray-500">Resend code in {resendTimer} seconds</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Didn't receive code? Resend
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStep("login");
                setOtp("");
                setErrorMessage("");
                setSchoolInfo(null);
              }}
              className="w-full text-gray-500 text-xs hover:text-gray-700 mt-2"
            >
              ← Back to login
            </button>
          </form>
        </div>

        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            animation: gradient 3s ease infinite;
            background-size: 200% auto;
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    );
  }

  // Forgot Password Modal
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-sm relative z-10">
          <div className="text-center mb-5">
            <div className="flex justify-center mb-3">
              <div className="bg-amber-100 rounded-full p-3">
                <span className="text-2xl">🔐</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {forgotStep === "email" && "Reset Password"}
              {forgotStep === "otp" && "Verify Code"}
              {forgotStep === "reset" && "Create New Password"}
            </h2>
          </div>

          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center">
              ❌ {errorMessage}
            </div>
          )}

          {forgotStep === "email" && (
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                placeholder="Enter your email"
                value={forgotSchoolCodeEmail}
                onChange={(e) => setForgotSchoolCodeEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 mb-4"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-gray-500 text-sm mt-3 hover:text-gray-700"
              >
                ← Back to Login
              </button>
            </form>
          )}

          {forgotStep === "otp" && (
            <form onSubmit={handleVerifyResetOtp}>
              <p className="text-sm text-gray-600 text-center mb-3">
                Enter the 6-digit code sent to <br />
                <strong>{forgotSchoolCodeEmail}</strong>
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                maxLength="6"
                className="w-full px-3 py-2 text-sm text-center text-2xl font-mono border rounded-lg mb-4"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                type="button"
                onClick={() => setForgotStep("email")}
                className="w-full text-gray-500 text-sm mt-3 hover:text-gray-700"
              >
                ← Back
              </button>
            </form>
          )}

          {forgotStep === "reset" && (
            <form onSubmit={handleResetPassword}>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg mb-3"
                required
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg mb-4"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Forgot School Code Modal
  if (showForgotSchoolCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-sm relative z-10">
          <div className="text-center mb-5">
            <div className="flex justify-center mb-3">
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-2xl">🏫</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Recover School Code</h2>
            <p className="text-xs text-gray-500 mt-1">Enter your email to receive your school code</p>
          </div>

          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center">
              ❌ {errorMessage}
            </div>
          )}

          <form onSubmit={handleForgotSchoolCode}>
            <input
              type="email"
              placeholder="Enter your email"
              value={forgotSchoolCodeEmail}
              onChange={(e) => setForgotSchoolCodeEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-400 mb-4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              {loading ? "Sending..." : "Send School Code"}
            </button>
            <button
              type="button"
              onClick={() => setShowForgotSchoolCode(false)}
              className="w-full text-gray-500 text-sm mt-3 hover:text-gray-700"
            >
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-sm relative z-10 transition-all duration-500 hover:shadow-2xl">
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-40 animate-ping"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-green-500 rounded-full p-2 shadow-lg animate-bounce-slow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] whitespace-nowrap">
              School Inventory
            </h2>
            <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 via-blue-500 to-green-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] mt-0.5 animate-fade-in-up">
              Management System
            </h3>
          </div>
          
          <div className="flex justify-center mt-2">
            <div className="h-0.5 w-12 bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center">
              ❌ {errorMessage}
            </div>
          )}

          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🏫</span>
            <input
              type="text"
              name="schoolCode"
              placeholder="School Code"
              value={form.schoolCode}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 transition-all duration-300 focus:scale-105"
              required
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 transition-all duration-300 focus:scale-105"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 transition-all duration-300 focus:scale-105"
            required
          />

          <button
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all duration-300 flex justify-center items-center transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
          >
            {loading ? "Sending code..." : "Login"}
          </button>
        </form>

        <div className="flex justify-between mt-3 text-xs">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-amber-600 hover:text-amber-800 transition-colors"
          >
            Forgot Password?
          </button>
          <button
            onClick={() => setShowForgotSchoolCode(true)}
            className="text-purple-600 hover:text-purple-800 transition-colors"
          >
            Forgot School Code?
          </button>
        </div>

        {/* <p className="text-xs text-center mt-4">
          No account?{" "}
          <Link to="/register" className="text-blue-600 hover:text-blue-800 transition-colors duration-300 relative inline-block group">
            Register
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </p> */}
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% auto;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}