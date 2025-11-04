import { Router } from "express";
import { authenticate, authorize } from "../middlewares/userAuth";
import { UserRole } from "../models/enums";
import {
  createZoomSession,
  getAllZoomSessions,
  getZoomSessionById,
  updateZoomSession,
  deleteZoomSession,
} from "../controllers/zoomSession.controller";

const router = Router();

// Get all zoom sessions (accessible to authenticated users)
router.get("/zoom-sessions", authenticate, getAllZoomSessions);

// Get zoom session by ID (accessible to authenticated users)
router.get("/zoom-sessions/:id", authenticate, getZoomSessionById);

// Create zoom session (Admin only)
router.post(
  "/zoom-sessions",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.SUBADMIN),
  createZoomSession
);

// Update zoom session (Admin only)
router.put(
  "/zoom-sessions/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.SUBADMIN),
  updateZoomSession
);

// Delete zoom session (Super Admin only)
router.delete(
  "/zoom-sessions/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN),
  deleteZoomSession
);

export default router;
