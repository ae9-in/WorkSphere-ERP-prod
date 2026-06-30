import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  permissions: string[];
  employeeId?: string;
  companyId?: string;
  sessionId: string;
  photo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    fullName:     { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['super_admin','company_admin','hr_head','hr_executive','payroll_manager',
             'department_manager','reporting_manager','employee','auditor','finance','it_admin','guest'],
      default: 'employee',
    },
    permissions: { type: [String], default: [] },
    employeeId:  { type: String },
    companyId:   { type: String },
    sessionId:   { type: String, default: '' },
    photo:       { type: String },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
