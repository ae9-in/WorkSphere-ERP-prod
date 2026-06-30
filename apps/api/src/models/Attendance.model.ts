import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  employeeId:   string;
  companyId:    string;
  fullName:     string;
  date:         string; // YYYY-MM-DD
  checkIn?:     string; // HH:MM:SS
  checkOut?:    string; // HH:MM:SS
  status:       'present' | 'absent' | 'wfh' | 'late' | 'half_day';
  workMode:     'onsite' | 'remote' | 'hybrid';
  createdAt:    Date;
  updatedAt:    Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: String, required: true },
    companyId:  { type: String, required: true, default: 'company_01' },
    fullName:   { type: String, required: true },
    date:       { type: String, required: true },
    checkIn:    { type: String },
    checkOut:   { type: String },
    status: {
      type:    String,
      enum:    ['present', 'absent', 'wfh', 'late', 'half_day'],
      default: 'present',
    },
    workMode: {
      type:    String,
      enum:    ['onsite', 'remote', 'hybrid'],
      default: 'onsite',
    },
  },
  { timestamps: true }
);

// Prevent duplicate entries for same employee on same date
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
