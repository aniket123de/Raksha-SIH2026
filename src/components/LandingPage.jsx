import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  ShieldAlert,
  User,
  Stethoscope,
  Ambulance,
  Building2,
  Radio,
  ArrowRight,
  Shield,
  Zap,
  PhoneCall,
  Activity,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const LandingPage = () => {
  const { openLoginForRole, users, login } = useEmergency();

  const scrollToPortals = () => {
    const el = document.getElementById('vertical-portals-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const portalCards = [
    {
      id: 'patient',
      roleKey: 'PATIENT',
      title: '👤 Patient',
      icon: User,
      iconBg: 'from-red-600 to-rose-700 text-white',
      iconColor: 'text-red-400',
      borderColor: 'border-red-500/30 hover:border-red-500',
      glowColor: 'hover:shadow-red-500/10',
      badge: 'Citizen Emergency Access',
      badgeColor: 'bg-red-950/80 text-red-400 border-red-800/60',
      description: 'Request emergency assistance, track ambulances, view nearby hospitals and access authorized medical information.',
      buttonText: 'Login as Patient',
      buttonBg: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30',
      demoUser: 'patient.rahul',
      demoName: 'Rahul Verma (Patient)'
    },
    {
      id: 'doctor',
      roleKey: 'DOCTOR',
      title: '👨‍⚕️ Doctor',
      icon: Stethoscope,
      iconBg: 'from-blue-600 to-indigo-700 text-white',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30 hover:border-blue-500',
      glowColor: 'hover:shadow-blue-500/10',
      badge: 'Authorized Medical Staff',
      badgeColor: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
      description: 'Receive emergency alerts, view authorized patient information and manage emergency cases.',
      buttonText: 'Login as Doctor',
      buttonBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30',
      demoUser: 'doctor.ananya',
      demoName: 'Dr. Ananya Sen (Trauma Surgeon)'
    },
    {
      id: 'ambulance',
      roleKey: 'AMBULANCE',
      title: '🚑 Ambulance',
      icon: Ambulance,
      iconBg: 'from-yellow-400 to-amber-500 text-slate-950',
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-400/50 hover:border-yellow-300',
      glowColor: 'hover:shadow-yellow-400/20',
      badge: 'EMS & Rapid Transit',
      badgeColor: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/50',
      description: 'Receive emergency requests, navigate to patients and hospitals, and update transport status.',
      buttonText: 'Login as Ambulance',
      buttonBg: 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold shadow-md shadow-yellow-400/25 transition-all',
      demoUser: 'ambulance.vikram',
      demoName: 'Vikram Singh (DL-01-EA-1081)'
    },
    {
      id: 'paramedic',
      roleKey: 'PARAMEDIC',
      title: '🩺 Paramedic / EMT',
      icon: Activity,
      iconBg: 'from-teal-500 to-cyan-600 text-slate-950 font-bold',
      iconColor: 'text-teal-400',
      borderColor: 'border-teal-500/40 hover:border-teal-400',
      glowColor: 'hover:shadow-teal-500/20',
      badge: 'Field Responder & Telemedicine',
      badgeColor: 'bg-teal-950/80 text-teal-300 border-teal-600/50',
      description: 'First responder clinical console: monitor 3D digital patient, stream live vitals telemetry, and conduct real-time video conferencing with emergency doctors.',
      buttonText: 'Login as Paramedic / EMT',
      buttonBg: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/25 transition-all',
      demoUser: 'paramedic.rajesh',
      demoName: 'Paramedic Rajesh Sharma (ALS Lead)'
    },
    {
      id: 'hospital',
      roleKey: 'HOSPITAL',
      title: '🏥 Hospital',
      icon: Building2,
      iconBg: 'from-green-500 to-emerald-400 text-slate-950',
      iconColor: 'text-green-400',
      borderColor: 'border-green-400/50 hover:border-green-300',
      glowColor: 'hover:shadow-green-400/20',
      badge: 'ER & Resource Management',
      badgeColor: 'bg-green-950/80 text-green-300 border-green-500/50',
      description: 'Monitor emergency room intake, manage bed & ICU availability, track inbound ambulance pre-arrivals and medical supplies.',
      buttonText: 'Login as Hospital ER',
      buttonBg: 'bg-green-400 hover:bg-green-300 text-slate-950 font-bold shadow-md shadow-green-400/25 transition-all',
      demoUser: 'hospital.apollo',
      demoName: 'Apollo ER Administrator'
    },
    {
      id: 'control-room',
      roleKey: 'CONTROL_ROOM',
      title: '📡 Control Room',
      icon: Radio,
      iconBg: 'from-purple-600 to-indigo-800 text-white',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/30 hover:border-purple-500',
      glowColor: 'hover:shadow-purple-500/10',
      badge: 'Unified Command & Logistics',
      badgeColor: 'bg-purple-950/80 text-purple-400 border-purple-800/60',
      description: 'Monitor citywide emergencies, coordinate ambulance fleets, manage cross-hospital dispatch and enforce digital green corridors.',
      buttonText: 'Login as Control Room',
      buttonBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30',
      demoUser: 'control.operator',
      demoName: 'Central Dispatcher - Officer Rajeev Kumar'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
      
      {/* Top Status Header */}
      <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-purple-950/60 border-b border-slate-800 py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono">
              Live Emergency Response Network • High-Availability Dispatch Active
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Ambulance: <b className="text-white">108</b></span>
            <span>Emergency: <b className="text-white">112</b></span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-red-500/30 text-red-400 text-xs font-semibold mb-6 shadow-lg shadow-red-950/40">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>Next-Generation Disaster & Emergency Management Network</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-4">
            Raksha<span className="text-red-500">.</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text text-transparent mb-4">
            “Connect. Respond. Save Time.”
          </p>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Connecting patients, doctors, ambulances, hospitals and emergency control rooms for faster emergency response.
          </p>

          {/* Prominent CTA Buttons */}
          <div className="flex items-center justify-center">
            <button
              onClick={scrollToPortals}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-base rounded-xl shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800/80 text-left">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Golden Hour Latency</span>
              <span className="text-xl font-bold text-white font-mono">-42% Response Time</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Digital Green Corridor</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">Organ & Trauma Safe</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Smart AI Triage</span>
              <span className="text-xl font-bold text-blue-400 font-mono">Multilingual Help</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Role-Based Security</span>
              <span className="text-xl font-bold text-purple-400 font-mono">Break-Glass Audit</span>
            </div>
          </div>

        </div>
      </section>

      {/* QUICK 1-CLICK DEMO CREDENTIALS BAR */}
      <section className="bg-slate-900/80 border-b border-slate-800 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Quick Portal Access (1-Click Instant Login):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => login({ username: 'patient.rahul', password: 'password123', role: 'PATIENT' })}
                className="px-2.5 py-1 bg-red-950 text-red-300 hover:bg-red-900 border border-red-800/80 rounded font-medium transition-colors"
              >
                👤 Rahul (Patient)
              </button>
              <button
                onClick={() => login({ username: 'doctor.ananya', password: 'password123', role: 'DOCTOR' })}
                className="px-2.5 py-1 bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-800/80 rounded font-medium transition-colors"
              >
                👨‍⚕️ Dr. Ananya (Doctor)
              </button>
              <button
                onClick={() => login({ username: 'ambulance.vikram', password: 'password123', role: 'AMBULANCE' })}
                className="px-2.5 py-1 bg-yellow-950/80 text-yellow-300 hover:bg-yellow-900 border border-yellow-500/60 rounded font-semibold transition-colors"
              >
                🚑 Vikram (Ambulance)
              </button>
              <button
                onClick={() => login({ username: 'paramedic.rajesh', password: 'password123', role: 'PARAMEDIC' })}
                className="px-2.5 py-1 bg-teal-950/80 text-teal-300 hover:bg-teal-900 border border-teal-500/60 rounded font-semibold transition-colors"
              >
                🩺 Rajesh (Paramedic)
              </button>
              <button
                onClick={() => login({ username: 'emt.amit', password: 'password123', role: 'PARAMEDIC' })}
                className="px-2.5 py-1 bg-teal-950/80 text-teal-300 hover:bg-teal-900 border border-teal-500/60 rounded font-semibold transition-colors"
              >
                🚑 Amit (EMT)
              </button>
              <button
                onClick={() => login({ username: 'hospital.apollo', password: 'password123', role: 'HOSPITAL' })}
                className="px-2.5 py-1 bg-green-950/80 text-green-300 hover:bg-green-900 border border-green-500/60 rounded font-semibold transition-colors"
              >
                🏥 Apollo ER (Hospital)
              </button>
              <button
                onClick={() => login({ username: 'control.operator', password: 'password123', role: 'CONTROL_ROOM' })}
                className="px-2.5 py-1 bg-purple-950 text-purple-300 hover:bg-purple-900 border border-purple-800/80 rounded font-medium transition-colors"
              >
                📡 Dispatch (Control Room)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOUR VERTICAL PORTAL CARDS SECTION (DISPLAYED STRICTLY VERTICALLY ONE BELOW ANOTHER) */}
      <section id="vertical-portals-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Select Your Emergency Portal
          </h2>
          <p className="text-sm text-slate-400">
            Choose a dedicated portal to authenticate. Each portal provides isolated, role-specific tools and views.
          </p>
        </div>

        {/* VERTICAL LIST OF 4 CARDS (EACH CARD STRICTLY VERTICAL) */}
        <div className="flex flex-col space-y-6">
          {portalCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`bg-slate-900/90 border ${card.borderColor} rounded-2xl p-6 sm:p-7 transition-all duration-300 shadow-xl ${card.glowColor} flex flex-col items-stretch gap-5 hover:scale-[1.01]`}
              >
                {/* Vertical Header: Icon + Index + Title + Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center shadow-lg shrink-0`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-slate-500 font-bold">0{idx + 1}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {card.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Vertical Body: Description & Security Note */}
                <div className="space-y-2">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Role-Based Access Control • Full Screen Portal</span>
                  </div>
                </div>

                {/* Vertical Footer: Prominent Full-Width Action Button & Quick Link */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => openLoginForRole(card.id)}
                    className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${card.buttonBg}`}
                  >
                    <span>{card.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {card.id === 'paramedic' ? (
                    <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-mono py-1">
                      <button
                        onClick={() => login({ username: 'paramedic.rajesh', password: 'password123', role: 'PARAMEDIC' })}
                        className="hover:text-teal-300 underline transition-colors"
                      >
                        Demo Paramedic Rajesh
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => login({ username: 'emt.amit', password: 'password123', role: 'PARAMEDIC' })}
                        className="hover:text-teal-300 underline transition-colors"
                      >
                        Demo EMT Amit
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => login({ username: card.demoUser, password: 'password123', role: card.roleKey })}
                      className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1 font-mono transition-colors"
                    >
                      Quick demo as <span className="underline">{card.demoName}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 py-8 px-4 text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="font-bold text-white">Raksha Network</span>
            <span>• Disaster & Emergency Management Network</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Ambulance: <strong className="text-white">108</strong></span>
            <span>Emergency / Disaster: <strong className="text-white">112</strong></span>
            <span>Medical Helpline: <strong className="text-white">102</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
};
