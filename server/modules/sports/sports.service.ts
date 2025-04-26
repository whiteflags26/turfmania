import ErrorResponse from "../../utils/errorResponse";
import { ISports, Sports } from "./sports.model";

export default class SportsService {
    /**
     * @desc Create new sports entry
     **/
    async createSports(sportsData: Partial<ISports>): Promise<ISports> {
        try {
            const sports = new Sports(sportsData);
            return await sports.save();
        } catch (error) {
            console.error(error);
            throw new ErrorResponse("Failed to create sports", 500);
        }
    }

    /**
     * @desc Retrieve all sports entries
     **/
    async getAllSports(): Promise<ISports[]> {
        return await Sports.find();
    }

    /**
     * @desc Retrieve sports by ID
     **/
    async getSportsById(id: string): Promise<ISports | null> {
        return await Sports.findById(id);
    }

    /**
     * @desc Update sports by ID
     **/
    async updateSports(id: string, updateData: Partial<ISports>): Promise<ISports | null> {
        try {
            const sports = await Sports.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            });
            return sports;
        } catch (error) {
            console.error(error);
            throw new ErrorResponse("Failed to update sports", 500);
        }
    }

    /**
     * @desc Delete sports by ID
     **/
    async deleteSports(id: string): Promise<ISports | null> {
        try {
            return await Sports.findByIdAndDelete(id);
        } catch (error) {
            console.error("Error deleting sports:", error);
            throw new ErrorResponse("Failed to delete sports", 500);
        }
    }

    /**
   * @desc Validate if sports exist by names
   * @param sportsNames - Array of sport names to validate
   * @throws ErrorResponse if any sport doesn't exist
   */
    public async validateSports(sportsNames: string[]): Promise<void> {
        for (const sportName of sportsNames) {
            const sportExists = await Sports.findOne({ name: sportName });
            if (!sportExists) {
                throw new ErrorResponse(`Sport '${sportName}' does not exist`, 400);
            }
        }
    }
}