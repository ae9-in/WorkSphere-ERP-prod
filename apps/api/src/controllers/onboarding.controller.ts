import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee.model';
import { User } from '../models/User.model';
import { EmployeeProfile } from '../models/EmployeeProfile.model';
import { EmployeeDocument } from '../models/EmployeeDocument.model';
import { PayrollProfile } from '../models/PayrollProfile.model';
import { AssetAssignment } from '../models/AssetAssignment.model';
import { Onboarding } from '../models/Onboarding.model';
import { AuditLog } from '../models/AuditLog.model';
import { Notification } from '../models/Notification.model';

// POST /api/onboarding/new
export async function createOnboardingWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId;
    const adminUserId = req.user?.sub;
    const adminEmail = req.user?.email;

    if (!companyId || !adminUserId || !adminEmail) {
      res.status(401).json({ success: false, message: 'Unauthorized. Active session required.' });
      return;
    }

    const {
      basic,
      org,
      documents,
      payroll,
      assets,
      systemAccess,
    } = req.body;

    // ─────────────────────────────────────────────
    // 1. VALIDATIONS
    // ─────────────────────────────────────────────
    
    // Required Basic Fields
    if (!basic?.firstName || !basic?.lastName || !basic?.email || !basic?.phone) {
      res.status(400).json({ success: false, message: 'Missing required basic details (names, email, phone).' });
      return;
    }

    // Required Org Fields
    if (!org?.branch || !org?.department || !org?.designation || !org?.dateOfJoining) {
      res.status(400).json({ success: false, message: 'Missing required organization details (branch, dept, designation, joining date).' });
      return;
    }

    // Required Payroll Fields
    if (!payroll?.ctc || !payroll?.bankName || !payroll?.accountNumber || !payroll?.ifsc) {
      res.status(400).json({ success: false, message: 'Missing required payroll bank details.' });
      return;
    }

    // Required System Access
    if (!systemAccess?.role) {
      res.status(400).json({ success: false, message: 'System access role designation is required.' });
      return;
    }

    // Duplicate email checks in User and Employee
    const emailLower = basic.email.toLowerCase();
    const [existingUser, existingEmployee] = await Promise.all([
      User.findOne({ email: emailLower }),
      Employee.findOne({ 'official.workEmail': emailLower, companyId }),
    ]);

    if (existingUser || existingEmployee) {
      res.status(400).json({ success: false, message: 'An account or employee with this email is already registered.' });
      return;
    }

    // Positive CTC validation
    const ctcValue = Number(payroll.ctc);
    if (isNaN(ctcValue) || ctcValue <= 0) {
      res.status(400).json({ success: false, message: 'Salary CTC must be a positive number.' });
      return;
    }

    // Validate Joining Date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const joiningDate = new Date(org.dateOfJoining);
    joiningDate.setHours(0, 0, 0, 0);

    if (joiningDate.getTime() < today.getTime()) {
      res.status(400).json({
        success: false,
        message: 'Past joining dates are not permitted. Please select today or a future date.'
      });
      return;
    }

    // ─────────────────────────────────────────────
    // 2. UNIQUE EMPLOYEE ID GENERATION
    // ─────────────────────────────────────────────
    const count = await Employee.countDocuments({ companyId });
    const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;
    const fullName = `${basic.firstName} ${basic.lastName}`.trim();

    // ─────────────────────────────────────────────
    // 3. CREATE LINKED RECORDS
    // ─────────────────────────────────────────────

    // 1. Employee
    const employee = new Employee({
      employeeId,
      companyId,
      fullName,
      personal: {
        firstName: basic.firstName,
        lastName: basic.lastName,
        displayName: basic.displayName || fullName,
        dateOfBirth: basic.dateOfBirth,
        gender: basic.gender || 'other',
        photo: basic.profilePhoto,
      },
      official: {
        workEmail: emailLower,
        workPhone: basic.phone,
        employeeType: org.employmentType || 'full_time',
        dateOfJoining: org.dateOfJoining,
        status: 'active', // Starts on active status during onboarding
      },
      job: {
        departmentName: org.department,
        designationName: org.designation,
        locationName: org.workLocation || org.branch,
        reportingManagerName: org.reportingManager || 'HR Head',
        workMode: 'onsite',
      },
      salary: {
        ctc: ctcValue,
        basicPercent: 40,
        currency: 'INR',
        effectiveDate: org.dateOfJoining,
        paymentMode: 'bank_transfer',
      },
    });
    await employee.save();

    // 2. User (Employee Login)
    const tempPassword = `Welcome@${employeeId}`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const user = new User({
      email: emailLower,
      passwordHash,
      fullName,
      role: 'employee', // Employee login portal role
      permissions: ['dashboard:read', 'attendance:read', 'leave:read', 'profile:read', 'payslips:read', 'documents:read'],
      employeeId,
      companyId,
      isActive: true,
    });
    await user.save();

    // 3. EmployeeProfile
    const employeeProfile = new EmployeeProfile({
      employeeId,
      companyId,
      fatherName: basic.fatherName || '',
      aadhaarNumber: basic.aadhaar || '',
      panNumber: basic.pan || '',
    });
    await employeeProfile.save();

    // 4. EmployeeDocuments
    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        await EmployeeDocument.create({
          employeeId,
          companyId,
          documentType: doc.documentType || 'other',
          fileName: doc.fileName || 'document.pdf',
          fileSize: doc.fileSize || 1024,
          status: 'pending',
        });
      }
    }

    // 5. PayrollProfile
    const payrollProfile = new PayrollProfile({
      employeeId,
      companyId,
      ctc: ctcValue,
      bankName: payroll.bankName,
      accountNumber: payroll.accountNumber,
      ifsc: payroll.ifsc,
      uan: payroll.uan || '',
      pfEnabled: payroll.pfEnabled !== false,
      esiEnabled: payroll.esiEnabled === true,
      professionalTax: payroll.professionalTax !== false,
      tdsPercentage: Number(payroll.tds) || 0,
      payrollGroup: payroll.payrollGroup || 'Standard',
    });
    await payrollProfile.save();

    // 6. AssetAssignments
    if (assets && Array.isArray(assets)) {
      for (const asset of assets) {
        await AssetAssignment.create({
          employeeId,
          companyId,
          assetType: asset.assetType || 'other',
          assetName: asset.assetName || 'Assigned Asset',
          serialNumber: asset.serialNumber || 'SN-MOCK',
          assignedAt: new Date(),
          status: 'assigned',
        });
      }
    }

    // 7. Onboarding Track Record
    const onboarding = new Onboarding({
      employeeId,
      companyId,
      status: 'in_progress',
      completedSteps: ['basic', 'org', 'docs', 'payroll', 'assets', 'access'],
      checklist: {
        pan: documents?.some((d: any) => d.documentType === 'pan') || false,
        pf: !!payroll.uan,
        it: assets?.length > 0,
        em: true, // email set
        bg: false, // background pending
      },
    });
    await onboarding.save();

    // 8. Audit Log
    const auditLog = new AuditLog({
      companyId,
      userId: adminUserId,
      email: adminEmail,
      action: 'EMPLOYEE_ONBOARDED',
      details: `Onboarded employee ${fullName} (${employeeId}) with role ${systemAccess.role}.`,
    });
    await auditLog.save();

    // 9. Generate Notification
    await Notification.create({
      type: 'onboarding_task',
      companyId,
      title: 'New Onboarding Flow Initiated',
      message: `Employee onboarding setup completed for ${fullName} (${employeeId}). Tasks dispatched.`,
      read: false,
      url: `/onboarding`,
      actor: { name: fullName },
    });

    res.status(201).json({
      success: true,
      data: {
        employeeId,
        fullName,
        email: emailLower,
        tempPassword,
        role: systemAccess.role,
      },
      message: 'Onboarding setup completed successfully. Candidate login and profile generated.'
    });
  } catch (err) {
    console.error('Onboarding workflow error:', err);
    res.status(500).json({ success: false, message: 'Server error during onboarding setup.' });
  }
}
