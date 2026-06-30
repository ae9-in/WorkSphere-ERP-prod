// ─────────────────────────────────────────────
// Attendance Types
// ─────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'work_from_home' | 'on_leave' | 'holiday' | 'week_off';

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  workedHours?: number;
  overtime?: number;
  shiftId?: string;
  source: 'biometric' | 'manual' | 'mobile' | 'web';
  isRegularized: boolean;
  regularizationReason?: string;
  remarks?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  halfDay: number;
  wfh: number;
  leaves: number;
  holidays: number;
  weekOffs: number;
  lopDays: number;
}

export interface Shift {
  _id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  graceMinutes: number;
  isFlexible: boolean;
  isNightShift: boolean;
}

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  type: 'national' | 'regional' | 'optional' | 'restricted';
  applicableTo?: string[];
}
