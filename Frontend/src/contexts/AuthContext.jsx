import { createContext, useEffect, useState } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const normalizeUser = (user) => {
    if (!user) return null;

    return {
      ...user,
      _id: user._id || user.id,
      id: user.id || user._id,
    };
  };

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser || savedUser === "undefined") {
        return null;
      }

      return normalizeUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const setAuthData = (userData) => {
    const normalizedUser = normalizeUser(userData);

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const clearAuthData = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        await authService.refreshToken();

        const userRes = await authService.getCurrentUser();
        const userData = normalizeUser(userRes.data.user);

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await authService.loginUser({
      email,
      password,
    });

    const userData = normalizeUser(res.data.user);

    setAuthData(userData);

    return userData;
  };

  const register = async ({ username, email, password }) => {
    const res = await authService.register({
      username,
      email,
      password,
    });

    const userData = normalizeUser(res.data.user);

    setAuthData(userData);

    return userData;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error(error);
    }

    clearAuthData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        setAuthData,
        clearAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
