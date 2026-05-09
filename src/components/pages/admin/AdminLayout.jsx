import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function AdminLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [hoveredItem, setHoveredItem] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle responsive
    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        }
        
        const name = localStorage.getItem("userName");
        if (name) setAdminName(name);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        localStorage.removeItem("schoolCode");
        localStorage.removeItem("schoolName");
        navigate("/");
    };

    const closeMenu = () => {
        if (isMobile) setIsMobileMenuOpen(false);
    };

    const handleMouseEnter = (e, item) => {
        if (!isSidebarOpen && !isMobile) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredItem({
                item: item,
                x: rect.right + 10,
                y: rect.top + rect.height / 2
            });
        }
    };

    const handleMouseLeave = () => {
        setHoveredItem(null);
    };

    const menuItems = [
        { path: "/admin", name: "Dashboard", icon: "📊", description: "Overview and statistics" },
        { path: "/admin/schools", name: "Schools", icon: "🏫", description: "Manage all schools" },
        { path: "/admin/users", name: "Users", icon: "👥", description: "Manage system users" },
    ];

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            
            {/* Tooltip Portal */}
            {hoveredItem && (
                <div
                    style={{
                        position: 'fixed',
                        left: hoveredItem.x,
                        top: hoveredItem.y,
                        transform: 'translateY(-50%)',
                        zIndex: 9999,
                        backgroundColor: '#1f2937',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none'
                    }}
                >
                    <span style={{ fontWeight: 'bold' }}>{hoveredItem.item.icon} {hoveredItem.item.name}</span>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{hoveredItem.item.description}</div>
                    <div
                        style={{
                            position: 'absolute',
                            left: '-6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 0,
                            height: 0,
                            borderTop: '6px solid transparent',
                            borderBottom: '6px solid transparent',
                            borderRight: '6px solid #1f2937'
                        }}
                    />
                </div>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="fixed top-4 left-4 z-20 p-2 bg-slate-900 rounded-xl text-white shadow-lg md:hidden"
                >
                    ☰
                </button>
            )}

            {/* Sidebar */}
            <div className={`
                ${!isMobile && (isSidebarOpen ? "w-64" : "w-20")}
                ${isMobile && (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")}
                bg-slate-900 text-white transition-all duration-300 flex flex-col
                fixed md:relative z-30 h-full shadow-xl
                ${isMobile ? "w-64" : ""}
            `}>
                {/* Logo */}
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <span className="text-white text-sm">👑</span>
                            </div>
                            {isSidebarOpen && (
                                <div>
                                    <span className="font-bold text-base block">Super Admin</span>
                                    <span className="text-xs text-slate-400">Control Panel</span>
                                </div>
                            )}
                        </div>
                        {!isMobile && (
                            <button 
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                            >
                                {isSidebarOpen ? "◀" : "▶"}
                            </button>
                        )}
                        {isMobile && (
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                                ✕
                            </button>
                        )}
                    </div>
                    
                    {/* Hint for collapsed sidebar */}
                    {!isSidebarOpen && !isMobile && (
                        <div className="mt-2 text-center">
                            <p className="text-[10px] text-slate-500">💡 Hover icons</p>
                        </div>
                    )}
                </div>

                {/* Admin Info */}
                {isSidebarOpen && adminName && (
                    <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/50">
                        <p className="text-xs text-slate-400">Logged in as</p>
                        <p className="text-sm font-semibold text-white truncate">{adminName}</p>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 mt-4 overflow-y-auto">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeMenu}
                                onMouseEnter={(e) => handleMouseEnter(e, item)}
                                onMouseLeave={handleMouseLeave}
                                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 ${
                                    location.pathname === item.path
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                            >
                                <span className="text-xl min-w-[28px]">{item.icon}</span>
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
                        className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-200 ${!isSidebarOpen && "justify-center"}`}
                    >
                        <span className="text-xl min-w-[28px]">🚪</span>
                        {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobile && isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Top Header */}
                <div className="bg-white shadow-sm px-4 py-2.5 border-b border-slate-100 sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {isMobile && (
                                <span className="text-sm font-semibold text-slate-800">Super Admin</span>
                            )}
                            {!isMobile && (
                                <h1 className="text-sm font-semibold text-slate-800">
                                    {menuItems.find(item => item.path === location.pathname)?.name || "Dashboard"}
                                </h1>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                <span className="text-white text-xs">👑</span>
                            </div>
                            <span className="text-xs font-medium text-slate-600 hidden sm:inline">{adminName || "Admin"}</span>
                        </div>
                    </div>
                </div>
                
                {/* Page Content */}
                <div className="p-3 md:p-5">{children}</div>
            </div>
        </div>
    );
}