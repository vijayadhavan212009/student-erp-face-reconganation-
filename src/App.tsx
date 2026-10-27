import React, { useState, useEffect } from 'react';
import {
  Student,
  Period,
  AttendanceRecord,
  AttendanceStatus,
  ParentNotification,
  SMSTemplateConfig,
} from './types/attendance';
import { INITIAL_STUDENTS, INITIAL_PERIODS, DEFAULT_SMS_CONFIG } from './data/mockData';
import { formatParentAbsentMessage } from './utils/smsHelper';
import { soundManager } from './utils/soundEffects';
import { Navbar } from './components/Navbar';
import { FaceScanner } from './components/FaceScanner';
import { AttendanceSheet } from './components/AttendanceSheet';
import { ParentSMSOutbox } from './components/ParentSMSOutbox';
import { StudentManagement } from './components/StudentManagement';
import { AnalyticsView } from './components/AnalyticsView';
import { ParentPhoneSimulator } from './components/ParentPhoneSimulator';
import { QuickEditStudentModal } from './components/QuickEditStudentModal';
import { CheckCircle2, AlertTriangle, Send, X, Smartphone, Edit2 } from 'lucide-react';

export default function App() {
  // Quick Edit Modal state
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [quickEditStudentId, setQuickEditStudentId] = useState<string | undefined>(undefined);
  // Initialize state with localStorage persistence
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('smartpresence_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [periods] = useState<Period[]>(INITIAL_PERIODS);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(INITIAL_PERIODS[0]);

  const [currentDate, setCurrentDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('smartpresence_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<ParentNotification[]>(() => {
    const saved = localStorage.getItem('smartpresence_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [smsConfig, setSmsConfig] = useState<SMSTemplateConfig>(() => {
    const saved = localStorage.getItem('smartpresence_sms_config');
    return saved ? JSON.parse(saved) : DEFAULT_SMS_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'scanner' | 'sheet' | 'outbox' | 'students' | 'analytics'>('scanner');
  const [simulatedNotification, setSimulatedNotification] = useState<ParentNotification | null>(null);
  const [bannerAlert, setBannerAlert] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('smartpresence_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('smartpresence_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('smartpresence_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('smartpresence_sms_config', JSON.stringify(smsConfig));
  }, [smsConfig]);

  // Toast banner trigger
  const showToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setBannerAlert({ message, type });
    setTimeout(() => {
      setBannerAlert(null);
    }, 4500);
  };

  /**
   * Helper to dispatch an automated absence SMS alert to the student's parent
   */
  const dispatchParentAbsentAlert = async (
    student: Student,
    period: Period,
    dateStr: string
  ): Promise<ParentNotification> => {
    const messageText = formatParentAbsentMessage(student, period, dateStr, smsConfig);

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          gender: student.gender,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          periodName: period.name,
          date: dateStr,
          messageText,
          channel: 'sms',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.notification;
      }
    } catch (e) {
      console.warn('Backend SMS route unreachable, using client carrier simulation:', e);
    }

    // Client-side fallback notification record
    const clientRecord: ParentNotification = {
      id: `SMS-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: student.id,
      studentName: student.name,
      gender: student.gender,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      periodId: period.id,
      periodName: period.name,
      date: dateStr,
      messageText,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      channel: 'sms',
      deliveryLatencyMs: 215,
    };
    return clientRecord;
  };

  /**
   * Mark attendance for a single student
   */
  const handleMarkAttendance = async (
    studentId: string,
    status: AttendanceStatus,
    method: 'face_recognition' | 'manual_override' | 'automated_absent',
    confidenceScore?: number,
    snapshotUrl?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Create or update attendance record
    const newRecordId = `REC-${Date.now()}-${studentId}`;
    const newRecord: AttendanceRecord = {
      id: newRecordId,
      studentId,
      periodId: currentPeriod.id,
      date: currentDate,
      status,
      markedAt: new Date().toISOString(),
      verificationMethod: method,
      confidenceScore,
      snapshotUrl,
    };

    setAttendanceRecords((prev) => {
      const filtered = prev.filter(
        (r) => !(r.studentId === studentId && r.periodId === currentPeriod.id && r.date === currentDate)
      );
      return [...filtered, newRecord];
    });

    // If marked ABSENT: trigger parent SMS
    if (status === 'absent') {
      soundManager.playAlertBeep();
      const notification = await dispatchParentAbsentAlert(student, currentPeriod, currentDate);

      setNotifications((prev) => [notification, ...prev]);
      soundManager.playSmsSentPing();

      showToast(
        `Marked ABSENT: SMS alert dispatched to parent ${student.parentName} (${student.parentPhone})`,
        'warning'
      );
    } else if (status === 'present') {
      showToast(
        `Marked PRESENT: ${student.name} (${student.rollNumber}) via ${method === 'face_recognition' ? 'Biometric Face Scan' : 'Manual Override'}`,
        'success'
      );
    }
  };

  /**
   * Finalize current period attendance session:
   * Any student not verified as Present is automatically marked Absent,
   * and automated SMS is sent to their parent's number!
   */
  const handleFinalizePeriodAbsentees = async () => {
    const periodRecords = attendanceRecords.filter(
      (r) => r.periodId === currentPeriod.id && r.date === currentDate
    );

    // Find students not marked present
    const unmarkedStudents = students.filter(
      (student) => !periodRecords.some((r) => r.studentId === student.id && r.status === 'present')
    );

    if (unmarkedStudents.length === 0) {
      showToast('All enrolled students have already been verified Present for this period!', 'success');
      return;
    }

    const newRecords: AttendanceRecord[] = [];
    const newNotifications: ParentNotification[] = [];

    for (const student of unmarkedStudents) {
      const record: AttendanceRecord = {
        id: `REC-AUTO-ABSENT-${Date.now()}-${student.id}`,
        studentId: student.id,
        periodId: currentPeriod.id,
        date: currentDate,
        status: 'absent',
        markedAt: new Date().toISOString(),
        verificationMethod: 'automated_absent',
      };
      newRecords.push(record);

      const notif = await dispatchParentAbsentAlert(student, currentPeriod, currentDate);
      newNotifications.push(notif);
    }

    // Update state
    setAttendanceRecords((prev) => {
      const remaining = prev.filter(
        (r) => !(r.periodId === currentPeriod.id && r.date === currentDate && unmarkedStudents.some((u) => u.id === r.studentId))
      );
      return [...remaining, ...newRecords];
    });

    setNotifications((prev) => [...newNotifications, ...prev]);

    // Play sounds
    soundManager.playAlertBeep();
    soundManager.playSmsSentPing();

    // Open first absentee's phone simulator so user instantly sees what the parent receives!
    if (newNotifications.length > 0) {
      setSimulatedNotification(newNotifications[0]);
    }

    showToast(
      `Period Finalized: ${unmarkedStudents.length} students marked ABSENT. Automated SMS dispatched to ${unmarkedStudents.length} parent phone numbers.`,
      'warning'
    );
  };

  /**
   * Reset attendance records for the selected period & date
   */
  const handleResetPeriod = () => {
    if (confirm(`Reset attendance for ${currentPeriod.name} on ${currentDate}?`)) {
      setAttendanceRecords((prev) =>
        prev.filter((r) => !(r.periodId === currentPeriod.id && r.date === currentDate))
      );
      showToast(`Attendance reset for ${currentPeriod.name}`, 'success');
    }
  };

  // Student CRUD handlers
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
    showToast(`Enrolled student ${newStudent.name} (${newStudent.rollNumber}) with face profile.`, 'success');
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
    showToast(`Updated student details for ${updatedStudent.name}.`, 'success');
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm('Are you sure you want to remove this student from the roster?')) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      showToast('Student removed from master roster.', 'success');
    }
  };

  const handleResendNotification = async (notification: ParentNotification) => {
    soundManager.playSmsSentPing();
    showToast(`Resending SMS alert to ${notification.parentName} (${notification.parentPhone})...`, 'success');
  };

  const handleOpenQuickEdit = (studentId?: string) => {
    setQuickEditStudentId(studentId || (students.length > 0 ? students[0].id : undefined));
    setIsQuickEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        smsCount={notifications.length}
        onOpenLatestPhoneSimulator={() => {
          if (notifications.length > 0) {
            setSimulatedNotification(notifications[0]);
          }
        }}
        onOpenQuickEdit={() => handleOpenQuickEdit()}
      />

      {/* Floating Toast Notification Banner */}
      {bannerAlert && (
        <div className="fixed top-20 right-6 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 ${
              bannerAlert.type === 'warning'
                ? 'bg-white border-rose-200 text-slate-800 shadow-rose-100 ring-1 ring-rose-200/50'
                : 'bg-white border-emerald-200 text-slate-800 shadow-emerald-100 ring-1 ring-emerald-200/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {bannerAlert.type === 'warning' ? (
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <span className="text-xs font-semibold leading-relaxed">
                {bannerAlert.message}
              </span>
            </div>
            <button
              onClick={() => setBannerAlert(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scanner' && (
          <FaceScanner
            students={students}
            currentPeriod={currentPeriod}
            currentDate={currentDate}
            attendanceRecords={attendanceRecords}
            onMarkAttendance={handleMarkAttendance}
            onFinalizePeriodAbsentees={handleFinalizePeriodAbsentees}
            onViewParentSimulator={(notif) => setSimulatedNotification(notif)}
            smsConfig={smsConfig}
            onOpenEditStudentModal={handleOpenQuickEdit}
          />
        )}

        {activeTab === 'sheet' && (
          <AttendanceSheet
            students={students}
            periods={periods}
            currentPeriod={currentPeriod}
            onSelectPeriod={setCurrentPeriod}
            currentDate={currentDate}
            onSelectDate={setCurrentDate}
            attendanceRecords={attendanceRecords}
            notifications={notifications}
            onMarkAttendance={handleMarkAttendance}
            onFinalizePeriodAbsentees={handleFinalizePeriodAbsentees}
            onViewParentSimulator={(notif) => setSimulatedNotification(notif)}
            onResetPeriod={handleResetPeriod}
            onUpdateStudent={handleUpdateStudent}
            onOpenEditStudentModal={handleOpenQuickEdit}
          />
        )}

        {activeTab === 'outbox' && (
          <ParentSMSOutbox
            notifications={notifications}
            onViewSimulator={(notif) => setSimulatedNotification(notif)}
            smsConfig={smsConfig}
            onUpdateSMSConfig={setSmsConfig}
            onResendNotification={handleResendNotification}
          />
        )}

        {activeTab === 'students' && (
          <StudentManagement
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            students={students}
            periods={periods}
            attendanceRecords={attendanceRecords}
            notifications={notifications}
            currentDate={currentDate}
          />
        )}
      </main>

      {/* Interactive Smartphone Simulator Modal */}
      {simulatedNotification && (
        <ParentPhoneSimulator
          notification={simulatedNotification}
          onClose={() => setSimulatedNotification(null)}
        />
      )}

      {/* Quick Edit Student Name & Parent Phone Modal */}
      <QuickEditStudentModal
        students={students}
        initialStudentId={quickEditStudentId}
        isOpen={isQuickEditOpen}
        onClose={() => setIsQuickEditOpen(false)}
        onSaveStudent={handleUpdateStudent}
      />
    </div>
  );
}
