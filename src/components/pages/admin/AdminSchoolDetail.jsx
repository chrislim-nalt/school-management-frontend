import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";

export default function AdminSchoolDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentialsData, setCredentialsData] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const subscriptionPlans = [
        { value: "free_trial", label: "Free Trial", price: "Free", duration: "14 days", maxUsers: 5, color: "slate", icon: "🎁" },
        { value: "monthly", label: "Monthly", price: "$29/mo", duration: "30 days", maxUsers: 20, color: "blue", icon: "📅" },
        { value: "yearly", label: "Yearly", price: "$299/yr", duration: "365 days", maxUsers: 50, color: "green", icon: "🌟" },
        { value: "lifetime", label: "Lifetime", price: "$999", duration: "Lifetime", maxUsers: 100, color: "purple", icon: "💎" },
    ];

    useEffect(() => {
        fetchSchoolDetail();
    }, [id]);

    const fetchSchoolDetail = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/admin/schools/${id}`);
            setSchool(res.data.school);
            setSubscription(res.data.subscription);
            setUsers(res.data.users);
            setSelectedPlan(res.data.subscription?.plan || "free_trial");
        } catch (error) {
            console.error("Error fetching school:", error);
            setMessage({ type: "error", text: "Failed to load school details" });
        } finally {
            setLoading(false);
        }
    };

    const handleShareUserCredentials = async (user) => {
        setIsSharing(true);
        try {
            const response = await API.post(`/admin/users/${user._id}/reset-password`);
            
            if (response.data.success) {
                setCredentialsData({
                    ...response.data.credentials,
                    isPasswordReset: true,
                    userRole: user.role
                });
                setShowCredentialsModal(true);
                setMessage({ type: "success", text: `New credentials generated for ${user.name}!` });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                fetchSchoolDetail();
            }
        } catch (error) {
            console.error("Share credentials error:", error);
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to share credentials" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } finally {
            setIsSharing(false);
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        setMessage({ type: "success", text: `${label} copied!` });
        setTimeout(() => setMessage({ type: "", text: "" }), 2000);
    };

    const handleUpdatePlan = async () => {
        try {
            await API.put(`/admin/subscriptions/${id}`, { plan: selectedPlan });
            setMessage({ type: "success", text: `Plan updated to ${selectedPlan}!` });
            setShowPlanModal(false);
            fetchSchoolDetail();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update subscription" });
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            await API.put(`/admin/users/${userId}`, { isActive: !currentStatus });
            setMessage({ type: "success", text: "User status updated!" });
            fetchSchoolDetail();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update user" });
        }
    };

    const getPlanDetails = (planValue) => {
        return subscriptionPlans.find(p => p.value === planValue) || subscriptionPlans[0];
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: "bg-emerald-100 text-emerald-700",
            pending: "bg-amber-100 text-amber-700",
            suspended: "bg-rose-100 text-rose-700",
            rejected: "bg-slate-100 text-slate-700"
        };
        return styles[status] || "bg-slate-100 text-slate-700";
    };

    const getRoleBadge = (role) => {
        const styles = {
            admin: "bg-purple-100 text-purple-700",
            manager: "bg-blue-100 text-blue-700",
            staff: "bg-slate-100 text-slate-700"
        };
        return styles[role] || "bg-slate-100 text-slate-700";
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(users.length / itemsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
            </div>
        );
    }

    if (!school) {
        return (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 px-4 py-3 rounded-lg">
                ⚠️ School not found
            </div>
        );
    }

    const currentPlan = getPlanDetails(subscription?.plan);

    return (
        <div className="space-y-4">
            
            {/* Toast Message */}
            {message.text && (
                <div className={`fixed top-20 right-4 z-50 animate-slide-in ${
                    message.type === "success" ? "bg-emerald-500" : "bg-rose-500"
                } text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm`}>
                    <span className="text-lg">{message.type === "success" ? "✓" : "⚠"}</span>
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                <div className="relative px-5 py-5 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">🏫</span>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-white">{school.name}</h1>
                                    <p className="text-slate-300 text-xs mt-0.5">Code: <code className="font-mono">{school.schoolCode}</code></p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate("/admin/schools")} 
                            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium flex items-center gap-2"
                        >
                            ← Back to Schools
                        </button>
                    </div>
                </div>
            </div>

            {/* Credentials Modal */}
            {showCredentialsModal && credentialsData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCredentialsModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🔐</span>
                                <h2 className="text-base font-bold">User Credentials (Password Reset)</h2>
                            </div>
                            <button onClick={() => setShowCredentialsModal(false)} className="text-white text-2xl">&times;</button>
                        </div>
                        
                        <div className="p-5 space-y-4">
                            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3">
                                <p className="text-xs text-blue-800">
                                    🔄 <strong>Password reset for {credentialsData.name}!</strong><br />
                                    Role: <span className="font-bold capitalize">{credentialsData.userRole}</span>
                                </p>
                            </div>
                            
                            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-3">
                                <p className="text-xs text-amber-800">
                                    ⚠️ <strong>Important:</strong> These credentials are shown only once.
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">🏫 School Name</label>
                                    <div className="bg-slate-50 p-2 rounded-lg text-sm font-medium">{credentialsData.schoolName}</div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">🔑 School Code</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-slate-50 p-2 rounded-lg font-mono text-sm">{credentialsData.schoolCode}</code>
                                        <button onClick={() => copyToClipboard(credentialsData.schoolCode, "School code")} className="bg-slate-500 text-white px-3 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">👤 User Name</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50 p-2 rounded-lg text-sm">{credentialsData.name}</div>
                                        <button onClick={() => copyToClipboard(credentialsData.name, "User name")} className="bg-slate-500 text-white px-3 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">📧 Email</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50 p-2 rounded-lg text-sm">{credentialsData.email}</div>
                                        <button onClick={() => copyToClipboard(credentialsData.email, "Email")} className="bg-slate-500 text-white px-3 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">🔐 NEW Password</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-slate-50 p-2 rounded-lg font-mono text-sm font-bold text-emerald-600">{credentialsData.password}</code>
                                        <button onClick={() => copyToClipboard(credentialsData.password, "Password")} className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">🔗 Login URL</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50 p-2 rounded-lg text-xs truncate">{credentialsData.loginUrl}</div>
                                        <button onClick={() => copyToClipboard(credentialsData.loginUrl, "Login URL")} className="bg-slate-500 text-white px-3 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={() => setShowCredentialsModal(false)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-lg font-semibold text-sm">
                                I've Copied the Credentials
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Plan Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPlanModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-slate-100 px-5 py-3 flex justify-between items-center">
                            <h2 className="text-base font-bold text-slate-800">Change Subscription Plan</h2>
                            <button onClick={() => setShowPlanModal(false)} className="text-slate-400 text-2xl">&times;</button>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                {subscriptionPlans.map((plan) => (
                                    <div
                                        key={plan.value}
                                        onClick={() => setSelectedPlan(plan.value)}
                                        className={`border-2 rounded-xl p-3 cursor-pointer transition-all text-center ${
                                            selectedPlan === plan.value ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="text-2xl mb-1">{plan.icon}</div>
                                        <div className={`text-sm font-bold text-${plan.color}-600`}>{plan.label}</div>
                                        <div className="text-base font-bold text-slate-800">{plan.price}</div>
                                        <div className="text-xs text-slate-400">{plan.duration}</div>
                                        <div className="text-xs text-slate-400 mt-1">Max {plan.maxUsers} users</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleUpdatePlan} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition">Apply Changes</button>
                                <button onClick={() => setShowPlanModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-medium text-sm hover:bg-slate-200 transition">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* School Information */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🏛️</span>
                            <h2 className="text-sm font-semibold text-slate-800">School Information</h2>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between py-1.5">
                            <span className="text-xs text-slate-500">School Name:</span>
                            <span className="text-xs font-medium text-slate-700">{school.name}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">School Code:</span>
                            <code className="text-xs font-mono font-bold text-indigo-600">{school.schoolCode}</code>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Email:</span>
                            <span className="text-xs text-slate-700">{school.email}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Phone:</span>
                            <span className="text-xs text-slate-700">{school.phone || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Address:</span>
                            <span className="text-xs text-slate-700">{school.address || "-"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Status:</span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(school.status)}`}>
                                {school.status}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Registered:</span>
                            <span className="text-xs text-slate-700">{new Date(school.createdAt).toLocaleDateString()}</span>
                        </div>
                        {school.approvedAt && (
                            <div className="flex justify-between py-1.5 border-t border-slate-100">
                                <span className="text-xs text-slate-500">Approved:</span>
                                <span className="text-xs text-slate-700">{new Date(school.approvedAt).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Subscription Management */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <h2 className="text-sm font-semibold text-slate-800">Subscription Management</h2>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between py-1.5">
                            <span className="text-xs text-slate-500">Current Plan:</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${currentPlan.color}-100 text-${currentPlan.color}-700`}>
                                {currentPlan.icon} {currentPlan.label}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Status:</span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${subscription?.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                {subscription?.status || "pending"}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Valid Until:</span>
                            <span className="text-xs text-slate-700">{subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : "Lifetime"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Max Users:</span>
                            <span className="text-xs font-semibold text-slate-700">{currentPlan.maxUsers}</span>
                        </div>
                        <button onClick={() => setShowPlanModal(true)} className="w-full mt-3 bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                            Change Subscription Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">👥</span>
                        <h2 className="text-sm font-semibold text-slate-800">School Users ({users.length})</h2>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Email</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Role</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                                        {user.name}
                                        {user.role === "admin" && <span className="ml-1 text-xs text-indigo-600">(Admin)</span>}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-600">{user.email}</td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                            {user.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleShareUserCredentials(user)}
                                                disabled={isSharing}
                                                className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition disabled:opacity-50"
                                            >
                                                {isSharing ? "..." : "Share"}
                                            </button>
                                            <button 
                                                onClick={() => handleToggleUserStatus(user._id, user.isActive)} 
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                                                    user.isActive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                }`}
                                            >
                                                {user.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-slate-500">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                                        currentPage === 1 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                                    }`}
                                >
                                    ← Prev
                                </button>
                                {getPageNumbers().map((page, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                        className={`w-7 h-7 rounded text-xs font-medium transition ${
                                            currentPage === page ? "bg-indigo-600 text-white shadow-sm" : page === '...' ? "text-slate-400 cursor-default" : "bg-white text-slate-700 hover:bg-slate-100"
                                        }`}
                                        disabled={page === '...'}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                                        currentPage === totalPages ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                                    }`}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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