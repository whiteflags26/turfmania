import { Router } from 'express';
import authRouter from '../modules/auth/auth.route';
import bookingRoutes from '../modules/booking/booking.route';
import organizationRouter from '../modules/organization/organization.route';
import permissionRoutes from '../modules/permission/permission.routes';
import roleRouter from '../modules/role/role.routes';
import userRoleAssignmentRoutes from '../modules/role_assignment/userRoleAssignment.routes';
import timeslotRoutes from '../modules/timeslot/timeslot.route';
import turfReviewRoutes from '../modules/turf-review/turf-review.route';
import turfRoutes from '../modules/turf/turf.route';
import userRouter from '../modules/user/user.routes';

const router = Router();

router.get('/', (req, res) => {
  res.send('Server is running');
});

router.use('/api/v1/auth', authRouter);
router.use('/api/v1/organizations', organizationRouter);
router.use('/api/v1/turf', turfRoutes);
router.use('/api/v1/turf-review', turfReviewRoutes);
router.use('/api/v1/timeslot', timeslotRoutes);
router.use('/api/v1/booking', bookingRoutes);
router.use('/api/v1/role-assignments', userRoleAssignmentRoutes);
router.use('/api/v1/roles', roleRouter);
router.use('/api/v1/users', userRouter);
router.use('/api/v1/permissions', permissionRoutes);

export default router;
