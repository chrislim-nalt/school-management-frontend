import axios from "axios";

// Add /api to the baseURL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Log the API URL for debugging
console.log("📡 API Base URL:", API_URL);

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
      console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    } else {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url} - No token`);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ API Error ${error.response.status}:`, error.response.data);
      
      if (error.response.status === 401) {
        console.error("🔐 Authentication error - clearing token and redirecting");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userType");
        localStorage.removeItem("userName");
        localStorage.removeItem("schoolCode");
        localStorage.removeItem("schoolName");
        
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/admin-login") && currentPath !== "/" && !currentPath.includes("/setup")) {
          window.location.href = "/";
        }
      }
    } else if (error.request) {
      console.error("❌ No response received:", error.request);
    } else {
      console.error("❌ Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;