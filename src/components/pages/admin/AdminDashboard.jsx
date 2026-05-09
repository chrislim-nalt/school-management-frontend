import { useEffect, useState } from "react";
import API from "../../services/api";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await API.get("/admin/dashboard/stats");
            setStats(res.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 px-4 py-3 rounded-lg">
                ⚠️ {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                <div className="relative px-5 py-5 md:p-6">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl">👑</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">Super Admin Dashboard</h1>
                            <p className="text-slate-300 text-xs mt-0.5">Manage schools, users, and system settings</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Compact Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl shadow-md p-3 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Total Schools</p>
                            <p className="text-2xl font-bold text-slate-800">{stats?.schools?.total || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <span className="text-xl">🏫</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-3 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Active Schools</p>
                            <p className="text-2xl font-bold text-emerald-600">{stats?.schools?.active || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <span className="text-xl">✅</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-3 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Pending Approval</p>
                            <p className="text-2xl font-bold text-amber-600">{stats?.schools?.pending || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <span className="text-xl">⏳</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-3 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Total Users</p>
                            <p className="text-2xl font-bold text-purple-600">{stats?.users?.total || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <span className="text-xl">👥</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Subscription */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚡</span>
                            <h2 className="text-sm font-semibold text-slate-800">Quick Actions</h2>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        <Link 
                            to="/admin/schools" 
                            className="flex items-center justify-between w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all group"
                        >
                            <span className="flex items-center gap-2">
                                <span>🏫</span>
                                <span className="text-sm font-medium">Manage Schools</span>
                            </span>
                            <span className="text-blue-600 group-hover:translate-x-1 transition">→</span>
                        </Link>
                        <Link 
                            to="/admin/users" 
                            className="flex items-center justify-between w-full bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-all group"
                        >
                            <span className="flex items-center gap-2">
                                <span>👥</span>
                                <span className="text-sm font-medium">Manage Users</span>
                            </span>
                            <span className="text-emerald-600 group-hover:translate-x-1 transition">→</span>
                        </Link>
                    </div>
                </div>
                
                {/* Subscription Overview */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💳</span>
                            <h2 className="text-sm font-semibold text-slate-800">Subscription Overview</h2>
                        </div>
                    </div>
                    <div className="p-4">
                        {stats?.subscriptions && stats.subscriptions.length > 0 ? (
                            <div className="space-y-2">
                                {stats.subscriptions.map((sub) => (
                                    <div key={sub._id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{sub._id === "free_trial" ? "📦" : "💎"}</span>
                                            <span className="text-sm font-medium text-slate-700 capitalize">
                                                {sub._id === "free_trial" ? "Free Trial" : sub._id}
                                            </span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-800">{sub.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <span className="text-4xl mb-2 block">📊</span>
                                <p className="text-sm text-slate-400">No subscriptions yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Schools Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🆕</span>
                        <h2 className="text-sm font-semibold text-slate-800">Recent School Registrations</h2>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">School Name</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">School Code</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Registered</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats?.recentSchools?.map((school) => (
                                <tr key={school._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                                        {school.name}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">
                                            {school.schoolCode}
                                        </code>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                            school.status === "active" ? "bg-emerald-100 text-emerald-700" :
                                            school.status === "pending" ? "bg-amber-100 text-amber-700" :
                                            "bg-rose-100 text-rose-700"
                                        }`}>
                                            {school.status === "active" ? "✅ Active" : 
                                             school.status === "pending" ? "⏳ Pending" : "❌ Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-500">
                                        {new Date(school.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <Link 
                                            to={`/admin/schools/${school._id}`} 
                                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                 </tr>
                            ))}
                            {(!stats?.recentSchools || stats.recentSchools.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-sm">
                                        📭 No recent school registrations
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}