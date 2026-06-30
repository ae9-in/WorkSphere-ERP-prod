import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAsset extends Document {
  companyId: string;
  category: 'laptop' | 'desktop' | 'phone' | 'sim' | 'access_card' | 'software' | 'other';
  name: string;
  assetTag: string;
  serialNumber: string;
  brand: string;
  modelName: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'lost';
  currentEmployeeId?: string;
  assignedAt?: Date;
  returnedAt?: Date;
  condition: 'new' | 'good' | 'fair' | 'damaged';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    companyId: { type: String, required: true },
    category: {
      type: String,
      enum: ['laptop', 'desktop', 'phone', 'sim', 'access_card', 'software', 'other'],
      required: true
    },
    name: { type: String, required: true },
    assetTag: { type: String, required: true },
    serialNumber: { type: String, required: true },
    brand: { type: String, required: true },
    modelName: { type: String, required: true },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number },
    warrantyExpiry: { type: Date },
    status: {
      type: String,
      enum: ['available', 'assigned', 'maintenance', 'retired', 'lost'],
      default: 'available'
    },
    currentEmployeeId: { type: String },
    assignedAt: { type: Date },
    returnedAt: { type: Date },
    condition: { type: String, enum: ['new', 'good', 'fair', 'damaged'], default: 'new' },
    notes: { type: String }
  },
  { timestamps: true }
);

AssetSchema.index({ companyId: 1, assetTag: 1 }, { unique: true });
AssetSchema.index({ companyId: 1, status: 1 });

export const Asset: Model<IAsset> = mongoose.model<IAsset>('Asset', AssetSchema);
