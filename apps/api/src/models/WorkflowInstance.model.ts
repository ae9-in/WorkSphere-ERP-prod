import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowInstanceStep {
  stepNo: number;
  approverId?: string; // resolved actual user ID who needs to approve
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'delegated';
  actionedAt?: Date;
  comments?: string;
  attachments?: string[];
}

export interface IWorkflowInstance extends Document {
  companyId: string;
  definitionId: mongoose.Types.ObjectId;
  entityType: 'LeaveApplication' | 'PayrollRun' | 'AssetAssignment' | 'Regularization';
  entityId: string;
  initiatedBy: string;
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
  steps: IWorkflowInstanceStep[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowInstanceStepSchema = new Schema<IWorkflowInstanceStep>({
  stepNo: { type: Number, required: true },
  approverId: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'escalated', 'delegated'], default: 'pending' },
  actionedAt: { type: Date },
  comments: { type: String },
  attachments: [{ type: String }]
});

const WorkflowInstanceSchema = new Schema<IWorkflowInstance>(
  {
    companyId: { type: String, required: true },
    definitionId: { type: Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true },
    entityType: {
      type: String,
      enum: ['LeaveApplication', 'PayrollRun', 'AssetAssignment', 'Regularization'],
      required: true
    },
    entityId: { type: String, required: true },
    initiatedBy: { type: String, required: true },
    currentStep: { type: Number, default: 1 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'escalated', 'cancelled'], default: 'pending' },
    steps: [WorkflowInstanceStepSchema]
  },
  { timestamps: true }
);

WorkflowInstanceSchema.index({ companyId: 1, entityType: 1, entityId: 1 });

export const WorkflowInstance: Model<IWorkflowInstance> = mongoose.model<IWorkflowInstance>(
  'WorkflowInstance',
  WorkflowInstanceSchema
);
