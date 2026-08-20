import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import * as authService from "../services/authService";
import { AuthContext } from "./AuthContext.js";

// Socket.IO connects directly to the Render backend.
// REST API requests use the Vercel /api proxy.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://devstream-nexus.onrender.com";

export default function AuthProvider({ children }) {
  const [socket, setSocket] = useState(null);

  const normalizeUser = (user) => {
    if (!user) return null;

    return {
      ...user,
      _id: user._id || user.id,
      id: user.id || user._id,
      role:
        typeof user.role === "string"
          ? user.role.toLowerCase()
          : user.role,
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

  // ---------------------------------------------------------
  // SOCKET.IO
  // ---------------------------------------------------------

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,

      // Start with polling and allow Socket.IO to upgrade
      // to WebSocket after the connection is established.
      transports: ["polling", "websocket"],
    });

    const socketTimer = window.setTimeout(() => {
      setSocket(newSocket);
    }, 0);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);

      newSocket.emit("join", user._id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    // -------------------------------------------------------
    // NOTIFICATIONS
    // -------------------------------------------------------

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

    const handleNotificationRead = (payload) => {
      window.dispatchEvent(
        new CustomEvent("devstream:notification-read", {
          detail: payload,
        }),
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
        new CustomEvent("devstream:notification-deleted", {
          detail: payload,
        }),
      );
    };

    newSocket.on("notification", handleNotification);
    newSocket.on("notificationRead", handleNotificationRead);
    newSocket.on(
      "allNotificationsRead",
      handleAllNotificationsRead,
    );
    newSocket.on(
      "notificationDeleted",
      handleNotificationDeleted,
    );

    return () => {
      newSocket.off("notification", handleNotification);
      newSocket.off(
        "notificationRead",
        handleNotificationRead,
      );
      newSocket.off(
        "allNotificationsRead",
        handleAllNotificationsRead,
      );
      newSocket.off(
        "notificationDeleted",
        handleNotificationDeleted,
      );

      newSocket.off("connect");
      newSocket.off("connect_error");
      newSocket.off("disconnect");

      window.clearTimeout(socketTimer);

      newSocket.disconnect();
    };
  }, [user]);

  // ---------------------------------------------------------
  // RESTORE AUTHENTICATION
  // ---------------------------------------------------------

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Refresh token is stored in an httpOnly cookie.
        // The browser automatically sends it because the
        // axios service uses withCredentials: true.
        await authService.refreshToken();

        const userRes = await authService.getCurrentUser();

        const userData = normalizeUser(userRes.data.user);

        setUser(userData);

        localStorage.setItem(
          "user",
          JSON.stringify(userData),
        );
      } catch (error) {
        console.error("Failed to restore authentication:", error);

        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------

  const login = async (email, password) => {
    const res = await authService.loginUser({
      email,
      password,
    });

    const userData = normalizeUser(res.data.user);

    setAuthData(userData);

    return userData;
  };

  // ---------------------------------------------------------
  // REGISTER
  // ---------------------------------------------------------

  const register = async ({
    username,
    email,
    password,
  }) => {
    const res = await authService.register({
      username,
      email,
      password,
    });

    const userData = normalizeUser(res.data.user);

    setAuthData(userData);

    return userData;
  };

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  const logout = async () => {
    try {
      if (socket) {
        socket.disconnect();
      }

      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
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