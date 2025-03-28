import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import asyncHandler from "../../shared/middleware/async";
import ErrorResponse from "../../utils/errorResponse";
import TurfService from "./turf.service";
import { ITurf } from "./turf.model";
import { FilterOptions } from "../../types/filter.d";

export default class TurfController {
  private turfService: TurfService;
  constructor() {
    this.turfService = new TurfService();
  }

  /**
   * @route POST /api/v1/turfs
   * @desc Create a new turf with details, images, and operating hours
   * @access Private/Admin
   */
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
      let parsedBasePrice: ITurf["basePrice"];
      parsedBasePrice = parseFloat(basePrice);
      if (isNaN(parsedBasePrice)) {
        return next(new ErrorResponse("basePrice must be a valid number", 400));
      }

      // Parse sports (if sent as a JSON string)
      let parsedSports: ITurf["sports"];
      try {
        parsedSports = typeof sports === "string" ? JSON.parse(sports) : sports;
      } catch (error) {
        return next(new ErrorResponse("Invalid sports format", 400));
      }

      // Parse operatingHours (if sent as a JSON string)
      let parsedOperatingHours: ITurf["operatingHours"];
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

  /**
   * @route GET /api/v1/turfs
   * @desc Retrieve all turfs with optional basic filtering
   * @access Public
   */

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

  /**
   * @route GET /api/v1/turfs/:id
   * @desc Retrieve a specific turf by ID
   * @access Public
   */

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

  /**
   * @route PUT /api/v1/turfs/:id
   * @desc Update a turf's details and images by ID
   * @access Private/Admin
   */

  updateTurfById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { basePrice, operatingHours, sports, ...rest } = req.body;
      const newImages = req.files as Express.Multer.File[];

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid Turf ID format", 404));
      }

      try {
        const updateData = await this.validateAndParseUpdateData(
          { basePrice, operatingHours, sports, ...rest },
          next
        );
        if (!updateData) return;

        const turf = await this.turfService.updateTurf(
          id,
          updateData,
          newImages
        );
        if (!turf) return next(new ErrorResponse("No turf found", 404));

        res.status(200).json({
          success: true,
          data: turf,
          message: "Turf updated successfully",
        });
      } catch (error) {
        next(error);
      }
    }
  );

  private async validateAndParseUpdateData(
    data: any,
    next: NextFunction
  ): Promise<Partial<ITurf> | void> {
    const updateData: Partial<ITurf> = {};
    const { basePrice, operatingHours, sports, team_size, ...rest } = data;

    // Copy simple fields
    Object.assign(updateData, rest);

    // Parse and validate individual fields
    const parsers = [
      this.parseBasePrice(basePrice, next),
      this.parseSports(sports, next),
      this.parseOperatingHours(operatingHours, next),
      this.parseTeamSize(team_size, next),
    ];

    // Check for any parser errors
    for (const result of parsers) {
      if (result.error) return next(result.error);
      Object.assign(updateData, result.data);
    }

    return updateData;
  }

  // Field-specific parser functions
  private parseBasePrice(value: any, next: NextFunction) {
    if (!value) return { data: {} };
    const parsed = parseFloat(value);
    return isNaN(parsed)
      ? { error: new ErrorResponse("basePrice must be a valid number", 400) }
      : { data: { basePrice: parsed } };
  }

  private parseSports(value: any, next: NextFunction) {
    if (!value) return { data: {} };
    try {
      return {
        data: { sports: typeof value === "string" ? JSON.parse(value) : value },
      };
    } catch {
      return { error: new ErrorResponse("Invalid sports format", 400) };
    }
  }

  private parseOperatingHours(value: any, next: NextFunction) {
    if (!value) return { data: {} };
    try {
      return {
        data: {
          operatingHours: typeof value === "string" ? JSON.parse(value) : value,
        },
      };
    } catch {
      return { error: new ErrorResponse("Invalid operatingHours format", 400) };
    }
  }

  private parseTeamSize(value: any, next: NextFunction) {
    if (!value) return { data: {} };
    const parsed = parseInt(value);
    return isNaN(parsed)
      ? { error: new ErrorResponse("team_size must be a valid integer", 400) }
      : { data: { team_size: parsed } };
  }

  /**
   * @route DELETE /api/v1/turfs/:id
   * @desc Delete a turf by ID
   * @access Private/Admin
   */
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

  /**
   * @route GET /api/v1/turfs/filter
   * @desc Filter turfs by price, sports, location, availability, etc.
   * @access Public
   */

  filterTurfs = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Extract filter options from query parameters
      const filterOptions: FilterOptions = {
        minPrice: req.query.minPrice as string,
        maxPrice: req.query.maxPrice as string,
        teamSize: req.query.teamSize as string,
        sports: req.query.sports as string | string[],
        facilities: req.query.facilities as string | string[],
        preferredDay: req.query.preferredDay as string,
        preferredTime: req.query.preferredTime as string,
        latitude: req.query.latitude as string,
        longitude: req.query.longitude as string,
        radius: req.query.radius as string,
        page: req.query.page as string,
        limit: req.query.limit as string,
      };

      const result = await this.turfService.filterTurfs(filterOptions);

      res.status(200).json(result);
    }
  );
}
