import { Router } from "express";
import SportsController from "./sports.controller";

const router = Router();
const sportsController = new SportsController();

router.post("/", sportsController.createSports);
router.get("/", sportsController.getAllSports);
router.get("/:id", sportsController.getSportsById);
router.put("/:id", sportsController.updateSports);
router.delete("/:id", sportsController.deleteSports);

export default router;