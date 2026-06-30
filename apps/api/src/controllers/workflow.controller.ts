import { Request, Response } from 'express';
import { WorkflowInstance } from '../models/WorkflowInstance.model';
import { WorkflowDefinition } from '../models/WorkflowDefinition.model';
import { LeaveApplication } from '../models/LeaveApplication.model';
import { LeaveBalance } from '../models/LeaveBalance.model';
import { Notification } from '../models/Notification.model';
import { auditLog } from '../middleware/audit.middleware';

export async function getPendingApprovals(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const userId = req.user?.employeeId || req.user?.sub || 'user_id';
    
    // Find all pending workflow instances where current step has approverId matching this user
    const instances = await WorkflowInstance.find({
      companyId,
      status: 'pending',
      'steps': {
        $elemMatch: {
          approverId: userId,
          status: 'pending'
        }
      }
    }).lean();

    // Map instances to their respective details (e.g. LeaveApplications)
    const pendingList = [];
    for (const inst of instances) {
      if (inst.entityType === 'LeaveApplication') {
        const app = await LeaveApplication.findById(inst.entityId)
          .populate('leaveTypeId')
          .lean();
        if (app) {
          pendingList.push({
            workflowInstanceId: inst._id,
            entityType: inst.entityType,
            entityId: inst.entityId,
            initiatedBy: inst.initiatedBy,
            details: app,
            createdAt: inst.createdAt
          });
        }
      }
    }

    res.json({ success: true, data: pendingList });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function actionWorkflowInstance(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const userId = req.user?.employeeId || req.user?.sub || 'user_id';
    const { id } = req.params;
    const { action, comments } = req.body; // 'approve' | 'reject'

    const instance = await WorkflowInstance.findOne({ _id: id, companyId });
    if (!instance) {
      res.status(404).json({ success: false, message: 'Workflow instance not found' });
      return;
    }

    const currentStepIndex = instance.currentStep - 1;
    const step = instance.steps[currentStepIndex];

    if (!step || step.approverId !== userId || step.status !== 'pending') {
      res.status(403).json({ success: false, message: 'Unauthorized action on this workflow step' });
      return;
    }

    if (action === 'reject') {
      step.status = 'rejected';
      step.actionedAt = new Date();
      step.comments = comments;
      instance.status = 'rejected';
      await instance.save();

      // Finalize entity status to 'rejected'
      if (instance.entityType === 'LeaveApplication') {
        const app = await LeaveApplication.findById(instance.entityId);
        if (app) {
          app.status = 'rejected';
          await app.save();

          // Return leave balance
          const year = new Date(app.from).getFullYear();
          const balance = await LeaveBalance.findOne({ employeeId: app.employeeId, companyId, leaveTypeId: app.leaveTypeId, year });
          if (balance) {
            balance.pending -= app.days;
            balance.available += app.days;
            await balance.save();
          }

          // Notify employee
          await Notification.create({
            type: 'approval_rejected',
            title: 'Leave Request Rejected',
            message: `Your leave request for ${app.days} day(s) has been rejected by the manager.`,
            recipientId: app.employeeId,
            companyId,
            url: '/leave'
          });
        }
      }

      await auditLog('WORKFLOW_REJECTED', `Rejected workflow instance ${id}`, req);
      res.json({ success: true, data: instance });
      return;
    }

    // Otherwise approve step
    step.status = 'approved';
    step.actionedAt = new Date();
    step.comments = comments;

    // Check if there's a next step
    const definition = await WorkflowDefinition.findById(instance.definitionId);
    const hasNextStep = definition && definition.steps.length > instance.currentStep;

    if (hasNextStep && definition) {
      instance.currentStep += 1;
      const nextDef = definition.steps[instance.currentStep - 1];
      // Simple assignment of next approver, reporting manager or role etc.
      const nextApproverId = nextDef.approverId || 'admin';
      
      instance.steps.push({
        stepNo: instance.currentStep,
        approverId: nextApproverId,
        status: 'pending'
      });
      await instance.save();

      // Notify next approver
      await Notification.create({
        type: 'approval_request',
        title: 'Pending Approval Request',
        message: `A workflow instance requires your approval review.`,
        recipientId: nextApproverId,
        companyId,
        url: '/approvals'
      });
    } else {
      // Finalize approved status
      instance.status = 'approved';
      await instance.save();

      if (instance.entityType === 'LeaveApplication') {
        const app = await LeaveApplication.findById(instance.entityId);
        if (app) {
          app.status = 'approved';
          await app.save();

          // Finalize leave balance allocation
          const year = new Date(app.from).getFullYear();
          const balance = await LeaveBalance.findOne({ employeeId: app.employeeId, companyId, leaveTypeId: app.leaveTypeId, year });
          if (balance) {
            balance.pending -= app.days;
            balance.used += app.days;
            await balance.save();
          }

          // Notify employee
          await Notification.create({
            type: 'approval_granted',
            title: 'Leave Request Approved',
            message: `Your leave request for ${app.days} day(s) has been fully approved!`,
            recipientId: app.employeeId,
            companyId,
            url: '/leave'
          });
        }
      }
    }

    await auditLog('WORKFLOW_APPROVED', `Approved step of workflow instance ${id}`, req);
    res.json({ success: true, data: instance });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function delegateWorkflowInstance(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const userId = req.user?.employeeId || req.user?.sub || 'user_id';
    const { id } = req.params;
    const { toUserId } = req.body;

    const instance = await WorkflowInstance.findOne({ _id: id, companyId });
    if (!instance) {
      res.status(404).json({ success: false, message: 'Workflow instance not found' });
      return;
    }

    const currentStepIndex = instance.currentStep - 1;
    const step = instance.steps[currentStepIndex];

    if (!step || step.approverId !== userId || step.status !== 'pending') {
      res.status(403).json({ success: false, message: 'Unauthorized delegation action' });
      return;
    }

    step.status = 'delegated';
    step.actionedAt = new Date();
    step.comments = `Delegated to ${toUserId}`;

    // Add new step assigned to delegation target
    instance.steps.push({
      stepNo: instance.currentStep,
      approverId: toUserId,
      status: 'pending'
    });
    await instance.save();

    await Notification.create({
      type: 'approval_request',
      title: 'Delegated Approval Request',
      message: `A workflow approval task has been delegated to you.`,
      recipientId: toUserId,
      companyId,
      url: '/approvals'
    });

    await auditLog('WORKFLOW_DELEGATED', `Delegated workflow ${id} to user ${toUserId}`, req);
    res.json({ success: true, data: instance });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
