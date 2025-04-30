import mongoose from 'mongoose';
import SportsService from '../sports.service';
import { Sports } from '../sports.model';
import { Turf } from '../../turf/turf.model';
import ErrorResponse from '../../../utils/errorResponse';

jest.mock('../sports.model');
jest.mock('../../turf/turf.model');

describe('SportsService', () => {
  let sportsService: SportsService;

  beforeEach(() => {
    sportsService = new SportsService();
    jest.clearAllMocks();
  });

  describe('createSports', () => {
    it('should create and return a new sport', async () => {
      const sportsData = { name: 'Football' };
      const savedSport = { _id: 'id', name: 'Football' };
      (Sports as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedSport),
      }));

      const result = await sportsService.createSports(sportsData);
      expect(result).toEqual(savedSport);
    });

    it('should throw ErrorResponse on save error', async () => {
      (Sports as any).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      }));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(sportsService.createSports({ name: 'Football' }))
        .rejects.toThrow(new ErrorResponse('Failed to create sports', 500));
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAllSports', () => {
    it('should return all sports', async () => {
      const sportsList = [{ name: 'Football' }, { name: 'Cricket' }];
      (Sports.find as any) = jest.fn().mockResolvedValue(sportsList);

      const result = await sportsService.getAllSports();
      expect(result).toEqual(sportsList);
    });
  });

  describe('getSportsById', () => {
    it('should return a sport by id', async () => {
      const sport = { _id: 'id', name: 'Football' };
      (Sports.findById as any) = jest.fn().mockResolvedValue(sport);

      const result = await sportsService.getSportsById('id');
      expect(result).toEqual(sport);
    });
  });

  describe('updateSports', () => {
    let sessionMock: any;
    beforeEach(() => {
      sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(sessionMock);
    });

    it('should throw 404 if sport not found', async () => {
      (Sports.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(null) });

      await expect(sportsService.updateSports('id', { name: 'Soccer' }))
        .rejects.toThrow(new ErrorResponse('Sport not found', 404));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should handle errors and abort transaction', async () => {
      (Sports.findById as any) = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(sportsService.updateSports('id', { name: 'Soccer' }))
        .rejects.toThrow(new ErrorResponse('Failed to update sport', 500));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteSports', () => {
    let sessionMock: any;
    beforeEach(() => {
      sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(sessionMock);
    });

    it('should delete a sport and update turfs', async () => {
      const id = 'id';
      const sport = { _id: id, name: 'Football' };
      (Sports.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(sport) });
      (Turf.find as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve([]) });
      (Turf.updateMany as any) = jest.fn().mockResolvedValue({});
      (Sports.findByIdAndDelete as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(sport) });

      const result = await sportsService.deleteSports(id);
      expect(result).toEqual(sport);
      expect(Turf.updateMany).toHaveBeenCalledWith(
        { sports: 'Football' },
        { $pull: { sports: 'Football' } },
        { session: sessionMock }
      );
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
    });

    it('should throw 404 if sport not found', async () => {
      (Sports.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(null) });

      await expect(sportsService.deleteSports('id'))
        .rejects.toThrow(new ErrorResponse('Sport not found', 404));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should throw error if any turf would be left with no sports', async () => {
      const id = 'id';
      const sport = { _id: id, name: 'Football' };
      const turfs = [{ name: 'Turf 1' }, { name: 'Turf 2' }];
      (Sports.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(sport) });
      (Turf.find as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(turfs) });

      await expect(sportsService.deleteSports(id))
        .rejects.toThrow(new ErrorResponse(
          'Cannot delete sport: Turfs (Turf 1, Turf 2) would be left with no sports', 400
        ));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should handle errors and abort transaction', async () => {
      (Sports.findById as any) = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(sportsService.deleteSports('id'))
        .rejects.toThrow(new ErrorResponse('Failed to delete sport', 500));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('validateSports', () => {
    it('should not throw error when all sports exist', async () => {
      (Sports.findOne as any) = jest.fn().mockResolvedValue({ _id: 'id', name: 'Football' });

      await expect(sportsService.validateSports(['Football'])).resolves.not.toThrow();
      expect(Sports.findOne).toHaveBeenCalledWith({ name: 'Football' });
    });

    it('should throw error when a sport does not exist', async () => {
      (Sports.findOne as any) = jest.fn().mockResolvedValue(null);

      await expect(sportsService.validateSports(['Unknown']))
        .rejects.toThrow(new ErrorResponse("Sport 'Unknown' does not exist", 400));
      expect(Sports.findOne).toHaveBeenCalledWith({ name: 'Unknown' });
    });
  });
});