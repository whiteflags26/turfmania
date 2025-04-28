import { Router } from "express";
import multer from "multer";
import TurfController from "./turf.controller";
import { protect } from "../auth/auth.middleware";
import { standardApiLimiter } from "../../utils/rateLimiter";

const router = Router();
const turfController = new TurfController();

// Configure Multer
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5, // Maximum of 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.match(/^image\/(jpeg|png|jpg|gif)$/)) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

router.post("/",standardApiLimiter,protect,upload.array("images", 5), turfController.createTurf);
router.get("/",standardApiLimiter,protect, turfController.getTurfs);
router.get("/:id",standardApiLimiter,protect, turfController.getTurfById);
router.put("/:id",standardApiLimiter,protect, upload.array("images", 5), turfController.updateTurfById);
router.delete("/:id",standardApiLimiter,protect, turfController.deleteTurfById);
router.get("/filter/search",standardApiLimiter,protect, turfController.filterTurfs);
router.get("/:id/status",standardApiLimiter,protect, turfController.getTurfStatus);
router.get("/organization/:organizationId",standardApiLimiter,protect, turfController.getTurfsByOrganizationId);



export default router;
