import { Router } from "express";
import FacilityController from "./facility.controller";
import { checkPermission, protect } from "../auth/auth.middleware";
import { standardApiLimiter } from "../../utils/rateLimiter";


const router = Router();
const facilityController = new FacilityController();
standardApiLimiter

router.post("/",standardApiLimiter,protect, checkPermission("manage_tags"), facilityController.createFacility);
router.get("/",standardApiLimiter,facilityController.getAllFacilities);
router.get("/:id",standardApiLimiter, facilityController.getFacilityById);
router.put("/:id",standardApiLimiter,protect, checkPermission("manage_tags"), facilityController.updateFacility);
router.delete("/:id",standardApiLimiter,protect, checkPermission("manage_tags"), facilityController.deleteFacility);

export default router;