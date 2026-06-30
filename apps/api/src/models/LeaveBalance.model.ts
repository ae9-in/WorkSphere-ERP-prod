import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveBalance extends Document {
  employeeId: string;
  companyId: string;
  leaveTypeId: mongoose.Types.ObjectId;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employeeId: { type: String, required: true },
    companyId: { type: String, required: true },
    leaveTypeId: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    year: { type: Number, required: true },
    allocated: { type: Number, required: true, default: 0 },
    used: { type: Number, required: true, default: 0 },
    pending: { type: Number, required: true, default: 0 },
    available: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

LeaveBalanceSchema.index({ employeeId: 1, companyId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

export const LeaveBalance: Model<ILeaveBalance> = mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
