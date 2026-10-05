import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { EmergencyMap } from '../components/EmergencyMap';
import { LidarObstacleDetector } from '../components/LidarObstacleDetector';
import { openInGoogleMapsApp, navigateInGoogleMapsApp } from '../utils/googleMaps';
import {
  Ambulance,
  Navigation,
  MapPin,
  ExternalLink,
  CheckSquare,
  Square,
  AlertTriangle,
  Radio,
  Radar,
  Zap,
  Phone,
  ShieldAlert,
  Clock,
  Thermometer,
  RotateCcw,
  CheckCircle2,
  FileCheck2,
  AlertOctagon,
  Send,
  Building2,
  ShieldCheck,
  Compass,
  ArrowRight,
  Flame,
  Check,
  UserCheck,
  HelpCircle,
  QrCode,
  Edit3,
  Save,
  X,
  Shield,
  Award,
  Activity,
  User,
  Gauge,
  Wifi,
  WifiOff,
  Signal,
  Smartphone,
  Route
} from 'lucide-react';
import { PreTreatmentEquipmentChecklist } from '../components/PreTreatmentEquipmentChecklist';
import { ReroutingSystem } from '../components/ReroutingSystem';
import { EmergencyMapLockScreen } from '../components/EmergencyMapLockScreen';
import { DigitalGreenCorridorMap } from '../components/DigitalGreenCorridorMap';
import { NETWORK_MODES } from '../services/offlineSyncService';

export const AmbulancePortal = () => {
  const {
    currentUser,
    portalTab,
    setPortalTab,
    isEmergencyProtocolCompleted,
    ambulances,
    activeEmergencies,
    organTransports,
    hospitals,
    patients,
    trafficSignals,
    updateAmbulanceStatus,
    updateOrganTransport,
    updateAmbulanceProfile,
    addNotification,
    toggleGreenCorridor,
    toggleTrafficPolicePermission,
    openMedicalQrForPatient,
    soundEnabled,
    toggleSiren,
    openDigitalTwinForPatient,
    networkMode,
    setNetworkMode,
    isOffline,
    offlineQueue,
    smsTransmissions,
    triggerEmergencySmsFallback,
    updateAmbulanceEquipment,
    lidarRerouteState: sharedLidarState,
    updateLidarReroute,
    clearLidarObstacle,
    triggerLidarObstacle
  } = useEmergency();

  const myAmbulance = ambulances.find(a => a.id === currentUser?.referenceId) || ambulances[0];
  const activeEmergency = activeEmergencies.find(e => e.assignedAmbulanceId === myAmbulance.id) || activeEmergencies[0];
  const activeOrganCase = organTransports[0];
  const destinationHospital = hospitals.find(h => h.id === activeEmergency?.destinationHospitalId) || hospitals[0];

  const isTrafficPoliceGranted = activeEmergency?.trafficPolicePermission !== undefined
    ? activeEmergency.trafficPolicePermission === 'GRANTED'
    : (activeEmergency?.greenCorridorActive ?? true);

  const [equipmentCheck, setEquipmentCheck] = useState({
    oxygenCylinder: true,
    ventilator: true,
    defibrillator: true,
    stretcher: true,
    firstAidKit: true,
    traumaKit: true,
    emergencyMeds: true,
    suctionUnit: true
  });

  const [crewSOSActive, setCrewSOSActive] = useState(false);
  const [organAtRiskNote, setOrganAtRiskNote] = useState('');
  const [showOrganRiskModal, setShowOrganRiskModal] = useState(false);
  const [controlCommsMessage, setControlCommsMessage] = useState('');

  // LiDAR 2.5D Obstacle Detection & Dynamic Rerouting State
  const [lidarRerouteState, setLidarRerouteState] = useState(() => {
    return sharedLidarState || {
      hasObstacle: true,
      activeRoute: 'bypass',
      bypassedVia: 'Barapullah Elevated Bypass (Corridor B)',
      timeSaved: '6.4 mins'
    };
  });

  useEffect(() => {
    if (sharedLidarState) {
      setLidarRerouteState(sharedLidarState);
    }
  }, [sharedLidarState]);

  // Ambulance Profile & Editing State
  const [isEditAmbProfileModalOpen, setIsEditAmbProfileModalOpen] = useState(false);
  const [ambProfileForm, setAmbProfileForm] = useState({
    plateNumber: myAmbulance.plateNumber,
    type: myAmbulance.type,
    driverName: myAmbulance.driverName,
    driverPhone: myAmbulance.driverPhone || '+91 98991 12233',
    paramedicName: myAmbulance.paramedicName,
    paramedicPhone: '+91 98112 44556',
    secondaryMedic: 'EMT Priya Nair (EMT-B-9921)',
    hospitalName: myAmbulance.hospitalName,
    radioChannel: 'VHF Emergency Ch 3 (155.340 MHz)',
    shiftSchedule: '08:00 - 20:00 (Day Shift - Rapid Response Zone A)',
    vehicleModel: 'Force Motors Urbania Mobile ICU (Euro VI)',
    fitnessCertExpiry: 'Valid till Nov 2028',
    fuelLevel: '86% (480 km range)',
    batteryStatus: 'Optimal (Dual Inverter Batteries Online)',
    oxygenReserve: '4500 Liters (Full / 150 bar)',
    specialNotes: 'Equipped with Hamilton-T1 ventilator, Zoll X-Series biphasic defibrillator, and refrigerated drug cooler. Green Corridor priority clearance certified.'
  });

  useEffect(() => {
    if (myAmbulance) {
      setAmbProfileForm(prev => ({
        ...prev,
        plateNumber: myAmbulance.plateNumber,
        type: myAmbulance.type,
        driverName: myAmbulance.driverName,
        driverPhone: myAmbulance.driverPhone || prev.driverPhone,
        paramedicName: myAmbulance.paramedicName,
        hospitalName: myAmbulance.hospitalName
      }));
    }
  }, [myAmbulance]);

  const handleSaveAmbProfile = (e) => {
    e.preventDefault();
    updateAmbulanceProfile(myAmbulance.id, {
      plateNumber: ambProfileForm.plateNumber,
      type: ambProfileForm.type,
      driverName: ambProfileForm.driverName,
      driverPhone: ambProfileForm.driverPhone,
      paramedicName: ambProfileForm.paramedicName,
      hospitalName: ambProfileForm.hospitalName
    });
    setIsEditAmbProfileModalOpen(false);
  };

  const toggleEquipment = (key) => {
    setEquipmentCheck(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStatusChange = (newStatus) => {
    updateAmbulanceStatus(myAmbulance.id, newStatus);
  };

  const handleCrewSOS = () => {
    setCrewSOSActive(true);
    addNotification(
      '🚨 CREW DISTRESS SOS',
      `Ambulance ${myAmbulance.plateNumber} crew signaled emergency distress! Location: [${myAmbulance.lat.toFixed(4)}, ${myAmbulance.lng.toFixed(4)}]. Police & central dispatch alerted.`,
      'urgent',
      'all'
    );
  };

  const handleConfirmOrganReceived = () => {
    updateOrganTransport(activeOrganCase.id, {
      status: 'Organ Received - Handover Complete',
      conditionNotes: 'Organ received in optimal condition at Apollo Transplant OT. Cold ischemia limit preserved.'
    });
    addNotification('Organ Handover Successful', `Transplant Case ${activeOrganCase.id} successfully received by recipient surgical team.`, 'success', 'all');
  };

  const handleTriggerOrganRisk = () => {
    updateOrganTransport(activeOrganCase.id, {
      status: 'Organ At Risk - Critical Alert',
      conditionNotes: `CRITICAL ALERT: ${organAtRiskNote || 'Traffic delay / temperature fluctuation warning reported by medical escort.'}`
    });
    addNotification('🚨 ORGAN AT RISK', `Critical risk alert triggered for Case ${activeOrganCase.id}! Escort priority escalated.`, 'urgent', 'all');
    setShowOrganRiskModal(false);
  };

  const handleSendMessageToControl = (e) => {
    e.preventDefault();
    if (!controlCommsMessage.trim()) return;
    addNotification(
      `Ambulance ${myAmbulance.plateNumber}`,
      `Radio message from crew: ${controlCommsMessage}`,
      'urgent',
      'control-room'
    );
    setControlCommsMessage('');
  };

  const statusWorkflow = [
    'Requested',
    'Assigned',
    'En Route',
    'Arrived',
    'Transporting',
    'Completed'
  ];

  return (
    <div className="space-y-8 pb-16">
      
      {/* AMBULANCE UNIT BANNER */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Ambulance className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white">{myAmbulance.plateNumber}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                myAmbulance.status === 'Available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
              }`}>
                {myAmbulance.status}
              </span>
            </div>
            <p className="text-xs text-amber-400 font-semibold mt-0.5">{myAmbulance.type}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
              <span>Driver: <strong className="text-slate-200">{myAmbulance.driverName}</strong></span>
              <span>•</span>
              <span>Paramedic: <strong className="text-slate-200">{myAmbulance.paramedicName}</strong></span>
              <span>•</span>
              <span>Hospital Base: <strong className="text-slate-200">{myAmbulance.hospitalName}</strong></span>
            </div>
          </div>
        </div>

        {/* Rapid Unit Actions: Ambulance Profile, Medical QR, and SOS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setPortalTab(portalTab === 'Rerouting' ? 'Dashboard' : 'Rerouting')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow transition-all hover:scale-105 active:scale-95 ${
              portalTab === 'Rerouting'
                ? 'bg-amber-400 text-slate-950 font-black shadow-amber-400/30'
                : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50'
            }`}
          >
            <Route className="w-4 h-4 text-amber-400" />
            <span>{portalTab === 'Rerouting' ? 'Back to Dashboard' : 'Pre-Alert Vehicles'}</span>
            {lidarRerouteState?.hasObstacle && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setPortalTab(portalTab === 'Profile' ? 'Dashboard' : 'Profile')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow transition-all hover:scale-105 active:scale-95 ${
              portalTab === 'Profile'
                ? 'bg-yellow-400 text-slate-950 font-black shadow-yellow-400/30'
                : 'bg-yellow-950/80 hover:bg-yellow-900 text-yellow-300 border border-yellow-500/50'
            }`}
          >
            <Ambulance className="w-4 h-4 text-yellow-400" />
            <span>{portalTab === 'Profile' ? 'Back to Dashboard' : 'Ambulance Profile'}</span>
          </button>

          <button
            onClick={() => {
              const activePt = patients?.find(p => p.id === activeEmergency?.patientId) || patients?.[0];
              openMedicalQrForPatient(activePt);
            }}
            className="px-4 py-3 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-bold text-xs rounded-2xl flex items-center gap-2 shadow transition-all hover:scale-105 active:scale-95"
            title="Scan or View Patient Emergency QR Pass"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Scan Medical QR</span>
          </button>

          <button
            onClick={() => setPortalTab(portalTab === 'Offline' ? 'Dashboard' : 'Offline')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow transition-all hover:scale-105 active:scale-95 ${
              portalTab === 'Offline'
                ? 'bg-indigo-500 text-white font-black shadow-indigo-500/30'
                : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50'
            }`}
          >
            <WifiOff className="w-4 h-4 text-indigo-400" />
            <span>{portalTab === 'Offline' ? 'Back to Dashboard' : 'Offline & SMS'}</span>
            {offlineQueue?.filter(i => i.status === 'pending_sync').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black font-mono">
                {offlineQueue.filter(i => i.status === 'pending_sync').length}
              </span>
            )}
          </button>

          <button
            onClick={handleCrewSOS}
            className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-2xl transition-all ${
              crewSOSActive
                ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-500/50'
                : 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 hover:scale-105 active:scale-95'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>{crewSOSActive ? '🚨 DISTRESS SIGNAL SENT' : 'CREW DISTRESS SOS'}</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD (OVERVIEW) */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || !portalTab) && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Active Mission HUD */}
          {activeEmergency && (
            <section className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-bold">{activeEmergency.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-800">
                      {activeEmergency.severity}
                    </span>
                    <h2 className="text-xl font-bold text-white">Active Emergency Assignment</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeEmergency.emergencyType} • Patient: <strong>{activeEmergency.patientName}</strong> ({activeEmergency.patientBloodGroup})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openDigitalTwinForPatient(activeEmergency)}
                    className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-900/30 transition-all hover:scale-105 active:scale-95 border border-cyan-400/40"
                  >
                    <Activity className="w-4 h-4 text-cyan-200 animate-pulse" />
                    <span>🧬 3D Digital Twin</span>
                  </button>
                  <button
                    onClick={() => {
                      const activePt = patients?.find(p => p.id === activeEmergency.patientId) || patients?.[0];
                      openMedicalQrForPatient(activePt);
                    }}
                    className="px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all hover:scale-105"
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Patient QR Pass</span>
                  </button>
                  <button
                    onClick={() => setPortalTab('Navigation')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Navigation className="w-4 h-4" />
                    Turn-by-Turn Map
                  </button>
                </div>
              </div>

              {/* Status Workflow Progression */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-semibold text-slate-400 block">
                  Update Vehicle Transport Stage:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {['Assigned', 'En Route', 'Arrived', 'Transporting', 'Completed'].map(st => {
                    const isCurrent = (activeEmergency.status || myAmbulance.status) === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location & Destination Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 uppercase font-semibold text-[10px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> Patient Pickup Location
                  </span>
                  <div className="font-bold text-white text-sm">{activeEmergency.location?.address}</div>
                  <div className="text-[11px] text-slate-400">
                    Lat: {activeEmergency.location?.lat}° N • Lng: {activeEmergency.location?.lng}° E
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 uppercase font-semibold text-[10px] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" /> Destination Hospital
                  </span>
                  <div className="font-bold text-white text-sm">{destinationHospital.name}</div>
                  <div className="text-[11px] text-slate-400">
                    ER Hotline: <strong>{destinationHospital.emergencyHotline}</strong> • Distance: <strong>2.8 km (ETA: 6m)</strong>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Smart Ambulance Matching Card & Pre-Trip Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Section 11: Smart Ambulance Matching */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Smart Ambulance Matching Algorithm</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Automated decision-support engine matching emergency severity with available fleet capability, equipment inventory, and geographical distance.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Distance Proximity</span>
                  <div className="font-bold text-emerald-400 mt-1">2.4 km (Rank #1)</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Equipment Level</span>
                  <div className="font-bold text-purple-400 mt-1">ALS + Ventilator</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Triage Match</span>
                  <div className="font-bold text-rose-400 mt-1">Critical (100% Fit)</div>
                </div>
              </div>

              {/* Mandatory Section 11 Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Disclaimer:</strong> «Decision-support only. The system does not guarantee the medically correct ambulance.»
                </span>
              </div>
            </div>

            {/* Obstacle Detection through 3D LiDAR Visualizer Command Widget */}
            <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0">
                    <Radar className="w-5 h-5 animate-spin text-cyan-400" style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>Obstacle Detection through 3D LiDAR Visualizer</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">3D Format</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Solid-state 128-beam 3D volumetric obstacles • 2.5D spatial coordinates &amp; elevation profile
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
                    lidarRerouteState.hasObstacle
                      ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${lidarRerouteState.hasObstacle ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`}></span>
                    <span>{lidarRerouteState.hasObstacle ? '3D Obstacle Detected (2.5D Coords)' : 'Corridor Clear (150m)'}</span>
                  </span>
                  <button
                    onClick={() => setPortalTab('LiDAR')}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow cursor-pointer"
                  >
                    <span>Launch 3D LiDAR Visualizer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">LIDAR SENSOR STATUS</span>
                  <span className="text-cyan-400 font-bold">128 Beams • 20 Hz Scan</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">DYNAMIC TRAJECTORY</span>
                  <span className={lidarRerouteState.hasObstacle ? 'text-cyan-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {lidarRerouteState.hasObstacle ? 'Route 2: Barapullah Bypass' : 'Route 1: Outer Ring Road'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">COLLISION AVOIDANCE ACTION</span>
                  <span className={lidarRerouteState.hasObstacle ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {lidarRerouteState.hasObstacle ? 'Diverted (6.4m Saved)' : 'Zero Hazards Detected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pre-Treatment Equipment Checklist (Synchronized with Hospital & Control Room) */}
            <PreTreatmentEquipmentChecklist
              ambulance={myAmbulance}
              canEdit={true}
              title="Pre-Treatment Equipment Readiness & Verification"
            />

            {/* Smart Rerouting System Widget */}
            <div className={`bg-slate-900 border rounded-3xl p-6 shadow-2xl space-y-4 lg:col-span-2 ${
              lidarRerouteState.hasObstacle
                ? 'border-rose-500/50 shadow-rose-950/30'
                : 'border-amber-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    lidarRerouteState.hasObstacle
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}>
                    <Route className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Pre-Alert Vehicles System</h3>
                    <p className="text-[11px] text-slate-400">
                      GPS + ITMS traffic fusion • Auto route switch • Fleet-wide pre-alert broadcast
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
                    lidarRerouteState.hasObstacle
                      ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${lidarRerouteState.hasObstacle ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
                    {lidarRerouteState.hasObstacle ? '🚨 Bypass Active — Rerouted' : '🟢 Primary Route Clear'}
                  </span>
                  <button
                    onClick={() => setPortalTab('Rerouting')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 transition-all shadow cursor-pointer"
                  >
                    <span>Open Pre-Alert Vehicles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">ACTIVE ROUTE</span>
                  <span className={`font-bold ${lidarRerouteState.hasObstacle ? 'text-cyan-400' : 'text-emerald-400'}`}>
                    {lidarRerouteState.hasObstacle ? 'Barapullah Bypass' : 'Outer Ring Road'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">TRAFFIC / ROUTE STATUS</span>
                  <span className={`font-bold ${lidarRerouteState.hasObstacle ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {lidarRerouteState.hasObstacle ? 'Blockage Detected' : 'Corridor Clear'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">FLEET ALERTS</span>
                  <span className="text-amber-400 font-bold">4 Units Nearby</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">TIME SAVED</span>
                  <span className={`font-bold ${lidarRerouteState.hasObstacle ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {lidarRerouteState.hasObstacle ? (lidarRerouteState.timeSaved || '6.4 mins') : 'N/A (Clear)'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: REQUESTS (DETAILS OF ACTIVE CASE) */}
      {/* ========================================================================= */}
      {portalTab === 'Requests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
                Emergency Request Specifications
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review full patient location, triage severity, required equipment, and destination facility
              </p>
            </div>
            {activeEmergency && (
              <button
                onClick={() => openDigitalTwinForPatient(activeEmergency)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all hover:scale-105 active:scale-95 border border-cyan-400/40"
              >
                <Activity className="w-4 h-4 text-cyan-200 animate-pulse" />
                <span>🧬 3D Digital Twin & Telemetry</span>
              </button>
            )}
          </div>

          {activeEmergency ? (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Patient & Incident</span>
                  <div className="text-base font-bold text-white">{activeEmergency.patientName} ({activeEmergency.patientAge} yrs / {activeEmergency.patientGender})</div>
                  <div className="text-red-400 font-mono">Blood Group: <strong>{activeEmergency.patientBloodGroup}</strong></div>
                  <div className="text-slate-300">Emergency Type: <strong>{activeEmergency.emergencyType}</strong></div>
                  <div className="text-slate-300">Severity: <strong className="text-red-400 uppercase">{activeEmergency.severity}</strong></div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Logistics & Fleet</span>
                  <div className="text-white">Ambulances Requested: <strong className="text-amber-400 font-mono text-sm">{activeEmergency.numberOfAmbulances === 'Many' ? 'Many Vehicles (Mass Casualty Fleet)' : `${activeEmergency.numberOfAmbulances || 1} Vehicle(s)`}</strong></div>
                  <div className="text-white flex items-center justify-between gap-2">
                    <span className="truncate">Destination: <strong>{destinationHospital.name}</strong></span>
                    <button
                      type="button"
                      onClick={() => navigateInGoogleMapsApp(destinationHospital.lat, destinationHospital.lng, myAmbulance.lat, myAmbulance.lng)}
                      className="px-2 py-0.5 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 rounded text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      title="Navigate to destination hospital in Google Maps App"
                    >
                      <Navigation className="w-3 h-3 text-blue-400" />
                      <span>Google GPS</span>
                    </button>
                  </div>
                  <div className="text-white flex items-center justify-between gap-2">
                    <span className="truncate">Pickup: <strong>{activeEmergency.location?.address}</strong></span>
                    <button
                      type="button"
                      onClick={() => navigateInGoogleMapsApp(activeEmergency.location?.lat, activeEmergency.location?.lng, myAmbulance.lat, myAmbulance.lng)}
                      className="px-2 py-0.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      title="Navigate to patient pickup location in Google Maps App"
                    >
                      <Navigation className="w-3 h-3 text-amber-400" />
                      <span>Route</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Required Equipment */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Mandatory Equipment for Incident</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(activeEmergency.requiredEquipment || ['Advanced Trauma Kit', 'ICU Ventilator', 'Oxygen Cylinder', 'Spinal Board']).map((eq, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 font-medium">
                      ✓ {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No emergency requests assigned to this ambulance.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: NAVIGATION (FULL-WIDTH MAP) */}
      {/* ========================================================================= */}
      {portalTab === 'Navigation' && (
        !isEmergencyProtocolCompleted ? (
          <EmergencyMapLockScreen
            portalName="Ambulance Portal"
            featureName="Live GPS Navigation"
            themeColor="amber"
          />
        ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-amber-400" />
                  Ambulance Navigation & Fastest Route Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  Fastest Route Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI-optimized emergency routing with ITMS traffic signal preemption, turn-by-turn tactical maneuvers, and live transit telemetry
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const dest = destinationHospital || hospitals[0];
                  navigateInGoogleMapsApp(dest.lat, dest.lng, myAmbulance.lat, myAmbulance.lng);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                title="Launch Turn-by-Turn GPS Navigation directly in Google Maps App"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps App</span>
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                🧪 DEMO MODE — Mock GPS
              </span>
            </div>
          </div>

          {/* OFFLINE NAVIGATION CALLOUT (ACTIVE WHEN DISCONNECTED) */}
          {networkMode !== 'online' && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Offline Tactical Navigation Loaded</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-900 text-indigo-200 border border-indigo-700">
                      Sector 4 Local Cache
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Live GPS multi-GNSS receiver locked (9 satellites, HDOP 0.8) with dead-reckoning IMU. Offline route vector cached to device memory.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPortalTab('Offline')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SMS Fallback Console</span>
                </button>
              </div>
            </div>
          )}

          {/* Fastest Route Mission Command Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-700/60 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-white text-sm">
                    Recommended Fastest Corridor: Outer Ring Road Green Wave Express
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    isTrafficPoliceGranted
                      ? 'bg-emerald-900/90 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-900'
                      : 'bg-blue-950 text-blue-300 border-blue-600'
                  }`}>
                    {isTrafficPoliceGranted
                      ? '🟢 Traffic Police Permission: GRANTED (Route Turned GREEN)'
                      : '⚠️ Traffic Police Permission: REQUIRED (Route Remains Blue)'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Mission: Unit <strong>{myAmbulance.plateNumber}</strong> responding to <strong>{activeEmergency?.location?.address || 'Incident Scene'}</strong> ➔ Transport to <strong>{destinationHospital.name}</strong>.{' '}
                  {isTrafficPoliceGranted ? (
                    <span className="text-emerald-400 font-semibold">Police clearance granted: Route turned GREEN.</span>
                  ) : (
                    <span className="text-blue-300 font-semibold">Police clearance required: Route remains BLUE until granted.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (activeEmergency?.id) {
                    toggleTrafficPolicePermission(activeEmergency.id, !isTrafficPoliceGranted);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow ${
                  isTrafficPoliceGranted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-300'
                    : 'bg-blue-600 hover:bg-blue-500 text-white ring-1 ring-blue-300 animate-pulse'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isTrafficPoliceGranted ? 'Route GREEN Active' : 'Request Traffic Clearance'}</span>
              </button>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Fastest ETA</div>
                <div className="text-2xl font-black font-mono text-cyan-400">~5 mins</div>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Distance</div>
                <div className="text-2xl font-black font-mono text-emerald-400">2.8 km</div>
              </div>
            </div>
          </div>
          {/* 3D LiDAR Obstacle Detection & Dynamic Reroute Banner */}
          <div className={`p-4 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
            lidarRerouteState.hasObstacle
              ? 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-cyan-950/80 border-rose-500 shadow-rose-950/50'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                lidarRerouteState.hasObstacle
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              }`}>
                <Radar className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <span>Obstacle Detection through 3D LiDAR Visualizer</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">3D Format</span>
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    lidarRerouteState.hasObstacle
                      ? 'bg-rose-900 text-rose-200 border-rose-600 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  }`}>
                    {lidarRerouteState.hasObstacle
                      ? '🚨 3D HAZARD DETECTED: 2.5D COORDS ACTIVE'
                      : '🟢 ALL CLEAR: PRIMARY ROUTE NOMINAL'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {lidarRerouteState.hasObstacle
                    ? '3D LiDAR sensor detected forward obstruction @ 38m (2.5D Coordinates: X: +38.4m, Y: -1.2m, Z: +2.4m). Navigation automatically shifted to Barapullah Bypass (-6.4m delay prevented).'
                    : '128-beam automotive 3D LiDAR scanning 150m forward corridor. Trajectory clear with zero obstacles.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {lidarRerouteState.hasObstacle && (
                <button
                  onClick={() => {
                    if (clearLidarObstacle) {
                      clearLidarObstacle();
                    } else {
                      setLidarRerouteState({ hasObstacle: false, activeRoute: 'primary', bypassedVia: null });
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Clear Hazard & Resume Primary Route"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clear Hazard & Resume Primary Route</span>
                </button>
              )}

              <button
                onClick={() => setPortalTab('LiDAR')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Radar className="w-3.5 h-3.5" />
                <span>3D LiDAR Station</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Emergency Map */}
          <EmergencyMap
            ambulances={ambulances}
            hospitals={hospitals}
            activeEmergency={activeEmergency}
            trafficSignals={trafficSignals}
            height="550px"
            defaultMode="interactive"
            lidarRerouteState={lidarRerouteState}
          />

          {/* Tactical Dispatch & Route Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Comparative Route Engine & Turn-by-Turn Guidance */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Route Alternatives Comparison */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    Comparative Route Analysis (AI Navigation Engine)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">3 Routes Evaluated</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Route 1 */}
                  <div className={`p-3.5 rounded-xl text-white space-y-2 relative shadow-lg transition-all ${
                    lidarRerouteState.hasObstacle
                      ? 'bg-red-950/40 border-2 border-red-500/80 ring-1 ring-red-500/40'
                      : 'bg-emerald-950/70 border-2 border-emerald-500 ring-1 ring-emerald-500/40'
                  }`}>
                    <div className={`absolute top-2 right-2 px-1.5 py-0.2 rounded font-black text-[9px] uppercase ${
                      lidarRerouteState.hasObstacle
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-emerald-500 text-slate-950'
                    }`}>
                      {lidarRerouteState.hasObstacle ? '❌ BLOCKED BY LIDAR' : 'Fastest Green Route'}
                    </div>
                    <div className={`text-xs font-bold ${lidarRerouteState.hasObstacle ? 'text-red-300' : 'text-emerald-300'}`}>
                      Route 1: Outer Ring Express
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-black font-mono ${lidarRerouteState.hasObstacle ? 'text-red-400 line-through' : 'text-emerald-400'}`}>
                        5m
                      </span>
                      <span className="text-xs text-slate-300 font-mono">2.8 km</span>
                    </div>
                    <div className={`text-[11px] flex items-center gap-1 font-semibold ${lidarRerouteState.hasObstacle ? 'text-red-300' : 'text-emerald-400'}`}>
                      {lidarRerouteState.hasObstacle ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span>Obstacle @ 38m • Traffic Diverted</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 text-yellow-300" />
                          <span>{isTrafficPoliceGranted ? '🟢 Route GREEN Active' : '🟢 Fastest Route GREEN (Hold)'}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lidarRerouteState.hasObstacle ? 'Hazard in forward trajectory • Rerouted via Route 2' : 'Zero congestion delay • AI Green Wave Recommended'}
                    </div>
                  </div>

                  {/* Route 2 (Bypass) */}
                  <div className={`p-3.5 rounded-xl space-y-2 relative transition-all ${
                    lidarRerouteState.hasObstacle
                      ? 'bg-cyan-950/70 border-2 border-cyan-400 text-white shadow-xl ring-2 ring-cyan-500/40'
                      : 'bg-slate-950 border border-slate-800 text-slate-300'
                  }`}>
                    {lidarRerouteState.hasObstacle && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 font-black text-[9px] uppercase animate-pulse">
                        ⚡ DYNAMIC BYPASS
                      </div>
                    )}
                    <div className={`text-xs font-bold ${lidarRerouteState.hasObstacle ? 'text-cyan-300' : 'text-slate-300'}`}>
                      Route 2: Barapullah Elevated Bypass
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-black font-mono ${lidarRerouteState.hasObstacle ? 'text-cyan-400' : 'text-slate-300'}`}>
                        {lidarRerouteState.hasObstacle ? '5.4m' : '9m'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">3.1 km</span>
                    </div>
                    <div className={`text-[11px] font-semibold ${lidarRerouteState.hasObstacle ? 'text-cyan-300' : 'text-amber-400'}`}>
                      {lidarRerouteState.hasObstacle ? '🟢 Active Bypass Corridor (0 Delay)' : '+4 mins traffic delay'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lidarRerouteState.hasObstacle ? 'Automated LiDAR collision avoidance • Clear elevated flyover' : 'Surface intersection signals • Normal cycle'}
                    </div>
                  </div>

                  {/* Route 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-2">
                    <div className="text-xs font-bold text-slate-400">Route 3: Inner City Link</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-slate-400">14m</span>
                      <span className="text-xs text-slate-500 font-mono">4.1 km</span>
                    </div>
                    <div className="text-[11px] text-rose-400 font-semibold">+9 mins congestion delay</div>
                    <div className="text-[10px] text-slate-500">Commercial street bottlenecks • Avoid</div>
                  </div>
                </div>
              </div>

              {/* Turn-by-Turn Tactical Maneuver List */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    Turn-by-Turn Tactical Maneuver Guidance (Fastest Route)
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    lidarRerouteState.hasObstacle
                      ? 'text-cyan-300 bg-cyan-950 border-cyan-700 animate-pulse'
                      : 'text-emerald-400 bg-emerald-950 border-emerald-800'
                  }`}>
                    {lidarRerouteState.hasObstacle ? '⚡ Barapullah Bypass Active' : '🟢 Primary Route Active'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {lidarRerouteState.hasObstacle ? (
                    <>
                      {/* Step 1 - Bypass */}
                      <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/80 flex items-center justify-between ring-1 ring-cyan-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                            1
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>Depart Station & Direct Merge onto Barapullah Ramp</span>
                              <span className="px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-200 text-[10px] font-bold">BYPASS DIVERGENCE</span>
                            </div>
                            <div className="text-[11px] text-slate-300">Diverted away from Outer Ring Road blockage • Green wave ramp open</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-cyan-400 font-bold text-sm">600 m</span>
                          <span className="block text-[10px] text-cyan-300">38 km/h</span>
                        </div>
                      </div>

                      {/* Step 2 - Bypass */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                            2
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>Barapullah Elevated High-Speed Flyover Deck</span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-300 text-[10px] font-bold">Signal GREEN</span>
                            </div>
                            <div className="text-[11px] text-slate-400">Zero ground traffic • Grade-separated elevated corridor • 0 delay</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-white font-bold text-sm">1.8 km</span>
                          <span className="block text-[10px] text-slate-400">70 km/h</span>
                        </div>
                      </div>

                      {/* Step 3 - Bypass */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                            3
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">Take Dedicated Medical Slip Ramp toward Incident Coordinates</div>
                            <div className="text-[11px] text-slate-400">Clear approach • Emergency preemption confirmed</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-slate-300 font-bold text-sm">400 m</span>
                          <span className="block text-[10px] text-slate-400">42 km/h</span>
                        </div>
                      </div>

                      {/* Step 4 - Bypass */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                            4
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">Arrive at Emergency Scene / Patient Pickup</div>
                            <div className="text-[11px] text-slate-400">{activeEmergency?.location?.address || 'Incident Scene'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-emerald-400 font-bold text-sm">300 m</span>
                          <span className="block text-[10px] text-slate-500">20 km/h</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Step 1 - Primary */}
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/80 flex items-center justify-between ring-1 ring-emerald-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                            1
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">Depart Station & Merge onto Outer Ring Express (Primary)</div>
                            <div className="text-[11px] text-slate-300">Corridor verified clear by LiDAR • Direct trajectory</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-emerald-400 font-bold text-sm">450 m</span>
                          <span className="block text-[10px] text-emerald-300">40 km/h</span>
                        </div>
                      </div>

                      {/* Step 2 - Primary */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                            2
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>AJC Bose Road Flyover Express (Primary Route)</span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-300 text-[10px] font-bold">Signal GREEN</span>
                            </div>
                            <div className="text-[11px] text-slate-400">Continuous green wave hold • Clear corridor lane</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-white font-bold text-sm">1.2 km</span>
                          <span className="block text-[10px] text-slate-400">65 km/h</span>
                        </div>
                      </div>

                      {/* Step 3 - Primary */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                            3
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">Take Right Slip Ramp toward Incident Coordinates</div>
                            <div className="text-[11px] text-slate-400">Traffic cleared by central command • Decelerate for approach</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-slate-300 font-bold text-sm">650 m</span>
                          <span className="block text-[10px] text-slate-500">45 km/h</span>
                        </div>
                      </div>

                      {/* Step 4 - Primary */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                            4
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">Arrive at Emergency Scene / Patient Pickup</div>
                            <div className="text-[11px] text-slate-400">{activeEmergency?.location?.address || 'Incident Scene'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-emerald-400 font-bold text-sm">300 m</span>
                          <span className="block text-[10px] text-slate-500">20 km/h</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Column 3: Tactical EMS Controls & Preemption Status */}
            <div className="space-y-6">
              
              {/* ITMS Green Wave & Traffic Police Clearance */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    ITMS Traffic Police Clearance
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isTrafficPoliceGranted ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {isTrafficPoliceGranted ? 'GREEN ROUTE' : 'PERMISSION REQUIRED (BLUE)'}
                  </span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Exide Crossing (AJC Bose & Chowringhee)</div>
                      <span className="text-[10px] text-slate-400">Signal SIG-01</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold font-mono">
                      GREEN (45s)
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Park Circus 7-Point Junction</div>
                      <span className="text-[10px] text-slate-400">Signal SIG-02</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold font-mono">
                      GREEN (62s)
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Rabindra Sadan - Cathedral Road Crossing</div>
                      <span className="text-[10px] text-slate-400">Signal SIG-03</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold font-mono">
                      GREEN (85s)
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Beckbagan - Maa Flyover Entry</div>
                      <span className="text-[10px] text-slate-400">Signal SIG-04</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold font-mono">
                      GREEN (120s)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeEmergency?.id) {
                      toggleTrafficPolicePermission(activeEmergency.id, !isTrafficPoliceGranted);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2 ${
                    isTrafficPoliceGranted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-400'
                  }`}
                >
                  <Zap className="w-4 h-4 text-white" />
                  <span>
                    {isTrafficPoliceGranted
                      ? '🟢 Traffic Police: Permission GRANTED (Route GREEN)'
                      : '⚠️ Traffic Police: Permission REQUIRED (Turn Route Green)'}
                  </span>
                </button>
              </div>

              {/* Siren & Comms Actions */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
                <span className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Radio className="w-4 h-4 text-amber-400" />
                  Tactical Comms & Sirens
                </span>

                <button
                  onClick={toggleSiren}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    soundEnabled
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>{soundEnabled ? 'Emergency Siren Active (Click to Mute)' : 'Sound Emergency Siren'}</span>
                </button>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <a
                    href="tel:108"
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>Control Room Hotline (108)</span>
                  </a>

                  <button
                    onClick={() => {
                      const activePt = patients?.find(p => p.id === activeEmergency?.patientId) || patients?.[0];
                      openMedicalQrForPatient(activePt);
                    }}
                    className="w-full py-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/60 text-purple-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-purple-300" />
                    <span>Scan Patient Medical QR Pass</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* VIEW: OBSTACLE DETECTION THROUGH 3D LIDAR VISUALIZER (2.5D COORDINATES) */}
      {/* ========================================================================= */}
      {portalTab === 'LiDAR' && (
        <div className="animate-fade-in space-y-6">
          <LidarObstacleDetector
            onRerouteChange={(state) => {
              setLidarRerouteState(state);
              if (state.hasObstacle) {
                addNotification(
                  '3D LiDAR Obstacle Detected',
                  `Obstacle detected in 3D format ahead (2.5D Coords: X: ${state.obstacle?.coords25D?.x || '38.4m'}, Y: ${state.obstacle?.coords25D?.y || '-1.2m'}, Z: ${state.obstacle?.coords25D?.z || '+2.4m'}). Dynamic reroute engaged via Barapullah Bypass.`,
                  'warning',
                  'ambulance'
                );
              } else {
                addNotification(
                  '3D LiDAR Corridor Clear',
                  'Corridor verified clear in 3D format. Resumed Primary Outer Ring Road Green Wave.',
                  'success',
                  'ambulance'
                );
              }
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: PRE-ALERT VEHICLES SYSTEM */}
      {/* ========================================================================= */}
      {portalTab === 'Rerouting' && (
        <div className="animate-fade-in space-y-6">
          <ReroutingSystem
            ambulance={myAmbulance}
            activeEmergency={activeEmergency}
            ambulances={ambulances}
            addNotification={addNotification}
            lidarState={lidarRerouteState}
            onLidarChange={(state) => {
              setLidarRerouteState(state);
              if (state.hasObstacle) {
                addNotification(
                  '🚨 Pre-Alert: Traffic Blockage on Primary Route',
                  `Road blockage detected. Nearby fleet pre-alerted with instant bypass rerouting. Switched to Barapullah Bypass. Time saved: ${state.timeSaved || '6.4 mins'}.`,
                  'warning',
                  'ambulance'
                );
              } else {
                addNotification(
                  '✅ Pre-Alert: Primary Route Restored',
                  'Obstacle cleared. Ambulance reverted to primary Outer Ring Road route. Nearby fleet pre-alerted.',
                  'success',
                  'ambulance'
                );
              }
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: TRANSPORT (STATUS WORKFLOW) */}
      {/* ========================================================================= */}
      {portalTab === 'Transport' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Ambulance className="w-5 h-5 text-amber-400" />
              Emergency Transport Progression & Handover
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute stage transitions from dispatch to patient hospital handover
            </p>
          </div>

          <div className="space-y-4">
            {statusWorkflow.map((st, i) => {
              const isCurrent = (activeEmergency?.status || myAmbulance.status) === st;
              return (
                <div
                  key={st}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}>
                      0{i + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{st}</div>
                      <div className="text-[11px] text-slate-400">
                        {st === 'Assigned' && 'Vehicle unit allocated and driver notified'}
                        {st === 'En Route' && 'Ambulance dispatched to patient coordinates with siren active'}
                        {st === 'Arrived' && 'Paramedics reached patient and starting field stabilization'}
                        {st === 'Transporting' && 'Patient onboard in transit to emergency trauma center'}
                        {st === 'Completed' && 'Handover completed to trauma bay surgeons'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStatusChange(st)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {isCurrent ? 'Current Stage' : `Set ${st}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: GREEN CORRIDOR (DIGITAL ORGAN TRANSIT) */}
      {/* ========================================================================= */}
      {portalTab === 'Green Corridor' && (
        <div className="space-y-6 animate-fade-in">
          {/* DIGITAL GREEN CORRIDOR ORGAN LOGISTICS MAP WITH LARGE GREEN TRANSPLANT ICON */}
          <DigitalGreenCorridorMap isHospitalView={false} />
          
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    🟢 NOTTO Authorized Logistics
                  </span>
                  <h2 className="text-xl font-bold text-white">Digital Green Corridor Organ Logistics</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Legally authorized organ transport workflow with cryogenic cold ischemia monitoring
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOrganRiskModal(true)}
                  className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Trigger "Organ at Risk"
                </button>
                <button
                  onClick={handleConfirmOrganReceived}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  Confirm "Organ Received"
                </button>
              </div>
            </div>

            {/* Case Details */}
            {activeOrganCase && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                {/* Organ Spec */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Organ & Transplant Authority</span>
                  <div className="text-xl font-black text-white">{activeOrganCase.organ}</div>
                  <div className="text-emerald-400 font-semibold">{activeOrganCase.id} • Priority: STAT</div>
                  <div className="pt-2 border-t border-slate-900 text-slate-400">
                    Authorized Escort: <strong className="text-white">{activeOrganCase.medicalEscort}</strong>
                  </div>
                </div>

                {/* Cold Ischemia Clock */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Cold Ischemia Timer</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500">Elapsed</span>
                      <div className="text-2xl font-black font-mono text-amber-400">38 mins</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500">Max Safe Limit</span>
                      <div className="text-2xl font-black font-mono text-rose-400">{activeOrganCase.coldIschemiaLimitHours} Hours</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-1/4 rounded-full"></div>
                  </div>
                </div>

                {/* Preservation Chamber Telemetry */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Preservation Telemetry</span>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black font-mono text-cyan-400">{activeOrganCase.preservationTemperatureCelsius} °C</div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Normal (4-8°C)
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Status: <strong className="text-white">{activeOrganCase.status}</strong>
                  </div>
                </div>

              </div>
            )}

            {/* Route & Preempted Signals */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Transit Route & Priority Preemption</span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div>Pickup: <strong>{activeOrganCase?.donorHospitalName}</strong></div>
                  <div>Destination: <strong>{activeOrganCase?.recipientHospitalName}</strong></div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center sm:text-right">
                  <span className="text-slate-500 text-[10px] block">Smart Signals Synchronized to GREEN</span>
                  <span className="font-bold text-emerald-400 font-mono text-base">4 Signals Preempted</span>
                </div>
              </div>
            </div>

            {/* Mandatory Section 13 Disclaimers */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Transplant Authority Governance Notice
              </div>
              <p className="leading-relaxed">
                «This workflow supports authorized medical/transplant authorities and does not make organ allocation decisions. The platform never makes organ-allocation decisions automatically.»
              </p>
            </div>

          </div>

          {/* Organ at risk modal */}
          {showOrganRiskModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-red-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Escalate: Organ At Risk Critical Alert</span>
                </div>
                <p className="text-xs text-slate-300">
                  Broadcasts immediate priority alert to traffic police, backup ambulance units, and the recipient transplant theater.
                </p>
                <div className="space-y-1 text-xs">
                  <label className="text-slate-400">Risk Cause / Clinical Observation:</label>
                  <input
                    type="text"
                    value={organAtRiskNote}
                    onChange={(e) => setOrganAtRiskNote(e.target.value)}
                    placeholder="e.g. Traffic snarl on flyover, perfusion temperature spike to 9.2C..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowOrganRiskModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTriggerOrganRisk}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow"
                  >
                    Trigger Urgent Risk Alert
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: SAFETY (CREW SOS & DISPATCH RADIO) */}
      {/* ========================================================================= */}
      {portalTab === 'Safety' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Ambulance Crew Safety & Radio Communication
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Distress beacon, live location telemetry, and direct control-room channel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Distress Panel */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <span className="font-bold text-white uppercase text-[10px] block">Personnel Safety Beacon</span>
              <p className="text-slate-400 leading-relaxed">
                In case of physical attack, accident, or road obstruction, trigger the SOS button below to transmit live vehicle telemetry to state police command (112).
              </p>
              <button
                onClick={handleCrewSOS}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-xl shadow-xl shadow-red-900/40 flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-5 h-5" />
                <span>SIGNAL EMERGENCY DISTRESS SOS</span>
              </button>
              {crewSOSActive && (
                <div className="p-3 bg-red-950/80 rounded-xl border border-red-800 text-red-200 text-center font-bold animate-pulse">
                  Emergency broadcast active. Central police command notified.
                </div>
              )}
            </div>

            {/* Control Room Radio Message */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <span className="font-bold text-white uppercase text-[10px] block">Control Room Radio Channel</span>
              <form onSubmit={handleSendMessageToControl} className="space-y-3">
                <textarea
                  rows={3}
                  value={controlCommsMessage}
                  onChange={(e) => setControlCommsMessage(e.target.value)}
                  placeholder="Transmit situation report or request police escort..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmit to Control Room</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 7: COMPREHENSIVE AMBULANCE PROFILE (portalTab === 'Profile') */}
      {/* ========================================================================= */}
      {portalTab === 'Profile' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Ambulance Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-yellow-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-950 text-yellow-300 border border-yellow-500/60 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-yellow-400" />
                    Verified EMS Fleet Vehicle
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Unit ID: {myAmbulance.id}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Active Status: {myAmbulance.status}
                  </span>
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <span>{myAmbulance.plateNumber}</span>
                  <span className="text-sm font-semibold text-yellow-400 font-mono px-2.5 py-1 rounded-lg bg-yellow-950/80 border border-yellow-500/40">
                    {ambProfileForm.type}
                  </span>
                </h2>
                
                <p className="text-sm text-slate-300 flex items-center gap-2 max-w-2xl">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Base Hospital: <strong className="text-white">{myAmbulance.hospitalName}</strong>
                </p>

                <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-yellow-400" />
                  Emergency Radio Channel: <strong className="font-mono text-white">{ambProfileForm.radioChannel}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => setIsEditAmbProfileModalOpen(true)}
                  className="px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-yellow-400/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Unit Profile & Crew
                </button>
                <button
                  onClick={() => openInGoogleMapsApp(myAmbulance.lat, myAmbulance.lng, `Ambulance ${myAmbulance.plateNumber}`)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-yellow-400" />
                  Live GPS in Google Maps
                </button>
              </div>
            </div>

            {/* Quick Spec Telemetry Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Driver Contact</span>
                <div className="text-sm font-black font-mono text-yellow-400 mt-0.5">{ambProfileForm.driverPhone}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fuel & Range</span>
                <div className="text-sm font-black font-mono text-white mt-0.5">{ambProfileForm.fuelLevel}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Auxiliary Battery</span>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">{ambProfileForm.batteryStatus}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">O₂ Pipeline Reserve</span>
                <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">{ambProfileForm.oxygenReserve}</div>
              </div>
            </div>
          </div>

          {/* Profile Details 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Crew & Personnel */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-yellow-400" />
                Assigned Emergency Crew
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Designated Primary Driver:</span>
                  <div className="font-bold text-white text-sm mt-0.5">{ambProfileForm.driverName}</div>
                  <div className="text-[11px] text-yellow-300 font-mono flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-yellow-400" />
                    {ambProfileForm.driverPhone}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Paramedic In-Charge:</span>
                  <div className="font-bold text-white text-sm mt-0.5">{ambProfileForm.paramedicName}</div>
                  <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {ambProfileForm.paramedicPhone}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Secondary EMT Assistant:</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{ambProfileForm.secondaryMedic}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Duty Shift & Response Sector:</span>
                  <div className="text-slate-200 mt-0.5 font-medium">{ambProfileForm.shiftSchedule}</div>
                </div>
              </div>
            </div>

            {/* Column 2: Vehicle Mechanics & GIS Telemetry */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Gauge className="w-4 h-4 text-yellow-400" />
                Vehicle Mechanics & Telemetry
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Vehicle Chassis & Model:</span>
                  <div className="font-bold text-white text-sm mt-0.5">{ambProfileForm.vehicleModel}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Registration Fitness:</span>
                  <div className="text-emerald-400 font-semibold mt-0.5">{ambProfileForm.fitnessCertExpiry}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Live Telemetry Transponder:</span>
                  <div className="font-mono text-white mt-0.5">
                    Lat: {myAmbulance.lat?.toFixed(4)}° N • Lng: {myAmbulance.lng?.toFixed(4)}° E
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Speed: <strong className="text-yellow-400">{myAmbulance.speedKmh || 0} km/h</strong> • Heading: <strong className="text-white">{myAmbulance.heading || 45}°</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Traffic Preemption Priority:</span>
                  <div className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    ITMS Green Wave Corridors Authorized
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Onboard Life Support Equipment Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Onboard Life Support Equipment
              </h3>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {Object.entries({
                  'Transport Ventilator': equipmentCheck.ventilator,
                  'Biphasic Defibrillator': equipmentCheck.defibrillator,
                  'Oxygen Tank (150 bar)': equipmentCheck.oxygenCylinder,
                  'Suction Apparatus': equipmentCheck.suctionUnit,
                  'Scoop Stretcher': equipmentCheck.stretcher,
                  'Major Trauma Kit': equipmentCheck.traumaKit,
                  'Emergency Cardiac Meds': equipmentCheck.emergencyMeds,
                  'Basic First Aid Kit': equipmentCheck.firstAidKit
                }).map(([name, status]) => (
                  <div
                    key={name}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-2"
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${status ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className="text-slate-200 font-medium leading-tight">{name}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px] text-slate-300">
                <span className="text-slate-500 font-semibold block mb-0.5">Special Protocols:</span>
                {ambProfileForm.specialNotes}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EDIT AMBULANCE PROFILE MODAL */}
      {isEditAmbProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-yellow-500/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-xl font-black">
                  <Ambulance className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Ambulance Profile & Crew Specs</h3>
                  <p className="text-xs text-slate-400">Update registration, crew contacts, vehicle parameters, and radio assignment</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditAmbProfileModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAmbProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Plate Registration Number:</label>
                  <input
                    type="text"
                    value={ambProfileForm.plateNumber}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, plateNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-yellow-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Ambulance Vehicle Class:</label>
                  <select
                    value={ambProfileForm.type}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="Advanced Life Support (ALS)">Advanced Life Support (ALS)</option>
                    <option value="Basic Life Support (BLS)">Basic Life Support (BLS)</option>
                    <option value="Neonatal & Pediatric ICU (NICU)">Neonatal & Pediatric ICU (NICU)</option>
                    <option value="Advanced Organ Transit & Surgical Interceptor">Advanced Organ Transit & Surgical Interceptor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Primary Driver Name:</label>
                  <input
                    type="text"
                    value={ambProfileForm.driverName}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, driverName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-yellow-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Driver Direct Phone:</label>
                  <input
                    type="text"
                    value={ambProfileForm.driverPhone}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, driverPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-yellow-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Paramedic In-Charge:</label>
                  <input
                    type="text"
                    value={ambProfileForm.paramedicName}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, paramedicName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-yellow-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Paramedic Contact Phone:</label>
                  <input
                    type="text"
                    value={ambProfileForm.paramedicPhone}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, paramedicPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Secondary EMT Assistant:</label>
                  <input
                    type="text"
                    value={ambProfileForm.secondaryMedic}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, secondaryMedic: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Affiliated Hospital Base:</label>
                  <input
                    type="text"
                    value={ambProfileForm.hospitalName}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, hospitalName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-yellow-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Emergency Radio Call Channel:</label>
                  <input
                    type="text"
                    value={ambProfileForm.radioChannel}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, radioChannel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Vehicle Model & Engine:</label>
                  <input
                    type="text"
                    value={ambProfileForm.vehicleModel}
                    onChange={(e) => setAmbProfileForm({ ...ambProfileForm, vehicleModel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Duty Shift & Operational Notes:</label>
                <textarea
                  rows={2}
                  value={ambProfileForm.specialNotes}
                  onChange={(e) => setAmbProfileForm({ ...ambProfileForm, specialNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditAmbProfileModalOpen(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white font-semibold rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl shadow-lg shadow-yellow-400/25 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Ambulance Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
