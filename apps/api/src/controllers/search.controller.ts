import { Request, Response } from 'express';
import { Employee } from '../models/Employee.model';
import { PayrollRun } from '../models/PayrollRun.model';

// GET /api/search?q=...
export async function search(req: Request, res: Response): Promise<void> {
  try {
    const q = String(req.query.q || '').trim();

    if (!q || q.length < 2) {
      res.json({ success: true, data: { employees: [], payroll: [], attendance: [], documents: [], total: 0 } });
      return;
    }

    const companyId = req.user?.companyId || 'company_01';

    const [employees, payrollRuns] = await Promise.all([
      Employee.find(
        { $text: { $search: q }, isArchived: false, companyId },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .select('employeeId fullName job.designationName official.status personal.photo')
        .lean(),

      req.user?.role === 'employee'
        ? Promise.resolve([]) // employees cannot search payroll runs
        : PayrollRun.find({
            period: { $regex: q, $options: 'i' },
            companyId,
          })
            .limit(3)
            .lean(),
    ]);

    const empResults = employees.map((e: any) => ({
      type:     'employee',
      id:       e._id?.toString(),
      title:    e.fullName,
      subtitle: `${e.job?.designationName ?? ''} · ${e.employeeId}`,
      badge:    e.official?.status,
      photo:    e.personal?.photo,
      url:      `/employees/${e._id}`,
    }));

    const payrollResults = payrollRuns.map((r: any) => ({
      type:     'payroll',
      id:       r._id?.toString(),
      title:    `${r.period} Payroll Run`,
      subtitle: `${r.totalEmployees} employees · ₹${(r.totalNetPay / 100000).toFixed(1)}L net`,
      badge:    r.status,
      url:      `/payroll/runs/${r._id}`,
    }));

    res.json({
      success: true,
      data: {
        employees:  empResults,
        payroll:    payrollResults,
        attendance: [],
        documents:  [],
        total:      empResults.length + payrollResults.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
}
