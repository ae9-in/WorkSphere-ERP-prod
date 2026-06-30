import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { LeaveType } from '../models/LeaveType.model';
import { LeaveBalance } from '../models/LeaveBalance.model';
import { LeaveApplication } from '../models/LeaveApplication.model';
import { HolidayCalendar } from '../models/HolidayCalendar.model';
import { Notification } from '../models/Notification.model';
import { WorkflowDefinition } from '../models/WorkflowDefinition.model';
import { WorkflowInstance } from '../models/WorkflowInstance.model';
import { Employee } from '../models/Employee.model';
import { auditLog } from '../middleware/audit.middleware';

// Helper to check and exclude weekends + holidays
async function calculateNetDays(fromStr: string, toStr: string, companyId: string): Promise<number> {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  const cal = await HolidayCalendar.findOne({ companyId, year: from.getFullYear() });
  const holidayDates = new Set(cal?.holidays.map(h => new Date(h.date).toDateString()) || []);

  let count = 0;
  const current = new Date(from);
  while (current <= to) {
    const day = current.getDay();
    const isWeekend = day === 0 || day === 6; // Sunday/Saturday
    const isHoliday = holidayDates.has(current.toDateString());

    if (!isWeekend && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export async function createLeaveType(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const type = await LeaveType.create({ ...req.body, companyId });
    res.status(201).json({ success: true, data: type });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getLeaveTypes(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const types = await LeaveType.find({ companyId });
    res.json({ success: true, data: types });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function applyLeave(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const employeeId = req.user?.employeeId || req.body.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID context missing' });
      return;
    }

    const { leaveTypeId, from, to, reason, halfDay, halfDayType } = req.body;
    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      res.status(404).json({ success: false, message: 'Leave type not found' });
      return;
    }

    // 1. Calculate days excluding weekends/holidays
    let days = await calculateNetDays(from, to, companyId);
    if (days === 0) {
      res.status(400).json({ success: false, message: 'Applied dates correspond entirely to holidays or weekends' });
      return;
    }
    if (halfDay) {
      days = days * 0.5;
    }

    // 2. Check balance
    const year = new Date(from).getFullYear();
    let balance = await LeaveBalance.findOne({ employeeId, companyId, leaveTypeId, year });
    if (!balance && leaveType.requiresApproval) {
      // Lazy allocate balance from LeaveType maxDays
      balance = await LeaveBalance.create({
        employeeId,
        companyId,
        leaveTypeId,
        year,
        allocated: leaveType.maxDays,
        used: 0,
        pending: 0,
        available: leaveType.maxDays
      });
    }

    if (balance && balance.available < days) {
      res.status(400).json({ success: false, message: 'Insufficient leave balance' });
      return;
    }

    // 3. Initiate Leave Application
    const app = await LeaveApplication.create({
      employeeId,
      companyId,
      leaveTypeId,
      from,
      to,
      days,
      halfDay,
      halfDayType,
      reason,
      status: 'pending'
    });

    // 4. Update Balance (allocate to pending)
    if (balance) {
      balance.pending += days;
      balance.available -= days;
      await balance.save();
    }

    // 5. Trigger Workflow approvals
    const workflowDef = await WorkflowDefinition.findOne({ companyId, module: 'leave', isActive: true });
    if (workflowDef) {
      const empObj = await Employee.findOne({ employeeId, companyId });
      const managerId = empObj?.job?.reportingManagerId || 'admin';
      
      const instance = await WorkflowInstance.create({
        companyId,
        definitionId: workflowDef._id,
        entityType: 'LeaveApplication',
        entityId: app._id.toString(),
        initiatedBy: req.user?.sub || 'user_id',
        status: 'pending',
        steps: [
          {
            stepNo: 1,
            approverId: managerId,
            status: 'pending'
          }
        ]
      });

      app.workflowInstanceId = instance._id as mongoose.Types.ObjectId;
      await app.save();

      // Dispatch Notification
      await Notification.create({
        type: 'approval_request',
        title: 'Pending Leave Approval',
        message: `${req.user?.fullName} requested leave for ${days} day(s) starting ${from}.`,
        recipientId: managerId,
        companyId,
        url: `/approvals`
      });
    } else {
      // Auto-approve if no approval chain is defined
      app.status = 'approved';
      await app.save();
      if (balance) {
        balance.pending -= days;
        balance.used += days;
        await balance.save();
      }
    }

    await auditLog('LEAVE_APPLICATION_APPLIED', `Applied leave for ${days} days starting ${from}`, req);
    res.status(201).json({ success: true, data: app });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function listLeaveApplications(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const filter: Record<string, any> = { companyId };
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const apps = await LeaveApplication.find(filter)
      .populate('leaveTypeId')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: apps });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getLeaveApplication(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const app = await LeaveApplication.findOne({ _id: req.params.id, companyId })
      .populate('leaveTypeId');
    res.json({ success: true, data: app });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function actionLeaveApplication(req: Request, res: Response, approve: boolean): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const app = await LeaveApplication.findOne({ _id: req.params.id, companyId });
    if (!app) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    if (app.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Application is already finalized' });
      return;
    }

    const year = new Date(app.from).getFullYear();
    const balance = await LeaveBalance.findOne({ employeeId: app.employeeId, companyId, leaveTypeId: app.leaveTypeId, year });

    if (approve) {
      app.status = 'approved';
      if (balance) {
        balance.pending -= app.days;
        balance.used += app.days;
        await balance.save();
      }
    } else {
      app.status = 'rejected';
      if (balance) {
        balance.pending -= app.days;
        balance.available += app.days;
        await balance.save();
      }
    }

    app.actionedBy = req.user?.sub;
    app.actionedAt = new Date();
    if (req.body.comments) {
      app.comments = app.comments || [];
      app.comments.push({
        userId: req.user?.sub || 'user_id',
        userName: req.user?.fullName || 'User Name',
        comment: req.body.comments,
        createdAt: new Date()
      });
    }
    await app.save();

    // Trigger Notification to Employee
    await Notification.create({
      type: approve ? 'approval_granted' : 'approval_rejected',
      title: approve ? 'Leave Approved' : 'Leave Rejected',
      message: `Your leave request for ${app.days} day(s) from ${new Date(app.from).toDateString()} has been ${approve ? 'approved' : 'rejected'}.`,
      recipientId: app.employeeId,
      companyId,
      url: `/leave`
    });

    await auditLog(approve ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED', `Actioned leave application ID ${app._id}`, req);
    res.json({ success: true, data: app });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function approveLeave(req: Request, res: Response): Promise<void> {
  await actionLeaveApplication(req, res, true);
}

export async function rejectLeave(req: Request, res: Response): Promise<void> {
  await actionLeaveApplication(req, res, false);
}

export async function getLeaveBalance(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const employeeId = req.params.employeeId || req.user?.employeeId;
    const year = new Date().getFullYear();
    
    let balances = await LeaveBalance.find({ employeeId, companyId, year })
      .populate('leaveTypeId')
      .lean();

    if (balances.length === 0) {
      // Lazy seed default balances if empty
      const types = await LeaveType.find({ companyId });
      for (const t of types) {
        await LeaveBalance.create({
          employeeId,
          companyId,
          leaveTypeId: t._id,
          year,
          allocated: t.maxDays,
          used: 0,
          pending: 0,
          available: t.maxDays
        });
      }
      balances = await LeaveBalance.find({ employeeId, companyId, year })
        .populate('leaveTypeId')
        .lean();
    }

    res.json({ success: true, data: balances });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
