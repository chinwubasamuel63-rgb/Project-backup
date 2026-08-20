import User from "../../models/User.js";
import Project from "../../models/Project.js";
import SupportTicket from "../../models/SupportTicket.js";
import Stream from "../../models/Stream.js";
import StreamAnalytics from "../../models/StreamAnalytics.js";

export const getAdminStats = async (req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const startOfLast7Days = new Date(startOfToday);

    startOfLast7Days.setDate(startOfLast7Days.getDate() - 7);

    const startOfLast30Days = new Date(startOfToday);

    startOfLast30Days.setDate(startOfLast30Days.getDate() - 30);

    const [
      totalUsers,
      students,
      instructors,
      admins,
      suspended,
      banned,
      activeUsers,
      newToday,
      newThisWeek,

      totalProjects,
      activeProjects,

      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      openedToday,
      resolvedToday,

      activeStreams,
      totalStreams,
      streamsHostedToday,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isSuspended: true }),
      User.countDocuments({ isBanned: true }),

      User.countDocuments({
        lastLoginAt: {
          $gte: startOfLast30Days,
        },
      }),

      User.countDocuments({
        createdAt: {
          $gte: startOfToday,
        },
      }),

      User.countDocuments({
        createdAt: {
          $gte: startOfLast7Days,
        },
      }),

      Project.countDocuments(),

      Project.countDocuments({
        status: {
          $in: ["Building", "Testing", "Launched"],
        },
      }),

      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({
        status: "Open",
      }),
      SupportTicket.countDocuments({
        status: "In Progress",
      }),
      SupportTicket.countDocuments({
        status: "Resolved",
      }),
      SupportTicket.countDocuments({
        status: "Closed",
      }),

      SupportTicket.countDocuments({
        createdAt: {
          $gte: startOfToday,
        },
      }),

      SupportTicket.countDocuments({
        status: "Resolved",
        resolvedAt: {
          $gte: startOfToday,
        },
      }),

      Stream.countDocuments(),

      StreamAnalytics.countDocuments(),

      StreamAnalytics.countDocuments({
        endedAt: {
          $gte: startOfToday,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,

      users: {
        total: totalUsers,
        students,
        instructors,
        admins,
        suspended,
        banned,
        newToday,
        newThisWeek,
        active: activeUsers,
      },

      projects: {
        total: totalProjects,
        active: activeProjects,
      },

      support: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        openedToday,
        resolvedToday,
      },

      streams: {
        active: activeStreams,
        totalCreated: totalStreams,
        hostedToday: streamsHostedToday,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load admin statistics",
    });
  }
};
