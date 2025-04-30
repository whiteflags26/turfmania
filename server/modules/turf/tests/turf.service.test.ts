import mongoose from 'mongoose';
import TurfService from '../turf.service';
import { Turf } from '../turf.model';
import Organization from '../../organization/organization.model';
import { TurfReview } from '../../turf-review/turf-review.model';
import User from '../../user/user.model';
import ErrorResponse from '../../../utils/errorResponse';

jest.mock('../turf.model');
jest.mock('../../organization/organization.model');
jest.mock('../../turf-review/turf-review.model');
jest.mock('../../user/user.model');
jest.mock('../../../utils/cloudinary', () => ({
  uploadImage: jest.fn().mockResolvedValue({ url: 'mock-url' }),
  deleteImage: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../../utils/extractUrl', () => ({
  extractPublicIdFromUrl: jest.fn().mockReturnValue('mock-public-id'),
}));
jest.mock('../../sports/sports.service');
jest.mock('../../team_size/team_size.service');

describe('TurfService', () => {
  let turfService: TurfService;

  beforeEach(() => {
    turfService = new TurfService();
    jest.clearAllMocks();
  });

  describe('createTurf', () => {
    it('should create a turf successfully', async () => {
      const turfData = {
        name: 'Test Turf',
        sports: ['Football'],
        team_size: 5,
        organization: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      };
      (Turf.findOne as any).mockResolvedValue(null);
      (Turf.prototype.save as any) = jest.fn().mockResolvedValue({ _id: 'turfId', ...turfData, images: ['mock-url'] });
      (Organization.findByIdAndUpdate as any).mockResolvedValue({});
      jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
        abortTransaction: jest.fn(),
      } as any);

      const result = await turfService.createTurf(turfData, [{ buffer: Buffer.from('img') } as any]);
      expect(result).toHaveProperty('name', 'Test Turf');
      expect(Turf.prototype.save).toHaveBeenCalled();
      expect(Organization.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw error if turf with same name exists', async () => {
      const turfData = {
        name: 'Test Turf',
        sports: ['Football'],
        team_size: 5,
        organization: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      };
      (Turf.findOne as any).mockResolvedValue({ _id: 'existing' });
      jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      } as any);

      await expect(turfService.createTurf(turfData)).rejects.toThrow(ErrorResponse);
    });

    it('should handle errors and abort transaction', async () => {
      const turfData = {
        name: 'Test Turf',
        sports: ['Football'],
        team_size: 5,
        organization: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      };
      (Turf.findOne as any).mockImplementation(() => { throw new Error('DB error'); });
      jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      } as any);

      await expect(turfService.createTurf(turfData)).rejects.toThrow(ErrorResponse);
    });
  });

  describe('getTurfs', () => {
    it('should return all turfs', async () => {
      (Turf.find as any).mockResolvedValue([{ name: 'Turf1' }]);
      const result = await turfService.getTurfs();
      expect(result).toEqual([{ name: 'Turf1' }]);
    });
  });

  describe('getTurfById', () => {
    it('should return turf by id', async () => {
      (Turf.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'id', name: 'Turf1' }),
      });
      const result = await turfService.getTurfById('id');
      expect(result).toHaveProperty('name', 'Turf1');
    });
  });

  describe('updateTurf', () => {
    it('should update a turf successfully', async () => {
      const turf = { _id: 'id', name: 'Old', organization: 'org', images: [] };
      (Turf.findById as any).mockResolvedValue(turf);
      (Turf.findByIdAndUpdate as any).mockResolvedValue({ _id: 'id', name: 'New' });

      const result = await turfService.updateTurf('id', { name: 'New' });
      expect(result).toHaveProperty('name', 'New');
    });

    it('should throw error if turf not found', async () => {
      (Turf.findById as any).mockResolvedValue(null);
      await expect(turfService.updateTurf('id', { name: 'New' })).rejects.toThrow(ErrorResponse);
    });

    it('should throw error if organization is changed', async () => {
      const turf = {
        _id: 'id',
        name: 'Old',
        organization: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        images: [],
      };
      (Turf.findById as any).mockResolvedValue(turf);
      await expect(
        turfService.updateTurf('id', { organization: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012') })
      ).rejects.toThrow(ErrorResponse);
    });
  });

  describe('deleteTurf', () => {
    it('should delete turf and associated reviews', async () => {
      const turf = { _id: 'id', name: 'Turf', organization: 'org', images: ['img1'], reviews: ['r1'] };
      (Turf.findById as any).mockResolvedValue(turf);
      (TurfReview.find as any).mockResolvedValue([{ _id: 'r1', user: 'u', images: ['img2'] }]);
      (User.findByIdAndUpdate as any).mockResolvedValue({});
      (TurfReview.deleteMany as any).mockReturnValue({ session: () => Promise.resolve() });
      (Organization.findByIdAndUpdate as any).mockReturnValue({ session: () => Promise.resolve() });
      (Turf.findByIdAndDelete as any).mockReturnValue({ session: () => Promise.resolve(turf) });
      jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
        abortTransaction: jest.fn(),
      } as any);

      const result = await turfService.deleteTurf('id');
      expect(result).toHaveProperty('name', 'Turf');
      expect(TurfReview.deleteMany).toHaveBeenCalled();
      expect(Turf.findByIdAndDelete).toHaveBeenCalled();
    });

    it('should return null if turf not found', async () => {
      (Turf.findById as any).mockResolvedValue(null);
      jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      } as any);

      const result = await turfService.deleteTurf('id');
      expect(result).toBeNull();
    });

    it('should handle errors and abort transaction', async () => {
      (Turf.findById as any).mockImplementation(() => { throw new Error('DB error'); });
      jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      } as any);

      await expect(turfService.deleteTurf('id')).rejects.toThrow(ErrorResponse);
    });
  });

  describe('filterTurfs', () => {
    it('should filter turfs and return paginated results', async () => {
      (Turf.find as any).mockReturnValue({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              exec: jest.fn().mockResolvedValue([{ name: 'Turf1' }]),
            }),
          }),
        }),
      });
      (Turf.countDocuments as any).mockResolvedValue(1);

      const result = await turfService.filterTurfs({ page: '1', limit: '1' });
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count', 1);
      expect(result).toHaveProperty('data');
      expect(result.pagination).toHaveProperty('totalPages');
    });

    it('should handle errors', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (Turf.find as any).mockImplementation(() => { throw new Error('DB error'); });

      await expect(turfService.filterTurfs({})).rejects.toThrow(ErrorResponse);
    });
  });

  describe('getTurfsByOrganizationId', () => {
    it('should return turfs for an organization', async () => {
      (Organization.findById as any).mockResolvedValue({ _id: 'org' });
      (Turf.find as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue([{ _id: 'turf1' }]),
      });

      const result = await turfService.getTurfsByOrganizationId('org');
      expect(result).toEqual([{ _id: 'turf1' }]);
    });

    it('should throw error if organization not found', async () => {
      (Organization.findById as any).mockResolvedValue(null);
      await expect(turfService.getTurfsByOrganizationId('org')).rejects.toThrow(ErrorResponse);
    });
  });

  describe('checkTurfStatus', () => {
    it('should return status for open turf', async () => {
      const turf = {
        _id: 'id',
        operatingHours: [{ day: new Date().getDay(), open: '00:00', close: '23:59' }],
      };
      (Turf.findById as any).mockResolvedValue(turf);

      const result = await turfService.checkTurfStatus('id');
      expect(result).toHaveProperty('isOpen');
    });

    it('should throw error if turf not found', async () => {
      (Turf.findById as any).mockResolvedValue(null);
      await expect(turfService.checkTurfStatus('id')).rejects.toThrow(ErrorResponse);
    });
  });
});