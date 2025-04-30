import mongoose from 'mongoose';
import FacilityService from '../facility.service';
import { Facility } from '../facility.model';
import Organization from '../../organization/organization.model';
import ErrorResponse from '../../../utils/errorResponse';

jest.mock('../facility.model');
jest.mock('../../organization/organization.model');

describe('FacilityService', () => {
  let facilityService: FacilityService;

  beforeEach(() => {
    facilityService = new FacilityService();
    jest.clearAllMocks();
  });

  describe('createFacility', () => {
    it('should create and return a new facility', async () => {
      const facilityData = { name: 'Test Facility' };
      const savedFacility = { _id: 'id', name: 'Test Facility' };
      (Facility as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedFacility),
      }));

      const result = await facilityService.createFacility(facilityData);
      expect(result).toEqual(savedFacility);
    });

    it('should throw ErrorResponse on save error', async () => {
      (Facility as any).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      }));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(facilityService.createFacility({ name: 'Test' }))
        .rejects.toThrow(new ErrorResponse('Failed to create facility', 500));
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAllFacilities', () => {
    it('should return all facilities', async () => {
      const facilities = [{ _id: 'id1', name: 'A' }, { _id: 'id2', name: 'B' }];
      (Facility.find as any) = jest.fn().mockResolvedValue(facilities);

      const result = await facilityService.getAllFacilities();
      expect(result).toEqual(facilities);
    });
  });

  describe('getFacilityById', () => {
    it('should return a facility by id', async () => {
      const facility = { _id: 'id', name: 'Test' };
      (Facility.findById as any) = jest.fn().mockResolvedValue(facility);

      const result = await facilityService.getFacilityById('id');
      expect(result).toEqual(facility);
    });

    it('should return null if not found', async () => {
      (Facility.findById as any) = jest.fn().mockResolvedValue(null);

      const result = await facilityService.getFacilityById('id');
      expect(result).toBeNull();
    });
  });

  describe('updateFacility', () => {
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

    it('should update facility and organization references', async () => {
      const id = 'id';
      const updateData = { name: 'Updated' };
      const currentFacility = { _id: id, name: 'Old' };
      const updatedFacility = { _id: id, name: 'Updated' };

      (Facility.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(currentFacility) });
      (Facility.findByIdAndUpdate as any) = jest.fn().mockResolvedValue(updatedFacility);
      (Organization.updateMany as any) = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      const result = await facilityService.updateFacility(id, updateData);
      expect(result).toEqual(updatedFacility);
      expect(Organization.updateMany).toHaveBeenCalled();
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
    });

    it('should throw 404 if facility not found', async () => {
      (Facility.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(null) });

      await expect(facilityService.updateFacility('id', { name: 'X' }))
        .rejects.toThrow(new ErrorResponse('Facility not found', 404));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should handle errors and abort transaction', async () => {
      (Facility.findById as any) = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(facilityService.updateFacility('id', { name: 'X' }))
        .rejects.toThrow(new ErrorResponse('Failed to update facility', 500));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteFacility', () => {
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

    it('should delete facility and update organizations', async () => {
      const id = 'id';
      const facility = { _id: id, name: 'Test' };
      (Facility.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(facility) });
      (Organization.find as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve([]) });
      (Organization.updateMany as any) = jest.fn().mockResolvedValue({});
      (Facility.findByIdAndDelete as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(facility) });

      const result = await facilityService.deleteFacility(id);
      expect(result).toEqual(facility);
      expect(Organization.updateMany).toHaveBeenCalled();
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
    });

    it('should throw 404 if facility not found', async () => {
      (Facility.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(null) });

      await expect(facilityService.deleteFacility('id'))
        .rejects.toThrow(new ErrorResponse('Facility not found', 404));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should throw error if organization would be left with no facilities', async () => {
      const id = 'id';
      const facility = { _id: id, name: 'Test' };
      const orgs = [{ name: 'Org1' }];
      (Facility.findById as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(facility) });
      (Organization.find as any) = jest.fn().mockReturnValue({ session: () => Promise.resolve(orgs) });

      await expect(facilityService.deleteFacility(id))
        .rejects.toThrow(new ErrorResponse(
          'Cannot delete facility: Organizations (Org1) would be left with no facilities', 400
        ));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should handle errors and abort transaction', async () => {
      (Facility.findById as any) = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(facilityService.deleteFacility('id'))
        .rejects.toThrow(new ErrorResponse('Failed to delete facility', 500));
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('validateFacilities', () => {
    it('should not throw error when all facilities exist', async () => {
      (Facility.findOne as any) = jest.fn().mockResolvedValue({ _id: 'id', name: 'Test' });

      await expect(facilityService.validateFacilities(['Test'])).resolves.not.toThrow();
      expect(Facility.findOne).toHaveBeenCalledWith({ name: 'Test' });
    });

    it('should throw error when a facility does not exist', async () => {
      (Facility.findOne as any) = jest.fn().mockResolvedValue(null);

      await expect(facilityService.validateFacilities(['Unknown']))
        .rejects.toThrow(new ErrorResponse("Facility 'Unknown' does not exist", 400));
      expect(Facility.findOne).toHaveBeenCalledWith({ name: 'Unknown' });
    });
  });
});