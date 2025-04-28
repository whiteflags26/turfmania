import mongoose from 'mongoose';
import { deleteImage, uploadImage } from '../../utils/cloudinary';
import { extractPublicIdFromUrl } from '../../utils/extractUrl';
import Organization from '../organization/organization.model';
import SportsService from '../sports/sports.service';
import TeamSizeService from '../team_size/team_size.service';
import ErrorResponse from './../../utils/errorResponse';
import { ITurf, Turf } from './turf.model';

export default class TurfService {
  private readonly sportsService: SportsService;
  private readonly teamSizeService: TeamSizeService;

  constructor() {
    this.sportsService = new SportsService();
    this.teamSizeService = new TeamSizeService();
  }

  /**
   * @desc Validate turf data (sports and team size)
   * @private
   */
  private async validateTurfData(
    sports: string[],
    teamSize: number,
  ): Promise<void> {
    // Validate sports exist
    await this.sportsService.validateSports(sports);

    // Validate team size exists
    await this.teamSizeService.validateTeamSizes([teamSize]);
  }

  /**@desc Create new turf with image upload and data validation**/
  async createTurf(
    turfData: Partial<ITurf>,
    images?: Express.Multer.File[],
  ): Promise<ITurf> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate sports and team size before creating turf
      if (turfData.sports && turfData.team_size) {
        await this.validateTurfData(turfData.sports, turfData.team_size);
      } else {
        throw new ErrorResponse('Sports and team size are required', 400);
      }

      // Validate name - ensure it's a string and sanitize it
      if (!turfData.name || typeof turfData.name !== 'string') {
        throw new ErrorResponse('Valid turf name is required', 400);
      }

      // Validate organization ID
      if (
        !turfData.organization ||
        !mongoose.Types.ObjectId.isValid(turfData.organization.toString())
      ) {
        throw new ErrorResponse('Valid organization ID is required', 400);
      }

      // Create a sanitized query using validated values
      const query = {
        name: turfData.name.trim(),
        organization: new mongoose.Types.ObjectId(
          turfData.organization.toString(),
        ),
      };

      // Check if a turf with the same name already exists in this organization
      const existingTurf = await Turf.findOne(query);

      if (existingTurf) {
        throw new ErrorResponse(
          'A turf with this name already exists in the organization',
          400,
        );
      }

      // Upload images if provided
      let imageUrls: string[] = [];
      if (images && images.length > 0) {
        const uploadPromises = images.map(image => uploadImage(image));
        const uploadedImages = await Promise.all(uploadPromises);
        imageUrls = uploadedImages.map(img => img.url);
      }

      // Create a sanitized version of turfData for DB insertion
      const sanitizedTurfData = {
        name: turfData.name.trim(),
        organization: new mongoose.Types.ObjectId(
          turfData.organization.toString(),
        ),
        sports: Array.isArray(turfData.sports) ? turfData.sports : [],
        team_size:
          typeof turfData.team_size === 'number' ? turfData.team_size : 0,
        basePrice:
          typeof turfData.basePrice === 'number' ? turfData.basePrice : 0,
        operatingHours: Array.isArray(turfData.operatingHours)
          ? turfData.operatingHours
          : [],
        images: imageUrls,
      };

      // Create turf with sanitized data
      const turf = new Turf(sanitizedTurfData);

      const savedTurf = await turf.save({ session });

      // Update organization by pushing turf ID
      await Organization.findByIdAndUpdate(
        sanitizedTurfData.organization,
        { $push: { turfs: savedTurf._id } },
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return savedTurf;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error(error);
      throw new ErrorResponse(
        error instanceof ErrorResponse
          ? error.message
          : 'Failed to create turf',
        error instanceof ErrorResponse ? error.statusCode : 500,
      );
    }
  }

  /**@desc Retrieve all turfs with basic filtering options **/
  async getTurfs(filters = {}): Promise<ITurf[]> {
    return await Turf.find(filters);
  }

  /**@desc Retrieve turf by ID **/
  async getTurfById(id: string): Promise<ITurf | null> {
    // Since we're already storing turf IDs in the organization model,
    // we can use a simpler, more efficient population strategy
    return await Turf.findById(id).populate({
      path: 'organization',
      select:
        '_id name facilities location images orgContactPhone orgContactEmail', // Select only needed fields
    });
  }

  /**
   * @desc Update turf by ID with image upload and data validation
   */
  async updateTurf(
    id: string,
    updateData: Partial<ITurf>,
    newImages?: Express.Multer.File[],
  ): Promise<ITurf | null> {
    try {
      const turf = await this.getTurfOrThrow(id);

      await this.preventOrgChange(updateData, turf);
      await this.validateNameUniqueness(updateData.name, turf);
      await this.validateSportsAndTeamSize(updateData, turf);
      await this.processImageUpdates(newImages, turf, updateData);

      return await this.applyUpdate(id, updateData);
    } catch (error) {
      console.error('Error updating turf:', error);
      const isErrorResponse = error instanceof ErrorResponse;
      throw new ErrorResponse(
        isErrorResponse ? error.message : 'Failed to update turf',
        isErrorResponse ? error.statusCode : 500,
      );
    }
  }

  // ─── Helper Methods ───────────────────────────────────────────────────────────

  private async getTurfOrThrow(id: string): Promise<ITurf> {
    const turf = await Turf.findById(id);
    if (!turf) {
      throw new ErrorResponse('Turf not found', 404);
    }
    return turf;
  }

  private async preventOrgChange(
    updateData: Partial<ITurf>,
    turf: ITurf,
  ): Promise<void> {
    if (
      updateData.organization &&
      !updateData.organization.equals(turf.organization)
    ) {
      throw new ErrorResponse(
        'Cannot change the organization of an existing turf',
        400,
      );
    }
  }

  private async validateNameUniqueness(
    newName: string | undefined,
    turf: ITurf,
  ): Promise<void> {
    if (!newName || newName === turf.name) return;

    const existingTurf = await Turf.findOne({
      name: newName,
      organization: turf.organization,
      _id: { $ne: turf._id },
    });

    if (existingTurf) {
      throw new ErrorResponse(
        'A turf with this name already exists in the organization',
        400,
      );
    }
  }

  private async validateSportsAndTeamSize(
    updateData: Partial<ITurf>,
    turf: ITurf,
  ): Promise<void> {
    if (updateData.sports || updateData.team_size) {
      const sportsToValidate = updateData.sports ?? turf.sports;
      const teamSizeToValidate = updateData.team_size ?? turf.team_size;
      await this.validateTurfData(sportsToValidate, teamSizeToValidate);
    }
  }

  private async processImageUpdates(
    newImages: Express.Multer.File[] | undefined,
    turf: ITurf,
    updateData: Partial<ITurf>,
  ): Promise<void> {
    if (!newImages?.length) return;

    // 1. Upload new images
    const uploadedImages = await Promise.all(
      newImages.map(image => uploadImage(image)),
    );
    const newImageUrls = uploadedImages.map(img => img.url);

    // 2. Delete old images
    if (turf.images.length > 0) {
      await Promise.all(
        turf.images.map(imgUrl => {
          const publicId = extractPublicIdFromUrl(imgUrl);
          return publicId ? deleteImage(publicId) : Promise.resolve();
        }),
      );
    }

    // 3. Update the images array
    updateData.images = newImageUrls;
  }

  private async applyUpdate(
    id: string,
    updateData: Partial<ITurf>,
  ): Promise<ITurf | null> {
    return Turf.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }
}
