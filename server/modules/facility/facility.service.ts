import ErrorResponse from "../../utils/errorResponse";
import { IFacility, Facility } from "./facility.model";

export default class FacilityService {
  /**
   * @desc Create new facility entry
   **/
  async createFacility(facilityData: Partial<IFacility>): Promise<IFacility> {
    try {
      const facility = new Facility(facilityData);
      return await facility.save();
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to create facility", 500);
    }
  }

  /**
   * @desc Retrieve all facility entries
   **/
  async getAllFacilities(): Promise<IFacility[]> {
    return await Facility.find();
  }

  /**
   * @desc Retrieve facility by ID
   **/
  async getFacilityById(id: string): Promise<IFacility | null> {
    return await Facility.findById(id);
  }

  /**
   * @desc Update facility by ID
   **/
  async updateFacility(id: string, updateData: Partial<IFacility>): Promise<IFacility | null> {
    try {
      const facility = await Facility.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
      return facility;
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to update facility", 500);
    }
  }

  /**
   * @desc Delete facility by ID
   **/
  async deleteFacility(id: string): Promise<IFacility | null> {
    try {
      return await Facility.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting facility:", error);
      throw new ErrorResponse("Failed to delete facility", 500);
    }
  }
  /**
   * @desc Get facility by name
   * @param name - The name of the facility to retrieve
   * @returns Facility object or null if not found
   **/
  public async validateFacilities(facilities: string[]): Promise<void> {
    for (const facilityName of facilities) {
      const facilityExists = await Facility.findOne({ name: facilityName });
      if (!facilityExists) {
        throw new ErrorResponse(`Facility '${facilityName}' does not exist`, 400);
      }
    }
  }
}
