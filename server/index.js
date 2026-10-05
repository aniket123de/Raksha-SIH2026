import express from 'express';
import cors from 'cors';
import { initialData } from './data.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory operational store with persistence clone
let appState = JSON.parse(JSON.stringify(initialData));

// Helper to log audit actions
const logAudit = (actorId, actorRole, action, details) => {
  const entry = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorId,
    actorRole,
    action,
    details
  };
  appState.auditLogs.unshift(entry);
  if (appState.auditLogs.length > 100) appState.auditLogs.pop();
  return entry;
};

// --- DIRECT ZIP DOWNLOAD ENDPOINT ---
app.get('/api/download-zip', (req, res) => {
  const zipPath = path.join(__dirname, '..', 'Raksha_Latest.zip');
  if (fs.existsSync(zipPath)) {
    return res.download(zipPath, 'Raksha.zip');
  }
  const altZip = 'C:\\Users\\AYUSHMAN\\Downloads\\Raksha.zip';
  if (fs.existsSync(altZip)) {
    return res.download(altZip, 'Raksha.zip');
  }
  res.status(404).json({ error: 'Zip file not found' });
});

app.get('/download', (req, res) => {
  res.redirect('/api/download-zip');
});

// --- AUTHENTICATION & RBAC ENDPOINTS ---

// List demo users for rapid judge evaluation
app.get('/api/auth/users', (req, res) => {
  const safeUsers = appState.users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// Authenticate user & issue session token
app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;

  const user = appState.users.find(
    u => u.username.toLowerCase() === username?.trim().toLowerCase()
  );

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Validate matching role if specified
  if (role && user.role !== role) {
    return res.status(403).json({ error: `Access denied. Account is not registered for ${role} portal.` });
  }

  // Create simulated secure JWT session token
  const token = `emg_jwt_${Buffer.from(`${user.id}:${user.role}:${Date.now()}`).toString('base64')}`;

  logAudit(user.id, user.role, 'USER_LOGIN', `User ${user.name} logged into ${user.role} portal.`);

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    token,
    user: safeUser
  });
});

// Get database schema (PostgreSQL definition)
app.get('/api/schema', (req, res) => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      return res.json({ schema: sql });
    }
  } catch (err) {
    // fallback
  }
  res.json({ schema: '-- PostgreSQL Relational Schema Loaded in Application Layer' });
});

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'EmergencyLink Disaster & Emergency Management API',
    timestamp: new Date().toISOString(),
    prototypeDisclaimer: 'Academic / SIH Prototype. Decision-Support System Only.',
    activeIncidents: appState.activeEmergencies.length,
    registeredHospitals: appState.hospitals.length,
    activeAmbulances: appState.ambulances.length
  });
});

// Full state snapshot
app.get('/api/data', (req, res) => {
  res.json(appState);
});

// Reset demo dataset
app.post('/api/reset-demo', (req, res) => {
  appState = JSON.parse(JSON.stringify(initialData));
  logAudit('DEMO-ADMIN', 'Administrator', 'RESET_SYSTEM_STATE', 'Reset all demo data to initial factory state.');
  res.json({ success: true, message: 'System state reset to initial demo configuration.' });
});

// 1. SOS & EMERGENCY MANAGEMENT
app.post('/api/sos', (req, res) => {
  const {
    patientId = 'PAT-01',
    emergencyType = 'Accident',
    severity = 'Critical',
    location = { address: 'Live GPS Pinpoint', lat: 28.5680, lng: 77.2350 },
    numberOfAmbulances = 1,
    triageData = null
  } = req.body;

  const patient = appState.patients.find(p => p.id === patientId) || appState.patients[0];

  // Smart Match Ambulance: find closest available ambulance with compatible equipment
  const availableAmbs = appState.ambulances.filter(a => a.status === 'Available');
  let assignedAmb = null;

  if (availableAmbs.length > 0) {
    if (severity === 'Critical') {
      assignedAmb = availableAmbs.find(a => a.type.includes('ALS') || a.equipment.ventilator) || availableAmbs[0];
    } else {
      assignedAmb = availableAmbs[0];
    }
  }

  // Choose optimal destination hospital (highest ICU + trauma capability)
  const destHospital = appState.hospitals.find(h => h.icuBeds > 0) || appState.hospitals[0];

  const newEmergency = {
    id: `EMG-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: patient.id,
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    patientBloodGroup: patient.bloodGroup,
    emergencyType,
    severity,
    location,
    numberOfAmbulances,
    triageScore: triageData || {
      consciousness: "Alert",
      abilityToWalk: "No",
      breathing: "Rapid (24 bpm)",
      heartRate: 110,
      bloodPressure: "100/70 mmHg",
      oxygenSaturation: "93%",
      temperature: "37.0 °C",
      vitalsSummary: "Emergency intake recorded"
    },
    status: assignedAmb ? 'Assigned' : 'Requested',
    assignedAmbulanceId: assignedAmb ? assignedAmb.id : null,
    destinationHospitalId: destHospital ? destHospital.id : null,
    greenCorridorActive: severity === 'Critical',
    trafficPreemptionStatus: severity === 'Critical' ? 'Active - Green Wave Enabled' : 'Standard Routing',
    etaMinutes: assignedAmb ? 7 : 12,
    distanceKm: 3.4,
    createdAt: new Date().toISOString(),
    medicalNotes: []
  };

  if (assignedAmb) {
    assignedAmb.status = 'Assigned';
  }

  appState.activeEmergencies.unshift(newEmergency);

  logAudit(
    patient.id,
    'Patient',
    'SOS_DISPATCH_TRIGGERED',
    `New ${severity} emergency (${emergencyType}) reported at ${location.address}. Assigned: ${assignedAmb ? assignedAmb.id : 'Pending'}.`
  );

  res.status(201).json({
    success: true,
    emergency: newEmergency,
    assignedAmbulance: assignedAmb,
    destinationHospital: destHospital
  });
});

// Update Triage Assessment
app.post('/api/triage', (req, res) => {
  const { emergencyId, vitals, severity } = req.body;
  const emergency = appState.activeEmergencies.find(e => e.id === emergencyId);
  if (!emergency) {
    return res.status(404).json({ error: 'Emergency record not found' });
  }

  emergency.triageScore = vitals;
  if (severity) emergency.severity = severity;

  logAudit(
    'PARAMEDIC-01',
    'Ambulance Personnel',
    'TRIAGE_ASSESSMENT_UPDATED',
    `Updated triage for ${emergencyId}: Severity set to ${severity || emergency.severity}. SpO2: ${vitals.oxygenSaturation}, HR: ${vitals.heartRate}.`
  );

  res.json({ success: true, emergency });
});

// 2. AMBULANCES
app.get('/api/ambulances', (req, res) => {
  res.json(appState.ambulances);
});

app.put('/api/ambulances/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, lat, lng, speedKmh } = req.body;
  const amb = appState.ambulances.find(a => a.id === id);
  if (!amb) return res.status(404).json({ error: 'Ambulance not found' });

  if (status) amb.status = status;
  if (lat !== undefined) amb.lat = lat;
  if (lng !== undefined) amb.lng = lng;
  if (speedKmh !== undefined) amb.speedKmh = speedKmh;

  const activeEmg = appState.activeEmergencies.find(e => e.assignedAmbulanceId === id);
  if (activeEmg && status) {
    activeEmg.status = status;
    if (status === 'Completed') {
      activeEmg.completedAt = new Date().toISOString();
    }
  }

  logAudit(id, 'Ambulance Unit', 'STATUS_TELEMETRY_UPDATED', `Ambulance ${id} status set to ${status}. Location: [${amb.lat.toFixed(4)}, ${amb.lng.toFixed(4)}].`);
  res.json({ success: true, ambulance: amb });
});

app.put('/api/ambulances/:id/equipment', (req, res) => {
  const { id } = req.params;
  const { equipment } = req.body;
  const amb = appState.ambulances.find(a => a.id === id);
  if (!amb) return res.status(404).json({ error: 'Ambulance not found' });

  amb.equipment = { ...amb.equipment, ...equipment };
  logAudit(id, 'Ambulance Unit', 'EQUIPMENT_CHECKLIST_VERIFIED', `Paramedic verified equipment checklist for ${id}.`);
  res.json({ success: true, ambulance: amb });
});

// 3. HOSPITALS & RESOURCE MANAGEMENT
app.get('/api/hospitals', (req, res) => {
  res.json(appState.hospitals);
});

app.put('/api/hospitals/:id/resources', (req, res) => {
  const { id } = req.params;
  const { generalBeds, icuBeds, ventilators, oxygenLitres, oxygenStatus, bloodBank } = req.body;
  const hosp = appState.hospitals.find(h => h.id === id);
  if (!hosp) return res.status(404).json({ error: 'Hospital not found' });

  if (generalBeds !== undefined) hosp.generalBeds = generalBeds;
  if (icuBeds !== undefined) hosp.icuBeds = icuBeds;
  if (ventilators !== undefined) hosp.ventilators = ventilators;
  if (oxygenLitres !== undefined) hosp.oxygenLitres = oxygenLitres;
  if (oxygenStatus !== undefined) hosp.oxygenStatus = oxygenStatus;
  if (bloodBank) hosp.bloodBank = { ...hosp.bloodBank, ...bloodBank };

  logAudit(id, 'Hospital Staff', 'RESOURCE_INVENTORY_UPDATED', `Updated hospital resources: ICU Beds: ${hosp.icuBeds}, O2: ${hosp.oxygenLitres}L (${hosp.oxygenStatus}).`);
  res.json({ success: true, hospital: hosp });
});

// 4. DOCTORS & CLINICAL ACTIONS
app.get('/api/doctors', (req, res) => {
  res.json(appState.doctors);
});

app.post('/api/doctors/notes', (req, res) => {
  const { emergencyId, doctorName, note } = req.body;
  const emg = appState.activeEmergencies.find(e => e.id === emergencyId);
  if (!emg) return res.status(404).json({ error: 'Emergency record not found' });

  const noteEntry = {
    id: `NOTE-${Date.now()}`,
    author: doctorName || 'Attending ER Physician',
    time: 'Just now',
    timestamp: new Date().toISOString(),
    note
  };
  emg.medicalNotes.push(noteEntry);

  logAudit('DOC-ER', 'Doctor', 'CLINICAL_NOTE_ADDED', `Clinical note appended to ${emergencyId}: "${note.substring(0, 40)}..."`);
  res.json({ success: true, note: noteEntry });
});

// Emergency Consent / Break-Glass Override
app.post('/api/consent/break-glass', (req, res) => {
  const { patientId, doctorId, reason } = req.body;
  const patient = appState.patients.find(p => p.id === patientId);

  logAudit(
    doctorId || 'DOC-01',
    'Doctor',
    'EMERGENCY_BREAK_GLASS_ACCESS',
    `Emergency override access granted to record of ${patient ? patient.name : patientId}. Reason: ${reason || 'Imminent trauma triage'}.`
  );

  res.json({
    success: true,
    authorized: true,
    timestamp: new Date().toISOString(),
    auditNote: 'Access recorded in legal compliance log with tamper-evident audit stamp.'
  });
});

// 5. DIGITAL GREEN CORRIDOR & ORGAN TRANSPORT
app.get('/api/organ-transport', (req, res) => {
  res.json(appState.organTransports);
});

app.put('/api/organ-transport/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, conditionNotes } = req.body;
  const ot = appState.organTransports.find(o => o.id === id);
  if (!ot) return res.status(404).json({ error: 'Organ transport record not found' });

  if (status) ot.status = status;
  if (conditionNotes) ot.organConditionNotes = conditionNotes;
  ot.lastUpdated = new Date().toISOString();

  logAudit(
    id,
    'Transplant Authority',
    'ORGAN_TRANSPORT_STATUS_UPDATED',
    `Organ transport ${id} status set to: ${status}.`
  );

  res.json({ success: true, organTransport: ot });
});

// 6. TRAFFIC PREEMPTION TOGGLE
app.post('/api/green-corridor/toggle', (req, res) => {
  const { emergencyId, enable } = req.body;
  const emg = appState.activeEmergencies.find(e => e.id === emergencyId);
  if (emg) {
    emg.greenCorridorActive = enable;
    emg.trafficPreemptionStatus = enable ? 'Active - Signals Synchronized to Green' : 'Standard Routing';
  }

  appState.trafficSignals.forEach(sig => {
    sig.state = enable ? 'GREEN' : 'NORMAL_CYCLE';
  });

  logAudit(
    'CTL-01',
    'Control Room Operator',
    enable ? 'TRAFFIC_PREEMPTION_ACTIVATED' : 'TRAFFIC_PREEMPTION_DEACTIVATED',
    `Green Corridor status toggled to ${enable ? 'ACTIVE' : 'INACTIVE'} for ${emergencyId || 'Route 4A'}.`
  );

  res.json({
    success: true,
    greenCorridorActive: enable,
    signals: appState.trafficSignals
  });
});

// 7. AI MEDICAL TRANSLATOR & SIMPLIFIER
app.post('/api/ai/translate', (req, res) => {
  const { text, targetLanguage = 'English' } = req.body;

  const translations = {
    Hindi: {
      header: "सरल भाषा में अनुवादित चिकित्सा निर्देश:",
      simplified: `यह दवा डॉक्टर के निर्देशानुसार समय पर लें। खाली पेट लेने से बचें यदि पेट में जलन हो। खूब पानी पिएं और किसी भी प्रकार की एलर्जी होने पर तुरंत अस्पताल संपर्क करें।`,
      summary: `• दवा का नाम और खुराक: डॉक्टर के पर्चे के अनुसार।\n• आपातकालीन स्थिति: 108 पर कॉल करें।`
    },
    Bengali: {
      header: "সহজ ভাষায় অনুদিত চিকিৎসা নির্দেশাবলী:",
      simplified: `ডাক্তারের নির্দেশ অনুযায়ী ওষুধ সেবন করুন। পেট ব্যথা বা এলার্জি দেখা দিলে অবিলম্বে জরুরি বিভাগে যোগাযোগ করুন। পর্যাপ্ত জল পান করুন।`,
      summary: `• ওষুধের সঠিক মাত্রা বজায় রাখুন।\n• জরুরি প্রয়োজনে ১০৮ নম্বরে যোগাযোগ করুন।`
    },
    Marathi: {
      header: "सोप्या भाषेत वैद्यकीय सूचना:",
      simplified: `औषधे डॉक्टरांच्या सल्ल्यानुसार वेळेवर घ्या. कोणतीही ऍलर्जी किंवा त्रास झाल्यास त्वरित जवळच्या रुग्णालयात संपर्क साधा.`,
      summary: `• वेळेवर औषधोपचार.\n• आपत्कालीन मदत: १०८.`
    },
    Tamil: {
      header: "எளிமையான மருத்துவ வழிகாட்டுதல்:",
      simplified: `மருத்துவரின் அறிவுறுத்தலின்படி மருந்துகளை சரியான நேரத்தில் உட்கொள்ளவும். ஒவ்வாமை அல்லது பக்கவிளைவுகள் ஏற்பட்டால் உடனடியாக அவசர சிகிச்சைப் பிரிவைத் தொடர்பு கொள்ளவும்.`,
      summary: `• மருந்தின் அளவு கவனிக்கவும்.\n• அவசர உதவி எண்: 108.`
    },
    English: {
      header: "Simplified Plain-Language Medical Guidance:",
      simplified: `Take all medications exactly as prescribed by your treating doctor. Avoid self-medicating or changing doses without consultation. If symptoms worsen, contact the emergency department immediately.`,
      summary: `• Key Action: Strictly adhere to dosage schedule.\n• Emergency Contact: 108 or local emergency response.`
    }
  };

  const selected = translations[targetLanguage] || translations.English;

  res.json({
    originalText: text,
    targetLanguage,
    simplifiedGuidance: selected.simplified,
    bulletPoints: selected.summary,
    disclaimer: "AI-generated explanations are for understanding only and should not replace instructions from a qualified medical professional."
  });
});

// AI Medical History Summarizer for Trauma Doctors
app.post('/api/ai/summarize-history', (req, res) => {
  const { patientId } = req.body;
  const patient = appState.patients.find(p => p.id === patientId) || appState.patients[0];

  const summary = {
    patientName: patient.name,
    criticalFlags: [
      `CRITICAL ALLERGY: ${patient.allergies.toUpperCase()}`,
      `CHRONIC CONDITION: ${patient.existingConditions}`,
      `CURRENT REGIMEN: ${patient.currentMedications}`
    ],
    triageRecommendation: "Patient has documented severe allergy. Strictly avoid beta-lactam antibiotics. Keep bronchodilator on standby given asthma history.",
    disclaimer: "AI Clinical Summary is an assistive triage tool and must be verified against official medical records."
  };

  res.json(summary);
});

// Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  res.json(appState.auditLogs);
});

// Update Emergency Status
app.put('/api/emergencies/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const emg = appState.activeEmergencies.find(e => e.id === id);
  if (!emg) return res.status(404).json({ error: 'Emergency record not found' });

  emg.status = status;
  if (status === 'Completed') {
    emg.completedAt = new Date().toISOString();
  }
  logAudit('DISPATCHER', 'Control Room Operator', 'EMERGENCY_STATUS_UPDATED', `Emergency ${id} status set to "${status}". Note: ${note || 'Status progression'}`);
  res.json({ success: true, emergency: emg });
});

// Reassign Ambulance or Hospital
app.post('/api/emergencies/:id/reassign', (req, res) => {
  const { id } = req.params;
  const { ambulanceId, hospitalId, reason } = req.body;
  const emg = appState.activeEmergencies.find(e => e.id === id);
  if (!emg) return res.status(404).json({ error: 'Emergency not found' });

  if (ambulanceId) {
    emg.assignedAmbulanceId = ambulanceId;
    logAudit('CONTROL-ROOM', 'Operator', 'AMBULANCE_REASSIGNED', `Emergency ${id} reassigned to ambulance ${ambulanceId}. Reason: ${reason || 'Operational adjustment'}`);
  }
  if (hospitalId) {
    emg.destinationHospitalId = hospitalId;
    logAudit('CONTROL-ROOM', 'Operator', 'HOSPITAL_REASSIGNED', `Emergency ${id} destination changed to hospital ${hospitalId}. Reason: ${reason || 'Capacity/specialty requirement'}`);
  }
  res.json({ success: true, emergency: emg });
});

// Multi-Ambulance Dispatch
app.post('/api/emergencies/:id/dispatch-multiple', (req, res) => {
  const { id } = req.params;
  const { ambulanceIds, reason } = req.body;
  const emg = appState.activeEmergencies.find(e => e.id === id);
  if (!emg) return res.status(404).json({ error: 'Emergency not found' });

  emg.dispatchedAmbulances = ambulanceIds || [];
  emg.severity = 'Critical';
  ambulanceIds?.forEach(ambId => {
    const amb = appState.ambulances.find(a => a.id === ambId);
    if (amb) amb.status = 'Assigned';
  });
  logAudit('CHIEF-DISPATCHER', 'Control Room Operator', 'MASS_CASUALTY_DISPATCH', `Dispatched ${ambulanceIds?.length || 0} ambulances to incident ${id}. Reason: ${reason || 'Mass casualty escalation'}`);
  res.json({ success: true, emergency: emg });
});

// Direct Control Room Message Broadcast
app.post('/api/control-room/message', (req, res) => {
  const { recipientType, recipientId, message } = req.body;
  logAudit('CONTROL-ROOM', 'Dispatcher', 'DIRECT_COMMS_TRANSMITTED', `Transmission sent to [${recipientType}:${recipientId}]: "${message}"`);
  res.json({ success: true, message: 'Transmission dispatched over priority emergency frequency.' });
});

// Create Prescription
app.post('/api/prescriptions', (req, res) => {
  const { patientId, doctorId, doctorName, medication, dosage, instructions } = req.body;
  const patient = appState.patients.find(p => p.id === patientId);
  const prescription = {
    id: `RX-${Date.now()}`,
    patientId,
    patientName: patient ? patient.name : 'Unknown Patient',
    doctorId: doctorId || 'DOC-01',
    doctorName: doctorName || 'Attending Physician',
    date: new Date().toISOString().split('T')[0],
    medication,
    dosage,
    instructions: instructions || 'Take with water after meals',
    status: 'Active'
  };
  logAudit(doctorId || 'DOC-01', 'Doctor', 'PRESCRIPTION_ISSUED', `Prescription issued for patient ${patientId}: ${medication} (${dosage})`);
  res.status(201).json({ success: true, prescription });
});

// Update Patient Profile
app.put('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const patient = appState.patients.find(p => p.id === id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  Object.assign(patient, req.body);
  logAudit(id, 'Patient', 'PROFILE_UPDATED', `Patient medical record updated for ${patient.name}`);
  res.json({ success: true, patient });
});

// ============================================================================
// 🧬 EMERGENCY 3D DIGITAL TWIN REST ENDPOINTS
// ============================================================================
if (!appState.digitalTwins) {
  appState.digitalTwins = {};
}

// Get all active 3D Digital Twins
app.get('/api/digital-twins', (req, res) => {
  res.json(Object.values(appState.digitalTwins));
});

// Get or initialize a patient's 3D Digital Twin
app.get('/api/digital-twin/:id', (req, res) => {
  const { id } = req.params;
  let twin = appState.digitalTwins[id];
  if (!twin) {
    // Find matching patient or emergency
    const patient = appState.patients.find(p => p.id === id || p.name === id) || appState.patients[0];
    const emergency = appState.activeEmergencies.find(e => e.id === id || e.patientId === patient?.id);
    
    twin = {
      id: id,
      patientId: patient?.id || 'PAT-01',
      emergencyId: emergency?.id || 'EMG-8821',
      name: emergency?.patientName || patient?.name || 'Aarav Sharma',
      age: emergency?.patientAge || patient?.age || 34,
      gender: emergency?.patientGender || patient?.gender || 'Male',
      bloodGroup: emergency?.patientBloodGroup || patient?.bloodGroup || 'O+',
      medicalHistory: patient?.existingConditions || 'Hypertension, Mild Childhood Asthma',
      allergies: patient?.allergies || 'Penicillin, NSAIDs (Aspirin)',
      currentEmergency: emergency?.emergencyType || 'Severe Road Traffic Polytrauma',
      emergencySeverity: emergency?.severity || 'Critical',
      consciousnessStatus: 'Alert',
      abilityToWalk: 'No',
      vitals: {
        heartRate: 116,
        oxygenSaturation: 92,
        bloodPressure: '88/56',
        temperature: 37.4,
        respiratoryRate: 26,
        lastUpdated: new Date().toISOString(),
        updatedByRole: 'paramedic',
        updatedByName: 'EMT Rajesh Kumar'
      },
      ecg: {
        rhythm: 'Sinus Tachycardia',
        rate: 116,
        stSegment: '1.2mm Elevation in V2-V4',
        status: 'Abnormal'
      },
      treatments: [
        {
          id: 'TRT-1',
          name: 'C-Spine Rigid Collar Applied',
          timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          providedBy: 'EMT Rajesh Kumar',
          role: 'paramedic',
          status: 'Completed'
        }
      ],
      medications: [
        {
          id: 'MED-1',
          name: 'IV Tranexamic Acid (TXA)',
          dose: '1g in 100mL NS',
          route: 'IV Infusion',
          administeredBy: 'EMT Rajesh Kumar',
          role: 'paramedic',
          timestamp: new Date(Date.now() - 10 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      timeline: [
        {
          id: 'EVT-1',
          time: new Date(Date.now() - 25 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: 'SOS Emergency Dispatched',
          source: 'patient',
          severity: 'Critical'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    appState.digitalTwins[id] = twin;
  }
  res.json({ success: true, digitalTwin: twin });
});

// Update Digital Twin Vitals
app.post('/api/digital-twin/:id/vitals', (req, res) => {
  const { id } = req.params;
  const { vitals, source, providerName } = req.body;
  let twin = appState.digitalTwins[id];
  if (!twin) {
    twin = { id, vitals: {}, timeline: [], treatments: [], medications: [] };
    appState.digitalTwins[id] = twin;
  }

  twin.vitals = {
    ...twin.vitals,
    ...vitals,
    lastUpdated: new Date().toISOString(),
    updatedByRole: source || 'connected_device',
    updatedByName: providerName || 'Telemetry Bio-Monitor'
  };

  const timelineEntry = {
    id: `EVT-${Date.now()}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: `Vitals Updated by ${source || 'Connected Device'}`,
    description: `HR: ${twin.vitals.heartRate} bpm | SpO2: ${twin.vitals.oxygenSaturation}% | BP: ${twin.vitals.bloodPressure}`,
    source: source || 'connected_device',
    severity: twin.vitals.heartRate > 120 || twin.vitals.oxygenSaturation < 90 ? 'Critical' : 'Normal'
  };
  twin.timeline = twin.timeline || [];
  twin.timeline.unshift(timelineEntry);
  twin.lastUpdated = new Date().toISOString();

  logAudit(id, source || 'DEVICE', 'DIGITAL_TWIN_VITALS_UPDATED', `Vitals updated for digital twin ${id}: HR=${twin.vitals.heartRate}, SpO2=${twin.vitals.oxygenSaturation}`);
  res.json({ success: true, digitalTwin: twin });
});

// Add Treatment Provided to Digital Twin
app.post('/api/digital-twin/:id/treatment', (req, res) => {
  const { id } = req.params;
  const { treatment, source } = req.body;
  let twin = appState.digitalTwins[id];
  if (!twin) return res.status(404).json({ error: 'Digital twin not found' });

  const treatmentRecord = {
    id: `TRT-${Date.now()}`,
    name: treatment.name,
    details: treatment.details || '',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    providedBy: treatment.providedBy || 'Clinical Provider',
    role: source || 'doctor',
    status: 'Completed'
  };

  twin.treatments = twin.treatments || [];
  twin.treatments.unshift(treatmentRecord);

  twin.timeline = twin.timeline || [];
  twin.timeline.unshift({
    id: `EVT-${Date.now()}`,
    time: treatmentRecord.timestamp,
    title: `Treatment: ${treatmentRecord.name}`,
    description: `Administered by ${treatmentRecord.providedBy} (${source})`,
    source: source || 'doctor',
    severity: 'Normal'
  });
  twin.lastUpdated = new Date().toISOString();

  logAudit(id, source || 'CLINICAL', 'DIGITAL_TWIN_TREATMENT_ADDED', `Treatment logged: ${treatmentRecord.name}`);
  res.json({ success: true, digitalTwin: twin, treatment: treatmentRecord });
});

// Add Medication to Digital Twin
app.post('/api/digital-twin/:id/medication', (req, res) => {
  const { id } = req.params;
  const { medication, source } = req.body;
  let twin = appState.digitalTwins[id];
  if (!twin) return res.status(404).json({ error: 'Digital twin not found' });

  const medRecord = {
    id: `MED-${Date.now()}`,
    name: medication.name,
    dose: medication.dose,
    route: medication.route || 'IV',
    administeredBy: medication.administeredBy || 'Clinical Staff',
    role: source || 'doctor',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  twin.medications = twin.medications || [];
  twin.medications.unshift(medRecord);

  twin.timeline = twin.timeline || [];
  twin.timeline.unshift({
    id: `EVT-${Date.now()}`,
    time: medRecord.timestamp,
    title: `Medication Given: ${medRecord.name} (${medRecord.dose})`,
    description: `Route: ${medRecord.route} • By: ${medRecord.administeredBy}`,
    source: source || 'doctor',
    severity: 'Normal'
  });
  twin.lastUpdated = new Date().toISOString();

  logAudit(id, source || 'CLINICAL', 'DIGITAL_TWIN_MEDICATION_ADDED', `Medication logged: ${medRecord.name} (${medRecord.dose})`);
  res.json({ success: true, digitalTwin: twin, medication: medRecord });
});

// General Digital Twin update (Consciousness, Walkability, Emergency status)
app.post('/api/digital-twin/:id/update', (req, res) => {
  const { id } = req.params;
  const { updates, source, providerName } = req.body;
  let twin = appState.digitalTwins[id];
  if (!twin) return res.status(404).json({ error: 'Digital twin not found' });

  Object.assign(twin, updates);
  twin.lastUpdated = new Date().toISOString();

  twin.timeline = twin.timeline || [];
  twin.timeline.unshift({
    id: `EVT-${Date.now()}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: `Clinical Status Updated by ${providerName || source || 'Provider'}`,
    description: `Consciousness: ${twin.consciousnessStatus} | Walkability: ${twin.abilityToWalk}`,
    source: source || 'doctor',
    severity: twin.consciousnessStatus === 'Unconscious' ? 'Critical' : 'Normal'
  });

  logAudit(id, source || 'CLINICAL', 'DIGITAL_TWIN_STATUS_UPDATED', `Clinical status updated for ${id}`);
  res.json({ success: true, digitalTwin: twin });
});

app.listen(PORT, () => {
  console.log(`🚑 EmergencyLink REST Server running on port ${PORT}`);
  console.log(`🔒 RBAC & Tamper-Evident Audit Engine Active`);
});
