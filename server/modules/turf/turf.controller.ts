import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
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

  getTurfs = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const filter = req.query;
      const turfs = await this.turfService.getTurfs(filter);
      if (!turfs) {
        return next(new ErrorResponse('No turf found', 400));
      }

      res.status(200).json({
        success: true,
        data: turfs,
      });
    },
  );

  getTurfById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse('Invalid Turf ID format', 404));
      }
      const turf = await this.turfService.getTurfById(id);
      if (!turf) {
        return next(new ErrorResponse('No turf found', 404));
      }

      res.status(200).json({
        success: true,
        data: turf,
      });
    },
  );
  updateTurfById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const updatebody = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse('Invalid Turf ID format', 404));
      }
      const turf = await this.turfService.updateTurf(id, updatebody);
      if (!turf) {
        return next(new ErrorResponse('No turf found', 404));
      }

      res.status(200).json({
        success: true,
        data: turf,
      });
    },
  );
  deleteTurfById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse('Invalid Turf ID format', 404));
      }
      const turf = await this.turfService.deleteTurf(id);
      if (!turf) {
        return next(new ErrorResponse('No turf found', 404));
      }

      res.status(200).json({
        success: true,
        data: turf,
      });
    },
  );
}
