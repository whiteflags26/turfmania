import { Router } from "express";
import TeamSizeController from "./team_size.controller";

const router = Router();
const teamSizeController = new TeamSizeController();

router.post("/", teamSizeController.createTeamSize);
router.get("/", teamSizeController.getAllTeamSizes);
router.get("/:id", teamSizeController.getTeamSizeById);
router.put("/:id", teamSizeController.updateTeamSize);
router.delete("/:id", teamSizeController.deleteTeamSize);

export default router;