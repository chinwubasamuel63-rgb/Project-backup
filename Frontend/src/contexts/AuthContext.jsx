import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import * as authService from "../services/authService";
import { AuthContext } from "./AuthContext.js";

// Socket.IO connects to the server origin, while REST calls use the /api path.
const SOCKET_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");

export default function AuthProvider({ children }) {
  const [socket, setSocket] = useState(null);

  const normalizeUser = (user) => {
    if (!user) return null;

    return {
      ...user,
      _id: user._id || user.id,
      id: user.id || user._id,
      role: typeof user.role === "string" ? user.role.toLowerCase() : user.role,
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

  // Manage Socket Connection & Joining Room based on User state
  useEffect(() => {
    if (!user || !user._id) return;

    // Get JWT token from localStorage
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token: token, // Send JWT token in auth
      },
    });

    const socketTimer = window.setTimeout(() => setSocket(newSocket), 0);

    newSocket.on("connect", () => {
      // Emit join event with the user's MongoDB ID
      newSocket.emit("join", user._id);
    });

    const handleNotification = (payload) => {
      window.dispatchEvent(
        new CustomEvent("devstream:notification-received", {
          detail: {
            notification: payload?.notification || null,
            unreadCount: payload?.unreadCount ?? 0,
          },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("devstream:notifications-updated", {
          detail: {
            notification: payload?.notification || null,
            unreadCount: payload?.unreadCount ?? 0,
          },
        }),
      );
    };

    newSocket.on("notification", handleNotification);

    const handleNotificationRead = (payload) => {
      window.dispatchEvent(
        new CustomEvent("devstream:notification-read", { detail: payload }),
      );
    };
    const handleAllNotificationsRead = (payload) => {
      window.dispatchEvent(
        new CustomEvent("devstream:notifications-read-all", {
          detail: payload,
        }),
      );
    };
    const handleNotificationDeleted = (payload) => {
      window.dispatchEvent(
        new CustomEvent("devstream:notification-deleted", { detail: payload }),
      );
    };

    newSocket.on("notificationRead", handleNotificationRead);
    newSocket.on("allNotificationsRead", handleAllNotificationsRead);
    newSocket.on("notificationDeleted", handleNotificationDeleted);

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return () => {
      newSocket.off("notification", handleNotification);
      newSocket.off("notificationRead", handleNotificationRead);
      newSocket.off("allNotificationsRead", handleAllNotificationsRead);
      newSocket.off("notificationDeleted", handleNotificationDeleted);
      window.clearTimeout(socketTimer);
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        await authService.refreshToken();

        const userRes = await authService.getCurrentUser();
        const userData = normalizeUser(userRes.data.user);

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch {
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
      if (socket) socket.disconnect();
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
        socket,
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
