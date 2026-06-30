import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveType extends Document {
  companyId: string;
  name: string;
  code: string; // e.g., 'AL', 'SL', 'CL'
  isPaid: boolean;
  accrualBased: boolean;
  maxDays: number;
  carryForward: boolean;
  gender?: 'male' | 'female' | 'all';
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveTypeSchema = new Schema<ILeaveType>(
  {
    companyId: { type: String, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    isPaid: { type: Boolean, default: true },
    accrualBased: { type: Boolean, default: false },
    maxDays: { type: Number, required: true, default: 12 },
    carryForward: { type: Boolean, default: false },
    gender: { type: String, enum: ['male', 'female', 'all'], default: 'all' },
    requiresApproval: { type: Boolean, default: true }
  },
  { timestamps: true }
);

LeaveTypeSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const LeaveType: Model<ILeaveType> = mongoose.model<ILeaveType>('LeaveType', LeaveTypeSchema);
