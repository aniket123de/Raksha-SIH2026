import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Clock,
  UserCheck,
  Ambulance,
  Heart,
  Wind,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  X
} from 'lucide-react';

export const EQUIPMENT_DEFINITIONS = [
  {
    key: 'ventilator',
    label: 'Transport ICU Ventilator',
    desc: 'Calibrated circuit, PEEP control, adult/pediatric modes',
    category: 'Airway & Respiration',
    critical: true
  },
  {
    key: 'defibrillator',
    label: 'Biphasic Defibrillator / AED',
    desc: 'Self-test passed, therapy pads connected, battery > 90%',
    category: 'Cardiac & Circulation',
    critical: true
  },
  {
    key: 'oxygenCylinder',
    label: 'Medical Oxygen Cylinder',
    desc: '150 bar / 4500L full reserve, flowmeter functional',
    category: 'Airway & Respiration',
    critical: true
  },
  {
    key: 'suctionUnit',
    label: 'High-Vacuum Suction Unit',
    desc: 'Electric/manual suction, sterile Yankauer catheters ready',
    category: 'Airway & Respiration',
    critical: true
  },
  {
    key: 'cardiacMonitor',
    label: '12-Lead Multi-Parameter Monitor',
    desc: 'SpO2, NIBP, temperature probe, ECG lead cables verified',
    category: 'Cardiac & Circulation',
    critical: true
  },
  {
    key: 'emergencyMeds',
    label: 'Emergency Resuscitation Meds',
    desc: 'Epinephrine, Amiodarone, Atropine, Aspirin, Naloxone ampoules',
    category: 'Pharmacology',
    critical: true
  },
  {
    key: 'traumaKit',
    label: 'Major Trauma Hemorrhage Kit',
    desc: 'Combat Action Tourniquets (CAT), hemostatic gauze, chest seals',
    category: 'Trauma & Wound',
    critical: true
  },
  {
    key: 'stretcher',
    label: 'Hydraulic / Scoop Stretcher',
    desc: 'Restraint straps intact, lock mechanism lubricated',
    category: 'Immobilization',
    critical: false
  },
  {
    key: 'cervicalCollar',
    label: 'Rigid Cervical Extrication Collars',
    desc: 'Multi-size adjustable cervical immobilization collars',
    category: 'Immobilization',
    critical: false
  },
  {
    key: 'bvmResuscitator',
    label: 'Bag-Valve-Mask (BVM) Resuscitator',
    desc: 'Reservoir bag, adult & pediatric face masks, PEEP valve',
    category: 'Airway & Respiration',
    critical: false
  },
  {
    key: 'ivAccessInfusion',
    label: 'IV Access & Pressure Infusion Set',
    desc: '14G/16G/18G cannulas, IV tubing, Ringer Lactate & Normal Saline',
    category: 'Circulation',
    critical: false
  },
  {
    key: 'firstAidKit',
    label: 'Basic First Aid & PPE Pack',
    desc: 'N95 masks, sterile gloves, trauma shears, thermal blankets',
    category: 'PPE & Support',
    critical: false
  }
];

export const PreTreatmentEquipmentChecklist = ({
  ambulanceId = null,
  ambulance = null,
  emergency = null,
  canEdit = false,
  compact = false,
  title = "Pre-Treatment Equipment Readiness Checklist",
  onClose = null
}) => {
  const {
    ambulances,
    updateAmbulanceEquipment,
    currentUser,
    currentRole
  } = useEmergency();

  // Find target ambulance
  const targetAmb = ambulance || ambulances.find(a => a.id === ambulanceId) || ambulances[0];
  const equipment = targetAmb?.equipment || {
    ventilator: true,
    defibrillator: true,
    oxygenCylinder: true,
    suctionUnit: true,
    cardiacMonitor: true,
    emergencyMeds: true,
    traumaKit: true,
    stretcher: true,
    cervicalCollar: true,
    bvmResuscitator: true,
    ivAccessInfusion: true,
    firstAidKit: true
  };

  const [activeCategory, setActiveCategory] = useState('All');
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);

  // Compute metrics
  const totalItems = EQUIPMENT_DEFINITIONS.length;
  const verifiedCount = EQUIPMENT_DEFINITIONS.filter(def => equipment[def.key] !== false).length;
  const isFullyReady = verifiedCount === totalItems;
  const readinessPercent = Math.round((verifiedCount / totalItems) * 100);

  // Critical item count
  const criticalItems = EQUIPMENT_DEFINITIONS.filter(d => d.critical);
  const criticalReadyCount = criticalItems.filter(d => equipment[d.key] !== false).length;
  const allCriticalReady = criticalReadyCount === criticalItems.length;

  const handleToggleItem = (key) => {
    if (!canEdit) return;
    const currentVal = equipment[key] !== false;
    const updated = { [key]: !currentVal };
    const verifier = currentUser?.name || (currentRole === 'paramedic' ? 'EMT Paramedic' : 'Ambulance Crew');
    updateAmbulanceEquipment(targetAmb.id, updated, verifier);
  };

  const handleVerifyAll = () => {
    if (!canEdit) return;
    const allVerified = {};
    EQUIPMENT_DEFINITIONS.forEach(def => {
      allVerified[def.key] = true;
    });
    const verifier = currentUser?.name || 'Lead Paramedic';
    updateAmbulanceEquipment(targetAmb.id, allVerified, `${verifier} (100% Sign-Off)`);
  };

  const categories = ['All', 'Airway & Respiration', 'Cardiac & Circulation', 'Trauma & Wound', 'Immobilization', 'Pharmacology'];

  const filteredItems = EQUIPMENT_DEFINITIONS.filter(item => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (filterMissingOnly && equipment[item.key] !== false) return false;
    return true;
  });

  // Allowed viewer roles badge
  const viewerBadge = currentRole === 'hospital' 
    ? 'Hospital ER Resuscitation View' 
    : (currentRole === 'control-room' || currentRole === 'control_room')
      ? 'Control Room Dispatch View'
      : (currentRole === 'paramedic' ? 'Paramedic / EMT Workspace' : 'Ambulance Unit Console');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      
      {/* HEADER & FLEET SPECS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        
        <div className="flex items-start gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
            <Ambulance className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {title}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {viewerBadge}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-portal telemetry: Synchronized across <strong>Ambulance Crew</strong>, <strong>Paramedic/EMT</strong>, <strong>Hospital ER</strong>, and <strong>Control Room Dispatch</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2 font-mono">
              <span>Unit: <strong className="text-amber-400">{targetAmb.plateNumber || targetAmb.id}</strong></span>
              <span>•</span>
              <span>Type: <strong className="text-white">{targetAmb.type}</strong></span>
              <span>•</span>
              <span>Medic: <strong className="text-slate-200">{targetAmb.paramedicName || 'Assigned Paramedic'}</strong></span>
            </div>
          </div>
        </div>

        {/* Readiness Score Card */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">Readiness:</span>
              <span className={`text-base font-black font-mono ${isFullyReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {readinessPercent}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                isFullyReady
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : allCriticalReady
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
              }`}>
                {isFullyReady ? '100% ALS Mission Ready' : (allCriticalReady ? 'Critical Ready (Partial Non-Critical)' : '⚠️ Critical Item Missing')}
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-black text-sm">
            {verifiedCount}/{totalItems}
          </div>
        </div>

      </div>

      {/* FILTER BUTTONS & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Edit or Verify Button (If paramedic or crew) */}
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <button
              onClick={handleVerifyAll}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all hover:scale-105 active:scale-95"
              title="Quickly mark all equipment items verified for this mission"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Verify All Equipment</span>
            </button>
          )}

          {!canEdit && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified by Paramedic Crew</span>
            </span>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* EQUIPMENT ITEMS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map(item => {
          const isVerified = equipment[item.key] !== false;

          return (
            <div
              key={item.key}
              onClick={() => canEdit && handleToggleItem(item.key)}
              className={`p-3.5 rounded-2xl border transition-all ${
                isVerified
                  ? 'bg-slate-950 border-emerald-900/60 hover:border-emerald-700/80'
                  : 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700/80'
              } ${canEdit ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs leading-tight">
                      {item.label}
                    </span>
                    {item.critical && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-red-950 text-red-300 border border-red-800 font-mono">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    {item.desc}
                  </p>
                  <span className="text-[9px] font-mono text-slate-500 block pt-0.5">
                    {item.category}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0 pt-0.5">
                  {isVerified ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500 flex items-center justify-center shadow-sm">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className={isVerified ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
                  {isVerified ? 'VERIFIED ONBOARD ✓' : 'NOT VERIFIED / MISSING'}
                </span>
                {canEdit && (
                  <span className="text-slate-500 hover:text-amber-400">
                    Click to Toggle
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER SYNC STATUS & AUDIT TRAIL */}
      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last Verified: {targetAmb?.equipmentLastChecked ? new Date(targetAmb.equipmentLastChecked).toLocaleTimeString() : 'Current Shift Pre-Trip'}</span>
          <span>•</span>
          <span>By: <strong className="text-slate-200">{targetAmb?.equipmentVerifiedBy || 'EMS Paramedic'}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300">Live Synchronized with Hospital ER & Control Room</span>
        </div>
      </div>

    </div>
  );
};
