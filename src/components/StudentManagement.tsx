import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types/attendance';
import {
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Camera,
  CameraOff,
  Upload,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  Send,
  Smartphone,
  Check,
  RotateCw
} from 'lucide-react';
import { generateWhatsAppLink, generateSmsLink } from '../utils/smsHelper';

interface StudentManagementProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Quick edit phone popover state
  const [quickPhoneStudentId, setQuickPhoneStudentId] = useState<string | null>(null);
  const [quickPhoneValue, setQuickPhoneValue] = useState<string>('');

  // Live Camera inside modal state
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    gender: 'male' as 'male' | 'female' | 'other',
    relationship: 'son' as 'son' | 'daughter' | 'ward',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    parentName: '',
    parentPhone: '+91 ',
    parentEmail: '',
  });

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentPhone.includes(searchQuery)
  );

  // Start modal camera
  const startModalCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = stream;
        await modalVideoRef.current.play();
      }
      setIsCapturingFace(true);
    } catch (err: any) {
      console.warn('Modal camera error:', err);
      setCameraError('Unable to open camera. Please allow camera permissions or upload a photo file.');
    }
  };

  // Stop modal camera
  const stopModalCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCapturingFace(false);
  };

  // Capture face photo from modal camera
  const captureFaceSnapshot = () => {
    if (!modalVideoRef.current) return;
    const video = modalVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame (mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setFormData((prev) => ({ ...prev, avatarUrl: dataUrl }));
    stopModalCamera();
  };

  // Clean up camera on unmount or modal close
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const openNewStudentModal = () => {
    stopModalCamera();
    setEditingStudent(null);
    setFormData({
      name: '',
      rollNumber: `21CS${100 + students.length + 1}`,
      gender: 'male',
      relationship: 'son',
      department: 'Computer Science & Engineering',
      semester: 5,
      section: 'A',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      parentName: '',
      parentPhone: '+91 ',
      parentEmail: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    stopModalCamera();
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      gender: student.gender,
      relationship: student.relationship,
      department: student.department,
      semester: student.semester,
      section: student.section,
      avatarUrl: student.avatarUrl,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setFormData((prev) => ({ ...prev, avatarUrl: res }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rollNumber.trim() || !formData.parentPhone.trim()) return;

    const relationship = formData.gender === 'female' ? 'daughter' : formData.gender === 'male' ? 'son' : 'ward';

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        ...formData,
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim(),
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        relationship,
        faceEnrolled: true,
      };
      onUpdateStudent(updated);
    } else {
      const newStudent: Student = {
        id: `STU${Date.now().toString().slice(-4)}`,
        ...formData,
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim(),
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        relationship,
        faceEnrolled: true,
        overallAttendanceRate: 100,
        registeredAt: new Date().toISOString().split('T')[0],
      };
      onAddStudent(newStudent);
    }

    stopModalCamera();
    setIsModalOpen(false);
  };

  // Quick save inline phone
  const handleSaveQuickPhone = (student: Student) => {
    if (quickPhoneValue.trim()) {
      onUpdateStudent({
        ...student,
        parentPhone: quickPhoneValue.trim(),
      });
    }
    setQuickPhoneStudentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Enrolment Action */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Student Roster & Biometric Registry
            </span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              Enrolled: <strong className="text-slate-900 font-bold">{students.length}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Student Profiles & Parent Contact Database
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student names, register Face IDs, and edit parent phone numbers for real-time absence alerts.
          </p>
        </div>

        <button
          onClick={openNewStudentModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or parent phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline tabular-nums">
          Showing {filteredStudents.length} of {students.length} students
        </span>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const attendancePercent = student.overallAttendanceRate || 85;
          const isCriticalAttendance = attendancePercent < 75;
          const isQuickPhoneActive = quickPhoneStudentId === student.id;

          const absentSample = `Apex Institute: Dear Parent, your ${student.gender === 'female' ? 'daughter' : 'son'} ${student.name} has been absent today.`;

          return (
            <div
              key={student.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-slate-300 transition space-y-4 relative"
            >
              {/* Header with Photo, Name & Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-xs flex-shrink-0"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-indigo-600 font-bold tabular-nums">
                        {student.rollNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {student.gender === 'female' ? 'Daughter' : 'Son'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {student.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(student)}
                    className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                    title="Edit Name, Face ID & Parent Phone Number"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteStudent(student.id)}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
                    title="Delete Student"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Attendance Ratio Bar */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Semester Attendance</span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      isCriticalAttendance ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {attendancePercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isCriticalAttendance ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${attendancePercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Parent Details & Instant Quick Edit Phone */}
              <div className="border-t border-slate-100 pt-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Parent: <strong className="text-slate-800">{student.parentName}</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (isQuickPhoneActive) {
                        setQuickPhoneStudentId(null);
                      } else {
                        setQuickPhoneStudentId(student.id);
                        setQuickPhoneValue(student.parentPhone);
                      }
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    {isQuickPhoneActive ? 'Cancel' : 'Edit Phone'}
                  </button>
                </div>

                {isQuickPhoneActive ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={quickPhoneValue}
                      onChange={(e) => setQuickPhoneValue(e.target.value)}
                      placeholder="+91..."
                      className="flex-1 bg-white border-2 border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono font-bold focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveQuickPhone(student)}
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      title="Save Number"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-emerald-800 tabular-nums">{student.parentPhone}</span>
                    </div>

                    {/* Quick WhatsApp & SMS direct test */}
                    <div className="flex items-center gap-1">
                      <a
                        href={generateWhatsAppLink(student.parentPhone, absentSample)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                        title="Send WhatsApp test to this parent"
                      >
                        <Send className="w-3 h-3" />
                      </a>
                      <a
                        href={generateSmsLink(student.parentPhone, absentSample)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
                        title="Open Native SMS"
                      >
                        <Smartphone className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enroll / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-xl shadow-xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                stopModalCamera();
                setIsModalOpen(false);
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {editingStudent ? 'Edit Student Name, Face ID & Parent Phone' : 'Enroll New Student'}
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Fill in student credentials, capture a live Face ID photo with your webcam, and link the parent phone number for automated absence notifications.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Face ID Capture Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Biometric Face ID
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Webcam Snap or File Upload
                  </span>
                </div>

                {cameraError && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {isCapturingFace ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-52 flex items-center justify-center border-2 border-indigo-500 shadow-inner">
                      <video
                        ref={modalVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-32 h-40 border-2 border-emerald-400 rounded-2xl flex items-center justify-center">
                          <span className="text-[10px] text-emerald-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                            Align Face
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={captureFaceSnapshot}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Camera className="w-4 h-4" /> Snap Face ID
                      </button>
                      <button
                        type="button"
                        onClick={stopModalCamera}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                    <img
                      src={formData.avatarUrl}
                      alt="Student Face ID Preview"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-xs flex-shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-bold text-slate-900">
                        Face ID Biometric Template
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Take a photo with your webcam to match student in live face attendance.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={startModalCamera}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" /> Use Webcam
                        </button>
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-slate-600" /> Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Name & Roll Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Vijay Adhavan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. 21CS101"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Gender (Son vs Daughter) */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Gender & Notification Tag
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'male', relationship: 'son' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                      formData.gender === 'male'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>Male</div>
                    <div className={`text-[10px] ${formData.gender === 'male' ? 'text-indigo-100' : 'text-slate-500'}`}>
                      SMS: "your son has been absent"
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'female', relationship: 'daughter' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                      formData.gender === 'female'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>Female</div>
                    <div className={`text-[10px] ${formData.gender === 'female' ? 'text-indigo-100' : 'text-slate-500'}`}>
                      SMS: "your daughter has been absent"
                    </div>
                  </button>
                </div>
              </div>

              {/* Parent Phone & Name Card */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                  Parent Details (Receives Absence Alerts)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Parent / Guardian Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Mr. Adhavan"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Parent Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border-2 border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-900 font-mono font-bold focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    stopModalCamera();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Student & Parent Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
