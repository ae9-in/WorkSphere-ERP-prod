import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  type: string;
  title: string;
  message: string;
  read: boolean;
  url?: string;
  recipientId?: string;
  companyId:    string;
  actor?: {
    name:   string;
    photo?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: [
        'approval_request', 'approval_granted', 'approval_rejected',
        'payroll_processed', 'attendance_regularization', 'onboarding_task',
        'offboarding_task', 'document_uploaded', 'birthday', 'anniversary', 'system',
      ],
      required: true,
    },
    title:       { type: String, required: true },
    message:     { type: String, required: true },
    read:        { type: Boolean, default: false },
    url:         { type: String },
    recipientId: { type: String },
    companyId:   { type: String, required: true, default: 'company_01' },
    actor: {
      name:  { type: String },
      photo: { type: String },
    },
  },
  { timestamps: true }
);

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);
