import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "./services/api";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState({ name: "Loading...", code: "" });
  const [userName, setUserName] = useState("");
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const tooltipTimeoutRef = useRef(null);

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

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Fetch user and school info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await API.get("/auth/profile");
        const user = response.data;
        
        setUserName(user.name);
        if (user.school) {
          setSchoolInfo({
            name: user.school.name,
            code: user.school.schoolCode
          });
        } else {
          const schoolName = localStorage.getItem("schoolName");
          const schoolCode = localStorage.getItem("schoolCode");
          if (schoolName) {
            setSchoolInfo({ name: schoolName, code: schoolCode || "" });
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        const schoolName = localStorage.getItem("schoolName");
        const schoolCode = localStorage.getItem("schoolCode");
        if (schoolName) {
          setSchoolInfo({ name: schoolName, code: schoolCode || "" });
        }
      }
    };
    
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("schoolName");
    navigate("/");
  };

  const closeMenu = () => {
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Show tooltip on hover (only when sidebar is collapsed)
  const showTooltip = (e, itemName, itemDesc) => {
    if (!isSidebarOpen && !isMobile) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        show: true,
        text: `${itemName} - ${itemDesc}`,
        x: rect.right + 12,
        y: rect.top + rect.height / 2
      });
      
      // Clear any pending hide
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    }
  };

  // Hide tooltip with delay
  const hideTooltip = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip({ show: false, text: "", x: 0, y: 0 });
    }, 150);
  };

  // Clear tooltip on mouse leave from tooltip area
  const clearTooltip = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setTooltip({ show: false, text: "", x: 0, y: 0 });
  };

  // Menu items with groups
  const menuGroups = [
    {
      title: "Overview",
      items: [
        { path: "/dashboard", name: "Dashboard", icon: "📊", description: "View inventory summary" },
        { path: "/profile", name: "My Profile", icon: "👤", description: "Manage your account" },
      ]
    },
    {
      title: "Inventory Setup",
      items: [
        { path: "/categories", name: "Categories", icon: "📂", description: "Organize items" },
        { path: "/items", name: "Items", icon: "🛒", description: "Manage inventory" },
      ]
    },
    {
      title: "Stock Operations",
      items: [
        { path: "/stock", name: "Stock Management", icon: "📦", description: "Track movements" },
        { path: "/borrowed", name: "Borrowed Items", icon: "📋", description: "Manage borrows" },
      ]
    },
    {
      title: "Asset Management",
      items: [
        { path: "/assets", name: "Assets", icon: "🏗️", description: "School assets" },
        { path: "/tracked-assets", name: "Asset Tracking", icon: "💻", description: "Track electronics" },
      ]
    },
    {
      title: "School Feeding",
      items: [
        { path: "/feeding", name: "Feeding Records", icon: "🍽️", description: "Food management" },
      ]
    },
    {
      title: "Facility Management",
      items: [
        { path: "/laboratory", name: "Laboratory", icon: "🔬", description: "Lab equipment" },
        { path: "/library", name: "Library", icon: "📚", description: "Books collection" },
        { path: "/cleaning-supplies", name: "Cleaning Supplies", icon: "🧹", description: "Cleaning inventory" },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Tooltip */}
      {tooltip.show && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateY(-50%)',
            zIndex: 9999,
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            fontFamily: 'sans-serif'
          }}
        >
          {tooltip.text}
          <div
            style={{
              position: 'absolute',
              left: '-5px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: '5px solid #1f2937'
            }}
          />
        </div>
      )}

      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-20 p-2 bg-gray-900 rounded-lg text-white shadow-lg md:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div className={`
        ${!isMobile && (isSidebarOpen ? "w-64" : "w-16")}
        ${isMobile && (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")}
        bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col
        fixed md:relative z-30 h-full shadow-2xl
        ${isMobile ? "w-64" : ""}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl flex-shrink-0">🏫</span>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <span className="font-bold text-lg block truncate">
                    {schoolInfo.name !== "Loading..." ? schoolInfo.name.split(' ').slice(0, 2).join(' ') : "G.S AGATEKO"}
                  </span>
                  {schoolInfo.code && (
                    <span className="text-xs text-gray-400 block truncate">Code: {schoolInfo.code}</span>
                  )}
                  {userName && (
                    <span className="text-xs text-gray-500 block truncate">👤 {userName.split(' ')[0]}</span>
                  )}
                </div>
              )}
            </div>
            {!isMobile && (
              <button 
                onClick={toggleSidebar} 
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-all duration-200"
              >
                {isSidebarOpen ? "◀" : "▶"}
              </button>
            )}
            {isMobile && (
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Welcome Section */}
        {isSidebarOpen && userName && (
          <div className="px-4 py-2 border-b border-gray-700 bg-gray-800/50">
            <p className="text-xs text-gray-400">Welcome back,</p>
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 mt-2 overflow-y-auto">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-4">
              {isSidebarOpen && group.title && (
                <div className="px-4 mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.title}
                  </p>
                </div>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  onMouseEnter={(e) => showTooltip(e, item.name, item.description)}
                  onMouseLeave={hideTooltip}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? "bg-gray-800 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  } ${!isSidebarOpen && "justify-center"}`}
                >
                  <span className={`text-xl flex-shrink-0 ${!isSidebarOpen && "text-2xl"}`}>{item.icon}</span>
                  {isSidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{item.name}</span>
                      <span className="text-xs text-gray-500 truncate">{item.description}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* School Info Footer */}
        {isSidebarOpen && schoolInfo.code && (
          <div className="p-2 border-t border-gray-700 bg-gray-800/30">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-gray-400 truncate">{schoolInfo.name}</p>
              <button
                onClick={() => navigator.clipboard.writeText(schoolInfo.code)}
                className="text-gray-500 hover:text-gray-300 text-xs p-1 rounded hover:bg-gray-700 transition-colors"
                title="Copy school code"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 ${
              !isSidebarOpen ? "justify-center" : ""
            }`}
          >
            <span className="text-xl flex-shrink-0">🚪</span>
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {isMobile && (
          <div className="bg-white shadow-sm px-3 py-2 sticky top-0 z-10">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏫</span>
                <span className="font-bold text-gray-800 text-sm">
                  {schoolInfo.name !== "Loading..." ? schoolInfo.name.split(' ').slice(0, 2).join(' ') : "G.S AGATEKO"}
                </span>
              </div>
              {schoolInfo.code && (
                <span className="text-xs text-gray-500">Code: {schoolInfo.code}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}