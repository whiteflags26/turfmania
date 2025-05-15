// lib/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

if (typeof window !== "undefined") {
  // Only run in the browser
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.location.href = "/";
      }
      // Convert the error to a proper Error object before rejecting
      return Promise.reject(new Error(error.message ?? "An error occurred"));
    }
  );
}

export default api;
