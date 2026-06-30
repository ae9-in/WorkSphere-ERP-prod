import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOnboarding extends Document {
  employeeId: string;
  companyId: string;
  status: 'in_progress' | 'completed';
  completedSteps: string[]; // e.g. ['basic', 'org', 'docs', 'payroll', 'assets', 'access']
  checklist: {
    pan: boolean;
    pf: boolean;
    it: boolean;
    em: boolean;
    bg: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingSchema = new Schema<IOnboarding>(
  {
    employeeId: { type: String, required: true, unique: true },
    companyId: { type: String, required: true },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    completedSteps: { type: [String], default: [] },
    checklist: {
      pan: { type: Boolean, default: false },
      pf: { type: Boolean, default: false },
      it: { type: Boolean, default: false },
      em: { type: Boolean, default: false },
      bg: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const Onboarding: Model<IOnboarding> = mongoose.model<IOnboarding>(
  'Onboarding',
  OnboardingSchema
);
