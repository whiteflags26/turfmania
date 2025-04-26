import { Router } from "express";
import FacilityController from "./facility.controller";

const router = Router();
const facilityController = new FacilityController();

router.post("/", facilityController.createFacility);
router.get("/", facilityController.getAllFacilities);
router.get("/:id", facilityController.getFacilityById);
router.put("/:id", facilityController.updateFacility);
router.delete("/:id", facilityController.deleteFacility);

export default router;