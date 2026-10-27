import React, { useState, useEffect } from 'react';
import {
  Scan,
  ClipboardList,
  MessageSquare,
  Users,
  BarChart3,
  Volume2,
  VolumeX,
  Smartphone,
  Clock,
  Edit2
} from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface NavbarProps {
  activeTab: 'scanner' | 'sheet' | 'outbox' | 'students' | 'analytics';
  onSelectTab: (tab: 'scanner' | 'sheet' | 'outbox' | 'students' | 'analytics') => void;
  smsCount: number;
  onOpenLatestPhoneSimulator: () => void;
  onOpenQuickEdit?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  smsCount,
  onOpenLatestPhoneSimulator,
  onOpenQuickEdit,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundManager.setSoundEnabled(nextVal);
    soundManager.setSpeechEnabled(nextVal);
  };

  const navItems = [
    { id: 'scanner' as const, label: 'Face AI Scanner', icon: Scan },
    { id: 'sheet' as const, label: 'Attendance Sheet', icon: ClipboardList },
    {
      id: 'outbox' as const,
      label: 'Parent SMS Alerts',
      icon: MessageSquare,
      badge: smsCount > 0 ? smsCount : undefined,
    },
    { id: 'students' as const, label: 'Student Profiles', icon: Users },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Corner: Brand + Upper Navigation Options Grouped Together */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            {/* System Wordmark & College Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Scan className="w-5 h-5" />
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 font-sans">
                    Smart<span className="text-indigo-600">Presence</span>
                  </span>
                  <span className="hidden xl:inline-block text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    CSE Dept
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle Vertical Divider */}
            <div className="h-5 w-px bg-slate-200 shrink-0 hidden md:block" />

            {/* Upper Navigation Options Displayed in the Left Corner */}
            <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                          isActive
                            ? 'bg-white text-indigo-700'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Corner: Quick Action Buttons, Sound Toggle, Digital Clock */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Edit Student & Parent Number Button */}
            {onOpenQuickEdit && (
              <button
                onClick={onOpenQuickEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                title="Quickly Edit Student Name & Parent Phone Number for Presentation Review"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Edit Student & Phone</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}

            {/* Parent Phone Simulator Quick Button */}
            {smsCount > 0 && (
              <button
                onClick={onOpenLatestPhoneSimulator}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                title="View live simulated parent phone screen"
              >
                <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                <span>Parent Phone</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Biometric sounds & voice active' : 'Audio muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Digital Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 font-semibold shadow-xs">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span className="tabular-nums">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row (Horizontal Scroll on Small Screens) */}
        <div className="flex md:hidden items-center gap-1 py-2 border-t border-slate-100 overflow-x-auto bg-white scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
