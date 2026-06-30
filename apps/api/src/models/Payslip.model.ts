import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayslip extends Document {
  companyId: string;
  payrollRunId: mongoose.Types.ObjectId;
  employeeId: string;
  employeeSnapshot: {
    fullName: string;
    designation?: string;
    department?: string;
    pan?: string;
    pfNumber?: string;
  };
  payPeriod: {
    workingDays: number;
    presentDays: number;
    lopDays: number;
    overtimeHours: number;
  };
  earnings: Array<{
    code: string;
    name: string;
    amount: number;
  }>;
  deductions: Array<{
    code: string;
    name: string;
    amount: number;
  }>;
  totals: {
    gross: number;
    deductions: number;
    net: number;
    ctc: number;
  };
  ytd: {
    gross: number;
    deductions: number;
    net: number;
  };
  status: 'draft' | 'published';
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayslipSchema = new Schema<IPayslip>(
  {
    companyId: { type: String, required: true },
    payrollRunId: { type: Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
    employeeId: { type: String, required: true },
    employeeSnapshot: {
      fullName: { type: String, required: true },
      designation: { type: String },
      department: { type: String },
      pan: { type: String },
      pfNumber: { type: String }
    },
    payPeriod: {
      workingDays: { type: Number, required: true, default: 30 },
      presentDays: { type: Number, required: true, default: 30 },
      lopDays: { type: Number, required: true, default: 0 },
      overtimeHours: { type: Number, required: true, default: 0 }
    },
    earnings: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true }
      }
    ],
    deductions: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true }
      }
    ],
    totals: {
      gross: { type: Number, required: true },
      deductions: { type: Number, required: true },
      net: { type: Number, required: true },
      ctc: { type: Number, required: true }
    },
    ytd: {
      gross: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      net: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    pdfUrl: { type: String }
  },
  { timestamps: true }
);

PayslipSchema.index({ companyId: 1, payrollRunId: 1 });
PayslipSchema.index({ companyId: 1, employeeId: 1 });

export const Payslip: Model<IPayslip> = mongoose.model<IPayslip>('Payslip', PayslipSchema);
