import { Router } from "express";
import SportsController from "./sports.controller";
import { checkPermission, protect } from "../auth/auth.middleware";
import { standardApiLimiter } from "../../utils/rateLimiter";


const router = Router();
const sportsController = new SportsController();

router.post("/",standardApiLimiter,protect, sportsController.createSports);
router.get("/",standardApiLimiter,protect,sportsController.getAllSports);
router.get("/:id",standardApiLimiter,protect, sportsController.getSportsById);
router.put("/:id",standardApiLimiter,protect, checkPermission("manage_tags"), sportsController.updateSports);
router.delete("/:id",standardApiLimiter,protect, checkPermission("manage_tags"), sportsController.deleteSports);

export default router;