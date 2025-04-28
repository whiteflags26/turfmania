import {Router} from 'express'
import BookingController from './booking.controller'
import { protect } from '../auth/auth.middleware';
import { standardApiLimiter } from '../../utils/rateLimiter';
standardApiLimiter

const router= Router()
const bookingController= new BookingController();
router.post('/',protect,standardApiLimiter,bookingController.createBooking)

export default router;