import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import * as authService from "../services/authService";
import { AuthContext } from "./AuthContext.js";

// ============================================================
// SOCKET.IO
// ============================================================
// REST API uses Vercel /api proxy.
// Socket.IO connects directly to Render.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://devstream-nexus.onrender.com";

export default function AuthProvider({ children }) {
  const [socket, setSocket] = useState(null);

  // ==========================================================
  // USER NORMALIZATION
  // ==========================================================
  const normalizeUser = (user) => {
    if (!user) return null;

    return {
      ...user,

      _id: user._id || user.id,
      id: user.id || user._id,

      role: typeof user.role === "string" ? user.role.toLowerCase() : user.role,
    };
  };

  // ==========================================================
  // INITIAL USER
  // ==========================================================
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser || savedUser === "undefined") {
        return null;
      }

      return normalizeUser(JSON.parse(savedUser));
    } catch (error) {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // AUTH DATA
  // ==========================================================
  const setAuthData = (userData, accessToken = null) => {
    const normalizedUser = normalizeUser(userData);

    if (normalizedUser) {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    }

    // IMPORTANT:
    // Socket.IO needs the access token because it connects
    // directly to Render rather than through Vercel.
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }

    setUser(normalizedUser);
  };

  const clearAuthData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");

    setUser(null);
  };

  // ==========================================================
  // SOCKET.IO CONNECTION
  // ==========================================================
  useEffect(() => {
    if (!user?._id) {
      setSocket(null);
      return;
    }

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.warn("Socket not connected: access token is missing.");

      setSocket(null);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,

      // IMPORTANT:
      // Send JWT through Socket.IO handshake.
      auth: {
        token: accessToken,
      },

      transports: ["polling", "websocket"],
      autoConnect: true,
    });

    setSocket(newSocket);

    // --------------------------------------------------------
    // CONNECT
    // --------------------------------------------------------
    const handleConnect = () => {
      // Join the authenticated user's room.
      newSocket.emit("join", user._id);
    };

    // --------------------------------------------------------
    // CONNECTION ERROR
    // --------------------------------------------------------
    const handleConnectError = (error) => {
      console.error("Socket connection error:", error?.message || error);
    };

    newSocket.on("connect", handleConnect);

    newSocket.on("connect_error", handleConnectError);

    // ========================================================
    // NOTIFICATIONS
    // ========================================================

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

    newSocket.on("allNotificationsRead", handleAllNotificationsRead);

    newSocket.on("notificationDeleted", handleNotificationDeleted);

    // ========================================================
    // CLEANUP
    // ========================================================
    return () => {
      newSocket.off("connect", handleConnect);

      newSocket.off("connect_error", handleConnectError);

      newSocket.off("notification", handleNotification);

      newSocket.off("notificationRead", handleNotificationRead);

      newSocket.off("allNotificationsRead", handleAllNotificationsRead);

      newSocket.off("notificationDeleted", handleNotificationDeleted);

      newSocket.disconnect();

      setSocket(null);
    };
  }, [user]);

  // ==========================================================
  // RESTORE AUTHENTICATION
  // ==========================================================
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        /*
         * The refreshToken is an HttpOnly cookie.
         *
         * REST request:
         *
         * Browser
         *    ↓
         * Vercel /api
         *    ↓
         * Render backend
         *
         * Axios has withCredentials:true.
         */
        await authService.refreshToken();

        const userRes = await authService.getCurrentUser();

        const userData = normalizeUser(userRes.data.user);

        if (!mounted) return;

        setUser(userData);

        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        console.error("Failed to restore authentication:", error);

        if (!mounted) return;

        clearAuthData();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // LOGIN
  // ==========================================================
  const login = async (email, password) => {
    const res = await authService.loginUser({
      email,
      password,
    });

    const userData = normalizeUser(res.data.user);

    /*
     * IMPORTANT:
     *
     * Backend must return:
     *
     * {
     *   success: true,
     *   accessToken: "...",
     *   user: {...}
     * }
     */

    const accessToken = res.data.accessToken;

    setAuthData(userData, accessToken);

    return userData;
  };

  // ==========================================================
  // REGISTER
  // ==========================================================
  const register = async ({ username, email, password }) => {
    const res = await authService.register({
      username,
      email,
      password,
    });

    const userData = normalizeUser(res.data.user);

    const accessToken = res.data.accessToken;

    setAuthData(userData, accessToken);

    return userData;
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================
  const logout = async () => {
    try {
      if (socket) {
        socket.disconnect();
      }

      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData();
      setSocket(null);
    }
  };

  // ==========================================================
  // CONTEXT
  // ==========================================================
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
