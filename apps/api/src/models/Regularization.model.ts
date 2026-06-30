import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegularization extends Document {
  employeeId: string;
  companyId: string;
  date: Date;
  inTime: string; // e.g. '09:00'
  outTime: string; // e.g. '18:00'
  reason: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  actionedBy?: string;
  actionedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RegularizationSchema = new Schema<IRegularization>(
  {
    employeeId: { type: String, required: true },
    companyId: { type: String, required: true },
    date: { type: Date, required: true },
    inTime: { type: String, required: true },
    outTime: { type: String, required: true },
    reason: { type: String, required: true },
    attachmentUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    actionedBy: { type: String },
    actionedAt: { type: Date }
  },
  { timestamps: true }
);

RegularizationSchema.index({ employeeId: 1, companyId: 1 });

export const Regularization: Model<IRegularization> = mongoose.model<IRegularization>(
  'Regularization',
  RegularizationSchema
);
