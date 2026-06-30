import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowStep {
  stepNo: number;
  approverType: 'role' | 'reporting_manager' | 'specific_user';
  approverRole?: string;
  approverId?: string;
  slaHours: number;
  escalateToRole?: string;
  canDelegate: boolean;
}

export interface IWorkflowDefinition extends Document {
  companyId: string;
  module: 'leave' | 'payroll' | 'onboarding' | 'offboarding' | 'expense' | 'asset';
  trigger: string; // e.g. 'submitted', 'initiated'
  isActive: boolean;
  steps: IWorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowStepSchema = new Schema<IWorkflowStep>({
  stepNo: { type: Number, required: true },
  approverType: { type: String, enum: ['role', 'reporting_manager', 'specific_user'], required: true },
  approverRole: { type: String },
  approverId: { type: String },
  slaHours: { type: Number, default: 48 },
  escalateToRole: { type: String },
  canDelegate: { type: Boolean, default: true }
});

const WorkflowDefinitionSchema = new Schema<IWorkflowDefinition>(
  {
    companyId: { type: String, required: true },
    module: {
      type: String,
      enum: ['leave', 'payroll', 'onboarding', 'offboarding', 'expense', 'asset'],
      required: true
    },
    trigger: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    steps: [WorkflowStepSchema]
  },
  { timestamps: true }
);

WorkflowDefinitionSchema.index({ companyId: 1, module: 1 }, { unique: true });

export const WorkflowDefinition: Model<IWorkflowDefinition> = mongoose.model<IWorkflowDefinition>(
  'WorkflowDefinition',
  WorkflowDefinitionSchema
);
