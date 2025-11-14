import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middlewares/userAuth";
import { UserRole } from "../models/enums";

const router = Router();

// Get dashboard statistics (Admin only)
router.get(
  "/stats",
  authenticate,
  authorize(UserRole.SUPERADMIN),
  getDashboardStats
);

export default router;

