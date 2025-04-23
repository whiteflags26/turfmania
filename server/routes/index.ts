import { Router } from 'express';
import authRouter from '../modules/auth/auth.route';
import organizationRouter from "../modules/organization/organization.route";
import turfRoutes from '../modules/turf/turf.route';
import turfReviewRoutes from '../modules/turf-review/turf-review.route';
import timeslotRoutes from '../modules/timeslot/timeslot.route';
import bookingRoutes from '../modules/booking/booking.route';
import userRoleAssignmentRoutes from '../modules/role_assignment/userRoleAssignment.routes';
import roleRouter from '../modules/role/role.routes';
import organizationRequestRouter from '../modules/organization-request/organization-request.route';

const router = Router();

router.get("/", (req, res) => {
  res.send("Server is running");
});

router.use('/api/v1/auth', authRouter);
router.use("/api/v1/organizations", organizationRouter);
router.use('/api/v1/turf', turfRoutes);
router.use('/api/v1/turf-review', turfReviewRoutes);
router.use('/api/v1/timeslot', timeslotRoutes);
router.use('/api/v1/booking', bookingRoutes);
router.use('/api/v1/role-assignments', userRoleAssignmentRoutes);
router.use('/api/v1/role', roleRouter);
router.use('/api/v1/organization-requests', organizationRequestRouter);

export default router;