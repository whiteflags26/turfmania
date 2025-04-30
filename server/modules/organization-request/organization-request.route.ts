import express from "express";
import multer from "multer";
import { protect, checkPermission } from "../auth/auth.middleware";
import OrganizationRequestController from "./organization-request.controller";
import { standardApiLimiter } from "../../utils/rateLimiter";

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
  standardApiLimiter,
  protect,
  upload.array("images", 5),
  organizationRequestController.createOrganizationRequest
);

router.get(
  "/my/:id",
  standardApiLimiter,
  protect,
  organizationRequestController.getOrganizationRequestAsUser
);

router.get(
  "/user",
  standardApiLimiter,
  protect,
  organizationRequestController.getUserOrganizationRequests
);



// Admin Endpoints
// Will add a middleware to check if the user is an admin later
// router.get(
//   "/validate-owner-email/:email",
//   protect,
//   checkPermission('manage_organization_requests'),
//   organizationRequestController.validateOwnerEmail
// );

router.put(
  "/:id/process",
  standardApiLimiter,
  protect,
  checkPermission('manage_organization_requests'),
  organizationRequestController.startProcessingRequest
);

router.put(
  "/:id/cancel-processing",
  standardApiLimiter,
  protect,
  checkPermission('manage_organization_requests'),
  organizationRequestController.cancelProcessingRequest
);

router.put(
  "/:id/reject",
  standardApiLimiter,
  protect,
  checkPermission('manage_organization_requests'),
  organizationRequestController.rejectOrganizationRequest
);

router.get(
  "/admin/:id",
  standardApiLimiter,
  protect,
  checkPermission('manage_organization_requests'),
  organizationRequestController.getOrganizationRequestAsAdmin
);

router.get(
  "/",
  standardApiLimiter,
  protect,

  checkPermission('manage_organization_requests'),
  organizationRequestController.getOrganizationRequests
);

export default router;
