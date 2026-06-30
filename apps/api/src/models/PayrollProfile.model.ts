import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayrollProfile extends Document {
  employeeId: string;
  companyId: string;
  ctc: number;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  uan?: string;
  pfEnabled: boolean;
  esiEnabled: boolean;
  professionalTax: boolean;
  tdsPercentage?: number;
  payrollGroup?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollProfileSchema = new Schema<IPayrollProfile>(
  {
    employeeId: { type: String, required: true, unique: true },
    companyId: { type: String, required: true },
    ctc: { type: Number, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
    uan: { type: String },
    pfEnabled: { type: Boolean, default: true },
    esiEnabled: { type: Boolean, default: false },
    professionalTax: { type: Boolean, default: true },
    tdsPercentage: { type: Number, default: 0 },
    payrollGroup: { type: String, default: 'Standard' },
  },
  { timestamps: true }
);

export const PayrollProfile: Model<IPayrollProfile> = mongoose.model<IPayrollProfile>(
  'PayrollProfile',
  PayrollProfileSchema
);
