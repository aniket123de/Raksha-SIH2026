import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { isEmtUser as isEmtUserHelper } from '../utils/userRoleUtils';
import {
  User,
  Stethoscope,
  Ambulance,
  Building2,
  Radio,
  Activity,
  Video,
  Volume2,
  VolumeX,
  Bell,
  LogOut,
  Settings,
  Shield,
  Home,
  AlertOctagon,
  FileText,
  LayoutDashboard,
  Users,
  Navigation,
  Zap,
  LifeBuoy,
  Radar,
  UserCheck,
  AlertTriangle,
  MapPin,
  Layers,
  ScrollText,
  Phone,
  ChevronRight,
  ShieldAlert,
  WifiOff,
  CheckSquare,
  Bot,
  QrCode,
  X
} from 'lucide-react';

export const PortalSidebar = ({ isOpen, onClose, onOpenNotifications }) => {
  const {
    currentUser,
    currentRole,
    portalTab,
    setPortalTab,
    soundEnabled,
    setSoundEnabled,
    setIsProfileModalOpen,
    notifications,
    activeEmergencies,
    patients,
    logout,
    networkMode,
    isEmergencyProtocolCompleted,
    organCorridorState
  } = useEmergency();

  const currentPatient = patients?.find(p => p.id === currentUser?.referenceId) || patients?.[0];
  const patientEmergency = activeEmergencies?.find(e => e.patientId === currentPatient?.id && e.status !== 'Completed');
  const isEmergencyAssessmentDone = Boolean(
    patientEmergency &&
    (patientEmergency.assessmentCompleted ||
     (patientEmergency.triageScore &&
      patientEmergency.triageScore.consciousness &&
      patientEmergency.triageScore.abilityToWalk &&
      patientEmergency.triageScore.breathing))
  );
  const isPatientMapUnlocked = Boolean(
    isEmergencyProtocolCompleted ||
    (patientEmergency &&
     patientEmergency.sosPressed &&
     isEmergencyAssessmentDone &&
     sessionStorage.getItem('raksha_sos_wizard_completed') === 'true')
  );

  const isEmtUser = isEmtUserHelper(currentUser);

  const offlineTabItem = {
    id: 'Offline',
    label: 'Offline & SMS Fallback',
    icon: WifiOff,
    badge: networkMode === 'online' ? 'Offline Mode' : 'OFFLINE ACTIVE',
    badgeColor: networkMode === 'online'
      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono text-[9px]'
      : 'bg-red-500 text-white animate-pulse font-mono text-[9px]'
  };

  // Tab configurations for each portal with respective icons
  const tabConfigs = {
    patient: {
      roleTitle: 'Patient Portal',
      roleBadge: 'Emergency Care',
      badgeBg: 'bg-red-950 text-red-400 border-red-800',
      activeColor: 'bg-red-600 text-white shadow-lg shadow-red-900/40',
      icon: User,
      tabs: [
        { id: 'Home', label: 'Home Overview', icon: Home },
        { 
          id: 'SOS', 
          label: 'SOS Emergency', 
          icon: AlertOctagon, 
          badge: patientEmergency ? 'Active' : 'Standby', 
          badgeColor: patientEmergency ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400' 
        },
        { 
          id: 'Ambulance', 
          label: 'Ambulance Tracker', 
          icon: Ambulance,
          badge: isPatientMapUnlocked ? '🟢 Live GPS' : '🔒 Locked (SOS & Assessment Required)',
          badgeColor: isPatientMapUnlocked 
            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse font-mono text-[9px]' 
            : 'bg-red-950/90 text-red-400 border border-red-800/80 font-mono text-[9px]'
        },
        { id: 'Hospitals', label: 'Nearby Hospitals', icon: Building2 },
        { 
          id: 'Medical QR', 
          label: 'Emergency Medical QR', 
          icon: QrCode, 
          badge: 'Doctor / EMT Scan', 
          badgeColor: 'bg-purple-950 text-purple-300 border border-purple-800 font-mono text-[9px]' 
        },
        offlineTabItem,
        { id: 'Notifications', label: 'Alerts & Messages', icon: Bell, badge: notifications.length || null, badgeColor: 'bg-amber-500 text-slate-950' },
        { id: 'Profile', label: 'Patient Profile', icon: User }
      ]
    },
    doctor: {
      roleTitle: 'Doctor Portal',
      roleBadge: 'Trauma & Clinical',
      badgeBg: 'bg-blue-950 text-blue-400 border-blue-800',
      activeColor: 'bg-blue-600 text-white shadow-lg shadow-blue-900/40',
      icon: Stethoscope,
      tabs: [
        { id: 'Dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
        { id: 'Video Conference', label: 'Tele-Paramedic Video Call', icon: Video, badge: 'Live Tele-Med', badgeColor: 'bg-emerald-500 text-slate-950 font-bold animate-pulse' },
        { id: 'Emergencies', label: 'Active Emergencies', icon: AlertOctagon, badge: activeEmergencies.length || null, badgeColor: 'bg-red-500 text-white animate-pulse' },
        { id: 'Patients', label: 'Patient Triage', icon: Users },
        { id: 'Medical Records', label: 'Medical Records & Rx', icon: FileText },
        { id: 'Resources', label: 'Hospital Resources', icon: Shield },
        offlineTabItem,
        { id: 'Notifications', label: 'Emergency Alerts', icon: Bell, badge: notifications.length || null, badgeColor: 'bg-blue-400 text-slate-950' },
        { id: 'Profile', label: 'Doctor Profile', icon: Stethoscope }
      ]
    },
    ambulance: {
      roleTitle: 'Ambulance Portal',
      roleBadge: 'EMS & Rapid Transit',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
      activeColor: 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold',
      icon: Ambulance,
      tabs: [
        { id: 'Dashboard', label: 'Fleet Dashboard', icon: LayoutDashboard },
        { id: 'Requests', label: 'Dispatch Requests', icon: Radio, badge: 'Incoming', badgeColor: 'bg-red-500 text-white animate-pulse' },
        { 
          id: 'Navigation', 
          label: isEmergencyProtocolCompleted ? 'Live GPS Navigation' : 'Live GPS Navigation (Locked)', 
          icon: Navigation,
          badge: isEmergencyProtocolCompleted ? 'Live GPS' : '🔒 Locked (SOS Required)',
          badgeColor: isEmergencyProtocolCompleted ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-red-950 text-red-400 border border-red-800 font-mono text-[9px]'
        },
        { id: 'LiDAR', label: '3D LiDAR Obstacles', icon: Radar, badge: '2.5D Coords', badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
        { id: 'Rerouting', label: 'Pre-Alert Vehicles', icon: Bell, badge: 'Pre-Alert', badgeColor: 'bg-amber-500 text-slate-950 font-bold' },
        { id: 'Transport', label: 'Patient Transport', icon: Ambulance },
        { 
          id: 'Green Corridor', 
          label: 'Green Corridor (Organ)', 
          icon: Zap, 
          badge: (organCorridorState?.isDispatched || organCorridorState?.isMapGenerated) ? '🟢 Dispatched' : 'Ready to Dispatch', 
          badgeColor: (organCorridorState?.isDispatched || organCorridorState?.isMapGenerated) ? 'bg-emerald-400 text-slate-950 font-bold animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
        },
        { id: 'Safety', label: 'Paramedic Safety SOS', icon: LifeBuoy },
        offlineTabItem,
        { id: 'Profile', label: 'Ambulance Profile', icon: Ambulance }
      ]
    },
    paramedic: {
      roleTitle: isEmtUser ? 'Emergency Medical Technician Portal' : 'Paramedic Portal',
      roleBadge: isEmtUser ? 'Licensed EMT Provider' : 'Trauma Paramedic (ALS)',
      badgeBg: 'bg-teal-950/80 text-teal-300 border-teal-600/50',
      activeColor: 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25 font-bold',
      icon: Activity,
      tabs: [
        { id: 'Digital Twin', label: '3D Digital Patient', icon: UserCheck, badge: 'Live 3D', badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
        { id: 'AI Assistant', label: 'AI Stabilization Guide', icon: Bot, badge: 'Voice AI', badgeColor: 'bg-indigo-500 text-white font-bold animate-pulse' },
        { id: 'Video Call', label: 'Tele-Doctor Video Call', icon: Video, badge: 'Tele-Med', badgeColor: 'bg-emerald-500 text-slate-950 font-bold animate-pulse' },
        { id: 'Treatments', label: 'Field Treatments & Rx', icon: FileText },
        { id: 'Equipment', label: 'Equipment Checklist', icon: CheckSquare, badge: 'Pre-Trip', badgeColor: 'bg-amber-400 text-slate-950 font-bold' },
        { id: 'Triage', label: 'START Triage Matrix', icon: AlertTriangle },
        offlineTabItem,
        { id: 'Profile', label: isEmtUser ? 'EMT Profile' : 'Paramedic Profile', icon: User }
      ]
    },
    hospital: {
      roleTitle: 'Hospital Portal',
      roleBadge: 'ER & Resources',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
      activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-bold',
      icon: Building2,
      tabs: [
        { id: 'Dashboard', label: 'Hospital Overview', icon: LayoutDashboard },
        { id: 'Staff Directory', label: 'Doctors & Paramedics', icon: Users, badge: 'On Duty', badgeColor: 'bg-emerald-400 text-slate-950 font-bold' },
        { id: 'Incoming ER', label: 'Incoming ER Patients', icon: Ambulance, badge: 'Trauma', badgeColor: 'bg-red-500 text-white animate-pulse' },
        { 
          id: 'Green Corridor', 
          label: 'Digital Green Corridor (Organ)', 
          icon: Zap, 
          badge: (organCorridorState?.isDispatched || organCorridorState?.isMapGenerated) ? '🟢 Dispatched' : 'Awaiting Dispatch', 
          badgeColor: (organCorridorState?.isDispatched || organCorridorState?.isMapGenerated) ? 'bg-emerald-400 text-slate-950 font-bold animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
        },
        { 
          id: 'Vicinity Map', 
          label: isEmergencyProtocolCompleted ? 'Hospital Vicinity GIS Map' : 'Hospital Vicinity GIS Map (Locked)', 
          icon: MapPin, 
          badge: isEmergencyProtocolCompleted ? 'Live GPS' : '🔒 Locked (SOS Required)', 
          badgeColor: isEmergencyProtocolCompleted ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-red-950 text-red-400 border border-red-800 font-mono text-[9px]' 
        },
        { id: 'Equipment', label: 'Ambulance Equipment', icon: CheckSquare, badge: 'Pre-Op', badgeColor: 'bg-amber-400 text-slate-950 font-bold' },
        { id: 'Beds & ICU', label: 'Bed & ICU Availability', icon: Building2 },
        { id: 'Resources', label: 'Oxygen & Ventilators', icon: Layers },
        { id: 'Blood Bank', label: 'Blood Bank Units', icon: Shield },
        offlineTabItem,
        { id: 'Notifications', label: 'Hospital Alerts', icon: Bell, badge: notifications?.length || null, badgeColor: 'bg-teal-400 text-slate-950' },
        { id: 'Profile', label: 'Hospital Profile', icon: Building2 }
      ]
    },
    'control-room': {
      roleTitle: 'Control Room Portal',
      roleBadge: 'Central Command',
      badgeBg: 'bg-purple-950 text-purple-400 border-purple-800',
      activeColor: 'bg-purple-600 text-white shadow-lg shadow-purple-900/40',
      icon: Radio,
      tabs: [
        { id: 'Dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
        { id: 'DisasterSwarm', label: 'Disaster Swarm Mode', icon: Radar, badge: 'LIVE', badgeColor: 'bg-red-500 text-white animate-pulse' },
        { id: 'Emergencies', label: 'Active Emergencies', icon: AlertTriangle, badge: activeEmergencies?.length || null, badgeColor: 'bg-red-500 text-white animate-pulse' },
        { 
          id: 'Live Map', 
          label: isEmergencyProtocolCompleted ? 'Regional GIS Live Map' : 'Regional GIS Live Map (Locked)', 
          icon: MapPin,
          badge: isEmergencyProtocolCompleted ? 'Live GIS' : '🔒 Locked (SOS Required)',
          badgeColor: isEmergencyProtocolCompleted ? 'bg-purple-500 text-slate-950 font-bold' : 'bg-red-950 text-red-400 border border-red-800 font-mono text-[9px]'
        },
        { id: 'Ambulances', label: 'Ambulance Fleet', icon: Ambulance },
        { id: 'Equipment', label: 'Fleet Equipment Status', icon: CheckSquare, badge: 'Readiness', badgeColor: 'bg-amber-400 text-slate-950 font-bold' },
        { id: 'Facilities', label: 'Facility Network', icon: Building2 },
        { id: 'Resources', label: 'Resource Inventory', icon: Layers },
        { id: 'Communications', label: 'Emergency Comms', icon: Radio },
        { id: 'Logs', label: 'Audit & Compliance Logs', icon: ScrollText },
        offlineTabItem,
        { id: 'Profile', label: 'Control Room Profile', icon: Shield }
      ]
    },
    control_room: {
      roleTitle: 'Control Room Portal',
      roleBadge: 'Central Command',
      badgeBg: 'bg-purple-950 text-purple-400 border-purple-800',
      activeColor: 'bg-purple-600 text-white shadow-lg shadow-purple-900/40',
      icon: Radio,
      tabs: [
        { id: 'Dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
        { id: 'DisasterSwarm', label: 'Disaster Swarm Mode', icon: Radar, badge: 'LIVE', badgeColor: 'bg-red-500 text-white animate-pulse' },
        { id: 'Emergencies', label: 'Active Emergencies', icon: AlertTriangle, badge: activeEmergencies?.length || null, badgeColor: 'bg-red-500 text-white animate-pulse' },
        { 
          id: 'Live Map', 
          label: isEmergencyProtocolCompleted ? 'Regional GIS Live Map' : 'Regional GIS Live Map (Locked)', 
          icon: MapPin,
          badge: isEmergencyProtocolCompleted ? 'Live GIS' : '🔒 Locked (SOS Required)',
          badgeColor: isEmergencyProtocolCompleted ? 'bg-purple-500 text-slate-950 font-bold' : 'bg-red-950 text-red-400 border border-red-800 font-mono text-[9px]'
        },
        { id: 'Ambulances', label: 'Ambulance Fleet', icon: Ambulance },
        { id: 'Equipment', label: 'Fleet Equipment Status', icon: CheckSquare, badge: 'Readiness', badgeColor: 'bg-amber-400 text-slate-950 font-bold' },
        { id: 'Facilities', label: 'Facility Network', icon: Building2 },
        { id: 'Resources', label: 'Resource Inventory', icon: Layers },
        { id: 'Communications', label: 'Emergency Comms', icon: Radio },
        { id: 'Logs', label: 'Audit & Compliance Logs', icon: ScrollText },
        offlineTabItem,
        { id: 'Profile', label: 'Control Room Profile', icon: Shield }
      ]
    }
  };

  const currentConfig = tabConfigs[currentRole] || tabConfigs.patient;
  const RoleIcon = currentConfig.icon;

  const handleTabSelect = (tabId) => {
    setPortalTab(tabId);
    if (tabId === 'Notifications') {
      onOpenNotifications();
    }
    if (onClose) onClose();
  };

  const sidebarContent = (
    <aside className="w-64 lg:w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col h-full text-slate-200 select-none">
      
      {/* 1. BRAND & ACTIVE VERTICAL PORTAL HEADER */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 shadow-md shadow-red-500/20 ring-1 ring-red-400/40">
              <ShieldAlert className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent block leading-none">
                Raksha<span className="text-red-500">.</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Disaster & EMS Grid</span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dedicated Role Badge Card */}
        <div className={`p-2.5 rounded-xl border ${currentConfig.badgeBg} flex items-center gap-2.5 shadow-inner`}>
          <div className="w-8 h-8 rounded-lg bg-slate-900/80 flex items-center justify-center shrink-0">
            <RoleIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white tracking-wide truncate">
              {currentConfig.roleTitle}
            </div>
            <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Isolated Portal Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VERTICAL PORTAL NAVIGATION TABS */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
          Portal Navigation
        </div>

        <nav className="space-y-1">
          {currentConfig.tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = portalTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? `${currentConfig.activeColor} translate-x-1`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-current' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>

                {tab.badge && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${tab.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Emergency Hotlines Strip */}
        <div className="pt-4 mt-4 border-t border-slate-800/80 px-2 space-y-1.5">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 block">
            Emergency Hotlines
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <a
              href="tel:108"
              className="p-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 rounded-lg text-red-300 flex items-center justify-center gap-1 transition-colors"
            >
              <Phone className="w-3 h-3 text-red-400" />
              <span>EMS: <b>108</b></span>
            </a>
            <a
              href="tel:112"
              className="p-1.5 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 rounded-lg text-blue-300 flex items-center justify-center gap-1 transition-colors"
            >
              <Shield className="w-3 h-3 text-blue-400" />
              <span>SOS: <b>112</b></span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. VERTICAL FOOTER ACTIONS & USER ACCOUNT */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/50">

        {/* Audio & Alert Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs border transition-all ${
              soundEnabled
                ? 'bg-red-950/80 border-red-500/70 text-red-300 font-bold shadow-md shadow-red-900/40 ring-1 ring-red-500/40'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white'
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
                <span className="text-[11px] font-mono text-red-300 font-bold">Siren Wailing</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-mono">Siren Muted</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenNotifications}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-slate-300 hover:text-white transition-colors relative"
            title="View Alerts"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">Alerts</span>
            {notifications.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-1"></span>
            )}
          </button>
        </div>

        {/* Current User Info & Fast Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate leading-tight">
                {currentUser?.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {currentUser?.designation || (isEmtUser ? 'Emergency Medical Technician' : (currentRole === 'paramedic' ? 'Lead Trauma Paramedic' : currentUser?.role))}
              </span>
            </div>
          </button>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Vertical Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
