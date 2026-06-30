import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssetAssignment extends Document {
  employeeId: string;
  companyId: string;
  assetType: string; // 'laptop' | 'desktop' | 'sim' | 'software_license' | etc.
  assetName: string; // e.g. 'MacBook Pro 16', 'Slack License'
  serialNumber?: string;
  assignedAt: Date;
  status: 'assigned' | 'returned';
}

const AssetAssignmentSchema = new Schema<IAssetAssignment>(
  {
    employeeId: { type: String, required: true },
    companyId: { type: String, required: true },
    assetType: { type: String, required: true },
    assetName: { type: String, required: true },
    serialNumber: { type: String },
    assignedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['assigned', 'returned'],
      default: 'assigned',
    },
  },
  { timestamps: true }
);

AssetAssignmentSchema.index({ employeeId: 1, companyId: 1 });

export const AssetAssignment: Model<IAssetAssignment> = mongoose.model<IAssetAssignment>(
  'AssetAssignment',
  AssetAssignmentSchema
);
