import { Router } from 'express';

import TimeSlotController from './timeslot.controller';
import { standardApiLimiter } from '../../utils/rateLimiter';
import { protect } from '../auth/auth.middleware';

const router = Router();

const timeslotController = new TimeSlotController();
router.post('/generate',standardApiLimiter,protect, timeslotController.generateTimeSlot);
router.get('/',standardApiLimiter,protect, timeslotController.getTimeSlot);
router.get('/available/:turfId',protect,standardApiLimiter, timeslotController.getAvailableTimeSlot);
router.put('/:id',standardApiLimiter,protect,timeslotController.updateTimeSlot)

export default router;
