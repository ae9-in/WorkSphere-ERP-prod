import { Request, Response } from 'express';
import { Employee } from '../models/Employee.model';
import { PayrollRun } from '../models/PayrollRun.model';
import { Approval } from '../models/Approval.model';
import { Attendance } from '../models/Attendance.model';

// GET /api/dashboard/kpis
export async function getKPIs(req: Request, res: Response): Promise<void> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const companyId = req.user?.companyId || 'company_01';

    const [
      totalEmployees,
      activeEmployees,
      newJoinees,
      exitingThisMonth,
      onLeaveToday,
      pendingApprovals,
    ] = await Promise.all([
      Employee.countDocuments({ isArchived: false, companyId }),
      Employee.countDocuments({ isArchived: false, 'official.status': 'active', companyId }),
      Employee.countDocuments({
        isArchived: false,
        companyId,
        'official.dateOfJoining': {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        },
      }),
      Employee.countDocuments({
        isArchived: false,
        'official.status': 'notice_period',
        companyId,
      }),
      Employee.countDocuments({
        isArchived: false,
        'official.status': 'on_leave',
        companyId,
      }),
      Approval.countDocuments({ status: 'pending', companyId }),
    ]);

    // Check if latest payroll is processed
    const latestPayroll = await PayrollRun.findOne({ companyId }).sort({ createdAt: -1 });

    // Calculate real attendance rate from the most recent logging date
    const latestAttendanceRecord = await Attendance.findOne({ companyId }).sort({ date: -1 });
    let attendanceRate = 100;
    if (latestAttendanceRecord) {
      const targetDate = latestAttendanceRecord.date;
      const [presentAndLate, wfh, total] = await Promise.all([
        Attendance.countDocuments({ date: targetDate, status: { $in: ['present', 'late'] }, companyId }),
        Attendance.countDocuments({ date: targetDate, status: 'wfh', companyId }),
        Attendance.countDocuments({ date: targetDate, companyId }),
      ]);
      if (total > 0) {
        attendanceRate = Math.round(((presentAndLate + wfh) / total) * 100 * 10) / 10;
      }
    }

    // Dynamic upcoming birthdays count
    const employees = await Employee.find({
      isArchived: false,
      companyId,
      'personal.dateOfBirth': { $exists: true, $ne: '' },
    }).select('personal.dateOfBirth').lean();
    
    const now = new Date();
    const upcomingBirthdays = employees.filter((e) => {
      const dob = new Date((e as any).personal?.dateOfBirth ?? '');
      if (isNaN(dob.getTime())) return false;
      const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      const diffDays = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        newJoinees,
        exitingThisMonth,
        onLeaveToday,
        openPositions:     9,
        payrollProcessed:  latestPayroll ? ['approved', 'paid'].includes(latestPayroll.status) : false,
        latestPayrollAmount: latestPayroll ? latestPayroll.totalNetPay : 0,
        latestPayrollPeriod: latestPayroll ? latestPayroll.period : 'None',
        attendanceRate,
        pendingApprovals,
        upcomingBirthdays,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load KPIs' });
  }
}

// GET /api/dashboard/dept-distribution
export async function getDeptDistribution(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const COLORS: Record<string, string> = {
      'Engineering':     '#5B3CF5',
      'Product':         '#00C48C',
      'Sales':           '#FFB020',
      'Marketing':       '#2BB5FF',
      'Finance':         '#FF4C8B',
      'Human Resources': '#3D3BF3',
      'Design':          '#FF5F57',
      'Operations':      '#8E88A8',
    };

    const data = await Employee.aggregate([
      { $match: { isArchived: false, companyId } },
      { $group: { _id: '$job.departmentName', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]);

    const result = data.map((d) => ({
      name:  d._id || 'Others',
      value: d.value,
      color: COLORS[d._id] ?? '#C4BBFF',
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get dept distribution' });
  }
}

// GET /api/dashboard/headcount-trend
export async function getHeadcountTrend(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    // Build last 12 months from real employee join dates
    const months: { month: string; count: number; joiners: number; exiters: number }[] = [];

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const startStr = d.toISOString().split('T')[0];
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const endStr = endDate.toISOString().split('T')[0];

      const [count, joiners] = await Promise.all([
        Employee.countDocuments({
          isArchived: false,
          companyId,
          'official.dateOfJoining': { $lte: endStr },
        }),
        Employee.countDocuments({
          companyId,
          'official.dateOfJoining': { $gte: startStr, $lte: endStr },
        }),
      ]);

      months.push({ month: label, count, joiners, exiters: 0 });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get headcount trend' });
  }
}

// GET /api/dashboard/activities
export async function getActivities(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    // Build activity feed from recently joined employees
    const recentJoiners = await Employee.find({ isArchived: false, companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName job.designationName createdAt')
      .lean();

    const activities = recentJoiners.map((e, idx) => ({
      id:     String(idx + 1),
      type:   'join',
      actor:  e.fullName,
      action: `joined as ${(e as any).job?.designationName ?? 'Employee'}`,
      time:   formatTimeAgo(new Date((e as any).createdAt)),
      icon:   '🎉',
    }));

    res.json({ success: true, data: activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get activities' });
  }
}

// GET /api/dashboard/birthdays
export async function getBirthdays(req: Request, res: Response): Promise<void> {
  try {
    const now   = new Date();
    const companyId = req.user?.companyId || 'company_01';

    // Find employees whose birthday month/day is within next 7 days
    const employees = await Employee.find({
      isArchived: false,
      companyId,
      'personal.dateOfBirth': { $exists: true, $ne: '' },
    })
      .select('employeeId fullName personal.dateOfBirth job.departmentName')
      .lean();

    const upcoming = employees
      .map((e) => {
        const dob = new Date((e as any).personal?.dateOfBirth ?? '');
        if (isNaN(dob.getTime())) return null;

        const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        const diffDays = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0 || diffDays > 7) return null;

        return {
          employeeId: (e as any).employeeId,
          name:       (e as any).fullName,
          date:       diffDays === 0 ? 'Today' : birthdayThisYear.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          dept:       (e as any).job?.departmentName ?? 'Unknown',
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: upcoming });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get birthdays' });
  }
}

function formatTimeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export async function getPublicStats(req: Request, res: Response): Promise<void> {
  try {
    const totalEmployees = await Employee.countDocuments();
    const employees = await Employee.find({}, 'salary.ctc');
    const totalPayrollMonthlyVal = employees.reduce((acc, emp) => acc + (emp.salary?.ctc || 0) / 12, 0);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        totalMonthlyPayroll: Math.round(totalPayrollMonthlyVal),
        platformUptime: 99.999,
        complianceJurisdictions: totalEmployees > 0 ? 5 : 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
