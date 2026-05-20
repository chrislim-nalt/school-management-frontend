import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function AdminLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [hoveredItem, setHoveredItem] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) navigate("/");
        const name = localStorage.getItem("userName");
        if (name) setAdminName(name);
    }, [navigate]);

    // Close drawer on route change
    useEffect(() => {
        if (isMobile) setIsMobileDrawerOpen(false);
    }, [location.pathname, isMobile]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        localStorage.removeItem("schoolCode");
        localStorage.removeItem("schoolName");
        navigate("/");
    };

    const handleMouseEnter = (e, item) => {
        if (!isSidebarOpen && !isMobile) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredItem({ item, x: rect.right + 10, y: rect.top + rect.height / 2 });
        }
    };

    const handleMouseLeave = () => setHoveredItem(null);

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: "/admin", name: "Dashboard", icon: "📊", description: "Overview and statistics" },
        { path: "/admin/schools", name: "Schools", icon: "🏫", description: "Manage all schools" },
        { path: "/admin/users", name: "Users", icon: "👥", description: "Manage system users" },
    ];

    const currentPage = menuItems.find((item) => item.path === location.pathname);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">

            {/* ── Tooltip (desktop collapsed) ── */}
            {hoveredItem && (
                <div
                    style={{
                        position: "fixed",
                        left: hoveredItem.x,
                        top: hoveredItem.y,
                        transform: "translateY(-50%)",
                        zIndex: 9999,
                        backgroundColor: "#1f2937",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                    }}
                >
                    <span style={{ fontWeight: "bold" }}>{hoveredItem.item.icon} {hoveredItem.item.name}</span>
                    <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>{hoveredItem.item.description}</div>
                    <div
                        style={{
                            position: "absolute",
                            left: "-6px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 0,
                            height: 0,
                            borderTop: "6px solid transparent",
                            borderBottom: "6px solid transparent",
                            borderRight: "6px solid #1f2937",
                        }}
                    />
                </div>
            )}

            {/* ═══════════════════════════════════════
                DESKTOP SIDEBAR (unchanged)
            ═══════════════════════════════════════ */}
            {!isMobile && (
                <div
                    className={`${isSidebarOpen ? "w-64" : "w-20"} bg-slate-900 text-white transition-all duration-300 flex flex-col flex-shrink-0 shadow-xl`}
                >
                    {/* Logo */}
                    <div className="p-4 border-b border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm">👑</span>
                                </div>
                                {isSidebarOpen && (
                                    <div>
                                        <span className="font-bold text-base block">Super Admin</span>
                                        <span className="text-xs text-slate-400">Control Panel</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 flex-shrink-0"
                            >
                                {isSidebarOpen ? "◀" : "▶"}
                            </button>
                        </div>
                        {!isSidebarOpen && (
                            <div className="mt-2 text-center">
                                <p className="text-[10px] text-slate-500">💡 Hover icons</p>
                            </div>
                        )}
                    </div>

                    {/* Admin info */}
                    {isSidebarOpen && adminName && (
                        <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/50">
                            <p className="text-xs text-slate-400">Logged in as</p>
                            <p className="text-sm font-semibold text-white truncate">{adminName}</p>
                        </div>
                    )}

                    {/* Nav */}
                    <nav className="flex-1 mt-4 overflow-y-auto">
                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onMouseEnter={(e) => handleMouseEnter(e, item)}
                                    onMouseLeave={handleMouseLeave}
                                    className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 ${
                                        isActive(item.path)
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                                >
                                    <span className="text-xl min-w-[28px] text-center">{item.icon}</span>
                                    {isSidebarOpen && (
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-sm font-medium">{item.name}</span>
                                            <span className="text-xs text-slate-400">{item.description}</span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Logout */}
                    <div className="p-3 border-t border-slate-700">
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-200 ${!isSidebarOpen ? "justify-center" : ""}`}
                        >
                            <span className="text-xl min-w-[28px] text-center">🚪</span>
                            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════
                MOBILE — Full-screen Drawer
            ═══════════════════════════════════════ */}
            {isMobile && (
                <>
                    {/* Backdrop */}
                    {isMobileDrawerOpen && (
                        <div
                            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                            onClick={() => setIsMobileDrawerOpen(false)}
                        />
                    )}

                    {/* Drawer */}
                    <div
                        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 text-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
                            isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
                        }`}
                    >
                        {/* Drawer header */}
                        <div className="p-4 border-b border-slate-700 bg-slate-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white text-lg">👑</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Super Admin</p>
                                        <p className="text-xs text-slate-400">Control Panel</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {adminName && (
                                <div className="mt-3 flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {adminName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Logged in as</p>
                                        <p className="text-sm font-semibold text-white">{adminName}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer nav */}
                        <nav className="flex-1 overflow-y-auto py-4">
                            <div className="px-4 mb-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Navigation</p>
                            </div>
                            <div className="space-y-1">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileDrawerOpen(false)}
                                        className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-xl transition-all duration-150 ${
                                            isActive(item.path)
                                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                                                : "text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-700"
                                        }`}
                                    >
                                        <span className="text-2xl w-8 text-center flex-shrink-0">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold leading-tight">{item.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{item.description}</p>
                                        </div>
                                        {isActive(item.path) && (
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        {/* Drawer footer */}
                        <div className="p-3 border-t border-slate-700">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-200"
                            >
                                <span className="text-xl min-w-[28px] text-center">🚪</span>
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════
                MAIN CONTENT
            ═══════════════════════════════════════ */}
            <div className={`flex-1 overflow-auto flex flex-col ${isMobile ? "pb-20" : ""}`}>

                {/* Top Header */}
                <div className="bg-white shadow-sm px-4 py-2.5 border-b border-slate-100 sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {/* Hamburger — mobile only */}
                            {isMobile && (
                                <button
                                    onClick={() => setIsMobileDrawerOpen(true)}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                    aria-label="Open menu"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            )}
                            <div>
                                <h1 className="text-sm font-semibold text-slate-800">
                                    {currentPage?.name || "Dashboard"}
                                </h1>
                                {isMobile && currentPage && (
                                    <p className="text-xs text-slate-400">{currentPage.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs">👑</span>
                            </div>
                            <span className="text-xs font-medium text-slate-600 hidden sm:inline">{adminName || "Admin"}</span>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 p-3 md:p-5">{children}</div>
            </div>

            {/* ═══════════════════════════════════════
                MOBILE BOTTOM NAV BAR
            ═══════════════════════════════════════ */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-700 shadow-2xl">
                    <div className="flex items-stretch">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all duration-150 ${
                                    isActive(item.path)
                                        ? "text-indigo-400 bg-slate-800"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700"
                                }`}
                            >
                                <span className="text-xl leading-none">{item.icon}</span>
                                <span className="text-xs mt-1 font-medium leading-tight text-center">{item.name}</span>
                                {isActive(item.path) && (
                                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1" />
                                )}
                            </Link>
                        ))}

                        {/* Logout shortcut */}
                        <button
                            onClick={handleLogout}
                            className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 active:bg-slate-700 transition-all duration-150"
                        >
                            <span className="text-xl leading-none">🚪</span>
                            <span className="text-xs mt-1 font-medium leading-tight">Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}