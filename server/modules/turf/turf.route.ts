import { Router } from 'express';

import TurfController from './turf.controller';

const router = Router();

const turfController = new TurfController();
router.post('/', turfController.createTurf);
router.get('/', turfController.getTurfs);
router.get('/:id', turfController.getTurfById);
router.put('/:id', turfController.updateTurfById);
router.delete('/:id', turfController.deleteTurfById);

export default router;
