import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Activity,
  Heart,
  Brain,
  AlertTriangle,
  Clock,
  Pill,
  Shield,
  Stethoscope,
  Plus,
  Send,
  Radio,
  CheckCircle2,
  FileText,
  User,
  Wifi,
  ChevronRight,
  TrendingUp,
  Sliders,
  Sparkles,
  Phone,
  Thermometer,
  Wind,
  Droplet,
  Truck,
  MapPin,
  Crosshair,
  ShieldAlert,
  Flame,
  FileCheck,
  AlertOctagon,
  Eye,
  Ambulance,
  Calendar,
  Syringe,
  Check,
  Zap,
  Info,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { DigitalTwin3D } from './DigitalTwin3D';
import { HeartRateEcgGraph } from './HeartRateEcgGraph';
import { useEmergency } from '../context/EmergencyContext';
import { isEmtUser } from '../utils/userRoleUtils';

export const DigitalTwinModal = ({
  isOpen,
  onClose,
  patientOrEmergency = null
}) => {
  const {
    getDigitalTwin,
    updateDigitalTwinVitals,
    updateDigitalTwinStatus,
    addDigitalTwinTreatment,
    addDigitalTwinMedication,
    digitalTwinRevision,
    currentRole,
    currentUser,
    patients,
    activeEmergencies
  } = useEmergency();

  // Role authorization: strictly on-scene Paramedics and licensed EMTs can alter the 3D digital patient
  const isParamedicOrEmt = currentRole === 'paramedic' || currentUser?.role === 'PARAMEDIC' || isEmtUser(currentUser);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'treatments' | 'meds' | 'timeline' | 'update'
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isTwinFullscreen, setIsTwinFullscreen] = useState(false);
  const [twinVersion, setTwinVersion] = useState(0);

  // Update Console Form States
  const [updateCategory, setUpdateCategory] = useState('paramedic'); // 'paramedic' | 'doctor' | 'device' | 'patient'
  
  // Vitals form states
  const [inputHeartRate, setInputHeartRate] = useState(118);
  const [inputSpo2, setInputSpo2] = useState(91);
  const [inputBp, setInputBp] = useState('95/60 mmHg');
  const [inputTemp, setInputTemp] = useState(36.8);
  const [inputRr, setInputRr] = useState(28);

  // Physical status form states
  const [inputConsciousness, setInputConsciousness] = useState('Voice Responsive');
  const [inputAbilityToWalk, setInputAbilityToWalk] = useState('Non-ambulatory (Severe trauma)');

  // Treatment form states
  const [trtAction, setTrtAction] = useState('');
  const [trtDetails, setTrtDetails] = useState('');

  // Medication form states
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medRoute, setMedRoute] = useState('IV');
  const [medIndication, setMedIndication] = useState('');

  // Success alert
  const [justUpdated, setJustUpdated] = useState(false);

  // Fetch or initialize twin
  const twin = getDigitalTwin
    ? getDigitalTwin(patientOrEmergency)
    : null;

  // Initialize input states when twin loads
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (twin && !hasInitializedRef.current) {
      setInputHeartRate(twin.vitals?.heartRate || 118);
      setInputSpo2(twin.vitals?.spo2 || 91);
      setInputBp(twin.vitals?.bloodPressure || '95/60 mmHg');
      setInputTemp(twin.vitals?.temperature || 36.8);
      setInputRr(twin.vitals?.respiratoryRate || 28);
      setInputConsciousness(twin.consciousnessStatus || 'Voice Responsive');
      setInputAbilityToWalk(twin.abilityToWalk || 'Non-ambulatory');
      hasInitializedRef.current = true;
    }
  }, [twin?.id]);

  if (!isOpen || !twin) return null;

  const isCritical = twin.severity === 'Critical' || twin.vitals?.spo2 < 90 || twin.vitals?.heartRate > 125;

  // Real-time live synchronization as sliders or fields move
  const handleLiveVitalChange = (field, val) => {
    if (!isParamedicOrEmt) return;
    let newHr = inputHeartRate;
    let newSpo2 = inputSpo2;
    let newBp = inputBp;
    let newRr = inputRr;
    let newTemp = inputTemp;

    if (field === 'heartRate') {
      newHr = Number(val);
      setInputHeartRate(newHr);
    } else if (field === 'spo2') {
      newSpo2 = Number(val);
      setInputSpo2(newSpo2);
    } else if (field === 'bloodPressure') {
      newBp = val;
      setInputBp(newBp);
    } else if (field === 'respiratoryRate') {
      newRr = Number(val);
      setInputRr(newRr);
    } else if (field === 'temperature') {
      newTemp = Number(val);
      setInputTemp(newTemp);
    }

    if (twin && updateDigitalTwinVitals) {
      updateDigitalTwinVitals(twin.id, {
        heartRate: newHr,
        spo2: newSpo2,
        bloodPressure: newBp,
        respiratoryRate: newRr,
        temperature: newTemp
      }, updateCategory === 'doctor' ? 'Doctor' : (updateCategory === 'patient' ? 'Patient' : 'Paramedic'), currentUser?.name || 'Live Telemetry Console');
      setTwinVersion(v => v + 1);
    }
  };

  const handleLiveStatusChange = (field, val) => {
    if (!isParamedicOrEmt) return;
    let newCons = inputConsciousness;
    let newWalk = inputAbilityToWalk;

    if (field === 'consciousness') {
      newCons = val;
      setInputConsciousness(newCons);
    } else if (field === 'abilityToWalk') {
      newWalk = val;
      setInputAbilityToWalk(newWalk);
    }

    if (twin && updateDigitalTwinStatus) {
      updateDigitalTwinStatus(twin.id, {
        consciousnessStatus: newCons,
        abilityToWalk: newWalk
      }, updateCategory === 'doctor' ? 'Doctor' : 'Paramedic', currentUser?.name || 'EMS Crew');
      setTwinVersion(v => v + 1);
    }
  };

  // Handle Vital Submission (explicit commitment to timeline & audit)
  const handleSaveVitals = (source = 'Connected Medical Device') => {
    if (!isParamedicOrEmt) return;
    if (twin && updateDigitalTwinVitals) {
      updateDigitalTwinVitals(twin.id, {
        heartRate: Number(inputHeartRate),
        spo2: Number(inputSpo2),
        bloodPressure: inputBp,
        temperature: Number(inputTemp),
        respiratoryRate: Number(inputRr)
      }, source, currentUser?.name || 'Medical Telemetry');
      setTwinVersion(v => v + 1);
    }
    triggerSuccess();
  };

  // Handle Status Submission (Consciousness / Walking)
  const handleSaveStatus = (source = 'Paramedic') => {
    if (!isParamedicOrEmt) return;
    if (twin && updateDigitalTwinStatus) {
      updateDigitalTwinStatus(twin.id, {
        consciousnessStatus: inputConsciousness,
        abilityToWalk: inputAbilityToWalk
      }, source, currentUser?.name || 'EMS Crew');
      setTwinVersion(v => v + 1);
    }
    triggerSuccess();
  };

  // Handle Treatment Submission
  const handleAddTreatment = (e) => {
    e.preventDefault();
    if (!isParamedicOrEmt || !trtAction) return;
    if (addDigitalTwinTreatment) {
      addDigitalTwinTreatment(twin.id, {
        action: trtAction,
        details: trtDetails || 'Procedure performed according to pre-hospital trauma protocols',
        providerName: currentUser?.name || 'Paramedic S. Ramanathan',
        status: 'Active'
      }, currentRole === 'doctor' ? 'Doctor' : 'Paramedic');
    }
    setTrtAction('');
    setTrtDetails('');
    triggerSuccess();
  };

  // Handle Medication Submission
  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!isParamedicOrEmt || !medName) return;
    if (addDigitalTwinMedication) {
      addDigitalTwinMedication(twin.id, {
        medicine: medName,
        dose: medDose || 'Standard therapeutic emergency dose',
        route: medRoute,
        administeredBy: currentUser?.name || (currentRole === 'doctor' ? 'Emergency Physician' : 'Paramedic S. Ramanathan'),
        indication: medIndication || 'Acute pre-hospital trauma stabilization',
        effect: 'Under continuous vital monitoring'
      }, currentRole === 'doctor' ? 'Doctor' : 'Paramedic');
    }
    setMedName('');
    setMedDose('');
    setMedIndication('');
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 3000);
  };

  // Device Telemetry Drift Simulation
  const handleSimulateDevice = () => {
    if (!isParamedicOrEmt) return;
    const deltaHr = Math.floor(Math.random() * 7) - 3;
    const deltaSpo2 = Math.floor(Math.random() * 3) - 1;
    const newHr = Math.max(55, Math.min(160, inputHeartRate + deltaHr));
    const newSpo2 = Math.max(80, Math.min(100, inputSpo2 + deltaSpo2));
    setInputHeartRate(newHr);
    setInputSpo2(newSpo2);

    if (updateDigitalTwinVitals) {
      updateDigitalTwinVitals(twin.id, {
        heartRate: newHr,
        spo2: newSpo2
      }, 'Connected Medical Device', 'Philips IntelliVue MX40');
    }
    triggerSuccess();
  };

  // Extract structured parameters with safe defaults
  const patientName = twin.name || "Rahul Verma";
  const patientAge = twin.age || 34;
  const patientGender = twin.gender || "Male";
  const patientBloodGroup = twin.bloodGroup || "B+";
  const patientId = twin.patientId || "PAT-01";
  const emergencyId = twin.emergencyId || "EMG-8821";
  const patientPhone = twin.phone || "+91 98765 43210";
  const emergencyContact = twin.emergencyContact || "Priya Verma (Wife) - +91 98765 43211";
  const allergies = twin.allergies || "Penicillin (Severe anaphylactic shock), NSAIDs (Rash)";
  const medicalHistory = twin.medicalHistory || "Childhood bronchial asthma, mild seasonal rhinitis";
  const existingConditions = twin.existingConditions || "Bronchial Asthma (Intermittent)";
  const currentMedications = twin.currentMedications || "Salbutamol Inhaler (PRN), Montelukast 10mg OD";

  const currentEmergency = twin.currentEmergency || "Accident / Polytrauma";
  const emergencySeverity = twin.severity || "Critical";
  const incidentLocation = twin.emergencyAssessment?.location || "Ring Road Flyover, North Corridor";
  const triageTag = twin.emergencyAssessment?.triageTag || (emergencySeverity === 'Critical' ? "RED (Priority 1 - Immediate Life Threat)" : "YELLOW (Priority 2 - Urgent)");
  const consciousnessStatus = twin.consciousnessStatus || "Voice Responsive";
  const gcsScore = twin.vitals?.gcsScore || 12;
  const gcsBreakdown = twin.emergencyAssessment?.gcsBreakdown || "E3 V4 M5 (12/15 - Moderate Impairment)";
  const abilityToWalk = twin.abilityToWalk || "Non-ambulatory (Severe trauma)";
  const mobilityClassification = twin.emergencyAssessment?.mobilityClassification || (abilityToWalk?.toLowerCase().includes('non') ? "Non-Ambulatory (Full Spine Board & Stretcher Mandated)" : "Ambulatory");
  const perfusionStatus = twin.emergencyAssessment?.perfusion || twin.vitals?.perfusionStatus || (heartRate > 100 ? "Borderline (Weak radial pulses, CRT 3.2s)" : "Normal (Brisk capillary refill < 2s)");
  const heartRate = twin.vitals?.heartRate !== undefined ? twin.vitals.heartRate : 118;
  const spo2 = twin.vitals?.spo2 !== undefined ? twin.vitals.spo2 : (twin.vitals?.oxygenSaturation ? (typeof twin.vitals.oxygenSaturation === 'number' ? twin.vitals.oxygenSaturation : parseInt(twin.vitals.oxygenSaturation) || 91) : 91);
  const bloodPressure = twin.vitals?.bloodPressure || "95/60 mmHg";
  const respiratoryRate = twin.vitals?.respiratoryRate !== undefined ? twin.vitals.respiratoryRate : 28;
  const temperature = twin.vitals?.temperature !== undefined ? twin.vitals.temperature : 36.8;
  const ecgRhythm = twin.ecg?.rhythm || (heartRate > 100 ? "Sinus Tachycardia (Active Lead II)" : "Normal Sinus Rhythm (Active Lead II)");
  const primarySurvey = twin.emergencyAssessment?.primarySurvey || `Airway: Patent on 10L NRB. Breathing: ${respiratoryRate > 22 ? 'Tachypneic' : 'Eupneic'} (${respiratoryRate} bpm), SpO₂ ${spo2}%. Circulation: ${heartRate > 100 ? 'Tachycardic' : 'Stable'} (${heartRate} bpm), BP ${bloodPressure}. Disability: GCS ${gcsScore}/15.`;
  const secondarySurvey = twin.emergencyAssessment?.secondarySurvey || "Head & Neck: Rigid C-collar in place, no tracheal deviation. Thorax: Mild anterior chest contusion, clear lungs. Abdomen: Soft, non-distended. Extremities: Right tibia splinted with vacuum traction, left arm 18G IV patent.";

  const treatmentsList = twin.treatmentsProvidedDuringTransport || twin.treatments || [];
  const medicinesList = twin.medicinesAdministeredDuringTransport || twin.medicinesAdministered || [];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-7xl max-h-[96vh] bg-slate-950 border-2 border-cyan-500/50 shadow-[0_0_80px_rgba(6,182,212,0.3)] rounded-3xl flex flex-col overflow-hidden text-slate-100 my-auto">
        
        {/* MODAL HEADER: PATIENT DIGITAL TWIN IDENTITY BANNER */}
        <div className="bg-slate-900/95 border-b border-cyan-500/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  Emergency 3D Digital Patient: {patientName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE RECURRENT TELEMETRY</span>
                </span>
                {isParamedicOrEmt ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Paramedic / EMT Master Edit Mode</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/90 text-amber-300 border border-amber-700/80 flex items-center gap-1.5 shadow-sm">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Read-Only View ({currentRole ? currentRole.toUpperCase() : 'VIEWER'} PORTAL)</span>
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                  emergencySeverity === 'Critical' ? 'bg-red-950 text-red-300 border-red-700' : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}>
                  {emergencySeverity}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                  Blood Group: {patientBloodGroup}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800">
                  ID: {patientId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Continuously synchronized 3D physiological twin • Live patient identity, emergency assessment, vital telemetry, and pre-hospital transport care
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {justUpdated && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fade-in bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Condition Updated in Real Time!
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close 3D Digital Twin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALLERGY WARNING & CRITICAL CLINICAL BANNER */}
        <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900 border-b border-red-900/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 font-black text-red-300 uppercase tracking-wide bg-red-900/60 px-2.5 py-1 rounded-lg border border-red-700">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
              <span>SEVERE ALLERGY ALERT:</span>
            </div>
            <span className="font-extrabold text-white text-sm bg-black/40 px-2 py-0.5 rounded border border-red-800/80">
              {allergies}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">
              Medical History: <strong className="text-white">{medicalHistory}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span>Blood Group: <strong className="text-red-400 font-bold">{patientBloodGroup}</strong></span>
            <span>•</span>
            <span>Emergency: <strong className="text-amber-400">{currentEmergency}</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{treatmentsList.length} Transport Treatments</span>
            <span>•</span>
            <span className="text-purple-400 font-bold">{medicinesList.length} Meds Given</span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-2 flex items-center justify-between gap-3 overflow-x-auto text-xs z-10">
          <div className="flex items-center gap-2">
            {[
              { key: 'overview', label: '🏥 3D Digital Patient Dashboard', icon: Activity },
              { key: 'treatments', label: `🚑 Treatments During Transport (${treatmentsList.length})`, icon: Stethoscope },
              { key: 'meds', label: `💊 Medicines Administered (${medicinesList.length})`, icon: Pill },
              { key: 'timeline', label: `⏱️ Patient Condition Timeline (${twin.timeline?.length || 0})`, icon: Clock },
              ...(isParamedicOrEmt ? [{ key: 'update', label: '⚡ Enter Live Clinical Update', icon: Sliders }] : [])
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {isParamedicOrEmt ? (
            <button
              type="button"
              onClick={handleSimulateDevice}
              className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer shrink-0"
              title="Simulate live wireless telemetry broadcast from patient's connected medical device"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Sync Device Telemetry</span>
            </button>
          ) : (
            <div
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5 shrink-0"
              title="Real-time telemetry synchronized. Alterations are strictly reserved for on-scene Paramedics and EMTs."
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Field Telemetry (Read-Only)</span>
            </div>
          )}
        </div>

        {/* MODAL WORKSPACE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: 3D DIGITAL PATIENT DASHBOARD (COMPREHENSIVE ALL-IN-ONE VIEW) */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* 1. PATIENT IDENTITY & IMAGE CARD */}
              <div className="p-5 bg-slate-900/90 border border-cyan-500/40 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  {/* Patient Core Demographics */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl sm:text-2xl font-black text-white">{patientName}</span>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                          {patientAge} Yrs • {patientGender}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                          Blood: {patientBloodGroup}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap font-mono">
                        <span>Patient ID: <strong className="text-white">{patientId}</strong></span>
                        <span>•</span>
                        <span>Emergency Case: <strong className="text-amber-400">{emergencyId}</strong></span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-cyan-400" /> {patientPhone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="w-3.5 h-3.5 text-emerald-400" /> Contact: <strong className="text-white">{emergencyContact}</strong>
                        </span>
                      </div>
                    </div>

                  {/* Right: Clinical History & Safety Highlights */}
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5 max-w-xl w-full lg:w-auto">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-1">
                      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Clinical Baseline & Safety Profile</span>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> EHR Linked
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <span className="text-slate-400">Allergies: </span>
                      <strong className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/60">{allergies}</strong>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <span className="text-slate-400">Past History: </span>
                      <strong className="text-slate-200">{medicalHistory}</strong>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <span className="text-slate-400">Current Medications: </span>
                      <strong className="text-cyan-300">{currentMedications}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 3D ANATOMICAL TWIN & PHYSIOLOGICAL VITALS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Interactive 3D WebGL Digital Twin Visualizer (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                  <DigitalTwin3D
                    twin={{ ...twin, vitals: { ...twin.vitals } }}
                    activeRegionId={selectedRegion}
                    onSelectRegion={(reg) => setSelectedRegion(reg)}
                    height="460px"
                    isFullscreen={isTwinFullscreen}
                    onToggleFullscreen={(val) => setIsTwinFullscreen(val)}
                  />

                  {/* 3D Anatomical Trauma & Organ System Regions Grid */}
                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white uppercase flex items-center gap-1.5">
                        <Crosshair className="w-4 h-4 text-cyan-400" />
                        <span>Anatomical Trauma Mapping & Organ Integrity</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">7 Sensor Nodes Monitored</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {twin.anatomicalRegions?.map(reg => {
                        const isSelected = selectedRegion === reg.id;
                        return (
                          <div
                            key={reg.id}
                            onClick={() => setSelectedRegion(isSelected ? null : reg.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:border-cyan-400/80 ${
                              isSelected
                                ? 'ring-2 ring-cyan-400 bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                                : reg.status === 'critical'
                                ? 'bg-red-950/70 border-red-700/80 text-red-200'
                                : (reg.status === 'warning' ? 'bg-amber-950/70 border-amber-700/80 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-200')
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-[11px]">
                              <span>{reg.name}</span>
                              <span className={`w-2 h-2 rounded-full ${reg.status === 'critical' ? 'bg-red-400 animate-ping' : (reg.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400')}`}></span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                              {reg.note}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Physiological Telemetry Matrix & Functional Assessment (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  
                  {/* Vital Signs Matrix Card */}
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-white text-sm">Real-Time Physiological Telemetry (Vitals)</h3>
                      </div>
                      <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800">
                        500 Hz Waveform Stream
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Heart Rate */}
                      <div className="p-3 bg-slate-950 rounded-2xl border border-red-900/60 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-red-400 flex items-center justify-between">
                          <span>Heart Rate</span>
                          <Heart className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <div className="text-2xl font-black font-mono text-white">
                          {heartRate} <span className="text-xs font-normal text-slate-400">BPM</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {heartRate > 100 ? '⚡ Tachycardic' : 'Normal Sinus Rhythm'}
                        </div>
                      </div>

                      {/* Oxygen Saturation SpO2 */}
                      <div className="p-3 bg-slate-950 rounded-2xl border border-cyan-900/60 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center justify-between">
                          <span>SpO₂ Level</span>
                          <Wind className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-2xl font-black font-mono text-cyan-300">
                          {spo2}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {spo2 < 92 ? '⚠️ Hypoxemic on Room Air' : 'Adequate Perfusion'}
                        </div>
                      </div>

                      {/* Blood Pressure */}
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                          <span>Blood Pressure</span>
                          <Droplet className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="text-lg font-black font-mono text-white mt-1">
                          {bloodPressure}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          MAP: ~72 mmHg (Stable)
                        </div>
                      </div>

                      {/* Respiratory Rate */}
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                          <span>Respiratory Rate</span>
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-lg font-black font-mono text-white mt-1">
                          {respiratoryRate} <span className="text-xs font-normal text-slate-400">bpm</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {respiratoryRate > 22 ? 'Rapid / Tachypneic' : 'Eupneic'}
                        </div>
                      </div>
                    </div>

                    {/* Body Temperature & Perfusion */}
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                        Core Body Temperature:
                      </span>
                      <strong className="text-amber-300 text-sm">{temperature}°C ({Math.round(temperature * 1.8 + 32)}°F)</strong>
                    </div>

                    {/* Live Beeping Heart Rate ECG Graph */}
                    <div className="pt-1">
                      <HeartRateEcgGraph
                        heartRate={heartRate}
                        spo2={spo2}
                        isAbnormal={twin?.ecg?.isAbnormal || heartRate > 100}
                        rhythmTitle={ecgRhythm || 'Lead II Continuous ECG Monitor'}
                        height={48}
                        showControls={true}
                      />
                    </div>
                  </div>

                  {/* Consciousness & Functional Mobility Assessment Card */}
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl text-xs">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>Consciousness & Functional Mobility</span>
                    </h3>

                    {/* Conscious / Unconscious Status */}
                    <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      consciousnessStatus === 'Unconscious'
                        ? 'bg-red-950/90 border-red-600 text-red-200'
                        : (consciousnessStatus === 'Alert' ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' : 'bg-amber-950/80 border-amber-600 text-amber-200')
                    }`}>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Conscious / Unconscious Status</div>
                        <div className="text-base font-black flex items-center gap-2 mt-0.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${consciousnessStatus === 'Unconscious' ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`}></span>
                          <span>{consciousnessStatus}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-[10px] opacity-80">Glasgow Coma Scale</div>
                        <div className="text-lg font-black">{gcsScore}/15</div>
                      </div>
                    </div>

                    {/* Ability to Walk */}
                    <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ability to Walk (Mobility)</div>
                        <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                          <span>{abilityToWalk?.toLowerCase().includes('non') ? '🚫' : '🚶'}</span>
                          <span>{abilityToWalk}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-amber-400 border border-slate-800">
                        Stretcher Required
                      </span>
                    </div>

                    {/* Quick Button: Update Console */}
                    {isParamedicOrEmt ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('update')}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Update Vitals, Medicines, or Treatments</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Read-Only View • Edits Reserved for Paramedic / EMT</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. EMERGENCY ASSESSMENT & CLINICAL TRIAGE CARD */}
              <div className="p-5 bg-slate-900/90 border border-red-900/50 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <h3 className="font-bold text-white text-base">Emergency Clinical Assessment & Triage</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase bg-red-950 text-red-300 border border-red-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span>{triageTag}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Incident Context */}
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Chief Incident / Trauma</span>
                    <div className="text-sm font-extrabold text-white">{currentEmergency}</div>
                    <div className="text-[11px] text-cyan-300 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{incidentLocation}</span>
                    </div>
                  </div>

                  {/* Consciousness & GCS Details */}
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Neurological (GCS)</span>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      <span>{consciousnessStatus}</span>
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono">
                      Breakdown: {gcsBreakdown}
                    </div>
                  </div>

                  {/* Mobility & Stretcher Mandate */}
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Mobility & Stretcher</span>
                    <div className="text-sm font-extrabold text-white">{abilityToWalk}</div>
                    <div className="text-[11px] text-slate-400">
                      {mobilityClassification}
                    </div>
                  </div>

                  {/* Perfusion Status */}
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Peripheral Perfusion</span>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                      <span>CRT & Vascular Check</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {perfusionStatus}
                    </div>
                  </div>
                </div>

                {/* Primary & Secondary Trauma Survey Findings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 font-mono">Primary Survey (ABCDE)</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{primarySurvey}</p>
                  </div>
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-cyan-400 font-mono">Secondary Survey & Immobilization</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{secondarySurvey}</p>
                  </div>
                </div>
              </div>

              {/* 4. TREATMENT PROVIDED DURING TRANSPORT (PRE-HOSPITAL EMS) */}
              <div className="p-5 bg-slate-900/90 border border-emerald-900/40 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                      <Ambulance className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <span>Treatment Provided During Transport</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {treatmentsList.length} Procedures Active
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Pre-hospital paramedic procedures, stabilization maneuvers, and trauma interventions administered en-route
                      </p>
                    </div>
                  </div>

                  {isParamedicOrEmt ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateCategory('paramedic');
                        setActiveTab('update');
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Log Transport Treatment</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Read-Only Procedures</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {treatmentsList.map(trt => (
                    <div
                      key={trt.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 shadow-md hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {trt.status}
                        </span>
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {trt.timestamp}
                        </span>
                      </div>

                      <div className="text-sm font-black text-white flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{trt.action}</span>
                      </div>
                      
                      <p className="text-xs text-slate-300 leading-relaxed">{trt.details}</p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Provider: <strong className="text-cyan-400">{trt.providerName}</strong></span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono">{trt.providerRole || 'EMS Paramedic'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. MEDICINES ADMINISTERED DURING TRANSPORT */}
              <div className="p-5 bg-slate-900/90 border border-purple-900/40 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-950 border border-purple-700/60 text-purple-400">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <span>Medicines Administered (Emergency Pharmacotherapy)</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                          {medicinesList.length} Doses Recorded
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Resuscitation pharmacotherapy, analgesia, and IV infusions administered during transport with clinical response
                      </p>
                    </div>
                  </div>

                  {isParamedicOrEmt ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateCategory('paramedic');
                        setActiveTab('update');
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Administer Medicine</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Read-Only Pharmacotherapy</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicinesList.map(med => (
                    <div
                      key={med.id}
                      className="p-4 bg-slate-950 border border-purple-900/40 rounded-2xl space-y-2.5 shadow-md hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                          <Syringe className="w-3 h-3" /> {med.route}
                        </span>
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {med.timestamp}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-sm font-black text-white">{med.medicine}</div>
                        <div className="text-xs font-mono font-bold text-cyan-400 shrink-0">{med.dose}</div>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1">
                        <div>Indication: <strong className="text-white">{med.indication}</strong></div>
                        <div>Effect / Response: <strong className="text-emerald-400">{med.effect}</strong></div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Administered By:</span>
                        <strong className="text-slate-200">{med.administeredBy}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DEDICATED TREATMENTS PROVIDED VIEW */}
          {activeTab === 'treatments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-emerald-400" />
                    <span>Emergency Treatments & Interventions Provided During Transport</span>
                  </h3>
                  <p className="text-xs text-slate-400">All pre-hospital paramedic procedures, stabilization maneuvers, and trauma interventions</p>
                </div>

                {isParamedicOrEmt ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateCategory('paramedic');
                      setActiveTab('update');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log New Treatment</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Transport Treatments (Read-Only)</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {treatmentsList.map(trt => (
                  <div
                    key={trt.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {trt.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {trt.timestamp}
                      </span>
                    </div>

                    <div className="text-base font-black text-white">{trt.action}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{trt.details}</p>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Provider: <strong className="text-cyan-400">{trt.providerName}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">{trt.providerRole || 'EMS Paramedic'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DEDICATED MEDICINES ADMINISTERED VIEW */}
          {activeTab === 'meds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Pill className="w-5 h-5 text-purple-400" />
                    <span>Medicines Administered & Resuscitation Pharmacotherapy</span>
                  </h3>
                  <p className="text-xs text-slate-400">Emergency doses administered en-route and in emergency department with route and clinical response</p>
                </div>

                {isParamedicOrEmt ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateCategory('paramedic');
                      setActiveTab('update');
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Administer Medicine</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pharmacotherapy (Read-Only)</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicinesList.map(med => (
                  <div
                    key={med.id}
                    className="p-5 bg-slate-900 border border-purple-900/40 rounded-3xl space-y-3 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5" /> {med.route}
                      </span>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {med.timestamp}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-lg font-black text-white">{med.medicine}</div>
                      <div className="text-sm font-mono font-bold text-cyan-400">{med.dose}</div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Indication: <strong className="text-white">{med.indication}</strong></div>
                      <div>Response / Clinical Effect: <strong className="text-emerald-400">{med.effect}</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      Administered By: <strong className="text-slate-200">{med.administeredBy}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: REAL-TIME PATIENT CONDITION TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Continuous Patient Condition Timeline</span>
                </h3>
                <p className="text-xs text-slate-400">Real-time progressive log of all clinical events, vital shifts, interventions and doctor orders</p>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {twin.timeline?.map(evt => (
                  <div key={evt.id} className="relative group">
                    {/* Timeline Node Bullet */}
                    <div className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-slate-950 shadow flex items-center justify-center ${
                      evt.severity === 'Critical' ? 'bg-red-500 ring-2 ring-red-400' : 'bg-cyan-500'
                    }`} />

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-cyan-400">{evt.timestamp}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950 text-slate-400 border border-slate-800">
                          Source: {evt.source}
                        </span>
                      </div>

                      <div className="text-sm font-extrabold text-white">{evt.event}</div>
                      <p className="text-xs text-slate-300">{evt.details}</p>

                      {evt.vitalsSnapshot && (
                        <div className="mt-2 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/50 text-slate-400 border border-slate-800/80">
                          Vitals: <span className="text-emerald-400">{evt.vitalsSnapshot}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ENTER LIVE CLINICAL UPDATE */}
          {activeTab === 'update' && (
            !isParamedicOrEmt ? (
              <div className="p-8 sm:p-12 bg-slate-900/90 border border-amber-500/40 rounded-3xl text-center space-y-4 max-w-2xl mx-auto shadow-2xl my-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-600/60 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">3D Digital Patient Modification Restricted</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Only active on-scene Paramedics and licensed Emergency Medical Technicians (EMTs) have authorization to alter 3D physiological parameters, vital streams, physical mobility status, or pre-hospital transport interventions.
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
                  Current Portal: <strong className="text-cyan-400 uppercase">{currentRole || 'Viewer'}</strong> • Access Level: <strong className="text-emerald-400">Synchronized Real-Time Read-Only</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                >
                  Return to 3D Patient Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-cyan-400" />
                        <span>Live Clinical Update Console</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Submit real-time observations, vital signs, medications, or functional state changes
                      </p>
                    </div>

                    {/* Authorized Paramedic / EMT Badge */}
                    <div className="flex items-center gap-2 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-700/80 text-xs text-emerald-300 font-bold shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Field Provider: {currentUser?.name || 'On-Scene Paramedic'}</span>
                    </div>
                  </div>

                {/* Real-time Telemetry Live Sync Active Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/50 rounded-2xl text-xs shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                      ⚡ Real-Time Live Sync Active
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono hidden sm:inline">
                      (Sliders & dropdowns immediately update 3D Twin & ECG)
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 font-mono text-[11px] text-slate-300 flex-wrap">
                    <span>HR: <strong className="text-white">{inputHeartRate} BPM</strong></span>
                    <span>•</span>
                    <span>SpO₂: <strong className="text-cyan-300">{inputSpo2}%</strong></span>
                    <span>•</span>
                    <span>BP: <strong className="text-white">{inputBp}</strong></span>
                    <span>•</span>
                    <span>RR: <strong className="text-emerald-300">{inputRr} bpm</strong></span>
                    <span>•</span>
                    <span>Temp: <strong className="text-amber-300">{inputTemp}°C</strong></span>
                  </div>
                </div>

                {/* Sub-form A: Live Vital Signs Sliders & Inputs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Update Patient Vital Telemetry</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveVitals(updateCategory === 'doctor' ? 'Doctor' : (updateCategory === 'patient' ? 'Patient' : 'Paramedic'))}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                    >
                      Save Vital Stream
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    {/* Heart Rate */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-300">Heart Rate (BPM):</label>
                        <span className="font-mono font-black text-white text-base">{inputHeartRate}</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="180"
                        value={inputHeartRate}
                        onChange={(e) => handleLiveVitalChange('heartRate', e.target.value)}
                        className="w-full accent-red-500 cursor-pointer"
                      />
                    </div>

                    {/* SpO2 */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-300">SpO₂ Oxygen (%):</label>
                        <span className="font-mono font-black text-cyan-400 text-base">{inputSpo2}%</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="100"
                        value={inputSpo2}
                        onChange={(e) => handleLiveVitalChange('spo2', e.target.value)}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    {/* Blood Pressure */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <label className="font-bold text-slate-300 block">Blood Pressure (mmHg):</label>
                      <input
                        type="text"
                        value={inputBp}
                        onChange={(e) => handleLiveVitalChange('bloodPressure', e.target.value)}
                        placeholder="e.g. 120/80 mmHg"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    {/* Respiratory Rate */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-300">Resp. Rate (bpm):</label>
                        <span className="font-mono font-black text-white text-base">{inputRr}</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="45"
                        value={inputRr}
                        onChange={(e) => handleLiveVitalChange('respiratoryRate', e.target.value)}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Temperature */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-300">Temperature (°C):</label>
                        <span className="font-mono font-black text-amber-300 text-base">{inputTemp}°C</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="41"
                        step="0.1"
                        value={inputTemp}
                        onChange={(e) => handleLiveVitalChange('temperature', e.target.value)}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-form B: Consciousness & Ability to Walk */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>Consciousness & Mobility Assessment</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveStatus(updateCategory === 'doctor' ? 'Doctor' : (updateCategory === 'patient' ? 'Patient' : 'Paramedic'))}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                    >
                      Update Status
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">Consciousness Level:</label>
                      <select
                        value={inputConsciousness}
                        onChange={(e) => handleLiveStatusChange('consciousness', e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="Alert">Alert (GCS 15 - Fully Oriented)</option>
                        <option value="Voice Responsive">Voice Responsive (GCS 12 - Lethargic)</option>
                        <option value="Pain Responsive">Pain Responsive (GCS 9 - Stuporous)</option>
                        <option value="Unconscious">Unconscious (GCS 6 - Comatose / Unresponsive)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">Ability to Walk:</label>
                      <select
                        value={inputAbilityToWalk}
                        onChange={(e) => handleLiveStatusChange('abilityToWalk', e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="Independent">Independent (Ambulatory)</option>
                        <option value="Assisted">Assisted (Needs Support)</option>
                        <option value="Non-ambulatory (Severe trauma)">Non-ambulatory (Severe trauma / Stretcher-bound)</option>
                        <option value="Immobilized (Spine Board)">Immobilized (Full Spinal Motion Restriction)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sub-form C: Add Treatment or Medication */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Treatment Logger */}
                  <form onSubmit={handleAddTreatment} className="p-4 bg-slate-950 rounded-2xl border border-emerald-900/40 space-y-3 text-xs">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                      <Stethoscope className="w-4 h-4" />
                      <span>Log Treatment Provided</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Treatment / Maneuver:</label>
                      <input
                        type="text"
                        value={trtAction}
                        onChange={(e) => setTrtAction(e.target.value)}
                        placeholder="e.g. Endotracheal Intubation, Tourniquet"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Details / Clinical Response:</label>
                      <input
                        type="text"
                        value={trtDetails}
                        onChange={(e) => setTrtDetails(e.target.value)}
                        placeholder="e.g. 7.5mm ETT placed, bilat breath sounds"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow cursor-pointer transition-all"
                    >
                      + Record Treatment
                    </button>
                  </form>

                  {/* Medication Logger */}
                  <form onSubmit={handleAddMedication} className="p-4 bg-slate-950 rounded-2xl border border-purple-900/40 space-y-3 text-xs">
                    <div className="font-bold text-purple-400 flex items-center gap-1.5 text-sm">
                      <Pill className="w-4 h-4" />
                      <span>Administer Medication</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-semibold">Medicine:</label>
                        <input
                          type="text"
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                          placeholder="e.g. Atropine Sulfate"
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 font-semibold">Dose & Route:</label>
                        <input
                          type="text"
                          value={medDose}
                          onChange={(e) => setMedDose(e.target.value)}
                          placeholder="e.g. 0.5mg IV"
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Clinical Indication:</label>
                      <input
                        type="text"
                        value={medIndication}
                        onChange={(e) => setMedIndication(e.target.value)}
                        placeholder="e.g. Symptomatic bradycardia"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow cursor-pointer transition-all"
                    >
                      + Administer Medication
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 z-20">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Synchronized with Hospital Emergency Command Network
            </span>
            <span>•</span>
            <span>Last Sync: {new Date(twin.lastUpdated || Date.now()).toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close Digital Twin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
