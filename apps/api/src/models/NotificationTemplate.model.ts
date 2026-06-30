import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationTemplate extends Document {
  companyId: string;
  code: string; // e.g. 'leave_applied'
  name: string;
  module: string; // e.g. 'leave'
  channels: {
    email?: {
      subject: string;
      body: string;
    };
    inApp: {
      title: string;
      body: string;
    };
    sms?: {
      body: string;
    };
  };
  variables: string[]; // e.g. ['{{employee_name}}', '{{leave_type}}']
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    companyId: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    module: { type: String, required: true },
    channels: {
      email: {
        subject: { type: String },
        body: { type: String }
      },
      inApp: {
        title: { type: String, required: true },
        body: { type: String, required: true }
      },
      sms: {
        body: { type: String }
      }
    },
    variables: [{ type: String }]
  },
  { timestamps: true }
);

NotificationTemplateSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const NotificationTemplate: Model<INotificationTemplate> = mongoose.model<INotificationTemplate>(
  'NotificationTemplate',
  NotificationTemplateSchema
);
