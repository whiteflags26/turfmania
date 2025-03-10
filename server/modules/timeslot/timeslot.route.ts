import { Router } from 'express';

import TimeSlotController from './timeslot.controller';

const router = Router();

const timeslotController = new TimeSlotController();
router.post('/generate', timeslotController.generateTimeSlot);
router.get('/', timeslotController.getTimeSlot);
router.get('/available/:turfId', timeslotController.getAvailableTimeSlot);
router.put('/:id',timeslotController.updateTimeSlot)

export default router;
