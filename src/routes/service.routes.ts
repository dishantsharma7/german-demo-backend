import { Router } from "express";
import { authenticate, authorize } from "../middlewares/userAuth";
import { UserRole } from "../models/enums";
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} from "../controllers/service.controller";

const router = Router();

// Get all services (accessible to authenticated users)
router.get("/services", authenticate, getAllServices);

// Get service by ID (accessible to authenticated users)
router.get("/services/:id", authenticate, getServiceById);

// Create service (Admin only)
router.post(
  "/services",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.SUBADMIN),
  createService
);

// Update service (Admin only)
router.put(
  "/services/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.SUBADMIN),
  updateService
);

// Delete service (Super Admin only)
router.delete(
  "/services/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN),
  deleteService
);

export default router;
