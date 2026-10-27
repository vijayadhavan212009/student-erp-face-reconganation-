export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  relationship: 'son' | 'daughter' | 'ward';
  department: string;
  semester: number;
  section: string;
  avatarUrl: string;
  faceEnrolled: boolean;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  overallAttendanceRate?: number; // e.g. 85%
  registeredAt?: string;
}

export interface Period {
  id: number;
  number: number;
  name: string;
  code: string;
  subject: string;
  faculty: string;
  room: string;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  periodId: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedAt: string; // ISO string
  verificationMethod: 'face_recognition' | 'manual_override' | 'automated_absent';
  confidenceScore?: number;
  snapshotUrl?: string;
  smsSent?: boolean;
  smsId?: string;
}

export interface ParentNotification {
  id: string;
  studentId: string;
  studentName: string;
  gender: 'male' | 'female' | 'other';
  parentName: string;
  parentPhone: string;
  periodId: number;
  periodName: string;
  date: string;
  messageText: string;
  sentAt: string;
  status: 'delivered' | 'sent' | 'failed';
  channel: 'sms' | 'whatsapp';
  deliveryLatencyMs?: number;
}

export interface FaceRecognitionResult {
  identified: boolean;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  confidence: number;
  reason?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SMSTemplateConfig {
  template: string;
  collegeName: string;
  departmentName: string;
  autoSendOnAbsent: boolean;
}
