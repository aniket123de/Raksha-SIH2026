import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { NETWORK_MODES } from '../services/offlineSyncService';
import { InboundSmsFeed } from './InboundSmsFeed';
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
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Satellite,
  Inbox,
  ArrowDownLeft,
  ArrowUpRight,
  Share2
} from 'lucide-react';

export const OfflineSmsBanner = ({ onOpenTerminal = null, compact = false }) => {
  const {
    networkMode,
    setNetworkMode,
    currentRole,
    currentUser,
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
    ambulances
  } = useEmergency();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSimulatingSms, setIsSimulatingSms] = useState(false);
  const [drawerTab, setDrawerTab] = useState('inbound'); // 'inbound' | 'outbound' | 'matrix'

  const pendingQueueCount = (offlineQueue || []).filter(item => item.status === 'pending_sync').length;
  const recentTransmissions = (smsTransmissions || []).slice(0, 3);
  const latestSms = recentTransmissions[0];

  // Role-Specific SMS Configuration (Preserves Ambulance behavior while specializing other portals)
  const getRoleSmsConfig = () => {
    const norm = (currentRole === 'control_room' ? 'control-room' : currentRole) || 'ambulance';
    switch (norm) {
      case 'patient':
        return {
          btnText: isSimulatingSms ? 'Transmitting SOS...' : 'Send Citizen SOS SMS',
          title: 'Send offline emergency SOS SMS to 108 Dispatch, 112 & Designated Emergency Contacts',
          noticeTitle: 'Citizen Privacy Protocol (Emergency Rescue Standard):',
          noticeDesc: 'Under SMS Fallback, only critical rescue demographics (Citizen ID, blood group, vital triage, and GPS location) are encoded into standard GSM-7 packets. No private medical histories or identity numbers are transmitted.'
        };
      case 'doctor':
        return {
          btnText: isSimulatingSms ? 'Transmitting Orders...' : 'Send ER Directive SMS',
          title: 'Send clinical directives, blood bank alerts, and trauma bay preparation SMS',
          noticeTitle: 'Clinical Directive Protocol (STAT Resuscitation Orders):',
          noticeDesc: 'Under SMS Fallback, attending physician resuscitation directives and STAT blood bank requests are encoded into compact GSM packets for immediate pre-arrival bay preparation.'
        };
      case 'paramedic':
        return {
          btnText: isSimulatingSms ? 'Transmitting Triage...' : 'Send Pre-Arrival Triage SMS',
          title: 'Send pre-arrival trauma triage, GCS score, and real-time vitals to Receiving ER',
          noticeTitle: 'Pre-Hospital Triage Protocol (Direct ER Trauma Link):',
          noticeDesc: 'Field paramedics transmit live vitals (HR, SpO2, BP), GCS trauma scores, and administered medications directly to receiving hospital trauma bays prior to arrival.'
        };
      case 'hospital':
        return {
          btnText: isSimulatingSms ? 'Broadcasting Surge...' : 'Broadcast Hospital Surge SMS',
          title: 'Broadcast available ICU beds, oxygen reserves, and diversion status via SMS',
          noticeTitle: 'Facility Operational Resilience Protocol (Surge Capacity):',
          noticeDesc: 'Hospitals broadcast real-time critical bed counts, ventilator availability, and liquid medical oxygen reserves to dispatchers during metropolitan network outages.'
        };
      case 'control-room':
        return {
          btnText: isSimulatingSms ? 'Broadcasting Dispatch...' : 'Broadcast Dispatch Directive SMS',
          title: 'Broadcast multi-agency green corridor and fleet dispatch commands via SMS',
          noticeTitle: 'Central SEOC Tactical Command Protocol (Multi-Agency Preemption):',
          noticeDesc: 'Central Operations broadcast synchronized green corridor preemption signals to traffic police and route directives to deployed ambulance units over cellular radio.'
        };
      case 'ambulance':
      default:
        return {
          btnText: isSimulatingSms ? 'Broadcasting...' : 'Broadcast SMS SOS',
          title: 'Send minimal emergency SMS to Control Room & Medical Coordinator',
          noticeTitle: 'Strict Patient Privacy Protocol (HIPAA / DISHA Compliant):',
          noticeDesc: 'Under SMS Fallback, cleartext transmission of patient identity, names, Aadhaar/SSN, and private medical histories is strictly prohibited. Only essential anonymized telemetry (Emergency ID, Ambulance ID, GPS coordinates, priority level, and radio callback) is encoded into GSM-7 standard packets.'
        };
    }
  };

  const roleSmsConfig = getRoleSmsConfig();

  // Determine 3-Stage Pipeline State: Stored -> SMS Sent -> Server Synced
  const hasPendingOffline = pendingQueueCount > 0;
  const hasDeliveredSms = recentTransmissions.some(t => t.deliveryConfirmed);
  const hasSentSms = recentTransmissions.some(t => t.status === 'sent' || t.status === 'delivered');
  const isServerSynced = networkMode === NETWORK_MODES.ONLINE && pendingQueueCount === 0;

  // Pipeline stage states
  const stageStored = {
    active: true,
    complete: true,
    label: 'Stored Locally',
    subtext: 'Encrypted device cache'
  };

  const stageSms = {
    active: networkMode === NETWORK_MODES.SMS_FALLBACK || hasSentSms,
    complete: hasDeliveredSms,
    pendingAck: hasSentSms && !hasDeliveredSms,
    label: hasDeliveredSms ? 'SMS Delivered (Tower ACK)' : (hasSentSms ? 'SMS Sent (Awaiting ACK)' : 'SMS Fallback'),
    subtext: hasDeliveredSms ? 'GSM-03.40 delivery receipt verified' : 'Cellular GSM radio channel'
  };

  const stageSync = {
    active: networkMode === NETWORK_MODES.ONLINE,
    complete: isServerSynced,
    label: isServerSynced ? 'Server Synced' : (isSyncing ? 'Syncing...' : `${pendingQueueCount} Queued`),
    subtext: isServerSynced ? 'Cloud database matched' : (networkMode === NETWORK_MODES.ONLINE ? 'Sync in progress' : 'Awaiting 4G/5G')
  };

  const handleManualSmsTrigger = () => {
    setIsSimulatingSms(true);
    triggerEmergencySmsFallback(null, null, `Manual ${currentRole || 'EMS'} Trigger`, { role: currentRole });
    setTimeout(() => setIsSimulatingSms(false), 1200);
  };

  const getModeTheme = () => {
    switch (networkMode) {
      case NETWORK_MODES.ONLINE:
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/40',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          dot: 'bg-emerald-400 shadow-[0_0_10px_#10b981]',
          title: 'Online (Broadband / 5G Telemetry Active)',
          desc: 'Real-time WebSocket & cloud REST synchronization streaming at full bandwidth.'
        };
      case NETWORK_MODES.WEAK_NETWORK:
        return {
          bg: 'bg-amber-950/80 border-amber-500/40',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          dot: 'bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse',
          title: 'Weak Network (2G / High Packet Loss)',
          desc: 'Unstable data connection. Non-critical telemetry buffered; priority queueing engaged.'
        };
      case NETWORK_MODES.OFFLINE:
        return {
          bg: 'bg-rose-950/80 border-rose-500/40',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          dot: 'bg-rose-400 shadow-[0_0_10px_#f43f5e] animate-ping',
          title: 'Offline Mode (Zero Internet Connectivity)',
          desc: '100% offline-first active: Local GPS fix, cached vector maps, triage & vitals buffer running.'
        };
      case NETWORK_MODES.SMS_FALLBACK:
        return {
          bg: 'bg-indigo-950/85 border-indigo-500/50 shadow-indigo-900/30 shadow-xl',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50',
          dot: 'bg-indigo-400 shadow-[0_0_12px_#818cf8] animate-pulse',
          title: 'Cellular SMS Fallback Active (Data Lost • GSM Live)',
          desc: 'Mobile internet unavailable. Automated privacy-protected emergency SMS broadcast armed.'
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
          dot: 'bg-slate-400',
          title: 'Network Status Unknown',
          desc: ''
        };
    }
  };

  const theme = getModeTheme();

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 backdrop-blur-md transition-all duration-300 ${theme.bg}`}>
      
      {/* HEADER BAR & SIMULATION SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Mode Title & Dot */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative mt-1 sm:mt-0 flex items-center justify-center">
            <span className={`w-3.5 h-3.5 rounded-full ${theme.dot}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
                {networkMode === NETWORK_MODES.ONLINE && 'ONLINE • 5G CLOUD'}
                {networkMode === NETWORK_MODES.WEAK_NETWORK && 'WEAK NETWORK • 2G/EDGE'}
                {networkMode === NETWORK_MODES.OFFLINE && 'OFFLINE • LOCAL ACTIVE'}
                {networkMode === NETWORK_MODES.SMS_FALLBACK && '📡 SMS FALLBACK ARMED'}
              </span>

              <span className="text-xs text-slate-300 font-bold hidden sm:inline">•</span>

              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300 font-mono text-[11px]">GPS Fix: 3D Locked (9 Sats)</span>
              </span>

              {pendingQueueCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {pendingQueueCount} queued packets
                </span>
              )}

              <button
                onClick={() => {
                  setDrawerTab('inbound');
                  setIsExpanded(true);
                }}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  (receivedSms || []).length > 0
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="View Inbound Cellular SMS Telemetry"
              >
                <Inbox className="w-3 h-3 text-indigo-400" />
                <span>Inbound: {(receivedSms || []).length} SMS</span>
              </button>
            </div>

            <p className="text-xs text-slate-300/90 mt-1">
              {theme.desc}
            </p>
          </div>
        </div>

        {/* Right: Quick Simulation Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950/70 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px] font-bold">
            <span className="px-2 text-[10px] text-slate-400 font-mono uppercase">Simulate:</span>
            
            <button
              onClick={() => setNetworkMode(NETWORK_MODES.ONLINE)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                networkMode === NETWORK_MODES.ONLINE
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Full 5G internet connectivity"
            >
              Online
            </button>

            <button
              onClick={() => setNetworkMode(NETWORK_MODES.WEAK_NETWORK)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                networkMode === NETWORK_MODES.WEAK_NETWORK
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="2G / High packet loss"
            >
              Weak 2G
            </button>

            <button
              onClick={() => setNetworkMode(NETWORK_MODES.OFFLINE)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                networkMode === NETWORK_MODES.OFFLINE
                  ? 'bg-rose-600 text-white font-black shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Zero connectivity (Tunnel / Remote Blackout)"
            >
              Offline
            </button>

            <button
              onClick={() => setNetworkMode(NETWORK_MODES.SMS_FALLBACK)}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                networkMode === NETWORK_MODES.SMS_FALLBACK
                  ? 'bg-indigo-500 text-white font-black shadow-sm ring-2 ring-indigo-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Cellular SMS Fallback Mode"
            >
              <Smartphone className="w-3 h-3" />
              <span>SMS Fallback</span>
            </button>
          </div>

          {/* Action: Send SMS or Sync */}
          {networkMode === NETWORK_MODES.ONLINE && pendingQueueCount > 0 && (
            <button
              onClick={() => syncOfflineQueue()}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
            </button>
          )}

          {(networkMode === NETWORK_MODES.SMS_FALLBACK || networkMode === NETWORK_MODES.OFFLINE) && (
            <button
              onClick={handleManualSmsTrigger}
              disabled={isSimulatingSms}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-900/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-indigo-400/40"
              title={roleSmsConfig.title}
            >
              <Send className={`w-3.5 h-3.5 ${isSimulatingSms ? 'animate-bounce' : ''}`} />
              <span>{roleSmsConfig.btnText}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all"
            title="Toggle Detailed Pipeline Status"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3-STAGE VISUAL STATUS PIPELINE: STORED -> SMS SENT -> SERVER SYNCED */}
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          
          <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Telemetry Pipeline:</span>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2">
            
            {/* STEP 1: STORED */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/90 border border-emerald-500/30">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black text-emerald-300">1. Stored</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[9px] text-slate-400 truncate">Device Buffer / IndexedDB</p>
              </div>
            </div>

            {/* STEP 2: SMS SENT */}
            <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
              stageSms.complete
                ? 'bg-slate-900/90 border-indigo-500/50 shadow-sm shadow-indigo-950'
                : stageSms.pendingAck
                  ? 'bg-indigo-950/40 border-indigo-500/40 animate-pulse'
                  : 'bg-slate-900/40 border-slate-800 opacity-60'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                stageSms.complete
                  ? 'bg-indigo-500 text-white font-bold text-[10px]'
                  : stageSms.pendingAck
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500'
                    : 'bg-slate-800 text-slate-500'
              }`}>
                {stageSms.complete ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : stageSms.pendingAck ? (
                  <Clock className="w-3 h-3 animate-spin" />
                ) : (
                  <Radio className="w-2.5 h-2.5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-[11px] font-black truncate ${
                    stageSms.complete ? 'text-indigo-300' : (stageSms.pendingAck ? 'text-amber-300' : 'text-slate-400')
                  }`}>
                    2. SMS Sent
                  </span>
                  {stageSms.complete && (
                    <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-mono">
                      ACK ✓
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 truncate">
                  {stageSms.complete ? 'Tower Delivered' : (stageSms.pendingAck ? 'Awaiting ACK' : 'Cellular GSM Channel')}
                </p>
              </div>
            </div>

            {/* STEP 3: SERVER SYNCED */}
            <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
              stageSync.complete
                ? 'bg-slate-900/90 border-emerald-500/40'
                : stageSync.active
                  ? 'bg-slate-900/60 border-amber-500/40'
                  : 'bg-slate-900/40 border-slate-800 opacity-60'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                stageSync.complete
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : isSyncing
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500'
                    : 'bg-slate-800 text-slate-500'
              }`}>
                {stageSync.complete ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isSyncing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Database className="w-2.5 h-2.5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-[11px] font-black truncate ${
                    stageSync.complete ? 'text-emerald-300' : (isSyncing ? 'text-amber-300' : 'text-slate-400')
                  }`}>
                    3. Server Synced
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 truncate">
                  {stageSync.complete ? 'Cloud Reconciled' : `${pendingQueueCount} items queued`}
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* EXPANDABLE DETAILS DRAWER (SMS PACKET & CELLULAR DELIVERY TELEMETRY) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-fade-in text-xs">
          
          {/* DRAWER TAB BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setDrawerTab('inbound')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                  drawerTab === 'inbound'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-300" />
                <span>Inbound Feed ({(receivedSms || []).length})</span>
              </button>

              <button
                onClick={() => setDrawerTab('outbound')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                  drawerTab === 'outbound'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-300" />
                <span>Outbound Broadcast ({recentTransmissions.length})</span>
              </button>

              <button
                onClick={() => setDrawerTab('matrix')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                  drawerTab === 'matrix'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-300" />
                <span>Routing Matrix</span>
              </button>
            </div>

            {onOpenTerminal && (
              <button
                onClick={onOpenTerminal}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
              >
                <span>Full Terminal →</span>
              </button>
            )}
          </div>

          {/* TAB 1: INBOUND SMS FEED */}
          {drawerTab === 'inbound' && (
            <div className="space-y-3">
              <InboundSmsFeed filterRole={currentRole} />
            </div>
          )}

          {/* TAB 2: OUTBOUND SMS BROADCAST */}
          {drawerTab === 'outbound' && (
            <div className="space-y-4">
              {/* Privacy Protection Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">{roleSmsConfig.noticeTitle}</span>
                  <p className="text-slate-400 mt-0.5 leading-relaxed text-[11px]">
                    {roleSmsConfig.noticeDesc}
                  </p>
                </div>
              </div>

              {/* Authorized Outbound Target Roles */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Target Recipients for {currentRole?.toUpperCase()}:
                </span>
                {(SMS_ROUTING_MATRIX[(currentRole === 'control_room' ? 'control-room' : currentRole)] || []).map(tRole => (
                  <span
                    key={tRole}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase font-mono"
                  >
                    {tRole}
                  </span>
                ))}
              </div>

              {/* Latest Transmitted SMS Payload & Delivery Confirmation */}
              {latestSms ? (
                <div className="p-3.5 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 font-mono text-[11px] flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                      Latest Outbound {latestSms.senderRole ? latestSms.senderRole.replace('-', ' ').toUpperCase() : 'EMERGENCY'} SMS • To: {latestSms.recipientPhone} ({latestSms.contactRole})
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                      latestSms.deliveryConfirmed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                    }`}>
                      {latestSms.deliveryConfirmed ? 'DELIVERED (CONFIRMED)' : `STATUS: ${latestSms.status.toUpperCase()}`}
                    </span>
                  </div>

                  {/* Exact SMS Text Body */}
                  <pre className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-slate-200 border border-slate-800 whitespace-pre-wrap leading-snug">
                    {latestSms.payload}
                  </pre>

                  {/* Delivery Receipt Telemetry */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono pt-1">
                    <span>Stored: {new Date(latestSms.storedAt).toLocaleTimeString()}</span>
                    <span>Sent: {latestSms.sentAt ? new Date(latestSms.sentAt).toLocaleTimeString() : 'Pending'}</span>
                    <span>
                      Delivery Receipt:{' '}
                      {latestSms.deliveryConfirmed ? (
                        <strong className="text-emerald-400">
                          Confirmed ({latestSms.deliveryReport?.messageReference || 'SMSC-ACK'}) in {latestSms.deliveryReport?.deliveryLatencyMs || 2100}ms
                        </strong>
                      ) : (
                        <strong className="text-amber-400">Awaiting GSM Tower Ack...</strong>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
                  No fallback SMS transmissions currently logged. When mobile data drops or "{roleSmsConfig.btnText}" is pressed, the emergency payload will appear here.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROUTING MATRIX SPECIFICATION */}
          {drawerTab === 'matrix' && (
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Configured Cross-Portal Cellular SMS Receiving Matrix</span>
                </span>
                <span className="text-[10px] text-indigo-300 font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  Strict Isolation Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Patient rule */}
                <div className={`p-3 rounded-xl border ${currentRole === 'patient' ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Patient Portal
                    </span>
                    {currentRole === 'patient' && <span className="text-[9px] font-black text-emerald-400 uppercase font-mono">Current Portal</span>}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-emerald-300">Receives SMS from:</strong> Doctor, Paramedic/EMT, Ambulance, Hospital, Control Room
                  </p>
                </div>

                {/* Doctor rule */}
                <div className={`p-3 rounded-xl border ${currentRole === 'doctor' ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/30' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-400" /> Doctor Portal
                    </span>
                    {currentRole === 'doctor' && <span className="text-[9px] font-black text-purple-400 uppercase font-mono">Current Portal</span>}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-purple-300">Receives SMS from:</strong> Paramedic/EMT, Ambulance
                  </p>
                </div>

                {/* Paramedic rule */}
                <div className={`p-3 rounded-xl border ${currentRole === 'paramedic' ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" /> Paramedic Portal
                    </span>
                    {currentRole === 'paramedic' && <span className="text-[9px] font-black text-cyan-400 uppercase font-mono">Current Portal</span>}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-cyan-300">Receives SMS from:</strong> Attending Doctor
                  </p>
                </div>

                {/* Hospital rule */}
                <div className={`p-3 rounded-xl border ${currentRole === 'hospital' ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/30' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> Hospital Portal
                    </span>
                    {currentRole === 'hospital' && <span className="text-[9px] font-black text-blue-400 uppercase font-mono">Current Portal</span>}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-blue-300">Receives SMS from:</strong> Paramedic/EMT, Ambulance
                  </p>
                </div>

                {/* Control Room rule */}
                <div className={`p-3 rounded-xl border ${(currentRole === 'control-room' || currentRole === 'control_room') ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30' : 'bg-slate-900 border-slate-800'} md:col-span-2`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Control Room Portal
                    </span>
                    {(currentRole === 'control-room' || currentRole === 'control_room') && <span className="text-[9px] font-black text-amber-400 uppercase font-mono">Current Portal</span>}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-amber-300">Receives SMS from:</strong> Patient, Ambulance, Hospital
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
