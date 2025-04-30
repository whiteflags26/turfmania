import mongoose from 'mongoose';
import TurfReviewService from '../turf-review.service';
import { TurfReview } from '../turf-review.model';
import { Turf } from '../../turf/turf.model';
import User from '../../user/user.model';
import ErrorResponse from '../../../utils/errorResponse';

jest.mock('../turf-review.model');
jest.mock('../../turf/turf.model');
jest.mock('../../user/user.model');
jest.mock('../../../utils/cloudinary', () => ({
  uploadImage: jest.fn().mockResolvedValue({ url: 'mock-url' }),
  deleteImage: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../../utils/extractUrl', () => ({
  extractPublicIdFromUrl: jest.fn().mockReturnValue('mock-public-id'),
}));

describe('TurfReviewService', () => {
  let service: TurfReviewService;

  beforeEach(() => {
    service = new TurfReviewService();
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    it('should create a review successfully', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ _id: 'u', isVerified: true });
      (Turf.exists as any) = jest.fn().mockResolvedValue(true);
      (TurfReview.findOne as any) = jest.fn().mockResolvedValue(null);
      (TurfReview as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: 'r', turf: 't', user: 'u', rating: 5 }),
      }));
      (User.findByIdAndUpdate as any) = jest.fn().mockResolvedValue({});
      (Turf.findByIdAndUpdate as any) = jest.fn().mockResolvedValue({});

      const result = await service.createReview({
        turfId: 't',
        userId: 'u',
        rating: 5,
        review: 'Great!',
        images: [],
      });

      expect(result).toHaveProperty('rating', 5);
      expect(User.findById).toHaveBeenCalled();
      expect(Turf.exists).toHaveBeenCalled();
      expect(TurfReview.findOne).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue(null);
      await expect(service.createReview({
        turfId: 't', userId: 'u', rating: 5, review: '', images: [],
      })).rejects.toThrow(new ErrorResponse('User not found', 404));
    });

    it('should throw if user not verified', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ isVerified: false });
      await expect(service.createReview({
        turfId: 't', userId: 'u', rating: 5, review: '', images: [],
      })).rejects.toThrow(new ErrorResponse('User must be verified to create a review', 403));
    });

    it('should throw if turf not found', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ isVerified: true });
      (Turf.exists as any) = jest.fn().mockResolvedValue(false);
      await expect(service.createReview({
        turfId: 't', userId: 'u', rating: 5, review: '', images: [],
      })).rejects.toThrow(new ErrorResponse('Turf not found', 404));
    });

    it('should throw if review already exists', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ isVerified: true });
      (Turf.exists as any) = jest.fn().mockResolvedValue(true);
      (TurfReview.findOne as any) = jest.fn().mockResolvedValue({ _id: 'r' });
      await expect(service.createReview({
        turfId: 't', userId: 'u', rating: 5, review: '', images: [],
      })).rejects.toThrow(new ErrorResponse('User has already reviewed this turf', 400));
    });
  });

  describe('updateReview', () => {
    it('should update a review successfully', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ _id: 'u', isVerified: true });
      (TurfReview.findOne as any) = jest.fn().mockResolvedValue({ _id: 'r', user: 'u', images: [] });
      (TurfReview.findByIdAndUpdate as any) = jest.fn().mockResolvedValue({ _id: 'r', rating: 4 });

      const result = await service.updateReview('r', 'u', { rating: 4, review: 'Updated', images: [] });
      expect(result).toHaveProperty('rating', 4);
      expect(TurfReview.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue(null);
      await expect(service.updateReview('r', 'u', { rating: 4 })).rejects.toThrow(new ErrorResponse('User not found', 404));
    });

    it('should throw if user not verified', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ isVerified: false });
      await expect(service.updateReview('r', 'u', { rating: 4 })).rejects.toThrow(new ErrorResponse('User must be verified to update a review', 403));
    });

    it('should throw if review not found', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ isVerified: true });
      (TurfReview.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(service.updateReview('r', 'u', { rating: 4 })).rejects.toThrow(new ErrorResponse('Review not found or user not authorized', 404));
    });

    it('should throw if update fails', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ isVerified: true });
      (TurfReview.findOne as any) = jest.fn().mockResolvedValue({ _id: 'r', user: 'u', images: [] });
      (TurfReview.findByIdAndUpdate as any) = jest.fn().mockResolvedValue(null);
      await expect(service.updateReview('r', 'u', { rating: 4 })).rejects.toThrow(new ErrorResponse('Failed to update review', 500));
    });
  });

  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      (TurfReview.findById as any) = jest.fn().mockResolvedValue({
        _id: 'r', user: 'u', images: [], deleteOne: jest.fn().mockResolvedValue(true),
      });
      (User.findByIdAndUpdate as any) = jest.fn().mockResolvedValue({});
      (Turf.findByIdAndUpdate as any) = jest.fn().mockResolvedValue({});

      const result = await service.deleteReview('r', 'u');
      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
      expect(Turf.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw if review not found', async () => {
      (TurfReview.findById as any) = jest.fn().mockResolvedValue(null);
      await expect(service.deleteReview('r', 'u')).rejects.toThrow(new ErrorResponse('Review not found', 404));
    });

    it('should throw if user not authorized', async () => {
      (TurfReview.findById as any) = jest.fn().mockResolvedValue({ _id: 'r', user: 'other', images: [] });
      await expect(service.deleteReview('r', 'u')).rejects.toThrow(new ErrorResponse('You are not authorized to delete this review', 403));
    });
  });

  describe('getReviewsByTurf', () => {
    it('should return reviews summary for a turf', async () => {
      const validTurfId = '507f1f77bcf86cd799439011';
      (TurfReview.countDocuments as any) = jest.fn().mockResolvedValue(1);
      (TurfReview.aggregate as any) = jest.fn().mockResolvedValue([{ _id: 5, count: 1 }]);
      (TurfReview.find as any) = jest.fn().mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              populate: () => ({
                lean: jest.fn().mockResolvedValue([{ rating: 5 }]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getReviewsByTurf(validTurfId);
      expect(result).toHaveProperty('reviews');
      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('ratingDistribution');
    });
  });

  describe('hasUserReviewedTurf', () => {
    it('should return true if user has reviewed', async () => {
      (TurfReview.findOne as any) = jest.fn().mockResolvedValue({ _id: 'r' });
      const result = await service.hasUserReviewedTurf('u', 't');
      expect(result).toBe(true);
    });

    it('should return false if user has not reviewed', async () => {
      (TurfReview.findOne as any) = jest.fn().mockResolvedValue(null);
      const result = await service.hasUserReviewedTurf('u', 't');
      expect(result).toBe(false);
    });
  });
});