import mongoose from "mongoose";
import Organization from "../organization/organization.model";
import { ITurf, Turf } from "./turf.model";
import { TimeSlot } from "../timeslot/timeslot.model";
import { uploadImage, deleteImage } from "../../utils/cloudinary";
import ErrorResponse from "./../../utils/errorResponse";
import { extractPublicIdFromUrl } from "../../utils/extractUrl";
import { FilterOptions } from "./../../types/filter.d";

export default class TurfService {
  /**@desc Create new turf with image upload and data validation**/

  async createTurf(
    turfData: Partial<ITurf>,
    images?: Express.Multer.File[]
  ): Promise<ITurf> {
    try {
      // Upload images if provided
      let imageUrls: string[] = [];
      if (images && images.length > 0) {
        const uploadPromises = images.map((image) => uploadImage(image));
        const uploadedImages = await Promise.all(uploadPromises);
        imageUrls = uploadedImages.map((img) => img.url);
      }

      // Create turf with or without images
      const turf = new Turf({
        ...turfData,
        images: imageUrls,
      });

      return await turf.save();
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to create turf", 500);
    }
  }

  /**@desc Retrieve all turfs with basic filtering options **/

  async getTurfs(filters = {}): Promise<ITurf[]> {
    return await Turf.find(filters);
  }

  /**@desc Retrieve turf by ID **/
  async getTurfById(id: string): Promise<ITurf | null> {
    return await Turf.findById(id).populate('organization');
  }

  /**@desc Update turf by ID with image upload and data validation **/
  async updateTurf(
    id: string,
    updateData: Partial<ITurf>,
    newImages?: Express.Multer.File[]
  ): Promise<ITurf | null> {
    try {
      const turf = await Turf.findById(id);
      if (!turf) throw new ErrorResponse("Turf not found", 404);

      // Handle image updates
      if (newImages && newImages.length > 0) {
        // Upload new images
        const uploadPromises = newImages.map((image) => uploadImage(image));
        const uploadedImages = await Promise.all(uploadPromises);
        const newImageUrls = uploadedImages.map((img) => img.url);

        // Delete old images if they exist
        if (turf.images.length > 0) {
          await Promise.all(
            turf.images.map((imgUrl) => {
              const publicId = extractPublicIdFromUrl(imgUrl);
              return publicId ? deleteImage(publicId) : Promise.resolve();
            })
          );
        }

        updateData.images = newImageUrls;
      }

      const updatedTurf = await Turf.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      return updatedTurf;
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to update turf", 500);
    }
  }

  /**@desc Delete turf by ID **/
  async deleteTurf(id: string): Promise<ITurf | null> {
    try {
      const turf = await Turf.findById(id);
      if (!turf) return null;

      // Delete images from Cloudinary
      if (turf.images && turf.images.length > 0) {
        await Promise.all(
          turf.images.map(async (imageUrl) => {
            const publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId) {
              await deleteImage(publicId);
            }
          })
        );
      }

      return await Turf.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting turf:", error);
      throw new ErrorResponse("Failed to delete turf", 500);
    }
  }

  /**@desc filter turfs based on price, team_size, facilities, preferred_time, location and radius, sports**/

  async filterTurfs(filterOptions: FilterOptions) {
    try {
      // Parse and validate filter options
      const {
        query,
        aggregatePipeline,
        page = 1,
        limit = 10,
      } = await this.buildFilterQuery(filterOptions);

      // Execute query based on whether we need aggregation or not
      let turfs;
      let totalResults;

      if (aggregatePipeline.length > 0) {
        // If we need aggregation (for facilities or complex filters)
        aggregatePipeline.unshift({ $match: query });

        // Add pagination to aggregation
        const skip = (Number(page) - 1) * Number(limit);
        const paginatedPipeline = [
          ...aggregatePipeline,
          { $skip: skip },
          { $limit: Number(limit) },
        ];

        // Execute aggregation
        turfs = await Turf.aggregate(paginatedPipeline);

        // Count total results (without pagination)
        const countPipeline = [...aggregatePipeline];
        const countResults = await Turf.aggregate([
          ...countPipeline,
          { $count: "total" },
        ]);

        totalResults = countResults.length > 0 ? countResults[0].total : 0;
      } else {
        // Use regular find query (more efficient when possible)
        const skip = (Number(page) - 1) * Number(limit);

        turfs = await Turf.find(query)
          .skip(skip)
          .limit(Number(limit))
          .populate("organization")
          .exec();

        totalResults = await Turf.countDocuments(query);
      }

      // Calculate pagination info
      const totalPages = Math.ceil(totalResults / Number(limit));

      return {
        success: true,
        count: turfs.length,
        data: turfs,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalResults,
        },
      };
    } catch (error) {
      console.error("Error filtering turfs:", error);
      throw new ErrorResponse("Failed to filter turfs", 500);
    }
  }

  /**@desc Build filter query based on filter options**/
  private async buildFilterQuery(filterOptions: FilterOptions) {
    const {
      minPrice,
      maxPrice,
      teamSize,
      sports,
      facilities,
      preferredDate,
      preferredTimeStart,
      preferredTimeEnd,
      latitude,
      longitude,
      radius = "5", // Default radius 5km
      page = "1",
      limit = "10",
    } = filterOptions;

    // Base query
    const query: any = {};
    const aggregatePipeline: any[] = [];

    this.applyPriceFilter(query, minPrice, maxPrice);
    this.applyTeamSizeFilter(query, teamSize);
    this.applySportsFilter(query, sports);
    const preferredTimeRange =
      preferredTimeStart && preferredTimeEnd
        ? { start: preferredTimeStart, end: preferredTimeEnd }
        : undefined;
    await this.applyTimeSlotFilter(query, preferredDate, preferredTimeRange);

    const organizationIds = await this.findNearbyOrganizations(
      query,
      latitude,
      longitude,
      radius
    );

    this.applyFacilitiesFilter(aggregatePipeline, facilities);

    return {
      query,
      aggregatePipeline,
      page: Number(page),
      limit: Number(limit),
      organizationIds,
    };
  }

  /**@desc utility function to apply price filter on buildFilterQuery function**/
  private applyPriceFilter(query: any, minPrice?: string, maxPrice?: string) {
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.basePrice = {};
      if (minPrice !== undefined) query.basePrice.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.basePrice.$lte = Number(maxPrice);
    }
  }

  /**@desc utility function to apply team size filter on buildFilterQuery function**/
  private applyTeamSizeFilter(query: any, teamSize?: string | string[]) {
    if (teamSize !== undefined) {
      const sizes = Array.isArray(teamSize) ? teamSize : [teamSize];
      const parsedSizes = sizes.map((size) => Number(size));
      if (parsedSizes.length > 0) {
        query.team_size = { $in: parsedSizes };
      }
    }
  }

  /**@desc utility function to apply sports filter on buildFilterQuery function**/
  private applySportsFilter(query: any, sports?: string | string[]) {
    if (sports) {
      const sportsList = Array.isArray(sports) ? sports : [sports];
      if (sportsList.length > 0) {
        query.sports = { $in: sportsList };
      }
    }
  }

  /**@desc utility function to apply time preference filter on buildFilterQuery function**/
  private async applyTimeSlotFilter(
    query: any,
    preferredDate?: string,
    preferredTimeRange?: { start: string; end: string }
  ) {
    if (!preferredDate || !preferredTimeRange) return;

    const date = new Date(preferredDate);
    date.setHours(0, 0, 0, 0);

    const [startHour, startMinute] = preferredTimeRange.start
      .split(":")
      .map(Number);
    const [endHour, endMinute] = preferredTimeRange.end.split(":").map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMinute, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMinute, 0);

    const now = new Date();
    if (endDateTime < now) {
      query._id = { $in: [] }; // Entire time range is in the past, no need to query
      return;
    }

    const matchingSlots = await TimeSlot.find({
      is_available: true,
      start_time: { $gte: startDateTime },
      end_time: { $lte: endDateTime },
    }).distinct("turf");

    query._id = { $in: matchingSlots };
  }

  /**@desc utility function to find nearby organization for buildFilterQuery function**/
  private async findNearbyOrganizations(
    query: any,
    latitude?: string,
    longitude?: string,
    radius?: string
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!latitude || !longitude || !radius) return [];

    // Convert radius from km to meters
    const radiusInMeters = Number(radius) * 1000;

    // First find all organizations within the radius
    const nearbyOrganizations = await Organization.find({
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).select("_id");

    interface OrgDocument {
      _id: mongoose.Types.ObjectId;
    }

    const organizationIds = nearbyOrganizations.map(
      (org) => (org as unknown as OrgDocument)._id
    );

    // If organizations found, add to query
    if (organizationIds.length > 0) {
      query.organization = { $in: organizationIds };
    } else {
      // No organizations in radius, return empty query that will match nothing
      query._id = { $exists: false };
    }

    return organizationIds;
  }

  /**@desc utility function to apply facilities filter on buildFilterQuery function**/
  private applyFacilitiesFilter(
    aggregatePipeline: any[],
    facilities?: string | string[]
  ) {
    if (facilities) {
      const facilitiesList = Array.isArray(facilities)
        ? facilities
        : [facilities];

      if (facilitiesList.length > 0) {
        aggregatePipeline.push(
          {
            $lookup: {
              from: "organizations",
              localField: "organization",
              foreignField: "_id",
              as: "organizationData",
            },
          },
          {
            $unwind: {
              path: "$organizationData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "organizationData.facilities": { $all: facilitiesList },
            },
          },
          {
            $set: {
              organization: "$organizationData",
            },
          }
        );
      }
    }
  }
}
