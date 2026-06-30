import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance.model';

// GET /api/attendance?date=YYYY-MM-DD&page=1&limit=20
export async function getAttendance(req: Request, res: Response): Promise<void> {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const date  = String(req.query.date || '').trim();
    const companyId = req.user?.companyId || 'company_01';

    const filter: Record<string, unknown> = { companyId };
    if (date) filter['date'] = date;

    // Employees can only retrieve their own logs
    if (req.user?.role === 'employee') {
      filter['employeeId'] = req.user.employeeId;
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1, checkIn: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Attendance.countDocuments(filter),
    ]);

    res.json({ success: true, data: { records, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get attendance' });
  }
}

// GET /api/attendance/summary — KPIs for today
export async function getAttendanceSummary(req: Request, res: Response): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const companyId = req.user?.companyId || 'company_01';

    const [present, wfh, late, absent, total] = await Promise.all([
      Attendance.countDocuments({ date: today, status: 'present', companyId }),
      Attendance.countDocuments({ date: today, status: 'wfh', companyId }),
      Attendance.countDocuments({ date: today, status: 'late', companyId }),
      Attendance.countDocuments({ date: today, status: 'absent', companyId }),
      Attendance.countDocuments({ date: today, companyId }),
    ]);

    const attendanceRate = total > 0 ? ((present + wfh) / total) * 100 : 0;

    res.json({
      success: true,
      data: {
        today,
        present,
        wfh,
        late,
        absent,
        total,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get attendance summary' });
  }
}

// GET /api/attendance/weekly — last 7 days aggregated for bar chart
export async function getWeeklyTrend(req: Request, res: Response): Promise<void> {
  try {
    const days: { day: string; date: string; present: number; wfh: number; absent: number; late: number }[] = [];
    const companyId = req.user?.companyId || 'company_01';

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });

      const [present, wfh, absent, late] = await Promise.all([
        Attendance.countDocuments({ date: dateStr, status: 'present', companyId }),
        Attendance.countDocuments({ date: dateStr, status: 'wfh', companyId }),
        Attendance.countDocuments({ date: dateStr, status: 'absent', companyId }),
        Attendance.countDocuments({ date: dateStr, status: 'late', companyId }),
      ]);

      days.push({ day: dayLabel, date: dateStr, present, wfh, absent, late });
    }

    res.json({ success: true, data: days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get weekly trend' });
  }
}

// POST /api/attendance/checkin — record check-in for logged-in employee
export async function checkIn(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const employeeId = req.user?.role === 'employee' ? req.user.employeeId : req.body.employeeId;
    const fullName = req.user?.role === 'employee' ? req.user.fullName : req.body.fullName;
    const { workMode } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

    const isLate  = now.getHours() >= 10;
    const status  = isLate ? 'late' : workMode === 'remote' ? 'wfh' : 'present';

    const existing = await Attendance.findOne({ employeeId, date: today, companyId });
    if (existing) {
      res.status(409).json({ success: false, message: 'Already checked in for today.' });
      return;
    }

    const record = await Attendance.create({ employeeId, companyId, fullName, date: today, checkIn: checkInTime, status, workMode });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Check-in failed' });
  }
}

// PATCH /api/attendance/:id/checkout
export async function checkOut(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId || 'company_01';
    const now = new Date();
    const checkOutTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

    const record = await Attendance.findOneAndUpdate({ _id: id, companyId }, { checkOut: checkOutTime }, { new: true });
    if (!record) {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }

    res.json({ success: true, data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Check-out failed' });
  }
}
