import { Router } from "express";
import TeamSizeController from "./team_size.controller";
import { checkPermission, protect } from "../auth/auth.middleware";
import { standardApiLimiter } from "../../utils/rateLimiter";


const router = Router();
const teamSizeController = new TeamSizeController();

router.post("/",standardApiLimiter,protect, checkPermission("manage_tags"), teamSizeController.createTeamSize);
router.get("/",standardApiLimiter, teamSizeController.getAllTeamSizes);
router.get("/:id",standardApiLimiter,teamSizeController.getTeamSizeById);
router.put("/:id",standardApiLimiter,protect, checkPermission("manage_tags"), teamSizeController.updateTeamSize);
router.delete("/:id",standardApiLimiter,protect, checkPermission("manage_tags"), teamSizeController.deleteTeamSize);

export default router;