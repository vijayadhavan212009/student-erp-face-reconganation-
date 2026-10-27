import React from 'react';
import { ParentNotification } from '../types/attendance';
import { MessageSquare, Phone, Signal, Wifi, Battery, CheckCheck, ExternalLink, X } from 'lucide-react';
import { generateWhatsAppLink, generateSmsLink } from '../utils/smsHelper';

interface ParentPhoneSimulatorProps {
  notification: ParentNotification | null;
  onClose?: () => void;
}

export const ParentPhoneSimulator: React.FC<ParentPhoneSimulatorProps> = ({
  notification,
  onClose,
}) => {
  if (!notification) return null;

  const currentTime = new Date(notification.sentAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-700 hover:text-slate-900 shadow-md text-xs font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" /> Close Phone Simulator
          </button>
        )}

        {/* Smartphone Shell (Modern Silver / Titanium chassis) */}
        <div className="relative mx-auto w-full max-w-[324px] rounded-[48px] border-4 border-slate-300 bg-slate-100 p-2.5 shadow-2xl ring-1 ring-slate-400/50">
          {/* Speaker ear piece and camera dynamic island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 px-4 py-1 rounded-full bg-slate-900 border border-slate-700 w-28 h-5 shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700"></div>
            <div className="w-9 h-1 rounded-full bg-slate-800"></div>
          </div>

          {/* Screen area (Clean light smartphone interface) */}
          <div className="relative h-[620px] rounded-[38px] bg-[#f8fafc] overflow-hidden flex flex-col justify-between text-slate-800 font-sans border border-slate-200 shadow-inner">
            {/* Top Status Bar */}
            <div className="flex items-center justify-between px-6 pt-3.5 pb-2 text-xs text-slate-600 bg-white/80 backdrop-blur-xs">
              <span className="font-extrabold text-slate-900 font-mono text-[11px]">{currentTime}</span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Messaging App Header */}
            <div className="px-4 py-2.5 border-b border-slate-200/80 bg-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                  AIT
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">
                    Apex College Alert System
                  </h4>
                  <p className="text-[10px] text-emerald-700 font-mono font-semibold">
                    Verified Sender • {notification.parentPhone}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase">
                Absent Alert
              </span>
            </div>

            {/* Message Feed Body */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-end space-y-3">
              {/* Date stamp pill */}
              <div className="text-center">
                <span className="text-[10px] bg-slate-200/80 text-slate-600 font-semibold px-2.5 py-0.5 rounded-full">
                  Today • {notification.date}
                </span>
              </div>

              {/* Incoming SMS Bubble */}
              <div className="max-w-[94%] rounded-2xl rounded-tl-sm bg-white border border-slate-200 p-4 shadow-md text-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 mb-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Official Absence Notice
                </div>
                <p className="text-xs leading-relaxed font-normal whitespace-pre-wrap text-slate-700">
                  {notification.messageText}
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono">Recipient: <strong className="text-slate-700">{notification.parentName}</strong></span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    Delivered <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                </div>
              </div>

              {/* Quick actions for parent */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200 text-[11px] space-y-2 shadow-sm">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  Direct Response Options:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={generateWhatsAppLink(notification.parentPhone, `Re: Absence of ${notification.studentName} for ${notification.periodName}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-[11px] shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={generateSmsLink(notification.parentPhone, `Re: Absence inquiry for ${notification.studentName}`)}
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-[11px] shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Native SMS
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom App Navigation */}
            <div className="p-3 border-t border-slate-200 bg-white text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Simulated Parent Device • Automated SMS Gateway
              </p>
              <div className="w-24 h-1 bg-slate-300 rounded-full mx-auto mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
