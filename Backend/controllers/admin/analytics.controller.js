import User from "../../models/User.js";
import Project from "../../models/Project.js";
import Job from "../../models/Jobs.js";
import Product from "../../models/Product.js";
import Purchase from "../../models/Purchase.js";
import SupportTicket from "../../models/SupportTicket.js";
import Stream from "../../models/Stream.js";
import StreamReport from "../../models/StreamReport.js";

export const getDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalProjects,
      totalJobs,
      totalProducts,
      totalPurchases,
      totalStreams,
      totalReports,
      openTickets,
      suspendedUsers,
      bannedUsers,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "student",
      }),

      User.countDocuments({
        role: "instructor",
      }),

      User.countDocuments({
        role: "admin",
      }),

      Project.countDocuments(),

      Job.countDocuments(),

      Product.countDocuments(),

      Purchase.countDocuments({
        status: "Completed",
      }),

      Stream.countDocuments(),

      StreamReport.countDocuments(),

      SupportTicket.countDocuments({
        status: {
          $in: ["Open", "In Progress"],
        },
      }),

      User.countDocuments({
        isSuspended: true,
      }),

      User.countDocuments({
        isBanned: true,
      }),
    ]);

    const revenueResult = await Purchase.aggregate([
      {
        $match: {
          status: "Completed",
        },
      },
      {
        $group: {
          _id: null,

          totalRevenue: {
            $sum: "$amount",
          },

          platformRevenue: {
            $sum: "$platformFee",
          },

          sellerRevenue: {
            $sum: "$sellerAmount",
          },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const platformRevenue = revenueResult[0]?.platformRevenue || 0;

    const sellerRevenue = revenueResult[0]?.sellerRevenue || 0;

    res.status(200).json({
      success: true,

      analytics: {
        users: {
          total: totalUsers,
          students: totalStudents,
          instructors: totalInstructors,
          admins: totalAdmins,
          suspended: suspendedUsers,
          banned: bannedUsers,
        },

        projects: {
          total: totalProjects,
        },

        jobs: {
          total: totalJobs,
        },

        marketplace: {
          products: totalProducts,
          purchases: totalPurchases,
          revenue: totalRevenue,
          platformRevenue,
          sellerRevenue,
        },

        streaming: {
          streams: totalStreams,
          reports: totalReports,
        },

        support: {
          openTickets,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGrowthAnalytics = async (req, res) => {
  try {
    const [users, projects, jobs, sales] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),
      Project.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      Job.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      Purchase.aggregate([
        {
          $match: {
            status: "Completed",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: {
              $sum: "$amount",
            },
            purchases: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      growth: {
        users,
        projects,
        jobs,
        sales,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
