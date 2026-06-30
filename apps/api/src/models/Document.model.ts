import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDocument extends Document {
  companyId: string;
  employeeId?: string; // Optional - if associated with a specific employee
  category: 'employee' | 'company' | 'policy' | 'payslip' | 'offer' | 'other';
  type: string; // e.g. 'pdf', 'png'
  name: string;
  version: number;
  url: string;
  size: number;
  mimeType: string;
  expiryDate?: Date;
  isExpired: boolean;
  uploadedBy: string;
  uploadedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  accessRoles?: string[]; // e.g. ['employee', 'hr_head', 'company_admin']
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    companyId: { type: String, required: true },
    employeeId: { type: String },
    category: {
      type: String,
      enum: ['employee', 'company', 'policy', 'payslip', 'offer', 'other'],
      required: true
    },
    type: { type: String, required: true },
    name: { type: String, required: true },
    version: { type: Number, default: 1 },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    expiryDate: { type: Date },
    isExpired: { type: Boolean, default: false },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    accessRoles: [{ type: String }]
  },
  { timestamps: true }
);

DocumentSchema.index({ companyId: 1, category: 1 });
DocumentSchema.index({ companyId: 1, employeeId: 1 });

export const DocumentModel: Model<IDocument> = mongoose.model<IDocument>('Document', DocumentSchema);
export default DocumentModel;
