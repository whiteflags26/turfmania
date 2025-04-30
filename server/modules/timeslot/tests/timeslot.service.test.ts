import mongoose from 'mongoose';
import TimeSlotService from '../timeslot.service';
import { TimeSlot } from '../timeslot.model';
import { Turf } from '../../turf/turf.model';

jest.mock('../timeslot.model');
jest.mock('../../turf/turf.model');

describe('TimeSlotService', () => {
  let service: TimeSlotService;

  beforeEach(() => {
    service = new TimeSlotService();
    jest.clearAllMocks();
  });

  describe('generateTimeSlots', () => {
    it('should throw error if turf not found', async () => {
      (Turf.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        service.generateTimeSlots('tid', new Date(), new Date(), 60)
      ).rejects.toThrow('Turf not found');
    });

    it('should throw error if slots already exist', async () => {
      (Turf.findById as jest.Mock).mockResolvedValue({ operatingHours: [{ day: 1, open: '08:00', close: '20:00' }] });
      (TimeSlot.find as jest.Mock).mockResolvedValue([{}]);
      await expect(
        service.generateTimeSlots('tid', new Date(), new Date(), 60)
      ).rejects.toThrow(/Timeslots already exist/);
    });

    it('should create slots if none exist', async () => {
      const startDate = new Date('2024-05-01T00:00:00Z');
      const endDate = new Date('2024-05-01T23:59:59Z');
      (Turf.findById as jest.Mock).mockResolvedValue({
        operatingHours: [{ day: startDate.getDay(), open: '08:00', close: '10:00' }]
      });

      // Mock .find to simulate no slots exist, then after insert, return the inserted slots
      const mockSort = jest.fn().mockResolvedValue([{ _id: 'slot1' }]);
      (TimeSlot.find as jest.Mock)
        .mockReturnValueOnce({ sort: jest.fn().mockResolvedValue([]) }) // check for existing slots
        .mockReturnValueOnce({ sort: mockSort }); // fetch after insert

      (TimeSlot.insertMany as jest.Mock).mockResolvedValue([{ _id: 'slot1' }]);
      jest.spyOn(require('mongoose').Types, 'ObjectId').mockImplementation((...args: unknown[]) => args[0]);
      const result = await service.generateTimeSlots('tid', startDate, endDate, 60);
      expect(TimeSlot.insertMany).toHaveBeenCalled();
      expect(result).toEqual([{ _id: 'slot1' }]);
      jest.restoreAllMocks();
    });

    it('should not create slots if no operating hours', async () => {
      const startDate = new Date('2024-05-01T00:00:00Z');
      const endDate = new Date('2024-05-01T23:59:59Z');
      (Turf.findById as jest.Mock).mockResolvedValue({ operatingHours: [] });
      (TimeSlot.find as jest.Mock).mockImplementation(() => ({
        sort: jest.fn().mockResolvedValue([]),
      }));
      (TimeSlot.insertMany as jest.Mock).mockResolvedValue([]);
      const result = await service.generateTimeSlots('tid', startDate, endDate, 60);
      expect(TimeSlot.insertMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getTimeSlots', () => {
    it('should return slots sorted by start_time', async () => {
      const mockSort = jest.fn().mockResolvedValue(['slot']);
      (TimeSlot.find as jest.Mock).mockReturnValue({ sort: mockSort });
      const result = await service.getTimeSlots({ turf: 'tid' });
      expect(TimeSlot.find).toHaveBeenCalledWith({ turf: 'tid' });
      expect(mockSort).toHaveBeenCalledWith('start_time');
      expect(result).toEqual(['slot']);
    });

    it('should handle .find not returning a query object', async () => {
      (TimeSlot.find as jest.Mock).mockReturnValueOnce({}); // no .sort
      await expect(service.getTimeSlots({ turf: 'tid' })).rejects.toThrow();
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should return available slots for turf and date', async () => {
      const mockSort = jest.fn().mockResolvedValue(['slot']);
      (TimeSlot.find as jest.Mock).mockReturnValue({ sort: mockSort });
      const result = await service.getAvailableTimeSlots('tid', new Date());
      expect(mockSort).toHaveBeenCalledWith('start_time');
      expect(result).toEqual(['slot']);
    });

    it('should handle .find not returning a query object', async () => {
      (TimeSlot.find as jest.Mock).mockReturnValueOnce({});
      await expect(service.getAvailableTimeSlots('tid', new Date())).rejects.toThrow();
    });
  });

  describe('updateTimeSlot', () => {
    it('should update and return the slot', async () => {
      (TimeSlot.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: 'sid', is_available: false });
      const result = await service.updateTimeSlot('sid', { is_available: false });
      expect(result).toEqual({ _id: 'sid', is_available: false });
    });

    it('should return null if slot not found', async () => {
      (TimeSlot.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      const result = await service.updateTimeSlot('sid', { is_available: false });
      expect(result).toBeNull();
    });
  });

  describe('deleteTimeSlots', () => {
    it('should delete slots and return deletedCount', async () => {
      (TimeSlot.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
      const result = await service.deleteTimeSlots({ turf: 'tid' });
      expect(result).toEqual({ deletedCount: 2 });
    });

    it('should return 0 if deletedCount is undefined', async () => {
      (TimeSlot.deleteMany as jest.Mock).mockResolvedValue({});
      const result = await service.deleteTimeSlots({ turf: 'tid' });
      expect(result).toEqual({ deletedCount: 0 });
    });

    it('should handle deleteMany throwing error', async () => {
      (TimeSlot.deleteMany as jest.Mock).mockRejectedValue(new Error('delete error'));
      await expect(service.deleteTimeSlots({ turf: 'tid' })).rejects.toThrow('delete error');
    });
  });
});