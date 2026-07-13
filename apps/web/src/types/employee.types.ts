// ─────────────────────────────────────────────
// Employee Types
// ─────────────────────────────────────────────

export type EmployeeStatus =
  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'notice_period'
  | 'resigned'
  | 'terminated'
  | 'retired'
  | 'absconding';

export type EmployeeType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'intern'
  | 'consultant'
  | 'probation';

export type WorkMode = 'onsite' | 'remote' | 'hybrid';

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  dateOfBirth: string;
  gender: Gender;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  nationality?: string;
  bloodGroup?: string;
  personalEmail?: string;
  personalPhone?: string;
  photo?: string;
  permanentAddress?: Address;
  currentAddress?: Address;
}

export interface OfficialInfo {
  workEmail: string;
  workPhone?: string;
  employeeType: EmployeeType;
  dateOfJoining: string;
  confirmationDate?: string;
  probationEndDate?: string;
  status: EmployeeStatus;
  exitDate?: string;
  lastWorkingDay?: string;
}

export interface JobInfo {
  departmentId?: string;
  departmentName?: string;
  designationId?: string;
  designationName?: string;
  gradeId?: string;
  gradeName?: string;
  locationId?: string;
  locationName?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  workMode: WorkMode;
  shiftId?: string;
  shiftName?: string;
  costCenter?: string;
}

export interface SalaryInfo {
  ctc: number;
  basicPercent: number;
  currency: string;
  effectiveDate: string;
  paymentMode: 'bank_transfer' | 'cheque' | 'cash';
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  startYear: number;
  endYear: number;
  percentage?: number;
  documentUrl?: string;
}

export interface Experience {
  company: string;
  designation: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  responsibilities?: string;
  ctc?: number;
}

export interface EmployeeDocument {
  type: string;
  name: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
  expiryDate?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface BankAccount {
  id?: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscSwiftCode: string;
  branchName: string;
  accountType: string;
  upiId?: string;
  isPrimary: boolean;
}

export interface Skill {
  id?: string;
  skillName: string;
  skillType: string;
  proficiencyLevel?: string;
}

export interface Certification {
  id?: string;
  certificationName: string;
  issuingAuthority: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  companyId: string;
  personal: PersonalInfo;
  official: OfficialInfo;
  job: JobInfo;
  salary?: SalaryInfo;
  education?: Education[];
  experience?: Experience[];
  documents?: EmployeeDocument[];
  emergencyContacts?: EmergencyContact[];
  bank?: BankAccount[];
  skills?: Skill[];
  certifications?: Certification[];
  curr_line1?: string;
  curr_line2?: string;
  curr_city?: string;
  curr_state?: string;
  curr_country?: string;
  curr_pincode?: string;
  perm_line1?: string;
  perm_line2?: string;
  perm_city?: string;
  perm_state?: string;
  perm_country?: string;
  perm_pincode?: string;
  fullName?: string;
  tenure?: number;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListItem {
  _id: string;
  employeeId: string;
  fullName: string;
  personal: Pick<PersonalInfo, 'photo' | 'firstName' | 'lastName'>;
  official: Pick<OfficialInfo, 'status' | 'workEmail' | 'employeeType' | 'dateOfJoining'>;
  job: Pick<JobInfo, 'departmentName' | 'designationName' | 'locationName' | 'workMode'>;
}

export interface CreateEmployeeInput {
  personal: PersonalInfo;
  official: Omit<OfficialInfo, 'status'>;
  job: JobInfo;
}
