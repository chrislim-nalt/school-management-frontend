import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();

  // Profile update form
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Security questions form
  const [securityForm, setSecurityForm] = useState({
    securityQuestion: "",
    securityAnswer: "",
    confirmAnswer: ""
  });

  const securityQuestions = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What was your first school?",
    "What is your favorite book?",
    "What city were you born in?",
    "What is your father's middle name?",
    "What was your childhood nickname?",
    "What is your favorite teacher's name?"
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get("/auth/profile");
      setUser(res.data);
      setProfileForm({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || ""
      });
      if (res.data.securityQuestion) {
        setSecurityForm({
          ...securityForm,
          securityQuestion: res.data.securityQuestion
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await API.put("/auth/profile", {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      });
      setSuccess("Profile updated successfully!");
      fetchProfile();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await API.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSecurity = async (e) => {
    e.preventDefault();
    
    if (!securityForm.securityQuestion) {
      setError("Please select a security question");
      return;
    }
    
    if (!securityForm.securityAnswer) {
      setError("Please provide an answer to your security question");
      return;
    }
    
    if (securityForm.securityAnswer !== securityForm.confirmAnswer) {
      setError("Security answers do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await API.post("/auth/setup-security", {
        securityQuestion: securityForm.securityQuestion,
        securityAnswer: securityForm.securityAnswer
      });
      setSuccess("Security questions saved successfully!");
      fetchProfile();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save security questions");
    } finally {
      setLoading(false);
    }
  };

  const getUserRoleDisplay = () => {
    if (user?.role === "superadmin") return "Super Administrator";
    if (user?.userType === "school_admin" || user?.role === "admin") return "School Administrator";
    if (user?.userType === "teacher") return "Teacher";
    if (user?.userType === "bursar") return "Bursar / Accountant";
    if (user?.userType === "stock_keeper") return "Stock Keeper";
    if (user?.userType === "customer_care") return "Customer Care";
    if (user?.userType === "viewer") return "Viewer";
    return "Staff Member";
  };

  const getUserRoleIcon = () => {
    if (user?.role === "superadmin") return "👑";
    if (user?.userType === "school_admin") return "🏫";
    if (user?.userType === "teacher") return "👨‍🏫";
    if (user?.userType === "bursar") return "💰";
    if (user?.userType === "stock_keeper") return "📦";
    if (user?.userType === "customer_care") return "🤝";
    if (user?.userType === "viewer") return "👁️";
    return "👤";
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Toast */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${
          success ? "bg-emerald-500" : "bg-rose-500"
        } text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm`}>
          <span className="text-lg">{success ? "✓" : "⚠"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">{getUserRoleIcon()}</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                  My Profile
                </h1>
                <p className="text-indigo-200 text-sm">
                  {getUserRoleDisplay()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "profile"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            📋 Profile Information
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "security"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            🔐 Security Questions
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "password"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            🔑 Change Password
          </button>
        </div>

        <div className="p-5">
          {/* Profile Information Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600">
                    {getUserRoleDisplay()}
                  </div>
                </div>
              </div>

              {user?.school && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <h3 className="text-sm font-semibold text-indigo-800 mb-2">🏫 School Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">School Name:</span>
                      <span className="ml-2 font-medium text-slate-700">{user.school.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">School Code:</span>
                      <code className="ml-2 font-mono text-indigo-600">{user.school.schoolCode}</code>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* Security Questions Tab */}
          {activeTab === "security" && (
            <form onSubmit={handleSetupSecurity} className="space-y-5">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800">Password Recovery Setup</h3>
                    <p className="text-xs text-amber-700 mt-1">
                      Set up security questions to recover your account if you forget your password.
                      This information is encrypted and only you can answer it.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Security Question
                </label>
                <select
                  value={securityForm.securityQuestion}
                  onChange={(e) => setSecurityForm({...securityForm, securityQuestion: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                >
                  <option value="">-- Select a security question --</option>
                  {securityQuestions.map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={securityForm.securityAnswer}
                  onChange={(e) => setSecurityForm({...securityForm, securityAnswer: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Your answer (case-insensitive)"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Answer is not case-sensitive</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Confirm Answer
                </label>
                <input
                  type="text"
                  value={securityForm.confirmAnswer}
                  onChange={(e) => setSecurityForm({...securityForm, confirmAnswer: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Confirm your answer"
                  required
                />
              </div>

              {user?.securityQuestion && (
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-700">
                    ✅ You already have security questions set up. Updating will replace them.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : (user?.securityQuestion ? "Update Security Questions" : "Save Security Questions")}
                </button>
              </div>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔑</span>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800">Change Your Password</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Use a strong password with at least 6 characters, including letters and numbers.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-xl shadow-lg p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <span>ℹ️</span> Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Account Created:</span>
            <span className="font-medium text-slate-700">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Last Login:</span>
            <span className="font-medium text-slate-700">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Security Questions:</span>
            <span className={`font-medium ${user?.securityQuestion ? "text-emerald-600" : "text-amber-600"}`}>
              {user?.securityQuestion ? "✅ Set" : "⚠️ Not Set"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Account Status:</span>
            <span className={`font-medium ${user?.isActive ? "text-emerald-600" : "text-rose-600"}`}>
              {user?.isActive ? "✅ Active" : "❌ Inactive"}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}