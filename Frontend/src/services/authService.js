import API from "./api";

export const loginUser = (credentials) => API.post("/auth/login", credentials);

export const register = (userData) => API.post("/auth/register", userData);

export const getCurrentUser = () => API.get("/auth/me");

export const logout = () => API.post("/auth/logout");

export const forgotPassword = (email) =>
  API.post("/auth/forgot-password", {
    email,
  });

export const resetPassword = (token, password) =>
  API.post(`/auth/reset-password/${token}`, {
    password,
  });

export const refreshToken = () => API.post("/auth/refresh");
