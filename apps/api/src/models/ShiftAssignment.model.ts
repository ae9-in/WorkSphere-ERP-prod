import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShiftAssignment extends Document {
  employeeId: string;
  shiftId: mongoose.Types.ObjectId;
  from: Date;
  to: Date;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftAssignmentSchema = new Schema<IShiftAssignment>(
  {
    employeeId: { type: String, required: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    companyId: { type: String, required: true }
  },
  { timestamps: true }
);

ShiftAssignmentSchema.index({ employeeId: 1, companyId: 1 });

export const ShiftAssignment: Model<IShiftAssignment> = mongoose.model<IShiftAssignment>(
  'ShiftAssignment',
  ShiftAssignmentSchema
);
