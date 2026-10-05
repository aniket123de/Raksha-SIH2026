import React, { useState, useEffect, useRef } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { aiService } from '../services/aiService';
import {
  Stethoscope,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Ambulance,
  Building2,
  FileText,
  UserCheck,
  CheckCircle2,
  Activity,
  Plus,
  Send,
  Eye,
  Lock,
  Unlock,
  Sparkles,
  Bed,
  Wind,
  Droplets,
  Bell,
  User,
  ShieldAlert,
  ChevronRight,
  ClipboardList,
  Check,
  QrCode,
  Phone,
  Mail,
  Edit3,
  Save,
  X,
  Shield,
  Award,
  MapPin,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Maximize2,
  Minimize2,
  Zap,
  Volume2,
  Pill,
  Heart,
  AlertOctagon,
  Share2,
  Compass,
  CheckCircle
} from 'lucide-react';

export const DoctorPortal = () => {
  const {
    currentUser,
    portalTab,
    setPortalTab,
    doctors,
    activeEmergencies,
    ambulances,
    hospitals,
    patients,
    notifications,
    teleDirectives,
    addTeleDirective,
    updateTeleDirectiveStatus,
    addDoctorNote,
    addPrescription,
    updateEmergencyStatus,
    updateDoctorProfile,
    requestBreakGlassConsent,
    openMedicalQrForPatient,
    openDigitalTwinForPatient,
    addNotification,
    logAudit
  } = useEmergency();

  const doctor = doctors.find(d => d.id === currentUser?.referenceId) || doctors[0];
  const assignedHospital = hospitals.find(h => h.id === doctor.hospitalId) || hospitals[0];

  const [selectedEmergencyId, setSelectedEmergencyId] = useState(activeEmergencies[0]?.id || null);
  const selectedEmergency = activeEmergencies.find(e => e.id === selectedEmergencyId) || activeEmergencies[0];

  const [newNote, setNewNote] = useState('');
  const [treatmentInfo, setTreatmentInfo] = useState('');
  const [breakGlassUnlocked, setBreakGlassUnlocked] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState('Imminent polytrauma resuscitation in Red Trauma Bay');

  // Digital Prescription Form States
  const [rxMedication, setRxMedication] = useState('IV Tranexamic Acid 1g in 100ml NS over 10 min');
  const [rxDosage, setRxDosage] = useState('1g');
  const [rxRoute, setRxRoute] = useState('IV');
  const [rxFrequency, setRxFrequency] = useState('STAT');
  const [rxInstructions, setRxInstructions] = useState('Pre-hospital hemorrhagic stabilization for suspected pelvic fracture');

  const selectedPatient = patients.find(p => p.id === selectedEmergency?.patientId) || patients[0];
  const assignedAmb = ambulances.find(a => a.id === selectedEmergency?.assignedAmbulanceId);

  // Telemedicine Video Conference with Paramedic / EMT
  const [isCallConnected, setIsCallConnected] = useState(true);
  const [isDocMicMuted, setIsDocMicMuted] = useState(false);
  const [isDocVideoOff, setIsDocVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(245);
  const [activeCameraFeed, setActiveCameraFeed] = useState('bodycam'); // 'bodycam' | 'ambulance' | 'patient'
  const [doctorWaveform, setDoctorWaveform] = useState([30, 65, 45, 80, 55, 90, 40, 70, 85, 50, 60, 35]);
  const [newDirectiveOrder, setNewDirectiveOrder] = useState('');
  const [newDirectivePriority, setNewDirectivePriority] = useState('urgent');
  const [quickOrderSuccess, setQuickOrderSuccess] = useState(null);
  const localDocVideoRef = useRef(null);

  // Full Screen Video Conference State
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

  // Call timer and simulated voice waveform
  useEffect(() => {
    let timer;
    if (isCallConnected && portalTab === 'Video Conference') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
        setDoctorWaveform(prev => prev.map(() => Math.floor(Math.random() * 75) + 15));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallConnected, portalTab]);

  // Try local webcam for realism
  useEffect(() => {
    let stream = null;
    if (portalTab === 'Video Conference' && isCallConnected && !isDocVideoOff && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          stream = s;
          if (localDocVideoRef.current) {
            localDocVideoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Camera permission denied or not available; fallback to avatar
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [portalTab, isCallConnected, isDocVideoOff]);

  const formatCallDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTransmitDirective = (orderText, priority = 'urgent') => {
    const text = (orderText || newDirectiveOrder).trim();
    if (!text) return;
    if (addTeleDirective) {
      addTeleDirective(text, priority, doctor.name);
    }
    setNewDirectiveOrder('');
    setQuickOrderSuccess(`Directive transmitted to EMT/Paramedic: "${text.substring(0, 45)}..."`);
    setTimeout(() => setQuickOrderSuccess(null), 4000);
  };

  // Doctor Profile & Credentials State
  const [isEditDocProfileModalOpen, setIsEditDocProfileModalOpen] = useState(false);
  const [docProfileForm, setDocProfileForm] = useState({
    name: doctor.name,
    qualifications: doctor.qualifications,
    registrationNumber: doctor.registrationNumber,
    specialization: doctor.specialization,
    surgicalExperience: doctor.surgicalExperience,
    hospitalName: doctor.hospitalName,
    availability: doctor.availability,
    professionalContact: doctor.professionalContact || '+91 11 2692 5858 (Ext. 401)',
    email: 'ananya.sen@apolloer.org',
    shiftSchedule: '08:00 - 20:00 (Emergency Trauma Shift - Bay 1)',
    pagerChannel: 'Pager #4092 • VHF ER Ch 2 (155.340 MHz)',
    bio: 'Lead Trauma Surgeon specialized in polytrauma resuscitation, damage-control laparotomy, emergency airway management, and acute hemorrhagic shock stabilization.'
  });

  useEffect(() => {
    if (doctor) {
      setDocProfileForm(prev => ({
        ...prev,
        name: doctor.name,
        qualifications: doctor.qualifications,
        registrationNumber: doctor.registrationNumber,
        specialization: doctor.specialization,
        surgicalExperience: doctor.surgicalExperience,
        hospitalName: doctor.hospitalName,
        availability: doctor.availability,
        professionalContact: doctor.professionalContact || prev.professionalContact
      }));
    }
  }, [doctor]);

  const handleSaveDocProfile = (e) => {
    e.preventDefault();
    updateDoctorProfile(doctor.id, {
      name: docProfileForm.name,
      qualifications: docProfileForm.qualifications,
      registrationNumber: docProfileForm.registrationNumber,
      specialization: docProfileForm.specialization,
      surgicalExperience: docProfileForm.surgicalExperience,
      hospitalName: docProfileForm.hospitalName,
      availability: docProfileForm.availability,
      professionalContact: docProfileForm.professionalContact
    });
    setIsEditDocProfileModalOpen(false);
  };

  // AI Medical Summary for Emergency Doctor
  const aiSummary = selectedPatient ? aiService.summarizePatientHistory(selectedPatient) : null;

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedEmergency) return;
    addDoctorNote(selectedEmergency.id, doctor.name, newNote);
    setNewNote('');
  };

  const handleUpdateTreatment = (e) => {
    e.preventDefault();
    if (!treatmentInfo.trim() || !selectedEmergency) return;
    addDoctorNote(selectedEmergency.id, doctor.name, `[TREATMENT UPDATE]: ${treatmentInfo}`);
    setTreatmentInfo('');
  };

  const handleCreatePrescription = (e) => {
    e.preventDefault();
    if (!rxMedication.trim() || !selectedEmergency) return;
    addPrescription(selectedEmergency.id, doctor.name, {
      medicationName: rxMedication,
      dosage: rxDosage,
      route: rxRoute,
      frequency: rxFrequency,
      specialInstructions: rxInstructions
    });
    setRxMedication('');
    setRxInstructions('');
  };

  const handleUnlockBreakGlass = () => {
    requestBreakGlassConsent(selectedPatient.id, doctor.id, breakGlassReason);
    setBreakGlassUnlocked(true);
  };

  const handlePatientStatusUpdate = (statusLabel) => {
    if (!selectedEmergency) return;
    updateEmergencyStatus(selectedEmergency.id, statusLabel);
  };

  // Doctor role notifications
  const doctorNotifications = notifications.filter(n => n.targetRole === 'all' || n.targetRole === 'doctor');

  return (
    <div className="space-y-8 pb-16">
      
      {/* DOCTOR BANNER & CREDENTIALS HEADER */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white">{doctor.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                {doctor.availability}
              </span>
            </div>
            <p className="text-xs text-blue-400 font-semibold mt-0.5">{doctor.specialization} • {doctor.qualifications}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
              <span>Registration: <strong className="text-slate-200 font-mono">{doctor.registrationNumber}</strong></span>
              <span>•</span>
              <span>Hospital: <strong className="text-slate-200">{doctor.hospitalName}</strong></span>
              <span>•</span>
              <span>Surgical Experience: <strong className="text-slate-200">{doctor.surgicalExperience}</strong></span>
            </div>
          </div>
        </div>

        {/* Actions & Hospital Resources Mini HUD */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => setPortalTab(portalTab === 'Video Conference' ? 'Dashboard' : 'Video Conference')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all hover:scale-105 active:scale-95 ${
              portalTab === 'Video Conference'
                ? 'bg-emerald-600 text-white font-black shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-950/50'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{portalTab === 'Video Conference' ? 'Back to Dashboard' : 'Tele-Paramedic Video Call'}</span>
          </button>

          <button
            onClick={() => setPortalTab(portalTab === 'Profile' ? 'Dashboard' : 'Profile')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all hover:scale-105 active:scale-95 ${
              portalTab === 'Profile'
                ? 'bg-blue-600 text-white font-black shadow-blue-600/30'
                : 'bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-500/50'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-blue-400" />
            <span>{portalTab === 'Profile' ? 'Back to Dashboard' : 'Doctor Profile'}</span>
          </button>

          {/* Hospital Resources Mini HUD */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-4 text-xs">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 block uppercase">ER Beds</span>
              <span className="font-bold font-mono text-emerald-400 text-sm">{assignedHospital.generalBeds}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 block uppercase">ICU Beds</span>
              <span className="font-bold font-mono text-emerald-400 text-sm">{assignedHospital.icuBeds}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 block uppercase">O₂ Status</span>
              <span className="font-bold text-amber-400 text-xs">{assignedHospital.oxygenStatus}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 block uppercase">Ventilators</span>
              <span className="font-bold font-mono text-purple-400 text-sm">{assignedHospital.ventilators}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DOCTOR PROFILE SECTION (portalTab === 'Profile') */}
      {/* ========================================================================= */}
      {portalTab === 'Profile' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Doctor Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-700/60 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Verified Medical Officer
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-blue-300 border border-slate-700">
                    Registration: {docProfileForm.registrationNumber}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    {docProfileForm.availability}
                  </span>
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <span>{docProfileForm.name}</span>
                  <span className="text-sm font-semibold text-blue-400 font-mono px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40">
                    {docProfileForm.specialization}
                  </span>
                </h2>
                
                <p className="text-sm text-slate-300 flex items-center gap-2 max-w-2xl">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                  Hospital Affiliation: <strong className="text-white">{docProfileForm.hospitalName}</strong>
                </p>

                <p className="text-xs text-blue-400 font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-400" />
                  Credentials & Degrees: <strong className="text-white">{docProfileForm.qualifications}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => setIsEditDocProfileModalOpen(true)}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-900/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Doctor Profile & Credentials
                </button>
              </div>
            </div>

            {/* Quick Spec Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Direct Phone</span>
                <div className="text-sm font-black font-mono text-blue-400 mt-0.5">{docProfileForm.professionalContact}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Trauma Experience</span>
                <div className="text-sm font-black font-mono text-white mt-0.5">{docProfileForm.surgicalExperience}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pager / VHF Radio</span>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">{docProfileForm.pagerChannel}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duty Roster</span>
                <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">{docProfileForm.shiftSchedule}</div>
              </div>
            </div>
          </div>

          {/* Profile Details 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Clinical Credentials & Certifications */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Award className="w-4 h-4 text-blue-400" />
                Medical Qualifications & Registry
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Medical Council Registration:</span>
                  <div className="font-bold text-blue-400 font-mono text-sm mt-0.5">{docProfileForm.registrationNumber}</div>
                  <span className="text-[10px] text-emerald-400 font-medium">✓ Verified & Active National Registry</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Degrees & Fellowships:</span>
                  <div className="font-semibold text-white mt-0.5">{docProfileForm.qualifications}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Primary Clinical Specialty:</span>
                  <div className="font-bold text-white mt-0.5">{docProfileForm.specialization}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Surgical & Critical Care Record:</span>
                  <div className="text-slate-200 mt-0.5">{docProfileForm.surgicalExperience}</div>
                </div>
              </div>
            </div>

            {/* Column 2: Emergency Duty & Roster */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Clock className="w-4 h-4 text-blue-400" />
                Emergency Duty & Contact
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Current Shift & Bay:</span>
                  <div className="font-bold text-white text-sm mt-0.5">{docProfileForm.shiftSchedule}</div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Resuscitation Bay 1 Lead</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Official Emergency Phone:</span>
                  <div className="font-mono text-blue-400 font-bold mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    {docProfileForm.professionalContact}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Hospital Clinical Email:</span>
                  <div className="font-mono text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {docProfileForm.email}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block">Assigned Trauma Facility:</span>
                  <div className="font-semibold text-white mt-0.5">{docProfileForm.hospitalName}</div>
                </div>
              </div>
            </div>

            {/* Column 3: Clinical Privileges & Scope */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Authorized Clinical Privileges
              </h3>

              <div className="space-y-2.5 text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">Level 1 Polytrauma Resuscitation & Triage Lead</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">Emergency Break-Glass EHR Access Override</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">Digital Controlled Substance & Pre-Hospital Orders</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">Digital Green Corridor Organ Transit Certification</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px] text-slate-300">
                <span className="text-slate-500 font-semibold block mb-0.5">Clinical Scope / Bio:</span>
                {docProfileForm.bio}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD (OVERVIEW) */}
      {/* ========================================================================= */}
      {(portalTab === 'Dashboard' || !portalTab) && portalTab !== 'Profile' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Emergency Alerts & Queue Highlights */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-500" />
                  Incoming Emergency Alerts & Triage Stream
                </h2>
                <p className="text-xs text-slate-400">Incoming trauma cases routed to your hospital emergency department</p>
              </div>
              <span className="text-xs bg-red-950 text-red-400 font-mono font-bold px-2.5 py-1 rounded-lg border border-red-800">
                {activeEmergencies.length} Active Trauma Alerts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEmergencies.map(emg => {
                const isSelected = selectedEmergency?.id === emg.id;
                return (
                  <div
                    key={emg.id}
                    onClick={() => setSelectedEmergencyId(emg.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-blue-500 shadow-xl shadow-blue-900/20 ring-1 ring-blue-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-slate-400">{emg.id}</span>
                        <h3 className="font-bold text-white text-base mt-0.5">{emg.patientName}</h3>
                        <div className="text-xs text-slate-400">
                          {emg.patientAge} yrs • {emg.patientGender} • Blood: <strong className="text-red-400 font-mono">{emg.patientBloodGroup}</strong>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        emg.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {emg.severity}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Ambulance className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unit: <strong className="text-white">{emg.assignedAmbulanceId || 'En Route'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        ETA: {emg.etaMinutes || 6}m
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick dossier preview for currently selected patient */}
          {selectedEmergency && (
            <section className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">
                    Emergency Patient Dossier & Immediate Clinical Actions ({selectedEmergency.id})
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedEmergencyId(selectedEmergency.id);
                      setPortalTab('Video Conference');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 border border-emerald-400/40"
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                    <span>Video Call Paramedic/EMT</span>
                  </button>
                  <button
                    onClick={() => openDigitalTwinForPatient(selectedEmergency || selectedPatient)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-all hover:scale-105 active:scale-95 border border-cyan-400/40"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                    <span>🧬 3D Digital Twin</span>
                  </button>
                  <button
                    onClick={() => openMedicalQrForPatient(selectedPatient)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-bold text-xs rounded-xl transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Medical QR</span>
                  </button>
                  <button
                    onClick={() => setPortalTab('Medical Records')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Open Full Medical Record & Orders →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Patient Identity & Vitals</span>
                  <div className="text-base font-bold text-white">{selectedPatient.name} ({selectedPatient.age} yrs / {selectedPatient.gender})</div>
                  <div className="text-red-400 font-mono">Blood Group: <strong>{selectedPatient.bloodGroup}</strong></div>
                  <div className="text-slate-300">Heart Rate: <strong>{selectedEmergency.triageScore?.heartRate || 112} BPM</strong></div>
                  <div className="text-slate-300">SpO₂: <strong>{selectedEmergency.triageScore?.oxygenSaturation || '92%'}</strong></div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-rose-900/40 space-y-2 text-rose-200">
                  <span className="text-rose-400 font-semibold uppercase text-[10px]">Severe Allergies</span>
                  <div className="font-bold text-sm">{selectedPatient.allergies}</div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Chronic Conditions: <strong>{selectedPatient.existingConditions}</strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Status Management</span>
                  <div className="text-white font-semibold">Current State: <span className="text-amber-400 uppercase font-bold">{selectedEmergency.status}</span></div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {['Trauma Bay Allocated', 'In Surgery', 'Admitted to ICU', 'Stabilized'].map(st => (
                      <button
                        key={st}
                        onClick={() => handlePatientStatusUpdate(st)}
                        className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 font-medium border border-slate-700 text-center"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: VIDEO CONFERENCE WITH PARAMEDIC / EMT */}
      {/* ========================================================================= */}
      {portalTab === 'Video Conference' && (
        <div
          ref={videoConferenceContainerRef}
          className={`${
            isFullScreen
              ? 'fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl p-4 sm:p-6 flex flex-col overflow-y-auto w-screen h-screen'
              : 'space-y-6 animate-fade-in'
          }`}
        >
          
          {/* Telemedicine Header Card */}
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>LIVE WEBRTC TELEMEDICINE • 256-BIT ENCRYPTED</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                    CALL DURATION: {formatCallDuration(callDuration)}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-2">
                  <Video className="w-6 h-6 text-emerald-400" />
                  <span>Field-to-ER Emergency Video Conference</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct encrypted audio/video tele-consultation between Apollo ER Trauma Bay 1 & Ambulance {assignedAmb?.plateNumber || 'AMB-01'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={toggleFullScreen}
                  className="px-4 py-2.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                  title="Toggle Full Screen (or press Esc to exit)"
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4 text-cyan-300" /> : <Maximize2 className="w-4 h-4 text-cyan-300" />}
                  <span>{isFullScreen ? 'Exit Full Screen [Esc]' : 'Full Screen [⛶]'}</span>
                </button>

                <button
                  onClick={() => setIsCallConnected(!isCallConnected)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                    isCallConnected
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                  }`}
                >
                  {isCallConnected ? <PhoneOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  <span>{isCallConnected ? 'Disconnect Call' : 'Reconnect Call'}</span>
                </button>

                <button
                  onClick={() => {
                    if (isFullScreen) toggleFullScreen();
                    setPortalTab('Dashboard');
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Context Strip: Patient & Ambulance Field Unit */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Patient in Transit</span>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <span>{selectedPatient.name} ({selectedPatient.age}y/{selectedPatient.gender})</span>
                  <span className="text-red-400 font-mono text-xs">{selectedPatient.bloodGroup}</span>
                </div>
                <div className="text-[11px] text-slate-400">Emergency: <strong className="text-amber-400">{selectedEmergency?.emergencyType || 'Severe Polytrauma'}</strong></div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Field Response Crew</span>
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>EMT Verma & Paramedic Sharma</span>
                </div>
                <div className="text-[11px] text-teal-300 font-mono">ALS Resuscitation Crew Onboard</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Ambulance Telemetry</span>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Ambulance className="w-4 h-4 text-amber-400" />
                  <span>{assignedAmb?.plateNumber || 'AMB-01 (ALS Mobile ICU)'}</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">ETA: ~{selectedEmergency?.etaMinutes || 6} mins • Speed: 62 km/h</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Green Corridor Status</span>
                <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Green Wave Preemption Active</span>
                </div>
                <div className="text-[11px] text-slate-400">Route: AJC Bose Road to SSKM Trauma Bay 1</div>
              </div>
            </div>

            {/* Split Screen Video Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* LEFT / MAIN STAGE (8 COLS): Paramedic / EMT Field Camera */}
              <div className="lg:col-span-8 flex flex-col space-y-4">
                
                {/* Main Video Box */}
                <div
                  onClick={(e) => {
                    if (e.target.closest('button') || e.target.closest('input')) return;
                    toggleFullScreen();
                  }}
                  className={`bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl flex flex-col cursor-pointer group transition-all ${
                    isFullScreen ? 'flex-1 min-h-[520px]' : 'aspect-video'
                  }`}
                  title="Click video to toggle Full Screen"
                >
                  
                  {/* Top Video Header HUD */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                    <div className="flex items-center gap-2 pointer-events-auto">
                      <span className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-red-500/40 text-[10px] font-mono font-bold text-red-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <span>{activeCameraFeed === 'bodycam' ? 'EMT CHEST-CAM' : activeCameraFeed === 'ambulance' ? 'OVERHEAD BAY-CAM' : 'PATIENT BIO-CAM'}</span>
                      </span>
                      <span className="px-2 py-1 rounded-xl bg-black/70 text-[10px] font-mono text-slate-300 hidden sm:inline">
                        1080p 60FPS • 22ms
                      </span>
                    </div>

                    {/* Camera Angle Switchers & Fullscreen Toggle */}
                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 pointer-events-auto">
                      <button
                        onClick={() => setActiveCameraFeed('bodycam')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                          activeCameraFeed === 'bodycam' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Body-Cam
                      </button>
                      <button
                        onClick={() => setActiveCameraFeed('ambulance')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                          activeCameraFeed === 'ambulance' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Cabin Bay
                      </button>
                      <button
                        onClick={() => setActiveCameraFeed('patient')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                          activeCameraFeed === 'patient' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Patient Cam
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFullScreen();
                        }}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-cyan-300 hover:text-white bg-slate-800/80 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                        title={isFullScreen ? 'Exit Full Screen [Esc]' : 'Full Screen'}
                      >
                        {isFullScreen ? <Minimize2 className="w-3 h-3 text-cyan-300" /> : <Maximize2 className="w-3 h-3 text-cyan-300" />}
                        <span>{isFullScreen ? 'Exit' : 'Full Screen'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Floating click-to-fullscreen hint */}
                  <span className="absolute bottom-16 right-4 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700 text-[10px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1 z-30">
                    {isFullScreen ? <Minimize2 className="w-3 h-3 text-cyan-300" /> : <Maximize2 className="w-3 h-3 text-cyan-300" />}
                    <span>Click video to {isFullScreen ? 'exit full screen' : 'maximize full screen'}</span>
                  </span>

                  {/* Overlaid Real-Time Telemetry Bar */}
                  <div className="absolute top-12 left-3 right-3 bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-cyan-500/50 text-xs font-mono text-white flex flex-wrap items-center justify-between gap-2 z-10 shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-300 font-bold">{selectedPatient.name}</span>
                      <span>•</span>
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse fill-rose-500" />
                        <span>HR: 116 BPM</span>
                      </span>
                      <span>•</span>
                      <span className="text-cyan-400 font-bold">SpO₂: 92% (15L O2)</span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">BP: 88/56 mmHg (MAP 66)</span>
                      <span>•</span>
                      <span className="text-purple-300 font-bold hidden md:inline">RR: 26 bpm</span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold uppercase animate-pulse">
                      Shock Index 1.32 • Critical
                    </span>
                  </div>

                  {/* Simulated Visual Camera View */}
                  {isCallConnected ? (
                    <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                      
                      {/* Subtle Ambient Scanline Grid */}
                      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>

                      {/* Feed Visualization Content */}
                      {activeCameraFeed === 'bodycam' && (
                        <div className="text-center p-6 space-y-4 max-w-lg z-10 animate-fade-in">
                          <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-teal-900/60 to-slate-900 border-2 border-teal-400/60 flex items-center justify-center shadow-2xl shadow-teal-500/20">
                            <Activity className="w-12 h-12 text-teal-300 animate-pulse" />
                            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-teal-950/80 text-teal-300 border border-teal-700">
                              EMT Chest-Cam • High-Definition Stream Active
                            </span>
                            <h3 className="text-lg font-bold text-white pt-2">Trauma Resuscitation View</h3>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                              Paramedic Rajesh Sharma is securing the C-spine and checking bilateral breath sounds. Cervical rigid collar locked in place.
                            </p>
                          </div>
                        </div>
                      )}

                      {activeCameraFeed === 'ambulance' && (
                        <div className="text-center p-6 space-y-4 max-w-lg z-10 animate-fade-in">
                          <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-900/60 to-slate-900 border-2 border-amber-400/60 flex items-center justify-center shadow-2xl shadow-amber-500/20">
                            <Ambulance className="w-12 h-12 text-amber-300 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-amber-950/80 text-amber-300 border border-amber-700">
                              Ambulance Bay Overhead Camera (Wide-Angle)
                            </span>
                            <h3 className="text-lg font-bold text-white pt-2">ALS Cabin Dual-Operator Feed</h3>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                              EMT Amit Verma managing intravenous infusion line. Paramedic preparing rapid ultrasound and 12-lead telemetry electrodes.
                            </p>
                          </div>
                        </div>
                      )}

                      {activeCameraFeed === 'patient' && (
                        <div className="text-center p-6 space-y-4 max-w-lg z-10 animate-fade-in">
                          <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-cyan-900/60 to-slate-900 border-2 border-cyan-400/60 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
                            <User className="w-12 h-12 text-cyan-300 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700">
                              Patient Monitor & Facial Airway Cam
                            </span>
                            <h3 className="text-lg font-bold text-white pt-2">Close-Up Airway & Thorax Assessment</h3>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                              Airway is clear with high-flow non-rebreather mask. Pupil reaction is equal and reactive. Multiple contusions visible over left chest wall.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Paramedic Audio Sub-HUD with Live Speech Waveform */}
                      <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 z-20 space-y-1.5 shadow-2xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                            <Volume2 className="w-4 h-4 text-teal-400" />
                            <span>Paramedic Rajesh Sharma (Live Audio Channel)</span>
                          </div>
                          <div className="flex items-center gap-1 h-5">
                            {doctorWaveform.map((val, idx) => (
                              <div
                                key={idx}
                                style={{ height: `${val}%` }}
                                className="w-1 bg-teal-400 rounded-full transition-all duration-300"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-200 italic font-sans leading-relaxed">
                          "Dr. Sen, patient Aarav Sharma is responsive to voice. Blunt trauma to thorax and pelvis confirmed. Rigid collar and pelvic binder locked. Large-bore IV running. Left breath sounds reduced. Ready for your STAT orders."
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="flex-1 w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-950 text-slate-400 space-y-3">
                      <div className="p-4 bg-rose-950/60 rounded-full border border-rose-800 text-rose-400">
                        <PhoneOff className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-white">Telemedicine Video Feed Disconnected</h4>
                      <p className="text-xs text-slate-400 max-w-sm">
                        WebRTC medical video connection was paused. Click Reconnect to resume live streaming with the ambulance unit.
                      </p>
                      <button
                        onClick={() => setIsCallConnected(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40"
                      >
                        Reconnect Live Video Feed
                      </button>
                    </div>
                  )}

                </div>

                {/* Video Stage Bottom Quick-Action Shortcuts */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => openDigitalTwinForPatient(selectedEmergency || selectedPatient)}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow transition-all hover:scale-105 active:scale-95 border border-cyan-400/40"
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                      <span>🧬 Launch 3D Digital Twin</span>
                    </button>

                    <button
                      onClick={handleUnlockBreakGlass}
                      className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                        breakGlassUnlocked
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80'
                      }`}
                    >
                      {breakGlassUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{breakGlassUnlocked ? 'Break-Glass Active' : 'Break-Glass EHR Access'}</span>
                    </button>

                    <button
                      onClick={() => {
                        logAudit(doctor.id, 'Doctor', 'VITALS_SNAPSHOT_TAKEN', `Doctor logged vitals snapshot during video conference: HR 116, SpO2 92%, BP 88/56.`);
                        addNotification('Vitals Snapshot Stamped', 'Live biometric telemetry captured and verified into medical audit record.', 'success', 'all');
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1.5"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                      <span>Snapshot Vitals</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Med-Grade HIPAA/DISHA Compliant Stream</span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN (4 COLS): Doctor ER Camera & Directives Console */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                
                {/* Doctor Hospital ER Camera */}
                <div className="bg-slate-950 rounded-2xl border border-blue-500/40 p-3 relative aspect-video flex flex-col items-center justify-center overflow-hidden shadow-xl">
                  {!isDocVideoOff ? (
                    <video
                      ref={localDocVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-2 p-4">
                      <div className="w-14 h-14 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center mx-auto text-blue-300 shadow-lg">
                        <Stethoscope className="w-7 h-7" />
                      </div>
                      <div className="text-xs font-bold text-white">{doctor.name}</div>
                      <div className="text-[10px] text-blue-300">{doctor.specialization}</div>
                      <span className="text-[10px] font-mono text-slate-500 block">Doctor Camera Muted</span>
                    </div>
                  )}

                  <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-blue-300">
                    Trauma Bay 1 • Dr. Ananya Sen
                  </span>

                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isDocMicMuted ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {isDocMicMuted ? 'MIC MUTED' : 'MIC LIVE'}
                  </span>
                </div>

                {/* Real-Time Physician Directives & Verbal Orders Console */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-purple-900/50 flex-1 flex flex-col space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                        Physician Directives & STAT Orders
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                      Live to AMB-01
                    </span>
                  </div>

                  {/* Preset Quick Orders */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">1-Tap STAT Directives:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleTransmitDirective('Administer 1g IV Tranexamic Acid (TXA) over 10 min for suspected pelvic internal bleeding.', 'urgent')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-semibold text-purple-300 text-left truncate transition-all cursor-pointer"
                        title="1g IV TXA in 100mL NS"
                      >
                        💉 1g IV TXA STAT
                      </button>
                      <button
                        onClick={() => handleTransmitDirective('Maintain High-Flow O2 via non-rebreather at 15 L/min. Target SpO2 ≥ 94%.', 'urgent')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-semibold text-cyan-300 text-left truncate transition-all cursor-pointer"
                        title="15L O2 Non-Rebreather"
                      >
                        🫁 15L O2 Non-Rebreather
                      </button>
                      <button
                        onClick={() => handleTransmitDirective('Infuse 500 mL warm Normal Saline under pressure; prepare Trauma Bay 1 for immediate FAST.', 'urgent')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-semibold text-blue-300 text-left truncate transition-all cursor-pointer"
                        title="500mL Saline Bolus"
                      >
                        💧 500mL Saline Bolus
                      </button>
                      <button
                        onClick={() => handleTransmitDirective('Apply rigid C-Spine collar and pelvic binder. Check distal pulses.', 'high')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-semibold text-emerald-300 text-left truncate transition-all cursor-pointer"
                        title="Rigid C-Collar & Pelvic Binder"
                      >
                        🩺 C-Collar & Pelvic Binder
                      </button>
                    </div>
                  </div>

                  {/* Custom Order Composer */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Custom Verbal Order:</span>
                      <div className="flex items-center gap-1">
                        {['urgent', 'high', 'routine'].map(prio => (
                          <button
                            key={prio}
                            onClick={() => setNewDirectivePriority(prio)}
                            className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] cursor-pointer ${
                              newDirectivePriority === prio
                                ? prio === 'urgent' ? 'bg-red-600 text-white' : prio === 'high' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {prio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDirectiveOrder}
                        onChange={(e) => setNewDirectiveOrder(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTransmitDirective(newDirectiveOrder, newDirectivePriority)}
                        placeholder="e.g. Push 50 mcg IV Fentanyl STAT..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handleTransmitDirective(newDirectiveOrder, newDirectivePriority)}
                        className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>

                    {quickOrderSuccess && (
                      <div className="p-2 bg-emerald-950/80 border border-emerald-800 rounded-lg text-[10px] text-emerald-300 animate-fade-in flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{quickOrderSuccess}</span>
                      </div>
                    )}
                  </div>

                  {/* Live Directives Queue */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Orders Queue:</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(teleDirectives || []).map((d) => (
                        <div key={d.id} className="p-2.5 rounded-xl bg-slate-900 border border-purple-900/40 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-mono">{d.time}</span>
                            <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                              d.status === 'Executed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : d.status === 'Active'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}>
                              {d.status}
                            </span>
                          </div>
                          <p className="text-slate-200 leading-snug">{d.order}</p>
                          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                            <span>Author: {d.author || 'Dr. Ananya Sen'}</span>
                            <span className="uppercase text-[9px] font-mono text-purple-400">{d.priority || 'Urgent'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Bottom Telemedicine Action HUD */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsDocMicMuted(!isDocMicMuted)}
                className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isDocMicMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {isDocMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isDocMicMuted ? 'Unmute Doctor Mic' : 'Mute Doctor Mic'}</span>
              </button>

              <button
                onClick={() => setIsDocVideoOff(!isDocVideoOff)}
                className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isDocVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {isDocVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                <span>{isDocVideoOff ? 'Start Doctor Video' : 'Stop Doctor Video'}</span>
              </button>

              <button
                onClick={() => {
                  const feeds = ['bodycam', 'ambulance', 'patient'];
                  const nextIndex = (feeds.indexOf(activeCameraFeed) + 1) % feeds.length;
                  setActiveCameraFeed(feeds[nextIndex]);
                }}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Switch Field Feed</span>
              </button>

              <button
                onClick={() => openDigitalTwinForPatient(selectedEmergency || selectedPatient)}
                className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all hover:scale-105 active:scale-95 border border-cyan-400/40 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-cyan-200 animate-pulse" />
                <span>🧬 3D Digital Twin</span>
              </button>

              <button
                onClick={toggleFullScreen}
                className="px-5 py-3 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/40 text-blue-200 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4 text-cyan-300" /> : <Maximize2 className="w-4 h-4 text-cyan-300" />}
                <span>{isFullScreen ? 'Exit Full Screen [Esc]' : 'Full Screen Mode [⛶]'}</span>
              </button>

              <button
                onClick={() => setIsCallConnected(!isCallConnected)}
                className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl transition-all cursor-pointer ${
                  isCallConnected
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isCallConnected ? <PhoneOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                <span>{isCallConnected ? 'End Tele-Conference' : 'Reconnect Conference'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: EMERGENCIES (QUEUE & DETAILED ALERTS) */}
      {/* ========================================================================= */}
      {portalTab === 'Emergencies' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              Incoming Emergency Alert Details
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review emergency type, severity, patient info, GPS location, ETA, and ambulance status
            </p>
          </div>

          <div className="space-y-4">
            {activeEmergencies.map(emg => (
              <div
                key={emg.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-bold">{emg.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      emg.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {emg.severity}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">• {emg.emergencyType}</span>
                  </div>
                  <div className="text-base font-bold text-white">
                    Patient: {emg.patientName} ({emg.patientAge} yrs, {emg.patientGender}, Blood: {emg.patientBloodGroup})
                  </div>
                  <div className="text-xs text-slate-400">
                    Location: <strong>{emg.location?.address}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block">Ambulance Unit</span>
                    <span className="font-bold text-white">{emg.assignedAmbulanceId || 'En Route'}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block">ETA</span>
                    <span className="font-bold font-mono text-emerald-400 text-base">{emg.etaMinutes || 6}m</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmergencyId(emg.id);
                      setPortalTab('Video Conference');
                    }}
                    className="px-3.5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow border border-emerald-400/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                  >
                    <Video className="w-4 h-4 text-emerald-200" />
                    <span>Video Call</span>
                  </button>
                  <button
                    onClick={() => openDigitalTwinForPatient(emg)}
                    className="px-3.5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow border border-cyan-400/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                  >
                    <Activity className="w-4 h-4 text-cyan-200" />
                    <span>3D Twin</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEmergencyId(emg.id);
                      setPortalTab('Medical Records');
                    }}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow"
                  >
                    View Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: PATIENTS (PATIENT QUEUE & ASSIGNMENTS) */}
      {/* ========================================================================= */}
      {portalTab === 'Patients' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Assigned & Incoming Trauma Patients Queue
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Patients currently assigned to emergency bays and incoming transport units
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map(p => {
              const activeCase = activeEmergencies.find(e => e.patientId === p.id);
              return (
                <div key={p.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">{p.name}</h3>
                      <div className="text-xs text-slate-400">{p.age} yrs • {p.gender} • Blood: <strong className="text-red-400 font-mono">{p.bloodGroup}</strong></div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeCase ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {activeCase ? `Active: ${activeCase.id}` : 'In Observation'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div><strong>Allergies:</strong> <span className="text-rose-300">{p.allergies}</span></div>
                    <div><strong>Conditions:</strong> {p.existingConditions}</div>
                    <div><strong>Current Meds:</strong> <span className="font-mono text-slate-400">{p.currentMedications}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => {
                        const targetEmg = activeEmergencies.find(e => e.patientId === p.id) || activeEmergencies[0];
                        setSelectedEmergencyId(targetEmg.id);
                        setPortalTab('Video Conference');
                      }}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow"
                    >
                      <Video className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Video Call</span>
                    </button>
                    <button
                      onClick={() => openDigitalTwinForPatient(p)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow"
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-200" />
                      <span>3D Twin</span>
                    </button>
                    <button
                      onClick={() => openMedicalQrForPatient(p)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>QR Pass</span>
                    </button>
                    <button
                      onClick={() => {
                        const targetEmg = activeEmergencies.find(e => e.patientId === p.id) || activeEmergencies[0];
                        setSelectedEmergencyId(targetEmg.id);
                        setPortalTab('Medical Records');
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      Access Medical Record
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: MEDICAL RECORDS (AUTHORIZED RECORDS, BREAK-GLASS, NOTES, Rx) */}
      {/* ========================================================================= */}
      {portalTab === 'Medical Records' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Authorized Patient Medical Record & Clinical Orders
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Protected healthcare information with break-glass audit gate and digital prescription orders
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => openDigitalTwinForPatient(selectedEmergency || selectedPatient)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                <span>🧬 3D Digital Twin</span>
              </button>
              <button
                onClick={() => openMedicalQrForPatient(selectedPatient)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/70 text-cyan-300 font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>Scan / View Medical QR</span>
              </button>
              {breakGlassUnlocked ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                  <Unlock className="w-3.5 h-3.5" /> Emergency Access Authorized
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-950 px-3 py-1 rounded-full border border-amber-800">
                  <Lock className="w-3.5 h-3.5" /> Consent Gated Protocol
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: RECORD & BREAK-GLASS GATE */}
            <div className="lg:col-span-1 space-y-4">
              
              {!breakGlassUnlocked ? (
                <div className="p-5 bg-slate-900 border border-amber-500/40 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Emergency Break-Glass Access Gate
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Patient medical history is protected under privacy governance. In trauma and emergency cases where patient consent cannot be actively obtained, attending physicians may override access under emergency medical necessity with audit logging.
                  </p>
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-semibold text-[10px]">Clinical Justification:</label>
                    <input
                      type="text"
                      value={breakGlassReason}
                      onChange={(e) => setBreakGlassReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>
                  <button
                    onClick={handleUnlockBreakGlass}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Authorize Emergency Break-Glass</span>
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl text-xs">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span className="font-bold text-white">Patient Clinical Dossier</span>
                    <span className="font-mono text-emerald-400 font-bold">{selectedPatient.bloodGroup}</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <div className="font-bold text-white text-sm">{selectedPatient.name} ({selectedPatient.age} yrs / {selectedPatient.gender})</div>
                    </div>
                    <div className="p-2.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-200">
                      <span className="font-bold text-rose-400 uppercase text-[10px] block">Severe Allergies:</span>
                      {selectedPatient.allergies}
                    </div>
                    <div>
                      <span className="text-slate-500">Existing Conditions:</span>
                      <div className="text-slate-200 font-semibold">{selectedPatient.existingConditions}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Current Regular Medications:</span>
                      <div className="font-mono text-slate-300">{selectedPatient.currentMedications}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Medical History:</span>
                      <div className="text-slate-400 leading-relaxed">{selectedPatient.medicalHistory}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                    Audit: Logged to MCI / Hospital Tamper-Evident Ledger
                  </div>
                </div>
              )}

              {/* Current Field Vital Signs */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Field Vital Signs & Triage
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Heart Rate</span>
                    <div className="font-bold font-mono text-rose-400 mt-0.5">{selectedEmergency?.triageScore?.heartRate || 114} BPM</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Blood Pressure</span>
                    <div className="font-bold font-mono text-white mt-0.5">{selectedEmergency?.triageScore?.bloodPressure || '100/65'}</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px]">SpO₂ Oxygen</span>
                    <div className="font-bold font-mono text-cyan-400 mt-0.5">{selectedEmergency?.triageScore?.oxygenSaturation || '92%'}</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Consciousness</span>
                    <div className="font-bold text-white mt-0.5">{selectedEmergency?.triageScore?.consciousness || 'Voice Responsive'}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN 2 & 3: CLINICAL ACTIONS, ORDERS & PRESCRIPTION */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* Patient Status Transitioner */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Update Patient Clinical Status</span>
                  <span className="text-slate-400 font-mono">Current: <b className="text-amber-400 uppercase">{selectedEmergency?.status}</b></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Triage', 'Trauma Bay Allocated', 'In Surgery', 'Admitted to ICU', 'Stabilized', 'Completed'].map(st => (
                    <button
                      key={st}
                      onClick={() => handlePatientStatusUpdate(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedEmergency?.status === st
                          ? 'bg-blue-600 text-white border-blue-500 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Digital Prescription Form */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Issue Digital Prescription & Medication Orders</h3>
                </div>

                <form onSubmit={handleCreatePrescription} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Medication Name & Concentration:</label>
                      <input
                        type="text"
                        value={rxMedication}
                        onChange={(e) => setRxMedication(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Dosage:</label>
                      <input
                        type="text"
                        value={rxDosage}
                        onChange={(e) => setRxDosage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Route:</label>
                      <select
                        value={rxRoute}
                        onChange={(e) => setRxRoute(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="IV">IV (Intravenous)</option>
                        <option value="IM">IM (Intramuscular)</option>
                        <option value="Oral">Oral</option>
                        <option value="Inhalation">Inhalation (Nebulizer)</option>
                        <option value="SC">SC (Subcutaneous)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Frequency:</label>
                      <select
                        value={rxFrequency}
                        onChange={(e) => setRxFrequency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="STAT">STAT (Immediate)</option>
                        <option value="TID">TID (Three times daily)</option>
                        <option value="BD">BD (Twice daily)</option>
                        <option value="OD">OD (Once daily)</option>
                        <option value="PRN">PRN (As needed)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Special Clinical Instructions:</label>
                    <input
                      type="text"
                      value={rxInstructions}
                      onChange={(e) => setRxInstructions(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Issue Prescription Order</span>
                    </button>
                  </div>
                </form>

                {/* List of issued prescriptions */}
                {selectedEmergency?.prescriptions && selectedEmergency.prescriptions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Active Issued Orders:</span>
                    {selectedEmergency.prescriptions.map((rx) => (
                      <div key={rx.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white font-mono">{rx.medicationName}</span>
                          <span className="text-slate-400 ml-2">({rx.dosage}, {rx.route}, {rx.frequency})</span>
                          <div className="text-[10px] text-slate-500 mt-0.5">{rx.specialInstructions}</div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono">Issued {rx.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Clinical Notes & Instructions */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Clinical Notes & Treatment Updates
                </h3>

                <form onSubmit={handleAddNote} className="space-y-2 text-xs">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter urgent clinical instructions for trauma bay nurses and EMTs..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Clinical Note</span>
                    </button>
                  </div>
                </form>

                {/* Existing medical notes */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedEmergency?.medicalNotes?.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-blue-400">{n.author}</span>
                        <span className="text-slate-500 font-mono">{n.time}</span>
                      </div>
                      <p className="text-slate-200">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: RESOURCES (HOSPITAL CAPACITY OVERVIEW) */}
      {/* ========================================================================= */}
      {portalTab === 'Resources' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Hospital Emergency Resources & Telemetry ({assignedHospital.name})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity metrics across trauma bays, intensive care units, medical gas, and surgical suites
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* General beds */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Emergency Beds</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  🟢 Available
                </span>
              </div>
              <div className="text-3xl font-black text-white font-mono">{assignedHospital.generalBeds}</div>
              <div className="text-slate-500">Rapid triage & stabilization bays</div>
            </div>

            {/* ICU Beds */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>ICU Beds</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  🟢 Available
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">{assignedHospital.icuBeds}</div>
              <div className="text-slate-500">Critical care with telemetry monitors</div>
            </div>

            {/* Oxygen Status */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Oxygen Reserves</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  {assignedHospital.oxygenStatus === 'Available' ? '🟢 Available' : '🟡 Limited'}
                </span>
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">{assignedHospital.oxygenLitres || 7200}L</div>
              <div className="text-slate-500">Central manifold pipeline pressure OK</div>
            </div>

            {/* Ventilators */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Ventilators</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  🟢 Available
                </span>
              </div>
              <div className="text-3xl font-black text-purple-400 font-mono">{assignedHospital.ventilators}</div>
              <div className="text-slate-500">Mechanical invasive & BiPAP units</div>
            </div>

            {/* Emergency Doctors */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Emergency Doctors</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                  🟢 Active
                </span>
              </div>
              <div className="text-3xl font-black text-blue-400 font-mono">{assignedHospital.doctorsOnDuty}</div>
              <div className="text-slate-500">Surgeons, anesthetists, ER physicians</div>
            </div>

            {/* Operating Rooms */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Operating Rooms</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  🟢 Available
                </span>
              </div>
              <div className="text-3xl font-black text-white font-mono">{assignedHospital.operatingTheatres}</div>
              <div className="text-slate-500">Major trauma & emergency bypass OT</div>
            </div>

            {/* Blood Bank Overview */}
            <div className="sm:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Blood Bank Inventory Units</span>
              <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
                {Object.entries(assignedHospital.bloodBank || {}).map(([grp, units]) => (
                  <div key={grp} className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block">{grp}</span>
                    <span className="font-bold text-red-400 text-sm">{units} units</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: NOTIFICATIONS */}
      {/* ========================================================================= */}
      {portalTab === 'Notifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              Doctor Trauma Alerts & Emergency Notifications
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live updates for new emergency cases, patient arrival countdowns, and critical alerts
            </p>
          </div>

          <div className="space-y-3">
            {doctorNotifications.map(n => (
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

      {/* EDIT DOCTOR PROFILE MODAL */}
      {isEditDocProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl font-black">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Doctor Profile & Medical Credentials</h3>
                  <p className="text-xs text-slate-400">Update medical council registration, specialization, hospital base, and on-duty contacts</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditDocProfileModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Doctor Full Name:</label>
                  <input
                    type="text"
                    value={docProfileForm.name}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Medical Council Reg. Number:</label>
                  <input
                    type="text"
                    value={docProfileForm.registrationNumber}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, registrationNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Primary Specialization:</label>
                  <input
                    type="text"
                    value={docProfileForm.specialization}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, specialization: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Qualifications & Degrees:</label>
                  <input
                    type="text"
                    value={docProfileForm.qualifications}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, qualifications: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Hospital Base / Affiliation:</label>
                  <input
                    type="text"
                    value={docProfileForm.hospitalName}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, hospitalName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Availability / On-Duty Status:</label>
                  <select
                    value={docProfileForm.availability}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, availability: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="On Duty - ER Bay 1">On Duty - ER Bay 1</option>
                    <option value="On Duty - Trauma Resuscitation">On Duty - Trauma Resuscitation</option>
                    <option value="On Duty - Operating Theatre">On Duty - Operating Theatre</option>
                    <option value="On Call - Immediate Response">On Call - Immediate Response</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Direct Professional Contact:</label>
                  <input
                    type="text"
                    value={docProfileForm.professionalContact}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, professionalContact: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Official Clinical Email:</label>
                  <input
                    type="email"
                    value={docProfileForm.email}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Surgical & Trauma Experience:</label>
                  <input
                    type="text"
                    value={docProfileForm.surgicalExperience}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, surgicalExperience: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Shift Schedule & Bay:</label>
                  <input
                    type="text"
                    value={docProfileForm.shiftSchedule}
                    onChange={(e) => setDocProfileForm({ ...docProfileForm, shiftSchedule: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Clinical Scope / Bio Notes:</label>
                <textarea
                  rows={2}
                  value={docProfileForm.bio}
                  onChange={(e) => setDocProfileForm({ ...docProfileForm, bio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditDocProfileModalOpen(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white font-semibold rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Doctor Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
