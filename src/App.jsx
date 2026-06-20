import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";

// Lazy load components to prevent import errors
const Login = lazy(() => import("./components/pages/Login"));
const AdminLogin = lazy(() => import("./components/pages/AdminLogin"));
const Register = lazy(() => import("./components/pages/Register"));
const SetupSuperAdmin = lazy(() => import("./components/pages/SetupSuperAdmin"));
const Dashboard = lazy(() => import("./components/pages/Dashboard"));
const Profile = lazy(() => import("./components/pages/Profile"));
const Categories = lazy(() => import("./components/pages/Categories"));
const Items = lazy(() => import("./components/pages/Items"));
const Stock = lazy(() => import("./components/pages/Stock"));
const Assets = lazy(() => import("./components/pages/Assets"));
const Laboratory = lazy(() => import("./components/pages/Laboratory"));
const Library = lazy(() => import("./components/pages/Library"));
const CleaningSupplies = lazy(() => import("./components/pages/CleaningSupplies"));
const BorrowedItems = lazy(() => import("./components/pages/BorrowedItems"));
const TrackedAssets = lazy(() => import("./components/pages/TrackedAssets"));
const FeedingRecords = lazy(() => import("./components/pages/FeedingRecords"));

// School Management
const SchoolDashboard = lazy(() => import("./components/pages/school/SchoolDashboard"));
const Teachers = lazy(() => import("./components/pages/school/Teachers"));
const Students = lazy(() => import("./components/pages/school/Students"));
const Courses = lazy(() => import("./components/pages/school/Courses"));
const Marks = lazy(() => import("./components/pages/school/Marks"));
const Attendance = lazy(() => import("./components/pages/school/Attendance"));
const Transport = lazy(() => import("./components/pages/school/Transport"));
const SchoolReports = lazy(() => import("./components/pages/school/SchoolReports"));
const Permissions = lazy(() => import("./components/pages/school/Permissions"));
const Discipline = lazy(() => import("./components/pages/school/Discipline"));
const EnglishPerformance = lazy(() => import("./components/pages/school/EnglishPerformance"));
const Homework = lazy(() => import("./components/pages/school/Homework"));
const SlowLearners = lazy(() => import("./components/pages/school/SlowLearners"));
const Visitors = lazy(() => import("./components/pages/school/Visitors"));
const Activities = lazy(() => import("./components/pages/school/Activities"));
const TeacherDashboard = lazy(() => import("./components/pages/school/TeacherDashboard"));

// Super Admin
const AdminLayout = lazy(() => import("./components/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./components/pages/admin/AdminDashboard"));
const AdminSchools = lazy(() => import("./components/pages/admin/AdminSchools"));
const AdminUsers = lazy(() => import("./components/pages/admin/AdminUsers"));
const AdminSchoolDetail = lazy(() => import("./components/pages/admin/AdminSchoolDetail"));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Login />} />
          <Route path="/setup" element={<SetupSuperAdmin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/redirect" element={<RoleBasedRedirect />} />

          {/* PROTECTED ROUTES - Inventory */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><Layout><Items /></Layout></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute><Layout><Stock /></Layout></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Layout><Assets /></Layout></ProtectedRoute>} />
          <Route path="/laboratory" element={<ProtectedRoute><Layout><Laboratory /></Layout></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>} />
          <Route path="/cleaning-supplies" element={<ProtectedRoute><Layout><CleaningSupplies /></Layout></ProtectedRoute>} />
          <Route path="/borrowed" element={<ProtectedRoute><Layout><BorrowedItems /></Layout></ProtectedRoute>} />
          <Route path="/tracked-assets" element={<ProtectedRoute><Layout><TrackedAssets /></Layout></ProtectedRoute>} />
          <Route path="/feeding" element={<ProtectedRoute><Layout><FeedingRecords /></Layout></ProtectedRoute>} />

          {/* SCHOOL MANAGEMENT ROUTES */}
          <Route path="/school-dashboard" element={<ProtectedRoute><Layout><SchoolDashboard /></Layout></ProtectedRoute>} />
          <Route path="/teacher-dashboard" element={<ProtectedRoute requiredUserType={["teacher"]}><Layout><TeacherDashboard /></Layout></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute requiredUserType={["school_admin"]}><Layout><Teachers /></Layout></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><Students /></Layout></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><Courses /></Layout></ProtectedRoute>} />
          <Route path="/marks" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><Marks /></Layout></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute requiredUserType={["school_admin", "teacher", "customer_care"]}><Layout><Attendance /></Layout></ProtectedRoute>} />
          <Route path="/transport" element={<ProtectedRoute requiredUserType={["school_admin", "bursar"]}><Layout><Transport /></Layout></ProtectedRoute>} />
          <Route path="/school-reports" element={<ProtectedRoute requiredUserType={["school_admin"]}><Layout><SchoolReports /></Layout></ProtectedRoute>} />
          <Route path="/permissions" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><Permissions /></Layout></ProtectedRoute>} />
          <Route path="/discipline" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><Discipline /></Layout></ProtectedRoute>} />
          <Route path="/english-performance" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><EnglishPerformance /></Layout></ProtectedRoute>} />
          <Route path="/homework" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><Homework /></Layout></ProtectedRoute>} />
          <Route path="/slow-learners" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><SlowLearners /></Layout></ProtectedRoute>} />
          <Route path="/visitors" element={<ProtectedRoute requiredUserType={["school_admin", "customer_care"]}><Layout><Visitors /></Layout></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute requiredUserType={["school_admin", "teacher"]}><Layout><Activities /></Layout></ProtectedRoute>} />

          {/* SUPER ADMIN ROUTES */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="superadmin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/schools" element={<ProtectedRoute requiredRole="superadmin"><AdminLayout><AdminSchools /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/schools/:id" element={<ProtectedRoute requiredRole="superadmin"><AdminLayout><AdminSchoolDetail /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="superadmin"><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;