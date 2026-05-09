import { useEffect, useState } from "react";
import API from "../../services/api";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        schoolId: "",
        role: "staff"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, schoolsRes] = await Promise.all([
                API.get("/admin/users"),
                API.get("/admin/schools")
            ]);
            setUsers(usersRes.data);
            setSchools(schoolsRes.data);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error fetching data:", error);
            setMessage({ type: "error", text: "Failed to load data" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.schoolId) {
            setMessage({ type: "error", text: "Please fill all required fields" });
            return;
        }

        setLoading(true);
        try {
            await API.post("/admin/users", form);
            setMessage({ type: "success", text: "User created successfully!" });
            setShowForm(false);
            setForm({ name: "", email: "", password: "", schoolId: "", role: "staff" });
            fetchData();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to create user" });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        setLoading(true);
        try {
            await API.put(`/admin/users/${id}`, { isActive: !currentStatus });
            setMessage({ type: "success", text: "User status updated!" });
            fetchData();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update user" });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (id, newRole) => {
        setLoading(true);
        try {
            await API.put(`/admin/users/${id}`, { role: newRole });
            setMessage({ type: "success", text: "User role updated!" });
            fetchData();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update role" });
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeClass = (role) => {
        switch(role) {
            case "admin": return "bg-blue-100 text-blue-700";
            case "manager": return "bg-emerald-100 text-emerald-700";
            case "staff": return "bg-slate-100 text-slate-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case "admin": return "👑";
            case "manager": return "📋";
            case "staff": return "👤";
            default: return "👤";
        }
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
                                <span className="text-3xl">👥</span>
                                <h1 className="text-xl md:text-2xl font-bold text-white">User Management</h1>
                            </div>
                            <p className="text-slate-300 text-xs mt-1">Manage system users across all schools</p>
                        </div>
                        <button 
                            onClick={() => setShowForm(!showForm)} 
                            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
                        >
                            <span className="text-lg">{showForm ? "✕" : "+"}</span>
                            {showForm ? "Close Form" : "Add User"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Add User Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">➕</span>
                            <h2 className="text-sm font-semibold text-slate-800">Add New User</h2>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                                <input
                                    type="text"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    placeholder="Leave empty to auto-generate"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">School *</label>
                                <select
                                    value={form.schoolId}
                                    onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    required
                                >
                                    <option value="">Select School</option>
                                    {schools.map((school) => (
                                        <option key={school._id} value={school._id}>
                                            🏫 {school.name} ({school.schoolCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                >
                                    <option value="admin">👑 Admin</option>
                                    <option value="manager">📋 Manager</option>
                                    <option value="staff">👤 Staff</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5 pt-3 border-t border-slate-100">
                            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all">
                                Create User
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Results Count */}
            {users.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-3">
                    <p className="text-xs text-slate-500">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, users.length)} of {users.length} users
                    </p>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-3">👥</div>
                        <p className="text-slate-500 text-sm">No users found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">User</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">School</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Role</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                                                        <span className="text-sm">{getRoleIcon(user.role)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{user.name}</p>
                                                        {user.role === "admin" && <span className="text-xs text-indigo-600">(School Admin)</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-slate-600">{user.email}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs">🏫</span>
                                                    <span className="text-xs text-slate-600">{user.school?.name || "-"}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium border-0 focus:ring-2 focus:ring-indigo-400 ${getRoleBadgeClass(user.role)}`}
                                                >
                                                    <option value="admin">👑 Admin</option>
                                                    <option value="manager">📋 Manager</option>
                                                    <option value="staff">👤 Staff</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                                    {user.isActive ? "✅ Active" : "❌ Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(user._id, user.isActive)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                                        user.isActive 
                                                            ? "bg-rose-600 hover:bg-rose-700 text-white" 
                                                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    }`}
                                                >
                                                    {user.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                    <div className="text-xs text-slate-500">Page {currentPage} of {totalPages}</div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={`px-2 py-1 rounded text-xs font-medium transition ${currentPage === 1 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"}`}>← Prev</button>
                                        {getPageNumbers().map((page, idx) => (
                                            <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} className={`w-7 h-7 rounded text-xs font-medium transition ${currentPage === page ? "bg-indigo-600 text-white shadow-sm" : page === '...' ? "text-slate-400 cursor-default" : "bg-white text-slate-700 hover:bg-slate-100"}`} disabled={page === '...'}>{page}</button>
                                        ))}
                                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={`px-2 py-1 rounded text-xs font-medium transition ${currentPage === totalPages ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"}`}>Next →</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
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