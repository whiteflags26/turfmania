import express from 'express';
import { authorize, protect } from '../auth/auth.middleware';
import { createTurf } from './turf.controller';

const router = express.Router();

router.route('/').post(protect, authorize('owner'), createTurf);
export default router;
