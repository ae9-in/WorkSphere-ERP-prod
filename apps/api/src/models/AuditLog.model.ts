import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  companyId: string;
  userId: string;
  email: string;
  action: string; // e.g. 'EMPLOYEE_ONBOARDED'
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    companyId: { type: String, required: true },
    userId: { type: String, required: true },
    email: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ companyId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>(
  'AuditLog',
  AuditLogSchema
);
