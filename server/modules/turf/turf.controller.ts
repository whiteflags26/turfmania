import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import asyncHandler from "../../shared/middleware/async";
import ErrorResponse from "../../utils/errorResponse";
import TurfService from "./turf.service";
import { ITurf } from "./turf.model";

export default class turfController {
  private turfService: TurfService;
  constructor() {
    this.turfService = new TurfService();
  }
  createTurf = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        name,
        sports,
        basePrice,
        team_size,
        organization,
        operatingHours,
      } = req.body;
      const images = req.files as Express.Multer.File[];

      // Parse numeric fields
      const parsedBasePrice = parseFloat(basePrice);
      if (isNaN(parsedBasePrice)) {
        return next(new ErrorResponse("basePrice must be a valid number", 400));
      }

      // Parse sports (if sent as a JSON string)
      let parsedSports: string[];
      try {
        parsedSports = typeof sports === "string" ? JSON.parse(sports) : sports;
      } catch (error) {
        return next(new ErrorResponse("Invalid sports format", 400));
      }

      // Parse operatingHours (if sent as a JSON string)
      let parsedOperatingHours: { day: number; open: string; close: string }[];
      try {
        parsedOperatingHours =
          typeof operatingHours === "string"
            ? JSON.parse(operatingHours)
            : operatingHours;
      } catch (error) {
        return next(new ErrorResponse("Invalid operatingHours format", 400));
      }

      // Validate parsed data
      if (
        !name ||
        !parsedSports ||
        !parsedBasePrice ||
        !team_size ||
        !organization ||
        !parsedOperatingHours
      ) {
        return next(new ErrorResponse("All fields are required", 400));
      }

      // Create turf data object
      const turfData: Partial<ITurf> = {
        name,
        sports: parsedSports,
        basePrice: parsedBasePrice,
        team_size,
        organization,
        operatingHours: parsedOperatingHours,
      };

      // Call service to create turf
      const turf = await this.turfService.createTurf(turfData, images);

      res.status(201).json({
        success: true,
        data: turf,
        message: "Turf created successfully",
      });
    }
  );

  getTurfs = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const filter = req.query;
      const turfs = await this.turfService.getTurfs(filter);
      if (!turfs) {
        return next(new ErrorResponse("No turf found", 400));
      }

      res.status(200).json({
        success: true,
        data: turfs,
      });
    }
  );

  getTurfById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid Turf ID format", 404));
      }
      const turf = await this.turfService.getTurfById(id);
      if (!turf) {
        return next(new ErrorResponse("No turf found", 404));
      }

      res.status(200).json({
        success: true,
        data: turf,
      });
    }
  );
  updateTurfById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { basePrice, operatingHours, sports, ...rest } = req.body;
      const newImages = req.files as Express.Multer.File[];

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid Turf ID format", 404));
      }

      // Initialize updateData with rest of the fields
      const updateData: Partial<ITurf> = { ...rest };

      // Parse numeric fields
      if (basePrice) {
        const parsedBasePrice = parseFloat(basePrice);
        if (isNaN(parsedBasePrice)) {
          return next(
            new ErrorResponse("basePrice must be a valid number", 400)
          );
        }
        updateData.basePrice = parsedBasePrice;
      }

      // Parse sports array if provided
      if (sports) {
        try {
          updateData.sports =
            typeof sports === "string" ? JSON.parse(sports) : sports;
        } catch (error) {
          return next(new ErrorResponse("Invalid sports format", 400));
        }
      }

      // Parse operatingHours if provided
      if (operatingHours) {
        try {
          updateData.operatingHours =
            typeof operatingHours === "string"
              ? JSON.parse(operatingHours)
              : operatingHours;
        } catch (error) {
          return next(new ErrorResponse("Invalid operatingHours format", 400));
        }
      }

      // Validate team_size if provided
      if (rest.team_size) {
        const parsedTeamSize = parseInt(rest.team_size);
        if (isNaN(parsedTeamSize)) {
          return next(
            new ErrorResponse("team_size must be a valid integer", 400)
          );
        }
        updateData.team_size = parsedTeamSize;
      }

      const turf = await this.turfService.updateTurf(id, updateData, newImages);

      if (!turf) {
        return next(new ErrorResponse("No turf found", 404));
      }

      res.status(200).json({
        success: true,
        data: turf,
        message: "Turf updated successfully",
      });
    }
  );
  deleteTurfById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid Turf ID format", 404));
      }

      const turf = await this.turfService.deleteTurf(id);

      if (!turf) {
        return next(new ErrorResponse("No turf found", 404));
      }

      res.status(200).json({
        success: true,
        data: turf,
        message: "Turf deleted successfully",
      });
    }
  );
}
