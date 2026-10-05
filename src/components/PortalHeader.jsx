import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { isEmtUser as isEmtUserHelper } from '../utils/userRoleUtils';
import { NETWORK_MODES } from '../services/offlineSyncService';
import {
  ShieldAlert,
  User,
  Stethoscope,
  Ambulance,
  Building2,
  Radio,
  Activity,
  Volume2,
  VolumeX,
  Bell,
  LogOut,
  Settings,
  Shield,
  Menu,
  X,
  ChevronDown,
  RotateCcw,
  Wifi,
  WifiOff,
  Signal,
  Check,
  Database
} from 'lucide-react';

export const PortalHeader = ({ onOpenNotifications, onToggleSidebar }) => {
  const {
    currentUser,
    currentRole,
    portalTab,
    setPortalTab,
    soundEnabled,
    setSoundEnabled,
    setIsProfileModalOpen,
    resetToDemoState,
    notifications,
    logout,
    networkMode,
    setNetworkMode
  } = useEmergency();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const isEmtUser = isEmtUserHelper(currentUser);

  // Portal-specific navigation configurations based strictly on prompt specifications
  const portalNavConfigs = {
    patient: {
      roleTitle: 'Patient Portal',
      roleBadgeBg: 'bg-red-950 text-red-400 border-red-800',
      icon: User,
      tabs: ['Home', 'SOS', 'Medical QR', 'Ambulance', 'Hospitals', 'Offline', 'Notifications', 'Profile']
    },
    doctor: {
      roleTitle: 'Doctor Portal',
      roleBadgeBg: 'bg-blue-950 text-blue-400 border-blue-800',
      icon: Stethoscope,
      tabs: ['Dashboard', 'Emergencies', 'Patients', 'Medical Records', 'Resources', 'Offline', 'Notifications', 'Profile']
    },
    ambulance: {
      roleTitle: 'Ambulance Portal',
      roleBadgeBg: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
      icon: Ambulance,
      tabs: ['Dashboard', 'Requests', 'Navigation', 'LiDAR', 'Transport', 'Green Corridor', 'Safety', 'Offline', 'Profile']
    },
    paramedic: {
      roleTitle: isEmtUser ? 'Emergency Medical Technician Portal' : 'Paramedic Portal',
      roleBadgeBg: 'bg-teal-950/80 text-teal-300 border-teal-600/50',
      icon: Activity,
      tabs: ['Digital Twin', 'AI Assistant', 'Video Call', 'Treatments', 'Triage', 'Equipment', 'Offline', 'Profile']
    },
    hospital: {
      roleTitle: 'Hospital Portal',
      roleBadgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
      icon: Building2,
      tabs: ['Dashboard', 'Staff Directory', 'Incoming ER', 'Beds & ICU', 'Resources', 'Blood Bank', 'Equipment', 'Offline', 'Notifications', 'Profile']
    },
    'control-room': {
      roleTitle: 'Control Room Portal',
      roleBadgeBg: 'bg-purple-950 text-purple-400 border-purple-800',
      icon: Radio,
      tabs: ['Dashboard', 'DisasterSwarm', 'Emergencies', 'Live Map', 'Ambulances', 'Facilities', 'Resources', 'Communications', 'Logs', 'Offline', 'Profile']
    },
    control_room: {
      roleTitle: 'Control Room Portal',
      roleBadgeBg: 'bg-purple-950 text-purple-400 border-purple-800',
      icon: Radio,
      tabs: ['Dashboard', 'DisasterSwarm', 'Emergencies', 'Live Map', 'Ambulances', 'Facilities', 'Resources', 'Communications', 'Logs', 'Offline', 'Profile']
    }
  };

  const navConfig = portalNavConfigs[currentRole] || portalNavConfigs.patient;
  const RoleIcon = navConfig.icon;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Mobile Sidebar Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Hamburger to toggle vertical sidebar on mobile */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800"
              title="Toggle Vertical Portal Navigation"
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </button>

            {/* Active Portal & Breadcrumb */}
            <div className="flex items-center gap-2.5">
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-bold ${navConfig.roleBadgeBg}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{navConfig.roleTitle}</span>
              </span>

              <ChevronDown className="w-3.5 h-3.5 text-slate-600 -rotate-90 hidden sm:block" />

              <span className="text-xs font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 hidden sm:inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active View: <strong className="text-white">{portalTab === 'Profile' ? (isEmtUser ? 'EMT Profile' : (currentRole === 'paramedic' ? 'Paramedic Profile' : 'Profile')) : portalTab}</strong></span>
              </span>
            </div>
          </div>

          {/* Center: System Golden Hour Telemetry Status */}
          <div className="hidden xl:flex items-center gap-3 text-xs font-mono bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              LIVE DISPATCH STREAM
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Encrypted Role Session</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-semibold">Priority Grid Active</span>
          </div>

          {/* Right Action Icons & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Quick Network Mode Selector & Offline Indicator (Available to all portals) */}
            <div className="relative">
              <button
                onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                  networkMode === NETWORK_MODES.ONLINE
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
                    : networkMode === NETWORK_MODES.WEAK_NETWORK
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/80 animate-pulse'
                    : networkMode === NETWORK_MODES.OFFLINE
                    ? 'bg-rose-950/80 border-rose-500/70 text-rose-300 hover:bg-rose-900/80 animate-pulse ring-1 ring-rose-500/50'
                    : 'bg-purple-950/80 border-purple-500/70 text-purple-300 hover:bg-purple-900/80 animate-pulse ring-1 ring-purple-500/50'
                }`}
                title="Network Status & Offline Simulator — Click to Change"
              >
                {networkMode === NETWORK_MODES.ONLINE && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden lg:inline text-[11px] font-bold">Online (5G)</span>
                  </>
                )}
                {networkMode === NETWORK_MODES.WEAK_NETWORK && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    <Signal className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden lg:inline text-[11px] font-bold">Weak (2G)</span>
                  </>
                )}
                {networkMode === NETWORK_MODES.OFFLINE && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden lg:inline text-[11px] font-bold">Offline Local</span>
                  </>
                )}
                {networkMode === NETWORK_MODES.SMS_FALLBACK && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                    <Radio className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden lg:inline text-[11px] font-bold">SMS Fallback</span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {networkDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-xs space-y-1">
                  <div className="px-2.5 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Network Connectivity</span>
                    <span className="text-emerald-400 font-bold">All Portals</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setNetworkMode(NETWORK_MODES.ONLINE);
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                      networkMode === NETWORK_MODES.ONLINE
                        ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/80'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>🟢 Online (Broadband / 5G)</span>
                    </span>
                    {networkMode === NETWORK_MODES.ONLINE && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => {
                      setNetworkMode(NETWORK_MODES.WEAK_NETWORK);
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                      networkMode === NETWORK_MODES.WEAK_NETWORK
                        ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-800/80'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Signal className="w-3.5 h-3.5 text-amber-400" />
                      <span>🟡 Weak Network (2G / Edge)</span>
                    </span>
                    {networkMode === NETWORK_MODES.WEAK_NETWORK && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>

                  <button
                    onClick={() => {
                      setNetworkMode(NETWORK_MODES.OFFLINE);
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                      networkMode === NETWORK_MODES.OFFLINE
                        ? 'bg-rose-950/80 text-rose-300 font-bold border border-rose-800/80'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>🔴 Offline Mode (Local Cache)</span>
                    </span>
                    {networkMode === NETWORK_MODES.OFFLINE && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </button>

                  <button
                    onClick={() => {
                      setNetworkMode(NETWORK_MODES.SMS_FALLBACK);
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                      networkMode === NETWORK_MODES.SMS_FALLBACK
                        ? 'bg-purple-950/80 text-purple-300 font-bold border border-purple-800/80'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-purple-400" />
                      <span>📡 Cellular SMS Fallback (GSM)</span>
                    </span>
                    {networkMode === NETWORK_MODES.SMS_FALLBACK && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setPortalTab('Offline');
                        setNetworkDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 font-bold flex items-center gap-2 border border-slate-800 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open Offline Terminal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Continuous Emergency Siren Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                soundEnabled
                  ? 'bg-red-950/80 border-red-500/70 text-red-300 shadow-md shadow-red-900/40 ring-1 ring-red-500/50'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={soundEnabled ? "Continuous Siren Active — Click to Mute" : "Siren Muted — Click to Start Continuous Siren"}
            >
              {soundEnabled ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-red-300 hidden md:inline">Siren Continuous</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] text-slate-400 hidden md:inline">Siren Muted</span>
                </>
              )}
            </button>

            {/* Notification Drawer Toggle */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="View Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>

            {/* PROFILE / MENU DROPDOWN (Account Settings & Logout) */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[100px] truncate">
                  {currentUser?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-white block truncate">{currentUser?.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono block">{currentUser?.email || currentUser?.username}</span>
                    <span className={`inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${navConfig.roleBadgeBg}`}>
                      {currentUser?.designation || (isEmtUser ? 'Emergency Medical Technician' : (currentRole === 'paramedic' ? 'Lead Trauma Paramedic' : currentUser?.role))}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setPortalTab('Profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors font-semibold"
                    >
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>{isEmtUser ? 'View EMT Profile' : (currentRole === 'paramedic' ? 'View Paramedic Profile' : 'View & Edit Profile')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileModalOpen(true);
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Account Settings & Overview</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
