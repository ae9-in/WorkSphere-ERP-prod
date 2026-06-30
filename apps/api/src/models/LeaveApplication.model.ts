import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveApplication extends Document {
  employeeId: string;
  companyId: string;
  leaveTypeId: mongoose.Types.ObjectId;
  from: Date;
  to: Date;
  days: number;
  halfDay?: boolean;
  halfDayType?: 'first_half' | 'second_half';
  reason: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn';
  workflowInstanceId?: mongoose.Types.ObjectId;
  attachmentUrls?: string[];
  appliedOn: Date;
  actionedBy?: string;
  actionedAt?: Date;
  comments?: Array<{
    userId: string;
    userName: string;
    comment: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveApplicationSchema = new Schema<ILeaveApplication>(
  {
    employeeId: { type: String, required: true },
    companyId: { type: String, required: true },
    leaveTypeId: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    days: { type: Number, required: true },
    halfDay: { type: Boolean, default: false },
    halfDayType: { type: String, enum: ['first_half', 'second_half'] },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'withdrawn'],
      default: 'pending'
    },
    workflowInstanceId: { type: Schema.Types.ObjectId, ref: 'WorkflowInstance' },
    attachmentUrls: [{ type: String }],
    appliedOn: { type: Date, default: Date.now },
    actionedBy: { type: String },
    actionedAt: { type: Date },
    comments: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

LeaveApplicationSchema.index({ employeeId: 1, companyId: 1 });
LeaveApplicationSchema.index({ companyId: 1, status: 1 });

export const LeaveApplication: Model<ILeaveApplication> = mongoose.model<ILeaveApplication>(
  'LeaveApplication',
  LeaveApplicationSchema
);
