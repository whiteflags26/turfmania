import { Router } from 'express';

import TurfController from './turf.controller';

const router = Router();

const turfController = new TurfController();
router.post('/', turfController.createTurf);
router.get('/', turfController.getTurfs);
router.get('/:id', turfController.getTurfById);
export default router;
