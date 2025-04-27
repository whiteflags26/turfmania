import { Router } from "express";
import SportsController from "./sports.controller";
import { checkPermission, protect } from "../auth/auth.middleware";


const router = Router();
const sportsController = new SportsController();

router.post("/", protect, checkPermission("manage_tags"), sportsController.createSports);
router.get("/", sportsController.getAllSports);
router.get("/:id", sportsController.getSportsById);
router.put("/:id", checkPermission("manage_tags"), sportsController.updateSports);
router.delete("/:id", checkPermission("manage_tags"), sportsController.deleteSports);

export default router;