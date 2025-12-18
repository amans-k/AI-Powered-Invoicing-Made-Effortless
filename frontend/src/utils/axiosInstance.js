import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 80000, // 80 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    // Request error
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Successful response
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with a status code outside 2xx
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      if (status === 500) {
        console.error("Server error. Please try again later.");
      } else if (status === 401) {
        console.error("Unauthorized. Please login again.");
      } else if (status === 400) {
        console.error("Bad request:", message);
      } else {
        console.error(`Error ${status}:`, message);
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    } else {
      console.error("Network error or server not reachable:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
