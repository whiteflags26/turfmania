import { ITurf, Turf } from './turf.model';

export default class TurfService {
  async createTurf(turfData: Partial<ITurf>): Promise<ITurf> {
    const turf = new Turf(turfData);
    return await turf.save();
  }
}
