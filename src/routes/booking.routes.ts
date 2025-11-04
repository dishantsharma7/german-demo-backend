import { Router } from "express";
import { authenticate, authorize } from "../middlewares/userAuth";
import { UserRole } from "../models/enums";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} from "../controllers/booking.controller";

const router = Router();

// Get all bookings (accessible to authenticated users)
router.get("/bookings", authenticate, getAllBookings);

// Get booking by ID (accessible to authenticated users)
router.get("/bookings/:id", authenticate, getBookingById);

// Create booking (Admin only)
router.post(
  "/bookings",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.SUBADMIN),
  createBooking
);

// Update booking (Admin only)
router.put(
  "/bookings/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.SUBADMIN),
  updateBooking
);

// Delete booking (Super Admin only)
router.delete(
  "/bookings/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN),
  deleteBooking
);

export default router;
