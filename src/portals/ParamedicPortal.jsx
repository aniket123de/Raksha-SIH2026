import React, { useState, useEffect, useRef } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { isEmtUser } from '../utils/userRoleUtils';
import { DigitalTwin3D } from '../components/DigitalTwin3D';
import { HeartRateEcgGraph } from '../components/HeartRateEcgGraph';
import {
  Activity,
  Heart,
  Brain,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  PhoneCall,
  Camera,
  RefreshCw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ShieldAlert,
  Pill,
  Stethoscope,
  Syringe,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  User,
  Clock,
  Sparkles,
  Plus,
  Radio,
  Layers,
  Zap,
  Thermometer,
  Wind,
  Droplet,
  Send,
  Share2,
  Monitor,
  AlertOctagon,
  Truck,
  Check,
  Eye,
  Info,
  Award,
  ChevronRight,
  ShieldCheck,
  Edit3,
  Save,
  BookOpen,
  FileCheck,
  CheckSquare,
  Bot,
  QrCode,
  Scan
} from 'lucide-react';
import { PreTreatmentEquipmentChecklist } from '../components/PreTreatmentEquipmentChecklist';
import { ParamedicAIAssistant } from '../components/ParamedicAIAssistant';

export const ParamedicPortal = () => {
  const {
    currentUser,
    portalTab,
    setPortalTab,
    activeEmergencies,
    patients,
    doctors,
    ambulances,
    hospitals,
    getDigitalTwin,
    digitalTwinRevision,
    updateDigitalTwinVitals,
    updateDigitalTwinStatus,
    addDigitalTwinTreatment,
    addDigitalTwinMedication,
    openDigitalTwinForPatient,
    openMedicalQrForPatient,
    logAudit,
    addNotification,
    teleDirectives,
    addTeleDirective,
    updateTeleDirectiveStatus
  } = useEmergency();

  // Paramedic vs EMT Role Determination
  const isEmt = isEmtUser(currentUser);

  // Selected Emergency Case
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(
    activeEmergencies?.[0]?.id || 'EMG-8821'
  );

  const currentEmergency = activeEmergencies?.find(e => e.id === selectedEmergencyId) || activeEmergencies?.[0] || {
    id: 'EMG-8821',
    patientId: 'PAT-05',
    patientName: 'Baljeet Kaur',
    patientAge: 63,
    patientGender: 'Female',
    patientBloodGroup: 'O-',
    emergencyType: 'Accident',
    severity: 'Critical',
    triageScore: {
      consciousness: 'Voice Responsive',
      abilityToWalk: 'No (Severe leg trauma)',
      breathing: 'Rapid / Labored (28 bpm)',
      heartRate: 118,
      bloodPressure: '95/60 mmHg',
      oxygenSaturation: '91%',
      temperature: '37.1 °C'
    },
    location: {
      address: 'AJC Bose Road near Rabindra Sadan, Kolkata'
    }
  };

  const currentPatient = patients?.find(p => p.id === currentEmergency.patientId) || {
    id: currentEmergency.patientId || 'PAT-05',
    name: currentEmergency.patientName || 'Baljeet Kaur',
    age: currentEmergency.patientAge || 63,
    gender: currentEmergency.patientGender || 'Female',
    bloodGroup: currentEmergency.patientBloodGroup || 'O-',
    phone: '+91 98111 22334',
    emergencyContact: 'Gurpreet Singh (Son) - +91 98111 22335',
    medicalHistory: 'Hypertension (6 yrs), Type 2 Diabetes, mild coronary artery disease',
    allergies: 'Penicillin (Severe Anaphylaxis), Aspirin (Gastric bleeding)',
    existingConditions: 'Cardiomegaly, Prior TIA (2021)',
    currentMedications: 'Amlodipine 5mg, Metformin 500mg, Atorvastatin 20mg'
  };

  // Live Digital Twin object
  const twin = getDigitalTwin(currentEmergency);

  // Selected Anatomical Region
  const [selectedRegion, setSelectedRegion] = useState('heart');
  const [is3dFullscreen, setIs3dFullscreen] = useState(false);

  // Live Vitals Calibration State
  const [liveVitals, setLiveVitals] = useState({
    heartRate: twin?.vitals?.heartRate !== undefined ? Number(twin.vitals.heartRate) : 118,
    spo2: twin?.vitals?.spo2 !== undefined ? Number(twin.vitals.spo2) : 91,
    systolic: 95,
    diastolic: 60,
    respiratoryRate: twin?.vitals?.respiratoryRate !== undefined ? Number(twin.vitals.respiratoryRate) : 26,
    temperature: twin?.vitals?.temperature !== undefined ? Number(twin.vitals.temperature) : 37.1,
    consciousness: twin?.consciousnessStatus || 'Voice Responsive',
    mobility: twin?.abilityToWalk || 'Immobilized on Spine Board'
  });

  // Sync state if twin vitals change
  useEffect(() => {
    if (twin?.vitals) {
      const bpParts = (twin.vitals.bloodPressure || '95/60').split('/');
      setLiveVitals(prev => ({
        ...prev,
        heartRate: twin.vitals.heartRate !== undefined ? Number(twin.vitals.heartRate) : prev.heartRate,
        spo2: twin.vitals.spo2 !== undefined ? Number(twin.vitals.spo2) : prev.spo2,
        respiratoryRate: twin.vitals.respiratoryRate !== undefined ? Number(twin.vitals.respiratoryRate) : prev.respiratoryRate,
        temperature: twin.vitals.temperature !== undefined ? Number(twin.vitals.temperature) : prev.temperature,
        systolic: bpParts[0] ? Number(bpParts[0]) : prev.systolic,
        diastolic: bpParts[1] ? Number(bpParts[1]) : prev.diastolic,
        consciousness: twin.consciousnessStatus || prev.consciousness,
        mobility: twin.abilityToWalk || prev.mobility
      }));
    }
  }, [digitalTwinRevision, twin?.id]);

  // Handle live vitals update
  const handleVitalChange = (field, value) => {
    const next = { ...liveVitals, [field]: value };
    setLiveVitals(next);

    const bpString = `${next.systolic}/${next.diastolic} mmHg`;
    updateDigitalTwinVitals(
      twin?.id || currentEmergency.id,
      {
        heartRate: Number(next.heartRate),
        spo2: Number(next.spo2),
        bloodPressure: bpString,
        respiratoryRate: Number(next.respiratoryRate),
        temperature: Number(next.temperature)
      },
      'Paramedic Field Telemetry',
      currentUser?.name || (isEmt ? 'EMT Amit Verma' : 'Paramedic Rajesh Sharma')
    );
  };

  // Treatment Logger State
  const [treatmentAction, setTreatmentAction] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');

  // Medication Logger State
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medRoute, setMedRoute] = useState('IV');
  const [medIndication, setMedIndication] = useState('');

  // Video Conference State
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors?.[0]?.id || 'DOC-01');
  const [callStatus, setCallStatus] = useState('connected'); // 'idle' | 'calling' | 'connected' | 'ended'
  const [callDuration, setCallDuration] = useState(142); // seconds
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [cameraAngle, setCameraAngle] = useState('patient'); // 'emt' | 'patient' | 'cabin'
  const [doctorWaveform, setDoctorWaveform] = useState([20, 45, 75, 30, 85, 40, 60, 90, 50, 35, 70, 25]);
  const [isTwinSharedInCall, setIsTwinSharedInCall] = useState(true);
  const localVideoRef = useRef(null);

  // Full Screen Video Call State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const videoConferenceContainerRef = useRef(null);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => {
      const next = !prev;
      if (next && videoConferenceContainerRef.current) {
        if (videoConferenceContainerRef.current.requestFullscreen) {
          videoConferenceContainerRef.current.requestFullscreen().catch(() => {});
        }
      } else if (!next && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      return next;
    });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Doctors list
  const activeDoctor = doctors?.find(d => d.id === selectedDoctorId) || doctors?.[0] || {
    id: 'DOC-01',
    name: 'Dr. Ananya Sen',
    qualifications: 'MBBS, MS (Trauma Surgery), FACS',
    specialization: 'Chief Trauma & Critical Resuscitation',
    hospitalName: 'Apollo Emergency & Critical Care',
    availability: 'On Duty - Trauma Bay 1'
  };

  // Tele-Doctor Clinical Directives
  const [doctorDirectives, setDoctorDirectives] = useState([
    {
      id: 'DIR-1',
      time: '2 mins ago',
      order: 'Administer 1g IV Tranexamic Acid (TXA) over 10 min for suspected pelvic internal bleeding.',
      status: 'Executed',
      priority: 'high'
    },
    {
      id: 'DIR-2',
      time: 'Just now',
      order: 'Maintain High-Flow O2 via non-rebreather at 15 L/min. Target SpO2 ≥ 94%.',
      status: 'Active',
      priority: 'urgent'
    },
    {
      id: 'DIR-3',
      time: 'Awaiting Ack',
      order: 'Infuse 500 mL warm Normal Saline under pressure; prepare Trauma Bay 1 for immediate ultrasound (FAST).',
      status: 'Pending',
      priority: 'urgent'
    }
  ]);

  // Paramedic / EMT Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || (isEmt ? 'EMT Amit Verma (Emergency Medical Technician)' : 'Paramedic Rajesh Sharma (ALS Lead)'),
    phone: currentUser?.phone || (isEmt ? '+91 98103 44556' : '+91 98102 33445'),
    yearsOfExperience: currentUser?.yearsOfExperience || (isEmt ? 4 : 9),
    experienceDetails: currentUser?.experienceDetails || (isEmt ? '4+ Years in Emergency Medical Technician (EMT-B / EMT-I) Field Response & Resuscitation' : '9+ Years in Pre-hospital Emergency Medical Services & Polytrauma Care'),
    qualifications: currentUser?.qualifications || (isEmt ? 'Diploma in Emergency Medical Services (EMS), Advanced First Responder Certification' : 'B.Sc. in Emergency Medical Technology, Post-Graduate Diploma in Critical Care & Trauma Management'),
    certificationsAndLicenses: currentUser?.certificationsAndLicenses || (isEmt ? [
      'National EMT Registry License #DL-EMT-2021-44109 (Valid 2029)',
      'AHA Basic Life Support (BLS) for Healthcare Providers',
      'Prehospital Trauma Life Support (PHTLS) - EMT Provider',
      'Emergency Vehicle Operations & Defensive Driving Certified'
    ] : [
      'National Emergency Medical Council License #DL-EMT-2017-88492 (Valid 2029)',
      'AHA Advanced Cardiovascular Life Support (ACLS) Certified',
      'International Trauma Life Support (ITLS) - Advanced Provider',
      'Prehospital Trauma Life Support (PHTLS) Certified',
      'Pediatric Advanced Life Support (PALS) Certified',
      'Basic Disaster Life Support (BDLS) & HazMat Awareness'
    ]),
    clinicalSkills: currentUser?.clinicalSkills || (isEmt ? [
      'Rapid Primary Trauma Assessment & START Triage Scoring',
      'Airway Adjuncts (OPA / NPA) & High-Flow Oxygenation Therapy',
      'Bag-Valve-Mask (BVM) Resuscitation & Suctioning',
      'C-Spine Immobilization, Cervical Collars & Long Spine Board Handling',
      'Automated External Defibrillator (AED) Operations & CPR',
      'Pressure Bandaging, Hemostatic Gauze & Combat Tourniquet (CAT)'
    ] : [
      'Advanced Airway Management & Endotracheal Intubation',
      'IV Cannulation (14G/16G) & Rapid Intraosseous (IO) Access',
      '12-Lead ECG Interpretation & Acute STEMI Recognition',
      'Manual & Biphasic Defibrillation / Synchronized Cardioversion',
      'Emergency Needle Thoracostomy & Chest Decompression',
      'Combat Tourniquet (CAT) & Hemostatic Wound Packing',
      'Pelvic Circumferential Compression & Traction Splinting',
      'Pre-hospital Resuscitation Pharmacology Administration',
      'Bag-Valve-Mask (BVM) Synchronized Ventilation & PEEP Care',
      'Telemedicine Encrypted Video Stream & Biometric Telemetry Operations'
    ])
  });

  const [editForm, setEditForm] = useState({ ...profileData });
  const [newCert, setNewCert] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Sync profile when currentUser changes (e.g. Paramedic vs EMT login)
  useEffect(() => {
    if (currentUser) {
      const isEmtCurr = isEmtUser(currentUser);
      const synced = {
        name: currentUser.name || (isEmtCurr ? 'EMT Amit Verma (Emergency Medical Technician)' : 'Paramedic Rajesh Sharma (ALS Lead)'),
        phone: currentUser.phone || (isEmtCurr ? '+91 98103 44556' : '+91 98102 33445'),
        yearsOfExperience: currentUser.yearsOfExperience || (isEmtCurr ? 4 : 9),
        experienceDetails: currentUser.experienceDetails || (isEmtCurr ? '4+ Years in Emergency Medical Technician (EMT-B / EMT-I) Field Response & Resuscitation' : '9+ Years in Pre-hospital Emergency Medical Services & Polytrauma Care'),
        qualifications: currentUser.qualifications || (isEmtCurr ? 'Diploma in Emergency Medical Services (EMS), Advanced First Responder Certification' : 'B.Sc. in Emergency Medical Technology, Post-Graduate Diploma in Critical Care & Trauma Management'),
        certificationsAndLicenses: currentUser.certificationsAndLicenses || (isEmtCurr ? [
          'National EMT Registry License #DL-EMT-2021-44109 (Valid 2029)',
          'AHA Basic Life Support (BLS) for Healthcare Providers',
          'Prehospital Trauma Life Support (PHTLS) - EMT Provider',
          'Emergency Vehicle Operations & Defensive Driving Certified'
        ] : [
          'National Emergency Medical Council License #DL-EMT-2017-88492 (Valid 2029)',
          'AHA Advanced Cardiovascular Life Support (ACLS) Certified',
          'International Trauma Life Support (ITLS) - Advanced Provider',
          'Prehospital Trauma Life Support (PHTLS) Certified',
          'Pediatric Advanced Life Support (PALS) Certified',
          'Basic Disaster Life Support (BDLS) & HazMat Awareness'
        ]),
        clinicalSkills: currentUser.clinicalSkills || (isEmtCurr ? [
          'Rapid Primary Trauma Assessment & START Triage Scoring',
          'Airway Adjuncts (OPA / NPA) & High-Flow Oxygenation Therapy',
          'Bag-Valve-Mask (BVM) Resuscitation & Suctioning',
          'C-Spine Immobilization, Cervical Collars & Long Spine Board Handling',
          'Automated External Defibrillator (AED) Operations & CPR',
          'Pressure Bandaging, Hemostatic Gauze & Combat Tourniquet (CAT)'
        ] : [
          'Advanced Airway Management & Endotracheal Intubation',
          'IV Cannulation (14G/16G) & Rapid Intraosseous (IO) Access',
          '12-Lead ECG Interpretation & Acute STEMI Recognition',
          'Manual & Biphasic Defibrillation / Synchronized Cardioversion',
          'Emergency Needle Thoracostomy & Chest Decompression',
          'Combat Tourniquet (CAT) & Hemostatic Wound Packing'
        ])
      };
      setProfileData(synced);
      setEditForm(synced);
    }
  }, [currentUser?.id, currentUser?.username, currentUser?.designation, currentUser?.name]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileData({ ...editForm });
    setIsEditingProfile(false);
    addNotification(
      isEmt ? 'EMT Profile Updated' : 'Paramedic Profile Updated',
      `${isEmt ? 'EMT' : 'Paramedic'} credentials and clinical competencies updated successfully.`,
      'success',
      'all'
    );
  };

  const handleAddCert = () => {
    if (!newCert.trim()) return;
    setEditForm(prev => ({
      ...prev,
      certificationsAndLicenses: [...prev.certificationsAndLicenses, newCert.trim()]
    }));
    setNewCert('');
  };

  const handleRemoveCert = (index) => {
    setEditForm(prev => ({
      ...prev,
      certificationsAndLicenses: prev.certificationsAndLicenses.filter((_, i) => i !== index)
    }));
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setEditForm(prev => ({
      ...prev,
      clinicalSkills: [...prev.clinicalSkills, newSkill.trim()]
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (index) => {
    setEditForm(prev => ({
      ...prev,
      clinicalSkills: prev.clinicalSkills.filter((_, i) => i !== index)
    }));
  };

  // Call timer effect
  useEffect(() => {
    let timer;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
        // Animate voice audio bars
        setDoctorWaveform(prev => prev.map(() => Math.floor(Math.random() * 75) + 15));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // Try local webcam for realism
  useEffect(() => {
    let stream = null;
    if (callStatus === 'connected' && !isVideoOff && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Camera permission denied or not available; fallback to graphic
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [callStatus, isVideoOff]);

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExecuteDirective = (directiveId) => {
    if (updateTeleDirectiveStatus) {
      updateTeleDirectiveStatus(directiveId, 'Executed');
    }
    setDoctorDirectives(prev => prev.map(d => {
      if (d.id === directiveId) {
        return { ...d, status: 'Executed' };
      }
      return d;
    }));

    const directive = (teleDirectives || doctorDirectives).find(d => d.id === directiveId);
    if (directive) {
      addDigitalTwinTreatment(
        twin?.id || currentEmergency.id,
        {
          action: `Physician Order Executed: ${directive.order.substring(0, 50)}...`,
          notes: `Authorized by ${activeDoctor.name} via Tele-Doctor Video Conference.`,
          status: 'Completed'
        },
        'Paramedic / EMT'
      );
      addNotification('Tele-Doctor Order Executed', `Order executed: ${directive.order.slice(0, 45)}...`, 'success', 'all');
    }
  };

  const handleRecordTreatment = (e) => {
    e.preventDefault();
    if (!treatmentAction.trim()) return;

    addDigitalTwinTreatment(
      twin?.id || currentEmergency.id,
      {
        action: treatmentAction,
        notes: treatmentNotes || 'Paramedic Field Protocol',
        status: 'Completed'
      },
      'Paramedic'
    );
    setTreatmentAction('');
    setTreatmentNotes('');
  };

  const handleAdministerMedication = (e) => {
    e.preventDefault();
    if (!medName.trim() || !medDose.trim()) return;

    addDigitalTwinMedication(
      twin?.id || currentEmergency.id,
      {
        medicine: medName,
        dose: `${medDose} (${medRoute})`,
        indication: medIndication || 'Emergency Field Resuscitation'
      },
      'Paramedic'
    );
    setMedName('');
    setMedDose('');
    setMedIndication('');
  };

  // Shock index calculation (HR / SBP)
  const shockIndex = (Number(liveVitals.heartRate) / (Number(liveVitals.systolic) || 1)).toFixed(2);
  const isShockHigh = Number(shockIndex) >= 1.0;

  return (
    <div className="space-y-6">

      {/* TOP EMERGENCY INCIDENT COMMAND BAR */}
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20 shrink-0">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {isEmt ? 'Emergency Medical Technician (EMT) Console' : 'Paramedic Advanced Life Support Console'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-600/50 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{isEmt ? 'AMBULANCE DL-01-EA-1082 (BLS) ACTIVE' : 'AMBULANCE DL-01-EA-1081 (ALS) ACTIVE'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Responder: <strong>{currentUser?.name || (isEmt ? 'EMT Amit Verma (Emergency Medical Technician)' : 'Paramedic Rajesh Sharma (ALS Lead)')}</strong></span>
                <span>•</span>
                <span>Role: <strong className="text-teal-300 font-mono">{currentUser?.designation || (isEmt ? 'Emergency Medical Technician' : 'Lead Trauma Paramedic')}</strong></span>
                <span>•</span>
                <span>En Route to: <strong>Apollo ER Bay 1</strong></span>
                <span>•</span>
                <span className="text-amber-400 font-mono font-bold">ETA: 6 mins (Code 3 Transit)</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            {portalTab === 'Video Call' && (
              <button
                onClick={() => setCallStatus(callStatus === 'connected' ? 'ended' : 'connected')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  callStatus === 'connected'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse'
                }`}
              >
                {callStatus === 'connected' ? <PhoneOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                <span>
                  {callStatus === 'connected'
                    ? `End Doctor Call (${formatDuration(callDuration)})`
                    : 'Call Trauma Doctor'}
                </span>
              </button>
            )}

            {(portalTab === 'Digital Twin' || portalTab === 'Dashboard') && (
              <button
                onClick={() => openDigitalTwinForPatient(currentEmergency)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-2 shadow transition-all cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Launch 3D Hologram Modal</span>
              </button>
            )}

            <button
              onClick={() => setPortalTab(portalTab === 'AI Assistant' ? 'Digital Twin' : 'AI Assistant')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                portalTab === 'AI Assistant'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black shadow-indigo-500/30 ring-2 ring-indigo-400'
                  : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50'
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>{portalTab === 'AI Assistant' ? 'Back to Patient' : 'AI Stabilization Guide'}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500 text-white animate-pulse">VOICE AI</span>
            </button>

            <button
              onClick={() => setPortalTab(portalTab === 'Equipment' ? 'Digital Twin' : 'Equipment')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                portalTab === 'Equipment'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-amber-400/30'
                  : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span>{portalTab === 'Equipment' ? 'Back to Patient' : 'Equipment Checklist'}</span>
            </button>

            <button
              onClick={() => openMedicalQrForPatient(currentPatient || currentEmergency)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/50 hover:scale-105 active:scale-95"
              title="Scan or Decrypt Patient Medical History QR Pass"
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>Scan Medical QR</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-600 text-white">EHR</span>
            </button>
          </div>
        </div>

        {/* ACTIVE CASUALTY SELECTOR STRIP */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Active Patient Casualty:
            </span>
            <select
              value={selectedEmergencyId}
              onChange={(e) => setSelectedEmergencyId(e.target.value)}
              className="bg-slate-950 border border-teal-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
            >
              {activeEmergencies?.map(emg => (
                <option key={emg.id} value={emg.id}>
                  {emg.id} — {emg.patientName || 'Patient'} ({emg.severity} • {emg.emergencyType})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Triage Priority:</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              RED / IMMEDIATE (Category 1)
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isShockHigh
                ? 'bg-red-950 text-red-300 border-red-700 animate-pulse'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700'
            }`}>
              Shock Index: {shockIndex} {isShockHigh ? '(Impending Shock)' : '(Compensated)'}
            </span>
          </div>
        </div>
      </div>


      {/* 3D DIGITAL PATIENT + REAL-TIME VITALS + TELE-DOCTOR VIDEO */}
      {(portalTab === 'Digital Twin' || portalTab === 'Dashboard') && (
        <div className="space-y-6">

          {/* 1. PATIENT DEMOGRAPHIC & CLINICAL HISTORY IDENTITY CARD */}
          <div className="p-5 bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              
              {/* Demographics */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-2xl font-black text-white">{currentPatient.name}</span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                    {currentPatient.age} Yrs • {currentPatient.gender}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                    Blood: {currentPatient.bloodGroup}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    GCS: 11 (E3 V3 M5)
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap font-mono">
                  <span>Patient ID: <strong className="text-white">{currentPatient.id}</strong></span>
                  <span>•</span>
                  <span>Emergency Code: <strong className="text-amber-400">{currentEmergency.id}</strong></span>
                  <span>•</span>
                  <span>Incident: <strong className="text-slate-200">{currentEmergency.emergencyType}</strong></span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                  <span>Phone: <strong className="text-slate-300">{currentPatient.phone}</strong></span>
                  <span>•</span>
                  <span>Emergency Contact: <strong className="text-slate-300">{currentPatient.emergencyContact}</strong></span>
                </div>
              </div>

              {/* Baseline Safety & Critical Allergy Alert */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5 max-w-lg w-full lg:w-auto">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    EHR Medical Baseline & Safety Profile
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> EHR Linked
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Critical Allergies: </span>
                  <strong className="text-red-400 font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                    {currentPatient.allergies}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Medical History: </span>
                  <span className="text-slate-200 font-medium">{currentPatient.medicalHistory}</span>
                </div>
                <div>
                  <span className="text-slate-400">Home Medications: </span>
                  <span className="text-cyan-300 font-mono">{currentPatient.currentMedications}</span>
                </div>
                <button
                  onClick={() => openMedicalQrForPatient(currentPatient || currentEmergency)}
                  className="w-full mt-2.5 py-1.5 px-3 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                >
                  <QrCode className="w-3.5 h-3.5 text-purple-300" />
                  <span>Scan / Decrypt Patient Medical QR Pass</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. DEDICATED 3D DIGITAL PATIENT CHAMBER (FULL WIDTH) */}
          <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
                <span className="font-black text-base text-white tracking-wide uppercase">
                  3D Digital Twin Patient Visualizer
                </span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-0.5 rounded">
                  Real-Time WebGL Mesh • Anatomical Layers
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIs3dFullscreen(!is3dFullscreen)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {is3dFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span>{is3dFullscreen ? 'Exit Full Screen' : 'Full Screen Chamber'}</span>
                </button>
              </div>
            </div>

            {/* 3D Model Component - Generous Height */}
            <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative">
              <DigitalTwin3D
                twin={{ ...twin, vitals: { ...twin.vitals } }}
                activeRegionId={selectedRegion}
                onSelectRegion={(reg) => setSelectedRegion(reg)}
                height="520px"
                isFullscreen={is3dFullscreen}
                onToggleFullscreen={(val) => setIs3dFullscreen(val)}
              />
            </div>

            {/* Real-time Oscilloscope Beeping ECG Strip */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Lead II ECG Real-Time Rhythm Strip (Synchronized Beep)
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {liveVitals.heartRate} BPM • Sinus Tachycardia
                </span>
              </div>
              <div className="h-20 w-full rounded-xl overflow-hidden bg-black border border-emerald-900/60 shadow-inner">
                <HeartRateEcgGraph
                  heartRate={Number(liveVitals.heartRate)}
                  spo2={Number(liveVitals.spo2)}
                  height={80}
                  autoStartBeep={false}
                />
              </div>
            </div>
          </div>

          {/* 3. FIELD TELEMETRY & LIVE CLINICAL CALIBRATION SLIDERS */}
          <div className="p-5 bg-slate-900/90 border border-teal-500/40 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm text-white">
                  Field Telemetry & Live Clinical Calibration Console
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Direct Telemetry Broadcasting to Apollo ER
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Heart Rate */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-red-900/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Heart Rate</span>
                  <Heart className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-black text-red-400 font-mono">
                  {liveVitals.heartRate} <span className="text-xs font-normal text-slate-400">bpm</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={liveVitals.heartRate}
                  onChange={(e) => handleVitalChange('heartRate', Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              {/* SpO2 */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-900/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Oxygen (SpO₂)</span>
                  <Wind className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  {liveVitals.spo2} <span className="text-xs font-normal text-slate-400">%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={liveVitals.spo2}
                  onChange={(e) => handleVitalChange('spo2', Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Blood Pressure */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-blue-900/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Blood Pressure</span>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-400 font-mono">
                  {liveVitals.systolic}/{liveVitals.diastolic}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={liveVitals.systolic}
                    onChange={(e) => handleVitalChange('systolic', Number(e.target.value))}
                    className="w-1/2 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-center text-xs font-mono text-white"
                    placeholder="Sys"
                  />
                  <span className="text-slate-500">/</span>
                  <input
                    type="number"
                    value={liveVitals.diastolic}
                    onChange={(e) => handleVitalChange('diastolic', Number(e.target.value))}
                    className="w-1/2 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-center text-xs font-mono text-white"
                    placeholder="Dia"
                  />
                </div>
              </div>

              {/* Respiratory Rate */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-purple-900/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Resp. Rate</span>
                  <Wind className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  {liveVitals.respiratoryRate} <span className="text-xs font-normal text-slate-400">/min</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="45"
                  value={liveVitals.respiratoryRate}
                  onChange={(e) => handleVitalChange('respiratoryRate', Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. PRE-HOSPITAL ABCDE PRIMARY TRAUMA SURVEY & ANATOMICAL LESIONS */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-white">
                  Pre-Hospital ABCDE Primary Trauma Survey & Anatomical Focus
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Patient Digital Twin Anatomical Correlation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* A - Airway */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">A • Airway</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-xs font-bold text-white">Patent Airway</div>
                <div className="text-[11px] text-slate-400">C-Spine immobilized with rigid cervical collar. No stridor.</div>
              </div>

              {/* B - Breathing */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">B • Breathing</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                </div>
                <div className="text-xs font-bold text-white">Tachypneic (26/min)</div>
                <div className="text-[11px] text-slate-400">High-flow O2 via non-rebreather. Decreased air entry at left base.</div>
              </div>

              {/* C - Circulation */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase">C • Circulation</span>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                </div>
                <div className="text-xs font-bold text-white">Compensated Shock</div>
                <div className="text-[11px] text-slate-400">HR 118 bpm, BP 95/60, Cap Refill 3.2s. Pelvic binder in place.</div>
              </div>

              {/* D - Disability */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">D • Disability</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                </div>
                <div className="text-xs font-bold text-white">GCS 11 (E3 V3 M5)</div>
                <div className="text-[11px] text-slate-400">Pupils 3mm equal and reactive. Drowsy but obeys commands.</div>
              </div>

              {/* E - Exposure */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">E • Exposure</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-xs font-bold text-white">Thermal Wrap On</div>
                <div className="text-[11px] text-slate-400">Normothermic (37.1°C). Hemorrhage control verified on limbs.</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB: DEDICATED AI STABILIZATION ASSISTANT (VOICE-TO-TEXT & TEXT-TO-VOICE) */}
      {portalTab === 'AI Assistant' && (
        <div className="space-y-6 animate-fade-in">
          <ParamedicAIAssistant
            currentEmergency={currentEmergency}
            patient={currentPatient}
            onSendDirectiveToDoctor={(summary) => {
              addTeleDirective(
                summary,
                'urgent',
                currentUser?.name || (isEmt ? 'EMT Field Unit' : 'Paramedic ALS Unit')
              );
              addNotification(
                'AI Stabilization Procedure Executed',
                `${currentUser?.name || 'EMS Unit'}: ${summary.split('\n')[0]}`,
                'success',
                'all'
              );
            }}
          />
        </div>
      )}

      {/* TAB 2: DEDICATED FULL-SCREEN TELE-DOCTOR VIDEO CONFERENCING */}
      {portalTab === 'Video Call' && (
        <div
          ref={videoConferenceContainerRef}
          className={`${
            isFullScreen
              ? 'fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl p-4 sm:p-6 flex flex-col overflow-y-auto w-screen h-screen'
              : 'space-y-6 animate-fade-in'
          }`}
        >
          <div className="p-6 bg-slate-900/95 border border-emerald-500/40 rounded-3xl shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Video className="w-6 h-6 text-emerald-400" />
                  <span>Field-to-Hospital High-Definition Telemedicine Suite</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Encrypted WebRTC Medical Channel • Apollo ER Trauma Desk
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={toggleFullScreen}
                  className="px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
                  title="Toggle Full Screen (or press Esc to exit)"
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4 text-cyan-300" /> : <Maximize2 className="w-4 h-4 text-cyan-300" />}
                  <span>{isFullScreen ? 'Exit Full Screen [Esc]' : 'Full Screen [⛶]'}</span>
                </button>

                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>CALL DURATION: {formatDuration(callDuration)}</span>
                </span>
              </div>
            </div>

            {/* Split Screen Video Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Doctor Main Camera (8 Cols) */}
              <div
                onClick={(e) => {
                  if (e.target.closest('button')) return;
                  toggleFullScreen();
                }}
                className={`lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center cursor-pointer group transition-all ${
                  isFullScreen ? 'flex-1 min-h-[520px]' : 'aspect-video'
                }`}
                title="Click video to toggle Full Screen"
              >
                <div className="text-center p-8">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 border-4 border-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/30">
                    <Stethoscope className="w-14 h-14 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{activeDoctor.name}</h3>
                  <p className="text-sm text-blue-300 font-semibold">{activeDoctor.specialization}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{activeDoctor.hospitalName} • Trauma Bay 1</p>

                  <div className="flex items-center justify-center gap-1.5 h-8 mt-5">
                    {doctorWaveform.map((val, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${val}%` }}
                        className="w-1.5 bg-emerald-400 rounded-full transition-all duration-300"
                      />
                    ))}
                  </div>
                </div>

                {/* Overlaid Fullscreen Button on Video Feed */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullScreen();
                  }}
                  className="absolute bottom-4 right-4 bg-black/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-all pointer-events-auto cursor-pointer shadow-lg z-20"
                >
                  {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
                </div>

                <span className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700 text-[10px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1 z-20">
                  {isFullScreen ? <Minimize2 className="w-3 h-3 text-cyan-300" /> : <Maximize2 className="w-3 h-3 text-cyan-300" />}
                  <span>Click video to {isFullScreen ? 'exit full screen' : 'maximize full screen'}</span>
                </span>

                {/* Overlaid Real-Time Telemetry Bar */}
                <div className="absolute top-4 left-4 bg-black/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/50 text-xs font-mono text-white flex items-center gap-4 z-10">
                  <span className="text-cyan-300 font-bold">Patient: {currentPatient.name}</span>
                  <span>•</span>
                  <span className="text-red-400 font-bold">HR: {liveVitals.heartRate} bpm</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">SpO₂: {liveVitals.spo2}%</span>
                  <span>•</span>
                  <span className="text-blue-300 font-bold">BP: {liveVitals.systolic}/{liveVitals.diastolic}</span>
                </div>

                <div className="absolute top-4 right-4 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-700 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Direct Encrypted Tele-Consult</span>
                </div>
              </div>

              {/* Paramedic Self-View & Interactive Directives (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                
                {/* Paramedic Camera */}
                <div className="bg-slate-950 rounded-2xl border border-teal-500/40 p-3 relative aspect-video flex flex-col items-center justify-center overflow-hidden">
                  {!isVideoOff ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <VideoOff className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-xs">Camera is Muted</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-teal-300">
                    {isEmt ? 'EMT Body-Cam Feed' : 'Paramedic Body-Cam Feed'}
                  </span>
                </div>

                {/* Real-Time Directives Pad */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-purple-900/50 flex-1 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      Physician Directives
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Live Queue</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(teleDirectives || doctorDirectives).map((d) => (
                      <div key={d.id} className="p-2.5 rounded-xl bg-slate-900 border border-purple-900/40 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">{d.time}</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            d.status === 'Executed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                        <p className="text-slate-200">{d.order}</p>
                        {d.status !== 'Executed' && (
                          <button
                            onClick={() => handleExecuteDirective(d.id)}
                            className="mt-1 w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded shadow transition-all cursor-pointer"
                          >
                            Mark As Executed
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Large Conference Bottom Controls */}
            <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`p-4 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isMicMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="text-xs">{isMicMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-4 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isVideoOff ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                <span className="text-xs">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
              </button>

              <button
                onClick={toggleFullScreen}
                className="p-4 rounded-2xl font-bold flex items-center gap-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/40 text-blue-200 transition-all cursor-pointer shadow-lg"
                title="Toggle Full Screen (or press Esc to exit)"
              >
                {isFullScreen ? <Minimize2 className="w-5 h-5 text-cyan-300" /> : <Maximize2 className="w-5 h-5 text-cyan-300" />}
                <span className="text-xs">{isFullScreen ? 'Exit Full Screen [Esc]' : 'Full Screen Mode [⛶]'}</span>
              </button>

              <button
                onClick={() => setCallStatus(callStatus === 'connected' ? 'ended' : 'connected')}
                className={`px-6 py-4 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl transition-all cursor-pointer ${
                  callStatus === 'connected'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {callStatus === 'connected' ? <PhoneOff className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                <span>{callStatus === 'connected' ? 'End Video Conference' : 'Call Trauma Doctor'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: FIELD INTERVENTIONS & MEDICATIONS LOGGER */}
      {portalTab === 'Treatments' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-400" />
                  <span>Field Interventions & Emergency Pharmacology Console</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Document pre-hospital resuscitations, procedures, and drugs administered during patient transport.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {twin?.treatments?.length || 0} Procedures Logged
                </span>
                <span className="px-3 py-1 rounded-xl bg-purple-950 text-purple-300 border border-purple-800">
                  {twin?.medications?.length || 0} Drugs Administered
                </span>
              </div>
            </div>

            {/* Input Forms: Record Resuscitation & Administer Emergency Medication */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Record Treatment Form */}
              <form onSubmit={handleRecordTreatment} className="p-5 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-2">
                  <Truck className="w-4 h-4" />
                  <span>Record Resuscitation & Field Procedure</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Treatment / Procedure:</label>
                  <input
                    type="text"
                    value={treatmentAction}
                    onChange={(e) => setTreatmentAction(e.target.value)}
                    placeholder="e.g. Rigid Cervical Collar, Pelvic Binder, High-Flow O2"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Clinical Notes & Observations:</label>
                  <textarea
                    value={treatmentNotes}
                    onChange={(e) => setTreatmentNotes(e.target.value)}
                    placeholder="e.g. Patient stabilized; bilateral breath sounds checked"
                    rows={3}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow cursor-pointer transition-all text-xs"
                >
                  + Commit Field Treatment
                </button>
              </form>

              {/* Administer Medication Form */}
              <form onSubmit={handleAdministerMedication} className="p-5 bg-slate-950 border border-purple-500/20 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm border-b border-slate-800 pb-2">
                  <Pill className="w-4 h-4" />
                  <span>Administer Emergency Medication</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">Drug Name:</label>
                    <input
                      type="text"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      placeholder="e.g. Tranexamic Acid (TXA)"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">Dose & Route:</label>
                    <input
                      type="text"
                      value={medDose}
                      onChange={(e) => setMedDose(e.target.value)}
                      placeholder="e.g. 1g IV in 100mL NS"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Clinical Indication:</label>
                  <input
                    type="text"
                    value={medIndication}
                    onChange={(e) => setMedIndication(e.target.value)}
                    placeholder="e.g. Suspected occult internal hemorrhage / trauma"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow cursor-pointer transition-all text-xs"
                >
                  + Administer Drug via Field Protocol
                </button>
              </form>
            </div>

            {/* Logged Treatments & Medications Display Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Treatments Provided During Transport */}
              <div className="p-5 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Truck className="w-4 h-4" />
                    <span>Transport Treatments Logged ({twin?.treatments?.length || 0})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Field Resuscitation</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {twin?.treatments?.length > 0 ? (
                    twin.treatments.map((t, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-emerald-900/40 text-xs flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-white">{t.action}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{t.notes}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">By {t.providedBy || (isEmt ? 'EMT' : 'Paramedic')}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {t.time || 'Logged'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic p-4 text-center">No field treatments recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Medicines Administered */}
              <div className="p-5 bg-slate-950 border border-purple-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Pill className="w-4 h-4" />
                    <span>Medicines Administered ({twin?.medications?.length || 0})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Pharmacology</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {twin?.medications?.length > 0 ? (
                    twin.medications.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-purple-900/40 text-xs flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-white">{m.medicine} <span className="text-purple-300 font-normal">({m.dose})</span></div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{m.indication}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">Administered by {m.administeredBy || (isEmt ? 'EMT' : 'Paramedic')}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-purple-400 shrink-0 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                          {m.timestamp || 'Logged'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic p-4 text-center">No medicines administered yet.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* TAB: PRE-TREATMENT EQUIPMENT READINESS CHECKLIST */}
      {portalTab === 'Equipment' && (
        <div className="space-y-6 animate-fade-in">
          <PreTreatmentEquipmentChecklist
            ambulance={ambulances?.find(a => a.id === currentEmergency.assignedAmbulanceId) || ambulances?.[0]}
            emergency={currentEmergency}
            canEdit={true}
            title="Pre-Treatment Equipment Readiness & Verification"
          />
        </div>
      )}

      {/* TAB 4: START TRIAGE MATRIX */}
      {portalTab === 'Triage' && (
        <div className="p-6 bg-slate-900 border border-teal-500/30 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>START Field Triage Algorithm (Simple Triage and Rapid Treatment)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Standard disaster & mass casualty evaluation protocol for field EMTs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Step 1: Able to Walk? */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Step 1 • Ambulation</span>
              <h4 className="text-sm font-bold text-white">Can Patient Walk?</h4>
              <p className="text-xs text-slate-400">If YES ➔ Minor (Green / Delayed).</p>
              <div className="p-2 bg-slate-900 rounded-lg text-xs font-mono text-red-400 border border-red-900/60 font-bold">
                Current: NO (Trauma Immobilized)
              </div>
            </div>

            {/* Step 2: Spontaneous Breathing? */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Step 2 • Respiration</span>
              <h4 className="text-sm font-bold text-white">Spontaneous Breathing</h4>
              <p className="text-xs text-slate-400">Rate: &gt; 30/min or &lt; 10/min ➔ Immediate (Red).</p>
              <div className="p-2 bg-slate-900 rounded-lg text-xs font-mono text-amber-400 border border-amber-900/60 font-bold">
                Current: {liveVitals.respiratoryRate} / min (Labored)
              </div>
            </div>

            {/* Step 3: Perfusion */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Step 3 • Perfusion</span>
              <h4 className="text-sm font-bold text-white">Radial Pulse / Cap Refill</h4>
              <p className="text-xs text-slate-400">Radial absent or Cap Refill &gt; 2s ➔ Immediate (Red).</p>
              <div className="p-2 bg-slate-900 rounded-lg text-xs font-mono text-red-400 border border-red-900/60 font-bold">
                Current: Cap Refill 3.2s (Delayed)
              </div>
            </div>

            {/* Step 4: Mental Status */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Step 4 • Mental Status</span>
              <h4 className="text-sm font-bold text-white">Follows Simple Commands</h4>
              <p className="text-xs text-slate-400">Cannot obey simple commands ➔ Immediate (Red).</p>
              <div className="p-2 bg-slate-900 rounded-lg text-xs font-mono text-red-400 border border-red-900/60 font-bold">
                Current: Voice Responsive Only
              </div>
            </div>

          </div>

          <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                1
              </div>
              <div>
                <span className="text-sm font-extrabold text-white">FINAL TRIAGE TAG: RED / IMMEDIATE</span>
                <p className="text-xs text-red-300">Requires immediate life-saving resuscitation upon Apollo ER arrival.</p>
              </div>
            </div>

            <button
              onClick={() => addNotification('Triage Tag Synchronized', 'START algorithm confirmed RED triage tag.', 'urgent', 'all')}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
            >
              Broadcast Triage Tag to ER
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: PARAMEDIC / EMT PROFILE (NAME, PHONE, EXPERIENCE, QUALIFICATIONS, CERTIFICATIONS & LICENSES, CLINICAL SKILLS) */}
      {portalTab === 'Profile' && (
        <div className="space-y-6">
          
          {/* PROFILE SECTION TITLE */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <User className="w-6 h-6 text-teal-400" />
                <span>{isEmt ? 'Emergency Medical Technician (EMT) Profile' : 'Paramedic Profile'}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEmt
                  ? 'Official Emergency Medical Technician Credentials, Field Response Record, and BLS Competencies'
                  : 'Official Paramedic ALS Credentials, Critical Trauma Care Record, and Resuscitation Competencies'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-700">
              {isEmt ? 'EMT-Certified Profile' : 'Paramedic ALS Profile'}
            </span>
          </div>

          {/* PROFILE HEADER HERO CARD */}
          <div className="p-6 bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-teal-500/30 border-2 border-teal-300">
                    <User className="w-10 h-10 text-slate-950" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-950 font-bold" title={isEmt ? "EMT Licensed & Active" : "Paramedic Licensed & Active"}>
                    ✓
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-black text-white">{profileData.name}</h2>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-700 flex items-center gap-1.5 shadow-sm">
                      <Award className="w-3.5 h-3.5 text-teal-400" />
                      <span>{isEmt ? 'LICENSED EMERGENCY MEDICAL TECHNICIAN (EMT)' : 'LEAD TRAUMA PARAMEDIC (ALS)'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-300 mt-2 flex-wrap">
                    <a
                      href={`tel:${profileData.phone}`}
                      className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-bold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{profileData.phone}</span>
                    </a>
                    <span>•</span>
                    <span className="text-slate-400">Assigned Unit: <strong className="text-white font-mono">{isEmt ? 'Ambulance DL-01-EA-1082 (BLS)' : 'Ambulance DL-01-EA-1081'}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> License Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit / View Mode Toggle */}
              <div>
                <button
                  onClick={() => {
                    if (isEditingProfile) {
                      setIsEditingProfile(false);
                    } else {
                      setEditForm({ ...profileData });
                      setIsEditingProfile(true);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isEditingProfile
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/25'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditingProfile ? 'Cancel Editing' : 'Edit Credentials'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* EDIT FORM MODE */}
          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="p-6 bg-slate-900 border border-teal-500/40 rounded-3xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal-400" />
                  <span>Edit {isEmt ? 'Emergency Medical Technician (EMT)' : 'Paramedic'} Profile Details</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">Make updates and commit below</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Full Name:</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                {/* 2. Phone No. */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Phone Number:</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>

                {/* 3. Years of Experience */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Years of Experience:</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={editForm.yearsOfExperience}
                    onChange={(e) => setEditForm(prev => ({ ...prev, yearsOfExperience: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* 4. Qualifications */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Qualifications & Academic Degrees:</label>
                <textarea
                  rows={2}
                  value={editForm.qualifications}
                  onChange={(e) => setEditForm(prev => ({ ...prev, qualifications: e.target.value }))}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />
              </div>

              {/* 5. Certification and Licenses Editor */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Certifications and Licenses:</label>
                <div className="space-y-1.5">
                  {editForm.certificationsAndLicenses.map((cert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                      <span className="text-teal-300 font-mono">{cert}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(idx)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5 rounded cursor-pointer"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder="Add new certification (e.g. ITLS Pediatric Provider)"
                    className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/40 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* 6. Clinical Skills Editor */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Clinical Skills & Competencies:</label>
                <div className="space-y-1.5">
                  {editForm.clinicalSkills.map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                      <span className="text-slate-200">✓ {skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5 rounded cursor-pointer"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add new clinical skill (e.g. Surgical Cricothyrotomy)"
                    className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/40 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE: 6 CORE REQUIRED CREDENTIAL SECTIONS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT COLUMN: IDENTITY, PHONE, EXPERIENCE & QUALIFICATIONS (5 COLS) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1 & 2: Name & Phone No. Card */}
                <div className="p-5 bg-slate-900 border border-teal-500/30 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-teal-400 font-bold text-sm">
                    <User className="w-4 h-4" />
                    <span>{isEmt ? 'Emergency Medical Technician Identity & Contact' : 'Paramedic Identity & Contact'}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Full Name:</span>
                      <span className="text-base font-black text-white">{profileData.name}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Phone Number:</span>
                      <a
                        href={`tel:${profileData.phone}`}
                        className="text-sm font-mono font-bold text-teal-300 hover:text-teal-200 flex items-center gap-2 pt-0.5"
                      >
                        <Phone className="w-4 h-4 text-teal-400" />
                        <span>{profileData.phone}</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Official Email:</span>
                      <span className="text-xs font-mono text-slate-200">{currentUser?.email || (isEmt ? 'amit.emt@delhiems.gov.in' : 'rajesh.emt@delhiems.gov.in')}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Deployment Base:</span>
                      <span className="text-xs font-semibold text-slate-200">{isEmt ? 'Delhi Emergency Medical Services • EMS Station 02' : 'Delhi Emergency Medical Services • Station 04'}</span>
                    </div>
                  </div>
                </div>

                {/* 3: Years of Experience Card */}
                <div className="p-5 bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-cyan-400 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Years of Experience</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-700 flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-2xl font-black text-cyan-300 font-mono leading-none">
                        {profileData.yearsOfExperience}+
                      </span>
                      <span className="text-[9px] text-cyan-400 font-bold uppercase mt-0.5">Years</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{isEmt ? 'Pre-hospital Basic Life Support & EMT Specialist' : 'Pre-hospital Trauma & EMS Specialist'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {profileData.experienceDetails}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Critical Transits:</span>
                      <span className="text-white font-bold text-xs">{isEmt ? '1,100+ Calls' : '2,400+ Calls'}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">{isEmt ? 'Rapid Stabilization:' : 'ROSC In-Transit:'}</span>
                      <span className="text-emerald-400 font-bold text-xs">{isEmt ? '94.2% Rate' : '88.4% Rate'}</span>
                    </div>
                  </div>
                </div>

                {/* 4: Qualifications Card */}
                <div className="p-5 bg-slate-900 border border-blue-500/30 rounded-3xl shadow-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-blue-400 font-bold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Qualifications & Academic Background</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-blue-900/40 space-y-1">
                      <div className="font-bold text-white text-xs">{profileData.qualifications}</div>
                      <div className="text-[11px] text-blue-300">
                        {isEmt ? 'Delhi Institute of Emergency Medical Services' : 'Delhi Institute of Paramedical Sciences • First Class Honors'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {isEmt ? 'Graduated 2020 • Advanced First Responder & Prehospital EMS' : 'Graduated 2016 • Major in Trauma Care & Prehospital Resuscitation'}
                      </div>
                    </div>

                    {!isEmt && (
                      <div className="p-3 bg-slate-950 rounded-2xl border border-blue-900/40 space-y-1">
                        <div className="font-bold text-white text-xs">Post-Graduate Diploma in Critical Care & Trauma Management</div>
                        <div className="text-[11px] text-blue-300">National Academy of Medical Sciences</div>
                        <div className="text-[10px] text-slate-500 font-mono">Completed 2018 • Advanced Resuscitation & Pharmacology Specialization</div>
                      </div>
                    )}

                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                      <div className="font-bold text-white text-xs">Senior Secondary Certificate (Class XII)</div>
                      <div className="text-[11px] text-slate-400">CBSE Board • Biology, Chemistry & Physics Honors</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: CERTIFICATIONS & LICENSES + CLINICAL SKILLS (7 COLS) */}
              <div className="lg:col-span-7 space-y-6">

                {/* 5: Certification and Licenses Card */}
                <div className="p-5 bg-slate-900 border border-teal-500/30 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                      <FileCheck className="w-4 h-4" />
                      <span>Certification and Licenses ({profileData.certificationsAndLicenses.length})</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3" /> Fully Compliant
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {profileData.certificationsAndLicenses.map((cert, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 rounded-2xl border border-teal-900/40 flex items-start gap-2.5 text-xs shadow-sm hover:border-teal-600 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-xl bg-teal-950 border border-teal-700 flex items-center justify-center text-teal-400 shrink-0 font-bold text-[11px]">
                          ✓
                        </div>
                        <div>
                          <span className="font-semibold text-white block leading-tight">{cert}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Verified National Credential</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6: Clinical Skills Card */}
                <div className="p-5 bg-slate-900 border border-purple-500/30 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                      <Award className="w-4 h-4" />
                      <span>Clinical Skills & Competencies ({profileData.clinicalSkills.length})</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                      Tier 1 Field Scope
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {profileData.clinicalSkills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 rounded-2xl border border-purple-900/30 flex items-start gap-2.5 text-xs hover:border-purple-600 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-purple-950 border border-purple-700 flex items-center justify-center text-purple-300 shrink-0 font-bold text-[10px]">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-medium text-slate-200 block leading-tight">{skill}</span>
                          <span className="text-[9px] text-emerald-400 font-mono">Independent Scope Approved</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills Categorization Summary */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Airway / Resuscitation:</span>
                      <span className="text-teal-300 font-bold">{isEmt ? 'BVM / OPA / NPA / AED' : 'Advanced (Intubation/BVM)'}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Trauma & Hemostasis:</span>
                      <span className="text-red-400 font-bold">{isEmt ? 'CAT / Splint / Bandaging' : 'CAT / Splint / Decomp'}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">{isEmt ? 'Field Protocol:' : 'Pharmacology:'}</span>
                      <span className="text-purple-300 font-bold">{isEmt ? 'START Triage & BLS' : 'ACLS & PALS Certified'}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
