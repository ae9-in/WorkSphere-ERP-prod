import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string; // unique workspace URL slug
  status: 'active' | 'suspended';
  industry?: string;
  size?: string;
  country?: string;
  subscriptionPlan: 'free' | 'growth' | 'enterprise';
  subscriptionStatus: 'active' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    industry: { type: String },
    size: { type: String },
    country: { type: String },
    subscriptionPlan: { type: String, enum: ['free', 'growth', 'enterprise'], default: 'free' },
    subscriptionStatus: { type: String, enum: ['active', 'canceled'], default: 'active' },
  },
  { timestamps: true }
);

export const Company: Model<ICompany> = mongoose.model<ICompany>('Company', CompanySchema);
