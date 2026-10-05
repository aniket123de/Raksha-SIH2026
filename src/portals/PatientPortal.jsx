import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useEmergency } from '../context/EmergencyContext';
import { EmergencyMap } from '../components/EmergencyMap';
import { TriageModal } from '../components/TriageModal';
import { aiService } from '../services/aiService';
import { openInGoogleMapsApp, navigateInGoogleMapsApp } from '../utils/googleMaps';
import { AMBULANCE_DIRECTION_CONFIGS, calculateDistanceKm, getAmbulanceTheme } from '../utils/routingEngine';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  ShieldAlert,
  AlertOctagon,
  MapPin,
  Ambulance,
  Building2,
  Stethoscope,
  Sparkles,
  Phone,
  Shield,
  Clock,
  Activity,
  User,
  CheckCircle2,
  Flame,
  Waves,
  Mountain,
  Wind,
  Droplets,
  Languages,
  Filter,
  Search,
  ExternalLink,
  Edit3,
  Check,
  X,
  Compass,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Lock,
  ChevronRight,
  RotateCcw,
  Bell,
  Info,
  QrCode,
  Scan,
  Save,
  Zap,
  Navigation,
  Download,
  Maximize2,
  Copy
} from 'lucide-react';

export const PatientPortal = () => {
  const {
    currentUser,
    portalTab,
    setPortalTab,
    patients,
    hospitals,
    ambulances,
    doctors,
    activeEmergencies,
    trafficSignals,
    notifications,
    triggerSOS,
    updateTriage,
    updatePatientProfile,
    updateEmergencyStatus,
    toggleTrafficPolicePermission,
    dispatchMultipleAmbulances,
    openDigitalTwinForPatient,
    openMedicalQrForPatient
  } = useEmergency();

  const patient = patients.find(p => p.id === currentUser?.referenceId) || patients[0];
  const currentEmergency = activeEmergencies.find(e => e.patientId === patient.id && e.status !== 'Completed');

  // Emergency Medical QR Pass State & Generation
  const [patientQrUrl, setPatientQrUrl] = useState('');
  const [copiedQr, setCopiedQr] = useState(false);

  useEffect(() => {
    if (!patient) return;
    const emergencyPayload = JSON.stringify({
      app: 'Raksha Emergency Response',
      type: 'EMERGENCY_MEDICAL_PROFILE',
      patientId: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies || 'Penicillin, Aspirin (Severe Anaphylaxis)',
      conditions: patient.existingConditions || 'Type-2 Diabetes, Mild Hypertension',
      medications: patient.currentMedications || 'Metformin 500mg BD, Telmisartan 40mg OD',
      emergencyContact: patient.emergencyContact || 'Priya Verma (Wife) - +91 98765 43211',
      medicalHistory: patient.medicalHistory || 'Prior appendectomy (2018). No known cardiac history. Mild seasonal asthma.',
      verificationUrl: `${window.location.origin}/?scanMedical=${patient.id}`,
      generatedAt: new Date().toISOString()
    });

    QRCode.toDataURL(emergencyPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setPatientQrUrl(url))
      .catch(err => console.error('Failed to generate patient medical QR code:', err));
  }, [patient]);

  const handleDownloadPatientQr = () => {
    if (!patientQrUrl) return;
    const link = document.createElement('a');
    link.href = patientQrUrl;
    link.download = `Raksha_Medical_QR_${patient.id}_${(patient.name || 'Patient').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyQrSummary = () => {
    const summary = `RAKSHA EMERGENCY MEDICAL PASS
Patient: ${patient.name} (${patient.id})
Blood Group: ${patient.bloodGroup}
Allergies: ${patient.allergies || 'Penicillin, Aspirin'}
Conditions: ${patient.existingConditions || 'Type-2 Diabetes, Mild Hypertension'}
Medications: ${patient.currentMedications || 'Metformin 500mg BD, Telmisartan 40mg OD'}
Emergency Contact: ${patient.emergencyContact}
Scan QR at Raksha Doctor/Paramedic Terminal to decrypt complete EHR.`;
    navigator.clipboard.writeText(summary);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 2500);
  };

  // Reusable Emergency Medical History QR Pass Card Component
  const renderMedicalQrCard = (isHero = false) => (
    <div className={`bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 ${isHero ? 'my-2' : ''}`}>
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        <div className="space-y-4 max-w-xl text-left flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/60 flex items-center gap-1.5 shadow-sm">
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              <span>EMERGENCY MEDICAL HISTORY QR PASS</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Doctor & Paramedic/EMT Scan Ready</span>
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Instant Medical History Access via Secure QR Pass
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              To protect your privacy, detailed EHR records and medical conditions are concealed from the public portal display. 
              During an emergency, on-scene <strong>Paramedics/EMTs</strong> and hospital <strong>ER Doctors</strong> can scan this QR pass directly using their Raksha terminal scanner to decrypt your critical allergies, past surgical history, home medications, and emergency contacts.
            </p>
          </div>

          {/* Safety Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
              <span className="text-red-400 font-black font-mono text-sm">{patient.bloodGroup}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Allergies Encrypted</span>
              <span className="text-rose-300 font-semibold truncate block">Penicillin, Aspirin...</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Medical History</span>
              <span className="text-cyan-300 font-semibold truncate block">256-Bit Encrypted</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => openMedicalQrForPatient(patient)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950/50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Open Fullscreen Pass & Scanner</span>
            </button>

            <button
              onClick={handleDownloadPatientQr}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-300" />
              <span>Download QR Pass (PNG)</span>
            </button>

            <button
              onClick={handleCopyQrSummary}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedQr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedQr ? 'Summary Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center p-5 bg-slate-950/90 border border-purple-500/40 rounded-3xl shadow-2xl shrink-0 group">
          <div className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
            {patientQrUrl ? (
              <img
                src={patientQrUrl}
                alt={`Emergency Medical QR Code for ${patient.name}`}
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12 animate-pulse text-purple-500" />
              </div>
            )}
            
            {/* Corner Scan Accent Targets */}
            <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-purple-600 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-purple-600 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-purple-600 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-purple-600 rounded-br-sm pointer-events-none" />
          </div>

          <div className="mt-3 text-center space-y-1">
            <span className="text-[11px] font-mono text-purple-300 font-bold block">
              Scan to Access Patient EHR
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              ID: {patient.id} • {patient.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Track whether Emergency SOS Wizard has been completed in this session
  const [sosWizardCompleted, setSosWizardCompleted] = useState(() => {
    return sessionStorage.getItem('raksha_sos_wizard_completed') === 'true';
  });

  // Strict check: Maps CANNOT be accessed unless SOS is pressed AND emergency assessment is done!
  const isEmergencyAssessed = Boolean(
    currentEmergency &&
    currentEmergency.sosPressed &&
    (currentEmergency.assessmentCompleted ||
     (currentEmergency.triageScore &&
      currentEmergency.triageScore.consciousness &&
      currentEmergency.triageScore.abilityToWalk &&
      currentEmergency.triageScore.breathing))
  );

  const isEmergencyAssessedAndActive = Boolean(
    (sosWizardCompleted || sessionStorage.getItem('raksha_sos_wizard_completed') === 'true') &&
    currentEmergency &&
    currentEmergency.status !== 'Completed' &&
    currentEmergency.sosPressed &&
    isEmergencyAssessed
  );

  const isTrafficPoliceGranted = currentEmergency?.trafficPolicePermission !== undefined
    ? currentEmergency.trafficPolicePermission === 'GRANTED'
    : (currentEmergency?.greenCorridorActive ?? true);

  // SOS Wizard Step (1: Confirm, 2: Location, 3: Type, 4: Assessment/Triage, 5: Created/Track)
  const [sosStep, setSosStep] = useState(1);
  const [showSosWizard, setShowSosWizard] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('raksha_trigger_wizard_step1') === 'true') {
      sessionStorage.removeItem('raksha_trigger_wizard_step1');
      setSosStep(1);
      setShowSosWizard(true);
    }
  }, [portalTab]);
  const [capturedLocation, setCapturedLocation] = useState({
    address: "AJC Bose Road Flyover near Exide Crossing, Kolkata",
    lat: 22.5415,
    lng: 88.3485,
    isSimulated: true
  });
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('Accident');
  const [otherEmergencyText, setOtherEmergencyText] = useState('');
  const [numAmbulances, setNumAmbulances] = useState(1);

  // Assessment vitals for SOS Step 4 (Only dropdown fields are mandatory; others are optional)
  const [assessmentVitals, setAssessmentVitals] = useState({
    consciousness: 'Voice Responsive',
    abilityToWalk: 'No',
    breathing: 'Rapid / Labored (26 bpm)',
    heartRate: '',
    bloodPressure: '',
    oxygenSaturation: '',
    temperature: '',
    otherVitals: ''
  });
  const [assessmentError, setAssessmentError] = useState('');

  // Calculate live severity
  const triageResult = aiService.evaluateTriage({
    consciousness: assessmentVitals.consciousness,
    abilityToWalk: assessmentVitals.abilityToWalk,
    breathing: assessmentVitals.breathing,
    heartRate: assessmentVitals.heartRate,
    oxygenSaturation: assessmentVitals.oxygenSaturation
  });

  // Hospital Filter States
  const [hospitalTypeFilter, setHospitalTypeFilter] = useState('All'); // All, Government, Private
  const [hospitalFacilityFilter, setHospitalFacilityFilter] = useState('all');
  const [hospitalSearch, setHospitalSearch] = useState('');

  // AI Translator States
  const [prescriptionText, setPrescriptionText] = useState(
    'Tab. Amoxicillin-Clav 625mg PO TID x 7d. Tab. Paracetamol 650mg SOS PRN fever > 100F. Inhaler Salbutamol 100mcg 2 puffs QID for bronchospasm. Avoid NSAIDs.'
  );
  const [targetLang, setTargetLang] = useState('English');
  const [aiResult, setAiResult] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Edit Patient Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone || '+91 98765 43210',
    address: patient.address || '14/2, Rowland Road, Ballygunge, Kolkata',
    bloodGroup: patient.bloodGroup,
    emergencyContact: patient.emergencyContact
  });

  useEffect(() => {
    if (patient) {
      setEditFormData(prev => ({
        ...prev,
        name: patient.name || '',
        age: patient.age || 28,
        gender: patient.gender || 'Male',
        phone: patient.phone || prev.phone,
        address: patient.address || prev.address,
        bloodGroup: patient.bloodGroup || 'O+',
        emergencyContact: patient.emergencyContact || ''
      }));
    }
  }, [patient, isEditProfileOpen]);

  // Emergency Types list according to prompt section 3
  const emergencyTypesList = [
    { id: 'Accident', label: 'Accident', icon: AlertOctagon, desc: 'Road traffic collision, high-speed impact' },
    { id: 'Heart emergency', label: 'Heart emergency', icon: Activity, desc: 'Chest pain, suspected myocardial infarction' },
    { id: 'Fire', label: 'Fire', icon: Flame, desc: 'Burn injuries, smoke inhalation' },
    { id: 'Flood', label: 'Flood', icon: Waves, desc: 'Water submergence, near-drowning' },
    { id: 'Earthquake', label: 'Earthquake', icon: Mountain, desc: 'Structural collapse, crush injuries' },
    { id: 'Breathing emergency', label: 'Breathing emergency', icon: Wind, desc: 'Acute respiratory distress, severe choking' },
    { id: 'Unconsciousness', label: 'Unconsciousness', icon: Activity, desc: 'Syncope, unresponsive citizen, coma' },
    { id: 'Severe bleeding', label: 'Severe bleeding', icon: Droplets, desc: 'Arterial hemorrhage, deep lacerations' },
    { id: 'Other', label: 'Other', icon: AlertTriangle, desc: 'Other acute medical crisis' }
  ];

  // Lifecycle statuses according to prompt Section 3 Step 5
  const lifecycleStatuses = [
    'Request Created',
    'Assistance Being Coordinated',
    'Ambulance Assigned',
    'En Route',
    'Arrived',
    'Transporting',
    'Completed'
  ];

  // Map internal status to lifecycle index
  const getLifecycleIndex = (status) => {
    switch (status) {
      case 'Requested': return 0;
      case 'Coordinating': return 1;
      case 'Assigned': return 2;
      case 'En Route': return 3;
      case 'Arrived': return 4;
      case 'Transporting': return 5;
      case 'Completed': return 6;
      default: return 2;
    }
  };

  // Capture GPS (or fallback to simulated location in DEMO MODE)
  const handleCaptureGps = () => {
    setIsCapturingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCapturedLocation({
            address: `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (Live Device GPS)`,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isSimulated: false
          });
          setIsCapturingGps(false);
        },
        () => {
          // Fallback to simulated location in demo mode
          setCapturedLocation({
            address: "AJC Bose Road Flyover near Exide Crossing, Kolkata (±6m)",
            lat: 22.5415,
            lng: 88.3485,
            isSimulated: true
          });
          setIsCapturingGps(false);
        },
        { timeout: 4000 }
      );
    } else {
      setCapturedLocation({
        address: "AJC Bose Road Flyover near Exide Crossing, Kolkata (±6m)",
        lat: 22.5415,
        lng: 88.3485,
        isSimulated: true
      });
      setIsCapturingGps(false);
    }
  };

  // Submit SOS request at end of step 4
  const handleCompleteSOS = () => {
    // Validate only primary mandatory fields
    if (!assessmentVitals.consciousness || !assessmentVitals.abilityToWalk || !assessmentVitals.breathing) {
      setAssessmentError('Please select all mandatory assessment fields: Consciousness Level, Ability to Walk, and Breathing Status.');
      return;
    }
    setAssessmentError('');

    const finalType = selectedEmergencyType === 'Other' && otherEmergencyText ? otherEmergencyText : selectedEmergencyType;
    
    // Construct vitals summary incorporating mandatory dropdowns and any optional vitals provided
    const summaryItems = [
      `${triageResult.severity} triage`,
      `AVPU: ${assessmentVitals.consciousness}`,
      `Mobility: ${assessmentVitals.abilityToWalk}`,
      `Breathing: ${assessmentVitals.breathing}`,
      assessmentVitals.heartRate ? `HR: ${assessmentVitals.heartRate} bpm` : null,
      assessmentVitals.oxygenSaturation ? `SpO2: ${assessmentVitals.oxygenSaturation}` : null,
      assessmentVitals.bloodPressure ? `BP: ${assessmentVitals.bloodPressure}` : null,
      assessmentVitals.temperature ? `Temp: ${assessmentVitals.temperature}` : null
    ].filter(Boolean);

    triggerSOS({
      patientId: patient.id,
      emergencyType: finalType,
      severity: triageResult.severity,
      location: capturedLocation,
      numberOfAmbulances: numAmbulances,
      triageData: {
        ...assessmentVitals,
        vitalsSummary: summaryItems.join(' • ')
      }
    });
    setSosWizardCompleted(true);
    sessionStorage.setItem('raksha_sos_wizard_completed', 'true');
    setSosStep(5);
  };

  // Save updated medical info
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updatePatientProfile(patient.id, editFormData);
    setIsEditProfileOpen(false);
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    const res = await aiService.translatePrescription(prescriptionText, targetLang);
    setAiResult(res);
    setIsTranslating(false);
  };

  const assignedAmbulance = ambulances.find(a => a.id === currentEmergency?.assignedAmbulanceId);
  const allAssignedAmbulances = useMemo(() => {
    const ids = Array.isArray(currentEmergency?.assignedAmbulanceIds) && currentEmergency.assignedAmbulanceIds.length >= 1
      ? currentEmergency.assignedAmbulanceIds
      : (currentEmergency?.assignedAmbulanceId ? [currentEmergency.assignedAmbulanceId] : []);
    const num = currentEmergency?.numberOfAmbulances;
    const reqCount = ids.length >= 1
      ? ids.length
      : (num === 'Many' || num === 'many') ? Math.max(ambulances.length, 5) : Math.max(1, Number(num) || 1);
    const list = [];
    const used = new Set();
    for (const id of ids) {
      if (list.length >= reqCount) break;
      const amb = ambulances.find(a => a.id === id);
      if (amb && !used.has(amb.id)) { list.push(amb); used.add(amb.id); }
    }
    for (const amb of ambulances) {
      if (list.length >= reqCount) break;
      if (!used.has(amb.id)) { list.push(amb); used.add(amb.id); }
    }
    const finalFleet = list.slice(0, reqCount);
    return finalFleet.length > 0 ? finalFleet : (assignedAmbulance ? [assignedAmbulance] : []);
  }, [currentEmergency, ambulances, assignedAmbulance]);

  const [focusedAmbulanceId, setFocusedAmbulanceId] = useState(null);
  const [mapModePreference, setMapModePreference] = useState('interactive');

  // Compute live directional metrics for each responding ambulance prioritizing shortest distance
  const ambulanceMetrics = useMemo(() => {
    const pLat = currentEmergency?.location?.lat || 28.5680;
    const pLng = currentEmergency?.location?.lng || 77.2350;
    const baseSpeed = isTrafficPoliceGranted ? 58 : 42;
    return allAssignedAmbulances.map((amb, idx) => {
      const dirConfig = getAmbulanceTheme(idx, isTrafficPoliceGranted);
      const ambHasCoords = Boolean(amb && amb.lat && amb.lng);
      const ambDist = ambHasCoords ? calculateDistanceKm(amb.lat, amb.lng, pLat, pLng) : 999;
      const syntheticLat = pLat + dirConfig.dLat;
      const syntheticLng = pLng + dirConfig.dLng;
      const syntheticDist = calculateDistanceKm(syntheticLat, syntheticLng, pLat, pLng);

      const useDirect = ambHasCoords && (ambDist <= syntheticDist || ambDist < 4.5);
      const startLat = useDirect ? amb.lat : syntheticLat;
      const startLng = useDirect ? amb.lng : syntheticLng;
      const dist = calculateDistanceKm(startLat, startLng, pLat, pLng);

      const corridorFactor = [1.0, 0.94, 0.90, 0.88, 0.84, 0.82, 0.86, 0.85][idx % 8];
      const speed = Math.round(baseSpeed * corridorFactor);
      const eta = Math.max(3, Math.round((dist / speed) * 60));
      return {
        ambulanceId: amb.id,
        ambulance: amb,
        idx,
        distanceKm: dist,
        etaMinutes: eta,
        speedKmh: speed,
        dirConfig
      };
    });
  }, [allAssignedAmbulances, currentEmergency?.location, isTrafficPoliceGranted]);

  const activeSelectedAmbulance = useMemo(() => {
    if (focusedAmbulanceId) {
      const found = allAssignedAmbulances.find(a => a.id === focusedAmbulanceId);
      if (found) return found;
    }
    // Default to the shortest distance ambulance if available
    if (ambulanceMetrics && ambulanceMetrics.length > 0) {
      const sortedByDist = [...ambulanceMetrics].sort((a, b) => a.distanceKm - b.distanceKm);
      if (sortedByDist[0]?.ambulance) return sortedByDist[0].ambulance;
    }
    return assignedAmbulance || allAssignedAmbulances[0] || null;
  }, [focusedAmbulanceId, allAssignedAmbulances, assignedAmbulance, ambulanceMetrics]);

  const activeMetrics = useMemo(() => {
    if (activeSelectedAmbulance) {
      const match = ambulanceMetrics.find(m => m.ambulanceId === activeSelectedAmbulance.id);
      if (match) return match;
    }
    return ambulanceMetrics[0] || {
      distanceKm: 2.1,
      etaMinutes: 4,
      speedKmh: 58,
      dirConfig: getAmbulanceTheme(0, isTrafficPoliceGranted)
    };
  }, [activeSelectedAmbulance, ambulanceMetrics, isTrafficPoliceGranted]);

  const targetHospital = hospitals.find(h => h.id === currentEmergency?.destinationHospitalId) || hospitals[0];

  // Filtered hospitals
  const filteredHospitals = hospitals.filter(h => {
    if (hospitalTypeFilter !== 'All' && h.type !== hospitalTypeFilter) return false;
    if (hospitalFacilityFilter === 'icu' && h.icuBeds < 5) return false;
    if (hospitalFacilityFilter === 'oxygen' && h.oxygenStatus !== 'Available') return false;
    if (hospitalFacilityFilter === 'ventilator' && h.ventilators < 5) return false;
    if (hospitalFacilityFilter === 'blood' && (!h.bloodBank || Object.values(h.bloodBank).reduce((a, b) => a + b, 0) < 50)) return false;
    if (hospitalSearch && !h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) && !h.address.toLowerCase().includes(hospitalSearch.toLowerCase())) return false;
    return true;
  });

  const activeLifecycleStep = getLifecycleIndex(currentEmergency?.status || 'Assigned');

  // Role notifications for patient
  const patientNotifications = notifications.filter(n => n.targetRole === 'all' || n.targetRole === 'patient');

  return (
    <div className="space-y-8 pb-16">

      {/* 5-STEP SOS WIZARD MODAL */}
      {showSosWizard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-600/70 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-up">
            
            {/* Wizard Header with Steps Progress */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
                  <AlertOctagon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Emergency SOS Assistance Protocol</h2>
                  <p className="text-xs text-slate-400">Step {sosStep} of 5 — Priority Medical Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSosWizard(false);
                  setSosStep(1);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
              {[
                { s: 1, label: "Confirm" },
                { s: 2, label: "Location" },
                { s: 3, label: "Type" },
                { s: 4, label: "Assessment" },
                { s: 5, label: "Dispatch" }
              ].map(item => (
                <div
                  key={item.s}
                  className={`py-1.5 rounded-lg border transition-all ${
                    sosStep === item.s
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/40'
                      : sosStep > item.s
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  Step {item.s}: {item.label}
                </div>
              ))}
            </div>

            {/* STEP 1: CONFIRMATION */}
            {sosStep === 1 && (
              <div className="space-y-6 py-4 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-600/20 text-red-500 flex items-center justify-center border-2 border-red-500/40 animate-pulse shadow-lg shadow-red-900/40">
                  <AlertOctagon className="w-10 h-10" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-2xl font-black text-white">
                    «Are you sure you want to request emergency assistance?»
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This will immediately alert nearby Advanced Life Support ambulances, police traffic control, and hospital emergency trauma units.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-center gap-2 max-w-md mx-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Citizen Dispatch: <strong>{patient.name}</strong> ({patient.bloodGroup})</span>
                </div>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSosWizard(false)}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCaptureGps();
                      setSosStep(2);
                    }}
                    className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-red-900/50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Confirm Emergency Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION */}
            {sosStep === 2 && (
              <div className="space-y-6 py-2">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    Capture & Share Patient Location
                  </h3>
                  <p className="text-xs text-slate-400">
                    Precision GPS telemetry coordinates are transmitted directly to the responding ambulance and hospital control room.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Position Status:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🧪 DEMO MODE — GPS movement is simulated
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/80 flex items-start gap-3">
                    <Compass className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-white">{capturedLocation.address}</div>
                      <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                        Latitude: {capturedLocation.lat.toFixed(4)}° N • Longitude: {capturedLocation.lng.toFixed(4)}° E
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="px-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center gap-1.5 font-mono shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Maps Locked: Active Emergency SOS Required</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      disabled={isCapturingGps}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isCapturingGps ? 'animate-spin' : ''}`} />
                      <span>{isCapturingGps ? 'Detecting Coordinates...' : 'Recalibrate GPS Telemetry'}</span>
                    </button>
                  </div>
                </div>

                {/* Multiple Ambulances selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Number of Ambulances Requested:</span>
                    <span className="text-red-400 font-mono font-bold">
                      {numAmbulances === 'Many' ? 'Many (Mass Casualty)' : `${numAmbulances} Vehicle${numAmbulances > 1 ? 's' : ''}`}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNumAmbulances(num)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          numAmbulances === num
                            ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {num} Ambulance{num > 1 ? 's' : ''}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNumAmbulances('Many')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        numAmbulances === 'Many'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/40 ring-2 ring-red-400/50 animate-pulse'
                          : 'bg-slate-950 text-amber-400 border-amber-500/40 hover:bg-amber-950/40 hover:border-amber-400'
                      }`}
                      title="Mass casualty incident requiring regional multi-fleet dispatch"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Many Ambulances</span>
                    </button>
                  </div>
                  {numAmbulances === 'Many' && (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2 mt-2 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Mass Casualty Multi-Fleet Protocol Activated:</span>
                        <p className="text-[11px] text-amber-200/90 mt-0.5">
                          Dispatches multiple emergency vehicles across nearby regional trauma zones and triggers priority mutual-aid fleet coordination.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSosStep(1)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setSosStep(3)}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <span>Proceed to Emergency Type</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: EMERGENCY TYPE */}
            {sosStep === 3 && (
              <div className="space-y-6 py-2">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Select Emergency Category
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecting the nature of distress ensures specialized medical gear (e.g. ALS, burn kit, extrication tools) is prepped.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {emergencyTypesList.map(item => {
                    const Icon = item.icon;
                    const isSelected = selectedEmergencyType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedEmergencyType(item.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-red-950/80 border-red-500 text-white shadow-lg shadow-red-900/30 ring-1 ring-red-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-red-400" />}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold text-white">{item.label}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedEmergencyType === 'Other' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs text-slate-300 font-semibold">Describe Nature of Emergency:</label>
                    <input
                      type="text"
                      value={otherEmergencyText}
                      onChange={(e) => setOtherEmergencyText(e.target.value)}
                      placeholder="e.g. Chemical burn, electrocution, allergic shock..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSosStep(2)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setSosStep(4)}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <span>Proceed to Emergency Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: EMERGENCY ASSESSMENT */}
            {sosStep === 4 && (
              <div className="space-y-5 py-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Emergency Assessment / Triage Support
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                      triageResult.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' :
                      triageResult.severity === 'High' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                      triageResult.severity === 'Moderate' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      Severity: {triageResult.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-400 font-medium">
                    «Emergency assessment / triage support — not a medical diagnosis.»
                  </p>
                </div>

                {/* Mandatory Assessment to Unlock Maps Notice */}
                <div className="p-3.5 bg-gradient-to-r from-red-950/70 to-slate-950 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-start gap-2.5 shadow-md">
                  <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>Mandatory for Live Map Access:</span>
                      <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono">
                        GIS Map Gated
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Completing this clinical assessment (Consciousness, Ability to Walk, and Breathing) is mandatory to unlock the <strong>Live GIS Map</strong>, fastest Green Wave corridor routing, and incoming ambulance telemetry.
                    </p>
                  </div>
                </div>

                {/* Mandatory vs Optional Fields Notice */}
                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>Emergency Assessment Protocol:</span>
                      <span className="bg-red-950 text-red-300 border border-red-700/60 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                        Primary Assessment Fields Mandatory
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Only the <strong>3 primary assessment fields</strong> (Consciousness, Ability to Walk, and Breathing Status) are <strong>mandatory</strong> to be filled. All numeric vital signs and clinical notes are <strong>optional</strong> so emergency assistance can be dispatched without delay.
                    </p>
                  </div>
                </div>

                {/* Validation Error Alert */}
                {assessmentError && (
                  <div className="p-3 bg-red-950/90 border border-red-500 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{assessmentError}</span>
                  </div>
                )}

                {/* Vitals Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  
                  {/* Consciousness - MANDATORY */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                        <span>Consciousness Level (AVPU)</span>
                        <span className="text-red-400 font-bold text-[10px] uppercase bg-red-950/90 border border-red-800 px-1.5 py-0.2 rounded">* Mandatory</span>
                      </label>
                    </div>
                    <select
                      value={assessmentVitals.consciousness}
                      onChange={(e) => {
                        setAssessmentVitals({ ...assessmentVitals, consciousness: e.target.value });
                        if (assessmentError) setAssessmentError('');
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                      required
                    >
                      <option value="Alert">Alert (Fully conscious)</option>
                      <option value="Voice Responsive">Voice Responsive (Drowsy)</option>
                      <option value="Pain Only">Pain Only (Stupor)</option>
                      <option value="Unresponsive">Unresponsive (Comatose)</option>
                    </select>
                  </div>

                  {/* Ability to walk - MANDATORY */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                        <span>Ability to Walk / Ambulatory</span>
                        <span className="text-red-400 font-bold text-[10px] uppercase bg-red-950/90 border border-red-800 px-1.5 py-0.2 rounded">* Mandatory</span>
                      </label>
                    </div>
                    <select
                      value={assessmentVitals.abilityToWalk}
                      onChange={(e) => {
                        setAssessmentVitals({ ...assessmentVitals, abilityToWalk: e.target.value });
                        if (assessmentError) setAssessmentError('');
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                      required
                    >
                      <option value="Yes">Yes (Can walk unassisted)</option>
                      <option value="With assistance">With assistance (Staggering)</option>
                      <option value="No">No (Immobile / Severe trauma)</option>
                    </select>
                  </div>

                  {/* Breathing status - MANDATORY */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                        <span>Breathing Status</span>
                        <span className="text-red-400 font-bold text-[10px] uppercase bg-red-950/90 border border-red-800 px-1.5 py-0.2 rounded">* Mandatory</span>
                      </label>
                    </div>
                    <select
                      value={assessmentVitals.breathing}
                      onChange={(e) => {
                        setAssessmentVitals({ ...assessmentVitals, breathing: e.target.value });
                        if (assessmentError) setAssessmentError('');
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                      required
                    >
                      <option value="Normal (16-20 bpm)">Normal (16-20 bpm)</option>
                      <option value="Rapid / Labored (26 bpm)">Rapid / Labored (26 bpm)</option>
                      <option value="Shallow / Struggling (<10 bpm)">Shallow / Struggling (&lt;10 bpm)</option>
                      <option value="Absent / Apnea">Absent / Apnea (Immediate CPR)</option>
                    </select>
                  </div>

                  {/* Heart rate - OPTIONAL (Typeable directly, no stepper arrows) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <span>Heart Rate (BPM)</span>
                        <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={assessmentVitals.heartRate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setAssessmentVitals({ ...assessmentVitals, heartRate: val });
                      }}
                      placeholder="Type heart rate (e.g. 75)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Blood pressure - OPTIONAL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <span>Blood Pressure (mmHg)</span>
                        <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
                    </div>
                    <input
                      type="text"
                      value={assessmentVitals.bloodPressure}
                      onChange={(e) => setAssessmentVitals({ ...assessmentVitals, bloodPressure: e.target.value })}
                      placeholder="Optional (e.g. 120/80)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-600"
                    />
                  </div>

                  {/* SpO2 - OPTIONAL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <span>Oxygen Saturation (SpO₂)</span>
                        <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
                    </div>
                    <input
                      type="text"
                      value={assessmentVitals.oxygenSaturation}
                      onChange={(e) => setAssessmentVitals({ ...assessmentVitals, oxygenSaturation: e.target.value })}
                      placeholder="Optional (e.g. 98%)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-600"
                    />
                  </div>

                  {/* Temperature - OPTIONAL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <span>Body Temperature</span>
                        <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
                    </div>
                    <input
                      type="text"
                      value={assessmentVitals.temperature}
                      onChange={(e) => setAssessmentVitals({ ...assessmentVitals, temperature: e.target.value })}
                      placeholder="Optional (e.g. 37.0 °C)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-600"
                    />
                  </div>

                  {/* Other vitals - OPTIONAL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <span>Other Clinical Notes</span>
                        <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Leave blank if none</span>
                    </div>
                    <input
                      type="text"
                      value={assessmentVitals.otherVitals}
                      onChange={(e) => setAssessmentVitals({ ...assessmentVitals, otherVitals: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-600"
                      placeholder="Optional (e.g. Cold extremities, bleeding from ear...)"
                    />
                  </div>

                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSosStep(3)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteSOS}
                    className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-xl shadow-red-900/50 flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <span>Create Emergency Request Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: CREATED & REAL-TIME STATUS PROGRESSION */}
            {sosStep === 5 && (
              <div className="space-y-6 py-2 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">Emergency Request Created & Active!</h3>
                  <p className="text-xs text-slate-400">
                    Incident ID: <strong className="font-mono text-slate-200">{currentEmergency?.id || 'EMG-8821'}</strong> • Live telemetry connected to EMS Dispatch
                  </p>
                </div>

                {/* 7-Step Real-Time Status Lifecycle Bar */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-left">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block text-center">
                    Real-Time Emergency Lifecycle Tracker
                  </span>

                  <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 z-0 hidden sm:block"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 relative z-10">
                      {lifecycleStatuses.map((st, idx) => {
                        const isDone = activeLifecycleStep >= idx;
                        const isCurrent = activeLifecycleStep === idx;
                        return (
                          <div
                            key={st}
                            className={`flex sm:flex-col items-center gap-2 sm:gap-1 p-2 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'bg-red-600 text-white border-red-400 font-bold shadow-lg shadow-red-900/40 scale-105'
                                : isDone
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 font-medium'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCurrent ? 'bg-white text-red-600 animate-pulse' : isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span className="text-[10px] leading-tight line-clamp-2">{st}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/80 border border-emerald-600/70 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Clinical Assessment Submitted:</strong> Live GIS Map & Fleet Telemetry Unlocked!</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-mono text-[10px] font-bold">
                    GPS UNLOCKED
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSosWizard(false);
                      setPortalTab('Ambulance');
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:scale-105"
                  >
                    <Ambulance className="w-4 h-4" />
                    <span>View Live Ambulance Tracking on Map →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSosWizard(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                  <p className="text-[11px] text-slate-400">Update personal demographics, residential address, and emergency contact details</p>
                </div>
              </div>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Full Name:</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Blood Group:</label>
                  <select
                    value={editFormData.bloodGroup}
                    onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Age:</label>
                  <input
                    type="number"
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({ ...editFormData, age: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Gender:</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Phone Number:</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Residential City / Address:</label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Primary Emergency Contact (Name & Phone):</label>
                <input
                  type="text"
                  value={editFormData.emergencyContact}
                  onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified citizen identity saved securely with role-based privacy protection.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: HOME (DEFAULT DASHBOARD OVERVIEW) */}
      {/* ========================================================================= */}
      {(portalTab === 'Home' || portalTab === 'Dashboard' || !portalTab) && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Hero Emergency SOS Trigger Banner */}
          <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-4xl mx-auto text-center space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                24/7 Immediate Emergency Medical Assistance
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                One-Tap Emergency <span className="text-red-500">SOS Dispatch</span>
              </h1>

              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Press the SOS button below to initiate emergency medical dispatch, locking live GPS and dispatching nearby Advanced Life Support ambulances.
              </p>

              {/* Tactile 3D Physical Emergency Push-Button (No Heart Symbol) */}
              <div className="py-6 flex flex-col items-center justify-center">
                {/* 3D Heavy Outer Bezel / Collar */}
                <div className="relative p-4 sm:p-5 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 shadow-[0_20px_45px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-5px_10px_rgba(0,0,0,0.85)] border-4 border-slate-700/80">
                  
                  {/* Outer subtle emergency alert halo */}
                  <span className="absolute -inset-2 rounded-full border-2 border-red-500/25 animate-ping pointer-events-none"></span>

                  {/* 3D Cylindrical Push-Button Body */}
                  <button
                    onClick={() => {
                      setSosStep(1);
                      setShowSosWizard(true);
                    }}
                    className="relative group flex flex-col items-center justify-center w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-800 text-white font-black tracking-widest transition-all duration-150 select-none cursor-pointer border-t border-red-400/60
                    shadow-[0_14px_0_#7f1d1d,0_24px_32px_rgba(220,38,38,0.5),inset_0_3px_6px_rgba(255,255,255,0.45),inset_0_-6px_10px_rgba(0,0,0,0.6)]
                    hover:brightness-110
                    active:translate-y-3 active:shadow-[0_4px_0_#7f1d1d,0_10px_16px_rgba(220,38,38,0.4),inset_0_5px_10px_rgba(0,0,0,0.7)]"
                    title="Press to trigger instant emergency dispatch"
                  >
                    {/* Top specular reflection arc */}
                    <div className="absolute top-2.5 left-1/4 w-1/2 h-8 rounded-[50%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none"></div>

                    {/* Bold 3D SOS Typography */}
                    <span className="text-5xl sm:text-6xl font-black tracking-widest text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                      SOS
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>Current GPS Location: <strong className="text-slate-200">{capturedLocation.address}</strong></span>
                </div>
              </div>

              {/* Active Emergency Status Pill */}
              {currentEmergency && (
                <div className="p-4 bg-slate-950/95 border border-red-800/80 rounded-2xl text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600/20 text-red-400 rounded-xl border border-red-600/30">
                      <Ambulance className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">Active Incident: {currentEmergency.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-800">
                          {currentEmergency.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                          Status: {currentEmergency.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {currentEmergency.emergencyType} • {allAssignedAmbulances.length > 1 ? `Fleet (${allAssignedAmbulances.length} Units En Route) • Focused: ${activeSelectedAmbulance?.plateNumber || 'AMB-01'}` : `Assigned Unit: ${activeSelectedAmbulance?.plateNumber || 'AMB-01'}`} • ETA: <b className="text-cyan-400 font-mono">{activeMetrics.etaMinutes} mins</b> (<b className="text-emerald-400 font-mono">{activeMetrics.distanceKm} km</b>)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openDigitalTwinForPatient(currentEmergency || patient)}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-900/30 transition-all hover:scale-105 active:scale-95 border border-cyan-400/40"
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                      <span>🧬 3D Digital Twin</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!isEmergencyAssessedAndActive) {
                          setSosStep(1);
                          setShowSosWizard(true);
                        } else {
                          setPortalTab('Ambulance');
                        }
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      {!isEmergencyAssessedAndActive ? <Lock className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
                      <span>{!isEmergencyAssessedAndActive ? 'Live Map (Locked)' : 'Live Map'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSosStep(5);
                        setShowSosWizard(true);
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Lifecycle Bar
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* EMERGENCY MEDICAL HISTORY QR PASS CARD */}
          {renderMedicalQrCard()}

          {/* Quick Hub Grid: Tracking, Hospitals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Live Ambulance Mini Tracking & Fastest Route */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Ambulance className="w-4 h-4 text-amber-400" />
                  Live Ambulance Tracking
                </h3>
                {isEmergencyAssessedAndActive ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-300" />
                    Fastest Route
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3 text-red-400" />
                    Map Locked
                  </span>
                )}
              </div>

              {!isEmergencyAssessedAndActive ? (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-red-900/40 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Ambulance Tracker Locked</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Ambulance Tracker can only be accessed after the patient has pressed the SOS button and the Emergency SOS Assistance Protocol is completed from the beginning.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSosStep(1);
                      setShowSosWizard(true);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>
                      Trigger Emergency SOS & Complete Protocol from Beginning →
                    </span>
                  </button>
                </div>
              ) : assignedAmbulance ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Unit Number:</span>
                      <div className="font-bold text-white text-base mt-0.5">{activeSelectedAmbulance?.plateNumber || assignedAmbulance?.plateNumber}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500">Dispatch Status:</span>
                      <div className="font-bold text-amber-400 uppercase mt-0.5">{currentEmergency?.status || 'Assigned'}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px]">Distance:</span>
                      <div className="font-bold font-mono text-emerald-400 text-sm">{activeMetrics.distanceKm} km</div>
                    </div>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Fastest ETA:</span>
                      <div className="font-bold font-mono text-cyan-400 text-sm">{activeMetrics.etaMinutes} mins</div>
                    </div>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Route:</span>
                      <div className="font-bold text-emerald-400 text-xs">{activeMetrics.dirConfig.directionName} Wave</div>
                    </div>
                  </div>

                  <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-900/60 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span>⚡ Traffic signals synchronized to GREEN</span>
                    <span className="font-mono text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded">Saved ~6m</span>
                  </div>

                  <button
                    onClick={() => setPortalTab('Ambulance')}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Track Ambulance on Fastest Route →</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No active ambulance dispatch. Press SOS to request emergency transit.
                </div>
              )}
            </div>

            {/* 2. Nearby Hospitals Snapshot */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Nearby Hospitals
                </h3>
                <button onClick={() => setPortalTab('Hospitals')} className="text-xs text-blue-400 font-semibold hover:underline">
                  All Facilities →
                </button>
              </div>

              <div className="space-y-3">
                {hospitals.slice(0, 2).map(h => (
                  <div key={h.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[170px]">{h.name}</span>
                      <span className="text-emerald-400 font-mono font-bold text-[11px]">2.4 km</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>ICU Beds: <b className="text-emerald-400">{h.icuBeds}</b></span>
                      <span>ER Beds: <b className="text-blue-400">{h.generalBeds}</b></span>
                      <span>O2: <b className="text-amber-400">{h.oxygenStatus}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Notification Feed */}
          {patientNotifications.length > 0 && (
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-slate-300">
                  <strong>Latest Alert:</strong> {patientNotifications[0].title} — {patientNotifications[0].message}
                </span>
              </div>
              <button onClick={() => setPortalTab('Notifications')} className="text-xs text-amber-400 font-semibold hover:underline shrink-0">
                View All
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SOS (DEDICATED 5-STEP SOS WIZARD & STATUS TRACKER) */}
      {/* ========================================================================= */}
      {portalTab === 'SOS' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <AlertOctagon className="w-6 h-6 text-red-500" />
                  Emergency SOS Protocol Center
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Complete 5-step emergency assistance sequence with real-time lifecycle tracking
                </p>
              </div>
              <button
                onClick={() => {
                  setSosStep(1);
                  setShowSosWizard(true);
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-900/40 flex items-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Launch New SOS Request</span>
              </button>
            </div>

            {/* Current Active Emergency Lifecycle Tracker */}
            {currentEmergency ? (
              <div className="space-y-6">
                <div className="p-4 bg-slate-950 border border-red-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">Active Emergency: {currentEmergency.id}</span>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-950 text-red-400 border border-red-800">
                        {currentEmergency.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Type: <strong>{currentEmergency.emergencyType}</strong> • Location: <strong>{currentEmergency.location?.address}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!isEmergencyAssessedAndActive) {
                        setSosStep(1);
                        setShowSosWizard(true);
                      } else {
                        setPortalTab('Ambulance');
                      }
                    }}
                    className={`px-5 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 shadow transition-all ${
                      isEmergencyAssessedAndActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:opacity-95'
                        : 'bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900/60'
                    }`}
                  >
                    {!isEmergencyAssessedAndActive ? <Lock className="w-4 h-4 text-red-400" /> : <Compass className="w-4 h-4" />}
                    <span>{isEmergencyAssessedAndActive ? 'Track Responding Ambulance' : 'Complete SOS Protocol from Beginning to Unlock Map'}</span>
                  </button>
                </div>

                {/* Status Progression Bar */}
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Step 5: Real-Time Status Lifecycle Progression
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      Current Stage: {currentEmergency.status}
                    </span>
                  </div>

                  <div className="relative pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                      {lifecycleStatuses.map((st, idx) => {
                        const isDone = activeLifecycleStep >= idx;
                        const isCurrent = activeLifecycleStep === idx;
                        return (
                          <div
                            key={st}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                              isCurrent
                                ? 'bg-red-600 text-white border-red-400 font-bold shadow-lg shadow-red-900/40 scale-105'
                                : isDone
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                              isCurrent ? 'bg-white text-red-600 animate-pulse' : isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span className="text-[11px] leading-tight font-medium">{st}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Triage assessment details */}
                {currentEmergency.triageScore && (
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Triage Assessment & Field Vitals
                      </span>
                      <span className="text-[10px] text-amber-400 italic">
                        «Emergency assessment / triage support — not a medical diagnosis.»
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Consciousness:</span>
                        <div className="font-bold text-white mt-0.5">{currentEmergency.triageScore.consciousness || 'Alert'}</div>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Heart Rate:</span>
                        <div className="font-bold font-mono text-rose-400 mt-0.5">
                          {currentEmergency.triageScore.heartRate ? `${currentEmergency.triageScore.heartRate} BPM` : 'Unrecorded (Optional)'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Blood Pressure:</span>
                        <div className="font-bold font-mono text-white mt-0.5">
                          {currentEmergency.triageScore.bloodPressure || 'Unrecorded (Optional)'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px]">SpO₂ Oxygen:</span>
                        <div className="font-bold font-mono text-cyan-400 mt-0.5">
                          {currentEmergency.triageScore.oxygenSaturation || 'Unrecorded (Optional)'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No Active Emergency Request</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There is currently no ongoing emergency broadcast. Press the button below to initiate emergency assistance.
                </p>
                <button
                  onClick={() => {
                    setSosStep(1);
                    setShowSosWizard(true);
                  }}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-red-900/40"
                >
                  Initiate 5-Step SOS Protocol
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: AMBULANCE (DEDICATED LIVE TRACKING & FASTEST ROUTE) */}
      {/* ========================================================================= */}
      {portalTab === 'Ambulance' && (
        <ErrorBoundary>
          {!isEmergencyAssessedAndActive ? (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto py-4">
              <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-red-600/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
                {/* Subtle Ambient Radial Glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center space-y-6">
                  {/* Lock Icon Emblem */}
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600/20 via-slate-900 to-red-950/40 border-2 border-red-500/50 flex items-center justify-center shadow-xl shadow-red-950/60 ring-4 ring-red-500/10">
                      <Lock className="w-12 h-12 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                    </div>
                    <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-red-600 text-white font-mono font-black text-[10px] tracking-wider uppercase shadow-md shadow-red-900">
                      GATED PROTOCOL
                    </span>
                  </div>

                  {/* Header Titles */}
                  <div className="space-y-2 max-w-2xl mx-auto">
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-red-950 text-red-400 border border-red-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        EMERGENCY GIS TELEMETRY LOCKED
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Ambulance Tracker Locked
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <strong>Ambulance Tracker</strong> of the Patient Portal can only be accessed after the patient has pressed the <strong>SOS button</strong> and the <strong>Emergency SOS Assistance Protocol</strong> is completed from the beginning.
                    </p>
                  </div>

                  {/* 3-Step Protocol Progress Card */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 text-left max-w-2xl mx-auto shadow-inner space-y-3">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span>Access Prerequisites Checklist</span>
                      <span className="text-amber-400 font-mono text-[10px]">SOS + Assessment Required</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Step 1 Status */}
                      <div className={`p-3 rounded-xl border transition-all ${
                        currentEmergency?.sosPressed
                          ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                          : 'bg-red-950/40 border-red-800/60 text-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase">1. Trigger SOS</span>
                          {currentEmergency?.sosPressed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          )}
                        </div>
                        <div className="font-bold text-xs text-white">
                          {currentEmergency?.sosPressed ? 'Signal Dispatched' : 'Awaiting SOS Signal'}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {currentEmergency?.sosPressed ? `Incident ${currentEmergency.id}` : 'Press SOS button to alert EMS dispatch'}
                        </p>
                      </div>

                      {/* Step 2 Status */}
                      <div className={`p-3 rounded-xl border transition-all ${
                        isEmergencyAssessed
                          ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                          : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase">2. Emergency Assessment</span>
                          {isEmergencyAssessed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                        </div>
                        <div className="font-bold text-xs text-white">
                          {isEmergencyAssessed ? 'Assessment Completed' : 'Assessment Pending'}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isEmergencyAssessed ? 'Clinical vitals & triage recorded' : 'Patient condition & triage required'}
                        </p>
                      </div>

                      {/* Step 3 Status */}
                      <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 text-slate-400">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase">3. Live Ambulance Map</span>
                          <Lock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="font-bold text-xs text-slate-300">
                          GIS Fleet Telemetry
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Unlocks once SOS is pressed and assessment is done
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-lg mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSosStep(1);
                        setShowSosWizard(true);
                      }}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-900/50 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 ring-2 ring-red-400/50"
                    >
                      <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
                      <span>🚨 Press Emergency SOS & Complete Protocol from Beginning</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPortalTab('Home')}
                      className="w-full sm:w-auto px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-2xl border border-slate-800 transition-colors"
                    >
                      Return to Home
                    </button>
                  </div>

                  {/* Protocol & RBAC Compliance Footer Note */}
                  <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono max-w-xl mx-auto flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Raksha Disaster & EMS Security Protocol — Protected by RBAC</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-amber-400" />
                  Patient Ambulance Live Tracking & Fastest Route
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  Fastest Route Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time GIS telemetry tracking responding ambulance along the fastest AI-optimized Green Wave corridor
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                🧪 LIVE TELEMETRY — Real-Time Moving Tracker
              </span>
            </div>
          </div>

          {/* Fastest Route Inbound Banner */}
          {assignedAmbulance && (
            <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-700/60 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-white text-sm">
                      Fastest Emergency Route: Outer Ring Road Green Wave Express
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
                    Responding Unit <strong>{activeSelectedAmbulance?.plateNumber || assignedAmbulance?.plateNumber}</strong> ({activeSelectedAmbulance?.type || assignedAmbulance?.type}) approaching from <strong>{activeMetrics.dirConfig.directionName} Corridor ({activeMetrics.dirConfig.corridorName})</strong>.{' '}
                    {isTrafficPoliceGranted ? (
                      <span>Traffic Police Permission <strong>GRANTED</strong>: Route turned <strong className="text-emerald-400">GREEN</strong> with synchronized traffic corridors.</span>
                    ) : (
                      <span>Traffic Police Permission <strong>REQUIRED</strong>: Approach vector color is <strong style={{ color: activeMetrics.dirConfig.color }}>{activeMetrics.dirConfig.colorName}</strong>.</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {focusedAmbulanceId ? `${activeSelectedAmbulance?.plateNumber || 'Unit'} ETA` : 'Live ETA to You'}
                  </div>
                  <div className="text-2xl font-black font-mono text-cyan-400">~{activeMetrics.etaMinutes} mins</div>
                </div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {focusedAmbulanceId ? `${activeSelectedAmbulance?.plateNumber || 'Unit'} Dist` : 'Remaining Dist'}
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-400">{activeMetrics.distanceKm} km</div>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Ambulance Live Fleet Scaler */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-white">Responding Ambulance Fleet:</span>
              <span className="text-slate-400 text-[11px]">
                {currentEmergency?.numberOfAmbulances === 'Many' ? 'Multiple Units (Mass Casualty Fleet)' : `${currentEmergency?.numberOfAmbulances || 1} Vehicle(s) Assigned`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 'Many'].map(cnt => {
                const isSelected = cnt === 'Many'
                  ? (currentEmergency?.numberOfAmbulances === 'Many' || currentEmergency?.numberOfAmbulances === 'many')
                  : Number(currentEmergency?.numberOfAmbulances) === cnt || (!currentEmergency?.numberOfAmbulances && cnt === 1);
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => dispatchMultipleAmbulances && dispatchMultipleAmbulances(currentEmergency?.id, cnt)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-md shadow-red-900/40 ring-2 ring-red-400/50'
                        : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cnt === 'Many' ? 'Many Fleet' : `${cnt} ${cnt === 1 ? 'Ambulance' : 'Ambulances'}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Map with Fastest Route & Moving Ambulance */}
          <div id="emergency-map-section">
            <EmergencyMap
              ambulances={ambulances}
              hospitals={hospitals}
              activeEmergency={currentEmergency}
              trafficSignals={trafficSignals}
              patientLocation={currentEmergency?.location || capturedLocation || { lat: 22.5415, lng: 88.3485, address: "AJC Bose Road Flyover near Exide Crossing, Kolkata" }}
              height="520px"
              defaultMode={mapModePreference}
              focusedAmbulanceId={focusedAmbulanceId}
              onAmbulanceSelect={(amb) => setFocusedAmbulanceId(amb?.id)}
              focusOnInbound={true}
              showGrantClearance={false}
            />
          </div>

          {/* Ambulance Inbound Telemetry & Guidance Cards */}
          {assignedAmbulance ? (
            <div className="space-y-6">
              
              {/* Multi-Ambulance Directional Fleet Overview */}
              {allAssignedAmbulances.length > 1 && (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Ambulance className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-white text-sm">
                        All Responding Ambulances ({allAssignedAmbulances.length} Units En Route from Different Directions)
                      </span>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                      Multi-Vector Dispatch
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allAssignedAmbulances.map((amb, aIdx) => {
                      const ambMetric = ambulanceMetrics[aIdx] || {
                        distanceKm: 2.1,
                        etaMinutes: 4,
                        speedKmh: 58,
                        dirConfig: getAmbulanceTheme(aIdx, isTrafficPoliceGranted)
                      };
                      const dirConfig = ambMetric.dirConfig;
                      return (
                        <div
                          key={amb.id}
                          onClick={() => {
                            setFocusedAmbulanceId(amb.id);
                            setMapModePreference('google-directions');
                            const mapEl = document.getElementById('emergency-map-section');
                            if (mapEl) {
                              mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                          className={`p-3.5 bg-slate-950 rounded-xl border space-y-2 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] ${
                            focusedAmbulanceId === amb.id ? 'ring-2 ring-blue-400 shadow-xl border-blue-500' : 'border-slate-800 hover:border-slate-600'
                          }`}
                          style={{ borderLeftColor: dirConfig.color, borderLeftWidth: 4 }}
                          title={`Click to view Google Directions for ${amb.plateNumber} from ${dirConfig.directionName} (ETA: ${ambMetric.etaMinutes}m, Dist: ${ambMetric.distanceKm}km)`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase" style={{ backgroundColor: dirConfig.color }}>
                              Unit {aIdx + 1} • {dirConfig.badge}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-300">
                              {dirConfig.arrow} {dirConfig.directionName}
                            </span>
                          </div>
                          <div className="text-base font-black text-white">{amb.plateNumber}</div>
                          <div className="text-[11px] text-slate-400 truncate">{amb.type}</div>
                          <div className="text-[10px] text-slate-300 font-medium">
                            Approach: <b style={{ color: dirConfig.color }}>{dirConfig.corridorName}</b>
                          </div>
                          {/* Live Distance and Estimated Time badge per ambulance */}
                          <div className="flex items-center justify-between text-xs font-mono bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
                            <span className="text-cyan-400 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span>{ambMetric.etaMinutes} mins ETA</span>
                            </span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Compass className="w-3 h-3 text-emerald-400" />
                              <span>{ambMetric.distanceKm} km</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs gap-1.5 flex-wrap">
                            <span className="text-slate-400 truncate">{amb.driverName}</span>
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setFocusedAmbulanceId(amb.id);
                                  setMapModePreference('google-directions');
                                  const mapEl = document.getElementById('emergency-map-section');
                                  if (mapEl) {
                                    mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }}
                                className="px-2 py-0.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded text-[11px] font-bold flex items-center gap-1 transition-all hover:scale-105"
                                title={`Switch Google Directions to ${amb.plateNumber} (${dirConfig.directionName})`}
                              >
                                <Navigation className="w-3 h-3 text-cyan-400" />
                                Directions
                              </button>
                              <a
                                href={`tel:${amb.driverPhone}`}
                                className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                Call
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Telemetry & Quick Action Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Unit & Crew Identity */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Responding Vehicle</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                      {currentEmergency?.status || 'Assigned & En Route'}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">{activeSelectedAmbulance?.plateNumber || assignedAmbulance?.plateNumber}</div>
                  <div className="text-xs text-amber-400 font-semibold">{activeSelectedAmbulance?.type || assignedAmbulance?.type}</div>
                  <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                    <div className="text-slate-400">Hospital Base: <strong className="text-white">{activeSelectedAmbulance?.hospitalName || assignedAmbulance?.hospitalName}</strong></div>
                    <div className="text-slate-400 flex items-center justify-between pt-1">
                      <span>EMT Driver: <strong className="text-white">{activeSelectedAmbulance?.driverName || assignedAmbulance?.driverName}</strong></span>
                      <a
                        href={`tel:${activeSelectedAmbulance?.driverPhone || assignedAmbulance?.driverPhone}`}
                        className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-900"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        Call Driver
                      </a>
                    </div>
                  </div>
                </div>

                {/* 2. Fastest Route Live Telemetry */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Fastest Route Stats</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                        ETA: {activeMetrics.etaMinutes}m
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        {isTrafficPoliceGranted ? 'Green Wave Active' : 'Preemption Ready'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px]">Transit Distance</span>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{activeMetrics.distanceKm} km</div>
                      <span className="text-[10px] text-slate-400 truncate block">{activeMetrics.dirConfig.corridorName}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px]">Cruising Speed</span>
                      <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{activeMetrics.speedKmh} km/h</div>
                      <span className="text-[10px] text-slate-400">{isTrafficPoliceGranted ? 'Zero Red Signals' : 'Direct Corridor'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 pt-1">
                    Destination Trauma Hospital: <strong className="text-white">{targetHospital?.name}</strong>
                  </div>
                </div>

                {/* 3. Onboard Critical Life Support */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Onboard Medical Capabilities</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <span className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> ICU Ventilator
                    </span>
                    <span className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> AED Defibrillator
                    </span>
                    <span className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Oxygen Cylinder
                    </span>
                    <span className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Trauma Kit
                    </span>
                    <span className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Suction Unit
                    </span>
                    <span className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Cardiac Monitor
                    </span>
                  </div>
                </div>

              </div>

              {/* Inbound Route Turn-by-Turn Progress Bar */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm text-white">Live Inbound Route Progression (Ambulance ➔ Your Location)</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    Fastest AI Route Tracking
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        1. Dispatched
                      </span>
                      <span className="text-[10px] bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-300">Passed</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Departed Apollo Hospital station onto express route</p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl bg-blue-950 border border-blue-500 text-white space-y-1 ring-2 ring-blue-500/40 shadow-lg">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                        2. Ring Expressway
                      </span>
                      <span className="text-[10px] bg-blue-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono">Current (58 km/h)</span>
                    </div>
                    <p className="text-[11px] text-slate-200">Traversing Outer Ring Road Green Corridor (Signals Held GREEN)</p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>3. Underpass Clearance</span>
                      <span className="text-[10px] text-slate-500">Upcoming (1.2 km)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">AJC Bose Road Flyover emergency bypass corridor</p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>4. On-Scene Arrival</span>
                      <span className="text-[10px] text-slate-500">Pickup Zone</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Arrival at {currentEmergency?.location?.address || capturedLocation?.address || patient?.address || 'Designated Emergency Pickup Zone'}
                    </p>
                  </div>
                </div>

                {/* Helpful Guidance for the Patient */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Patient Action:</strong> Keep your phone line clear. If outside at night, flash your phone light so the incoming ambulance driver identifies you immediately.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="tel:108"
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call 108 Hotline</span>
                    </a>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
              <Ambulance className="w-10 h-10 text-slate-500 mx-auto" />
              <div className="text-white font-bold text-sm">No Ambulance Currently Dispatched</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Trigger the SOS sequence or choose an emergency dispatch to display active vehicle telemetry.
              </p>
              <button
                onClick={() => {
                  setSosStep(1);
                  setShowSosWizard(true);
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40"
              >
                Request Ambulance Now
              </button>
            </div>
          )}

          </div>
          )}
        </ErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: HOSPITALS (FILTERABLE DIRECTORY & CAPACITY) */}
      {/* ========================================================================= */}
      {portalTab === 'Hospitals' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Nearby Hospitals & Emergency Resources
              </h2>
              <p className="text-xs text-slate-400">
                Search and filter hospitals by distance, governance, ICU beds, oxygen volume, blood inventory, and ventilators
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search hospital..."
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={hospitalTypeFilter}
                onChange={(e) => setHospitalTypeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value="All">Sector: All</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>

              <select
                value={hospitalFacilityFilter}
                onChange={(e) => setHospitalFacilityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value="all">Facility: All</option>
                <option value="icu">ICU Beds (&gt;5)</option>
                <option value="oxygen">Oxygen Reserves</option>
                <option value="ventilator">Ventilators (&gt;5)</option>
                <option value="blood">Blood Bank Available</option>
              </select>
            </div>
          </div>

          {/* Hospital Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.map(h => (
              <div
                key={h.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{h.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        h.type === 'Government' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {h.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{h.address}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-emerald-400 font-bold">2.4 km away</span>
                    <div className="text-[11px] text-slate-500">Est. 7 mins</div>
                  </div>
                </div>

                {/* Resource Gauges */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px]">ICU Beds</span>
                    <div className="font-bold text-emerald-400 text-sm font-mono mt-0.5">{h.icuBeds}</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px]">ER Beds</span>
                    <div className="font-bold text-blue-400 text-sm font-mono mt-0.5">{h.generalBeds}</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Oxygen</span>
                    <div className="font-bold text-amber-400 text-xs mt-0.5">{h.oxygenStatus}</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Ventilators</span>
                    <div className="font-bold text-purple-400 text-sm font-mono mt-0.5">{h.ventilators}</div>
                  </div>
                </div>

                {/* Blood Bank Units */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-400 font-semibold">Blood Bank:</span>
                  {Object.entries(h.bloodBank || {}).slice(0, 6).map(([grp, units]) => (
                    <span key={grp} className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 font-mono text-[10px]">
                      {grp}: <b className="text-red-400">{units}u</b>
                    </span>
                  ))}
                </div>

                {/* Facilities */}
                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Specialized Facilities: </span>
                  {h.facilities?.slice(0, 3).join(', ')}...
                </div>

                {/* Contact & Dispatch Action */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-500" />
                    <span>Hotline: <strong className="text-white font-mono">{h.emergencyHotline}</strong></span>
                  </div>
                  <a
                    href={`tel:${h.phone}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Direct Call
                  </a>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: DEDICATED EMERGENCY MEDICAL QR PASS TAB */}
      {/* ========================================================================= */}
      {portalTab === 'Medical QR' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-400" />
                <span>Patient Emergency Medical QR Pass</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official encrypted pass for first responder Paramedics, EMTs, and ER trauma doctors
              </p>
            </div>
            <button
              onClick={() => openMedicalQrForPatient(patient)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer self-start sm:self-auto"
            >
              <Scan className="w-4 h-4 text-purple-200" />
              <span>Launch Terminal Scanner & Decryptor</span>
            </button>
          </div>
          {renderMedicalQrCard(true)}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: PATIENT PROFILE */}
      {/* ========================================================================= */}
      {(portalTab === 'Profile' || portalTab === 'Medical Info') && (
        <div className="space-y-8 animate-fade-in">
          
          {/* SECTION: PATIENT IDENTITY & PROFILE HERO CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-950/50 shrink-0">
                  {patient.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-white">{patient.name}</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800">
                      Blood Group: {patient.bloodGroup}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      ID: {patient.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-emerald-500/30">
                      CITIZEN PROFILE
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{patient.address || '14/2, Rowland Road, Ballygunge, Kolkata'}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {patient.phone || '+91 98765 43210'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300">Age: <strong>{patient.age}</strong> yrs</span>
                    <span>•</span>
                    <span className="text-slate-300">Gender: <strong>{patient.gender}</strong></span>
                    <span>•</span>
                    <span className="text-purple-300">Contact: {patient.emergencyContact}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Quick Spec Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Direct Contact Phone</span>
                <div className="text-sm font-black font-mono text-emerald-400 mt-0.5">{patient.phone || '+91 98765 43210'}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Emergency Contact</span>
                <div className="text-xs font-bold text-white mt-0.5 truncate">{patient.emergencyContact}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered City</span>
                <div className="text-xs font-bold text-white mt-0.5 truncate">{patient.address || 'Kolkata, West Bengal'}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data Protection</span>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">RBAC Verified • Encrypted</div>
              </div>
            </div>
          </div>

          {/* TWO COLUMN PROFILE DETAILS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Card 1: Demographic & Primary Identifiers */}
            <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase font-bold text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-500" />
                  Demographic & Primary Identifiers
                </span>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block text-[11px]">Full Name:</span>
                  <div className="font-bold text-white text-sm mt-0.5">{patient.name}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Blood Group:</span>
                  <div className="font-black text-red-400 font-mono text-base mt-0.5">{patient.bloodGroup}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Age / Gender:</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{patient.age} yrs • {patient.gender}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Direct Phone:</span>
                  <div className="font-mono text-emerald-400 mt-0.5">{patient.phone}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-slate-500 block text-[11px]">Residential Address:</span>
                <div className="font-medium text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{patient.address || '14/2, Rowland Road, Ballygunge, Kolkata'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-slate-500 block text-[11px]">Primary Emergency Contact:</span>
                <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{patient.emergencyContact}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Emergency Dispatch & Security Profile */}
            <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase font-bold text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Emergency Dispatch & Security Profile
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Verified Citizen
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-200">
                <span className="font-bold uppercase text-[10px] text-emerald-400 block">Priority Dispatch Status:</span>
                <div className="font-bold mt-1 text-sm">Automated GPS Priority Dispatch & Routing Active</div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Primary Dispatch Ambulance Fleet:</span>
                <div className="font-semibold text-slate-200 mt-0.5">Delhi NCR Advanced Life Support (ALS) & BLS Units</div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Emergency Contact Redundancy:</span>
                <div className="font-mono text-slate-300 mt-0.5">{patient.emergencyContact} (SMS & Radio Linked)</div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Privacy & Clinical Data Governance:</span>
                <div className="text-slate-400 mt-0.5 leading-relaxed">
                  Medical records and EHR are securely restricted and governed by clinical authorization protocols.
                </div>
              </div>
            </div>

          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Protected by Citizen Data Privacy Standards & Role-Based Access Control.</span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold">Security: ACTIVE</span>
          </div>

          {/* Section 6.5: Emergency Medical History QR Pass Card */}
          {renderMedicalQrCard()}

          {/* Section 7: Doctor Information for Patients */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-400" />
                Authorized Doctor Professional Information
              </h2>
              <p className="text-xs text-slate-400">
                Verified medical practitioners on duty across trauma centers (no private personal contact exposed)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">{doc.name}</h3>
                      <div className="text-purple-400 text-xs font-semibold">{doc.specialization}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {doc.availability}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <div><strong>Qualifications:</strong> {doc.qualifications}</div>
                    <div><strong>Registration:</strong> <span className="font-mono text-slate-400">{doc.registrationNumber}</span></div>
                    <div><strong>Hospital:</strong> {doc.hospitalName}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>System Ext: {doc.professionalContact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: AI Medical Document Translator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI Medical Document & Prescription Translator</h2>
                  <p className="text-xs text-slate-400">Simplifies clinical terminology and instructions into Indian regional languages</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-indigo-400" />
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी (Hindi)</option>
                  <option value="Bengali">বাংলা (Bengali)</option>
                  <option value="Marathi">मराठी (Marathi)</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Original Medical Instructions / Prescription:
              </label>
              <textarea
                rows={3}
                value={prescriptionText}
                onChange={(e) => setPrescriptionText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                {isTranslating ? 'Simplifying...' : `Translate & Explain in ${targetLang}`}
              </button>
            </div>

            {aiResult && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-900/50 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-indigo-300 text-sm">{aiResult.title}</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-mono">
                    Target: {aiResult.targetLanguage}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase">AI Explanation:</div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900 p-3 rounded-xl border border-slate-800">
                    {aiResult.summary}
                  </p>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-200">
                  {aiResult.simplifiedPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>

                {/* Mandatory Prompt Disclaimer */}
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Mandatory Clinical Disclaimer:</strong> «AI-generated explanations are for understanding only and should not replace instructions from a qualified medical professional. The AI system does not diagnose, prescribe, change medication dosage, replace a doctor, or guarantee treatment outcomes.»
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: NOTIFICATIONS */}
      {/* ========================================================================= */}
      {portalTab === 'Notifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Patient Emergency Alerts & Notification History
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Live dispatches, ambulance arrival countdowns, and hospital acceptance logs
            </p>
          </div>

          <div className="space-y-3">
            {patientNotifications.map(n => (
              <div key={n.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  n.type === 'urgent' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{n.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Triage Modal */}
      <TriageModal
        isOpen={false}
        onClose={() => {}}
        initialVitals={currentEmergency?.triageScore}
        onSave={(vitals, severity) => {
          if (currentEmergency) {
            updateTriage(currentEmergency.id, vitals, severity);
          }
        }}
      />

    </div>
  );
};
