import { Request, Response } from "express";
import { ZoomSessionModel } from "../models/ZoomSession";
import { BookingModel } from "../models/Booking";
import { ZoomSessionStatus } from "../models/enums";
import mongoose from "mongoose";

// Create ZoomSession
export const createZoomSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      bookingId,
      meetingId,
      joinUrl,
      startTime,
      endTime,
      recordingUrl,
      status,
    } = req.body;

    // Validation
    if (!bookingId || !meetingId || !joinUrl || !startTime) {
      res.status(400).json({
        success: false,
        message:
          "bookingId, meetingId, joinUrl, and startTime are required fields",
      });
      return;
    }

    // Validate bookingId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({
        success: false,
        message: "Invalid bookingId format",
      });
      return;
    }

    // Check if booking exists
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Validate startTime
    const startTimeDate = new Date(startTime);
    if (isNaN(startTimeDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid startTime format",
      });
      return;
    }

    // Validate endTime if provided
    if (endTime) {
      const endTimeDate = new Date(endTime);
      if (isNaN(endTimeDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid endTime format",
        });
        return;
      }

      if (endTimeDate <= startTimeDate) {
        res.status(400).json({
          success: false,
          message: "endTime must be after startTime",
        });
        return;
      }
    }

    // Validate status enum if provided
    if (status && !Object.values(ZoomSessionStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(
          ZoomSessionStatus
        ).join(", ")}`,
      });
      return;
    }

    // Check if zoom session already exists for this booking
    const existingSession = await ZoomSessionModel.findOne({ bookingId });
    if (existingSession) {
      res.status(409).json({
        success: false,
        message: "Zoom session already exists for this booking",
      });
      return;
    }

    // Create zoom session
    const zoomSession = new ZoomSessionModel({
      bookingId,
      meetingId,
      joinUrl,
      startTime: startTimeDate,
      endTime: endTime ? new Date(endTime) : undefined,
      recordingUrl,
      status: status || ZoomSessionStatus.SCHEDULED,
    });

    await zoomSession.save();

    // Populate bookingId for response
    const populatedSession = await ZoomSessionModel.findById(
      zoomSession._id
    ).populate("bookingId");

    res.status(201).json({
      success: true,
      message: "Zoom session created successfully",
      zoomSession: populatedSession,
    });
  } catch (error: any) {
    console.error("Create zoom session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get All ZoomSessions (with pagination and filtering)
export const getAllZoomSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, bookingId, search } = req.query;

    const query: any = {};

    // Filter by status if provided
    if (
      status &&
      Object.values(ZoomSessionStatus).includes(status as ZoomSessionStatus)
    ) {
      query.status = status;
    }

    // Filter by bookingId if provided
    if (bookingId) {
      if (!mongoose.Types.ObjectId.isValid(bookingId as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid bookingId format",
        });
        return;
      }
      query.bookingId = bookingId;
    }

    // Search by meetingId
    if (search) {
      query.meetingId = { $regex: search, $options: "i" };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const zoomSessions = await ZoomSessionModel.find(query)
      .populate("bookingId")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await ZoomSessionModel.countDocuments(query);

    res.status(200).json({
      success: true,
      zoomSessions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalZoomSessions: total,
        limit: limitNum,
      },
    });
  } catch (error: any) {
    console.error("Get all zoom sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get ZoomSession by ID
export const getZoomSessionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid zoom session ID format",
      });
      return;
    }

    const zoomSession = await ZoomSessionModel.findById(id).populate(
      "bookingId"
    );

    if (!zoomSession) {
      res.status(404).json({
        success: false,
        message: "Zoom session not found",
      });
      return;
    }

    res.status(200).json({ success: true, zoomSession });
  } catch (error: any) {
    console.error("Get zoom session by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update ZoomSession
export const updateZoomSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      bookingId,
      meetingId,
      joinUrl,
      startTime,
      endTime,
      recordingUrl,
      status,
    } = req.body;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid zoom session ID format",
      });
      return;
    }

    // Find zoom session
    const zoomSession = await ZoomSessionModel.findById(id);
    if (!zoomSession) {
      res.status(404).json({
        success: false,
        message: "Zoom session not found",
      });
      return;
    }

    // Validate bookingId if provided
    if (bookingId) {
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        res.status(400).json({
          success: false,
          message: "Invalid bookingId format",
        });
        return;
      }

      // Check if booking exists
      const booking = await BookingModel.findById(bookingId);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: "Booking not found",
        });
        return;
      }

      // Check if another zoom session exists for this booking
      const existingSession = await ZoomSessionModel.findOne({
        bookingId,
        _id: { $ne: id },
      });
      if (existingSession) {
        res.status(409).json({
          success: false,
          message: "Zoom session already exists for this booking",
        });
        return;
      }

      zoomSession.bookingId = bookingId;
    }

    // Validate and update dates
    if (startTime) {
      const startTimeDate = new Date(startTime);
      if (isNaN(startTimeDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid startTime format",
        });
        return;
      }
      zoomSession.startTime = startTimeDate;
    }

    if (endTime !== undefined) {
      if (endTime === null || endTime === "") {
        delete zoomSession.endTime;
      } else {
        const endTimeDate = new Date(endTime);
        if (isNaN(endTimeDate.getTime())) {
          res.status(400).json({
            success: false,
            message: "Invalid endTime format",
          });
          return;
        }

        const startTimeToCheck = zoomSession.startTime;
        if (endTimeDate <= startTimeToCheck) {
          res.status(400).json({
            success: false,
            message: "endTime must be after startTime",
          });
          return;
        }
        zoomSession.endTime = endTimeDate;
      }
    }

    // Validate status enum if provided
    if (status) {
      if (!Object.values(ZoomSessionStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Object.values(
            ZoomSessionStatus
          ).join(", ")}`,
        });
        return;
      }
      zoomSession.status = status;
    }

    // Update other fields
    if (meetingId !== undefined) zoomSession.meetingId = meetingId;
    if (joinUrl !== undefined) zoomSession.joinUrl = joinUrl;
    if (recordingUrl !== undefined) zoomSession.recordingUrl = recordingUrl;

    await zoomSession.save();

    // Populate bookingId for response
    const populatedSession = await ZoomSessionModel.findById(id).populate(
      "bookingId"
    );

    res.status(200).json({
      success: true,
      message: "Zoom session updated successfully",
      zoomSession: populatedSession,
    });
  } catch (error: any) {
    console.error("Update zoom session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete ZoomSession
export const deleteZoomSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid zoom session ID format",
      });
      return;
    }

    const zoomSession = await ZoomSessionModel.findByIdAndDelete(id);

    if (!zoomSession) {
      res.status(404).json({
        success: false,
        message: "Zoom session not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Zoom session deleted successfully",
      deletedZoomSession: {
        id: zoomSession._id,
        meetingId: zoomSession.meetingId,
        bookingId: zoomSession.bookingId,
      },
    });
  } catch (error: any) {
    console.error("Delete zoom session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
