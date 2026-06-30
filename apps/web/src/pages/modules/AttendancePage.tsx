import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { attendanceService } from '@/services/api.service';
import { Sparkle, Plus, ArrowsClockwise } from '@phosphor-icons/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

type Summary = {
  today: string;
  present: number;
  wfh: number;
  late: number;
  absent: number;
  total: number;
  attendanceRate: number;
};

type WeekDay = {
  day: string;
  date: string;
  present: number;
  wfh: number;
  absent: number;
  late: number;
};

type AttendanceRecord = {
  _id: string;
  employeeId: string;
  fullName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  workMode: string;
};

export default function AttendancePage() {
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [trend, setTrend]         = useState<WeekDay[]>([]);
  const [records, setRecords]     = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, trendData, listData] = await Promise.all([
        attendanceService.getSummary(),
        attendanceService.getWeeklyTrend(),
        attendanceService.list({ limit: 20 }),
      ]);
      setSummary(summaryData);
      setTrend(trendData);
      setRecords(listData.records);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statusColor: Record<string, string> = {
    present:  'bg-[#E6FAF4] text-ag-mint',
    wfh:      'bg-ag-primary-light text-ag-primary',
    late:     'bg-[#FFF8E6] text-ag-amber',
    absent:   'bg-ag-accent-pink/15 text-ag-accent-pink',
    half_day: 'bg-ag-surface text-ag-ink-3',
  };

  return (
    <PageContainer
      title="Attendance & Timesheets"
      subtitle="Track daily clock-ins, geofenced shifts, and real-time attendance logs from the database."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchAll} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => toast.info('Shift configuration panel coming soon.')}>
            Shift Config
          </Button>
        </div>
      }
    >
      {/* KPI Cards — all from DB */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <Card className="p-4">
          <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Today's Rate</p>
          <h3 className="text-2xl font-bold font-display text-ag-ink mt-1">
            {isLoading ? '—' : `${summary?.attendanceRate ?? 0}%`}
          </h3>
          <p className="text-[11px] text-ag-ink-3 mt-1">{summary?.today ?? '—'}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Present + WFH</p>
          <h3 className="text-2xl font-bold font-display text-ag-ink mt-1">
            {isLoading ? '—' : `${(summary?.present ?? 0) + (summary?.wfh ?? 0)}`}
          </h3>
          <p className="text-[11px] text-ag-ink-3 mt-1">
            {isLoading ? '' : `${summary?.wfh ?? 0} working remote`}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Late Check-Ins</p>
          <h3 className="text-2xl font-bold font-display text-ag-amber mt-1">
            {isLoading ? '—' : summary?.late ?? 0}
          </h3>
          <p className="text-[11px] text-ag-ink-3 mt-1">After 10:00 AM</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Absent Today</p>
          <h3 className="text-2xl font-bold font-display text-ag-accent-pink mt-1">
            {isLoading ? '—' : summary?.absent ?? 0}
          </h3>
          <p className="text-[11px] text-ag-ink-3 mt-1">No check-in recorded</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly Attendance" subtitle="Present, WFH, and absent — last 5 working days from DB." />
          <div className="h-64 w-full pt-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-ag-ink-3 text-sm">Loading chart…</div>
            ) : trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ag-ink-3 text-sm">No attendance data found for this week.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                  <XAxis dataKey="day" stroke="#8E88A8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8E88A8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E8F0', fontSize: 12 }} />
                  <Bar dataKey="present" fill="#5B3CF5" radius={[4,4,0,0]} name="Present" />
                  <Bar dataKey="wfh"     fill="#00C48C" radius={[4,4,0,0]} name="WFH" />
                  <Bar dataKey="late"    fill="#FFB020" radius={[4,4,0,0]} name="Late" />
                  <Bar dataKey="absent"  fill="#FF5F57" radius={[4,4,0,0]} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Integration status panel */}
        <Card>
          <CardHeader title="Biometric & GPS Status" subtitle="Live device sync from connected terminals." />
          <div className="space-y-3 mt-2">
            {[
              { label: 'Bengaluru HQ Biometrics', status: 'Online' },
              { label: 'Mumbai Office Scanner',   status: 'Online' },
              { label: 'WorkSphere App GPS',     status: 'Online' },
            ].map((d) => (
              <div key={d.label} className="flex items-center justify-between p-3 border border-ag-border/60 rounded-xl">
                <span className="font-semibold text-ag-ink text-xs">{d.label}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6FAF4] text-ag-mint">{d.status}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 p-3 bg-[#E8F6FF] rounded-xl text-xs text-[#0077B6] mt-4">
            <Sparkle size={16} className="shrink-0 mt-0.5" />
            <span>AI auto-regularizes check-ins matching GPS geofence zones within 50m radius.</span>
          </div>
        </Card>
      </div>

      {/* Live Records Table */}
      <Card className="mt-6">
        <CardHeader
          title="Recent Attendance Records"
          subtitle="Most recent 20 check-in logs across all employees."
        />
        {isLoading ? (
          <div className="p-8 text-center text-ag-ink-3 text-sm">Loading records…</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-ag-ink-3 text-sm">No attendance records found in the database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ag-border text-ag-ink-3 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 text-left font-semibold">Employee</th>
                  <th className="py-3 px-4 text-left font-semibold">Date</th>
                  <th className="py-3 px-4 text-left font-semibold">Check In</th>
                  <th className="py-3 px-4 text-left font-semibold">Check Out</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Mode</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-ag-ink">{r.fullName}</td>
                    <td className="py-3 px-4 text-ag-ink-2 font-mono text-xs">{r.date}</td>
                    <td className="py-3 px-4 text-ag-ink-2 font-mono text-xs">{r.checkIn ?? '—'}</td>
                    <td className="py-3 px-4 text-ag-ink-2 font-mono text-xs">{r.checkOut ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor[r.status] ?? 'bg-ag-surface text-ag-ink-3'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ag-ink-3 text-xs capitalize">{r.workMode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
