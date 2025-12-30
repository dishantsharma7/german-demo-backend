import { Router } from "express";
import { authenticate, authorize } from "../middlewares/userAuth";
import { UserRole } from "../models/enums";
import {
  createOrUpdateNote,
  getNoteByBookingId,
  getNotesBySubAdmin,
} from "../controllers/note.controller";

const router = Router();

// Create or update note for a booking (Subadmin and Superadmin only)
router.post(
  "/notes",
  authenticate,
  authorize(UserRole.SUBADMIN, UserRole.SUPERADMIN),
  createOrUpdateNote
);

// Get note for a specific booking (Subadmin and Superadmin only)
router.get(
  "/notes/booking/:bookingId",
  authenticate,
  authorize(UserRole.SUBADMIN, UserRole.SUPERADMIN),
  getNoteByBookingId
);

// Get all notes for authenticated subadmin (Subadmin and Superadmin only)
router.get(
  "/notes",
  authenticate,
  authorize(UserRole.SUBADMIN, UserRole.SUPERADMIN),
  getNotesBySubAdmin
);

export default router;

