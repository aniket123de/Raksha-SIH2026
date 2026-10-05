import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { X, Activity, AlertTriangle, ShieldCheck, Wind, Thermometer, UserCheck, Info } from 'lucide-react';

export const TriageModal = ({ isOpen, onClose, onSave, initialVitals }) => {
  const [consciousness, setConsciousness] = useState(initialVitals?.consciousness || 'Alert');
  const [abilityToWalk, setAbilityToWalk] = useState(initialVitals?.abilityToWalk || 'No (Severe trauma)');
  const [breathing, setBreathing] = useState(initialVitals?.breathing || 'Rapid / Labored (26 bpm)');
  const [heartRate, setHeartRate] = useState(initialVitals?.heartRate || '');
  const [bloodPressure, setBloodPressure] = useState(initialVitals?.bloodPressure || '');
  const [oxygenSaturation, setOxygenSaturation] = useState(initialVitals?.oxygenSaturation || '');
  const [temperature, setTemperature] = useState(initialVitals?.temperature || '');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  // Calculate live triage assessment
  const triageResult = aiService.evaluateTriage({
    consciousness,
    abilityToWalk,
    breathing,
    heartRate,
    oxygenSaturation
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!consciousness || !abilityToWalk || !breathing) {
      setFormError('Please select all mandatory fields: Consciousness, Ability to Walk, and Breathing Status.');
      return;
    }
    setFormError('');

    const hrStr = heartRate ? `HR ${heartRate} bpm` : null;
    const spo2Str = oxygenSaturation ? `SpO2 ${oxygenSaturation}` : null;
    const summary = [
      `${triageResult.severity} triage`,
      consciousness,
      abilityToWalk ? `Mobility: ${abilityToWalk}` : null,
      breathing,
      hrStr,
      spo2Str
    ].filter(Boolean).join(' • ');

    onSave({
      consciousness,
      abilityToWalk,
      breathing,
      heartRate: heartRate ? Number(heartRate) : null,
      bloodPressure: bloodPressure || '',
      oxygenSaturation: oxygenSaturation || '',
      temperature: temperature || '',
      vitalsSummary: summary
    }, triageResult.severity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scale-up">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white">Emergency Triage Assessment</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Field vital signs and physiological status evaluation for ambulance and hospital readiness.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Severity Outcome Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${triageResult.badgeColor}`}>
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider font-bold opacity-80">Calculated Triage Severity</span>
            <div className="text-xl font-extrabold">{triageResult.severity.toUpperCase()}</div>
          </div>
          <div className="text-right text-xs">
            <span className="font-mono font-bold text-sm">Score: {triageResult.score} / 12</span>
            <div className="text-[10px] opacity-75">Triage Support System</div>
          </div>
        </div>

        {/* Notice: Core Assessment Fields Mandatory */}
        <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-white">Emergency Assessment Protocol:</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Core triage fields (Consciousness, Ability to Walk, and Breathing) are <strong>mandatory</strong>. All numeric vital signs and temperature are <strong>optional</strong>.
            </p>
          </div>
        </div>

        {/* Validation Error Alert */}
        {formError && (
          <div className="p-3 bg-red-950/90 border border-red-500 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Consciousness - MANDATORY */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Consciousness (AVPU)</span>
                  <span className="text-red-400 font-bold text-[10px] uppercase bg-red-950/90 border border-red-800 px-1.5 py-0.2 rounded">* Mandatory</span>
                </label>
              </div>
              <select
                value={consciousness}
                onChange={(e) => {
                  setConsciousness(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              >
                <option value="Alert">Alert (Fully conscious)</option>
                <option value="Voice Responsive">Voice Responsive (Drowsy)</option>
                <option value="Pain Only">Pain Only (Stupor)</option>
                <option value="Unresponsive">Unresponsive (Comatose)</option>
              </select>
            </div>

            {/* Mobility - MANDATORY */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <span>Ability to Walk / Ambulatory</span>
                  <span className="text-red-400 font-bold text-[10px] uppercase bg-red-950/90 border border-red-800 px-1.5 py-0.2 rounded">* Mandatory</span>
                </label>
              </div>
              <select
                value={abilityToWalk}
                onChange={(e) => {
                  setAbilityToWalk(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              >
                <option value="Yes">Yes (Normal)</option>
                <option value="Assisted">Assisted (Needs support)</option>
                <option value="No (Severe trauma)">No (Severe trauma / Immobilized)</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Breathing - MANDATORY */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Breathing Status</span>
                  <span className="text-red-400 font-bold text-[10px] uppercase bg-red-950/90 border border-red-800 px-1.5 py-0.2 rounded">* Mandatory</span>
                </label>
              </div>
              <select
                value={breathing}
                onChange={(e) => {
                  setBreathing(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              >
                <option value="Normal (16-20 bpm)">Normal (16-20 bpm)</option>
                <option value="Rapid / Labored (26 bpm)">Rapid / Labored (&gt; 24 bpm)</option>
                <option value="Slow / Shallow (<10 bpm)">Slow / Shallow (&lt; 10 bpm)</option>
                <option value="Absent / Respiratory Arrest">Absent / Respiratory Arrest</option>
              </select>
            </div>

            {/* Heart Rate - OPTIONAL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  <span>Heart Rate (BPM)</span>
                  <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={heartRate}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setHeartRate(val === '' ? '' : Number(val));
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:outline-none font-mono placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Type BPM (e.g. 110)"
              />
            </div>

            {/* Oxygen SpO2 - OPTIONAL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Oxygen Saturation (SpO2)</span>
                  <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
              </div>
              <input
                type="text"
                value={oxygenSaturation}
                onChange={(e) => setOxygenSaturation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:outline-none font-mono placeholder:text-slate-600"
                placeholder="Optional (e.g. 92%)"
              />
            </div>

            {/* Blood Pressure - OPTIONAL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Blood Pressure (mmHg)</span>
                  <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
              </div>
              <input
                type="text"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:outline-none font-mono placeholder:text-slate-600"
                placeholder="Optional (e.g. 110/70)"
              />
            </div>

            {/* Temperature - OPTIONAL */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Body Temperature</span>
                  <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
              </div>
              <input
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:outline-none font-mono placeholder:text-slate-600"
                placeholder="Optional (e.g. 37.0 °C)"
              />
            </div>

          </div>

          {/* Legal Non-Diagnosis Disclaimer */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Clinical Notice:</strong> This emergency assessment is a preliminary triage prioritization tool. It does <strong>NOT</strong> constitute a definitive medical diagnosis and must be confirmed by attending emergency medical staff.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/40 transition-all hover:scale-105 active:scale-95"
            >
              Confirm & Transmit Triage
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
