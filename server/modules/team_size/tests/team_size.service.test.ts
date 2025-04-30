import mongoose from 'mongoose';
import TeamSizeService from '../team_size.service';
import { TeamSize, ITeamSize } from '../team_size.model';
import { Turf } from '../../turf/turf.model';
import ErrorResponse from '../../../utils/errorResponse';

describe('TeamSizeService', () => {
  let teamSizeService: TeamSizeService;
  
  beforeEach(() => {
    teamSizeService = new TeamSizeService();
    
    // Clean up mocks after each test
    jest.clearAllMocks();
  });

  describe('createTeamSize', () => {
    it('should create a new team size successfully', async () => {
      // Arrange
      const teamSizeData = { name: 5 };
      const savedTeamSize = { _id: 'mockId', name: 5 };
      
      jest.spyOn(TeamSize.prototype, 'save').mockResolvedValueOnce(savedTeamSize as any);
      
      // Act
      const result = await teamSizeService.createTeamSize(teamSizeData);
      
      // Assert
      expect(result).toEqual(savedTeamSize);
      expect(TeamSize.prototype.save).toHaveBeenCalledTimes(1);
    });
    
    it('should throw ErrorResponse when save fails', async () => {
      // Arrange
      const teamSizeData = { name: 5 };
      jest.spyOn(TeamSize.prototype, 'save').mockRejectedValueOnce(new Error('DB error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act & Assert
      await expect(teamSizeService.createTeamSize(teamSizeData))
        .rejects
        .toThrow(new ErrorResponse('Failed to create team size', 500));
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getAllTeamSizes', () => {
    it('should return all team sizes', async () => {
      // Arrange
      const teamSizes = [
        { _id: 'id1', name: 5 },
        { _id: 'id2', name: 7 }
      ];
      
      jest.spyOn(TeamSize, 'find').mockResolvedValueOnce(teamSizes as any);
      
      // Act
      const result = await teamSizeService.getAllTeamSizes();
      
      // Assert
      expect(result).toEqual(teamSizes);
      expect(TeamSize.find).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getTeamSizeById', () => {
    it('should return a team size when valid ID is provided', async () => {
      // Arrange
      const teamSize = { _id: 'validId', name: 5 };
      jest.spyOn(TeamSize, 'findById').mockResolvedValueOnce(teamSize as any);
      
      // Act
      const result = await teamSizeService.getTeamSizeById('validId');
      
      // Assert
      expect(result).toEqual(teamSize);
      expect(TeamSize.findById).toHaveBeenCalledWith('validId');
    });
    
    it('should return null when team size is not found', async () => {
      // Arrange
      jest.spyOn(TeamSize, 'findById').mockResolvedValueOnce(null);
      
      // Act
      const result = await teamSizeService.getTeamSizeById('invalidId');
      
      // Assert
      expect(result).toBeNull();
      expect(TeamSize.findById).toHaveBeenCalledWith('invalidId');
    });
  });
  
  describe('updateTeamSize', () => {
    it('should update a team size successfully without name change', async () => {
      // Arrange
      const id = 'validId';
      const updateData = { name: 5 }; // Same name as original
      const originalTeamSize = { _id: id, name: 5 };
      const updatedTeamSize = { _id: id, name: 5 };
      
      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValueOnce(sessionMock as any);
      jest.spyOn(TeamSize, 'findById').mockResolvedValueOnce(originalTeamSize as any);
      jest.spyOn(TeamSize, 'findByIdAndUpdate').mockResolvedValueOnce(updatedTeamSize as any);
      
      // Act
      const result = await teamSizeService.updateTeamSize(id, updateData);
      
      // Assert
      expect(result).toEqual(updatedTeamSize);
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(sessionMock.startTransaction).toHaveBeenCalled();
      expect(TeamSize.findById).toHaveBeenCalledWith(id);
      expect(TeamSize.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        updateData,
        { new: true, runValidators: true, session: sessionMock }
      );
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });
    
    it('should update a team size and related turfs when name changes', async () => {
      // Arrange
      const id = 'validId';
      const updateData = { name: 7 }; // Different from original
      const originalTeamSize = { _id: id, name: 5 };
      const updatedTeamSize = { _id: id, name: 7 };
      
      const turfsToUpdate = [
        { _id: 'turf1', name: 'Turf 1', team_size: 5, save: jest.fn() },
        { _id: 'turf2', name: 'Turf 2', team_size: 5, save: jest.fn() }
      ];
      
      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValueOnce(sessionMock as any);
      jest.spyOn(TeamSize, 'findById').mockResolvedValueOnce(originalTeamSize as any);
      jest.spyOn(TeamSize, 'findByIdAndUpdate').mockResolvedValueOnce(updatedTeamSize as any);
      jest.spyOn(Turf, 'find').mockResolvedValueOnce(turfsToUpdate as any);
      
      // Act
      const result = await teamSizeService.updateTeamSize(id, updateData);
      
      // Assert
      expect(result).toEqual(updatedTeamSize);
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(Turf.find).toHaveBeenCalledWith({ team_size: originalTeamSize.name });
      expect(turfsToUpdate[0].save).toHaveBeenCalledWith({ session: sessionMock });
      expect(turfsToUpdate[1].save).toHaveBeenCalledWith({ session: sessionMock });
      expect(turfsToUpdate[0].team_size).toBe(7);
      expect(turfsToUpdate[1].team_size).toBe(7);
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
    });
    
    it('should throw error when team size is not found', async () => {
      // Arrange
      const sessionMock = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValueOnce(sessionMock as any);
      jest.spyOn(TeamSize, 'findById').mockResolvedValueOnce(null);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act & Assert
      await expect(teamSizeService.updateTeamSize('invalidId', { name: 7 }))
        .rejects
        .toThrow(new ErrorResponse('Team size not found', 404));
      
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });
    
    it('should handle errors and abort transaction on failure', async () => {
      // Arrange
      const error = new Error('Database error');
      const sessionMock = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValueOnce(sessionMock as any);
      jest.spyOn(TeamSize, 'findById').mockImplementation(() => {
        throw error;
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act & Assert
      await expect(teamSizeService.updateTeamSize('id', { name: 7 }))
        .rejects
        .toThrow(new ErrorResponse('Failed to update team size', 500));
      
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('deleteTeamSize', () => {
    it('should delete team size when not used by any turf', async () => {
      // Arrange
      const id = 'validId';
      const teamSizeToDelete = { _id: id, name: 5 };
      const turfsWithTeamSize: any[] = [];
      
      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValueOnce(sessionMock as any);
      jest.spyOn(TeamSize, 'findById').mockResolvedValueOnce(teamSizeToDelete as any);
      jest.spyOn(Turf, 'find').mockResolvedValueOnce(turfsWithTeamSize);
      jest.spyOn(TeamSize, 'findByIdAndDelete').mockResolvedValueOnce(teamSizeToDelete as any);
      jest.spyOn(Turf, 'updateMany').mockResolvedValueOnce({ modifiedCount: 0 } as any);
      
      // Act
      const result = await teamSizeService.deleteTeamSize(id);
      
      // Assert
      expect(result).toEqual(teamSizeToDelete);
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(TeamSize.findById).toHaveBeenCalledWith(id);
      expect(Turf.find).toHaveBeenCalledWith({ team_size: teamSizeToDelete.name });
      expect(TeamSize.findByIdAndDelete).toHaveBeenCalledWith(id, { session: sessionMock });
      expect(Turf.updateMany).toHaveBeenCalledWith(
        { team_size: teamSizeToDelete.name },
        { $set: { team_size: null } },
        { session: sessionMock }
      );
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
    });
    
    it('should throw error when team size is used by turfs', async () => {
      // Arrange
      const id = 'validId';
      const teamSizeToDelete = { _id: id, name: 5 };
      const turfsWithTeamSize = [
        { _id: 'turf1', name: 'Turf 1', team_size: 5 },
        { _id: 'turf2', name: 'Turf 2', team_size: 5 }
      ];
      
      const sessionMock = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValueOnce(sessionMock as any);
      jest.spyOn(TeamSize, 'findById').mockResolvedValueOnce(teamSizeToDelete as any);
      jest.spyOn(Turf, 'find').mockResolvedValueOnce(turfsWithTeamSize as any);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act & Assert
      await expect(teamSizeService.deleteTeamSize(id))
        .rejects
        .toThrow(new ErrorResponse(
          `Cannot delete team size 5 as it is the only team size for the following turfs: Turf 1, Turf 2`,
          400
        ));
      
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });
    
    it('should throw error when team size is not found', async () => {
      // Arrange
      const sessionMock = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValueOnce(sessionMock as any);
      jest.spyOn(TeamSize, 'findById').mockResolvedValueOnce(null);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act & Assert
      await expect(teamSizeService.deleteTeamSize('invalidId'))
        .rejects
        .toThrow(new ErrorResponse('Team size not found', 404));
      
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });
  });
  
  describe('validateTeamSizes', () => {
    it('should not throw error when all team sizes exist', async () => {
      // Arrange
      jest.spyOn(TeamSize, 'findOne')
        .mockResolvedValueOnce({ _id: 'id1', name: 5 } as any)
        .mockResolvedValueOnce({ _id: 'id2', name: 7 } as any);
      
      // Act & Assert
      await expect(teamSizeService.validateTeamSizes([5, 7])).resolves.not.toThrow();
      expect(TeamSize.findOne).toHaveBeenCalledTimes(2);
    });
    
    it('should throw error when a team size does not exist', async () => {
      // Arrange
      jest.spyOn(TeamSize, 'findOne')
        .mockResolvedValueOnce({ _id: 'id1', name: 5 } as any)
        .mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(teamSizeService.validateTeamSizes([5, 9]))
        .rejects
        .toThrow(new ErrorResponse("Team size '9' does not exist", 400));
      
      expect(TeamSize.findOne).toHaveBeenCalledTimes(2);
    });
  });
});