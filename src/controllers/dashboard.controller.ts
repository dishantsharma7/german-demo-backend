import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { BookingModel } from "../models/Booking";
import { ServiceModel } from "../models/Service";
import { PaymentStatus, BookingStatus, UserRole } from "../models/enums";

// Get Dashboard Statistics (Admin only)
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get total counts
    const totalUsers = await UserModel.countDocuments({ role: UserRole.USER });
    const totalBookings = await BookingModel.countDocuments();
    const totalServices = await ServiceModel.countDocuments({ isActive: true });
    const totalSubAdmins = await UserModel.countDocuments({ role: UserRole.SUBADMIN });

    // Get pending bookings count
    const pendingBookings = await BookingModel.countDocuments({
      paymentStatus: PaymentStatus.PENDING,
    });

    // Get completed bookings count
    const completedBookings = await BookingModel.countDocuments({
      bookingStatus: BookingStatus.COMPLETED,
    });

    // Get total revenue (sum of successful payments)
    const revenueResult = await BookingModel.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.SUCCESS,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get last 5 created users
    const recentUsers = await UserModel.find({ role: UserRole.USER })
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent bookings (last 5) with populated data
    const recentBookings = await BookingModel.find()
      .populate("userId", "name email")
      .populate("subAdminId", "name email")
      .populate("serviceId", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate conversion rate (completed bookings / total bookings)
    const conversionRate =
      totalBookings > 0
        ? ((completedBookings / totalBookings) * 100).toFixed(1)
        : "0";

    // Get bookings by status
    const bookingsByStatus = await BookingModel.aggregate([
      {
        $group: {
          _id: "$bookingStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get users registered in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newRegistrations = await UserModel.countDocuments({
      role: UserRole.USER,
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get bookings in last 7 days
    const recentBookingsCount = await BookingModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Calculate percentage change (simplified - comparing last 7 days to previous 7 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const previousWeekRegistrations = await UserModel.countDocuments({
      role: UserRole.USER,
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    });

    const registrationChange =
      previousWeekRegistrations > 0
        ? (((newRegistrations - previousWeekRegistrations) / previousWeekRegistrations) * 100).toFixed(1)
        : newRegistrations > 0
        ? "100"
        : "0";

    // Get upcoming consultations (scheduled bookings in the future)
    const now = new Date();
    const upcomingConsultations = await BookingModel.find({
      bookingStatus: BookingStatus.SCHEDULED,
      date: { $gte: now },
    })
      .populate("userId", "name email")
      .populate("serviceId", "name")
      .sort({ date: 1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        // Main stats
        totalUsers,
        totalBookings,
        totalServices,
        totalSubAdmins,
        totalRevenue,
        conversionRate: `${conversionRate}%`,

        // Detailed counts
        pendingBookings,
        completedBookings,
        newRegistrations,
        recentBookingsCount,

        // Percentage changes
        registrationChange: registrationChange.startsWith("-")
          ? registrationChange
          : `+${registrationChange}`,

        // Recent data
        recentUsers,
        recentBookings,
        upcomingConsultations,

        // Additional stats
        bookingsByStatus,
      },
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

