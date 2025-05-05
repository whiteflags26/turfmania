import mongoose from 'mongoose';
import OrganizationRequestService from '../organization-request.service';
import OrganizationRequest from '../organization-request.model';
import User from '../../user/user.model';
import { uploadImage } from '../../../utils/cloudinary';
import ErrorResponse from '../../../utils/errorResponse';

jest.mock('../organization-request.model');
jest.mock('../../user/user.model');
jest.mock('../../../utils/cloudinary');

describe('OrganizationRequestService', () => {
  let service: OrganizationRequestService;

  beforeEach(() => {
    service = new OrganizationRequestService();
    jest.clearAllMocks();
  });

  describe('validateOwnerEmail', () => {
    it('returns true if user exists', async () => {
      (User.findOne as any).mockReturnValue({
        collation: jest.fn().mockResolvedValue({ email: 'owner@test.com' }),
      });
      const result = await service.validateOwnerEmail('owner@test.com');
      expect(result).toBe(true);
    });

    it('returns false for invalid email', async () => {
      const result = await service.validateOwnerEmail('not-an-email');
      expect(result).toBe(false);
    });

    it('returns false if user does not exist', async () => {
      (User.findOne as any).mockReturnValue({
        collation: jest.fn().mockResolvedValue(null),
      });
      const result = await service.validateOwnerEmail('owner@test.com');
      expect(result).toBe(false);
    });
  });

  describe('createRequest', () => {
    it('creates a new request with images', async () => {
      (OrganizationRequest.findOne as any).mockResolvedValue(null);
      (service as any).validateOwnerEmail = jest.fn().mockResolvedValue(true);
      (service.facilityService.validateFacilities as any) = jest.fn().mockResolvedValue(true);
      (uploadImage as any).mockResolvedValue({ url: 'img-url' });
      (OrganizationRequest.create as any).mockResolvedValue({ _id: 'reqid' });

      const req = await service.createRequest(
        'userid',
        {
          organizationName: 'Org',
          facilities: ['f1'],
          location: { place_id: '1', address: 'a', coordinates: { type: 'Point', coordinates: [0, 0] }, city: 'c' },
          contactPhone: '01712345678',
          ownerEmail: 'owner@test.com',
          orgContactPhone: '01712345678',
          orgContactEmail: 'org@test.com',
        },
        [{ buffer: Buffer.from(''), originalname: 'img.png' } as any]
      );
      expect(req).toBeDefined();
    });

    it('throws if request with same name exists', async () => {
      (OrganizationRequest.findOne as any).mockResolvedValue({ _id: 'exists' });
      await expect(service.createRequest(
        'userid',
        {
          organizationName: 'Org',
          facilities: ['f1'],
          location: { place_id: '1', address: 'a', coordinates: { type: 'Point', coordinates: [0, 0] }, city: 'c' },
          contactPhone: '01712345678',
          ownerEmail: 'owner@test.com',
          orgContactPhone: '01712345678',
          orgContactEmail: 'org@test.com',
        }
      )).rejects.toThrow(ErrorResponse);
    });

    it('throws if owner email does not exist', async () => {
      (OrganizationRequest.findOne as any).mockResolvedValue(null);
      (service as any).validateOwnerEmail = jest.fn().mockResolvedValue(false);
      await expect(service.createRequest(
        'userid',
        {
          organizationName: 'Org',
          facilities: ['f1'],
          location: { place_id: '1', address: 'a', coordinates: { type: 'Point', coordinates: [0, 0] }, city: 'c' },
          contactPhone: '01712345678',
          ownerEmail: 'owner@test.com',
          orgContactPhone: '01712345678',
          orgContactEmail: 'org@test.com',
        }
      )).rejects.toThrow(ErrorResponse);
    });
  });

  describe('getRequestById', () => {
    it('returns request if found', async () => {
      const mockRequest = { _id: new mongoose.Types.ObjectId().toString() };
      
      // Create a mock populate function that can be chained
      const mockPopulate = jest.fn();
      
      // Set up the chain by defining how mockPopulate behaves on each call
      mockPopulate
        .mockImplementationOnce(() => ({ populate: mockPopulate })) // first call returns object with populate
        .mockImplementationOnce(() => ({ populate: mockPopulate })) // second call returns object with populate
        .mockImplementationOnce(() => mockRequest); // third call returns the final result
      
      // Set up the findById mock to return an object with the first populate
      (OrganizationRequest.findById as any).mockReturnValue({
        populate: mockPopulate
      });

      const req = await service.getRequestById(mockRequest._id);
      expect(req).toBeDefined();
      expect(mockPopulate).toHaveBeenCalledTimes(3);
    });

    it('throws if not found', async () => {
      // Create a mock populate function that can be chained
      const mockPopulate = jest.fn();
      
      // Set up the chain but return null at the end
      mockPopulate
        .mockImplementationOnce(() => ({ populate: mockPopulate }))
        .mockImplementationOnce(() => ({ populate: mockPopulate }))
        .mockImplementationOnce(() => null);
      
      // Set up the findById mock to return an object with the first populate
      (OrganizationRequest.findById as any).mockReturnValue({
        populate: mockPopulate
      });

      await expect(
        service.getRequestById(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow(ErrorResponse);
      
      expect(mockPopulate).toHaveBeenCalledTimes(3);
    });
  });

  describe('startProcessing', () => {
    it('starts processing if status is pending', async () => {
      (OrganizationRequest.findById as any).mockResolvedValue({
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      });
      const req = await service.startProcessing(
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      );
      expect(req.status).toBe('processing');
    });

    it('throws if status is not pending', async () => {
      (OrganizationRequest.findById as any).mockResolvedValue({
        status: 'approved',
      });
      await expect(service.startProcessing(
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      )).rejects.toThrow(ErrorResponse);
    });
  });

  describe('cancelProcessing', () => {
    it('cancels processing if status is processing', async () => {
      (OrganizationRequest.findById as any).mockResolvedValue({
        status: 'processing',
        save: jest.fn().mockResolvedValue(true),
      });
      const req = await service.cancelProcessing(
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      );
      expect(req.status).toBe('pending');
    });

    it('throws if status is not processing', async () => {
      (OrganizationRequest.findById as any).mockResolvedValue({
        status: 'pending',
      });
    }); // <-- Add this line to close the 'it' block
  });   // <-- Add this line to close the 'describe' block for cancelProcessing

  

  describe('wasRequestDataEdited', () => {
      it('returns false if data matches', async () => {
          const mockRequest = {
              organizationName: 'Org',
              facilities: ['f1'],
              location: { place_id: '1', address: 'a', city: 'c', coordinates: { coordinates: [0, 0] } },
              orgContactPhone: '01712345678',
              orgContactEmail: 'org@test.com',
          };
          (service as any).getRequestById = jest.fn().mockResolvedValue(mockRequest);
          const result = await service.wasRequestDataEdited(
              'reqid',
              'Org',
              ['f1'],
              { place_id: '1', address: 'a', city: 'c', coordinates: { coordinates: [0, 0] } },
              '01712345678',
              'org@test.com'
          );
          expect(result).toBe(false);
      });

      it('returns true if organization name changed', async () => {
          const mockRequest = {
              organizationName: 'Org',
              facilities: ['f1'],
              location: { place_id: '1', address: 'a', city: 'c', coordinates: { coordinates: [0, 0] } },
              orgContactPhone: '01712345678',
              orgContactEmail: 'org@test.com',
          };
          (service as any).getRequestById = jest.fn().mockResolvedValue(mockRequest);
          const result = await service.wasRequestDataEdited(
              'reqid',
              'Org2',
              ['f1'],
              { place_id: '1', address: 'a', city: 'c', coordinates: { coordinates: [0, 0] } },
              '01712345678',
              'org@test.com'
          );
          expect(result).toBe(true);
      });

      it('throws if request not found', async () => {
          (service as any).getRequestById = jest.fn().mockRejectedValue(new ErrorResponse('not found', 404));
          await expect(
              service.wasRequestDataEdited('badid', 'Org', ['f1'], {}, '', '')
          ).rejects.toThrow(ErrorResponse);
      });
  });

  describe('rejectRequest', () => {
      it('rejects a pending request', async () => {
          const mockRequest = {
              status: 'pending',
              save: jest.fn().mockResolvedValue(true),
          };
          (OrganizationRequest.findById as any).mockResolvedValue(mockRequest);
          (service as any).notifyRequestProcessed = jest.fn().mockResolvedValue(undefined);
          const req = await service.rejectRequest('reqid', 'adminid', 'notes');
          expect(req.status).toBe('rejected');
          expect(mockRequest.save).toHaveBeenCalled();
      });

      it('throws if request not found', async () => {
          (OrganizationRequest.findById as any).mockResolvedValue(null);
          await expect(service.rejectRequest('badid', 'adminid', 'notes')).rejects.toThrow(ErrorResponse);
      });

      it('throws if request cannot be rejected', async () => {
          const mockRequest = { status: 'approved' };
          (OrganizationRequest.findById as any).mockResolvedValue(mockRequest);
          await expect(service.rejectRequest('reqid', 'adminid', 'notes')).rejects.toThrow(ErrorResponse);
      });
  });

  describe('getUserOrganizationRequests', () => {
      it('returns user requests', async () => {
          (OrganizationRequest.find as any).mockReturnValue({
              sort: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              lean: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId().toString() }]),
          });
          const reqs = await service.getUserOrganizationRequests(new mongoose.Types.ObjectId().toString());
          expect(reqs).toEqual(expect.any(Array));
      });

      it('throws for invalid user id', async () => {
          await expect(service.getUserOrganizationRequests('badid')).rejects.toThrow(ErrorResponse);
      });
  });

  describe('resetStuckProcessingRequests', () => {
      it('returns modifiedCount', async () => {
          (OrganizationRequest.updateMany as any).mockResolvedValue({ modifiedCount: 2 });
          const count = await service.resetStuckProcessingRequests(2);
          expect(count).toBe(2);
      });
  });
});
