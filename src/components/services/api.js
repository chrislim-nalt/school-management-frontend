import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - IMPORTANT: This adds the token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Ensure token is properly formatted with Bearer prefix
      const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url} - Token attached`);
    } else {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url} - No token`);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
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
      
      // Redirect to login if not already there
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/admin-login") && currentPath !== "/" && !currentPath.includes("/setup")) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default API;