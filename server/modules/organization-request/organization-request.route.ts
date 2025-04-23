import express from "express";
import multer from "multer";
import { protect, checkPermission } from "../auth/auth.middleware";
import OrganizationRequestController from "./organization-request.controller";

const router = express.Router();

// Configure Multer for temporary image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5, // Maximum of 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.match(/^image\/(jpeg|png|jpg|gif|webp)$/)) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

// Initialize controller
const organizationRequestController = new OrganizationRequestController();

// Authenticated Endpoints
router.post(
  "/",
  protect,
  upload.array("images", 5),
  organizationRequestController.createOrganizationRequest
);

// Admin Endpoints
// Will add a middleware to check if the user is an admin later
router.get(
  "/validate-owner-email/:email",
  protect,
  organizationRequestController.validateOwnerEmail
);

router.put(
  "/:id/process",
  protect,
  organizationRequestController.startProcessingRequest
);

router.put(
  "/:id/cancel-processing",
  protect,
  organizationRequestController.cancelProcessingRequest
);

router.put(
  "/:id/reject",
  protect,
  organizationRequestController.rejectOrganizationRequest
);

router.get(
  "/my/:id",
  protect,
  organizationRequestController.getMyOrganizationRequest
)

router.get(
  "/admin/:id",
  protect,
  organizationRequestController.getOrganizationRequestAsAdmin
)


export default router;
