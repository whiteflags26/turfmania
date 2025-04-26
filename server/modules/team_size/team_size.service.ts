import ErrorResponse from "../../utils/errorResponse";
import { ITeamSize, TeamSize } from "./team_size.model";

export default class TeamSizeService {
    /**
     * @desc Create new team size entry
     **/
    async createTeamSize(teamSizeData: Partial<ITeamSize>): Promise<ITeamSize> {
        try {
            const teamSize = new TeamSize(teamSizeData);
            return await teamSize.save();
        } catch (error) {
            console.error(error);
            throw new ErrorResponse("Failed to create team size", 500);
        }
    }

    /**
     * @desc Retrieve all team size entries
     **/
    async getAllTeamSizes(): Promise<ITeamSize[]> {
        return await TeamSize.find();
    }

    /**
     * @desc Retrieve team size by ID
     **/
    async getTeamSizeById(id: string): Promise<ITeamSize | null> {
        return await TeamSize.findById(id);
    }

    /**
     * @desc Update team size by ID
     **/
    async updateTeamSize(id: string, updateData: Partial<ITeamSize>): Promise<ITeamSize | null> {
        try {
            const teamSize = await TeamSize.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            });
            return teamSize;
        } catch (error) {
            console.error(error);
            throw new ErrorResponse("Failed to update team size", 500);
        }
    }

    /**
     * @desc Delete team size by ID
     **/
    async deleteTeamSize(id: string): Promise<ITeamSize | null> {
        try {
            return await TeamSize.findByIdAndDelete(id);
        } catch (error) {
            console.error("Error deleting team size:", error);
            throw new ErrorResponse("Failed to delete team size", 500);
        }
    }

    /**
   * @desc Validate if team sizes exist by names
   * @param teamSizeNames - Array of team size names to validate
   * @throws ErrorResponse if any team size doesn't exist
   */
    public async validateTeamSizes(teamSizeNames: string[]): Promise<void> {
        for (const teamSizeName of teamSizeNames) {
            const teamSizeExists = await TeamSize.findOne({ name: teamSizeName });
            if (!teamSizeExists) {
                throw new ErrorResponse(`Team size '${teamSizeName}' does not exist`, 400);
            }
        }
    }
}