import React from 'react';
import { Lock, ShieldAlert, CheckCircle2, AlertOctagon, ArrowRight, Ambulance, MapPin, Activity } from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';

/**
 * EmergencyMapLockScreen
 * Displayed when GIS and Navigation maps are locked prior to the patient
 * pressing the SOS button and completing the Emergency SOS Assistance Protocol from the beginning.
 */
export const EmergencyMapLockScreen = ({
  featureName = 'Live GIS Navigation Map',
  portalName = 'Portal',
  themeColor = 'red'
}) => {
  const {
    activeEmergencies,
    switchUserRole,
    setPortalTab
  } = useEmergency();

  const activeSosEmergency = activeEmergencies?.find(e => e.status !== 'Completed' && e.sosPressed);
  const isSosPressed = Boolean(activeSosEmergency?.sosPressed);
  const isAssessmentDone = Boolean(
    activeSosEmergency &&
    (activeSosEmergency.assessmentCompleted ||
     (activeSosEmergency.triageScore &&
      activeSosEmergency.triageScore.consciousness &&
      activeSosEmergency.triageScore.abilityToWalk &&
      activeSosEmergency.triageScore.breathing))
  );

  const handleGoToPatientSos = () => {
    try {
      sessionStorage.setItem('raksha_trigger_wizard_step1', 'true');
    } catch {}
    switchUserRole('patient');
    setPortalTab('SOS');
  };

  const colorStyles = {
    red: {
      border: 'border-red-600/40',
      badgeBg: 'bg-red-950 text-red-400 border-red-800',
      iconBox: 'from-red-600/20 via-slate-900 to-red-950/40 border-red-500/50 shadow-red-950/60 ring-red-500/10',
      iconText: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 ring-1 ring-red-400'
    },
    amber: {
      border: 'border-amber-600/40',
      badgeBg: 'bg-amber-950 text-amber-400 border-amber-800',
      iconBox: 'from-amber-600/20 via-slate-900 to-amber-950/40 border-amber-500/50 shadow-amber-950/60 ring-amber-500/10',
      iconText: 'text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50 ring-1 ring-amber-400'
    },
    emerald: {
      border: 'border-emerald-600/40',
      badgeBg: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      iconBox: 'from-emerald-600/20 via-slate-900 to-emerald-950/40 border-emerald-500/50 shadow-emerald-950/60 ring-emerald-500/10',
      iconText: 'text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 ring-1 ring-emerald-400'
    },
    purple: {
      border: 'border-purple-600/40',
      badgeBg: 'bg-purple-950 text-purple-400 border-purple-800',
      iconBox: 'from-purple-600/20 via-slate-900 to-purple-950/40 border-purple-500/50 shadow-purple-950/60 ring-purple-500/10',
      iconText: 'text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50 ring-1 ring-purple-400'
    }
  };

  const currentTheme = colorStyles[themeColor] || colorStyles.red;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto py-6">
      <div className={`bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 ${currentTheme.border} rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md`}>
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-6">
          {/* Lock Icon Emblem */}
          <div className="relative inline-flex items-center justify-center">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentTheme.iconBox} border-2 flex items-center justify-center shadow-xl ring-4`}>
              <Lock className={`w-12 h-12 ${currentTheme.iconText} drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]`} />
            </div>
            <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-red-600 text-white font-mono font-black text-[10px] tracking-wider uppercase shadow-md shadow-red-900">
              GATED PROTOCOL
            </span>
          </div>

          {/* Header Titles */}
          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${currentTheme.badgeBg} flex items-center gap-1.5`}>
                <ShieldAlert className="w-3.5 h-3.5" />
                {portalName.toUpperCase()} • MAP ACCESS RESTRICTED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {featureName} Locked
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>{featureName}</strong> of the {portalName} can only be accessed after the patient has pressed the <strong>SOS button</strong> and the <strong>Emergency SOS Assistance Protocol</strong> is completed from the beginning.
            </p>
          </div>

          {/* 3-Step Protocol Progress Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 text-left max-w-2xl mx-auto shadow-inner space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span>Access Prerequisites Checklist</span>
              <span className="text-amber-400 font-mono text-[10px]">SOS + Full Protocol Required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Step 1 Status */}
              <div className={`p-3 rounded-xl border transition-all ${
                isSosPressed
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                  : 'bg-red-950/40 border-red-800/60 text-red-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase">1. Trigger SOS</span>
                  {isSosPressed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </div>
                <div className="font-bold text-xs text-white">
                  {isSosPressed ? 'Signal Dispatched' : 'Awaiting SOS Signal'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isSosPressed ? `Incident ${activeSosEmergency?.id || 'Active'}` : 'Patient must press SOS in Patient Portal'}
                </p>
              </div>

              {/* Step 2 Status */}
              <div className={`p-3 rounded-xl border transition-all ${
                isAssessmentDone
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase">2. SOS Protocol</span>
                  {isAssessmentDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="font-bold text-xs text-white">
                  {isAssessmentDone ? 'Protocol Completed' : 'Protocol Pending'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAssessmentDone ? 'Clinical vitals & triage recorded' : 'Complete steps 1 to 4 from beginning'}
                </p>
              </div>

              {/* Step 3 Status */}
              <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 text-slate-400">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase">3. Live GIS Map</span>
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <div className="font-bold text-xs text-slate-300">
                  {featureName}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Unlocks automatically once emergency protocol completes
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-lg mx-auto">
            <button
              type="button"
              onClick={handleGoToPatientSos}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${currentTheme.button}`}
            >
              <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
              <span>🚨 Go to Patient Portal & Complete SOS Protocol from Beginning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyMapLockScreen;
