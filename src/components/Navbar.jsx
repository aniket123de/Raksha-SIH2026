import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  ShieldAlert,
  User,
  Stethoscope,
  Ambulance,
  Building2,
  Radio,
  Volume2,
  VolumeX,
  Bell,
  RotateCcw,
  Zap,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

export const Navbar = ({ onOpenNotifications }) => {
  const {
    currentRole,
    setCurrentRole,
    activeEmergencies,
    organTransports,
    soundEnabled,
    setSoundEnabled,
    resetToDemoState,
    notifications
  } = useEmergency();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roles = [
    { id: 'patient', label: 'Patient Portal', icon: User, color: 'hover:text-red-400' },
    { id: 'doctor', label: 'Doctor Portal', icon: Stethoscope, color: 'hover:text-blue-400' },
    { id: 'ambulance', label: 'Ambulance Portal', icon: Ambulance, color: 'hover:text-amber-400' },
    { id: 'hospital', label: 'Hospital Portal', icon: Building2, color: 'hover:text-emerald-400' },
    { id: 'control-room', label: 'Control Room', icon: Radio, color: 'hover:text-purple-400' },
  ];

  const criticalCount = activeEmergencies.filter(e => e.severity === 'Critical' && e.status !== 'Completed').length;
  const activeGreenCorridor = organTransports.some(o => o.status.includes('Active'));
  const unreadNotifs = notifications.length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Emergency Pulse */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 shadow-lg shadow-red-500/20 ring-1 ring-red-400/40">
              <ShieldAlert className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Raksha<span className="text-red-500">.</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded">
                  Live Response
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Disaster & Medical Emergency Coordination</p>
            </div>
          </div>

          {/* Desktop Role Switcher Navigation */}
          <nav className="hidden lg:flex items-center bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            {roles.map(r => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setCurrentRole(r.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-900/30 font-bold scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {r.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Simulation Triggers */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Green Corridor Status Pill */}
            {activeGreenCorridor && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-medium animate-pulse">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Green Wave Active</span>
              </div>
            )}

            {/* Critical SOS Counter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-slate-300">SOS:</span>
              <span className="font-bold text-red-400 font-mono">{criticalCount}</span>
            </div>

            {/* Continuous Emergency Siren Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-red-950/80 text-red-400 border border-red-500/60 shadow-md shadow-red-900/40 ring-1 ring-red-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={soundEnabled ? "Continuous Siren Wailing — Click to Mute" : "Siren Muted — Click to Start Continuous Siren"}
            >
              {soundEnabled ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-red-300 hidden md:inline">Siren On</span>
                </>
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Notification Drawer Toggle */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="View Real-Time Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute 1 top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>

            {/* Factory Reset */}
            <button
              onClick={() => {
                if (window.confirm('Reset all demo data to factory defaults?')) {
                  resetToDemoState();
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset All Data to Demo Baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Portal Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-3 space-y-1">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Switch Portal Role</p>
            {roles.map(r => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentRole(r.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {r.label}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
};
