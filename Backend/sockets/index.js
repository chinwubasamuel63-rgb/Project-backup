import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io;
const onlineUsers = new Map();
const socketRateLimiters = new Map(); // Track rate limit per socket

const getCookieValue = (cookieHeader, name) => {
  const cookie = cookieHeader
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
};

// Rate limiter configuration
const RATE_LIMIT_CONFIG = {
  "stream:chat-send": { maxMessages: 10, windowMs: 10000 }, // 10 messages per 10 seconds
  "stream:participant-left": { maxEvents: 20, windowMs: 10000 },
};

// Simple rate limiter function
const checkRateLimit = (socketId, eventType) => {
  if (!RATE_LIMIT_CONFIG[eventType]) return true; // No limit for this event

  const config = RATE_LIMIT_CONFIG[eventType];
  const now = Date.now();

  if (!socketRateLimiters.has(socketId)) {
    socketRateLimiters.set(socketId, {});
  }

  const limits = socketRateLimiters.get(socketId);

  if (!limits[eventType]) {
    limits[eventType] = { count: 0, resetTime: now + config.windowMs };
  }

  const limit = limits[eventType];

  // Reset if window has passed
  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + config.windowMs;
  }

  limit.count++;

  // Check if rate limit exceeded
  if (limit.count > config.maxMessages || limit.count > config.maxEvents) {
    return false;
  }

  return true;
};

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "https://devstream-nexus.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  // JWT authentication middleware for socket connections
  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1] ||
      getCookieValue(socket.handshake.headers.cookie, "accessToken");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id; // Store userId on socket for later validation
      next();
    } catch (error) {
      return next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join", async (userId) => {
      // Verify the userId matches the authenticated socket
      if (!userId || userId !== socket.userId) {
        socket.emit("error", {
          message: "User ID mismatch - authentication failed",
        });
        return;
      }

      socket.join(userId);

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());

        // Update database: mark user as online
        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
        } catch (error) {}

        io.emit("userOnline", userId);
      }

      const userSockets = onlineUsers.get(userId);
      userSockets.add(socket.id);
    });

    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
    });

    // STREAM ROOMS
    socket.on("joinStream", (streamId) => {
      socket.join(`stream_${streamId}`);
    });

    socket.on("leaveStream", (streamId) => {
      socket.leave(`stream_${streamId}`);
    });

    // HOST PRESENCE TRACKING
    // Host sends periodic heartbeat to indicate they are still connected
    // This allows recovery from temporary disconnections without ending the stream
    socket.on("host:presence", async (streamId) => {
      if (!streamId) return;

      try {
        // Update last seen presence for the host
        // Only update if socket user is actually the host of this stream
        const Stream = (await import("../models/Stream.js")).default;
        const stream = await Stream.findById(streamId);

        if (stream && stream.host.toString() === socket.userId) {
          await Stream.updateOne(
            { _id: streamId },
            { $set: { hostPresenceLastSeen: new Date() } },
          );

          // Broadcast host presence to all participants in the room
          io.to(`stream_${streamId}`).emit("stream:host-presence", {
            hostId: socket.userId,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        // Non-fatal, continue
      }
    });

    // STREAM CHAT - Now with user authentication verification
    socket.on("stream:chat-send", (payload) => {
      // Rate limit: 10 messages per 10 seconds
      if (!checkRateLimit(socket.id, "stream:chat-send")) {
        socket.emit("error", {
          message: "Rate limit exceeded - please slow down",
        });
        return;
      }

      const streamId = payload?.streamId;
      const text = String(payload?.text || "").trim();

      if (!streamId || !text) return;

      // Verify the userId sending the message matches the authenticated user
      if (payload?.userId && payload.userId !== socket.userId) {
        socket.emit("error", {
          message: "User ID mismatch - chat message rejected",
        });
        return;
      }

      // Use the authenticated socket's userId instead of trusting client
      const authenticatedUserId = socket.userId;

      // Basic guardrails so one bad client can't flood the room.
      const safeText = text.slice(0, 500);

      io.to(`stream_${streamId}`).emit("stream:chat-message", {
        streamId,
        id: `${authenticatedUserId}-${Date.now()}`,
        userId: authenticatedUserId,
        username: payload?.username || "User",
        text: safeText,
        sentAt: new Date().toISOString(),
      });
    });

    socket.on("typing", ({ conversationId, userId }) => {
      // Verify userId matches authenticated user
      if (userId !== socket.userId) {
        return;
      }

      socket.to(conversationId).emit("userTyping", {
        conversationId,
        userId,
      });
    });

    socket.on("stopTyping", ({ conversationId, userId }) => {
      // Verify userId matches authenticated user
      if (userId !== socket.userId) {
        return;
      }

      socket.to(conversationId).emit("userStoppedTyping", {
        conversationId,
        userId,
      });
    });

    socket.on("disconnect", async () => {
      let disconnectedUserId = null;

      for (const [userId, socketIds] of onlineUsers.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          disconnectedUserId = userId;

          if (socketIds.size === 0) {
            onlineUsers.delete(userId);

            // Update database: mark user offline and save lastSeen timestamp
            try {
              await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date(),
              });
            } catch (error) {}

            io.emit("userOffline", userId);
          }

          break;
        }
      }
    });
  });

  return io;
};

export const getIO = () => io;

export const isIOInitialized = () => !!io;

export const emitToStream = (streamId, event, payload) => {
  if (!io) return;
  io.to(`stream_${streamId}`).emit(event, payload);
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
