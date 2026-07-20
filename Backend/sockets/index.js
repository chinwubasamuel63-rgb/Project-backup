import { Server } from "socket.io";

let io;

const onlineUsers = new Map();

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());

        io.emit("userOnline", userId);
      }

      const userSockets = onlineUsers.get(userId);

      userSockets.add(socket.id);

      console.log(`User ${userId} is online`);
    });

    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
    });

    // STREAM ROOMS
    socket.on("joinStream", (streamId) => {
      socket.join(`stream_${streamId}`);

      console.log(`Socket ${socket.id} joined stream_${streamId}`);
    });

    socket.on("leaveStream", (streamId) => {
      socket.leave(`stream_${streamId}`);

      console.log(`Socket ${socket.id} left stream_${streamId}`);
    });

    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("userTyping", {
        conversationId,
        userId,
      });
    });

    socket.on("stopTyping", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("userStoppedTyping", {
        conversationId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      let disconnectedUserId = null;

      for (const [userId, socketIds] of onlineUsers.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);

          disconnectedUserId = userId;

          if (socketIds.size === 0) {
            onlineUsers.delete(userId);

            io.emit("userOffline", userId);

            console.log(`User ${userId} went offline`);
          }

          break;
        }
      }

      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => io;

export const isIOInitialized = () => !!io;

// STREAM EMITTER HELPER
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
