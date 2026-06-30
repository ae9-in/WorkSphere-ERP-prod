import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployeeProfile extends Document {
  employeeId: string;
  companyId: string;
  fatherName?: string;
  motherName?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  passportNumber?: string;
  drivingLicenseNumber?: string;
  permanentAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  currentAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeProfileSchema = new Schema<IEmployeeProfile>(
  {
    employeeId: { type: String, required: true, unique: true },
    companyId: { type: String, required: true },
    fatherName: { type: String },
    motherName: { type: String },
    panNumber: { type: String },
    aadhaarNumber: { type: String },
    passportNumber: { type: String },
    drivingLicenseNumber: { type: String },
    permanentAddress: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      pincode: { type: String },
    },
    currentAddress: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      pincode: { type: String },
    },
  },
  { timestamps: true }
);

export const EmployeeProfile: Model<IEmployeeProfile> = mongoose.model<IEmployeeProfile>(
  'EmployeeProfile',
  EmployeeProfileSchema
);
