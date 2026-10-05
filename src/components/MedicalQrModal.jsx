import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  Printer,
  Shield,
  HeartPulse,
  AlertTriangle,
  Phone,
  User,
  Pill,
  FileText,
  CheckCircle2,
  Copy,
  ExternalLink,
  Scan,
  RefreshCw
} from 'lucide-react';

export const MedicalQrModal = ({ isOpen, onClose, patient, allPatients, onSelectPatient }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [activeTab, setActiveTab] = useState('view-qr'); // 'view-qr' | 'scanner'
  const [copied, setCopied] = useState(false);
  const [scannedPatient, setScannedPatient] = useState(null);
  const [simulatingScan, setSimulatingScan] = useState(false);

  const currentPatient = patient || (allPatients && allPatients[0]) || {
    id: 'PAT-01',
    name: 'Rahul Verma',
    age: 34,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+91 98765 43210',
    emergencyContact: 'Priya Verma (Wife) - +91 98765 43211',
    allergies: 'Penicillin, Aspirin (Severe Anaphylaxis)',
    existingConditions: 'Type-2 Diabetes, Mild Hypertension',
    currentMedications: 'Metformin 500mg BD, Telmisartan 40mg OD',
    medicalHistory: 'Prior appendectomy (2018). No known cardiac history. Mild seasonal asthma.'
  };

  // Generate QR Code data URL whenever current patient changes
  useEffect(() => {
    if (!currentPatient) return;

    // Structured emergency health payload
    const emergencyPayload = JSON.stringify({
      app: 'Raksha Emergency Response',
      type: 'EMERGENCY_MEDICAL_PROFILE',
      patientId: currentPatient.id,
      name: currentPatient.name,
      bloodGroup: currentPatient.bloodGroup,
      allergies: currentPatient.allergies,
      conditions: currentPatient.existingConditions,
      medications: currentPatient.currentMedications,
      emergencyContact: currentPatient.emergencyContact,
      medicalHistory: currentPatient.medicalHistory,
      verificationUrl: `${window.location.origin}/?scanMedical=${currentPatient.id}`,
      generatedAt: new Date().toISOString()
    });

    QRCode.toDataURL(emergencyPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#020617', // slate-950
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate medical QR code', err);
      });
  }, [currentPatient]);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const summary = `RAKSHA EMERGENCY MEDICAL RECORD
Patient: ${currentPatient.name} (${currentPatient.id})
Age/Gender: ${currentPatient.age} yrs / ${currentPatient.gender}
Blood Group: ${currentPatient.bloodGroup}
Critical Allergies: ${currentPatient.allergies}
Existing Conditions: ${currentPatient.existingConditions}
Current Medications: ${currentPatient.currentMedications}
Emergency Contact: ${currentPatient.emergencyContact}
Medical History: ${currentPatient.medicalHistory}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Raksha_Medical_QR_${currentPatient.id}_${currentPatient.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateScan = (targetPatient) => {
    setSimulatingScan(true);
    setTimeout(() => {
      setScannedPatient(targetPatient || currentPatient);
      setSimulatingScan(false);
      setActiveTab('scanned-view');
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-slate-200 my-8">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950/50 shrink-0">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Emergency Medical QR Pass</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                Verified EHR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant offline-accessible medical history for paramedics, doctors, and first responders
            </p>
          </div>
        </div>

        {/* Sub-Tabs: View QR Code vs Scan QR Simulator */}
        <div className="flex items-center gap-2 mb-6 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('view-qr')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'view-qr'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Patient QR Pass</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'scanner'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>First Responder QR Scanner</span>
          </button>

          {scannedPatient && (
            <button
              onClick={() => setActiveTab('scanned-view')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'scanned-view'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-emerald-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>Decrypted EHR Record</span>
            </button>
          )}
        </div>

        {/* TAB 1: VIEW PATIENT QR PASS */}
        {activeTab === 'view-qr' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* QR Code Presentation Box */}
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-2xl space-y-3 text-slate-950 border-4 border-purple-500/30">
                <div className="flex items-center justify-between w-full px-2 text-xs font-black uppercase tracking-wider text-slate-600">
                  <span>Raksha Health ID</span>
                  <span className="font-mono text-red-600 font-bold">{currentPatient.bloodGroup}</span>
                </div>

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Emergency QR for ${currentPatient.name}`}
                    className="w-56 h-56 rounded-xl border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating secure QR code...
                  </div>
                )}

                <div className="text-center space-y-0.5">
                  <div className="font-black text-slate-900 text-base">{currentPatient.name}</div>
                  <div className="font-mono text-xs text-slate-500">ID: {currentPatient.id}</div>
                  <div className="text-[10px] text-red-600 font-bold uppercase tracking-tight">
                    Scan with any phone / CAD terminal
                  </div>
                </div>
              </div>

              {/* High-Priority Health Summary Card */}
              <div className="space-y-4 text-xs">
                
                {/* Blood Group & Vitals Callout */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Blood Group</span>
                    <span className="text-2xl font-black font-mono text-red-400">{currentPatient.bloodGroup}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Age / Gender</span>
                    <span className="text-sm font-bold text-white">{currentPatient.age} yrs • {currentPatient.gender}</span>
                  </div>
                </div>

                {/* Critical Allergies Banner */}
                <div className="p-3.5 bg-red-950/70 border border-red-800/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Critical Allergies / Contraindications:</span>
                  </div>
                  <p className="text-xs text-rose-200 font-semibold">{currentPatient.allergies}</p>
                </div>

                {/* Existing Conditions */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block font-semibold">Existing Conditions:</span>
                  <p className="text-slate-200 font-medium mt-0.5">{currentPatient.existingConditions}</p>
                </div>

                {/* Regular Medications */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block font-semibold">Regular Medications:</span>
                  <p className="text-amber-300 font-mono text-[11px] mt-0.5">{currentPatient.currentMedications}</p>
                </div>

                {/* Emergency Contact */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Emergency Contact:</span>
                    <span className="text-emerald-400 font-bold text-xs">{currentPatient.emergencyContact}</span>
                  </div>
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>

              </div>

            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadQr}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/50 flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Pass (PNG)</span>
                </button>

                <button
                  onClick={handleCopySummary}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print Card</span>
                </button>
              </div>

              {/* Direct Simulation of QR Scan */}
              <button
                onClick={() => handleSimulateScan(currentPatient)}
                disabled={simulatingScan}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
              >
                {simulatingScan ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning QR...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>Simulate Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FIRST RESPONDER QR SCANNER */}
        {activeTab === 'scanner' && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Scan className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">First Responder Emergency Scanner</h3>
                <p className="text-slate-400 max-w-md mx-auto mt-1">
                  Ambulance paramedics and ER trauma teams can instantly decode a patient's physical emergency QR sticker, wristband, or digital lock screen pass.
                </p>
              </div>

              {/* Simulated camera viewfinder */}
              <div className="relative max-w-sm mx-auto h-48 bg-slate-900 border-2 border-dashed border-purple-500/50 rounded-2xl flex flex-col items-center justify-center overflow-hidden p-4">
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 animate-pulse shadow-lg shadow-red-500" />
                <span className="text-slate-400 text-[11px] z-10 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                  Align patient QR code within frame
                </span>
                <span className="text-[10px] text-purple-400 mt-2 z-10 font-mono">
                  Camera Lens Active • AI Decoder Ready
                </span>
              </div>

              {/* Choose Patient to Scan in Demo */}
              <div className="space-y-2 pt-2 text-left max-w-md mx-auto">
                <label className="text-slate-400 font-semibold block text-[11px]">
                  Select Patient to Scan from Active Database:
                </label>
                <div className="space-y-2">
                  {(allPatients || [currentPatient]).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSimulateScan(p)}
                      className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/60 rounded-xl cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 font-bold font-mono flex items-center justify-center text-xs">
                          {p.bloodGroup}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400">Allergies: {p.allergies}</div>
                        </div>
                      </div>

                      <button className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] rounded-lg">
                        Scan Pass
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: DECRYPTED RECORD VIEW (PARAMEDIC / DOCTOR INTERFACE) */}
        {activeTab === 'scanned-view' && scannedPatient && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white text-sm">Emergency Medical History Decrypted</span>
                  <p className="text-[11px] text-emerald-300">
                    Cryptographic signature validated via Raksha Health Exchange. Timestamp: Just now.
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-emerald-900/80 text-emerald-200 border border-emerald-700 rounded-lg">
                ID: {scannedPatient.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-[11px] uppercase font-bold text-slate-400 block border-b border-slate-800 pb-1.5">
                  Patient Identity & Blood Type
                </span>
                <div className="text-base font-bold text-white">{scannedPatient.name}</div>
                <div className="text-slate-300">Age: <strong>{scannedPatient.age}</strong> • Gender: <strong>{scannedPatient.gender}</strong></div>
                <div>
                  <span className="text-slate-400">Blood Group: </span>
                  <span className="text-lg font-black font-mono text-red-400">{scannedPatient.bloodGroup}</span>
                </div>
                <div className="pt-2 border-t border-slate-900 text-slate-300">
                  <span className="text-slate-400">Phone: </span>
                  <span className="font-mono">{scannedPatient.phone}</span>
                </div>
              </div>

              <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl space-y-2">
                <span className="text-[11px] uppercase font-bold text-rose-400 block border-b border-rose-900/60 pb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Critical Allergies & Contraindications
                </span>
                <div className="font-bold text-white text-sm mt-1">{scannedPatient.allergies}</div>
                <p className="text-[11px] text-rose-300">
                  Caution: Administer alternative analgesics and antibiotics. Avoid cross-reactive beta-lactams.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 block border-b border-slate-800 pb-1.5">
                  Existing Chronic Conditions
                </span>
                <p className="text-slate-200 font-semibold">{scannedPatient.existingConditions}</p>
                <div className="pt-2 text-slate-400 text-[11px]">
                  <span>Regular Medications: </span>
                  <span className="font-mono text-amber-300">{scannedPatient.currentMedications}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 block border-b border-slate-800 pb-1.5">
                  Verified Medical History Summary
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {scannedPatient.medicalHistory}
                </p>
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-slate-400">Emergency Kin: </span>
                  <span className="font-bold text-emerald-400">{scannedPatient.emergencyContact}</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveTab('view-qr')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl"
              >
                Back to QR Pass
              </button>
              <button
                onClick={handleCopySummary}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy to Clinical Triage Chart</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
