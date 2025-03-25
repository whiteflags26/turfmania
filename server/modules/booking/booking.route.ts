import {Router} from 'express'
import BookingController from './booking.controller'
import { protect } from '../auth/auth.middleware';

const router= Router()
const bookingController= new BookingController();
router.post('/',protect,bookingController.createBooking)

export default router;