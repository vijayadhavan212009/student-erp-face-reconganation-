import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types/attendance';
import {
  X,
  Check,
  Camera,
  Upload,
  User,
  Phone,
  ShieldCheck,
  Sparkles,
  Send,
  Smartphone,
  MessageSquare,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { generateWhatsAppLink, generateSmsLink } from '../utils/smsHelper';

interface QuickEditStudentModalProps {
  students: Student[];
  initialStudentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: Student) => void;
  onTestSMS?: (student: Student) => void;
}

export const QuickEditStudentModal: React.FC<QuickEditStudentModalProps> = ({
  students,
  initialStudentId,
  isOpen,
  onClose,
  onSaveStudent,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students.length > 0 ? students[0].id : '')
  );

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [testSentFeedback, setTestSentFeedback] = useState<string | null>(null);

  // Sync form when selected student changes or modal opens
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId, isOpen]);

  useEffect(() => {
    if (currentStudent) {
      setStudentName(currentStudent.name);
      setRollNumber(currentStudent.rollNumber);
      setParentName(currentStudent.parentName);
      setParentPhone(currentStudent.parentPhone);
      setGender(currentStudent.gender);
      setAvatarUrl(currentStudent.avatarUrl);
    }
  }, [selectedStudentId, currentStudent]);

  // Handle camera start
  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (e) {
      setCameraError('Unable to access webcam. Please verify camera permissions or upload an image file.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setAvatarUrl(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) setAvatarUrl(res);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !studentName.trim() || !parentPhone.trim()) return;

    const relationship = gender === 'female' ? 'daughter' : gender === 'male' ? 'son' : 'ward';

    const updated: Student = {
      ...currentStudent,
      name: studentName.trim(),
      rollNumber: rollNumber.trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      gender,
      relationship,
      avatarUrl: avatarUrl || currentStudent.avatarUrl,
      faceEnrolled: true,
    };

    onSaveStudent(updated);
    stopCamera();
    onClose();
  };

  // Quick Preset Handlers for college mini-project review testing
  const applyMyDetailsPreset = () => {
    setStudentName('Vijay Adhavan');
    setParentName('Mr. Adhavan (Parent)');
    setParentPhone('+91 98765 43210');
    setGender('male');
  };

  const applyFriendDetailsPreset = () => {
    setStudentName('Rahul Sharma');
    setParentName('Mr. Sharma (Parent)');
    setParentPhone('+91 91234 56789');
    setGender('male');
  };

  const sampleAbsentMessage = `Apex Institute of Technology: Dear Parent, your ${gender === 'female' ? 'daughter' : 'son'} ${studentName || 'Student'} has been marked ABSENT for Period 1. Please contact the department.`;

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-6 right-6 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold tracking-wide text-indigo-700 uppercase font-mono">
              College Mini-Project Review Configuration
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Edit Student Name & Parent Phone Number
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Configure student credentials and link your own mobile number or your friend's number to test live face recognition and automatic parent absence SMS messaging.
          </p>

          {/* Quick preset helper pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">Quick Demo Presets:</span>
            <button
              type="button"
              onClick={applyMyDetailsPreset}
              className="text-xs px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition cursor-pointer"
            >
              Fill: My Name & Parent Number
            </button>
            <button
              type="button"
              onClick={applyFriendDetailsPreset}
              className="text-xs px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold border border-sky-200 transition cursor-pointer"
            >
              Fill: Friend's Name & Number
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Student Selector Dropdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Select Student to Modify
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rollNumber}) — Parent: {s.parentPhone}
                </option>
              ))}
            </select>
          </div>

          {/* Student Name & Roll Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Student Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Vijay Adhavan"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 21CS101"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Parent Phone Number & Name - Highlighted Card */}
          <div className="bg-emerald-50/50 p-4.5 rounded-2xl border border-emerald-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                Parent Mobile Number (Absence Alert Target)
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300 shadow-xs">
                Real SMS / WhatsApp
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Adhavan Senior"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Parent Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white border-2 border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-emerald-900 font-mono font-bold focus:outline-hidden focus:border-emerald-600 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live Message Preview & Instant Test Trigger */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Preview of SMS Sent on Absence:</span>
                <span className="text-[10px] text-slate-400 font-mono">Format Verified</span>
              </div>
              <p className="text-[11px] text-slate-700 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                "{sampleAbsentMessage}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-slate-500">
                  Target: <strong className="font-mono text-emerald-700">{parentPhone || 'Not set'}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={generateWhatsAppLink(parentPhone, sampleAbsentMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition"
                  >
                    <Send className="w-3 h-3" /> Test WhatsApp Now
                  </a>
                  <a
                    href={generateSmsLink(parentPhone, sampleAbsentMessage)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition"
                  >
                    <Smartphone className="w-3 h-3 text-slate-500" /> Open Native SMS
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Gender / Relationship Option (Alters "your son" vs "your daughter") */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Gender & Relationship Tag (Sets "your son" vs "your daughter" in SMS)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                  gender === 'male'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Male</div>
                <div className={`text-[10px] ${gender === 'male' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  SMS says: "your son has been absent"
                </div>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                  gender === 'female'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Female</div>
                <div className={`text-[10px] ${gender === 'female' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  SMS says: "your daughter has been absent"
                </div>
              </button>
            </div>
          </div>

          {/* Face ID Section - Webcam or Upload */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Biometric Face ID Photo
              </span>
              <span className="text-[11px] text-slate-500">
                Used by AI Camera to verify student
              </span>
            </div>

            {cameraError && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {isCameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-52 flex items-center justify-center border-2 border-indigo-500 shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-32 h-40 border-2 border-dashed border-emerald-400 rounded-2xl flex items-center justify-center">
                      <span className="text-[10px] text-emerald-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                        Align Face Here
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Snap My Face ID
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                <div className="relative">
                  <img
                    src={avatarUrl || currentStudent?.avatarUrl}
                    alt="Student Face ID"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-xs flex-shrink-0"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="text-xs font-bold text-slate-800">
                    Active Biometric Face Profile
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Snap a photo of yourself with webcam so the camera identifies you as this student!
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" /> Use Live Webcam
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-slate-600" /> Upload Photo File
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

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Changes apply instantly across Attendance & SMS.
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save Student Name & Parent Phone
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
