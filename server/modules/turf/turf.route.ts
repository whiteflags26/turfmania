import { Router } from 'express';

import TurfController from './turf.controller';

const router = Router();

const turfController = new TurfController();
router.post('/', turfController.createTurf);
export default router;
