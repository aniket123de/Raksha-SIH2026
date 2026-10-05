import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { isEmtUser } from '../utils/userRoleUtils';
import {
  X,
  User,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  Ambulance,
  Stethoscope,
  LogOut,
  KeyRound,
  CheckCircle2,
  Lock,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Globe,
  Radio,
  Shield,
  Activity,
  Award
} from 'lucide-react';

export const ProfileModal = () => {
  const {
    currentUser,
    isProfileModalOpen,
    setIsProfileModalOpen,
    logout,
    soundEnabled,
    setSoundEnabled,
    resetToDemoState,
    patients,
    doctors,
    ambulances,
    hospitals,
    setPortalTab
  } = useEmergency();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'settings'

  if (!isProfileModalOpen || !currentUser) return null;

  // Find linked entity
  const patient = patients.find(p => p.id === currentUser.referenceId);
  const doctor = doctors.find(d => d.id === currentUser.referenceId);
  const ambulance = ambulances.find(a => a.id === currentUser.referenceId);
  const hospital = hospitals.find(h => h.id === currentUser.referenceId) || (currentUser.role === 'HOSPITAL' ? hospitals[1] || hospitals[0] : null);
  const isHospital = currentUser.role === 'HOSPITAL' || currentUser.role === 'hospital' || Boolean(hospital);
  const isControlRoom = currentUser.role === 'CONTROL_ROOM' || currentUser.role === 'control-room' || currentUser.role === 'control_room';
  const isParamedic = currentUser.role === 'PARAMEDIC' || currentUser.role === 'paramedic';
  const isEmt = isEmtUser(currentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-slate-200">
        
        {/* Close Button */}
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switch header */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Account Settings</span>
          </button>
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-white text-xl font-bold">
                {currentUser.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">{currentUser.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-400 border border-teal-500/30 font-bold uppercase">
                    {currentUser.designation || (isEmt ? 'Emergency Medical Technician' : (isParamedic ? 'Lead Trauma Paramedic' : currentUser.role))}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {currentUser.id}</span>
                </div>
              </div>
            </div>

            {/* Account Details Card */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Username
                </span>
                <span className="font-mono text-white font-medium">{currentUser.username}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> Email
                </span>
                <span className="font-mono text-slate-200">{currentUser.email || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500" /> Authorization Model
                </span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> RBAC Strict Isolation
                </span>
              </div>

              {/* Linked Role Specifics */}
              {patient && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Blood Group</span>
                    <span className="font-bold text-red-400 font-mono">{patient.bloodGroup}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Phone Number</span>
                    <span className="text-slate-200 font-mono">{patient.phone || currentUser.phone || '+91 98765 43210'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Emergency Contact</span>
                    <span className="text-emerald-400 font-semibold">{patient.emergencyContact}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Critical Allergies</span>
                    <span className="text-rose-400 font-semibold">{patient.allergies}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Existing Conditions</span>
                    <span className="text-slate-200">{patient.existingConditions}</span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setPortalTab('Profile');
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span>Open Complete Patient Profile & Medical Pass</span>
                    </button>
                  </div>
                </>
              )}

              {doctor && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Registration (MCI/DMC)</span>
                    <span className="font-mono text-blue-400 font-bold">{doctor.registrationNumber}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Specialization</span>
                    <span className="text-slate-200">{doctor.specialization}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Qualifications</span>
                    <span className="text-blue-300 font-mono text-[11px]">{doctor.qualifications || 'MBBS, MS, FACS'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Duty Hospital</span>
                    <span className="text-white font-medium">{doctor.hospitalName}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Direct Contact</span>
                    <span className="font-mono text-emerald-400">{doctor.professionalContact || doctor.phone || '+91 11 2692 5858'}</span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setPortalTab('Profile');
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition-all"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Open Complete Doctor Profile & Edit</span>
                    </button>
                  </div>
                </>
              )}

              {ambulance && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Vehicle Registration</span>
                    <span className="font-mono text-amber-400 font-bold">{ambulance.plateNumber}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Vehicle Class</span>
                    <span className="text-amber-300 font-mono text-[11px] font-bold">{ambulance.type || 'Advanced Life Support (ALS)'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Paramedic In-Charge</span>
                    <span className="text-slate-200">{ambulance.paramedicName}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Driver</span>
                    <span className="text-slate-200">{ambulance.driverName} ({ambulance.driverPhone || '+91 98991 12233'})</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Base Facility</span>
                    <span className="text-white">{ambulance.hospitalName}</span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setPortalTab('Profile');
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 transition-all"
                    >
                      <Ambulance className="w-4 h-4" />
                      <span>Open Complete Ambulance Profile & Edit</span>
                    </button>
                  </div>
                </>
              )}

              {/* Hospital Profile Section */}
              {(isHospital && hospital) && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Facility Name</span>
                    <span className="text-white font-bold">{hospital.name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Facility Classification</span>
                    <span className="text-emerald-400 font-bold">{hospital.type} • Level 1 Trauma Center</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">24/7 ER Trauma Hotline</span>
                    <span className="font-mono text-emerald-400 font-bold">{hospital.emergencyHotline}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Direct Switchboard</span>
                    <span className="text-slate-200 font-mono">{hospital.phone}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Live Bed Capacity</span>
                    <span className="font-mono text-white font-bold">{hospital.generalBeds} General / {hospital.icuBeds} ICU</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Clinical Accreditation</span>
                    <span className="text-blue-400 font-medium">NABH & NABL Apex Accredited</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Helipad Status</span>
                    <span className="text-teal-400 font-mono text-[11px] font-bold">🚁 Rooftop Helipad ACTIVE</span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setPortalTab('Profile');
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Open Complete Hospital Profile View</span>
                    </button>
                  </div>
                </>
              )}

              {/* Paramedic / EMT Profile Section */}
              {isParamedic && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Designation</span>
                    <span className="text-teal-300 font-bold">{currentUser.designation || (isEmt ? 'Emergency Medical Technician (EMT)' : 'Lead Trauma Paramedic (ALS)')}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Name</span>
                    <span className="text-white font-bold">{currentUser.name || (isEmt ? 'EMT Amit Verma (Emergency Medical Technician)' : 'Paramedic Rajesh Sharma (ALS Lead)')}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Phone No.</span>
                    <span className="font-mono text-teal-400 font-bold">{currentUser.phone || (isEmt ? '+91 98103 44556' : '+91 98102 33445')}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Years of Experience</span>
                    <span className="text-teal-300 font-bold">{currentUser.yearsOfExperience || (isEmt ? 4 : 9)} Years ({isEmt ? 'EMT-B / EMT-I Field Response & Resuscitation' : 'Pre-hospital EMS & Polytrauma Care'})</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Qualifications</span>
                    <span className="text-slate-200 text-[11px] text-right font-medium max-w-[240px]">
                      {currentUser.qualifications || (isEmt ? 'Diploma in Emergency Medical Services (EMS), Advanced First Responder Certification' : 'B.Sc. in Emergency Medical Technology (EMT), Post-Graduate Diploma in Critical Care & Trauma Management')}
                    </span>
                  </div>
                  <div className="pb-2 border-b border-slate-800/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Certification and Licenses:</span>
                    <div className="flex flex-wrap gap-1">
                      {(currentUser.certificationsAndLicenses || (isEmt ? [
                        "National EMT Registry License #DL-EMT-2021-44109 (Valid 2029)",
                        "AHA BLS (Basic Life Support) Provider",
                        "PHTLS - EMT Provider Certified",
                        "Emergency Vehicle Operations & Defensive Driving",
                        "PEARS Pediatric Emergency Assessment",
                        "ICS-100 Incident Command System"
                      ] : [
                        "National EMS License #DL-EMT-88492 (Valid 2029)",
                        "AHA ACLS (Advanced Cardiac Life Support)",
                        "ITLS (International Trauma Life Support)",
                        "PHTLS",
                        "PALS"
                      ])).map((cert, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pb-2 border-b border-slate-800/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Clinical Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {(currentUser.clinicalSkills || (isEmt ? [
                        "Rapid Primary Trauma Assessment & START Triage",
                        "Airway Adjuncts (OPA / NPA)",
                        "High-Flow Oxygenation Therapy",
                        "Bag-Valve-Mask (BVM) Resuscitation",
                        "C-Spine Immobilization & Cervical Collars",
                        "AED Operations & CPR",
                        "CAT Tourniquet & Hemostasis",
                        "Extremity & Traction Splinting"
                      ] : [
                        "Advanced Airway / Intubation",
                        "IO/IV Vascular Access",
                        "12-Lead ECG Interpretation",
                        "Defibrillation & Cardioversion",
                        "Needle Thoracostomy",
                        "CAT Tourniquet & Hemostasis",
                        "Pelvic Circumferential Compression"
                      ])).map((skill, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setPortalTab('Profile');
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>{isEmt ? 'Open Complete EMT Profile View' : 'Open Complete Paramedic Profile View'}</span>
                    </button>
                  </div>
                </>
              )}

              {/* Control Room Profile Section */}
              {isControlRoom && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Command Station</span>
                    <span className="text-purple-300 font-bold">Raksha Central EOC-01</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Station Node ID</span>
                    <span className="font-mono text-purple-400 font-bold">CTRL-EOC-DEL-01</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Duty Dispatcher</span>
                    <span className="text-white font-bold">Officer Rajeev Kumar</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Operator Badge ID</span>
                    <span className="font-mono text-amber-400 font-bold">CTRL-OP-8924</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Security Clearance</span>
                    <span className="text-emerald-400 font-bold">Level 5 (Tactical Dispatch)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">CAD Dispatch Radio</span>
                    <span className="text-purple-300 font-mono">TETRA Encrypted Ch 1 (156.800 MHz)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Traffic Preemption</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Green Wave ITMS Synchronized
                    </span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setPortalTab('Profile');
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-all"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Open Complete Control Room Profile View</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-4 space-y-4">
              
              {/* Audio siren toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold block">Continuous Emergency Siren</span>
                  <span className="text-slate-400 text-[11px]">Continuous wailing emergency vehicle siren with LFO pitch modulation</span>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    soundEnabled
                      ? 'bg-red-950/80 text-red-300 border-red-500/70 shadow-sm shadow-red-900/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />
                      <span>Siren Active</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Muted</span>
                    </>
                  )}
                </button>
              </div>

              {/* Simulated GPS badge */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div>
                  <span className="text-white font-semibold block">GIS Telemetry Mode</span>
                  <span className="text-slate-400 text-[11px]">Delhi-NCR urban sector network prototype</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                  🧪 DEMO MODE
                </span>
              </div>

              {/* Data Reset */}
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-white font-semibold block mb-1">Reset Demonstration State</span>
                <p className="text-slate-400 text-[11px] mb-2">Restores baseline mock entities for evaluation.</p>
                <button
                  onClick={() => {
                    if (window.confirm('Reset all demo data to baseline state?')) {
                      resetToDemoState();
                      setIsProfileModalOpen(false);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Factory Baseline Data</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Security Audit Note */}
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 my-4 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Every medical record read, resource modification, and emergency dispatch action in this session is signed with tamper-evident audit logs.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              logout();
              setIsProfileModalOpen(false);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-bold rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
