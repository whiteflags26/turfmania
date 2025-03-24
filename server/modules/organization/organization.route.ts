import express from "express";
import { protect } from "../auth/auth.middleware";
import {
  createOrganization,
  deleteOrganization,
  updateOrganization,
  
} from "./organization.controller";
import multer from "multer";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 5 },
}); // Store files in memory for Cloudinary upload

// Create organization
router.post("/",protect,upload.array("images", 5), createOrganization); // Allow up to 5 images

// Update organization
router.put("/:id", upload.array("images", 5), updateOrganization);

// Delete organization
router.delete("/:id", deleteOrganization);

export default router;
