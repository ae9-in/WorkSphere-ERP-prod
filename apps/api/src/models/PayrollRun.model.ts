import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayrollRun extends Document {
  companyId:        string;
  month:            number;
  year:             number;
  period:           string;
  status:           'draft' | 'processing' | 'completed' | 'approved' | 'paid' | 'cancelled';
  totalEmployees:   number;
  totalGross:       number;
  totalDeductions:  number;
  totalNetPay:      number;
  processedAt?:     Date;
  approvedAt?:      Date;
  paidAt?:          Date;
  createdBy:        string;
  createdAt:        Date;
  updatedAt:        Date;
}

const PayrollRunSchema = new Schema<IPayrollRun>(
  {
    companyId: { type: String, required: true, default: 'company_01' },
    month:  { type: Number, required: true, min: 1, max: 12 },
    year:   { type: Number, required: true },
    period: { type: String, required: true },
    status: {
      type:    String,
      enum:    ['draft', 'processing', 'completed', 'approved', 'paid', 'cancelled'],
      default: 'draft',
    },
    totalEmployees:  { type: Number, default: 0 },
    totalGross:      { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNetPay:     { type: Number, default: 0 },
    processedAt:     { type: Date },
    approvedAt:      { type: Date },
    paidAt:          { type: Date },
    createdBy:       { type: String, required: true },
  },
  { timestamps: true }
);

export const PayrollRun: Model<IPayrollRun> = mongoose.model<IPayrollRun>('PayrollRun', PayrollRunSchema);
