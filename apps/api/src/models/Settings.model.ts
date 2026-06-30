import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartmentSetting {
  name: string;
  code: string;
}

export interface IDesignationSetting {
  name: string;
  code: string;
}

export interface IEmploymentTypeSetting {
  name: string;
  code: string;
}

export interface IBranchSetting {
  name: string;
  code: string;
  lat: number;
  lng: number;
  geofenceRadius: number; // in meters
}

export interface IPayrollRulesSetting {
  basicPercent: number;
  hraPercent: number;
  pfEnabled: boolean;
  esiEnabled: boolean;
  gpsEnabled: boolean;
}

export interface ISettings extends Document {
  companyId: string;
  departments: IDepartmentSetting[];
  designations: IDesignationSetting[];
  employmentTypes: IEmploymentTypeSetting[];
  branches: IBranchSetting[];
  payrollRules: IPayrollRulesSetting;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    companyId: { type: String, required: true, unique: true },
    departments: [
      {
        name: { type: String, required: true },
        code: { type: String, required: true }
      }
    ],
    designations: [
      {
        name: { type: String, required: true },
        code: { type: String, required: true }
      }
    ],
    employmentTypes: [
      {
        name: { type: String, required: true },
        code: { type: String, required: true }
      }
    ],
    branches: [
      {
        name: { type: String, required: true },
        code: { type: String, required: true },
        lat: { type: Number, required: true, default: 0 },
        lng: { type: Number, required: true, default: 0 },
        geofenceRadius: { type: Number, required: true, default: 200 }
      }
    ],
    payrollRules: {
      basicPercent: { type: Number, default: 40 },
      hraPercent: { type: Number, default: 50 },
      pfEnabled: { type: Boolean, default: true },
      esiEnabled: { type: Boolean, default: true },
      gpsEnabled: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

SettingsSchema.index({ companyId: 1 });

export const Settings: Model<ISettings> = mongoose.model<ISettings>('Settings', SettingsSchema);
