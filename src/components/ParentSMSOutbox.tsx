import React, { useState } from 'react';
import { ParentNotification, SMSTemplateConfig } from '../types/attendance';
import { generateWhatsAppLink, generateSmsLink } from '../utils/smsHelper';
import {
  MessageSquare,
  CheckCheck,
  Smartphone,
  Phone,
  Settings,
  Send,
  Search,
  ExternalLink,
  ShieldAlert,
  Clock,
  RotateCw,
  Sliders,
  Check
} from 'lucide-react';

interface ParentSMSOutboxProps {
  notifications: ParentNotification[];
  onViewSimulator: (notification: ParentNotification) => void;
  smsConfig: SMSTemplateConfig;
  onUpdateSMSConfig: (newConfig: SMSTemplateConfig) => void;
  onResendNotification: (notification: ParentNotification) => void;
}

export const ParentSMSOutbox: React.FC<ParentSMSOutboxProps> = ({
  notifications,
  onViewSimulator,
  smsConfig,
  onUpdateSMSConfig,
  onResendNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<SMSTemplateConfig>({ ...smsConfig });
  const [configSavedToast, setConfigSavedToast] = useState(false);

  const filteredNotifications = notifications.filter((notif) => {
    return (
      notif.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.parentPhone.includes(searchQuery) ||
      notif.periodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.messageText.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSaveConfig = () => {
    onUpdateSMSConfig(tempConfig);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
    setIsConfigOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Template Config Trigger */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Automated Absence SMS Gateway
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Total Dispatched: <span className="text-slate-900 font-bold">{notifications.length}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Parent Notification Outbox & Transmission Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time delivery receipts and parent notification records for absent students per period.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            Configure SMS Template
          </button>
        </div>
      </div>

      {/* SMS Template Configuration Panel Drawer */}
      {isConfigOpen && (
        <div className="bg-white border-2 border-indigo-200 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              Parent Absence SMS Template Settings
            </h3>
            <span className="text-xs text-slate-500">
              Personalized with dynamic variables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                College Name
              </label>
              <input
                type="text"
                value={tempConfig.collegeName}
                onChange={(e) => setTempConfig({ ...tempConfig, collegeName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Department Name
              </label>
              <input
                type="text"
                value={tempConfig.departmentName}
                onChange={(e) => setTempConfig({ ...tempConfig, departmentName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Message Template Format
            </label>
            <textarea
              rows={3}
              value={tempConfig.template}
              onChange={(e) => setTempConfig({ ...tempConfig, template: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 font-mono"
            />
            <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] text-slate-500">
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                {'{parent_name}'}
              </span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                {'{son_or_daughter}'}
              </span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                {'{student_name}'}
              </span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                {'{roll_no}'}
              </span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                {'{period_name}'}
              </span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                {'{time}'}
              </span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                {'{date}'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Template
            </button>
          </div>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search parent name, student, phone number, or period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white shadow-xs"
          />
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredNotifications.length}</span> messages
        </div>
      </div>

      {/* Notification Message Cards Feed */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            No Absence SMS Dispatched Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            When you mark any student as absent or finalize a period in the Face Scanner or Attendance Sheet, their parents will automatically receive an SMS alert here with real-time delivery verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-3xl p-5 shadow-sm transition space-y-4"
            >
              {/* Header: Recipient & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 font-extrabold text-sm shadow-xs">
                    SMS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {notification.parentName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                        {notification.parentPhone}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Student: <span className="text-slate-900 font-bold">{notification.studentName}</span> ({notification.gender === 'female' ? 'Daughter' : 'Son'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Delivered
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    {new Date(notification.sentAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Message Content Bubble */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                {notification.messageText}
              </div>

              {/* Footer: Carrier receipt & Interactive actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>ID: {notification.id}</span>
                  <span>•</span>
                  <span>Latency: {notification.deliveryLatencyMs || 220}ms</span>
                  <span>•</span>
                  <span>{notification.periodName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onViewSimulator(notification)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    Preview Parent Phone
                  </button>

                  <a
                    href={generateWhatsAppLink(notification.parentPhone, notification.messageText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp
                  </a>

                  <a
                    href={generateSmsLink(notification.parentPhone, notification.messageText)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    Native SMS
                  </a>

                  <button
                    onClick={() => onResendNotification(notification)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
                    title="Resend SMS Alert"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
