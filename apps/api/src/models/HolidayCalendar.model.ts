import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHolidayCalendar extends Document {
  companyId: string;
  name: string;
  year: number;
  holidays: Array<{
    date: Date;
    name: string;
    type: 'national' | 'optional' | 'restricted';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const HolidayCalendarSchema = new Schema<IHolidayCalendar>(
  {
    companyId: { type: String, required: true },
    name: { type: String, required: true },
    year: { type: Number, required: true },
    holidays: [
      {
        date: { type: Date, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['national', 'optional', 'restricted'], default: 'national' }
      }
    ]
  },
  { timestamps: true }
);

HolidayCalendarSchema.index({ companyId: 1, year: 1 }, { unique: true });

export const HolidayCalendar: Model<IHolidayCalendar> = mongoose.model<IHolidayCalendar>(
  'HolidayCalendar',
  HolidayCalendarSchema
);
