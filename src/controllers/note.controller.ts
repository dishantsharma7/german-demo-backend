import { Request, Response } from "express";
import { NoteModel } from "../models/Note";
import { BookingModel } from "../models/Booking";
import { UserRole } from "../models/enums";
import mongoose from "mongoose";

// Create or Update Note for a Booking
export const createOrUpdateNote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId, content } = req.body;
    const subAdminId = req.userId;
    const userRole = req.userRole;

    // Validation
    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
      return;
    }

    if (content === undefined || content === null) {
      res.status(400).json({
        success: false,
        message: "content is required",
      });
      return;
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({
        success: false,
        message: "Invalid bookingId format",
      });
      return;
    }

    if (!subAdminId || !mongoose.Types.ObjectId.isValid(subAdminId)) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
      return;
    }

    // Find booking and verify it exists
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Verify authorization: Subadmins can only create/update notes for their own bookings
    // Superadmins can create/update notes for any booking
    if (userRole === UserRole.SUBADMIN) {
      if (booking.subAdminId.toString() !== subAdminId) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to create notes for this booking",
        });
        return;
      }
    } else if (userRole !== UserRole.SUPERADMIN) {
      res.status(403).json({
        success: false,
        message: "Only subadmins and superadmins can create notes",
      });
      return;
    }

    // Use the booking's subAdminId (not the authenticated user's ID for superadmins)
    const noteSubAdminId =
      userRole === UserRole.SUPERADMIN
        ? booking.subAdminId
        : subAdminId;

    // Find existing note or create new one
    const existingNote = await NoteModel.findOne({ bookingId });

    if (existingNote) {
      // Update existing note
      existingNote.content = content;
      await existingNote.save();

      const populatedNote = await NoteModel.findById(existingNote._id)
        .populate("bookingId")
        .populate("subAdminId");

      res.status(200).json({
        success: true,
        message: "Note updated successfully",
        note: populatedNote,
      });
    } else {
      // Create new note
      const note = new NoteModel({
        bookingId,
        subAdminId: noteSubAdminId,
        content,
      });

      await note.save();

      const populatedNote = await NoteModel.findById(note._id)
        .populate("bookingId")
        .populate("subAdminId");

      res.status(201).json({
        success: true,
        message: "Note created successfully",
        note: populatedNote,
      });
    }
  } catch (error: any) {
    console.error("Create or update note error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Note by Booking ID
export const getNoteByBookingId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const subAdminId = req.userId;
    const userRole = req.userRole;

    // Validate ObjectId
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({
        success: false,
        message: "Invalid bookingId format",
      });
      return;
    }

    if (!subAdminId || !mongoose.Types.ObjectId.isValid(subAdminId)) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
      return;
    }

    // Find note first to check ownership
    const note = await NoteModel.findOne({ bookingId })
      .populate({
        path: "bookingId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "subAdminId", select: "name email" },
          { path: "serviceId", select: "name description" },
        ],
      })
      .populate("subAdminId", "name email");

    if (!note) {
      res.status(404).json({
        success: false,
        message: "Note not found for this booking",
      });
      return;
    }

    // Verify authorization: 
    // - Superadmins can view any note
    // - Subadmins can only view notes they created (note.subAdminId)
    if (userRole === UserRole.SUBADMIN) {
      if (note.subAdminId.toString() !== subAdminId) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to view this note",
        });
        return;
      }
    } else if (userRole !== UserRole.SUPERADMIN) {
      res.status(403).json({
        success: false,
        message: "Only subadmins and superadmins can view notes",
      });
      return;
    }

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error: any) {
    console.error("Get note by booking ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get All Notes for Authenticated Subadmin
export const getNotesBySubAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subAdminId = req.userId;
    const userRole = req.userRole;
    const { page = 1, limit = 10 } = req.query;

    if (!subAdminId || !mongoose.Types.ObjectId.isValid(subAdminId)) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
      return;
    }

    // Build query based on role
    let query: any = {};
    if (userRole === UserRole.SUBADMIN) {
      query.subAdminId = subAdminId;
    } else if (userRole !== UserRole.SUPERADMIN) {
      res.status(403).json({
        success: false,
        message: "Only subadmins and superadmins can view notes",
      });
      return;
    }
    // For superadmins, query is empty (returns all notes)

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const notes = await NoteModel.find(query)
      .populate({
        path: "bookingId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "subAdminId", select: "name email" },
          { path: "serviceId", select: "name description" },
        ],
      })
      .populate("subAdminId", "name email")
      .skip(skip)
      .limit(limitNum)
      .sort({ updatedAt: -1 });

    const total = await NoteModel.countDocuments(query);

    res.status(200).json({
      success: true,
      notes,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalNotes: total,
        limit: limitNum,
      },
    });
  } catch (error: any) {
    console.error("Get notes by subadmin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

