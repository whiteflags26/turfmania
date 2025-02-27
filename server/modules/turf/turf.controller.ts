import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import TurfService from './turf.service';

export default class turfController {
  private turfService: TurfService;
  constructor() {
    this.turfService = new TurfService();
  }
  createTurf = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const turfData = req.body;
      const turf = await this.turfService.createTurf(turfData);
      res.status(201).json({
        success: true,
        data: turf,
      });
    },
  );
}
