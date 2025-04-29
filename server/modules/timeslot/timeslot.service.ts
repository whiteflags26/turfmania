import mongoose from 'mongoose';
import { Turf } from '../turf/turf.model';
import { ITimeSlot, TimeSlot } from './timeslot.model';

export default class TimeSlotService {
  async generateTimeSlots(
    turfId: string,
    startDate: Date,
    endDate: Date,
    slotDuration: number = 60,
  ): Promise<ITimeSlot[]> {
    console.log('generating slots..');
    const turf = await Turf.findById(turfId);
    console.log(turf);
    if (!turf) throw new Error('Turf not found');

    const slots = [];
    const currentDate = new Date(startDate);
    console.log(currentDate);
    currentDate.setHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    while (currentDate <= endDateTime) {
      const dayOfWeek = currentDate.getDay();
      console.log(dayOfWeek);
      const operatingHours = turf.operatingHours.find(
        hours => Number(hours.day) === dayOfWeek,
      );
      console.log(operatingHours);

      if (operatingHours) {
        let [openHour, openMinute] = operatingHours.open.split(':').map(Number);
        let [closeHour, closeMinute] = operatingHours.close
          .split(':')
          .map(Number);

        const start = new Date(currentDate);
        start.setHours(openHour, openMinute, 0);

        const end = new Date(currentDate);
        end.setHours(closeHour, closeMinute, 0);

        while (start < end) {
          const slotEnd = new Date(start);
          slotEnd.setMinutes(start.getMinutes() + slotDuration);

          if (slotEnd <= end) {
            slots.push({
              turf: new mongoose.Types.ObjectId(turfId),
              start_time: new Date(start),
              end_time: new Date(slotEnd),
              is_available: true,
            });
          }

          start.setMinutes(start.getMinutes() + slotDuration);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    // Use bulk operations for better performance
    if (slots.length > 0) {
      await TimeSlot.insertMany(slots);
    }

    return await this.getTimeSlots({
      turf: turfId,
      start_time: { $gte: startDate, $lte: endDateTime },
    });
  }
  async getTimeSlots(filters = {}): Promise<ITimeSlot[]> {
    return await TimeSlot.find(filters).sort('start_time');
  }
  async getAvailableTimeSlots(
    turfId: string,
    date: Date,
  ): Promise<ITimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await TimeSlot.find({
      turf: turfId,
      start_time: { $gte: startOfDay, $lte: endOfDay },
      is_available: true,
    }).sort('start_time');
  }

  async updateTimeSlot(
    id: string,
    updateData: Partial<ITimeSlot>,
  ): Promise<ITimeSlot | null> {
    return await TimeSlot.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteTimeSlots(filters = {}): Promise<{ deletedCount: number }> {
    const result = await TimeSlot.deleteMany(filters);
    return { deletedCount: result.deletedCount ?? 0 };
  }
}
