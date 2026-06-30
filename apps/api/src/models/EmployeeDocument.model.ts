import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployeeDocument extends Document {
  employeeId: string;
  companyId: string;
  documentType: string; // 'aadhaar' | 'pan' | 'resume' | 'offer_letter' | etc.
  fileName: string;
  fileSize: number;
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: Date;
  verifiedAt?: Date;
}

const EmployeeDocumentSchema = new Schema<IEmployeeDocument>(
  {
    employeeId: { type: String, required: true },
    companyId: { type: String, required: true },
    documentType: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Enable fast query lookup per tenant candidates
EmployeeDocumentSchema.index({ employeeId: 1, companyId: 1 });

export const EmployeeDocument: Model<IEmployeeDocument> = mongoose.model<IEmployeeDocument>(
  'EmployeeDocument',
  EmployeeDocumentSchema
);
