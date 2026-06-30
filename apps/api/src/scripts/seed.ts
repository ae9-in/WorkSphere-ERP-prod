import dotenv from 'dotenv';
import path from 'path';

// Load root .env (4 directories up from apps/api/src/scripts/)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Employee } from '../models/Employee.model';
import { PayrollRun } from '../models/PayrollRun.model';
import { Notification } from '../models/Notification.model';
import { Attendance } from '../models/Attendance.model';
import { Approval } from '../models/Approval.model';
import { Company } from '../models/Company.model';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/worksphere-erp';

// ─────────────────────────────────────────────
// SYSTEM INITIALIZATION CREDENTIALS
// ─────────────────────────────────────────────
const SYSTEM_USERS = [
  {
    email:        'admin@worksphere.com',
    passwordHash: 'admin123', // pre-hashed by model pre-save hook
    fullName:     'Priya Sharma',
    role:         'hr_head',
    permissions:  ['employee:*', 'onboarding:*', 'offboarding:*', 'payroll:*', 'attendance:*', 'reports:*', 'documents:*', 'workflow:*'],
    employeeId:   'EMP001',
    companyId:    'company_01',
    sessionId:    'sess_admin',
  },
  {
    email:        'superadmin@worksphere.com',
    passwordHash: 'admin123',
    fullName:     'Platform Super Admin',
    role:         'super_admin',
    permissions:  ['*'],
    companyId:    'platform',
    sessionId:    'sess_superadmin',
  }
];

const INITIAL_EMPLOYEES = [
  {
    employeeId: 'EMP001',
    companyId:  'company_01',
    fullName:   'Priya Sharma',
    personal: {
      firstName: 'Priya',
      lastName: 'Sharma',
      displayName: 'Priya Sharma',
      dateOfBirth: '1995-07-22',
      gender: 'female',
      maritalStatus: 'single',
      nationality: 'Indian',
      bloodGroup: 'B+',
      personalEmail: 'priya.sharma.personal@gmail.com',
      personalPhone: '9876543210',
      permanentAddress: { line1: '14, Lotus Colony', line2: 'Near MG Road', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560001' },
      currentAddress:   { line1: '14, Lotus Colony', line2: 'Near MG Road', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560001' },
    },
    official: {
      workEmail: 'admin@worksphere.com',
      workPhone: '+91 80 4567 8901',
      employeeType: 'full_time',
      dateOfJoining: '2023-01-14',
      confirmationDate: '2023-07-14',
      status: 'active',
    },
    job: {
      departmentName: 'Human Resources',
      designationName: 'HR Manager',
      locationName: 'Bengaluru',
      workMode: 'hybrid',
    },
    salary: { ctc: 2400000, basicPercent: 40, currency: 'INR', effectiveDate: '2025-01-01', paymentMode: 'bank_transfer' },
    emergencyContacts: [{ name: 'Rajan Sharma', relationship: 'Father', phone: '9123456780', isPrimary: true }],
  }
];

async function seed() {
  console.log('🌱  Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log(`✅  Connected to: ${mongoose.connection.host}`);

  // Clear all collections
  console.log('🗑️   Clearing existing data...');
  await Promise.all([
    Company.deleteMany({}),
    User.deleteMany({}),
    Employee.deleteMany({}),
    PayrollRun.deleteMany({}),
    Notification.deleteMany({}),
    Attendance.deleteMany({}),
    Approval.deleteMany({}),
  ]);

  // Seed Companies
  console.log('🏢  Seeding default platform company...');
  const defaultCompany = new Company({
    name: 'WorkSphere HQ',
    slug: 'company_01',
    status: 'active',
    subscriptionPlan: 'enterprise',
    subscriptionStatus: 'active',
  });
  await defaultCompany.save();
  console.log('    ✔  Default company seeded');

  // Seed Users
  console.log('👤  Seeding platform users...');
  for (const u of SYSTEM_USERS) {
    const doc = new User(u);
    await doc.save();
  }
  console.log(`    ✔  Seeded ${SYSTEM_USERS.length} user account(s)`);

  // Seed Employees
  console.log('👥  Seeding tenant administrator employee profile...');
  await Employee.insertMany(INITIAL_EMPLOYEES);
  console.log(`    ✔  Seeded default HR manager employee profile`);

  console.log('\n✅  Database initialized. All dummy data removed!');
  console.log('📧  Platform Login Credentials:');
  console.log('    - Super Admin:   superadmin@worksphere.com / admin123  (Login at /admin/login)');
  console.log('    - Tenant Admin:  admin@worksphere.com / admin123       (Login at /login)');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
