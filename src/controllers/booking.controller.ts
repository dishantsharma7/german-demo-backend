import { Request, Response } from "express";
import { BookingModel } from "../models/Booking";
import { UserModel } from "../models/User";
import { ServiceModel } from "../models/Service";
import { BookingStatus, PaymentStatus } from "../models/enums";
import mongoose from "mongoose";

// Create Booking
export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      userId,
      subAdminId,
      serviceId,
      date,
      timeslot,
      amount,
      paymentStatus,
      zoomLink,
      zoomRecordingLink,
      bookingStatus,
    } = req.body;

    // Validation
    if (
      !userId ||
      !subAdminId ||
      !serviceId ||
      !date ||
      !timeslot ||
      amount === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "userId, subAdminId, serviceId, date, timeslot, and amount are required fields",
      });
      return;
    }

    // Validate timeslot structure
    if (!timeslot.start || !timeslot.end) {
      res.status(400).json({
        success: false,
        message: "timeslot must have both start and end properties",
      });
      return;
    }

    // Validate ObjectIds
    const objectIds = [
      { field: "userId", value: userId },
      { field: "subAdminId", value: subAdminId },
      { field: "serviceId", value: serviceId },
    ];

    for (const { field, value } of objectIds) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        res.status(400).json({
          success: false,
          message: `Invalid ${field} format`,
        });
        return;
      }
    }

    // Check if userId exists
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if subAdminId exists
    const subAdmin = await UserModel.findById(subAdminId);
    if (!subAdmin) {
      res.status(404).json({
        success: false,
        message: "Sub-admin not found",
      });
      return;
    }

    // Check if serviceId exists
    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    // Validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
      return;
    }

    // Validate amount
    if (typeof amount !== "number" || amount < 0) {
      res.status(400).json({
        success: false,
        message: "amount must be a positive number",
      });
      return;
    }

    // Validate paymentStatus enum if provided
    if (
      paymentStatus &&
      !Object.values(PaymentStatus).includes(paymentStatus)
    ) {
      res.status(400).json({
        success: false,
        message: `Invalid paymentStatus. Must be one of: ${Object.values(
          PaymentStatus
        ).join(", ")}`,
      });
      return;
    }

    // Validate bookingStatus enum if provided
    if (
      bookingStatus &&
      !Object.values(BookingStatus).includes(bookingStatus)
    ) {
      res.status(400).json({
        success: false,
        message: `Invalid bookingStatus. Must be one of: ${Object.values(
          BookingStatus
        ).join(", ")}`,
      });
      return;
    }

    // Validate zoomLink can only be set if paymentStatus is SUCCESS
    if (zoomLink) {
      const finalPaymentStatus = paymentStatus || PaymentStatus.PENDING;
      if (finalPaymentStatus !== PaymentStatus.SUCCESS) {
        res.status(400).json({
          success: false,
          message: "Cannot set zoomLink before payment is successful",
        });
        return;
      }
    }

    // Create booking
    const booking = new BookingModel({
      userId,
      subAdminId,
      serviceId,
      date: dateObj,
      timeslot,
      amount,
      paymentStatus: paymentStatus || PaymentStatus.PENDING,
      zoomLink,
      zoomRecordingLink,
      bookingStatus: bookingStatus || BookingStatus.SCHEDULED,
    });

    await booking.save();

    // Populate references for response
    const populatedBooking = await BookingModel.findById(booking._id)
      .populate("userId")
      .populate("subAdminId")
      .populate("serviceId");

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error: any) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get All Bookings (with pagination and filtering)
export const getAllBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      bookingStatus,
      paymentStatus,
      userId,
      subAdminId,
      serviceId,
      search,
    } = req.query;

    const query: any = {};

    // Filter by bookingStatus if provided
    if (
      bookingStatus &&
      Object.values(BookingStatus).includes(bookingStatus as BookingStatus)
    ) {
      query.bookingStatus = bookingStatus;
    }

    // Filter by paymentStatus if provided
    if (
      paymentStatus &&
      Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)
    ) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by userId if provided
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid userId format",
        });
        return;
      }
      query.userId = userId;
    }

    // Filter by subAdminId if provided
    if (subAdminId) {
      if (!mongoose.Types.ObjectId.isValid(subAdminId as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid subAdminId format",
        });
        return;
      }
      query.subAdminId = subAdminId;
    }

    // Filter by serviceId if provided
    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid serviceId format",
        });
        return;
      }
      query.serviceId = serviceId;
    }

    // Search by date (if provided as a date string)
    // Note: This is a basic search - you might want to enhance this
    if (search) {
      // Try to parse as date and search
      const searchDate = new Date(search as string);
      if (!isNaN(searchDate.getTime())) {
        query.$or = [
          { date: searchDate },
          { "timeslot.start": { $regex: search, $options: "i" } },
          { "timeslot.end": { $regex: search, $options: "i" } },
        ];
      } else {
        query.$or = [
          { "timeslot.start": { $regex: search, $options: "i" } },
          { "timeslot.end": { $regex: search, $options: "i" } },
        ];
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const bookings = await BookingModel.find(query)
      .populate("userId")
      .populate("subAdminId")
      .populate("serviceId")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await BookingModel.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalBookings: total,
        limit: limitNum,
      },
    });
  } catch (error: any) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Booking by ID
export const getBookingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid booking ID format",
      });
      return;
    }

    const booking = await BookingModel.findById(id)
      .populate("userId")
      .populate("subAdminId")
      .populate("serviceId");

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    res.status(200).json({ success: true, booking });
  } catch (error: any) {
    console.error("Get booking by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update Booking
export const updateBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      userId,
      subAdminId,
      serviceId,
      date,
      timeslot,
      amount,
      paymentStatus,
      zoomLink,
      zoomRecordingLink,
      bookingStatus,
    } = req.body;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid booking ID format",
      });
      return;
    }

    // Find booking
    const booking = await BookingModel.findById(id);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Validate and update ObjectId references if provided
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: "Invalid userId format",
        });
        return;
      }
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }
      booking.userId = userId;
    }

    if (subAdminId) {
      if (!mongoose.Types.ObjectId.isValid(subAdminId)) {
        res.status(400).json({
          success: false,
          message: "Invalid subAdminId format",
        });
        return;
      }
      const subAdmin = await UserModel.findById(subAdminId);
      if (!subAdmin) {
        res.status(404).json({
          success: false,
          message: "Sub-admin not found",
        });
        return;
      }
      booking.subAdminId = subAdminId;
    }

    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        res.status(400).json({
          success: false,
          message: "Invalid serviceId format",
        });
        return;
      }
      const service = await ServiceModel.findById(serviceId);
      if (!service) {
        res.status(404).json({
          success: false,
          message: "Service not found",
        });
        return;
      }
      booking.serviceId = serviceId;
    }

    // Validate and update date if provided
    if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
        return;
      }
      booking.date = dateObj;
    }

    // Validate and update timeslot if provided
    if (timeslot) {
      if (!timeslot.start || !timeslot.end) {
        res.status(400).json({
          success: false,
          message: "timeslot must have both start and end properties",
        });
        return;
      }
      booking.timeslot = timeslot;
    }

    // Validate and update amount if provided
    if (amount !== undefined) {
      if (typeof amount !== "number" || amount < 0) {
        res.status(400).json({
          success: false,
          message: "amount must be a positive number",
        });
        return;
      }
      booking.amount = amount;
    }

    // Validate and update paymentStatus if provided
    if (paymentStatus) {
      if (!Object.values(PaymentStatus).includes(paymentStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid paymentStatus. Must be one of: ${Object.values(
            PaymentStatus
          ).join(", ")}`,
        });
        return;
      }
      booking.paymentStatus = paymentStatus;
    }

    // Validate and update bookingStatus if provided
    if (bookingStatus) {
      if (!Object.values(BookingStatus).includes(bookingStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid bookingStatus. Must be one of: ${Object.values(
            BookingStatus
          ).join(", ")}`,
        });
        return;
      }
      booking.bookingStatus = bookingStatus;
    }

    // Validate zoomLink can only be set if paymentStatus is SUCCESS
    if (zoomLink !== undefined) {
      if (zoomLink === null || zoomLink === "") {
        delete booking.zoomLink;
      } else {
        const finalPaymentStatus = booking.paymentStatus;
        if (finalPaymentStatus !== PaymentStatus.SUCCESS) {
          res.status(400).json({
            success: false,
            message: "Cannot set zoomLink before payment is successful",
          });
          return;
        }
        booking.zoomLink = zoomLink;
      }
    }

    // Update optional fields
    if (zoomRecordingLink !== undefined) {
      if (zoomRecordingLink === null || zoomRecordingLink === "") {
        delete booking.zoomRecordingLink;
      } else {
        booking.zoomRecordingLink = zoomRecordingLink;
      }
    }

    await booking.save();

    // Populate references for response
    const populatedBooking = await BookingModel.findById(id)
      .populate("userId")
      .populate("subAdminId")
      .populate("serviceId");

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      booking: populatedBooking,
    });
  } catch (error: any) {
    console.error("Update booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete Booking
export const deleteBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid booking ID format",
      });
      return;
    }

    const booking = await BookingModel.findByIdAndDelete(id);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
      deletedBooking: {
        id: booking._id,
        userId: booking.userId,
        serviceId: booking.serviceId,
        date: booking.date,
      },
    });
  } catch (error: any) {
    console.error("Delete booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
