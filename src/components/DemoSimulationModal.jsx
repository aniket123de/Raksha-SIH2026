import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import confetti from 'canvas-confetti';
import {
  X,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Ambulance,
  Hospital,
  Radio,
  MapPin,
  HeartPulse,
  Zap,
  Activity,
  Stethoscope,
  Building2,
  FileCheck2,
  ArrowRight
} from 'lucide-react';

export const DemoSimulationModal = ({ isOpen, onClose }) => {
  const {
    triggerSOS,
    updateAmbulanceStatus,
    toggleGreenCorridor,
    addDoctorNote,
    setCurrentRole,
    resetToDemoState
  } = useEmergency();

  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = [
    {
      step: 1,
      title: "1. SOS Pressed",
      role: "patient",
      desc: "Citizen in distress presses the large Red Emergency SOS button.",
      actionLabel: "Simulate SOS Press",
      icon: HeartPulse,
      color: "text-red-500",
      execute: () => {
        setCurrentRole('patient');
      }
    },
    {
      step: 2,
      title: "2. Emergency Type Selected",
      role: "patient",
      desc: "Emergency type selected: 'Accident / Polytrauma' with immediate confirmation.",
      actionLabel: "Select Emergency Type",
      icon: AlertTriangle,
      color: "text-amber-500",
      execute: () => {
        setCurrentRole('patient');
      }
    },
    {
      step: 3,
      title: "3. Location Captured",
      role: "patient",
      desc: "GPS location captured at Ring Road Flyover (28.5680° N, 77.2350° E) in DEMO MODE.",
      actionLabel: "Lock Location Telemetry",
      icon: MapPin,
      color: "text-blue-500",
      execute: () => {
        setCurrentRole('patient');
      }
    },
    {
      step: 4,
      title: "4. Emergency Assessment",
      role: "patient",
      desc: "Field assessment records rapid breathing, pulse 114 bpm, and mobility status.",
      actionLabel: "Log Assessment Vitals",
      icon: Activity,
      color: "text-cyan-400",
      execute: () => {
        setCurrentRole('patient');
      }
    },
    {
      step: 5,
      title: "5. Severity Determined",
      role: "patient",
      desc: "Triage algorithm evaluates physiological status and commits 🔴 CRITICAL severity.",
      actionLabel: "Commit Critical Severity",
      icon: AlertTriangle,
      color: "text-rose-500",
      execute: () => {
        setCurrentRole('patient');
      }
    },
    {
      step: 6,
      title: "6. Emergency Created",
      role: "patient",
      desc: "Emergency incident EMG-8821 created and broadcast to Central Command network.",
      actionLabel: "Broadcast Emergency",
      icon: Radio,
      color: "text-purple-500",
      execute: () => {
        setCurrentRole('control-room');
      }
    },
    {
      step: 7,
      title: "7. Nearby Ambulances Queried",
      role: "control-room",
      desc: "Smart matching evaluates fleet proximity, onboard ventilators, and defibrillators.",
      actionLabel: "Run Matching Engine",
      icon: Zap,
      color: "text-amber-400",
      execute: () => {
        setCurrentRole('control-room');
      }
    },
    {
      step: 8,
      title: "8. Ambulance Assigned",
      role: "ambulance",
      desc: "ALS Unit AMB-01 (DL-01-EA-1081) assigned with driver Vikram Singh & Paramedic Ramanathan.",
      actionLabel: "Acknowledge Vehicle Dispatch",
      icon: Ambulance,
      color: "text-amber-400",
      execute: () => {
        updateAmbulanceStatus('AMB-01', 'Assigned');
        setCurrentRole('ambulance');
      }
    },
    {
      step: 9,
      title: "9. Hospital Selected",
      role: "control-room",
      desc: "Apollo Emergency & Critical Care selected based on verified ICU beds and Trauma Bay.",
      actionLabel: "Select Trauma Hospital",
      icon: Building2,
      color: "text-blue-400",
      execute: () => {
        setCurrentRole('control-room');
      }
    },
    {
      step: 10,
      title: "10. Hospital Notified",
      role: "doctor",
      desc: "Hospital alerted. Dr. Ananya Sen prepares Red Bay 1 with rapid blood transfusion line.",
      actionLabel: "Doctor Preps Red Bay",
      icon: Stethoscope,
      color: "text-blue-400",
      execute: () => {
        addDoctorNote('EMG-8821', 'Dr. Ananya Sen', 'Red Trauma Bay prepped. Resuscitation team on immediate standby.');
        setCurrentRole('doctor');
      }
    },
    {
      step: 11,
      title: "11. Ambulance En Route",
      role: "ambulance",
      desc: "Ambulance departs base; traffic signals preemptively synchronize to GREEN along corridor.",
      actionLabel: "Activate Green Corridor Wave",
      icon: Zap,
      color: "text-emerald-400",
      execute: () => {
        updateAmbulanceStatus('AMB-01', 'En Route', 28.5580, 77.2300);
        toggleGreenCorridor('EMG-8821', true);
        setCurrentRole('ambulance');
      }
    },
    {
      step: 12,
      title: "12. Live Tracking",
      role: "patient",
      desc: "Patient and control room monitor live vehicle speed (58 km/h) and countdown ETA: 2 Mins.",
      actionLabel: "Monitor Live GPS Map",
      icon: MapPin,
      color: "text-red-400",
      execute: () => {
        updateAmbulanceStatus('AMB-01', 'Transporting', 28.5490, 77.2550);
        setCurrentRole('patient');
      }
    },
    {
      step: 13,
      title: "13. Hospital Arrival",
      role: "ambulance",
      desc: "Ambulance arrives at Apollo ER Trauma Bay in record time under the Digital Green Wave.",
      actionLabel: "Ambulance Arrives at ER",
      icon: Ambulance,
      color: "text-amber-400",
      execute: () => {
        updateAmbulanceStatus('AMB-01', 'Arrived');
        setCurrentRole('ambulance');
      }
    },
    {
      step: 14,
      title: "14. Emergency Completed",
      role: "hospital",
      desc: "Patient handover completed to trauma surgery team. Incident successfully closed!",
      actionLabel: "Complete Emergency Case",
      icon: CheckCircle2,
      color: "text-emerald-400",
      execute: () => {
        updateAmbulanceStatus('AMB-01', 'Completed');
        setCurrentRole('control-room');
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  ];

  // Auto-play timer
  useEffect(() => {
    let timer;
    if (isPlaying && isOpen) {
      timer = setTimeout(() => {
        if (currentStep < 14) {
          const next = currentStep + 1;
          setCurrentStep(next);
          steps[next - 1].execute();
        } else {
          setIsPlaying(false);
        }
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, isOpen]);

  if (!isOpen) return null;

  const activeStepObj = steps[currentStep - 1];
  const StepIcon = activeStepObj.icon;

  const handleNext = () => {
    if (currentStep < 14) {
      const next = currentStep + 1;
      setCurrentStep(next);
      steps[next - 1].execute();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      steps[prev - 1].execute();
    }
  };

  const handleJumpToStep = (sNum) => {
    setCurrentStep(sNum);
    steps[sNum - 1].execute();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Play className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Raksha Demo Walkthrough</h2>
              <p className="text-xs text-slate-400">14-Step Complete End-to-End Emergency Response Lifecycle</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Step {currentStep} of 14: <strong className="text-white">{activeStepObj.title}</strong></span>
            <span className="text-amber-400 font-bold">{Math.round((currentStep / 14) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 14) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Active Step Card */}
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-inner">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-700 ${activeStepObj.color}`}>
                <StepIcon className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Simulating Role: {activeStepObj.role.toUpperCase()}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeStepObj.title}</h3>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Stage {currentStep}
            </span>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">
            {activeStepObj.desc}
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-slate-900 text-xs">
            <span className="text-slate-400">Target Perspective:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
              Auto-switches to {activeStepObj.role} portal
            </span>
          </div>
        </div>

        {/* 14 Micro Step Indicator Bubbles */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1">
          {steps.map((st) => (
            <button
              key={st.step}
              onClick={() => handleJumpToStep(st.step)}
              className={`h-7 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center ${
                currentStep === st.step
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                  : currentStep > st.step
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-950 text-slate-500 border border-slate-800 hover:bg-slate-800'
              }`}
              title={st.title}
            >
              {st.step}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          
          <button
            onClick={() => {
              if (window.confirm('Reset emergency state to baseline?')) {
                resetToDemoState();
                setCurrentStep(1);
                setIsPlaying(false);
              }
            }}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Baseline</span>
          </button>

          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Auto-Play' : 'Auto-Play Simulation'}</span>
            </button>

            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === 14}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-30 disabled:pointer-events-none transition-all hover:scale-105"
            >
              <span>{currentStep === 14 ? 'Finished' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
