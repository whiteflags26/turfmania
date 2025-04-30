import { Router } from "express";
import SportsController from "./sports.controller";
import { checkPermission, protect } from "../auth/auth.middleware";
import { standardApiLimiter } from "../../utils/rateLimiter";


const router = Router();
const sportsController = new SportsController();

router.post("/",standardApiLimiter, sportsController.createSports);
router.get("/",standardApiLimiter,sportsController.getAllSports);
router.get("/:id",standardApiLimiter, sportsController.getSportsById);
router.put("/:id",standardApiLimiter,protect, checkPermission("manage_tags"), sportsController.updateSports);
router.delete("/:id",standardApiLimiter,protect, checkPermission("manage_tags"), sportsController.deleteSports);

export default router;