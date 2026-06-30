import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApproval extends Document {
  employeeId:   string;
  companyId:    string;
  fullName:     string;
  type:         'Leave Request' | 'Attendance Regularization' | 'Expense Claim';
  details:      string;
  status:       'pending' | 'approved' | 'rejected';
  dateRange?:   string;
  amount?:      string;
  requestedAt:  Date;
  resolvedAt?:  Date;
  createdAt:    Date;
  updatedAt:    Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    employeeId:  { type: String, required: true },
    companyId:   { type: String, required: true, default: 'company_01' },
    fullName:    { type: String, required: true },
    type: {
      type:     String,
      enum:     ['Leave Request', 'Attendance Regularization', 'Expense Claim'],
      required: true,
    },
    details:     { type: String, required: true },
    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    dateRange:   { type: String },
    amount:      { type: String },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt:  { type: Date },
  },
  { timestamps: true }
);

export const Approval: Model<IApproval> = mongoose.model<IApproval>('Approval', ApprovalSchema);
