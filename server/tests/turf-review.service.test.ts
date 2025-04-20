import TurfReviewService from '../modules/turf-review/turf-review.service';
import { TurfReview } from '../modules/turf-review/turf-review.model';
import { Turf } from '../modules/turf/turf.model';
import User from '../modules/user/user.model';
import mongoose from 'mongoose';
import * as cloudinaryUtils from '../utils/cloudinary';

// Mock the cloudinary upload and delete functions
jest.mock('../utils/cloudinary', () => ({
  uploadImage: jest.fn().mockResolvedValue({ url: 'https://mocked-cloudinary-url.com/image.jpg' }),
  deleteImage: jest.fn().mockResolvedValue({ result: 'ok' })
}));

// Mock the extract public ID function
jest.mock('../utils/extractUrl', () => ({
  extractPublicIdFromUrl: jest.fn().mockReturnValue('public-id')
}));

describe('TurfReviewService', () => {
  let turfReviewService: TurfReviewService;
  
  beforeEach(() => {
    turfReviewService = new TurfReviewService();
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    it('should create a new review without images', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();
      const reviewId = new mongoose.Types.ObjectId();

      // Mock user and turf existence
      jest.spyOn(User, 'exists').mockResolvedValueOnce({ _id: userId });
      jest.spyOn(Turf, 'exists').mockResolvedValueOnce({ _id: turfId });
      
      // Mock TurfReview.findOne to return null (no existing review)
      jest.spyOn(TurfReview, 'findOne').mockResolvedValueOnce(null);

      const mockSavedReview = {
        _id: reviewId,
        turf: turfId,
        user: userId,
        rating: 5,
        review: 'Great turf!',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(TurfReview.prototype, 'save').mockResolvedValueOnce(mockSavedReview);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);
      jest.spyOn(Turf, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);

      const reviewData = {
        turfId,
        userId,
        rating: 5,
        review: 'Great turf!'
      };

      const result = await turfReviewService.createReview(reviewData);

      expect(result).toEqual(mockSavedReview);
      expect(TurfReview.prototype.save).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $push: { reviews: reviewId }
      });
      expect(Turf.findByIdAndUpdate).toHaveBeenCalledWith(turfId, {
        $push: { reviews: reviewId }
      });
      // Verify cloudinary upload was not called
      expect(cloudinaryUtils.uploadImage).not.toHaveBeenCalled();
    });

    it('should create a new review with images', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();
      const reviewId = new mongoose.Types.ObjectId();

      // Mock user and turf existence
      jest.spyOn(User, 'exists').mockResolvedValueOnce({ _id: userId });
      jest.spyOn(Turf, 'exists').mockResolvedValueOnce({ _id: turfId });
      
      // Mock TurfReview.findOne to return null (no existing review)
      jest.spyOn(TurfReview, 'findOne').mockResolvedValueOnce(null);

      // Mock Multer files
      const mockFiles = [
        { 
          fieldname: 'images', 
          originalname: 'image1.jpg',
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg'
        },
        {
          fieldname: 'images',
          originalname: 'image2.jpg',
          buffer: Buffer.from('test2'),
          mimetype: 'image/jpeg'
        }
      ] as unknown as Express.Multer.File[];

      const mockSavedReview = {
        _id: reviewId,
        turf: turfId,
        user: userId,
        rating: 5,
        review: 'Great turf!',
        images: [
          'https://mocked-cloudinary-url.com/image.jpg',
          'https://mocked-cloudinary-url.com/image.jpg'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(TurfReview.prototype, 'save').mockResolvedValueOnce(mockSavedReview);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);
      jest.spyOn(Turf, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);

      const reviewData = {
        turfId,
        userId,
        rating: 5,
        review: 'Great turf!',
        images: mockFiles
      };

      const result = await turfReviewService.createReview(reviewData);

      expect(result).toEqual(mockSavedReview);
      expect(cloudinaryUtils.uploadImage).toHaveBeenCalledTimes(2);
      expect(TurfReview.prototype.save).toHaveBeenCalled();
    });

    it('should throw error if user does not exist', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(User, 'exists').mockResolvedValueOnce(null);

      const reviewData = {
        turfId,
        userId,
        rating: 5,
        review: 'Great turf!'
      };

      await expect(turfReviewService.createReview(reviewData)).rejects.toThrow('User not found');
    });

    it('should throw error if turf does not exist', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(User, 'exists').mockResolvedValueOnce({ _id: userId });
      jest.spyOn(Turf, 'exists').mockResolvedValueOnce(null);

      const reviewData = {
        turfId,
        userId,
        rating: 5,
        review: 'Great turf!'
      };

      await expect(turfReviewService.createReview(reviewData)).rejects.toThrow('Turf not found');
    });

    it('should throw error if user already reviewed the turf', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(User, 'exists').mockResolvedValueOnce({ _id: userId });
      jest.spyOn(Turf, 'exists').mockResolvedValueOnce({ _id: turfId });
      
      // Mock TurfReview.findOne to return existing review
      jest.spyOn(TurfReview, 'findOne').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        turf: turfId,
        user: userId
      } as any);

      const reviewData = {
        turfId,
        userId,
        rating: 5,
        review: 'Great turf!'
      };

      await expect(turfReviewService.createReview(reviewData)).rejects.toThrow('User has already reviewed this turf');
    });
  });

  describe('updateReview', () => {
    it('should update a review without images', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      const mockReview = {
        _id: reviewId,
        turf: turfId,
        user: userId,
        rating: 4,
        review: 'Old review',
        images: []
      };

      jest.spyOn(TurfReview, 'findOne').mockResolvedValueOnce(mockReview as any);
      
      const updatedReview = {
        ...mockReview,
        rating: 5,
        review: 'Updated review'
      };
      
      jest.spyOn(TurfReview, 'findByIdAndUpdate').mockResolvedValueOnce(updatedReview as any);

      const result = await turfReviewService.updateReview(reviewId, userId, {
        rating: 5,
        review: 'Updated review'
      });

      expect(result).toEqual(updatedReview);
      expect(TurfReview.findByIdAndUpdate).toHaveBeenCalledWith(
        reviewId,
        { $set: { rating: 5, review: 'Updated review' } },
        { new: true, runValidators: true }
      );
    });

    it('should update a review with new images', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      const mockReview = {
        _id: reviewId,
        turf: turfId,
        user: userId,
        rating: 4,
        review: 'Old review',
        images: ['https://old-image-url.com/image.jpg']
      };

      jest.spyOn(TurfReview, 'findOne').mockResolvedValueOnce(mockReview as any);
      
      // Mock Multer files
      const mockFiles = [
        { 
          fieldname: 'images', 
          originalname: 'new-image.jpg',
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg'
        }
      ] as unknown as Express.Multer.File[];

      const updatedReview = {
        ...mockReview,
        rating: 5,
        review: 'Updated review',
        images: ['https://mocked-cloudinary-url.com/image.jpg']
      };
      
      jest.spyOn(TurfReview, 'findByIdAndUpdate').mockResolvedValueOnce(updatedReview as any);

      const result = await turfReviewService.updateReview(reviewId, userId, {
        rating: 5,
        review: 'Updated review',
        images: mockFiles
      });

      expect(result).toEqual(updatedReview);
      expect(cloudinaryUtils.uploadImage).toHaveBeenCalledTimes(1);
      expect(cloudinaryUtils.deleteImage).toHaveBeenCalledTimes(1);
    });

    it('should throw error if review not found', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(TurfReview, 'findOne').mockResolvedValueOnce(null);

      await expect(turfReviewService.updateReview(reviewId, userId, { rating: 5 }))
        .rejects.toThrow('Review not found or user not authorized');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      const mockReview = {
        _id: reviewId,
        turf: turfId,
        user: userId,
        images: [],
        deleteOne: jest.fn().mockResolvedValueOnce({})
      };

      jest.spyOn(TurfReview, 'findById').mockResolvedValueOnce(mockReview as any);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);
      jest.spyOn(Turf, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);

      const result = await turfReviewService.deleteReview(reviewId, userId);

      expect(result).toBe(true);
      expect(mockReview.deleteOne).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $pull: { reviews: reviewId }
      });
      expect(Turf.findByIdAndUpdate).toHaveBeenCalledWith(turfId, {
        $pull: { reviews: reviewId }
      });
    });

    it('should delete images when deleting a review', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      const mockReview = {
        _id: reviewId,
        turf: turfId,
        user: userId,
        images: ['https://cloudinary-url.com/image1.jpg', 'https://cloudinary-url.com/image2.jpg'],
        deleteOne: jest.fn().mockResolvedValueOnce({})
      };

      jest.spyOn(TurfReview, 'findById').mockResolvedValueOnce(mockReview as any);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);
      jest.spyOn(Turf, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);

      const result = await turfReviewService.deleteReview(reviewId, userId);

      expect(result).toBe(true);
      expect(cloudinaryUtils.deleteImage).toHaveBeenCalledTimes(2);
    });

    it('should throw error if review not found', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(TurfReview, 'findById').mockResolvedValueOnce(null);

      await expect(turfReviewService.deleteReview(reviewId, userId))
        .rejects.toThrow('Review not found');
    });

    it('should throw error if user is not authorized', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const differentUserId = new mongoose.Types.ObjectId().toString();

      const mockReview = {
        _id: reviewId,
        turf: new mongoose.Types.ObjectId().toString(),
        user: differentUserId // Different from the userId trying to delete
      };

      jest.spyOn(TurfReview, 'findById').mockResolvedValueOnce(mockReview as any);

      await expect(turfReviewService.deleteReview(reviewId, userId))
        .rejects.toThrow('You are not authorized to delete this review');
    });
  });

  describe('getReviewsByTurf', () => {
    it('should get reviews for a specific turf', async () => {
      const turfId = new mongoose.Types.ObjectId().toString();
      
      const mockReviews = [
        { _id: new mongoose.Types.ObjectId(), rating: 5, review: 'Great!' },
        { _id: new mongoose.Types.ObjectId(), rating: 4, review: 'Good!' }
      ];
      
      jest.spyOn(TurfReview, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockReviews)
              })
            })
          })
        })
      } as any);
      
      jest.spyOn(TurfReview, 'countDocuments').mockResolvedValueOnce(2);
      
      jest.spyOn(TurfReview, 'aggregate').mockResolvedValueOnce([
        { _id: 5, count: 1 },
        { _id: 4, count: 1 }
      ]);

      const result = await turfReviewService.getReviewsByTurf(turfId);

      expect(result.reviews).toEqual(mockReviews);
      expect(result.total).toBe(2);
      expect(result.averageRating).toBe(4.5); // (5*1 + 4*1) / 2
      expect(result.ratingDistribution).toEqual({ 5: 1, 4: 1 });
    });
  });

  describe('getReviewById', () => {
    it('should get a review by ID', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      
      const mockReview = {
        _id: reviewId,
        rating: 5,
        review: 'Excellent!'
      };
      
      jest.spyOn(TurfReview, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReview)
          })
        })
      } as any);

      const result = await turfReviewService.getReviewById(reviewId);

      expect(result).toEqual(mockReview);
    });
  });

  describe('getTurfReviewSummary', () => {
    it('should get review summary for a turf', async () => {
      const turfId = new mongoose.Types.ObjectId().toString();
      
      const mockAggregateResult = [
        { _id: turfId, averageRating: 4.5, reviewCount: 10 }
      ];
      
      jest.spyOn(TurfReview, 'aggregate').mockResolvedValueOnce(mockAggregateResult);

      const result = await turfReviewService.getTurfReviewSummary(turfId);

      expect(result).toEqual({ _id: turfId, averageRating: 4.5, reviewCount: 10 });
    });

    it('should return default values if no reviews found', async () => {
      const turfId = new mongoose.Types.ObjectId().toString();
      
      jest.spyOn(TurfReview, 'aggregate').mockResolvedValueOnce([]);

      const result = await turfReviewService.getTurfReviewSummary(turfId);

      expect(result).toEqual({ averageRating: 0, reviewCount: 0 });
    });
  });

  describe('getReviewsByUser', () => {
    it('should get reviews for a specific user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      
      const mockReviews = [
        { _id: new mongoose.Types.ObjectId(), rating: 5, review: 'Great!' },
        { _id: new mongoose.Types.ObjectId(), rating: 3, review: 'Average' }
      ];
      
      jest.spyOn(TurfReview, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockReviews)
              })
            })
          })
        })
      } as any);
      
      jest.spyOn(TurfReview, 'countDocuments').mockResolvedValueOnce(2);
      
      jest.spyOn(TurfReview, 'aggregate').mockResolvedValueOnce([
        { _id: 5, count: 1 },
        { _id: 3, count: 1 }
      ]);

      const result = await turfReviewService.getReviewsByUser(userId);

      expect(result.reviews).toEqual(mockReviews);
      expect(result.total).toBe(2);
      expect(result.averageRating).toBe(4); // (5*1 + 3*1) / 2
      expect(result.ratingDistribution).toEqual({ 5: 1, 3: 1 });
    });
  });
});