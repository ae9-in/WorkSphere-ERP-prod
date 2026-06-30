// ─────────────────────────────────────────────
// Payroll Types
// ─────────────────────────────────────────────

export type PayrollStatus = 'draft' | 'processing' | 'completed' | 'approved' | 'paid' | 'cancelled';

export interface SalaryComponent {
  name: string;
  type: 'earning' | 'deduction';
  calculationType: 'fixed' | 'percentage' | 'formula';
  value: number;
  isActive: boolean;
  isTaxable: boolean;
}

export interface SalaryStructure {
  _id: string;
  name: string;
  description?: string;
  components: SalaryComponent[];
  applicableTo: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface PayrollRun {
  _id: string;
  month: number;
  year: number;
  period: string;
  status: PayrollStatus;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  processedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface Payslip {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  payrollRunId: string;
  month: number;
  year: number;
  period: string;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  taxableIncome: number;
  tdsDeducted: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  bankAccount?: string;
  status: 'generated' | 'sent' | 'downloaded';
  generatedAt: string;
}
