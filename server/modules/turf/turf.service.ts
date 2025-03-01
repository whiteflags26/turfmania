import { ITurf, Turf } from './turf.model';

export default class TurfService {
  async createTurf(turfData: Partial<ITurf>): Promise<ITurf> {
    const turf = new Turf(turfData);
    return await turf.save();
  }
  async getTurfs(filters = {}): Promise<ITurf[]> {
    return await Turf.find(filters);
  }
  async getTurfById(id: string): Promise<ITurf | null> {
    return await Turf.findById(id);
  }
  async updateTurf(
    id: string,
    updateData: Partial<ITurf>,
  ): Promise<ITurf | null> {
    return await Turf.findByIdAndUpdate(id, updateData, { new: true });
  }
  async deleteTurf(id: string): Promise<ITurf | null> {
    return await Turf.findByIdAndDelete(id);
  }
}
