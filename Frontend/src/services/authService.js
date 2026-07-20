import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

export const register = (data) => API.post("/auth/register", data);

export const loginUser = (data) => API.post("/auth/login", data);

export const getCurrentUser = (token) => API.get("/auth/me");

export const logout = () => API.post("/auth/logout");

export const forgotPassword = (email) =>
  API.post("/auth/forgot-password", { email });

export const resetPassword = (token, password) =>
  API.post(`/auth/reset-password/${token}`, {
    password,
  });

export const refreshToken = () => API.post("/auth/refresh");
