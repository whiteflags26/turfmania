import mongoose from 'mongoose';
import slugify from 'slugify';
import geocoder from '../../utils/nodeGeocoder';

// Interface for Turf Location
interface ILocation {
  type: string;
  coordinates: [number, number];
  formattedAddress?: string;
  street?: string;
  city?: string;
  zipcode?: string;
  country?: string;
}

// Interface for Turf Document
interface ITurf extends mongoose.Document {
  name: string;
  slug: string;
  description: string;

  phone?: string;

  address: string;
  location?: ILocation;
  owner: mongoose.Types.ObjectId;
  userRoles: Array<{
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'manager' | 'stuff';
  }>;
  permissions: Map<string, string[]>;
  createdAt: Date;
}

// Turf Schema Definition
const TurfSchema = new mongoose.Schema<ITurf>({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },

  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
  },

  address: {
    type: String,
    required: [true, 'Please add an address'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
    },
    formattedAddress: String,
    street: String,
    city: String,
    zipcode: String,
    country: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userRoles: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['owner', 'manager', 'stuff'],
        required: true,
      },
    },
  ],
  permissions: {
    type: Map,
    of: [String],
    default: () => new Map(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate slug from name
TurfSchema.pre<ITurf>('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Create location from address
TurfSchema.pre<ITurf>('save', async function (next) {
  try {
    const loc = await geocoder.geocode(this.address);
    if (loc.length === 0 || !loc[0].longitude || !loc[0].latitude) {
      throw new Error('Invalid address or coordinates not found');
    }

    this.location = {
      type: 'Point',
      coordinates: [loc[0].longitude, loc[0].latitude] as [number, number],
      formattedAddress: loc[0].formattedAddress,
      street: loc[0].streetName,
      city: loc[0].city,
      zipcode: loc[0].zipcode,
      country: loc[0].countryCode,
    };

    // Remove original address from DB
    // @ts-ignore: Intentionally removing required field after processing
    this.address = undefined;
    next();
  } catch (err) {
    next(err as Error);
  }
});

const Turf = mongoose.model<ITurf>('Turf', TurfSchema);

export default Turf;
