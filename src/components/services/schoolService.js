import API from "./api";

// ==================== HELPER FUNCTIONS ====================
const safeGetArray = (responseData, fallback = []) => {
  if (!responseData) return fallback;
  if (Array.isArray(responseData)) return responseData;
  if (responseData.data && Array.isArray(responseData.data)) return responseData.data;
  if (responseData.students && Array.isArray(responseData.students)) return responseData.students;
  if (responseData.teachers && Array.isArray(responseData.teachers)) return responseData.teachers;
  if (responseData.courses && Array.isArray(responseData.courses)) return responseData.courses;
  if (responseData.marks && Array.isArray(responseData.marks)) return responseData.marks;
  if (responseData.payments && Array.isArray(responseData.payments)) return responseData.payments;
  if (responseData.items && Array.isArray(responseData.items)) return responseData.items;
  if (responseData.activities && Array.isArray(responseData.activities)) return responseData.activities;
  if (responseData.homeworks && Array.isArray(responseData.homeworks)) return responseData.homeworks;
  if (responseData.visitors && Array.isArray(responseData.visitors)) return responseData.visitors;
  if (responseData.users && Array.isArray(responseData.users)) return responseData.users;
  if (responseData.schools && Array.isArray(responseData.schools)) return responseData.schools;
  if (responseData.categories && Array.isArray(responseData.categories)) return responseData.categories;
  if (responseData.assets && Array.isArray(responseData.assets)) return responseData.assets;
  if (responseData.libraryBooks && Array.isArray(responseData.libraryBooks)) return responseData.libraryBooks;
  if (responseData.laboratoryItems && Array.isArray(responseData.laboratoryItems)) return responseData.laboratoryItems;
  if (responseData.cleaningSupplies && Array.isArray(responseData.cleaningSupplies)) return responseData.cleaningSupplies;
  if (responseData.feedingRecords && Array.isArray(responseData.feedingRecords)) return responseData.feedingRecords;
  if (responseData.borrowedItems && Array.isArray(responseData.borrowedItems)) return responseData.borrowedItems;
  if (responseData.stockRecords && Array.isArray(responseData.stockRecords)) return responseData.stockRecords;
  // If it's an object with numeric keys, convert to array
  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    const values = Object.values(responseData);
    if (values.length > 0 && values.every(v => typeof v === 'object' && v !== null)) {
      return values;
    }
  }
  return fallback;
};

const handleApiError = (error, fallbackData = []) => {
  console.error("API Error:", error);
  return { data: fallbackData, success: false, error: error.message };
};

// ==================== AUTH & PROFILE ====================
export const login = (data) => API.post("/auth/login", data);
export const adminLogin = (data) => API.post("/auth/admin-login", data);
export const getProfile = () => API.get("/auth/profile");
export const updateProfile = (data) => API.put("/auth/profile", data);
export const changePassword = (data) => API.put("/auth/change-password", data);
export const setupSecurity = (data) => API.post("/auth/setup-security", data);
export const setupSuperAdmin = (data) => API.post("/auth/setup-superadmin", data);
export const checkSuperAdminExists = () => API.get("/auth/check-superadmin");

// Password Recovery
export const requestPasswordReset = (data) => API.post("/auth/request-password-reset", data);
export const verifyAndResetPassword = (data) => API.post("/auth/verify-and-reset-password", data);
export const requestSchoolCodeRecovery = (data) => API.post("/auth/request-school-code-recovery", data);
export const verifySecurityAnswer = (data) => API.post("/auth/verify-security-answer", data);

// ==================== STUDENTS ====================
export const getStudents = async (params) => {
  try {
    const response = await API.get("/students", { params: params || {} });
    const data = response.data;
    const students = safeGetArray(data);
    return { ...response, data: students };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getStudentById = (id) => API.get(`/students/${id}`);
export const createStudent = (data) => API.post("/students", data);
export const updateStudent = (id, data) => API.put(`/students/${id}`, data);
export const deleteStudent = (id) => API.delete(`/students/${id}`);
export const getStudentPerformance = (id, params) => API.get(`/students/${id}/performance`, { params: params || {} });
export const getStudentAttendance = (id, params) => API.get(`/students/${id}/attendance`, { params: params || {} });
export const getStudentsByGrade = (grade) => API.get("/students", { params: { grade } });
export const getStudentsByClass = (grade, className) => API.get("/students", { params: { grade, className } });

// ==================== TEACHERS ====================
export const getTeachers = async (params) => {
  try {
    const response = await API.get("/teachers", { params: params || {} });
    const data = response.data;
    const teachers = safeGetArray(data);
    return { ...response, data: teachers };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getTeacherById = (id) => API.get(`/teachers/${id}`);
export const createTeacher = (data) => API.post("/teachers", data);
export const updateTeacher = (id, data) => API.put(`/teachers/${id}`, data);
export const deleteTeacher = (id) => API.delete(`/teachers/${id}`);
export const getTeacherAttendanceStats = (params) => API.get("/teachers/attendance/stats", { params: params || {} });

// ==================== COURSES ====================
export const getCourses = async (params) => {
  try {
    const response = await API.get("/courses", { params: params || {} });
    const data = response.data;
    const courses = safeGetArray(data);
    return { ...response, data: courses };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getCourseById = async (id) => {
  try {
    const response = await API.get(`/courses/${id}`);
    return response;
  } catch (error) {
    console.error("getCourseById error:", error);
    throw error;
  }
};

export const createCourse = async (data) => {
  try {
    const response = await API.post("/courses", data);
    return response;
  } catch (error) {
    console.error("createCourse error:", error);
    throw error;
  }
};

export const updateCourse = async (id, data) => {
  try {
    const response = await API.put(`/courses/${id}`, data);
    return response;
  } catch (error) {
    console.error("updateCourse error:", error);
    throw error;
  }
};

export const deleteCourse = async (id) => {
  try {
    const response = await API.delete(`/courses/${id}`);
    return response;
  } catch (error) {
    console.error("deleteCourse error:", error);
    throw error;
  }
};

export const getCoursesByGrade = async (grade) => {
  try {
    const response = await API.get(`/courses/grade/${grade}`);
    return response;
  } catch (error) {
    console.error("getCoursesByGrade error:", error);
    return { data: [] };
  }
};

// ==================== MARKS & GRADES ====================
export const getMarks = async (params) => {
  try {
    const response = await API.get("/marks", { params: params || {} });
    const data = response.data;
    const marks = safeGetArray(data);
    return { ...response, data: marks };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getClassMarks = async (params) => {
  try {
    const response = await API.get("/marks/class", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getClassMarks error:", error);
    return { data: { students: [], summary: {} } };
  }
};

export const getClassStudents = async (params) => {
  try {
    const response = await API.get("/marks/class-students", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getClassStudents error:", error);
    return { data: { students: [] } };
  }
};

export const getStudentMarks = async (studentId, params) => {
  try {
    const response = await API.get(`/marks/student/${studentId}`, { params: params || {} });
    return response;
  } catch (error) {
    console.error("getStudentMarks error:", error);
    return { data: { marks: [], average: 0, gradeDistribution: {} } };
  }
};

export const bulkUpsertClassMarks = async (data) => {
  try {
    const response = await API.post("/marks/bulk-class", data);
    return response;
  } catch (error) {
    console.error("bulkUpsertClassMarks error:", error);
    throw error;
  }
};

export const bulkUpsertMarks = async (data) => {
  try {
    const response = await API.post("/marks/bulk", data);
    return response;
  } catch (error) {
    console.error("bulkUpsertMarks error:", error);
    throw error;
  }
};

// FIXED: getMarksAnalytics - properly handle params
export const getMarksAnalytics = async (term, year) => {
  try {
    // Build params object properly
    const params = {};
    if (term) params.term = term;
    if (year) params.year = year;
    
    const response = await API.get("/marks/analytics", { params });
    return response;
  } catch (error) {
    console.error("getMarksAnalytics error:", error);
    return { 
      data: { 
        totalStudents: 0, 
        totalMarks: 0,
        averageScore: 0, 
        passRate: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }, 
        coursePerformance: [] 
      } 
    };
  }
};

export const deleteMark = async (id) => {
  try {
    const response = await API.delete(`/marks/${id}`);
    return response;
  } catch (error) {
    console.error("deleteMark error:", error);
    throw error;
  }
};

// ==================== ATTENDANCE ====================
export const getStudentsByClassForAttendance = async (grade, className) => {
  try {
    const response = await API.get("/attendance/students/by-class", { params: { grade, className } });
    return response;
  } catch (error) {
    console.error("getStudentsByClassForAttendance error:", error);
    return { data: { students: [], count: 0 } };
  }
};

export const markStudentAttendance = async (data) => {
  try {
    const response = await API.post("/attendance/students/mark", data);
    return response;
  } catch (error) {
    console.error("markStudentAttendance error:", error);
    throw error;
  }
};

export const getStudentAttendanceByClass = async (params) => {
  try {
    const response = await API.get("/attendance/students/class", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getStudentAttendanceByClass error:", error);
    return { data: { attendance: [] } };
  }
};

export const getStudentAttendanceReport = async (params) => {
  try {
    const response = await API.get("/attendance/students/report", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getStudentAttendanceReport error:", error);
    return { data: { summary: { averageAttendance: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0 }, records: [] } };
  }
};

export const getTeachersForAttendance = async () => {
  try {
    const response = await API.get("/attendance/teachers/list");
    return response;
  } catch (error) {
    console.error("getTeachersForAttendance error:", error);
    return { data: { teachers: [], count: 0 } };
  }
};

export const markTeacherAttendance = async (data) => {
  try {
    const response = await API.post("/attendance/teachers/mark", data);
    return response;
  } catch (error) {
    console.error("markTeacherAttendance error:", error);
    throw error;
  }
};

export const getTeacherAttendanceByDate = async (params) => {
  try {
    const response = await API.get("/attendance/teachers/date", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getTeacherAttendanceByDate error:", error);
    return { data: { attendance: [] } };
  }
};

export const getTeacherAttendanceReport = async (params) => {
  try {
    const response = await API.get("/attendance/teachers/report", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getTeacherAttendanceReport error:", error);
    return { data: { summary: { averageAttendance: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0 }, records: [] } };
  }
};

export const markAttendance = (data) => API.post("/attendance/mark", data);
export const getAttendanceReport = async (params) => {
  try {
    if (params?.userType === "STUDENT") {
      return await getStudentAttendanceReport(params);
    } else if (params?.userType === "TEACHER") {
      return await getTeacherAttendanceReport(params);
    }
    const response = await API.get("/attendance/report", { params: params || {} });
    return response;
  } catch (error) {
    return { data: { summary: {}, records: [] } };
  }
};

// ==================== TRANSPORT ====================
export const getTransportClasses = () => API.get("/transport/classes");
export const getStudentsByClassForTransport = (grade, className) => 
  API.get("/transport/students/by-class", { params: { grade, className } });
export const getTransportPayments = (params) => API.get("/transport/payments", { params: params || {} });
export const createTransportPayment = (data) => API.post("/transport/payments", data);
export const updateTransportPayment = (id, data) => API.put(`/transport/payments/${id}`, data);
export const deleteTransportPayment = (id) => API.delete(`/transport/payments/${id}`);
export const getTransportRecords = (params) => API.get("/transport/records", { params: params || {} });
export const createTransportRecord = (data) => API.post("/transport/records", data);
export const deleteTransportRecord = (id) => API.delete(`/transport/records/${id}`);
export const getTransportFinancialSummary = (year, semester) => 
  API.get("/transport/financial-summary", { params: { year, semester } });
export const getTermPaymentsReport = (term, year, grade, className) => 
  API.get("/transport/term-payments", { params: { term, year, grade, className } });
export const getOutstandingPayments = () => API.get("/transport/outstanding-payments");
export const getTransportByClassReport = (grade, className, semester, year) => 
  API.get("/transport/payments", { params: { grade, className, semester, year } });
export const getStudentTransportHistory = (studentId) => 
  API.get(`/transport/students/${studentId}/history`);

// ==================== PERMISSIONS ====================
export const requestPermission = (data) => API.post("/permissions/request", data);
export const getMyPermissions = () => API.get("/permissions/my-permissions");
export const getAllPermissions = (params) => API.get("/permissions/all", { params: params || {} });
export const approvePermission = (id) => API.put(`/permissions/${id}/approve`);
export const disapprovePermission = (id, data) => API.put(`/permissions/${id}/disapprove`, data);
export const revokePermission = (id) => API.put(`/permissions/${id}/revoke`);
export const getPermissionReport = (params) => API.get("/permissions/report", { params: params || {} });

// ==================== DISCIPLINE ====================
export const addOffense = (data) => API.post("/discipline/offense", data);
export const getStudentDiscipline = (studentId, params) => API.get(`/discipline/student/${studentId}`, { params: params || {} });
export const getClassDisciplineSummary = (params) => API.get("/discipline/class-summary", { params: params || {} });
export const getConductReport = (params) => API.get("/discipline/conduct-report", { params: params || {} });
export const updateConductScore = (studentId, data) => API.put(`/discipline/student/${studentId}/conduct`, data);

// ==================== ENGLISH PERFORMANCE ====================
export const recordEnglishViolation = (data) => API.post("/english-performance/violation", data);
export const getClassEnglishDashboard = (params) => API.get("/english-performance/class-dashboard", { params: params || {} });
export const getStudentEnglishPerformance = (studentId, params) => API.get(`/english-performance/student/${studentId}`, { params: params || {} });
export const getEnglishPerformanceReport = (params) => API.get("/english-performance/report", { params: params || {} });
export const getEnglishViolationsByStudent = (studentId, semester) => API.get(`/english-performance/student/${studentId}`, { params: { semester } });

// ==================== HOMEWORK ====================
export const assignHomework = async (data) => {
  try {
    const response = await API.post("/homework/assign", data);
    return response;
  } catch (error) {
    console.error("assignHomework error:", error);
    throw error;
  }
};

export const getHomeworks = async (params) => {
  try {
    const response = await API.get("/homework", { params: params || {} });
    const data = response.data;
    const homeworks = safeGetArray(data);
    return { ...response, data: homeworks };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getHomeworkById = async (id) => {
  try {
    const response = await API.get(`/homework/${id}`);
    return response;
  } catch (error) {
    console.error("getHomeworkById error:", error);
    throw error;
  }
};

export const getHomeworkSubmissions = async (homeworkId) => {
  try {
    const response = await API.get(`/homework/${homeworkId}/submissions`);
    return response;
  } catch (error) {
    console.error("getHomeworkSubmissions error:", error);
    throw error;
  }
};

export const submitHomework = async (data) => {
  try {
    const response = await API.post("/homework/submit", data);
    return response;
  } catch (error) {
    console.error("submitHomework error:", error);
    throw error;
  }
};

export const gradeHomework = async (data) => {
  try {
    const response = await API.post("/homework/grade", data);
    return response;
  } catch (error) {
    console.error("gradeHomework error:", error);
    throw error;
  }
};

export const updateHomework = async (id, data) => {
  try {
    const response = await API.put(`/homework/${id}`, data);
    return response;
  } catch (error) {
    console.error("updateHomework error:", error);
    throw error;
  }
};

export const deleteHomework = async (id) => {
  try {
    const response = await API.delete(`/homework/${id}`);
    return response;
  } catch (error) {
    console.error("deleteHomework error:", error);
    throw error;
  }
};

export const getHomeworkReport = async (params) => {
  try {
    const response = await API.get("/homework/report", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getHomeworkReport error:", error);
    return { data: { summary: {}, byTeacher: {}, byCourse: [], chartData: {}, homeworks: [] } };
  }
};

export const getHomeworkSummary = async (params) => {
  try {
    const response = await API.get("/homework/summary", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getHomeworkSummary error:", error);
    return { data: { summary: { total: 0, pending: 0, overdue: 0, completed: 0 }, recentHomeworks: [] } };
  }
};

// ==================== SLOW LEARNERS ====================
export const createSlowLearnerCase = (data) => API.post("/slow-learners", data);
export const getSlowLearnerCases = (params) => API.get("/slow-learners", { params: params || {} });
export const getSlowLearnerById = (id) => API.get(`/slow-learners/${id}`);
export const getSlowLearnersByClass = (params) => API.get("/slow-learners/by-class", { params: params || {} });
export const addProgressNote = (id, data) => API.post(`/slow-learners/${id}/progress`, data);
export const updateSlowLearnerStatus = (id, data) => API.put(`/slow-learners/${id}/status`, data);
export const deleteSlowLearnerCase = (id) => API.delete(`/slow-learners/${id}`);
export const getSlowLearnerReport = (params) => API.get("/slow-learners/report", { params: params || {} });

// ==================== VISITORS ====================
export const createVisitor = (data) => API.post("/visitors", data);
export const getVisitors = (params) => API.get("/visitors", { params: params || {} });
export const getVisitorById = (id) => API.get(`/visitors/${id}`);
export const checkoutVisitor = (id) => API.put(`/visitors/${id}/checkout`);
export const updateVisitor = (id, data) => API.put(`/visitors/${id}`, data);
export const deleteVisitor = (id) => API.delete(`/visitors/${id}`);
export const getVisitorStatistics = (params) => API.get("/visitors/statistics", { params: params || {} });
export const getVisitorReport = (params) => API.get("/visitors/report", { params: params || {} });

// ==================== ACTIVITIES ====================
export const assignActivityToClass = async (data) => {
  try {
    const response = await API.post("/activities/assign-to-class", data);
    return response;
  } catch (error) {
    console.error("assignActivityToClass error:", error);
    throw error;
  }
};

export const getClassActivities = async (params) => {
  try {
    const response = await API.get("/activities/class", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getClassActivities error:", error);
    return { data: { activities: [], groupedByBatch: [] } };
  }
};

export const getClassPerformanceDashboard = async (params) => {
  try {
    const response = await API.get("/activities/class-performance", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getClassPerformanceDashboard error:", error);
    return { data: { classInfo: {}, activityTypeStats: {}, studentRanking: [], trendChartData: [] } };
  }
};

export const getActivityTrends = async (params) => {
  try {
    const response = await API.get("/activities/trends", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getActivityTrends error:", error);
    return { data: { trendData: [], summary: {} } };
  }
};

export const getStudentActivities = async (studentId, params) => {
  try {
    const response = await API.get(`/activities/student/${studentId}`, { params: params || {} });
    return response;
  } catch (error) {
    console.error("getStudentActivities error:", error);
    return { data: { statistics: {}, activities: [] } };
  }
};

export const updateStudentScore = async (data) => {
  try {
    const response = await API.put("/activities/update-score", data);
    return response;
  } catch (error) {
    console.error("updateStudentScore error:", error);
    throw error;
  }
};

export const createActivity = async (data) => {
  try {
    const response = await API.post("/activities", data);
    return response;
  } catch (error) {
    console.error("createActivity error:", error);
    throw error;
  }
};

export const getActivities = async (params) => {
  try {
    const response = await API.get("/activities", { params: params || {} });
    const data = response.data;
    const activities = safeGetArray(data);
    return { ...response, data: activities };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getStudentPerformanceByCourse = async (studentId, params) => {
  try {
    const response = await API.get(`/activities/student-performance/${studentId}`, { params: params || {} });
    return response;
  } catch (error) {
    console.error("getStudentPerformanceByCourse error:", error);
    return { data: { coursePerformance: [], overallAverage: 0 } };
  }
};

export const getCoursePerformanceAnalysis = async (params) => {
  try {
    const response = await API.get("/activities/course-analysis", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getCoursePerformanceAnalysis error:", error);
    return { data: { classPerformance: [], weaknessAnalysis: [] } };
  }
};

export const getPerformanceReport = async (params) => {
  try {
    const response = await API.get("/activities/performance-report", { params: params || {} });
    return response;
  } catch (error) {
    console.error("getPerformanceReport error:", error);
    return { data: { summary: {}, courseAverages: [], chartData: {} } };
  }
};

// ==================== REPORTS ====================
export const getDailyReport = (date) => API.get("/reports/daily", { params: { date } });
export const getWeeklyReport = (startDate, endDate) => API.get("/reports/weekly", { params: { startDate, endDate } });
export const getMonthlyReport = (month, year) => API.get("/reports/monthly", { params: { month, year } });
export const getYearlyReport = (year) => API.get("/reports/yearly", { params: { year } });
export const getAcademicReport = (term, year, grade, className) => API.get("/reports/academic", { params: { term, year, grade, className } });

// ==================== DASHBOARDS ====================
export const getSchoolDashboard = () => API.get("/school-dashboard");
export const getTeacherDashboard = () => API.get("/teacher-dashboard");
export const getAdminDashboardStats = () => API.get("/admin/dashboard/stats");
export const getSchoolAdminStats = () => API.get("/admin/school-dashboard/stats");

// ==================== ADMIN - SCHOOL MANAGEMENT ====================
export const getSchools = (params) => API.get("/admin/schools", { params: params || {} });
export const getSchoolById = (id) => API.get(`/admin/schools/${id}`);
export const registerSchool = (data) => API.post("/admin/schools", data);
export const approveSchool = (id) => API.put(`/admin/schools/${id}/approve`);
export const suspendSchool = (id, data) => API.put(`/admin/schools/${id}/suspend`, data);
export const activateSchool = (id) => API.put(`/admin/schools/${id}/activate`);
export const deleteSchool = (id) => API.delete(`/admin/schools/${id}`);
export const updateSubscription = (id, data) => API.put(`/admin/schools/${id}/subscription`, data);

// ==================== ADMIN - USER MANAGEMENT ====================
export const getUsers = (params) => API.get("/admin/users", { params: params || {} });
export const getUserById = (id) => API.get(`/admin/users/${id}`);
export const getSchoolUsers = (schoolId, params) => API.get(`/admin/schools/${schoolId}/users`, { params: params || {} });
export const createUser = (data) => API.post("/admin/users", data);
export const updateUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
export const resetUserPassword = (userId) => API.post(`/admin/users/${userId}/reset-password`);
export const toggleUserStatus = (id, isActive) => API.put(`/admin/users/${id}`, { isActive });

// ==================== INVENTORY - CATEGORIES ====================
export const getCategories = (params) => API.get("/categories", { params: params || {} });
export const getCategoryById = (id) => API.get(`/categories/${id}`);
export const createCategory = (data) => API.post("/categories", data);
export const updateCategory = (id, data) => API.put(`/categories/${id}`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// ==================== INVENTORY - ITEMS ====================
export const getItems = (params) => API.get("/items", { params: params || {} });
export const getItemById = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post("/items", data);
export const updateItem = (id, data) => API.put(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);
export const getLowStockItems = () => API.get("/items/low-stock");
export const getItemsByCategory = (categoryId) => API.get("/items", { params: { category: categoryId } });

// ==================== INVENTORY - STOCK ====================
export const getStockTransactions = (params) => API.get("/stock", { params: params || {} });
export const createStockTransaction = (data) => API.post("/stock", data);
export const updateStockTransaction = (id, data) => API.put(`/stock/${id}`, data);
export const deleteStockTransaction = (id) => API.delete(`/stock/${id}`);
export const getStockByItem = (itemId) => API.get(`/stock/item/${itemId}`);
export const getBorrowedItems = () => API.get("/stock/borrowed");
export const returnBorrowedItem = (id) => API.put(`/stock/${id}/return`);

// ==================== INVENTORY - ASSETS ====================
export const getAssets = (params) => API.get("/assets", { params: params || {} });
export const getAssetById = (id) => API.get(`/assets/${id}`);
export const createAsset = (data) => API.post("/assets", data);
export const updateAsset = (id, data) => API.put(`/assets/${id}`, data);
export const deleteAsset = (id) => API.delete(`/assets/${id}`);

// ==================== INVENTORY - TRACKED ASSETS ====================
export const getTrackedAssets = (params) => API.get("/tracked-assets", { params: params || {} });
export const getTrackedAssetById = (id) => API.get(`/tracked-assets/${id}`);
export const createTrackedAsset = (data) => API.post("/tracked-assets", data);
export const updateTrackedAsset = (id, data) => API.put(`/tracked-assets/${id}`, data);
export const deleteTrackedAsset = (id) => API.delete(`/tracked-assets/${id}`);
export const checkoutTrackedAsset = (id, data) => API.post(`/tracked-assets/${id}/checkout`, data);
export const checkinTrackedAsset = (id) => API.put(`/tracked-assets/${id}/checkin`);

// ==================== INVENTORY - LIBRARY ====================
export const getLibraryBooks = (params) => API.get("/library", { params: params || {} });
export const getLibraryBookById = (id) => API.get(`/library/${id}`);
export const createLibraryBook = (data) => API.post("/library", data);
export const updateLibraryBook = (id, data) => API.put(`/library/${id}`, data);
export const deleteLibraryBook = (id) => API.delete(`/library/${id}`);
export const borrowLibraryBook = (id, data) => API.post(`/library/${id}/borrow`, data);
export const returnLibraryBook = (id) => API.put(`/library/${id}/return`);

// ==================== INVENTORY - LABORATORY ====================
export const getLaboratoryItems = (params) => API.get("/laboratory", { params: params || {} });
export const getLaboratoryItemById = (id) => API.get(`/laboratory/${id}`);
export const createLaboratoryItem = (data) => API.post("/laboratory", data);
export const updateLaboratoryItem = (id, data) => API.put(`/laboratory/${id}`, data);
export const deleteLaboratoryItem = (id) => API.delete(`/laboratory/${id}`);

// ==================== INVENTORY - CLEANING SUPPLIES ====================
export const getCleaningSupplies = (params) => API.get("/cleaning-supplies", { params: params || {} });
export const getCleaningSupplyById = (id) => API.get(`/cleaning-supplies/${id}`);
export const createCleaningSupply = (data) => API.post("/cleaning-supplies", data);
export const updateCleaningSupply = (id, data) => API.put(`/cleaning-supplies/${id}`, data);
export const deleteCleaningSupply = (id) => API.delete(`/cleaning-supplies/${id}`);

// ==================== INVENTORY - FEEDING ====================
export const getFeedingRecords = (params) => API.get("/feeding", { params: params || {} });
export const getFeedingRecordById = (id) => API.get(`/feeding/${id}`);
export const createFeedingRecord = (data) => API.post("/feeding", data);
export const updateFeedingRecord = (id, data) => API.put(`/feeding/${id}`, data);
export const deleteFeedingRecord = (id) => API.delete(`/feeding/${id}`);
export const getFeedingSummary = (params) => API.get("/feeding/summary", { params: params || {} });
export const getWeeklyFeedingReport = () => API.get("/feeding/weekly-report");

// ==================== INVENTORY - PROJECTED NEEDS ====================
export const getProjectedNeeds = (params) => API.get("/projected-needs", { params: params || {} });
export const createProjectedNeed = (data) => API.post("/projected-needs", data);
export const updateProjectedNeed = (id, data) => API.put(`/projected-needs/${id}`, data);
export const deleteProjectedNeed = (id) => API.delete(`/projected-needs/${id}`);

// ==================== INVENTORY - STOCK PERIODS ====================
export const getStockPeriods = (params) => API.get("/stock-periods", { params: params || {} });
export const createStockPeriod = (data) => API.post("/stock-periods", data);
export const updateStockPeriod = (id, data) => API.put(`/stock-periods/${id}`, data);
export const deleteStockPeriod = (id) => API.delete(`/stock-periods/${id}`);
export const closeStockPeriod = (id) => API.post(`/stock-periods/${id}/close`);

// ==================== INVENTORY - STOCK RECORDS ====================
export const getStockRecords = (params) => API.get("/stock-records", { params: params || {} });
export const createStockRecord = (data) => API.post("/stock-records", data);
export const updateStockRecord = (id, data) => API.put(`/stock-records/${id}`, data);
export const deleteStockRecord = (id) => API.delete(`/stock-records/${id}`);