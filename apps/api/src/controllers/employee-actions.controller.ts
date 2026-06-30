import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee.model';
import { User } from '../models/User.model';
import { PayrollProfile } from '../models/PayrollProfile.model';
import { AssetAssignment } from '../models/AssetAssignment.model';
import { AuditLog } from '../models/AuditLog.model';
import { Notification } from '../models/Notification.model';

// POST /api/employees/:id/actions
export async function dispatchEmployeeAction(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params; // employeeId or _id
    const { action, data } = req.body;
    const companyId = req.user?.companyId;
    const adminUserId = req.user?.sub;
    const adminEmail = req.user?.email;
    const adminRole = req.user?.role;

    if (!companyId || !adminUserId || !adminEmail || !adminRole) {
      res.status(401).json({ success: false, message: 'Unauthorized session.' });
      return;
    }

    if (!action) {
      res.status(400).json({ success: false, message: 'Action identifier is required.' });
      return;
    }

    // ─────────────────────────────────────────────
    // 1. RBAC CONTROLS
    // ─────────────────────────────────────────────
    const isSuperAdmin = adminRole === 'super_admin';
    const isCompanyHR = adminRole === 'company_admin' || adminRole === 'hr_head';
    const isManager = adminRole === 'reporting_manager' || adminRole === 'manager';

    // Manager limits
    const managerAllowedActions = [
      'VIEW_ATTENDANCE', 'REGULARIZE_ATTENDANCE', 'ASSIGN_SHIFT',
      'VIEW_LEAVE', 'APPROVE_LEAVE', 'ASSIGN_LEAVE_POLICY',
      'SEND_EMAIL', 'SCHEDULE_MEETING'
    ];

    if (isManager && !managerAllowedActions.includes(action)) {
      res.status(403).json({ success: false, message: 'Access denied. Managers cannot perform corporate profile modifications.' });
      return;
    }

    if (!isSuperAdmin && !isCompanyHR && !isManager) {
      res.status(403).json({ success: false, message: 'Access denied. You do not have permissions for employee actions.' });
      return;
    }

    if (action === 'DELETE' && !isSuperAdmin) {
      res.status(403).json({ success: false, message: 'Access denied. Only Platform Super Admins can delete employee profiles.' });
      return;
    }

    // ─────────────────────────────────────────────
    // 2. QUERY EMPLOYEE RECORD
    // ─────────────────────────────────────────────
    const query = { $or: [{ employeeId: id }, { _id: id }], companyId };
    const employee = await Employee.findOne(query);

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee record not found.' });
      return;
    }

    const targetName = employee.fullName;
    const targetEmpId = employee.employeeId;

    let auditDetails = '';
    let dbUpdates: any = {};

    // ─────────────────────────────────────────────
    // 3. ACTION EXECUTION LOGIC
    // ─────────────────────────────────────────────
    switch (action) {
      // ── Employment Actions ───────────────────────
      case 'PROMOTE':
        if (!data?.designationName || !data?.ctc) {
          res.status(400).json({ success: false, message: 'New Designation and CTC Salary are required.' });
          return;
        }
        dbUpdates['job.designationName'] = data.designationName;
        dbUpdates['salary.ctc'] = Number(data.ctc);
        dbUpdates['salary.effectiveDate'] = new Date().toISOString().split('T')[0];
        
        // Also update separate PayrollProfile if it exists
        await PayrollProfile.updateOne({ employeeId: targetEmpId, companyId }, { ctc: Number(data.ctc) });
        auditDetails = `Promoted to ${data.designationName} with revised CTC ₹${Number(data.ctc).toLocaleString('en-IN')}`;
        break;

      case 'TRANSFER':
        if (!data?.departmentName) {
          res.status(400).json({ success: false, message: 'New Department Name is required.' });
          return;
        }
        dbUpdates['job.departmentName'] = data.departmentName;
        auditDetails = `Transferred from ${employee.job.departmentName} to ${data.departmentName}`;
        break;

      case 'CHANGE_DESIGNATION':
        if (!data?.designationName) {
          res.status(400).json({ success: false, message: 'Designation name is required.' });
          return;
        }
        dbUpdates['job.designationName'] = data.designationName;
        auditDetails = `Designation updated to ${data.designationName}`;
        break;

      case 'CHANGE_REPORTING_MANAGER':
        if (!data?.reportingManagerName) {
          res.status(400).json({ success: false, message: 'Reporting manager name is required.' });
          return;
        }
        dbUpdates['job.reportingManagerName'] = data.reportingManagerName;
        auditDetails = `Reporting supervisor reassigned to ${data.reportingManagerName}`;
        break;

      case 'CONVERT_EMPLOYMENT_TYPE':
        if (!data?.employeeType) {
          res.status(400).json({ success: false, message: 'Employment type is required.' });
          return;
        }
        dbUpdates['official.employeeType'] = data.employeeType;
        auditDetails = `Employment type converted to ${data.employeeType}`;
        break;

      case 'EXTEND_PROBATION':
        if (!data?.probationEndDate) {
          res.status(400).json({ success: false, message: 'Probation extension end date is required.' });
          return;
        }
        dbUpdates['official.probationEndDate'] = data.probationEndDate;
        dbUpdates['official.status'] = 'probation';
        auditDetails = `Probation extended until ${data.probationEndDate}`;
        break;

      case 'CONFIRM_EMPLOYMENT':
        dbUpdates['official.status'] = 'active';
        dbUpdates['official.confirmationDate'] = new Date().toISOString().split('T')[0];
        auditDetails = `Employment status confirmed as active permanent.`;
        break;

      case 'MARK_RESIGNED':
        if (!data?.lastWorkingDay) {
          res.status(400).json({ success: false, message: 'Last working day is required.' });
          return;
        }
        dbUpdates['official.status'] = 'resigned';
        dbUpdates['official.lastWorkingDay'] = data.lastWorkingDay;
        auditDetails = `Marked resigned. Exit notice set for LWD: ${data.lastWorkingDay}`;
        break;

      case 'INITIATE_OFFBOARDING':
        if (!data?.lastWorkingDay) {
          res.status(400).json({ success: false, message: 'Last working day is required.' });
          return;
        }
        dbUpdates['official.status'] = 'notice_period';
        dbUpdates['official.lastWorkingDay'] = data.lastWorkingDay;
        auditDetails = `Notice period initiated. LWD: ${data.lastWorkingDay}`;
        break;

      case 'TERMINATE':
        dbUpdates['official.status'] = 'terminated';
        dbUpdates['official.exitDate'] = new Date().toISOString().split('T')[0];
        // Disable target user login account
        await User.updateOne({ employeeId: targetEmpId, companyId }, { isActive: false });
        auditDetails = `Terminated corporate session. Account logins revoked.`;
        break;

      case 'DELETE':
        await Employee.deleteOne({ _id: employee._id });
        await User.deleteOne({ employeeId: targetEmpId, companyId });
        await PayrollProfile.deleteOne({ employeeId: targetEmpId, companyId });
        auditDetails = `Permanently removed employee record and associated portal login.`;
        break;

      // ── Access / Security ───────────────────────
      case 'RESET_PASSWORD':
        const tempPassword = `Reset@${targetEmpId}`;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(tempPassword, salt);
        await User.updateOne({ employeeId: targetEmpId, companyId }, { passwordHash });
        auditDetails = `Generated new temporary credentials password.`;
        break;

      case 'DISABLE_LOGIN':
        await User.updateOne({ employeeId: targetEmpId, companyId }, { isActive: false });
        auditDetails = `Revoked system login session permissions.`;
        break;

      case 'ACTIVATE_LOGIN':
        await User.updateOne({ employeeId: targetEmpId, companyId }, { isActive: true });
        auditDetails = `Re-activated credentials login profile access.`;
        break;

      // ── Asset Actions ───────────────────────────
      case 'ASSIGN_ASSET':
        if (!data?.assetType || !data?.assetName) {
          res.status(400).json({ success: false, message: 'Asset Type and Name are required.' });
          return;
        }
        await AssetAssignment.create({
          employeeId: targetEmpId,
          companyId,
          assetType: data.assetType,
          assetName: data.assetName,
          serialNumber: data.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
        });
        auditDetails = `Allocated new asset: ${data.assetName} (${data.assetType})`;
        break;

      case 'RETURN_ASSET':
        if (!data?.assetName) {
          res.status(400).json({ success: false, message: 'Asset name or reference is required.' });
          return;
        }
        await AssetAssignment.updateOne(
          { employeeId: targetEmpId, companyId, assetName: data.assetName, status: 'assigned' },
          { status: 'returned' }
        );
        auditDetails = `Deallocated and returned asset: ${data.assetName}`;
        break;

      // ── Attendance / Leave / Mock updates ───────
      case 'REGULARIZE_ATTENDANCE':
        auditDetails = `Regularized attendance logging request: ${data?.details || 'Approved missing logs'}`;
        break;

      case 'APPROVE_LEAVE':
        auditDetails = `Approved leave request for: ${data?.dateRange || 'selected days'}`;
        break;

      case 'REVISE_SALARY':
        if (!data?.ctc) {
          res.status(400).json({ success: false, message: 'CTC value is required.' });
          return;
        }
        dbUpdates['salary.ctc'] = Number(data.ctc);
        await PayrollProfile.updateOne({ employeeId: targetEmpId, companyId }, { ctc: Number(data.ctc) });
        auditDetails = `Revised annual compensation CTC packages to ₹${Number(data.ctc).toLocaleString('en-IN')}`;
        break;

      default:
        // Mock fallback for generic UI workflows
        auditDetails = `Executed corporate workflow action: ${action.replace('_', ' ')}`;
    }

    // Apply DB changes to employee model
    let updatedEmployee = employee;
    if (Object.keys(dbUpdates).length > 0) {
      updatedEmployee = await Employee.findOneAndUpdate(
        { _id: employee._id },
        { $set: dbUpdates },
        { new: true }
      ) as any;
    }

    // ─────────────────────────────────────────────
    // 4. GENERATE AUDIT LOGS & NOTIFICATIONS
    // ─────────────────────────────────────────────
    const auditLog = new AuditLog({
      companyId,
      userId: adminUserId,
      email: adminEmail,
      action: `EMPLOYEE_${action}`,
      details: `Admin ${adminEmail} performed action [${action}] on employee ${targetName} (${targetEmpId}). Details: ${auditDetails}`,
    });
    await auditLog.save();

    await Notification.create({
      type: 'approval_request',
      companyId,
      title: `Employee Action: ${action.replace('_', ' ')}`,
      message: `Action executed on ${targetName}: ${auditDetails}`,
      read: false,
      url: `/employees/${employee.employeeId}`,
      actor: { name: adminEmail },
    });

    res.status(200).json({
      success: true,
      data: updatedEmployee,
      message: `Action '${action}' completed successfully.`
    });

  } catch (err) {
    console.error('Dispatch employee action error:', err);
    res.status(500).json({ success: false, message: 'Server error while executing profile action.' });
  }
}
