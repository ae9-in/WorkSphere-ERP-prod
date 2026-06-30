import mongoose, { Schema, Document, Model } from 'mongoose';

// ── TypeScript interfaces for sub-documents ──────────────────────────────────

interface IAddress {
  line1?:   string;
  line2?:   string;
  city?:    string;
  state?:   string;
  country?: string;
  pincode?: string;
}

interface IPersonalInfo {
  firstName:        string;
  middleName?:      string;
  lastName:         string;
  displayName?:     string;
  dateOfBirth?:     string;
  gender?:          'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  maritalStatus?:   'single' | 'married' | 'divorced' | 'widowed';
  nationality?:     string;
  bloodGroup?:      string;
  personalEmail?:   string;
  personalPhone?:   string;
  photo?:           string;
  permanentAddress?: IAddress;
  currentAddress?:   IAddress;
}

interface IOfficialInfo {
  workEmail:        string;
  workPhone?:       string;
  employeeType:     'full_time' | 'part_time' | 'contract' | 'intern' | 'consultant' | 'probation';
  dateOfJoining:    string;
  confirmationDate?: string;
  probationEndDate?: string;
  status:           'active' | 'inactive' | 'on_leave' | 'notice_period' | 'resigned' | 'terminated' | 'retired' | 'absconding';
  exitDate?:        string;
  lastWorkingDay?:  string;
}

interface IJobInfo {
  departmentId?:         string;
  departmentName?:       string;
  designationId?:        string;
  designationName?:      string;
  gradeId?:              string;
  gradeName?:            string;
  locationId?:           string;
  locationName?:         string;
  reportingManagerId?:   string;
  reportingManagerName?: string;
  workMode:              'onsite' | 'remote' | 'hybrid';
  shiftId?:              string;
  shiftName?:            string;
  costCenter?:           string;
}

interface ISalaryInfo {
  ctc:           number;
  basicPercent:  number;
  currency:      string;
  effectiveDate: string;
  paymentMode:   'bank_transfer' | 'cheque' | 'cash';
}

interface IEducation {
  degree:      string;
  field:       string;
  institution: string;
  startYear:   number;
  endYear:     number;
  percentage?: number;
  documentUrl?: string;
}

interface IExperience {
  company:          string;
  designation:      string;
  startDate:        string;
  endDate?:         string;
  isCurrent:        boolean;
  responsibilities?: string;
  ctc?:             number;
}

interface IEmergencyContact {
  name:         string;
  relationship: string;
  phone:        string;
  isPrimary:    boolean;
}

// ── Main Employee Document interface ─────────────────────────────────────────

export interface IEmployee extends Document {
  employeeId:         string;
  companyId:          string;
  fullName:           string;
  personal:           IPersonalInfo;
  official:           IOfficialInfo;
  job:                IJobInfo;
  salary?:            ISalaryInfo;
  education?:         IEducation[];
  experience?:        IExperience[];
  emergencyContacts?: IEmergencyContact[];
  isArchived:         boolean;
  createdAt:          Date;
  updatedAt:          Date;
}

// ── Sub-document schemas ─────────────────────────────────────────────────────

const AddressSchema = new Schema<IAddress>({
  line1:   { type: String },
  line2:   { type: String },
  city:    { type: String },
  state:   { type: String },
  country: { type: String, default: 'India' },
  pincode: { type: String },
}, { _id: false });

const PersonalInfoSchema = new Schema<IPersonalInfo>({
  firstName:        { type: String, required: true },
  middleName:       { type: String },
  lastName:         { type: String, required: true },
  displayName:      { type: String },
  dateOfBirth:      { type: String },
  gender:           { type: String, enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'] },
  maritalStatus:    { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
  nationality:      { type: String, default: 'Indian' },
  bloodGroup:       { type: String },
  personalEmail:    { type: String },
  personalPhone:    { type: String },
  photo:            { type: String },
  permanentAddress: { type: AddressSchema },
  currentAddress:   { type: AddressSchema },
}, { _id: false });

const OfficialInfoSchema = new Schema<IOfficialInfo>({
  workEmail:        { type: String, required: true },
  workPhone:        { type: String },
  employeeType: {
    type:    String,
    enum:    ['full_time', 'part_time', 'contract', 'intern', 'consultant', 'probation'],
    default: 'full_time',
  },
  dateOfJoining:    { type: String, required: true },
  confirmationDate: { type: String },
  probationEndDate: { type: String },
  status: {
    type:    String,
    enum:    ['active','inactive','on_leave','notice_period','resigned','terminated','retired','absconding'],
    default: 'active',
  },
  exitDate:       { type: String },
  lastWorkingDay: { type: String },
}, { _id: false });

const JobInfoSchema = new Schema<IJobInfo>({
  departmentId:         { type: String },
  departmentName:       { type: String },
  designationId:        { type: String },
  designationName:      { type: String },
  gradeId:              { type: String },
  gradeName:            { type: String },
  locationId:           { type: String },
  locationName:         { type: String },
  reportingManagerId:   { type: String },
  reportingManagerName: { type: String },
  workMode: {
    type:    String,
    enum:    ['onsite', 'remote', 'hybrid'],
    default: 'hybrid',
  },
  shiftId:    { type: String },
  shiftName:  { type: String },
  costCenter: { type: String },
}, { _id: false });

const SalaryInfoSchema = new Schema<ISalaryInfo>({
  ctc:           { type: Number, default: 0 },
  basicPercent:  { type: Number, default: 40 },
  currency:      { type: String, default: 'INR' },
  effectiveDate: { type: String },
  paymentMode: {
    type:    String,
    enum:    ['bank_transfer', 'cheque', 'cash'],
    default: 'bank_transfer',
  },
}, { _id: false });

const EducationSchema = new Schema<IEducation>({
  degree:      { type: String },
  field:       { type: String },
  institution: { type: String },
  startYear:   { type: Number },
  endYear:     { type: Number },
  percentage:  { type: Number },
  documentUrl: { type: String },
}, { _id: false });

const ExperienceSchema = new Schema<IExperience>({
  company:          { type: String },
  designation:      { type: String },
  startDate:        { type: String },
  endDate:          { type: String },
  isCurrent:        { type: Boolean, default: false },
  responsibilities: { type: String },
  ctc:              { type: Number },
}, { _id: false });

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name:         { type: String },
  relationship: { type: String },
  phone:        { type: String },
  isPrimary:    { type: Boolean, default: false },
}, { _id: false });

// ── Main Employee Schema ──────────────────────────────────────────────────────

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId:        { type: String, required: true, unique: true },
    companyId:         { type: String, required: true, default: 'company_01' },
    fullName:          { type: String, required: true },
    personal:          { type: PersonalInfoSchema, required: true },
    official:          { type: OfficialInfoSchema, required: true },
    job:               { type: JobInfoSchema, required: true },
    salary:            { type: SalaryInfoSchema },
    education:         { type: [EducationSchema], default: [] },
    experience:        { type: [ExperienceSchema], default: [] },
    emergencyContacts: { type: [EmergencyContactSchema], default: [] },
    isArchived:        { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Virtual: tenure in months
EmployeeSchema.virtual('tenure').get(function (this: IEmployee) {
  if (!this.official?.dateOfJoining) return 0;
  const joining = new Date(this.official.dateOfJoining);
  const now     = new Date();
  return Math.floor((now.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24 * 30));
});

// Text search index
EmployeeSchema.index({
  fullName:                 'text',
  'official.workEmail':     'text',
  'job.departmentName':     'text',
  'job.designationName':    'text',
  employeeId:               'text',
});

export const Employee: Model<IEmployee> = mongoose.model<IEmployee>('Employee', EmployeeSchema);
