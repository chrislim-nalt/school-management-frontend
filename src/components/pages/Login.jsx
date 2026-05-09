import { useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", schoolCode: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Forgot Password Modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState("email"); // email, security, reset
  const [forgotEmail, setForgotEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetVerified, setResetVerified] = useState(false);
  
  // Forgot School Code Modal
  const [showForgotSchoolCode, setShowForgotSchoolCode] = useState(false);
  const [schoolCodeEmail, setSchoolCodeEmail] = useState("");
  const [schoolCodeAnswer, setSchoolCodeAnswer] = useState("");
  const [schoolCodeQuestion, setSchoolCodeQuestion] = useState("");
  const [recoveredSchoolCode, setRecoveredSchoolCode] = useState(null);
  const [recoveredSchoolName, setRecoveredSchoolName] = useState("");

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
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userRole", res.data.user.role);
      localStorage.setItem("userName", res.data.user.name);
      
      if (res.data.user.role === "superadmin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Flow
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    
    try {
      const res = await API.post("/auth/request-password-reset", { email: forgotEmail });
      setSecurityQuestion(res.data.securityQuestion);
      setResetOtp(res.data.resetToken);
      setForgotStep("security");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecurity = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    
    try {
      await API.post("/auth/verify-and-reset-password", {
        email: forgotEmail,
        answer: securityAnswer,
        resetToken: resetOtp,
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
    setResetOtp("");
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
      setSchoolCodeQuestion(res.data.securityQuestion);
      setSchoolCodeAnswer("");
      setForgotStep("security");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySchoolCodeSecurity = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    
    try {
      const res = await API.post("/auth/verify-security-answer", {
        email: schoolCodeEmail,
        answer: schoolCodeAnswer,
        recoveryToken: resetOtp,
      });
      setRecoveredSchoolCode(res.data.schoolCode);
      setRecoveredSchoolName(res.data.schoolName);
      setForgotStep("result");
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
    setForgotStep("email");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-sm relative z-10">
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
            {loading ? "Logging in..." : "Login"}
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
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <div className="bg-amber-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-3">Reset Password</h2>
              <p className="text-sm text-gray-500">Answer your security question to reset password</p>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center">
                ❌ {errorMessage}
              </div>
            )}

            {forgotStep === "email" && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                >
                  {loading ? "Processing..." : "Continue"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-gray-500 text-sm mt-2 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            )}

            {forgotStep === "security" && (
              <form onSubmit={handleVerifySecurity} className="space-y-4">
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">Security Question:</p>
                  <p className="text-sm text-gray-700 mt-1">{securityQuestion}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer</label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                >
                  {loading ? "Verifying..." : "Reset Password"}
                </button>
              </form>
            )}

            {forgotStep === "reset" && resetVerified && (
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-3">Password Reset!</h3>
                <p className="text-sm text-gray-500 mt-1">Your password has been reset successfully.</p>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forgot School Code Modal */}
      {showForgotSchoolCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                <span className="text-3xl">🏫</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-3">Recover School Code</h2>
              <p className="text-sm text-gray-500">Answer your security question to get your school code</p>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center">
                ❌ {errorMessage}
              </div>
            )}

            {!recoveredSchoolCode ? (
              <form onSubmit={handleSchoolCodeRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={schoolCodeEmail}
                    onChange={(e) => setSchoolCodeEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                {schoolCodeQuestion && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-800 font-medium">Security Question:</p>
                    <p className="text-sm text-gray-700 mt-1">{schoolCodeQuestion}</p>
                    <input
                      type="text"
                      placeholder="Your answer"
                      value={schoolCodeAnswer}
                      onChange={(e) => setSchoolCodeAnswer(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mt-3"
                      required
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                >
                  {loading ? "Processing..." : "Recover School Code"}
                </button>
                <button
                  type="button"
                  onClick={() => resetSchoolCodeState()}
                  className="w-full text-gray-500 text-sm mt-2 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-3xl">🏫</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-3">School Code Found!</h3>
                <div className="bg-gray-100 rounded-lg p-3 mt-3">
                  <p className="text-sm text-gray-600">School Name:</p>
                  <p className="font-bold text-gray-800">{recoveredSchoolName}</p>
                  <p className="text-sm text-gray-600 mt-2">School Code:</p>
                  <p className="text-2xl font-mono font-bold text-purple-600">{recoveredSchoolCode}</p>
                </div>
                <button
                  onClick={() => resetSchoolCodeState()}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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