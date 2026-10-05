import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { EmergencyMap } from '../components/EmergencyMap';
import confetti from 'canvas-confetti';
import {
  Radio,
  MapPin,
  Ambulance,
  Building2,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Send,
  AlertOctagon,
  Bed,
  Wind,
  Droplets,
  Plus,
  Minus,
  Save,
  FileText,
  Database,
  Lock,
  Eye,
  Sliders,
  Users,
  MessageSquare,
  Stethoscope,
  ChevronRight,
  X,
  PhoneCall,
  Check,
  Shield,
  Award,
  Edit3,
  Server,
  Terminal,
  Cpu,
  Wifi,
  WifiOff,
  Smartphone,
  User,
  CheckSquare
} from 'lucide-react';
import { PreTreatmentEquipmentChecklist, EQUIPMENT_DEFINITIONS } from '../components/PreTreatmentEquipmentChecklist';
import { DisasterSwarmMap } from '../components/DisasterSwarmMap';
import { EmergencyMapLockScreen } from '../components/EmergencyMapLockScreen';
import { AMBULANCE_DIRECTION_CONFIGS, getAmbulanceTheme } from '../utils/routingEngine';

export const ControlRoomPortal = () => {
  const {
    activeEmergencies,
    ambulances,
    hospitals,
    patients,
    organTransports,
    trafficSignals,
    auditLogs,
    portalTab,
    setPortalTab,
    isEmergencyProtocolCompleted,
    toggleGreenCorridor,
    updateAmbulanceStatus,
    updateHospitalResources,
    reassignEmergencyAmbulance,
    reassignEmergencyHospital,
    dispatchMultipleAmbulances,
    toggleAmbulanceDispatch,
    sendControlRoomMessage,
    addNotification,
    logAudit,
    smsTransmissions,
    networkMode
  } = useEmergency();

  const [selectedEmergencyId, setSelectedEmergencyId] = useState(activeEmergencies[0]?.id || null);
  const currentIncident = activeEmergencies.find(e => e.id === selectedEmergencyId) || activeEmergencies[0];

  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [activeHospitalId, setActiveHospitalId] = useState(hospitals[0]?.id || 'HOSP-01');

  // Resource editor state for the active hospital
  const currentHospital = hospitals.find(h => h.id === activeHospitalId) || hospitals[0];
  const [resGeneralBeds, setResGeneralBeds] = useState(currentHospital.generalBeds);
  const [resIcuBeds, setResIcuBeds] = useState(currentHospital.icuBeds);
  const [resVentilators, setResVentilators] = useState(currentHospital.ventilators);
  const [resOxygenStatus, setResOxygenStatus] = useState(currentHospital.oxygenStatus);
  const [resBloodBank, setResBloodBank] = useState(currentHospital.bloodBank);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modals for actions
  const [reassignModalIncident, setReassignModalIncident] = useState(null);
  const [selectedAmbForReassign, setSelectedAmbForReassign] = useState('');
  const [rerouteModalIncident, setRerouteModalIncident] = useState(null);
  const [selectedHospForReroute, setSelectedHospForReroute] = useState('');
  const [commsModalTarget, setCommsModalTarget] = useState(null); // { type: 'ambulance' | 'doctor' | 'hospital', targetName: string }
  const [commsDirectText, setCommsDirectText] = useState('');
  const [selectedEquipmentAmbulance, setSelectedEquipmentAmbulance] = useState(null);

  // Control Room Profile State
  const [isEditCrProfileModalOpen, setIsEditCrProfileModalOpen] = useState(false);
  const [crProfile, setCrProfile] = useState({
    stationName: 'Central Integrated Emergency Command Center (C-IECC)',
    stationNodeId: 'CTRL-EOC-DEL-01',
    dutySupervisor: 'Inspector Rajeev Kumar',
    badgeId: 'CTRL-OP-8924',
    clearanceLevel: 'Level 5 (National Security & EMS Protocol)',
    shiftSchedule: 'Alpha Shift (06:00 - 18:00 IST)',
    secureLandline: '+91 11 2345 9911',
    cadHotline: '108-EXT-401 (Direct Dispatch Desk)',
    tetraFrequency: '412.550 MHz (Encrypted TETRA CAD Ch-09)',
    vhfBackupFrequency: '155.340 MHz (Citywide Emergency Mutual Aid)',
    itmsStatus: 'Active - Signal Preemption & Green Corridor Authorized',
    jurisdiction: 'Kolkata Metropolitan Area & Greater South Bengal Emergency Corridor',
    notes: 'Corridor Priority Alpha engaged for critical facility transit. Green wave override enabled at AJC Bose Road & Chowringhee intersections. 4 reserve ambulances deployed on EM Bypass.'
  });
  const [crNotesInput, setCrNotesInput] = useState(crProfile.notes);
  const [crSaveSuccess, setCrSaveSuccess] = useState(false);

  const handleSaveCrProfile = (e) => {
    e.preventDefault();
    setIsEditCrProfileModalOpen(false);
    addNotification('Control Room Profile Updated', `Station credentials and duty specs for ${crProfile.stationNodeId} saved successfully.`, 'success', 'all');
    logAudit('CTRL-01', crProfile.dutySupervisor, 'PROFILE_UPDATE', `Updated command station specifications for ${crProfile.stationNodeId}.`);
  };

  const handleSaveCrNotes = () => {
    setCrProfile(prev => ({ ...prev, notes: crNotesInput }));
    setCrSaveSuccess(true);
    setTimeout(() => setCrSaveSuccess(false), 2500);
    logAudit('CTRL-01', crProfile.dutySupervisor, 'LOG_NOTES_UPDATE', crNotesInput);
    addNotification('Shift Log Saved', 'Duty supervisor shift handover notes updated in dispatch audit trail.', 'info', 'all');
  };

  // Sync resource editor if active hospital changes
  const handleSelectHospitalForEdit = (hospId) => {
    setActiveHospitalId(hospId);
    const h = hospitals.find(item => item.id === hospId);
    if (h) {
      setResGeneralBeds(h.generalBeds);
      setResIcuBeds(h.icuBeds);
      setResVentilators(h.ventilators);
      setResOxygenStatus(h.oxygenStatus);
      setResBloodBank(h.bloodBank);
    }
  };

  const handleSaveHospitalResources = () => {
    updateHospitalResources(currentHospital.id, {
      generalBeds: resGeneralBeds,
      icuBeds: resIcuBeds,
      ventilators: resVentilators,
      oxygenStatus: resOxygenStatus,
      bloodBank: resBloodBank
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleBloodDelta = (group, delta) => {
    setResBloodBank(prev => ({
      ...prev,
      [group]: Math.max(0, (prev[group] || 0) + delta)
    }));
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    addNotification('🚨 CONTROL ROOM DISPATCH BROADCAST', broadcastMessage, 'urgent', 'all');
    logAudit('CTRL-01', 'Control Room Operator', 'DISPATCH_BROADCAST', broadcastMessage);
    setBroadcastMessage('');
  };

  const handleEscalateIncident = (incident) => {
    addNotification('⚠️ INCIDENT ESCALATION', `Incident ${incident.id} escalated to Level-1 Polytrauma Protocol!`, 'urgent', 'all');
    logAudit('CTRL-01', 'Control Room Operator', 'INCIDENT_ESCALATION', `Incident ${incident.id} escalated to Level-1 Polytrauma priority.`);
  };

  const handleAcceptEmergency = (incident) => {
    addNotification('Emergency Accepted', `Control Room operator accepted emergency incident ${incident.id}.`, 'info', 'all');
    logAudit('CTRL-01', 'Control Room Operator', 'ACCEPT_EMERGENCY', `Accepted emergency ${incident.id}.`);
  };

  const handleNotifyHospital = (hosp, incident) => {
    addNotification(
      'Facility Alerted',
      `${hosp?.name} emergency trauma bay alerted for incoming incident ${incident.id} (${incident.patientName}).`,
      'urgent',
      'hospital'
    );
    logAudit('CTRL-01', 'Control Room Operator', 'NOTIFY_FACILITY', `Direct trauma alert transmitted to ${hosp?.name} for incident ${incident.id}.`);
  };

  const handleConfirmArrival = (emergency) => {
    if (emergency.assignedAmbulanceId) {
      updateAmbulanceStatus(emergency.assignedAmbulanceId, 'Completed');
    }
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });
    addNotification(
      'Patient Admitted to Trauma Bay',
      `${emergency.patientName} (${emergency.id}) successfully admitted to emergency department.`,
      'success',
      'all'
    );
  };

  const handleExecuteReassign = () => {
    if (!reassignModalIncident || !selectedAmbForReassign) return;
    reassignEmergencyAmbulance(reassignModalIncident.id, selectedAmbForReassign);
    setReassignModalIncident(null);
    setSelectedAmbForReassign('');
  };

  const handleExecuteReroute = () => {
    if (!rerouteModalIncident || !selectedHospForReroute) return;
    reassignEmergencyHospital(rerouteModalIncident.id, selectedHospForReroute);
    setRerouteModalIncident(null);
    setSelectedHospForReroute('');
  };

  const handleSendDirectComms = (e) => {
    e.preventDefault();
    if (!commsModalTarget || !commsDirectText.trim()) return;
    sendControlRoomMessage(commsModalTarget.type === 'ambulance' ? 'Ambulances' : commsModalTarget.type === 'doctor' ? 'Doctors' : 'Hospitals', commsDirectText);
    setCommsModalTarget(null);
    setCommsDirectText('');
  };

  // Top 8 Metric Calculations (Mandated in Prompt Section 15)
  const countActiveEmergencies = activeEmergencies.filter(e => e.status !== 'Completed').length;
  const countAvailableAmbulances = ambulances.filter(a => a.status === 'Available').length;
  const countAmbulancesEnRoute = ambulances.filter(a => a.status === 'En Route' || a.status === 'Transporting' || a.status === 'Assigned').length;
  const countAvailableHospitals = hospitals.filter(h => h.icuBeds > 0).length;
  const totalEmergencyBeds = hospitals.reduce((acc, h) => acc + (h.generalBeds || 0), 0);
  const totalOxygenLitres = hospitals.reduce((acc, h) => acc + (h.oxygenLitres || 0), 0);
  const totalBloodUnits = hospitals.reduce((acc, h) => {
    const sum = Object.values(h.bloodBank || {}).reduce((a, b) => a + b, 0);
    return acc + sum;
  }, 0);
  const totalVentilators = hospitals.reduce((acc, h) => acc + (h.ventilators || 0), 0);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">🟢 Available</span>;
      case 'Limited':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">🟡 Limited</span>;
      case 'Unavailable':
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">🔴 Unavailable</span>;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* SECTION 1: MASTER COMMAND CONTROL HUD BANNER */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">Central Control Room Command Portal</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-950 text-purple-400 border border-purple-800">
                Master Command & Logistics Console
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Unified emergency management console coordinating city-wide EMS dispatch, emergency fleet units, and Green Wave routing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPortalTab(portalTab === 'Profile' ? 'Dashboard' : 'Profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
              portalTab === 'Profile'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            Control Room Profile
          </button>
        </div>
      </section>

      {/* INCOMING FIELD SMS FALLBACK BROADCAST MONITOR */}
      {(smsTransmissions || []).length > 0 && (
        <section className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-5 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Smartphone className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Cellular SMS Fallback Broadcasts from Field & Portal Nodes
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                    {smsTransmissions.length} Inbound Packets
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Autonomous cellular failover received from ambulances, citizens, paramedics, doctors, and hospitals during network blackouts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero PII Leaked • HIPAA/DISHA Protected</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {smsTransmissions.slice(0, 3).map((sms) => (
              <div key={sms.id} className="p-3.5 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono gap-1">
                  <span className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {sms.senderRole ? sms.senderRole.replace('-', ' ') : 'Ambulance'}
                    </span>
                    <span className="truncate max-w-[130px]">{sms.emergencyId} • {sms.senderName || sms.ambulanceId || 'Field Unit'}</span>
                  </span>
                  <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                    sms.deliveryConfirmed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {sms.deliveryConfirmed ? 'TOWER ACK CONFIRMED ✓' : sms.status.toUpperCase()}
                  </span>
                </div>

                <pre className="p-2 bg-slate-900 rounded-lg font-mono text-[10px] text-indigo-200 border border-slate-800 whitespace-pre-wrap leading-tight">
                  {sms.payload}
                </pre>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>To: {sms.recipientPhone}</span>
                  <span>{new Date(sms.storedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CONTROL ROOM PROFILE SECTION (portalTab === 'Profile') */}
      {/* ========================================================================= */}
      {portalTab === 'Profile' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Station Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-700/60 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Apex Emergency Command Node
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Station Node: {crProfile.stationNodeId}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    Tier-IV Mission Critical Active
                  </span>
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight">{crProfile.stationName}</h2>

                <p className="text-sm text-slate-300 flex items-center gap-2 max-w-2xl">
                  <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                  Jurisdiction: {crProfile.jurisdiction}
                </p>

                <p className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Security Clearance: {crProfile.clearanceLevel}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => setIsEditCrProfileModalOpen(true)}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-purple-950/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Station Specs & Security Clearance
                </button>
                <button
                  onClick={() => setPortalTab('Dashboard')}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4 text-purple-400" />
                  Command Dashboard
                </button>
              </div>
            </div>

            {/* Quick Spec Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duty Supervisor</span>
                <div className="text-sm font-black text-white mt-0.5">{crProfile.dutySupervisor}</div>
                <span className="text-[10px] text-purple-400 font-mono">Badge: {crProfile.badgeId}</span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Secure Comms Line</span>
                <div className="text-sm font-black font-mono text-purple-300 mt-0.5">{crProfile.secureLandline}</div>
                <span className="text-[10px] text-slate-400 font-mono">{crProfile.cadHotline}</span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CAD Radio Frequency</span>
                <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">{crProfile.tetraFrequency}</div>
                <span className="text-[10px] text-slate-500 font-mono">VHF: {crProfile.vhfBackupFrequency}</span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ITMS Preemption</span>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">Green Wave Active</div>
                <span className="text-[10px] text-slate-400">Signal Override Authorized</span>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Personnel & Dispatch Authority */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-purple-400" />
                Command Personnel & Dispatch Authority
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Duty Officer in Charge:</span>
                  <div className="font-bold text-white text-sm mt-0.5">{crProfile.dutySupervisor}</div>
                  <div className="text-[11px] text-purple-400 font-mono">Officer ID: {crProfile.badgeId} • {crProfile.shiftSchedule}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold">Authorization Protocol:</span>
                  <div className="text-slate-200 mt-0.5 font-medium">Tri-Service Joint Dispatch (EMS, Traffic Police, Fire)</div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold">Active Dispatch Consoles:</span>
                  <div className="text-emerald-400 font-semibold mt-0.5">12 / 14 Operator Consoles Synchronized</div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold">Inter-Agency Data Gateway:</span>
                  <div className="text-cyan-300 font-semibold mt-0.5">State Disaster Management & City Traffic Police ITMS</div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold">CAD Dispatch Hotline:</span>
                  <div className="text-amber-400 font-mono font-bold text-xs mt-0.5">{crProfile.cadHotline}</div>
                </div>
              </div>
            </div>

            {/* Column 2: Network Telemetry & Technical Infrastructure */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Server className="w-4 h-4 text-blue-400" />
                Network Telemetry & Infrastructure
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">TETRA Encrypted Trunking</span>
                    <span className="text-slate-400 text-[11px]">{crProfile.tetraFrequency}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-amber-600/20 text-amber-400 rounded-lg shrink-0">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">VHF Mutual Aid Frequency</span>
                    <span className="text-slate-400 text-[11px]">{crProfile.vhfBackupFrequency} (Multi-agency mutual aid)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">ITMS Green Wave Preemption</span>
                    <span className="text-slate-400 text-[11px]">{crProfile.itmsStatus}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">AVL GPS Polling Latency</span>
                    <span className="text-slate-400 text-[11px]">1.5 second high-frequency real-time vehicle positioning</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Shift Handover Log & Station Duty Notes */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Shift Handover Log & Duty Notes
                </h3>
                {crSaveSuccess && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5" /> Log Saved
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-400">
                  Duty notes logged here are broadcast to incoming shift supervisors and appended to the emergency audit ledger:
                </p>

                <textarea
                  rows={4}
                  value={crNotesInput}
                  onChange={(e) => setCrNotesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  placeholder="Enter duty notes, active corridor priorities, weather alerts, or vehicle reserve directives..."
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">Last logged by: {crProfile.dutySupervisor}</span>
                  <button
                    onClick={handleSaveCrNotes}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950/40 transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Shift Log
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 mt-4">
                <span className="text-slate-400 text-xs font-semibold block">Regional Fleet & Network Status:</span>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-emerald-400 font-bold font-mono text-base">{countAvailableAmbulances}</span>
                    <span className="text-[10px] text-slate-400 block">Fleet Ready</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-blue-400 font-bold font-mono text-base">{hospitals.length}</span>
                    <span className="text-[10px] text-slate-400 block">Facilities Linked</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SECTION 2: TOP 8 STATISTICS CARDS (PROMPT SECTION 15) */}
      {portalTab !== 'Profile' && portalTab !== 'DisasterSwarm' && (
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        
        {/* 1. 🔴 Active Emergencies */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-2xl text-center shadow-lg transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-red-500">
            <AlertOctagon className="w-4 h-4 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active SOS</span>
          </div>
          <div className="text-2xl font-black font-mono text-red-400">{countActiveEmergencies}</div>
          <span className="text-[10px] text-slate-500">🔴 Live Cases</span>
        </div>

        {/* 2. 🚑 Available Ambulances */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-center shadow-lg transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-400">
            <Ambulance className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ready</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">{countAvailableAmbulances}</div>
          <span className="text-[10px] text-slate-500">🚑 Available Fleet</span>
        </div>

        {/* 3. 🚑 Ambulances En Route */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl text-center shadow-lg transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-amber-400">
            <Activity className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">En Route</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{countAmbulancesEnRoute}</div>
          <span className="text-[10px] text-slate-500">🚑 In Transit</span>
        </div>

        {/* 4. 🏥 Available Trauma Centers */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl text-center shadow-lg transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-blue-400">
            <Building2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trauma Centers</span>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">{countAvailableHospitals} / {hospitals.length}</div>
          <span className="text-[10px] text-slate-500">ICU Ready</span>
        </div>

        {/* 5. 🛏 Emergency Beds */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl text-center shadow-lg transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-purple-400">
            <Bed className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ER Beds</span>
          </div>
          <div className="text-2xl font-black font-mono text-purple-400">{totalEmergencyBeds}</div>
          <span className="text-[10px] text-slate-500">🛏 Total Citywide</span>
        </div>

        {/* 6. 🫁 Oxygen */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-center shadow-lg transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-cyan-400">
            <Wind className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Oxygen</span>
          </div>
          <div className="text-xl font-black font-mono text-cyan-400">{(totalOxygenLitres / 1000).toFixed(1)}k L</div>
          <span className="text-[10px] text-slate-500">🫁 Reserve Status</span>
        </div>

        {/* 7. 🩸 Blood */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl text-center shadow-lg transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-rose-500">
            <Droplets className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blood Bank</span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">{totalBloodUnits} u</div>
          <span className="text-[10px] text-slate-500">🩸 In Stock</span>
        </div>

        {/* 8. 🫁 Ventilators */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl text-center shadow-lg transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-teal-400">
            <Activity className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ventilators</span>
          </div>
          <div className="text-2xl font-black font-mono text-teal-400">{totalVentilators}</div>
          <span className="text-[10px] text-slate-500">🫁 Active Units</span>
        </div>

      </section>
      )}

      {/* ========================================================================= */}
      {/* DISASTER SWARM MODE — shown on Dashboard AND as dedicated tab view       */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || portalTab === 'DisasterSwarm') && (
        <section className="animate-fade-in">
          {portalTab === 'DisasterSwarm' && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <span className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  </span>
                  Disaster Swarm Mode
                </h2>
                <p className="text-xs text-slate-400 mt-1 ml-12">
                  Real-time multi-hazard incident map · Swarm agent coordination · Live telemetry feed
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-red-400 bg-red-950/60 px-3 py-1.5 rounded-xl border border-red-800 animate-pulse">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-ping" />
                LIVE COMMAND FEED
              </span>
            </div>
          )}
          <DisasterSwarmMap />
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: LIVE AMBULANCE & EMERGENCY MAP (Shown on Dashboard & Live Map) */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || portalTab === 'Live Map') && (
        !isEmergencyProtocolCompleted ? (
          <EmergencyMapLockScreen
            portalName="Control Room Portal"
            featureName={portalTab === 'Live Map' ? "Regional GIS Live Map" : "Live Ambulance Fleet & Emergency Incident GIS Map"}
            themeColor="purple"
          />
        ) : (
          <section className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  {portalTab === 'Live Map' ? "Regional GIS Live Map" : "Live Ambulance Fleet & Emergency Incident GIS Map"}
                </h2>
                <p className="text-xs text-slate-400">
                  Patients, active emergencies, ambulances, destinations, routes, severity levels, and resource availability (DEMO MODE)
                </p>
              </div>

              {currentIncident && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleGreenCorridor(currentIncident.id, !(currentIncident.trafficPolicePermission === 'GRANTED' || currentIncident.greenCorridorActive))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                      (currentIncident.trafficPolicePermission === 'GRANTED' || currentIncident.greenCorridorActive)
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-1 ring-emerald-400'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 ring-1 ring-blue-400'
                    }`}
                    title="Toggle Traffic Police Permission to turn emergency route GREEN"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {(currentIncident.trafficPolicePermission === 'GRANTED' || currentIncident.greenCorridorActive)
                      ? '🟢 Traffic Police: Permission GRANTED (Route GREEN)'
                      : '⚠️ Traffic Police: Permission REQUIRED (Route Remains BLUE)'}
                  </button>
                </div>
              )}
            </div>

            <EmergencyMap
              center={[22.5415, 88.3485]}
              zoom={13}
              ambulances={ambulances}
              hospitals={hospitals}
              activeEmergency={currentIncident}
              trafficSignals={trafficSignals}
              patientLocation={currentIncident?.location}
              height={portalTab === 'Live Map' ? "640px" : "500px"}
              defaultMode="interactive"
            />
          </section>
        )
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: CONTROL ROOM EMERGENCY ALERTS & ACTIONS (Dashboard / Emergencies) */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || portalTab === 'Emergencies') && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                Control Room Emergency Alerts & Multi-Agency Dispatch
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage emergency responses: accept, assign, reassign ambulance, select destination, notify trauma bay, escalate, and communicate
              </p>
            </div>
            <span className="text-xs font-mono text-red-400 bg-red-950 px-2.5 py-1 rounded-lg border border-red-800 font-bold">
              {activeEmergencies.length} Incidents Live
            </span>
          </div>

          {/* Detailed Alert Cards */}
          <div className="space-y-4">
            {activeEmergencies.map((emg) => {
              const amb = ambulances.find(a => a.id === emg.assignedAmbulanceId);
              const hosp = hospitals.find(h => h.id === emg.destinationHospitalId) || hospitals[0];
              const isSelected = selectedEmergencyId === emg.id;

              return (
                <div
                  key={emg.id}
                  onClick={() => setSelectedEmergencyId(emg.id)}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-purple-500 ring-1 ring-purple-500 shadow-xl'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-400">{emg.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          emg.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {emg.severity}
                        </span>
                        <span className="text-xs font-bold text-white">• {emg.emergencyType}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                          {emg.status}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white">
                        Patient: {emg.patientName} ({emg.patientAge} yrs, {emg.patientGender}, Blood: {emg.patientBloodGroup})
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                        <span>Location: <strong>{emg.location?.address}</strong></span>
                        <span>Vehicle(s): <strong className="text-amber-400 font-mono">{emg.numberOfAmbulances === 'Many' ? 'Many (Fleet Mobilized)' : (emg.numberOfAmbulances > 1 ? `${emg.numberOfAmbulances} Units (${amb?.plateNumber || ''})` : (amb?.plateNumber || 'Unassigned'))}</strong></span>
                        <span>•</span>
                        <span>ETA: <strong className="text-emerald-400 font-mono">{emg.etaMinutes || 6}m</strong></span>
                        <span>•</span>
                        <span>Destination: <strong className="text-blue-400">{hosp?.name}</strong></span>
                      </div>
                    </div>

                    {/* Right: Operational Actions (Prompt Section 17) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      
                      {/* Accept Emergency */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptEmergency(emg);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
                        title="Accept emergency into control queue"
                      >
                        Accept
                      </button>

                      {/* Reassign Ambulance */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReassignModalIncident(emg);
                        }}
                        className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg font-semibold flex items-center gap-1"
                        title="Reassign or allocate ambulance"
                      >
                        <Ambulance className="w-3.5 h-3.5" />
                        <span>Reassign Amb</span>
                      </button>

                      {/* Select Hospital */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRerouteModalIncident(emg);
                        }}
                        className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-lg font-semibold flex items-center gap-1"
                        title="Reroute to different medical facility"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Select Destination</span>
                      </button>

                      {/* Notify Hospital */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotifyHospital(hosp, emg);
                        }}
                        className="px-2.5 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg font-semibold"
                        title="Direct notify emergency trauma unit"
                      >
                        Notify Facility
                      </button>

                      {/* Escalate */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEscalateIncident(emg);
                        }}
                        className="px-2.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg font-bold"
                        title="Escalate emergency"
                      >
                        Escalate
                      </button>

                      {/* Communicate Dropdown */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommsModalTarget({ type: 'ambulance', targetName: amb?.plateNumber || 'Dispatched Ambulance' });
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1"
                        title="Communicate with vehicle/doctor/facility"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Comms</span>
                      </button>

                      {/* Complete / Admit */}
                      {emg.status !== 'Completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmArrival(emg);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow"
                        >
                          Admit ER
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 20: Patient Arrival Management Panel */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Section 20: Patient Arrival & Trauma Bay Readiness
              </span>
              <span className="text-xs text-slate-400">Incoming Resuscitations</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {activeEmergencies.map((emg) => {
                const p = patients.find(pat => pat.id === emg.patientId) || patients[0];
                return (
                  <div key={emg.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white">{p.name} ({p.age}y / {p.gender})</div>
                      <span className="text-emerald-400 font-mono font-bold">ETA: {emg.etaMinutes || 6}m</span>
                    </div>
                    <div className="text-slate-300">
                      Ambulance: <strong className="text-amber-400">{emg.assignedAmbulanceId || 'AMB-01'}</strong> • Emergency: <strong>{emg.emergencyType}</strong>
                    </div>
                    <div className="text-slate-400">
                      Allergies: <span className="text-rose-300 font-semibold">{p.allergies}</span>
                    </div>
                    <div className="text-slate-400">
                      Required Facilities: <strong className="text-white">Trauma Red Bay, 2x O- PRBC units, Emergency CT Bay</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: AMBULANCES FLEET MANAGEMENT (Ambulances tab) */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || portalTab === 'Ambulances') && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-amber-400" />
                Ambulance Management & Multi-Dispatch Control
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized emergency fleet command: dispatch multiple distinct ambulances from different approach directions, monitor speed, and update destination facility
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-amber-400 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-800 font-bold">
                {ambulances.length} Total Units in Fleet
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800 font-bold">
                {ambulances.filter(a => a.status === 'Available').length} On Standby
              </span>
            </div>
          </div>

          {/* DEDICATED MULTI-AMBULANCE DISPATCH & FLEET MOBILIZATION CONTROL PANEL */}
          {currentIncident && (
            <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Target Incident for Multi-Dispatch:</span>
                      <span className="font-mono text-xs font-black text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{currentIncident.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        currentIncident.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>{currentIncident.severity}</span>
                      <span className="text-xs font-semibold text-slate-300">• {currentIncident.patientName} ({currentIncident.emergencyType})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Location: <span className="text-slate-200">{currentIncident.location?.address || 'AJC Bose Road / Exide Crossing, Kolkata'}</span>
                    </p>
                  </div>
                </div>

                {/* Multi-Dispatch Quick Scaler (1x, 2x, 3x, 4x, Many) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-400 font-bold mr-1">Mobilize Fleet:</span>
                  {[
                    { cnt: 1, label: '1 Unit', desc: 'Primary West ALS' },
                    { cnt: 2, label: '2 Units', desc: 'West + North' },
                    { cnt: 3, label: '3 Units', desc: 'West + North + East' },
                    { cnt: 4, label: '4 Units', desc: 'West + North + East + South' },
                    { cnt: 'Many', label: 'All 5 Fleet', desc: 'Mass Casualty (All Directions)' }
                  ].map(({ cnt, label, desc }) => {
                    const isCntActive = cnt === 'Many'
                      ? (currentIncident.numberOfAmbulances === 'Many' || currentIncident.numberOfAmbulances === 'many' || (currentIncident.assignedAmbulanceIds?.length >= 5))
                      : (Number(currentIncident.numberOfAmbulances) === cnt || (!currentIncident.numberOfAmbulances && cnt === 1) || (currentIncident.assignedAmbulanceIds?.length === cnt && currentIncident.numberOfAmbulances !== 'Many'));
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => dispatchMultipleAmbulances(currentIncident.id, cnt)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex flex-col items-center cursor-pointer ${
                          isCntActive
                            ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 font-black scale-105'
                            : cnt === 'Many'
                              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                        title={`Mobilize ${desc}`}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Fleet Selection Matrix (Checkboxes/Chips for each distinct ambulance) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Select Different Ambulances to Dispatch (Arriving from Different Cardinal Directions):
                  </span>
                  <span className="text-[11px] font-mono text-amber-300">
                    {currentIncident.assignedAmbulanceIds?.length || (currentIncident.assignedAmbulanceId ? 1 : 0)} / {ambulances.length} Different Vehicles Responding
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {ambulances.map((amb, idx) => {
                    const isAssigned = (currentIncident.assignedAmbulanceIds || [currentIncident.assignedAmbulanceId]).includes(amb.id);
                    const dirNorm = amb.direction ? amb.direction.toLowerCase().replace(/[^a-z]/g, '') : '';
                    const matchedThemeIdx = dirNorm
                      ? AMBULANCE_DIRECTION_CONFIGS.findIndex(c => c.key.toLowerCase().replace(/[^a-z]/g, '') === dirNorm || c.directionName.toLowerCase().replace(/[^a-z]/g, '') === dirNorm)
                      : -1;
                    const theme = getAmbulanceTheme(matchedThemeIdx >= 0 ? matchedThemeIdx : idx, false);

                    return (
                      <button
                        key={amb.id}
                        type="button"
                        onClick={() => toggleAmbulanceDispatch(currentIncident.id, amb.id)}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                          isAssigned
                            ? 'bg-slate-900 shadow-lg ring-2'
                            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 opacity-75 hover:opacity-100'
                        }`}
                        style={isAssigned ? {
                          borderColor: theme.color,
                          boxShadow: `0 0 12px ${theme.color}30`
                        } : {}}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase text-white shadow-sm flex items-center gap-1"
                            style={{ backgroundColor: theme.color }}
                          >
                            <span>{theme.arrow}</span>
                            <span>{theme.badge}</span>
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                            isAssigned
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isAssigned ? '✓ DISPATCHED' : '+ STANDBY'}
                          </span>
                        </div>

                        <div className="font-mono text-xs font-black text-white truncate">{amb.plateNumber}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          Driver: <strong className="text-slate-200">{amb.driverName.split(' ')[0]}</strong>
                        </div>
                        <div className="text-[9px] text-slate-500 truncate mt-0.5">{theme.landmark}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* INDIVIDUAL AMBULANCE FLEET CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambulances.map((amb, idx) => {
              const activeEmg = activeEmergencies.find(e =>
                (e.assignedAmbulanceId === amb.id || (Array.isArray(e.assignedAmbulanceIds) && e.assignedAmbulanceIds.includes(amb.id))) &&
                e.status !== 'Completed'
              );
              const isAssignedToCurrent = (currentIncident?.assignedAmbulanceIds || [currentIncident?.assignedAmbulanceId]).includes(amb.id);

              const dirNorm = amb.direction ? amb.direction.toLowerCase().replace(/[^a-z]/g, '') : '';
              const matchedThemeIdx = dirNorm
                ? AMBULANCE_DIRECTION_CONFIGS.findIndex(c => c.key.toLowerCase().replace(/[^a-z]/g, '') === dirNorm || c.directionName.toLowerCase().replace(/[^a-z]/g, '') === dirNorm)
                : -1;
              const theme = getAmbulanceTheme(matchedThemeIdx >= 0 ? matchedThemeIdx : idx, false);

              return (
                <div
                  key={amb.id}
                  className={`p-4 bg-slate-950 border rounded-2xl space-y-3 transition-all ${
                    isAssignedToCurrent ? 'border-amber-500/60 shadow-lg shadow-amber-950/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-black text-amber-400">{amb.plateNumber}</span>
                        <span className="text-[10px] font-mono text-slate-500">({amb.id})</span>
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase shadow-sm"
                          style={{ backgroundColor: theme.color }}
                        >
                          {theme.arrow} {theme.badge}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">{amb.type}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      amb.status === 'Available'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {amb.status}
                    </span>
                  </div>

                  {/* Directional Approach Corridor Info */}
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Approach Station:</span>
                      <strong className="text-slate-200" style={{ color: theme.color }}>{theme.directionName} Corridor</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Corridor: <span className="text-slate-300">{theme.corridorName}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 border-t border-slate-900 pt-2">
                    <div className="flex justify-between">
                      <span>Driver / Contact:</span>
                      <strong className="text-slate-200">{amb.driverName} ({amb.driverPhone})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Paramedic:</span>
                      <strong className="text-slate-200">{amb.paramedicName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Facility:</span>
                      <strong className="text-blue-400">{amb.hospitalName}</strong>
                    </div>
                  </div>

                  {/* Pre-Treatment Equipment Readiness & Inspect */}
                  {(() => {
                    const readyCount = EQUIPMENT_DEFINITIONS.filter(def => amb.equipment?.[def.key]?.verified).length;
                    const totalCount = EQUIPMENT_DEFINITIONS.length;
                    const pct = Math.round((readyCount / totalCount) * 100);
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${pct >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            <CheckSquare className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                              <span>Equipment:</span>
                              <span className={pct >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{pct}% ALS Ready</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {readyCount}/{totalCount} Items Verified
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEquipmentAmbulance(amb)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Active Incident Tag or Individual Dispatch Button */}
                  {activeEmg ? (
                    <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between text-red-300 font-bold">
                        <span>Incident: {activeEmg.id}</span>
                        <span>ETA: {activeEmg.etaMinutes || 6}m</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        Patient: {activeEmg.patientName} • {activeEmg.emergencyType}
                      </p>
                      {currentIncident && isAssignedToCurrent && (
                        <button
                          type="button"
                          onClick={() => toggleAmbulanceDispatch(currentIncident.id, amb.id)}
                          className="w-full py-1 text-center bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Release / Recall Unit from Emergency
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-mono">Ready on Standby</span>
                      {currentIncident && (
                        <button
                          type="button"
                          onClick={() => toggleAmbulanceDispatch(currentIncident.id, amb.id)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Dispatch to Incident
                        </button>
                      )}
                    </div>
                  )}

                  {/* Comms */}
                  <button
                    type="button"
                    onClick={() => setCommsModalTarget({ type: 'ambulance', targetName: amb.plateNumber })}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-amber-400" />
                    <span>Send Driver Message</span>
                  </button>

                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5B: FLEET PRE-TREATMENT EQUIPMENT MATRIX (Equipment tab) */}
      {/* ========================================================================= */}
      {portalTab === 'Equipment' && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                Fleet Pre-Treatment Equipment Readiness & Verification Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized control room compliance inspection of ventilator, defibrillator, O2 cylinder, suction, trauma pack, and resuscitation meds
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950 px-3 py-1 rounded-lg border border-amber-800 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              CAD Fleet Equipment Audit
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {ambulances.map((amb) => {
              const activeEmg = activeEmergencies.find(e => e.assignedAmbulanceId === amb.id && e.status !== 'Completed');
              return (
                <div key={amb.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Ambulance className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-sm font-black text-amber-400">{amb.plateNumber}</h4>
                          <span className="text-xs font-mono text-slate-400">({amb.id})</span>
                          <span className="text-xs text-slate-400">• {amb.type}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            amb.status === 'Available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {amb.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Driver: {amb.driverName} ({amb.driverPhone}) • Paramedic: {amb.paramedicName} • Facility: {amb.hospitalName}
                        </p>
                      </div>
                    </div>

                    {activeEmg && (
                      <span className="text-xs px-2.5 py-1 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                        En Route: {activeEmg.patientName} ({activeEmg.emergencyType})
                      </span>
                    )}
                  </div>

                  <PreTreatmentEquipmentChecklist
                    ambulance={amb}
                    ambulanceId={amb.id}
                    emergency={activeEmg}
                    canEdit={false}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: FACILITIES & RESOURCE TELEMETRY (Facilities / Resources) */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || portalTab === 'Facilities' || portalTab === 'Hospitals' || portalTab === 'Resources') && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Facility Network & Live Resource Telemetry
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor and adjust Emergency Beds, ICU beds, Oxygen, Blood, Ventilators, ER Doctors, Operating Rooms (🟢 Available, 🟡 Limited, 🔴 Unavailable)
              </p>
            </div>

            {/* Facility Selector for Live Editor */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Edit Facility:</span>
              <select
                value={activeHospitalId}
                onChange={(e) => handleSelectHospitalForEdit(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Facility Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hospitals.map((hosp) => {
              const isSelected = hosp.id === activeHospitalId;

              return (
                <div
                  key={hosp.id}
                  onClick={() => handleSelectHospitalForEdit(hosp.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 ring-1 ring-emerald-500 shadow-xl'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm leading-tight">{hosp.name}</h4>
                      <span className="text-[10px] text-emerald-400 font-medium">{hosp.type} Center</span>
                    </div>
                    {getStatusBadge(hosp.oxygenStatus)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                    <div className="p-2 bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">General Beds</span>
                      <strong className="text-slate-200 text-sm">{hosp.generalBeds}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">ICU Beds</span>
                      <strong className="text-emerald-400 text-sm">{hosp.icuBeds}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Oxygen</span>
                      <strong className="text-cyan-400 text-sm">{hosp.oxygenLitres}L</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Ventilators</span>
                      <strong className="text-purple-400 text-sm">{hosp.ventilators}</strong>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Doctors: <strong className="text-white">{hosp.doctorsOnDuty}</strong></span>
                    <span>OTs: <strong className="text-white">{hosp.operatingTheatres}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE FACILITY RESOURCE TELEMETRY EDITOR */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Live Resource Telemetry Editor — {currentHospital.name}
                </h4>
                <p className="text-xs text-slate-400">Update bed counters and gas supplies directly during mass casualty events</p>
              </div>

              <button
                onClick={handleSaveHospitalResources}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Telemetry</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Facility resource telemetry synchronized across the emergency response network.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              
              {/* General Beds Counter */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>General Beds</span>
                  <span className="font-mono text-base font-bold text-white">{resGeneralBeds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setResGeneralBeds(Math.max(0, resGeneralBeds - 1))}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex-1 flex justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setResGeneralBeds(resGeneralBeds + 1)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex-1 flex justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ICU Beds Counter */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>ICU Beds</span>
                  <span className="font-mono text-base font-bold text-emerald-400">{resIcuBeds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setResIcuBeds(Math.max(0, resIcuBeds - 1))}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex-1 flex justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setResIcuBeds(resIcuBeds + 1)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex-1 flex justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Ventilators Counter */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>Ventilators</span>
                  <span className="font-mono text-base font-bold text-purple-400">{resVentilators}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setResVentilators(Math.max(0, resVentilators - 1))}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex-1 flex justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setResVentilators(resVentilators + 1)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex-1 flex justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Oxygen Status Selector */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-300 font-semibold block">Oxygen Status</span>
                <select
                  value={resOxygenStatus}
                  onChange={(e) => setResOxygenStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="Available">Available (Optimal)</option>
                  <option value="Limited">Limited (Warning)</option>
                  <option value="Unavailable">Unavailable (Critical)</option>
                </select>
              </div>

            </div>

            {/* Blood Bank Live Stock */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Blood Bank Inventory (Units in Reserve):</span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {Object.entries(resBloodBank || {}).map(([group, units]) => (
                  <div key={group} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-xs font-bold text-red-400 font-mono block">{group}</span>
                    <strong className="text-sm font-bold text-white block my-0.5">{units} u</strong>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <button
                        onClick={() => handleBloodDelta(group, -1)}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleBloodDelta(group, 1)}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: COMMUNICATIONS TAB */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || portalTab === 'Communications') && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Dispatch Radio Broadcast Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-400" />
              Emergency Broadcast Transmitter (Control Room Comms)
            </h3>
            <p className="text-xs text-slate-400">
              Transmit high-priority dispatch instructions across all connected ambulance tablets, facility consoles, and trauma surgeon stations.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. Major collision on AJC Bose Road Flyover. All ALS ambulances in Central Kolkata maintain standby. SSKM Hospital ER prepare Red Bay 1..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-colors flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>Transmit Network Alert to Fleet & Facilities</span>
              </button>
            </form>
          </div>

          {/* Traffic Signal Preemption Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  Traffic Signal Preemption System (Green Wave)
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Simulated SCATS / ITMS Integration</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              DEMO — Traffic-signal integration is simulated and does not control real government traffic infrastructure.
            </p>

            <div className="space-y-2 text-xs">
              {trafficSignals.map(sig => (
                <div key={sig.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{sig.name}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{sig.id}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                    sig.state === 'GREEN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {sig.state} ({sig.preemptionCountdown}s)
                  </span>
                </div>
              ))}
            </div>
          </div>

        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 8: AUDIT LOGS (Logs tab) */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || portalTab === 'Logs') && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Tamper-Evident Emergency Audit Logs & Relational Architecture
              </h3>
              <p className="text-xs text-slate-400">Chronological trail of every SOS, medical record access, resource edit, and Green Corridor preemption</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{auditLogs.length} Logged Entries</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-400 font-bold">{log.id}</span>
                      <span className="font-semibold text-white">{log.action}</span>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {log.actorRole} ({log.actorId})
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* REASSIGN AMBULANCE MODAL */}
      {reassignModalIncident && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-600 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Ambulance className="w-4 h-4 text-amber-400" />
                Reassign Responding Ambulance
              </span>
              <button onClick={() => setReassignModalIncident(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300">
              Select an available fleet vehicle to reassign to incident <strong>{reassignModalIncident.id}</strong> ({reassignModalIncident.emergencyType}):
            </p>

            <select
              value={selectedAmbForReassign}
              onChange={(e) => setSelectedAmbForReassign(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
            >
              <option value="">-- Choose Ambulance Unit --</option>
              {ambulances.map(a => (
                <option key={a.id} value={a.id}>
                  {a.plateNumber} ({a.type}) - Status: {a.status}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReassignModalIncident(null)} className="px-4 py-2 text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleExecuteReassign}
                disabled={!selectedAmbForReassign}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl disabled:opacity-50"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REROUTE DESTINATION MODAL */}
      {rerouteModalIncident && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-600 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Select Destination Facility
              </span>
              <button onClick={() => setRerouteModalIncident(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300">
              Reroute emergency <strong>{rerouteModalIncident.id}</strong> to a specialized medical trauma center:
            </p>

            <select
              value={selectedHospForReroute}
              onChange={(e) => setSelectedHospForReroute(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
            >
              <option value="">-- Choose Medical Facility --</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} (ICU: {h.icuBeds}, ER: {h.generalBeds}, {h.type})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRerouteModalIncident(null)} className="px-4 py-2 text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleExecuteReroute}
                disabled={!selectedHospForReroute}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                Confirm Destination Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT COMMUNICATIONS MODAL */}
      {commsModalTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-600 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Communicate with {commsModalTarget.targetName}
              </span>
              <button onClick={() => setCommsModalTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendDirectComms} className="space-y-3">
              <textarea
                rows={3}
                value={commsDirectText}
                onChange={(e) => setCommsDirectText(e.target.value)}
                placeholder={`Type direct radio/terminal message to ${commsModalTarget.targetName}...`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCommsModalTarget(null)} className="px-4 py-2 text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow">
                  Transmit Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CONTROL ROOM PROFILE MODAL */}
      {isEditCrProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-600 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Edit Control Room Command Node & Security Credentials
              </span>
              <button
                onClick={() => setIsEditCrProfileModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCrProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Command Center Name:</label>
                  <input
                    type="text"
                    value={crProfile.stationName}
                    onChange={(e) => setCrProfile({ ...crProfile, stationName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Station Node ID:</label>
                  <input
                    type="text"
                    value={crProfile.stationNodeId}
                    onChange={(e) => setCrProfile({ ...crProfile, stationNodeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Duty Supervisor Name:</label>
                  <input
                    type="text"
                    value={crProfile.dutySupervisor}
                    onChange={(e) => setCrProfile({ ...crProfile, dutySupervisor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Badge / Operator ID:</label>
                  <input
                    type="text"
                    value={crProfile.badgeId}
                    onChange={(e) => setCrProfile({ ...crProfile, badgeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Security Clearance Level:</label>
                  <input
                    type="text"
                    value={crProfile.clearanceLevel}
                    onChange={(e) => setCrProfile({ ...crProfile, clearanceLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Shift Schedule:</label>
                  <input
                    type="text"
                    value={crProfile.shiftSchedule}
                    onChange={(e) => setCrProfile({ ...crProfile, shiftSchedule: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Secure Landline Comms:</label>
                  <input
                    type="text"
                    value={crProfile.secureLandline}
                    onChange={(e) => setCrProfile({ ...crProfile, secureLandline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">CAD Dispatch Desk Hotline:</label>
                  <input
                    type="text"
                    value={crProfile.cadHotline}
                    onChange={(e) => setCrProfile({ ...crProfile, cadHotline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Primary Encrypted TETRA Channel:</label>
                  <input
                    type="text"
                    value={crProfile.tetraFrequency}
                    onChange={(e) => setCrProfile({ ...crProfile, tetraFrequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Secondary VHF Backup Radio:</label>
                  <input
                    type="text"
                    value={crProfile.vhfBackupFrequency}
                    onChange={(e) => setCrProfile({ ...crProfile, vhfBackupFrequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-400 font-semibold">Territorial Jurisdiction & Regional Corridor:</label>
                  <input
                    type="text"
                    value={crProfile.jurisdiction}
                    onChange={(e) => setCrProfile({ ...crProfile, jurisdiction: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditCrProfileModalOpen(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/40 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Station Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRE-TREATMENT EQUIPMENT INSPECTION MODAL */}
      {selectedEquipmentAmbulance && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Pre-Treatment Equipment Audit: {selectedEquipmentAmbulance.plateNumber} ({selectedEquipmentAmbulance.id})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live telemetry of ALS equipment verified by field paramedic crew • Control Room Oversight
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEquipmentAmbulance(null)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <PreTreatmentEquipmentChecklist
              ambulance={selectedEquipmentAmbulance}
              ambulanceId={selectedEquipmentAmbulance.id}
              canEdit={false}
              onClose={() => setSelectedEquipmentAmbulance(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
