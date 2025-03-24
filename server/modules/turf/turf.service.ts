import mongoose from "mongoose";
import Organization from "../organization/organization.model";
import { ITurf, Turf } from "./turf.model";
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
    return await Turf.findById(id);
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
      preferredDay,
      preferredTime,
      latitude,
      longitude,
      radius = "5", // Default radius 5km
      page = "1",
      limit = "10",
    } = filterOptions;

    // Base query
    const query: any = {};
    const aggregatePipeline: any[] = [];

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.basePrice = {};
      if (minPrice !== undefined) query.basePrice.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.basePrice.$lte = Number(maxPrice);
    }

    // Team size filter
    if (teamSize !== undefined) {
      query.team_size = Number(teamSize);
    }

    // Sports filter
    if (sports) {
      const sportsList = Array.isArray(sports) ? sports : [sports];
      if (sportsList.length > 0) {
        query.sports = { $in: sportsList };
      }
    }

    // Time preference filter
    if (preferredDay !== undefined && preferredTime !== undefined) {
      const day = Number(preferredDay);

      // Validate day is 0-6
      if (day >= 0 && day <= 6) {
        // Find turfs that are open at the preferred time on the preferred day
        query.operatingHours = {
          $elemMatch: {
            day,
            open: { $lte: preferredTime },
            close: { $gte: preferredTime },
          },
        };
      }
    }

    // Location radius filter
    let organizationIds: mongoose.Types.ObjectId[] = [];
    if (latitude && longitude && radius) {
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

      organizationIds = nearbyOrganizations.map(
        (org) => (org as unknown as OrgDocument)._id
      );

      // If organizations found, add to query
      if (organizationIds.length > 0) {
        query.organization = { $in: organizationIds };
      } else {
        // No organizations in radius, return empty query that will match nothing
        query._id = { $exists: false };
      }
    }

    // Facilities filter (requires joining with Organization collection)
    if (facilities) {
      const facilitiesList = Array.isArray(facilities)
        ? facilities
        : [facilities];

      if (facilitiesList.length > 0) {
        // We need to use aggregation pipeline for this
        aggregatePipeline.push({
          $lookup: {
            from: "organizations",
            localField: "organization",
            foreignField: "_id",
            as: "organizationData",
          },
        });

        aggregatePipeline.push({
          $match: {
            "organizationData.facilities": { $all: facilitiesList },
          },
        });
      }
    }

    return {
      query,
      aggregatePipeline,
      page: Number(page),
      limit: Number(limit),
      organizationIds,
    };
  }
}
