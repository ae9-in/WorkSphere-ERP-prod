import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalaryComponent {
  code: string;
  name: string;
  type: 'earning' | 'deduction' | 'employer';
  calcType: 'fixed' | 'pct_ctc' | 'pct_basic' | 'formula';
  value: number; // fixed amount or percentage value
  isTaxable: boolean;
  isStatutory: boolean;
  displayOrder: number;
}

export interface ISalaryStructure extends Document {
  companyId: string;
  name: string;
  components: ISalaryComponent[];
  createdAt: Date;
  updatedAt: Date;
}

const SalaryComponentSchema = new Schema<ISalaryComponent>({
  code: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['earning', 'deduction', 'employer'], required: true },
  calcType: { type: String, enum: ['fixed', 'pct_ctc', 'pct_basic', 'formula'], required: true },
  value: { type: Number, required: true, default: 0 },
  isTaxable: { type: Boolean, default: true },
  isStatutory: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 }
});

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    companyId: { type: String, required: true },
    name: { type: String, required: true },
    components: [SalaryComponentSchema]
  },
  { timestamps: true }
);

SalaryStructureSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const SalaryStructure: Model<ISalaryStructure> = mongoose.model<ISalaryStructure>(
  'SalaryStructure',
  SalaryStructureSchema
);
