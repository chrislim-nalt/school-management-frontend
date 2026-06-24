import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "./services/api";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState({ name: "Loading...", code: "" });
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userType, setUserType] = useState("");
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const tooltipTimeoutRef = useRef(null);

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
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isMobile) setIsMobileDrawerOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const storedUserType = localStorage.getItem("userType");
        const storedUserRole = localStorage.getItem("userRole");
        setUserType(storedUserType || storedUserRole || "staff");
        setUserRole(storedUserRole || "staff");
        
        const response = await API.get("/auth/profile");
        const user = response.data;
        setUserName(user.name);
        
        if (user.school) {
          setSchoolInfo({ name: user.school.name, code: user.school.schoolCode });
          localStorage.setItem("schoolName", user.school.name);
          localStorage.setItem("schoolCode", user.school.schoolCode);
        } else {
          const schoolName = localStorage.getItem("schoolName");
          const schoolCode = localStorage.getItem("schoolCode");
          if (schoolName) setSchoolInfo({ name: schoolName, code: schoolCode || "" });
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        const schoolName = localStorage.getItem("schoolName");
        const schoolCode = localStorage.getItem("schoolCode");
        if (schoolName) setSchoolInfo({ name: schoolName, code: schoolCode || "" });
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("schoolName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userType");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const showTooltip = (e, itemName, itemDesc) => {
    if (!isSidebarOpen && !isMobile && itemName && itemDesc) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ 
        show: true, 
        text: `${itemName} — ${itemDesc}`, 
        x: rect.right + 12, 
        y: rect.top + rect.height / 2 
      });
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    }
  };

  const hideTooltip = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip({ show: false, text: "", x: 0, y: 0 });
    }, 150);
  };

  const clearTooltip = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setTooltip({ show: false, text: "", x: 0, y: 0 });
  };

  // Role-based detection
  const isSuperAdmin = userRole === "superadmin";
  const isSchoolAdmin = userType === "school_admin" || userRole === "admin";
  const isTeacher = userType === "teacher" || userType === "staff";
  const isBursar = userType === "bursar";
  const isStockKeeper = userType === "stock_keeper";
  const isCustomerCare = userType === "customer_care";

  // ============================================================
  // PROFESSIONAL MENU STRUCTURE - SCHOOL FEATURES FIRST
  // ============================================================
  const getMenuGroups = () => {
    // Super Admin
    if (isSuperAdmin) {
      return [
        {
          title: "Administration",
          items: [
            { path: "/profile", name: "My Profile", icon: "👤", description: "Manage your account", roles: ["all"] },
          ],
        },
      ];
    }

    // Customer Care
    if (isCustomerCare) {
      return [
        {
          title: "👥 Visitor Management",
          items: [
            { path: "/visitors", name: "Visitors", icon: "👥", description: "Manage visitors", roles: ["customer_care"] },
            { path: "/visitors/report", name: "Visitor Report", icon: "📊", description: "Visitor statistics", roles: ["customer_care"] },
          ],
        },
        {
          title: "✅ Attendance",
          items: [
            { path: "/attendance", name: "Teacher Attendance", icon: "✅", description: "Mark teacher attendance", roles: ["customer_care"] },
          ],
        },
      ];
    }

    // ============================================================
    // TEACHER MENU
    // ============================================================
    if (isTeacher && !isSchoolAdmin && !isBursar) {
      return [
        {
          title: "📊 Overview",
          items: [
            { path: "/teacher-dashboard", name: "My Dashboard", icon: "📊", description: "Teacher overview", roles: ["teacher"] },
            { path: "/profile", name: "My Profile", icon: "👤", description: "Manage your account", roles: ["teacher"] },
          ],
        },
        {
          title: "🎓 Academic Management",
          items: [
            { path: "/students", name: "My Students", icon: "👨‍🎓", description: "View and manage students", roles: ["teacher"] },
            { path: "/courses", name: "My Courses", icon: "📖", description: "View assigned courses", roles: ["teacher"] },
            { path: "/marks", name: "Marks & Grades", icon: "📝", description: "Record student marks", roles: ["teacher"] },
            { path: "/attendance", name: "Student Attendance", icon: "✅", description: "Mark student attendance", roles: ["teacher"] },
          ],
        },
        {
          title: "📚 Teaching Tools",
          items: [
            { path: "/homework", name: "Homework", icon: "📚", description: "Assign and grade homework", roles: ["teacher"] },
            { path: "/activities", name: "Activities", icon: "📝", description: "Exercises & quizzes", roles: ["teacher"] },
            { path: "/permissions", name: "Leave Requests", icon: "📋", description: "Request time off", roles: ["teacher"] },
          ],
        },
        {
          title: "🤝 Student Support",
          items: [
            { path: "/discipline", name: "Discipline", icon: "⚠️", description: "Track student conduct", roles: ["teacher"] },
            { path: "/english-performance", name: "English Performance", icon: "🇬🇧", description: "English compliance", roles: ["teacher"] },
            { path: "/slow-learners", name: "Slow Learners", icon: "🎯", description: "Additional support", roles: ["teacher"] },
          ],
        },
      ];
    }

    // ============================================================
    // BURSAR MENU - School Features + Inventory
    // ============================================================
    if (isBursar) {
      return [
        // SCHOOL FEATURES FIRST
        {
          title: "📊 Overview",
          items: [
            { path: "/transport", name: "Dashboard", icon: "📊", description: "Financial overview", roles: ["bursar"] },
            { path: "/profile", name: "My Profile", icon: "👤", description: "Manage your account", roles: ["bursar"] },
          ],
        },
        {
          title: "💰 Finance & Transport",
          items: [
            { path: "/transport", name: "Transport Management", icon: "🚌", description: "Transport payments & records", roles: ["bursar"] },
          ],
        },
        // INVENTORY MANAGEMENT SECONDARY
        {
          title: "📦 Inventory Management",
          items: [
            { path: "/categories", name: "Categories", icon: "📂", description: "Organize inventory categories", roles: ["bursar"] },
            { path: "/items", name: "Items", icon: "🛒", description: "Manage inventory items", roles: ["bursar"] },
            { path: "/stock", name: "Stock Management", icon: "📦", description: "Track stock movements", roles: ["bursar"] },
            { path: "/borrowed", name: "Borrowed Items", icon: "📋", description: "Manage borrowed items", roles: ["bursar"] },
          ],
        },
        {
          title: "🏗️ Facility & Asset Management",
          items: [
            { path: "/assets", name: "Assets", icon: "🏗️", description: "School assets", roles: ["bursar"] },
            { path: "/tracked-assets", name: "Computer Lab", icon: "💻", description: "Computer tracking", roles: ["bursar"] },
            { path: "/laboratory", name: "Laboratory", icon: "🔬", description: "Lab equipment", roles: ["bursar"] },
            { path: "/library", name: "Library", icon: "📚", description: "Books collection", roles: ["bursar"] },
            { path: "/cleaning-supplies", name: "Cleaning Supplies", icon: "🧹", description: "Cleaning inventory", roles: ["bursar"] },
            { path: "/feeding", name: "Feeding Records", icon: "🍽️", description: "Food management", roles: ["bursar"] },
          ],
        },
      ];
    }

    // ============================================================
    // STOCK KEEPER MENU - Inventory Focus
    // ============================================================
    if (isStockKeeper) {
      return [
        {
          title: "📊 Overview",
          items: [
            { path: "/profile", name: "My Profile", icon: "👤", description: "Manage your account", roles: ["stock_keeper"] },
          ],
        },
        {
          title: "📦 Inventory Management",
          items: [
            { path: "/categories", name: "Categories", icon: "📂", description: "Organize items", roles: ["stock_keeper"] },
            { path: "/items", name: "Items", icon: "🛒", description: "Manage inventory", roles: ["stock_keeper"] },
            { path: "/stock", name: "Stock Management", icon: "📦", description: "Track movements", roles: ["stock_keeper"] },
            { path: "/borrowed", name: "Borrowed Items", icon: "📋", description: "Manage borrows", roles: ["stock_keeper"] },
          ],
        },
        {
          title: "🏗️ Facility & Asset Management",
          items: [
            // { path: "/assets", name: "Assets", icon: "🏗️", description: "School assets", roles: ["stock_keeper"] },
            { path: "/tracked-assets", name: "Computer Lab", icon: "💻", description: "Computer Tracking", roles: ["stock_keeper"] },
            // { path: "/laboratory", name: "Laboratory", icon: "🔬", description: "Lab equipment", roles: ["stock_keeper"] },
            // { path: "/library", name: "Library", icon: "📚", description: "Books collection", roles: ["stock_keeper"] },
            { path: "/cleaning-supplies", name: "Cleaning Supplies", icon: "🧹", description: "Cleaning inventory", roles: ["stock_keeper"] },
            { path: "/feeding", name: "Feeding Records", icon: "🍽️", description: "Food management", roles: ["stock_keeper"] },
          ],
        },
      ];
    }

    // ============================================================
    // SCHOOL ADMIN - Full Access with Professional Flow
    // ============================================================
    if (isSchoolAdmin) {
      return [
        // SECTION 1: OVERVIEW
        {
          title: "📊 Overview",
          items: [
            { path: "/school-dashboard", name: "Dashboard", icon: "📈", description: "Performance analytics", roles: ["school_admin"] },
            { path: "/profile", name: "My Profile", icon: "👤", description: "Manage your account", roles: ["school_admin"] },
          ],
        },
        // SECTION 2: ACADEMIC MANAGEMENT
        {
          title: "🎓 Academic Management",
          items: [
            { path: "/teachers", name: "Teachers", icon: "👨‍🏫", description: "Manage teachers", roles: ["school_admin"] },
            { path: "/students", name: "Students", icon: "👨‍🎓", description: "Manage students", roles: ["school_admin"] },
            { path: "/courses", name: "Courses", icon: "📖", description: "Subject management", roles: ["school_admin"] },
            { path: "/marks", name: "Marks & Grades", icon: "📝", description: "Record student marks", roles: ["school_admin"] },
            { path: "/attendance", name: "Attendance", icon: "✅", description: "Track attendance", roles: ["school_admin"] },
          ],
        },
        // SECTION 3: STUDENT SUPPORT
        {
          title: "🤝 Student Support",
          items: [
            { path: "/discipline", name: "Discipline", icon: "⚠️", description: "Track student conduct", roles: ["school_admin"] },
            { path: "/english-performance", name: "English Performance", icon: "🇬🇧", description: "English compliance", roles: ["school_admin"] },
            { path: "/slow-learners", name: "Slow Learners", icon: "🎯", description: "Additional support", roles: ["school_admin"] },
          ],
        },
        // SECTION 4: TEACHER TOOLS
        {
          title: "👨‍🏫 Teacher Tools",
          items: [
            { path: "/homework", name: "Homework", icon: "📚", description: "Manage homework", roles: ["school_admin"] },
            { path: "/activities", name: "Activities", icon: "📝", description: "Manage activities", roles: ["school_admin"] },
            { path: "/permissions", name: "Leave Requests", icon: "📋", description: "Manage leave requests", roles: ["school_admin"] },
          ],
        },
        // SECTION 5: FINANCE & TRANSPORT
        {
          title: "💰 Finance & Transport",
          items: [
            { path: "/transport", name: "Transport Management", icon: "🚌", description: "Transport payments", roles: ["school_admin"] },
          ],
        },
        // SECTION 6: VISITOR MANAGEMENT
        {
          title: "👥 Visitor Management",
          items: [
            { path: "/visitors", name: "Visitors", icon: "👥", description: "Manage visitors", roles: ["school_admin"] },
          ],
        },
        // SECTION 7: REPORTS
        {
          title: "📊 Reports",
          items: [
            { path: "/school-reports", name: "Reports", icon: "📊", description: "Generate reports", roles: ["school_admin"] },
          ],
        },
        // SECTION 8: INVENTORY MANAGEMENT
        {
          title: "📦 Inventory Management",
          items: [
            { path: "/categories", name: "Categories", icon: "📂", description: "Organize items", roles: ["school_admin"] },
            { path: "/items", name: "Items", icon: "🛒", description: "Manage inventory", roles: ["school_admin"] },
            { path: "/stock", name: "Stock Management", icon: "📦", description: "Track movements", roles: ["school_admin"] },
            { path: "/borrowed", name: "Borrowed Items", icon: "📋", description: "Manage borrows", roles: ["school_admin"] },
          ],
        },
        // SECTION 9: FACILITY & ASSET MANAGEMENT
        {
          title: "🏗️ Facility & Asset Management",
          items: [
            { path: "/assets", name: "Assets", icon: "🏗️", description: "School assets", roles: ["school_admin"] },
            { path: "/tracked-assets", name: "Computer Lab", icon: "💻", description: "Computer tracking", roles: ["school_admin"] },
            { path: "/laboratory", name: "Laboratory", icon: "🔬", description: "Lab equipment", roles: ["school_admin"] },
            { path: "/library", name: "Library", icon: "📚", description: "Books collection", roles: ["school_admin"] },
            { path: "/cleaning-supplies", name: "Cleaning Supplies", icon: "🧹", description: "Cleaning inventory", roles: ["school_admin"] },
            { path: "/feeding", name: "Feeding Records", icon: "🍽️", description: "Food management", roles: ["school_admin"] },
          ],
        },
      ];
    }

    // Default fallback
    return [
      {
        title: "Navigation",
        items: [
          { path: "/profile", name: "My Profile", icon: "👤", description: "Manage your account", roles: ["all"] },
        ],
      },
    ];
  };

  const menuGroups = getMenuGroups();

  // ============================================================
  // BOTTOM NAVIGATION - School Features First
  // ============================================================
  const getBottomNavItems = () => {
    if (isSuperAdmin) {
      return [{ path: "/profile", name: "Profile", icon: "👤" }];
    }
    
    if (isCustomerCare) {
      return [
        { path: "/visitors", name: "Visitors", icon: "👥" },
        { path: "/attendance", name: "Attendance", icon: "✅" },
        { path: "/profile", name: "Profile", icon: "👤" },
      ];
    }
    
    if (isTeacher && !isSchoolAdmin && !isBursar) {
      return [
        { path: "/teacher-dashboard", name: "Dashboard", icon: "📊" },
        { path: "/students", name: "Students", icon: "👨‍🎓" },
        { path: "/attendance", name: "Attendance", icon: "✅" },
        { path: "/profile", name: "Profile", icon: "👤" },
      ];
    }
    
    if (isBursar) {
      return [
        { path: "/transport", name: "Transport", icon: "🚌" },
        { path: "/items", name: "Items", icon: "🛒" },
        { path: "/profile", name: "Profile", icon: "👤" },
      ];
    }
    
    if (isStockKeeper) {
      return [
        { path: "/items", name: "Items", icon: "🛒" },
        { path: "/stock", name: "Stock", icon: "📦" },
        { path: "/profile", name: "Profile", icon: "👤" },
      ];
    }
    
    // School admin or default - School Features First
    return [
      { path: "/school-dashboard", name: "Dashboard", icon: "📊" },
      { path: "/students", name: "Students", icon: "👨‍🎓" },
      { path: "/profile", name: "Profile", icon: "👤" },
    ];
  };

  const bottomNavItems = getBottomNavItems();

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const filterItemsByRole = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(item => {
      if (!item) return false;
      if (item.roles && !item.roles.includes("all")) {
        if (isSchoolAdmin && item.roles.includes("school_admin")) return true;
        if (isTeacher && item.roles.includes("teacher")) return true;
        if (isBursar && item.roles.includes("bursar")) return true;
        if (isStockKeeper && item.roles.includes("stock_keeper")) return true;
        if (isCustomerCare && item.roles.includes("customer_care")) return true;
        return false;
      }
      return true;
    });
  };

  const getUserTypeDisplay = () => {
    if (isSuperAdmin) return "Super Administrator";
    if (isSchoolAdmin) return "School Administrator";
    if (isTeacher) return "Teacher";
    if (isBursar) return "Bursar / Accountant";
    if (isStockKeeper) return "Stock Keeper";
    if (isCustomerCare) return "Customer Care";
    return "Staff Member";
  };

  const getUserTypeIcon = () => {
    if (isSuperAdmin) return "👑";
    if (isSchoolAdmin) return "🏫";
    if (isTeacher) return "👨‍🏫";
    if (isBursar) return "💰";
    if (isStockKeeper) return "📦";
    if (isCustomerCare) return "🤝";
    return "👤";
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Tooltip */}
      {tooltip.show && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateY(-50%)",
            zIndex: 9999,
            backgroundColor: "#1f2937",
            color: "white",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            fontFamily: "sans-serif",
          }}
        >
          {tooltip.text}
          <div
            style={{
              position: "absolute",
              left: "-5px",
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "5px solid #1f2937",
            }}
          />
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <div
          className={`${isSidebarOpen ? "w-64" : "w-16"} bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 shadow-2xl`}
        >
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-2xl flex-shrink-0">{getUserTypeIcon()}</span>
                {isSidebarOpen && (
                  <div className="overflow-hidden">
                    <span className="font-bold text-lg block truncate">
                      {schoolInfo.name !== "Loading..." ? schoolInfo.name.split(" ").slice(0, 2).join(" ") : "School"}
                    </span>
                    {schoolInfo.code && <span className="text-xs text-gray-400 block truncate">Code: {schoolInfo.code}</span>}
                  </div>
                )}
              </div>
              <button
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
              >
                {isSidebarOpen ? "◀" : "▶"}
              </button>
            </div>
          </div>

          {isSidebarOpen && userName && (
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Welcome back,</p>
                  <p className="text-sm font-semibold text-white truncate">{userName}</p>
                  <p className="text-xs text-indigo-400 truncate">{getUserTypeDisplay()}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 mt-4 overflow-y-auto">
            {menuGroups.map((group, groupIdx) => {
              const filteredItems = filterItemsByRole(group.items);
              if (filteredItems.length === 0) return null;
              
              return (
                <div key={groupIdx} className="mb-4">
                  {isSidebarOpen && group.title && (
                    <div className="px-4 mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.title}</p>
                    </div>
                  )}
                  {filteredItems.map((item) => {
                    if (!item || !item.path) return null;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onMouseEnter={(e) => showTooltip(e, item.name, item.description)}
                        onMouseLeave={hideTooltip}
                        onMouseMove={clearTooltip}
                        className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-200 ${
                          isActive(item.path)
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                            : "text-gray-300 hover:bg-slate-800 hover:text-white"
                        } ${!isSidebarOpen ? "justify-center" : ""}`}
                      >
                        <span className={`flex-shrink-0 ${!isSidebarOpen ? "text-2xl" : "text-xl"}`}>
                          {item.icon || "📄"}
                        </span>
                        {isSidebarOpen && (
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate">{item.name || "Item"}</span>
                            <span className="text-xs text-gray-500 truncate">{item.description || ""}</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {isSidebarOpen && schoolInfo.code && (
            <div className="p-2 border-t border-slate-700 bg-slate-800/30">
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

          <div className="p-3 border-t border-slate-700">
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
      )}

      {/* MOBILE DRAWER */}
      {isMobile && (
        <>
          {isMobileDrawerOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
          )}

          <div
            className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
              isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="p-4 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">{getUserTypeIcon()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white">{getUserTypeDisplay()}</p>
                    {schoolInfo.code && <p className="text-xs text-gray-400">Code: {schoolInfo.code}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {userName && (
                <div className="mt-3 flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Logged in as</p>
                    <p className="text-sm font-semibold text-white">{userName}</p>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              {menuGroups.map((group, groupIdx) => {
                const filteredItems = filterItemsByRole(group.items);
                if (filteredItems.length === 0) return null;
                
                return (
                  <div key={groupIdx} className="mb-3">
                    <div className="px-4 py-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{group.title}</p>
                    </div>
                    {filteredItems.map((item) => {
                      if (!item || !item.path) return null;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileDrawerOpen(false)}
                          className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-xl transition-all duration-150 ${
                            isActive(item.path)
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                              : "text-gray-300 hover:bg-slate-800 hover:text-white active:bg-slate-700"
                          }`}
                        >
                          <span className="text-2xl w-8 text-center flex-shrink-0">{item.icon || "📄"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight">{item.name || "Item"}</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{item.description || ""}</p>
                          </div>
                          {isActive(item.path) && (
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-700 space-y-2">
              {schoolInfo.code && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-gray-400 truncate">{schoolInfo.name}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(schoolInfo.code)}
                    className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-slate-700 transition-colors ml-2 flex-shrink-0"
                    title="Copy school code"
                  >
                    📋 Copy
                  </button>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTENT */}
      <div className={`flex-1 overflow-auto flex flex-col ${isMobile ? "pb-20" : ""}`}>

        {/* Mobile top bar */}
        {isMobile && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-3 sticky top-0 z-30 flex items-center gap-3 shadow-lg">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xl">{getUserTypeIcon()}</span>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate">
                  {schoolInfo.name !== "Loading..." ? schoolInfo.name.split(" ").slice(0, 3).join(" ") : "School"}
                </p>
                {schoolInfo.code && <p className="text-xs text-gray-400">Code: {schoolInfo.code}</p>}
              </div>
            </div>

            <div className="flex-shrink-0">
              {(() => {
                try {
                  const allItems = menuGroups.flatMap((g) => filterItemsByRole(g?.items || []));
                  const current = allItems.find((i) => i && i.path === location.pathname);
                  return current ? (
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-gray-300">
                      {current.icon || "📄"} {current.name || "Page"}
                    </span>
                  ) : null;
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6">
          {children}
        </div>
      </div>

      {/* MOBILE BOTTOM NAV BAR */}
      {isMobile && bottomNavItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700 shadow-2xl">
          <div className="flex items-stretch">
            {bottomNavItems.map((item) => {
              if (!item || !item.path) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all duration-150 ${
                    isActive(item.path)
                      ? "text-indigo-400 bg-slate-800"
                      : "text-gray-400 hover:text-white hover:bg-slate-800 active:bg-slate-700"
                  }`}
                >
                  <span className="text-xl leading-none">{item.icon || "📄"}</span>
                  <span className="text-xs mt-1 font-medium leading-tight text-center">{item.name || "Item"}</span>
                  {isActive(item.path) && (
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1" />
                  )}
                </Link>
              );
            })}

            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all duration-150 text-gray-400 hover:text-white hover:bg-slate-800 active:bg-slate-700`}
            >
              <span className="text-xl leading-none">☰</span>
              <span className="text-xs mt-1 font-medium leading-tight">More</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}