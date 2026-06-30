import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssetHistory extends Document {
  assetId: mongoose.Types.ObjectId;
  employeeId?: string;
  action: 'assigned' | 'returned' | 'maintenance' | 'retired' | 'lost';
  date: Date;
  condition: 'new' | 'good' | 'fair' | 'damaged';
  remarks?: string;
  by: string; // userId who logged it
  createdAt: Date;
  updatedAt: Date;
}

const AssetHistorySchema = new Schema<IAssetHistory>(
  {
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    employeeId: { type: String },
    action: {
      type: String,
      enum: ['assigned', 'returned', 'maintenance', 'retired', 'lost'],
      required: true
    },
    date: { type: Date, default: Date.now },
    condition: { type: String, enum: ['new', 'good', 'fair', 'damaged'], required: true },
    remarks: { type: String },
    by: { type: String, required: true }
  },
  { timestamps: true }
);

AssetHistorySchema.index({ assetId: 1 });

export const AssetHistory: Model<IAssetHistory> = mongoose.model<IAssetHistory>(
  'AssetHistory',
  AssetHistorySchema
);
