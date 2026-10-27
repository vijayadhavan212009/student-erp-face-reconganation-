import React, { useState } from 'react';
import { Student, Period, AttendanceRecord, AttendanceStatus, ParentNotification } from '../types/attendance';
import { generateWhatsAppLink, generateSmsLink } from '../utils/smsHelper';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Download,
  Send,
  MessageSquare,
  Phone,
  Smartphone,
  Check,
  AlertCircle,
  RotateCcw,
  Edit2,
  X,
  ExternalLink
} from 'lucide-react';

interface AttendanceSheetProps {
  students: Student[];
  periods: Period[];
  currentPeriod: Period;
  onSelectPeriod: (p: Period) => void;
  currentDate: string;
  onSelectDate: (d: string) => void;
  attendanceRecords: AttendanceRecord[];
  notifications: ParentNotification[];
  onMarkAttendance: (
    studentId: string,
    status: AttendanceStatus,
    method: 'face_recognition' | 'manual_override' | 'automated_absent'
  ) => void;
  onFinalizePeriodAbsentees: () => void;
  onViewParentSimulator: (n: ParentNotification) => void;
  onResetPeriod: () => void;
  onUpdateStudent: (s: Student) => void;
  onOpenEditStudentModal?: (studentId?: string) => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  students,
  periods,
  currentPeriod,
  onSelectPeriod,
  currentDate,
  onSelectDate,
  attendanceRecords,
  notifications,
  onMarkAttendance,
  onFinalizePeriodAbsentees,
  onViewParentSimulator,
  onResetPeriod,
  onUpdateStudent,
  onOpenEditStudentModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Inline edit state for student name and parent phone
  const [editingField, setEditingField] = useState<{
    studentId: string;
    field: 'name' | 'phone';
    value: string;
  } | null>(null);

  // Filter attendance records for current period and date
  const periodRecords = attendanceRecords.filter(
    (r) => r.periodId === currentPeriod.id && r.date === currentDate
  );

  const getStudentRecord = (studentId: string) => {
    return periodRecords.find((r) => r.studentId === studentId);
  };

  const getStudentNotification = (studentId: string) => {
    return notifications.find(
      (n) => n.studentId === studentId && n.periodId === currentPeriod.id && n.date === currentDate
    );
  };

  // Metrics
  const presentCount = periodRecords.filter((r) => r.status === 'present').length;
  const absentCount = periodRecords.filter((r) => r.status === 'absent').length;
  const lateCount = periodRecords.filter((r) => r.status === 'late').length;
  const excusedCount = periodRecords.filter((r) => r.status === 'excused').length;
  const pendingCount = students.length - periodRecords.length;

  // Filter students based on search and status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentPhone.includes(searchQuery);

    if (!matchesSearch) return false;

    const record = getStudentRecord(student.id);
    const status = record ? record.status : 'pending';

    if (filterStatus === 'all') return true;
    return status === filterStatus;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Gender',
      'Relationship',
      'Department',
      'Semester',
      'Period',
      'Date',
      'Attendance Status',
      'Verification Method',
      'Confidence',
      'Parent Name',
      'Parent Phone',
      'SMS Alert Status',
    ];

    const rows = students.map((student) => {
      const record = getStudentRecord(student.id);
      const notif = getStudentNotification(student.id);
      return [
        `"${student.rollNumber}"`,
        `"${student.name}"`,
        `"${student.gender}"`,
        `"${student.relationship}"`,
        `"${student.department}"`,
        `"${student.semester}"`,
        `"${currentPeriod.name}"`,
        `"${currentDate}"`,
        `"${record ? record.status.toUpperCase() : 'PENDING'}"`,
        `"${record ? record.verificationMethod : 'N/A'}"`,
        `"${record?.confidenceScore ? record.confidenceScore + '%' : 'N/A'}"`,
        `"${student.parentName}"`,
        `"${student.parentPhone}"`,
        `"${notif ? 'DISPATCHED' : record?.status === 'absent' ? 'LOGGED' : 'N/A'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Attendance_${currentPeriod.code}_${currentDate.replace(/-/g, '')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* College Project Helper Strip */}
      <div className="bg-white border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
          <span className="text-slate-700 font-medium leading-relaxed">
            <strong className="text-indigo-900 font-bold">College Mini-Project Review Verification:</strong> You can edit any student's name, Face ID, and parent mobile number to your own number or friend's number to test real absence SMS & WhatsApp notifications.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onOpenEditStudentModal && (
            <button
              onClick={() => onOpenEditStudentModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Configure Student & Phone
            </button>
          )}
        </div>
      </div>

      {/* Top Controls: Period selector, Date, Metrics */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Period selector tabs */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Class Period
            </span>
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => {
                const isSelected = p.id === currentPeriod.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPeriod(p)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Period {p.number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker & Reset */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Attendance Date
              </span>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-600 font-mono shadow-xs"
              />
            </div>

            <button
              onClick={onResetPeriod}
              className="mt-5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="Reset Period Attendance"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Period Details Header */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-extrabold text-slate-900 text-sm">{currentPeriod.name}</span>
            <span className="text-slate-500 ml-2">
              ({currentPeriod.code}) · {currentPeriod.faculty} · <strong className="text-indigo-600 font-semibold">{currentPeriod.room}</strong>
            </span>
          </div>
          <div className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 inline-block self-start md:self-auto">
            {currentPeriod.startTime} - {currentPeriod.endTime}
          </div>
        </div>
      </div>

      {/* Metrics Row (Mixed Colors Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Students</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums font-mono">{students.length}</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-emerald-800 uppercase font-semibold">Present (Verified)</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums font-mono">
            {presentCount} <span className="text-xs font-semibold text-emerald-600">({Math.round((presentCount / (students.length || 1)) * 100)}%)</span>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-rose-800 uppercase font-semibold">Absent (SMS Alert)</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1 tabular-nums font-mono">
            {absentCount}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-amber-800 uppercase font-semibold">Pending Scans</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1 tabular-nums font-mono">
            {pendingCount}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-blue-800 uppercase font-semibold">Late / Excused</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1 tabular-nums font-mono">
            {lateCount + excusedCount}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-purple-800 uppercase font-semibold">Parent SMS Logs</div>
          <div className="text-2xl font-extrabold text-purple-700 mt-1 tabular-nums font-mono">
            {notifications.filter((n) => n.periodId === currentPeriod.id && n.date === currentDate).length}
          </div>
        </div>
      </div>

      {/* Main Actions Bar & Filter */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, roll no, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['all', 'present', 'absent', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Edit, Finalize Absentees & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {onOpenEditStudentModal && (
            <button
              onClick={() => onOpenEditStudentModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Student Name & Parent Phone
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={onFinalizePeriodAbsentees}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Finalize & Send SMS to Absent Parents
          </button>
        </div>
      </div>

      {/* Student Attendance Roster Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Student & Biometric Face ID</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Period Status</th>
                <th className="py-3.5 px-4">Verification Method</th>
                <th className="py-3.5 px-4">Parent Phone (Editable)</th>
                <th className="py-3.5 px-4 text-center">SMS Alert Channel</th>
                <th className="py-3.5 px-4 text-right">Actions & Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No students match the current query or filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const record = getStudentRecord(student.id);
                  const notification = getStudentNotification(student.id);
                  const currentStatus: AttendanceStatus | 'pending' = record ? record.status : 'pending';

                  const absentText = `Apex Institute: Dear Parent, your ${student.gender === 'female' ? 'daughter' : 'son'} ${student.name} has been absent for ${currentPeriod.name}.`;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition ${
                        currentStatus === 'absent' ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Student info with inline name editing */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatarUrl}
                            alt={student.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 flex-shrink-0 cursor-pointer shadow-xs"
                            onClick={() => onOpenEditStudentModal && onOpenEditStudentModal(student.id)}
                            title="Click to edit student photo / Face ID"
                          />
                          <div>
                            {editingField?.studentId === student.id && editingField.field === 'name' ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingField.value}
                                  onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                  className="bg-white border-2 border-indigo-500 rounded-lg px-2 py-0.5 text-xs text-slate-900 font-bold w-40 shadow-xs focus:outline-hidden"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    if (editingField.value.trim()) {
                                      onUpdateStudent({ ...student, name: editingField.value.trim() });
                                    }
                                    setEditingField(null);
                                  }}
                                  className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                                  title="Save Name"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingField(null)}
                                  className="p-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                                <span>{student.name}</span>
                                <button
                                  onClick={() => setEditingField({ studentId: student.id, field: 'name', value: student.name })}
                                  className="text-slate-400 hover:text-indigo-600 transition p-0.5 cursor-pointer"
                                  title="Quick Inline Edit Student Name"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500">
                              {student.gender === 'female' ? 'Daughter' : 'Son'} · {student.department}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roll number */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 tabular-nums">
                        {student.rollNumber}
                      </td>

                      {/* Period Status Badge */}
                      <td className="py-3.5 px-4">
                        {currentStatus === 'present' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present
                          </span>
                        )}
                        {currentStatus === 'absent' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Absent
                          </span>
                        )}
                        {currentStatus === 'late' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Late
                          </span>
                        )}
                        {currentStatus === 'excused' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Excused
                          </span>
                        )}
                        {currentStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Not Marked
                          </span>
                        )}
                      </td>

                      {/* Verification method */}
                      <td className="py-3.5 px-4">
                        {record ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              {record.verificationMethod === 'face_recognition' ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Face AI ({record.confidenceScore || 95}%)</span>
                                </>
                              ) : record.verificationMethod === 'automated_absent' ? (
                                <span className="text-rose-600">Auto Absent (Period End)</span>
                              ) : (
                                <span>Manual Override</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                              {new Date(record.markedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Awaiting scan</span>
                        )}
                      </td>

                      {/* Parent Contact Card with Quick Inline Phone Edit */}
                      <td className="py-3.5 px-4">
                        {editingField?.studentId === student.id && editingField.field === 'phone' ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingField.value}
                              onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                              placeholder="+91..."
                              className="bg-white border-2 border-emerald-500 rounded-lg px-2 py-0.5 text-xs text-emerald-800 font-mono font-bold w-40 shadow-xs focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (editingField.value.trim()) {
                                  onUpdateStudent({ ...student, parentPhone: editingField.value.trim() });
                                }
                                setEditingField(null);
                              }}
                              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                              title="Save Phone"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="p-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-900">
                              {student.parentName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 font-bold mt-0.5 tabular-nums">
                              <span>{student.parentPhone}</span>
                              <button
                                onClick={() => setEditingField({ studentId: student.id, field: 'phone', value: student.parentPhone })}
                                className="text-slate-400 hover:text-emerald-600 transition p-0.5 cursor-pointer"
                                title="Quick Inline Edit Parent Phone Number"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* SMS Alert Status & Direct Link */}
                      <td className="py-3.5 px-4 text-center">
                        {notification ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onViewParentSimulator(notification)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold shadow-xs transition"
                              title="View incoming SMS preview on Parent Phone Simulator"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                              <span>View SMS</span>
                            </button>

                            <a
                              href={generateWhatsAppLink(student.parentPhone, notification.messageText)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                              title="Send WhatsApp Message directly to parent"
                            >
                              <Send className="w-3 h-3" />
                            </a>
                          </div>
                        ) : currentStatus === 'absent' ? (
                          <div className="flex items-center justify-center gap-1">
                            <a
                              href={generateWhatsAppLink(student.parentPhone, absentText)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs transition"
                              title="Send WhatsApp Absence Message"
                            >
                              <Send className="w-2.5 h-2.5" /> WhatsApp
                            </a>
                            <a
                              href={generateSmsLink(student.parentPhone, absentText)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[10px]"
                              title="Open in native SMS app"
                            >
                              <Smartphone className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Quick Attendance Toggle & Edit Modal button */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dedicated Edit Student Button */}
                          {onOpenEditStudentModal && (
                            <button
                              onClick={() => onOpenEditStudentModal(student.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition cursor-pointer"
                              title="Edit Student Name, Face ID & Parent Number"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              onMarkAttendance(
                                student.id,
                                currentStatus === 'present' ? 'absent' : 'present',
                                'manual_override'
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : currentStatus === 'absent'
                                ? 'bg-rose-600 text-white hover:bg-rose-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {currentStatus === 'present'
                              ? 'Present'
                              : currentStatus === 'absent'
                              ? 'Absent'
                              : 'Mark'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
