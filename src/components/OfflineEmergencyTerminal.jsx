import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { NETWORK_MODES, offlineSyncService } from '../services/offlineSyncService';
import {
  Wifi,
  WifiOff,
  Radio,
  Signal,
  Send,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  Info,
  Check,
  Satellite,
  Activity,
  Heart,
  FileText,
  User,
  MapPin,
  Compass,
  AlertOctagon,
  Layers,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Save,
  Volume2,
  ArrowLeft,
  Inbox,
  ArrowDownLeft,
  ArrowUpRight,
  Share2
} from 'lucide-react';
import { InboundSmsFeed } from './InboundSmsFeed';

export const OfflineEmergencyTerminal = () => {
  const {
    networkMode,
    setNetworkMode,
    currentRole,
    setPortalTab,
    smsTransmissions,
    receivedSms,
    getReceivedSmsForRole,
    getAllowedSendersForRole,
    SMS_ROUTING_MATRIX,
    offlineQueue,
    syncOfflineQueue,
    isSyncing,
    triggerEmergencySmsFallback,
    activeEmergencies,
    ambulances,
    patients,
    currentUser,
    updateTriage,
    playAlertSound,
    soundEnabled,
    toggleSiren,
    addNotification,
    logAudit
  } = useEmergency();

  const myAmbulance = ambulances.find(a => a.id === currentUser?.referenceId) || ambulances[0];
  const activeEmergency = activeEmergencies.find(e => e.assignedAmbulanceId === myAmbulance.id) || activeEmergencies.find(e => e.patientId === currentUser?.referenceId) || activeEmergencies[0];
  const patient = (currentUser?.role?.toLowerCase() === 'patient'
    ? patients.find(p => p.id === currentUser?.referenceId)
    : null) || patients.find(p => p.id === activeEmergency?.patientId) || patients[0];

  // Active Terminal Sub-Tab
  const [activeTab, setActiveTab] = useState('assessment'); // 'assessment' | 'vitals' | 'patient_record' | 'sms_fallback' | 'sync_queue'
  const [smsSubTab, setSmsSubTab] = useState('inbound'); // 'inbound' | 'contacts' | 'outbound_log' | 'matrix'

  // Local Triage Assessment State (Active offline)
  const [localTriage, setLocalTriage] = useState({
    consciousness: activeEmergency?.triageScore?.consciousness || 'Alert',
    abilityToWalk: activeEmergency?.triageScore?.abilityToWalk || 'No',
    breathing: activeEmergency?.triageScore?.breathing || 'Rapid (24 bpm)',
    heartRate: activeEmergency?.triageScore?.heartRate || 112,
    bloodPressure: activeEmergency?.triageScore?.bloodPressure || '105/70 mmHg',
    oxygenSaturation: activeEmergency?.triageScore?.oxygenSaturation || '92%',
    severity: activeEmergency?.severity || 'Critical',
    triageCategory: 'RED - Immediate Trauma Care',
    gcsScore: 13,
    pupils: 'Equal & Reactive',
    localNote: ''
  });

  const [triageSavedMessage, setTriageSavedMessage] = useState(null);

  // Authorized Contacts Config State (Per Portal Role)
  const [contacts, setContacts] = useState(() => offlineSyncService.getAuthorizedContacts(currentRole || 'ambulance'));
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const [newContact, setNewContact] = useState({ role: '', name: '', phone: '', type: 'Emergency Dispatch' });

  useEffect(() => {
    setContacts(offlineSyncService.getAuthorizedContacts(currentRole || 'ambulance'));
  }, [currentRole]);

  // Paramedic Offline Clinical Notes Log
  const [offlineNotes, setOfflineNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('raksha_paramedic_offline_notes');
      return saved ? JSON.parse(saved) : [
        {
          id: 'NOTE-INIT',
          author: myAmbulance.paramedicName || 'Lead EMT',
          time: new Date().toLocaleTimeString(),
          text: 'Patient immobilized with cervical collar and vacuum mattress. High-flow oxygen initiated via non-rebreather mask (15 L/min).'
        }
      ];
    } catch {
      return [];
    }
  });
  const [currentNoteInput, setCurrentNoteInput] = useState('');

  // Live Simulated Vital Drift (keeps updating offline)
  const [liveVitals, setLiveVitals] = useState({
    hr: 112,
    spo2: 92,
    bpSys: 105,
    bpDia: 70,
    rr: 24,
    temp: 37.1
  });

  // Offline vital simulation tick
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveVitals(prev => {
        const hrDrift = Math.floor(Math.random() * 3) - 1;
        const spo2Drift = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const newHr = Math.min(145, Math.max(90, prev.hr + hrDrift));
        const newSpo2 = Math.min(99, Math.max(88, prev.spo2 + spo2Drift));

        // When offline or weak, periodically buffer vital stream packets locally
        if (networkMode !== NETWORK_MODES.ONLINE && Math.random() > 0.7) {
          offlineSyncService.queueOfflineData({
            type: 'vitals_stream',
            priority: newSpo2 < 90 ? 'critical' : 'normal',
            emergencyId: activeEmergency?.id,
            data: {
              timestamp: new Date().toISOString(),
              hr: newHr,
              spo2: newSpo2,
              bp: `${prev.bpSys}/${prev.bpDia}`,
              rr: prev.rr,
              ambulanceId: myAmbulance.id
            }
          });
        }

        return {
          ...prev,
          hr: newHr,
          spo2: newSpo2
        };
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [networkMode, activeEmergency?.id, myAmbulance.id]);

  // Handle Local Triage Save
  const handleSaveLocalTriage = (e) => {
    e.preventDefault();
    
    // Save locally
    const triageData = {
      consciousness: localTriage.consciousness,
      abilityToWalk: localTriage.abilityToWalk,
      breathing: localTriage.breathing,
      heartRate: Number(localTriage.heartRate),
      bloodPressure: localTriage.bloodPressure,
      oxygenSaturation: `${localTriage.oxygenSaturation}`.replace('%', '') + '%',
      gcsScore: localTriage.gcsScore,
      pupils: localTriage.pupils,
      recordedAt: new Date().toISOString(),
      offlineCached: true
    };

    updateTriage(activeEmergency?.id, triageData, localTriage.severity);

    // Queue in offline queue for cloud sync
    offlineSyncService.queueOfflineData({
      type: 'paramedic_assessment',
      priority: 'high',
      emergencyId: activeEmergency?.id,
      data: {
        triageData,
        severity: localTriage.severity,
        paramedic: myAmbulance.paramedicName,
        ambulanceId: myAmbulance.id,
        timestamp: new Date().toISOString()
      }
    });

    // If in SMS Fallback mode, automatically trigger emergency SMS broadcast with updated vitals!
    if (networkMode === NETWORK_MODES.SMS_FALLBACK) {
      triggerEmergencySmsFallback(activeEmergency, myAmbulance, `Triage Assessment Updated: ${localTriage.severity}`);
    }

    setTriageSavedMessage(`Triage stored to encrypted device cache at ${new Date().toLocaleTimeString()}!`);
    playAlertSound('normal');
    setTimeout(() => setTriageSavedMessage(null), 4000);
  };

  // Add Offline Paramedic Clinical Note
  const handleAddOfflineNote = (e) => {
    e.preventDefault();
    if (!currentNoteInput.trim()) return;

    const newNote = {
      id: `NOTE-${Date.now()}`,
      author: myAmbulance.paramedicName || 'Lead EMT',
      time: new Date().toLocaleTimeString(),
      text: currentNoteInput.trim()
    };

    const updated = [newNote, ...offlineNotes];
    setOfflineNotes(updated);
    try {
      localStorage.setItem('raksha_paramedic_offline_notes', JSON.stringify(updated));
    } catch {}

    // Queue in offline non-critical sync queue
    offlineSyncService.queueOfflineData({
      type: 'clinical_note',
      priority: 'normal',
      emergencyId: activeEmergency?.id,
      data: newNote
    });

    setCurrentNoteInput('');
  };

  // Save Contacts
  const handleSaveContacts = () => {
    offlineSyncService.saveAuthorizedContacts(contacts);
    setIsEditingContacts(false);
    addNotification('Authorized Contacts Saved', 'SMS emergency broadcast recipient registry updated.', 'success', 'ambulance');
  };

  const handleToggleContact = (id) => {
    const updated = contacts.map(c => c.id === id ? { ...c, active: !c.active } : c);
    setContacts(updated);
    offlineSyncService.saveAuthorizedContacts(updated, currentRole || 'ambulance');
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) return;
    const entry = {
      id: `CONTACT-${Date.now().toString().slice(-4)}`,
      role: newContact.role || 'Emergency Liaison',
      name: newContact.name,
      phone: newContact.phone,
      type: newContact.type,
      active: true,
      primary: false
    };
    const updated = [...contacts, entry];
    setContacts(updated);
    offlineSyncService.saveAuthorizedContacts(updated, currentRole || 'ambulance');
    setNewContact({ role: '', name: '', phone: '', type: 'Emergency Dispatch' });
  };

  const pendingQueue = (offlineQueue || []).filter(item => item.status === 'pending_sync');
  const syncedQueue = (offlineQueue || []).filter(item => item.status === 'synced');

  // Role-Specific SMS Payload Preview (Ambulance unchanged, others adapted)
  const smsPreview = offlineSyncService.buildRoleSpecificEmergencySms(currentRole || 'ambulance', {
    emergency: activeEmergency,
    ambulance: myAmbulance,
    patient,
    currentUser,
    emergencyId: activeEmergency?.id || 'EMG-8821',
    ambulanceId: myAmbulance.id,
    plateNumber: myAmbulance.plateNumber,
    coordinates: { lat: myAmbulance.lat, lng: myAmbulance.lng },
    landmark: activeEmergency?.location?.address || 'AJC Bose Road Flyover near Exide Crossing, Kolkata',
    priority: activeEmergency?.severity || 'CRITICAL',
    callbackRadio: 'VHF Emergency Ch 3',
    callbackPhone: myAmbulance.driverPhone || '+91 98991 12233'
  });

  const getRoleTerminalSmsConfig = () => {
    const norm = (currentRole === 'control_room' ? 'control-room' : currentRole) || 'ambulance';
    switch (norm) {
      case 'patient':
        return {
          title: 'Citizen Offline Emergency SOS SMS',
          tag: 'GSM-7 Citizen SOS',
          buttonText: 'Transmit Citizen SOS SMS Now',
          safeguardsTitle: 'Citizen Privacy & Rescue Protection:',
          safeguards: [
            { strong: 'Essential Demographics Only:', text: `Citizen ID ${patient?.id || 'PAT-01'}, blood group (${patient?.bloodGroup || 'O+'}), age & gender.` },
            { strong: 'Zero Medical History Leak:', text: 'Confidential clinical history and Aadhaar/SSN are completely omitted.' },
            { strong: 'Multi-Agency Alert:', text: 'Direct transmission to 108 Emergency Ambulance, 112 ERSS and designated kin.' }
          ]
        };
      case 'doctor':
        return {
          title: 'ER Trauma Physician Directives SMS',
          tag: 'GSM-7 Clinical STAT',
          buttonText: 'Transmit Clinical Directive SMS Now',
          safeguardsTitle: 'STAT Clinical Order Security:',
          safeguards: [
            { strong: 'Direct Resuscitation Orders:', text: 'Pre-arrival trauma bay preparation, airway management & PRBC blood crossmatch alerts.' },
            { strong: 'Paramedic VHF/GSM Link:', text: 'Immediately dispatches clinical directives to inbound ambulance paramedic.' },
            { strong: 'Zero Non-Clinical PII:', text: 'Transmits strictly incident reference without non-essential patient identifiers.' }
          ]
        };
      case 'paramedic':
        return {
          title: 'Paramedic Pre-Arrival Triage SMS',
          tag: 'GSM-7 Trauma Telemetry',
          buttonText: 'Transmit Pre-Arrival Triage SMS to ER',
          safeguardsTitle: 'Pre-Hospital Triage Protocol:',
          safeguards: [
            { strong: 'Real-Time Vitals Stream:', text: 'Transmits HR, SpO2, Blood Pressure and GCS trauma score.' },
            { strong: 'Intervention Log:', text: 'Logs administered medications and immobilization techniques for ER reception.' },
            { strong: 'Receiving ER Preparedness:', text: 'Alerts AIIMS Trauma ER intake prior to physical vehicle arrival.' }
          ]
        };
      case 'hospital':
        return {
          title: 'Hospital Surge & Resource Status SMS',
          tag: 'GSM-7 Surge Broadcast',
          buttonText: 'Broadcast Hospital Capacity SMS Now',
          safeguardsTitle: 'Facility Operational Telemetry:',
          safeguards: [
            { strong: 'Live Bed Availability:', text: 'Broadcasts free ICU beds, general beds, and functional ventilator count.' },
            { strong: 'Critical Oxygen Status:', text: 'Real-time telemetry on liquid medical oxygen reserves in litres.' },
            { strong: 'Diversion Management:', text: 'Informs dispatchers of mass-casualty intake capacity to prevent ER bottlenecks.' }
          ]
        };
      case 'control-room':
        return {
          title: 'Central Control Room Tactical SMS',
          tag: 'GSM-7 Tactical Dispatch',
          buttonText: 'Broadcast Tactical Dispatch SMS Now',
          safeguardsTitle: 'Central Tactical Command Preemption:',
          safeguards: [
            { strong: 'Green Wave Synchronization:', text: 'Transmits preemption requests to Delhi Traffic Police ITMS.' },
            { strong: 'Fleet Multi-Dispatch:', text: 'Directs primary and secondary ambulance units to incident coordinates.' },
            { strong: 'Receiving Bay Coordination:', text: 'Syncs destination hospital triage desk and emergency operations.' }
          ]
        };
      case 'ambulance':
      default:
        return {
          title: 'Minimal Emergency SMS',
          tag: 'GSM-7 Compact',
          buttonText: 'Transmit Emergency SMS Broadcast Now',
          safeguardsTitle: 'Mandatory Privacy Redactions:',
          safeguards: [
            { strong: 'No Patient Name:', text: `Only incident reference ${activeEmergency?.id || 'EMG-8821'}.` },
            { strong: 'No PII / Aadhaar:', text: 'Eliminates identity theft vulnerability.' },
            { strong: 'Only Essential Telemetry:', text: 'Lat/Lng, Priority, Ambulance ID & Radio callback.' }
          ]
        };
    }
  };

  const roleTerminalSms = getRoleTerminalSmsConfig();

  const roleTerminalTitles = {
    patient: 'Citizen Offline Emergency & Cellular SMS Terminal',
    doctor: 'Hospital ER Trauma Clinical Offline & SMS Fallback Terminal',
    ambulance: 'Smart Ambulance Fleet Offline-First & SMS Fallback Terminal',
    paramedic: 'On-Scene Paramedic / EMT Offline Resilient Terminal',
    hospital: 'Hospital ER Operations Offline & SMS Fallback Terminal',
    'control-room': 'Central Control Room Offline & Radio SMS Terminal',
    control_room: 'Central Control Room Offline & Radio SMS Terminal'
  };
  const terminalTitle = roleTerminalTitles[currentRole] || 'Raksha Mission-Critical Offline & SMS Fallback Terminal';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
        <button
          onClick={() => setPortalTab(currentRole === 'patient' ? 'Home' : 'Dashboard')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Back to {currentRole === 'patient' ? 'Patient Portal' : `${currentRole.replace('-', ' ').replace('_', ' ').toUpperCase()} Console`}</span>
        </button>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          Universal Offline Mode Active for: <strong className="text-white">{currentUser?.name || currentRole}</strong>
        </span>
      </div>

      {/* TERMINAL HEADER & TELEMETRY HUD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-start gap-4">
            <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shrink-0">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">{terminalTitle}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Mission-Critical Failover Active
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Autonomous local operations under internet loss: Real-time GPS fix, local triage & vitals buffer, cached medical records, and automated privacy-protected cellular SMS broadcast.
              </p>

              {/* Hardware Telemetry Bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5 font-mono">
                  <Satellite className="w-4 h-4 text-cyan-400" />
                  <span>GPS 3D Fix: <strong className="text-white">Active (9/12 Sats)</strong></span>
                  <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-1.5 rounded border border-cyan-800">HDOP 0.8</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  <Signal className="w-4 h-4 text-emerald-400" />
                  <span>Cellular Radio: <strong className="text-white">GSM Dual-SIM Ready</strong></span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Local Store: <strong className="text-white">Encrypted Buffer ({offlineQueue?.length || 0} pkts)</strong></span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Privacy Guard: <strong className="text-emerald-300">HIPAA / DISHA Enforced</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mode Switcher */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shrink-0 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Network Condition Simulator:</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => setNetworkMode(NETWORK_MODES.ONLINE)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${
                  networkMode === NETWORK_MODES.ONLINE
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Wifi className="w-4 h-4 mb-0.5" />
                <span>Online (5G)</span>
              </button>

              <button
                onClick={() => setNetworkMode(NETWORK_MODES.WEAK_NETWORK)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${
                  networkMode === NETWORK_MODES.WEAK_NETWORK
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Signal className="w-4 h-4 mb-0.5" />
                <span>Weak (2G)</span>
              </button>

              <button
                onClick={() => setNetworkMode(NETWORK_MODES.OFFLINE)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${
                  networkMode === NETWORK_MODES.OFFLINE
                    ? 'bg-rose-600 text-white font-black shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <WifiOff className="w-4 h-4 mb-0.5" />
                <span>Offline</span>
              </button>

              <button
                onClick={() => setNetworkMode(NETWORK_MODES.SMS_FALLBACK)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${
                  networkMode === NETWORK_MODES.SMS_FALLBACK
                    ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400 animate-pulse'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-0.5" />
                <span>SMS Mode</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* SUB-WORKSPACE NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('assessment')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'assessment'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Offline Emergency Assessment</span>
        </button>

        <button
          onClick={() => setActiveTab('vitals')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'vitals'
              ? 'bg-rose-600 text-white shadow-md font-black shadow-rose-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Vitals Buffer & Local Alarms</span>
        </button>

        <button
          onClick={() => setActiveTab('patient_record')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'patient_record'
              ? 'bg-cyan-600 text-white shadow-md font-black shadow-cyan-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Cached Patient Records & Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('sms_fallback')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'sms_fallback'
              ? 'bg-indigo-600 text-white shadow-md font-black shadow-indigo-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>SMS Fallback & Delivery ACK</span>
          {(smsTransmissions || []).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 font-mono font-bold">
              {smsTransmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sync_queue')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'sync_queue'
              ? 'bg-emerald-600 text-white shadow-md font-black shadow-emerald-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sync Outbox</span>
          {pendingQueue.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold font-mono">
              {pendingQueue.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-WORKSPACE 1: OFFLINE EMERGENCY ASSESSMENT & TRIAGE */}
      {/* ========================================================================= */}
      {activeTab === 'assessment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span>Clinical Emergency Assessment (Offline Mode Active)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record patient condition, consciousness, and vitals. Data is saved locally and auto-queued for transmission.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                Local Cache Enforced
              </span>
            </div>

            {triageSavedMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{triageSavedMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveLocalTriage} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Consciousness */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Consciousness Level (AVPU):</label>
                  <select
                    value={localTriage.consciousness}
                    onChange={(e) => setLocalTriage({ ...localTriage, consciousness: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Alert">Alert (Fully conscious & oriented)</option>
                    <option value="Verbal">Verbal (Responds only to voice stimuli)</option>
                    <option value="Pain">Pain (Responds only to sternal rub/pain)</option>
                    <option value="Unresponsive">Unresponsive (GCS &lt; 8 • Critical)</option>
                  </select>
                </div>

                {/* Mobility */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Mobility / Walking Ability:</label>
                  <select
                    value={localTriage.abilityToWalk}
                    onChange={(e) => setLocalTriage({ ...localTriage, abilityToWalk: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="No">No - Non-ambulatory / Spine Immobilized</option>
                    <option value="Assisted">Assisted - Severe dizziness / extremity injury</option>
                    <option value="Yes">Yes - Ambulatory (Walking wounded)</option>
                  </select>
                </div>

                {/* Respiration */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Respiratory Status:</label>
                  <select
                    value={localTriage.breathing}
                    onChange={(e) => setLocalTriage({ ...localTriage, breathing: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Rapid (24 bpm)">Rapid Tachypnea (24-30 bpm)</option>
                    <option value="Normal (16 bpm)">Normal Eupnea (12-20 bpm)</option>
                    <option value="Labored / Stridor">Severe Respiratory Distress / Stridor</option>
                    <option value="Shallow / Agonal">Agonal / Apneic (&lt; 8 bpm)</option>
                  </select>
                </div>

                {/* Severity Tier */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Triage Severity Priority:</label>
                  <select
                    value={localTriage.severity}
                    onChange={(e) => setLocalTriage({ ...localTriage, severity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Critical" className="text-red-400">Critical (Code Red - Immediate Life Threat)</option>
                    <option value="High" className="text-amber-400">High (Code Yellow - Urgent Care Required)</option>
                    <option value="Moderate" className="text-blue-400">Moderate (Code Green - Delayed)</option>
                    <option value="Low" className="text-emerald-400">Low (Minor lacerations / Stable)</option>
                  </select>
                </div>
              </div>

              {/* Numerical Vitals Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={localTriage.heartRate}
                    onChange={(e) => setLocalTriage({ ...localTriage, heartRate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={localTriage.bloodPressure}
                    onChange={(e) => setLocalTriage({ ...localTriage, bloodPressure: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="text"
                    value={localTriage.oxygenSaturation}
                    onChange={(e) => setLocalTriage({ ...localTriage, oxygenSaturation: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">GCS Score (3-15)</label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={localTriage.gcsScore}
                    onChange={(e) => setLocalTriage({ ...localTriage, gcsScore: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-400">
                  Data persists offline across browser restarts and offline page reloads.
                </span>

                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Assessment to Encrypted Local Cache</span>
                </button>
              </div>

            </form>
          </div>

          {/* Right Summary Column: GPS Coordinates & Active Assignment */}
          <div className="space-y-6">
            
            {/* GPS Fixed Telemetry Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>OFFLINE GPS SATELLITE FIX</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Latitude:</span>
                  <span className="text-white font-bold">{myAmbulance.lat.toFixed(6)}° N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Longitude:</span>
                  <span className="text-white font-bold">{myAmbulance.lng.toFixed(6)}° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Altitude:</span>
                  <span className="text-white font-bold">216 m ASL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Heading / Speed:</span>
                  <span className="text-emerald-400 font-bold">142° SE • 52 km/h</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5">
                  <span className="text-slate-400">Dead Reckoning:</span>
                  <span className="text-cyan-300 font-bold">IMU + Wheel Sensors Active</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                Even without cellular towers or Wi-Fi, the multi-GNSS receiver provides continuous sub-meter satellite positioning.
              </p>
            </div>

            {/* Offline Alert System Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>LOCAL ON-VEHICLE ALARMS</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">Hardware Buzzer</span>
              </div>

              <p className="text-xs text-slate-300">
                Local auditory sirens and flashing visual HUD warnings function independently of the cloud.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={toggleSiren}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    soundEnabled
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{soundEnabled ? 'Siren Active (Mute)' : 'Test Local Siren'}</span>
                </button>

                <button
                  onClick={() => playAlertSound('urgent')}
                  className="py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs"
                >
                  Trauma Beep
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-WORKSPACE 2: VITALS BUFFER & LOCAL ALARMS */}
      {/* ========================================================================= */}
      {activeTab === 'vitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
                  <span>Local Vital Signs Monitor & Circular Telemetry Buffer</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct Bluetooth / serial feed from on-board defibrillator-monitor (Zoll / Philips Tempus Pro).
                </p>
              </div>

              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                Offline Logging Live
              </span>
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30">
                <span className="text-[11px] font-mono text-slate-400 block mb-1">HEART RATE (ECG)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-rose-400 font-mono">{liveVitals.hr}</span>
                  <span className="text-xs text-slate-400">bpm</span>
                </div>
                <span className="text-[10px] text-amber-400 mt-2 block font-semibold">Sinus Tachycardia</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30">
                <span className="text-[11px] font-mono text-slate-400 block mb-1">OXYGEN SAT (SPO2)</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black font-mono ${liveVitals.spo2 < 90 ? 'text-red-500 animate-bounce' : 'text-cyan-400'}`}>
                    {liveVitals.spo2}
                  </span>
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <span className={`text-[10px] mt-2 block font-semibold ${liveVitals.spo2 < 90 ? 'text-red-400' : 'text-slate-400'}`}>
                  {liveVitals.spo2 < 90 ? '⚠️ Hypoxemia Alert' : 'Pulse Ox Waveform OK'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block mb-1">NIBP BLOOD PRESS.</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono">{liveVitals.bpSys}/{liveVitals.bpDia}</span>
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block font-semibold">MAP: 81 mmHg</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block mb-1">RESPIRATORY RATE</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-400 font-mono">{liveVitals.rr}</span>
                  <span className="text-xs text-slate-400">/min</span>
                </div>
                <span className="text-[10px] text-amber-400 mt-2 block font-semibold">Tachypneic</span>
              </div>
            </div>

            {/* Offline ECG Waveform Canvas Simulation */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  Lead II ECG Live Rhythm Trace
                </span>
                <span className="text-slate-500">25 mm/s • 10 mm/mV</span>
              </div>

              <div className="h-20 bg-slate-900/90 rounded-xl relative overflow-hidden border border-slate-800 flex items-center">
                {/* Visual SVG ECG wave pattern */}
                <svg className="w-full h-full text-emerald-400" viewBox="0 0 600 80" preserveAspectRatio="none">
                  <path
                    d="M 0 40 L 40 40 L 45 35 L 50 45 L 55 40 L 90 40 L 95 38 L 100 40 L 110 40 L 115 15 L 120 70 L 125 35 L 130 42 L 135 40 L 155 40 L 165 30 L 175 40 L 220 40 L 225 35 L 230 45 L 235 40 L 270 40 L 275 38 L 280 40 L 290 40 L 295 15 L 300 70 L 305 35 L 310 42 L 315 40 L 335 40 L 345 30 L 355 40 L 400 40 L 405 35 L 410 45 L 415 40 L 450 40 L 455 38 L 460 40 L 470 40 L 475 15 L 480 70 L 485 35 L 490 42 L 495 40 L 515 40 L 525 30 L 535 40 L 600 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-90"
                  />
                </svg>
                <div className="absolute right-2 top-2 px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Continuous FIFO Cache
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              When disconnected from cellular towers, all 250Hz ECG data points and multi-parameter vital trends are stored into the local SQLite/IndexedDB ring-buffer, ready to reconcile when broadband is re-established.
            </p>
          </div>

          {/* Right Column: Local Alarm Thresholds */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Offline Threshold Rules</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Oxygen Desaturation:</span>
                  <span className="text-red-400 font-mono">&lt; 90%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Triggers immediate high-priority audio alarm and automated SMS packet escalation.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Extreme Bradycardia:</span>
                  <span className="text-amber-400 font-mono">&lt; 50 bpm</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Local siren buzzer warns driver to prepare for external pacing.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Hypotensive Shock:</span>
                  <span className="text-rose-400 font-mono">SBP &lt; 90 mmHg</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Prompts paramedic checklist for crystalloid IV fluid bolus administration.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-200">
              <span className="font-bold block mb-1">Cellular SMS Integration:</span>
              <span>If any vital parameter breaches critical threshold while in Offline/SMS Fallback mode, a priority SMS packet is automatically dispatched to the trauma coordinator.</span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-WORKSPACE 3: CACHED PATIENT RECORDS & PARAMEDIC NOTES */}
      {/* ========================================================================= */}
      {activeTab === 'patient_record' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Left: Cached EHR Medical Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">Cached Medical Passport</span>
                <h3 className="text-xl font-black text-white mt-0.5">{patient?.name || 'Aarav Sharma'}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                {patient?.bloodGroup || 'O+'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Known Allergies</span>
                <span className="text-red-400 font-bold text-xs mt-0.5 block">
                  {patient?.allergies || 'Penicillin, NSAIDs (Aspirin), Sulfa drugs'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Chronic Conditions / History</span>
                <span className="text-slate-200 font-semibold text-xs mt-0.5 block">
                  {patient?.chronicConditions || 'Hypertension, Type-2 Diabetes, Previous CABG (2021)'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Current Medications</span>
                <span className="text-slate-300 text-xs mt-0.5 block">
                  {patient?.currentMedications || 'Metformin 500mg BD, Telmisartan 40mg OD, Clopidogrel 75mg'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Next of Kin / Family Emergency Contact</span>
                <span className="text-cyan-300 font-bold text-xs mt-0.5 block">
                  {patient?.emergencyContact || 'Pooja Sharma (Wife) • +91 98101 23456'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 text-slate-400 text-[11px] border border-slate-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Records stored in AES-256 encrypted local device sandbox. Full zero-knowledge compliance.</span>
            </div>
          </div>

          {/* Center/Right: Paramedic Offline Clinical Notes Log */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>Paramedic Offline Field Log & Interventions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record field interventions, drug dosages, and splinting. Notes are queued and synced upon reconnection.
                </p>
              </div>

              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300">
                {offlineNotes.length} Logged
              </span>
            </div>

            {/* Note Input Form */}
            <form onSubmit={handleAddOfflineNote} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentNoteInput}
                  onChange={(e) => setCurrentNoteInput(e.target.value)}
                  placeholder="e.g. 18G IV cannula placed in right antecubital fossa. 500ml Ringer Lactate started..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!currentNoteInput.trim()}
                  className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Note</span>
                </button>
              </div>
            </form>

            {/* Note Timeline List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {offlineNotes.map((note) => (
                <div key={note.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 text-xs">{note.author}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{note.time}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{note.text}</p>
                  <div className="flex items-center gap-1 pt-1 text-[10px] text-emerald-400 font-mono">
                    <Check className="w-3 h-3" />
                    <span>Locally Cached & Queued for Cloud Sync</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-WORKSPACE 4: SMS FALLBACK & DELIVERY CONFIRMATION CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'sms_fallback' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Minimal SMS Payload Preview & Privacy Guarantees */}
            <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase">Cellular GSM Protocol</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{roleTerminalSms.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  {roleTerminalSms.tag}
                </span>
              </div>

              {/* Exact Text Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Standard 160-char SMS:</span>
                  <span className="text-emerald-400 font-bold">{smsPreview.characterCount} / 160 chars (1 segment)</span>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-950 text-indigo-200 font-mono text-xs border border-indigo-900/60 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                  {smsPreview.textPayload}
                </pre>
              </div>

              {/* Privacy Safeguards Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{roleTerminalSms.safeguardsTitle}</span>
                </span>
                
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {roleTerminalSms.safeguards.map((sg, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span><strong className="text-slate-200">{sg.strong}</strong> {sg.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trigger Button */}
              <button
                onClick={() => triggerEmergencySmsFallback(activeEmergency, myAmbulance, `${currentRole} Manual Emergency Trigger`, { role: currentRole })}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 transition-all hover:scale-[1.02] active:scale-95 border border-indigo-400/40"
              >
                <Send className="w-4 h-4" />
                <span>{roleTerminalSms.buttonText}</span>
              </button>
            </div>

            {/* Center/Right: Multi-Tab Inbound / Contacts / Outbound Log / Matrix Workspace */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SUB-TAB NAVIGATOR */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-lg">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSmsSubTab('inbound')}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      smsSubTab === 'inbound'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Inbound Feed ({(receivedSms || []).length})</span>
                  </button>

                  <button
                    onClick={() => setSmsSubTab('contacts')}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      smsSubTab === 'contacts'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Authorized Contacts ({contacts.length})</span>
                  </button>

                  <button
                    onClick={() => setSmsSubTab('outbound_log')}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      smsSubTab === 'outbound_log'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Outbound Log ({(smsTransmissions || []).length})</span>
                  </button>

                  <button
                    onClick={() => setSmsSubTab('matrix')}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      smsSubTab === 'matrix'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Routing Matrix</span>
                  </button>
                </div>
              </div>

              {/* 1. INBOUND CELLULAR GSM FEED */}
              {smsSubTab === 'inbound' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-indigo-400" />
                        <span>Inbound Cellular GSM Telemetry & Directives Feed</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Role-isolated cellular receiver. Only SMS packets from authorized emergency originators matching your portal are decrypted and shown.
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800">
                      {(receivedSms || []).length} Received
                    </span>
                  </div>

                  <InboundSmsFeed filterRole={currentRole} />
                </div>
              )}

              {/* 2. AUTHORIZED CONTACTS CARD */}
              {smsSubTab === 'contacts' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-indigo-400" />
                        <span>Configured Authorized Emergency Contacts</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Recipients of automated SMS fallback packets during rural/tunnel network blackouts.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsEditingContacts(!isEditingContacts)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isEditingContacts ? 'Done Editing' : 'Add / Modify'}</span>
                    </button>
                  </div>

                  {/* Contacts List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contacts.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          c.active
                            ? 'bg-slate-950 border-indigo-500/40'
                            : 'bg-slate-950/40 border-slate-800 opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-300 font-bold block">{c.role}</span>
                            <h4 className="font-bold text-white text-xs mt-0.5">{c.name}</h4>
                            <span className="text-xs font-mono text-emerald-400 mt-1 block">{c.phone}</span>
                          </div>

                          <button
                            onClick={() => handleToggleContact(c.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                              c.active
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {c.active ? 'ACTIVE' : 'MUTED'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Contact Form */}
                  {isEditingContacts && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 mt-3 animate-fade-in">
                      <span className="text-xs font-bold text-slate-300 block">Add New Authorized Emergency Contact:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Agency / Role (e.g. Highway Patrol)"
                          value={newContact.role}
                          onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Contact / Officer Name"
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Phone (e.g. +91 98000 11111)"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handleAddContact}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Authorized Contact</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. OUTBOUND DELIVERY CONFIRMATION LOG */}
              {smsSubTab === 'outbound_log' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>GSM Network Delivery Confirmation Log (Outbound)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Messages are NEVER marked as delivered without a 3GPP SMS-STATUS-REPORT receipt from the carrier.
                      </p>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {(smsTransmissions || []).length} Logged Transmissions
                    </span>
                  </div>

                  {/* Transmissions Table */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {(smsTransmissions || []).length > 0 ? (
                      smsTransmissions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white">{tx.recipientPhone}</span>
                              <span className="text-xs text-slate-400">({tx.contactRole})</span>
                              {tx.senderRole && (
                                <span className="px-2 py-0.2 rounded text-[9px] uppercase font-mono font-bold bg-slate-800 text-slate-300">
                                  From: {tx.senderRole}
                                </span>
                              )}
                            </div>

                            {/* Delivery Confirmation Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider self-start sm:self-auto ${
                              tx.deliveryConfirmed
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : tx.status === 'sent'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                                  : 'bg-slate-800 text-slate-400'
                            }`}>
                              {tx.deliveryConfirmed ? 'DELIVERY CONFIRMED ✓' : `STATUS: ${tx.status.toUpperCase()} (AWAITING ACK)`}
                            </span>
                          </div>

                          {/* Telemetry metadata */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 font-mono pt-1">
                            <div>
                              <span className="text-slate-500 block">Stored:</span>
                              <span>{new Date(tx.storedAt).toLocaleTimeString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Sent:</span>
                              <span>{tx.sentAt ? new Date(tx.sentAt).toLocaleTimeString() : 'In Modem Queue'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Delivered ACK:</span>
                              <span className={tx.deliveryConfirmed ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                                {tx.deliveredAt ? new Date(tx.deliveredAt).toLocaleTimeString() : 'Awaiting SMSC...'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Network Ref:</span>
                              <span className="text-slate-300">{tx.deliveryReport?.messageReference || tx.networkReference}</span>
                            </div>
                          </div>

                          {tx.deliveryConfirmed && tx.deliveryReport && (
                            <div className="p-2 rounded bg-slate-900 border border-emerald-900/40 text-[10px] text-emerald-300 font-mono flex items-center justify-between">
                              <span>Receipt: {tx.deliveryReport.receiptCode} • Tower: {tx.deliveryReport.towerHandshake}</span>
                              <span>Latency: {tx.deliveryReport.deliveryLatencyMs} ms</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                        No emergency SMS fallback messages have been transmitted yet. Use "Broadcast SMS SOS" or switch network mode to test cellular dispatch.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. ROUTING MATRIX CARD */}
              {smsSubTab === 'matrix' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-indigo-400" />
                        <span>Raksha Emergency Cross-Portal SMS Routing Matrix</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Definitive multi-agency cellular routing topology. Ensures strict isolation and guaranteed delivery of vital emergency data.
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                      Standard Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Patient */}
                    <div className={`p-4 rounded-2xl border ${currentRole === 'patient' ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white text-xs">Patient Portal</span>
                        {currentRole === 'patient' && <span className="text-[10px] font-black text-emerald-400 uppercase font-mono">Active</span>}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-emerald-400">Receives SMS from:</strong> Doctor, Paramedic/EMT, Ambulance, Hospital, Control Room
                      </p>
                    </div>

                    {/* Doctor */}
                    <div className={`p-4 rounded-2xl border ${currentRole === 'doctor' ? 'bg-purple-950/40 border-purple-500/60 ring-2 ring-purple-500/30' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white text-xs">Doctor Portal</span>
                        {currentRole === 'doctor' && <span className="text-[10px] font-black text-purple-400 uppercase font-mono">Active</span>}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-purple-400">Receives SMS from:</strong> Paramedic/EMT, Ambulance
                      </p>
                    </div>

                    {/* Paramedic */}
                    <div className={`p-4 rounded-2xl border ${currentRole === 'paramedic' ? 'bg-cyan-950/40 border-cyan-500/60 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white text-xs">Paramedic / EMT Portal</span>
                        {currentRole === 'paramedic' && <span className="text-[10px] font-black text-cyan-400 uppercase font-mono">Active</span>}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-cyan-400">Receives SMS from:</strong> Attending Doctor
                      </p>
                    </div>

                    {/* Hospital */}
                    <div className={`p-4 rounded-2xl border ${currentRole === 'hospital' ? 'bg-blue-950/40 border-blue-500/60 ring-2 ring-blue-500/30' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white text-xs">Hospital Trauma Bay Portal</span>
                        {currentRole === 'hospital' && <span className="text-[10px] font-black text-blue-400 uppercase font-mono">Active</span>}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-blue-400">Receives SMS from:</strong> Paramedic/EMT, Ambulance
                      </p>
                    </div>

                    {/* Control Room */}
                    <div className={`p-4 rounded-2xl border ${(currentRole === 'control-room' || currentRole === 'control_room') ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/30' : 'bg-slate-950 border-slate-800'} md:col-span-2`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white text-xs">Control Room (SEOC) Portal</span>
                        {(currentRole === 'control-room' || currentRole === 'control_room') && <span className="text-[10px] font-black text-amber-400 uppercase font-mono">Active</span>}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-amber-400">Receives SMS from:</strong> Patient (SOS), Ambulance, Hospital
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-WORKSPACE 5: NON-CRITICAL SYNC OUTBOX & CLOUD RECONCILIATION */}
      {/* ========================================================================= */}
      {activeTab === 'sync_queue' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Non-Critical Data Outbox & Auto-Synchronization Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Queues heavy telemetry packets locally and reconciles them with the central cloud database when connectivity returns.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-300">
                Pending: <strong className="text-amber-400">{pendingQueue.length}</strong> • Synced: <strong className="text-emerald-400">{syncedQueue.length}</strong>
              </span>

              <button
                onClick={() => syncOfflineQueue()}
                disabled={isSyncing || pendingQueue.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing with Central Server...' : 'Force Cloud Reconcile'}</span>
              </button>
            </div>
          </div>

          {/* Sync Queue Table */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {(offlineQueue || []).length > 0 ? (
              offlineQueue.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.status === 'synced'
                      ? 'bg-slate-950/60 border-slate-800 opacity-75'
                      : 'bg-slate-950 border-amber-500/40 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.type === 'vitals_stream' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        item.type === 'paramedic_assessment' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{item.id}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">{item.sizeBytes} bytes</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase self-start sm:self-auto ${
                      item.status === 'synced'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                    }`}>
                      {item.status === 'synced' ? 'SERVER SYNCED ✓' : 'QUEUED (STORED LOCALLY)'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 font-mono mt-2 p-2 rounded bg-slate-900/80 border border-slate-800/80 truncate">
                    {JSON.stringify(item.data)}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1 pt-1">
                    <span>Captured: {new Date(item.createdAt).toLocaleTimeString()}</span>
                    <span>{item.syncedAt ? `Synchronized: ${new Date(item.syncedAt).toLocaleTimeString()}` : 'Awaiting 4G/5G Restoration'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                No telemetry packets currently in queue. Data generated during offline sessions will appear here.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
