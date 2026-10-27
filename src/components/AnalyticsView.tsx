import React from 'react';
import { Student, Period, AttendanceRecord, ParentNotification } from '../types/attendance';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Send,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Calendar
} from 'lucide-react';

interface AnalyticsViewProps {
  students: Student[];
  periods: Period[];
  attendanceRecords: AttendanceRecord[];
  notifications: ParentNotification[];
  currentDate: string;
  onSendCustomSms?: (student: Student) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  periods,
  attendanceRecords,
  notifications,
  currentDate,
  onSendCustomSms,
}) => {
  // Period attendance analysis
  const periodStats = periods.map((period) => {
    const records = attendanceRecords.filter(
      (r) => r.periodId === period.id && r.date === currentDate
    );
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const rate = students.length > 0 ? Math.round((present / students.length) * 100) : 0;
    return {
      period,
      present,
      absent,
      rate,
      total: students.length,
    };
  });

  // Students below 75% attendance threshold
  const atRiskStudents = students.filter(
    (s) => (s.overallAttendanceRate || 85) < 75
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Academic Attendance Insights
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Date: <span className="text-slate-900 font-bold">{currentDate}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Attendance Trends & Parent Alert Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring daily compliance, biometric recognition ratios, and automated SMS deliveries.
          </p>
        </div>
      </div>

      {/* Period-by-Period Bar Chart Visualizer */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Today's Attendance Rate by Period
          </h3>
          <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
            Target: &gt; 75%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {periodStats.map(({ period, present, absent, rate }) => (
            <div
              key={period.id}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    Period {period.number}
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">
                    {period.subject}
                  </h4>
                  <p className="text-[10px] text-slate-500">{period.startTime} - {period.endTime}</p>
                </div>
                <span
                  className={`text-sm font-extrabold font-mono px-2 py-0.5 rounded-lg border ${
                    rate >= 75
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {rate}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${rate}%` }}
                  title={`Present: ${present}`}
                ></div>
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${Math.round((absent / (students.length || 1)) * 100)}%` }}
                  title={`Absent: ${absent}`}
                ></div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {present} Present
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> {absent} Absent
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Attendance Watchlist (< 75%) */}
      <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Critical Attendance Watchlist (Below 75% University Threshold)
            </h3>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 font-mono">
            {atRiskStudents.length} Students At Risk
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Students below 75% attendance are not eligible to sit for university semester examinations without a condonation waiver. Automated parent alerts notify guardians before debarment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {atRiskStudents.map((student) => (
            <div
              key={student.id}
              className="bg-rose-50/40 p-4 rounded-2xl border border-rose-200/90 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-rose-300 shadow-xs"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    {student.name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500">
                    {student.rollNumber} • Parent: <strong className="text-slate-700">{student.parentName}</strong>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold font-mono text-rose-600">
                  {student.overallAttendanceRate}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono font-medium">
                  {student.parentPhone}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
