import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShift extends Document {
  companyId: string;
  name: string;
  code: string;
  type: 'fixed' | 'flexible' | 'rotational';
  startTime: string; // e.g. '09:00'
  endTime: string;   // e.g. '18:00'
  graceMinutes: number;
  workDays: number[]; // e.g. [1, 2, 3, 4, 5] (Mon-Fri)
  weeklyOff: number[]; // e.g. [0, 6] (Sun, Sat)
  isNightShift: boolean;
  overtimeAfterMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    companyId: { type: String, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'flexible', 'rotational'], default: 'fixed' },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    graceMinutes: { type: Number, default: 15 },
    workDays: [{ type: Number }],
    weeklyOff: [{ type: Number }],
    isNightShift: { type: Boolean, default: false },
    overtimeAfterMinutes: { type: Number, default: 30 }
  },
  { timestamps: true }
);

ShiftSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Shift: Model<IShift> = mongoose.model<IShift>('Shift', ShiftSchema);
