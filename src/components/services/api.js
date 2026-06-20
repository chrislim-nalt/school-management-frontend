import axios from "axios";

// Add /api to the baseURL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
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
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
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
    return Promise.reject(error);
  }
);

export default API;