import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOvertimeRecord extends Document {
  employeeId: string;
  companyId: string;
  date: Date;
  scheduledHours: number;
  actualHours: number;
  overtimeHours: number;
  rate: number; // e.g. multipliers like 1.5, 2.0
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  payrollRunId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OvertimeRecordSchema = new Schema<IOvertimeRecord>(
  {
    employeeId: { type: String, required: true },
    companyId: { type: String, required: true },
    date: { type: Date, required: true },
    scheduledHours: { type: Number, required: true },
    actualHours: { type: Number, required: true },
    overtimeHours: { type: Number, required: true },
    rate: { type: Number, default: 1.5 },
    amount: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
    payrollRunId: { type: Schema.Types.ObjectId, ref: 'PayrollRun' }
  },
  { timestamps: true }
);

OvertimeRecordSchema.index({ employeeId: 1, companyId: 1 });

export const OvertimeRecord: Model<IOvertimeRecord> = mongoose.model<IOvertimeRecord>(
  'OvertimeRecord',
  OvertimeRecordSchema
);
