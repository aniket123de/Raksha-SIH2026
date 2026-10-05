/**
 * Raksha Emergency 3D Digital Twin Engine
 * 
 * Maintains a continuously updated, real-time physiological & anatomical
 * digital twin representation of every emergency patient.
 * 
 * Tracks:
 * - Demographics: Name, Age, Gender, Blood Group
 * - Clinical Baseline: Medical History, Allergies, Chronic Conditions
 * - Emergency Context: Current Emergency, Severity, Description
 * - Functional State: Conscious / Unconscious Status, Ability to Walk
 * - Live Vitals: Heart Rate, SpO2, Blood Pressure, Temperature, Respiratory Rate
 * - ECG Information: 12-lead rhythm, ST segment elevation, telemetry lead status
 * - Interventions: Treatments Provided, Medicines Administered
 * - Condition Timeline: Real-time chronological audit trail of all physiological events
 * - Connected Medical Devices: Wireless telemetry monitor integration
 */

// In-memory registry of Digital Twins
const digitalTwinsStore = {};

export const createInitialDigitalTwin = (patient = {}, emergency = {}) => {
  const triage = emergency?.triageScore || {};
  
  // Extract or compute vitals with clinically accurate emergency fallbacks
  const heartRate = triage.heartRate || (emergency.severity === 'Critical' ? 118 : 82);
  const rawSpo2 = triage.oxygenSaturation || '91%';
  const spo2 = typeof rawSpo2 === 'number' ? rawSpo2 : parseInt(rawSpo2) || 91;
  const bp = triage.bloodPressure || (emergency.severity === 'Critical' ? "95/60 mmHg" : "120/80 mmHg");
  const rawTemp = triage.temperature || '36.8 °C';
  const temp = typeof rawTemp === 'number' ? rawTemp : parseFloat(rawTemp) || 36.8;
  const rawBreathing = triage.breathing || (emergency.severity === 'Critical' ? 'Rapid (28 bpm)' : '16 bpm');
  const rr = typeof rawBreathing === 'number' ? rawBreathing : (rawBreathing.match(/\d+/) ? parseInt(rawBreathing.match(/\d+/)[0]) : 28);
  
  const consciousness = triage.consciousness || (emergency.severity === 'Critical' ? 'Voice Responsive' : 'Alert');
  const abilityToWalk = triage.abilityToWalk || (emergency.severity === 'Critical' ? 'Non-ambulatory (Severe trauma)' : 'Independent');

  const patientName = patient?.name || emergency?.patientName || "Rahul Verma";
  const patientAge = patient?.age || emergency?.patientAge || 34;
  const patientGender = patient?.gender || emergency?.patientGender || "Male";
  const bloodGroup = patient?.bloodGroup || emergency?.patientBloodGroup || "B+";
  const emergencyType = emergency?.emergencyType || "Accident / Polytrauma";
  const isCardiac = emergencyType.toLowerCase().includes('heart') || emergencyType.toLowerCase().includes('cardiac');

  return {
    id: `DT-${patient?.id || emergency?.patientId || emergency?.id || 'PAT-01'}`,
    patientId: patient?.id || emergency?.patientId || 'PAT-01',
    emergencyId: emergency?.id || 'EMG-8821',

    // 1. Identity & Demographics
    name: patientName,
    age: patientAge,
    gender: patientGender,
    bloodGroup: bloodGroup,
    phone: patient?.phone || "+91 98765 43210",
    emergencyContact: patient?.emergencyContact || "Priya Verma (Wife) - +91 98765 43211",

    // 2. Clinical Baseline & Safety
    medicalHistory: patient?.medicalHistory || "Childhood bronchial asthma, mild seasonal rhinitis",
    allergies: patient?.allergies || "Penicillin (Severe anaphylactic reaction), NSAIDs (Rash)",
    existingConditions: patient?.existingConditions || "Bronchial Asthma (Intermittent)",
    currentMedications: patient?.currentMedications || "Salbutamol Inhaler (PRN), Montelukast 10mg OD",

    // 3. Current Emergency & Functional State
    currentEmergency: emergencyType,
    severity: emergency?.severity || "Critical",
    emergencyDescription: emergency?.location?.address
      ? `High-acuity emergency at ${emergency.location.address}. Rapid stabilization required.`
      : "High-impact collision with polytrauma and blunt thoracic injury.",
    consciousnessStatus: consciousness, // 'Alert' | 'Voice Responsive' | 'Pain Responsive' | 'Unconscious'
    abilityToWalk: abilityToWalk, // 'Independent' | 'Assisted' | 'Non-ambulatory (Severe trauma)' | 'Immobilized (Spine Board)'

    // 4. Detailed Emergency Clinical Assessment
    emergencyAssessment: {
      emergencyType: emergencyType,
      severity: emergency?.severity || "Critical",
      triageTag: emergency?.severity === 'Critical' ? 'RED (Priority 1 - Immediate)' : 'YELLOW (Priority 2 - Urgent)',
      location: emergency?.location?.address || "Ring Road Flyover, North Corridor",
      incidentDescription: emergency?.location?.address
        ? `High-acuity emergency at ${emergency.location.address}. Rapid pre-hospital stabilization in progress.`
        : "High-speed vehicular collision with severe polytrauma, blunt thoracic impact, and lower limb fracture.",
      consciousness: consciousness,
      gcsScore: consciousness === 'Alert' ? 15 : (consciousness === 'Voice Responsive' ? 12 : (consciousness === 'Pain Responsive' ? 9 : 6)),
      gcsBreakdown: consciousness === 'Alert' ? "E4 V5 M6 (15/15 - Normal)" : (consciousness === 'Voice Responsive' ? "E3 V4 M5 (12/15 - Moderate Impairment)" : "E2 V3 M4 (9/15 - Severe Impairment)"),
      abilityToWalk: abilityToWalk,
      mobilityClassification: abilityToWalk?.toLowerCase().includes('non') ? "Non-Ambulatory (Full Spine Board & Stretcher Mandated)" : "Ambulatory",
      perfusion: heartRate > 100 ? "Delayed CRT 3.2s • Pale Peripheries • Weak Radial Pulses" : "Normal CRT < 2s • Warm Peripheries • Bounding Pulses",
      primarySurvey: "Airway: Patent on 10L NRB. Breathing: Tachypneic (28 bpm), air entry bilateral. Circulation: Tachycardic (118 bpm), BP 95/60. Disability: GCS 12, pupils 3mm reactive. Exposure: Right lower limb trauma secured.",
      secondarySurvey: "Head & Neck: Rigid C-collar in place, no tracheal deviation. Thorax: Mild anterior chest contusion, clear lungs. Abdomen: Soft, non-distended. Extremities: Right tibia splinted with vacuum traction, left arm 18G IV patent."
    },

    // 5. Live Physiological Vitals
    vitals: {
      heartRate: heartRate,
      spo2: spo2,
      bloodPressure: bp,
      temperature: temp,
      respiratoryRate: rr,
      gcsScore: consciousness === 'Alert' ? 15 : (consciousness === 'Voice Responsive' ? 12 : (consciousness === 'Pain Responsive' ? 9 : 6)),
      perfusionStatus: heartRate > 100 ? "Borderline (Weak radial pulses, CRT 3.2s)" : "Normal (Brisk capillary refill < 2s)"
    },

    // 6. ECG Information
    ecg: {
      rhythm: isCardiac
        ? "Sinus Tachycardia with ST-elevation in leads II, III, aVF (Inferior STEMI pattern)"
        : (heartRate > 100 ? "Sinus Tachycardia, narrow complex, no acute ischemic ST changes" : "Normal Sinus Rhythm, rate 76 bpm"),
      leadStatus: "12-Lead Continuous Wireless Telemetry Active",
      stElevationMm: isCardiac ? 2.4 : 0.2,
      qtcIntervalMs: 438,
      prIntervalMs: 162,
      isAbnormal: isCardiac || heartRate > 100
    },

    // 7. 3D Anatomical Trauma & Organ Mapping (Positions for Three.js 3D mesh)
    anatomicalRegions: [
      {
        id: 'head',
        name: 'Cranial & Neurological',
        status: consciousness === 'Unconscious' ? 'critical' : (consciousness !== 'Alert' ? 'warning' : 'stable'),
        note: consciousness === 'Alert' ? 'Alert, GCS 15, PERRL' : 'Mild concussion, reactive pupils 3mm, GCS 12',
        position: [0, 2.1, 0]
      },
      {
        id: 'chest',
        name: 'Thorax, Heart & Lungs',
        status: isCardiac || rr > 24 ? 'warning' : 'stable',
        note: isCardiac ? 'Acute ST elevation, continuous cardiac monitor' : `Tachycardia ${heartRate} bpm, bilateral air entry clear`,
        position: [0, 1.35, 0]
      },
      {
        id: 'abdomen',
        name: 'Abdomen & Spleen',
        status: 'stable',
        note: 'Soft, non-rigid, focused FAST scan negative for free fluid',
        position: [0, 0.65, 0]
      },
      {
        id: 'left_arm',
        name: 'Left Upper Extremity',
        status: 'stable',
        note: '18G IV Cannula patent in antecubital vein with NS infusion',
        position: [-0.95, 1.1, 0]
      },
      {
        id: 'right_arm',
        name: 'Right Upper Extremity',
        status: 'stable',
        note: 'Continuous non-invasive BP cuff cycling every 3 minutes',
        position: [0.95, 1.1, 0]
      },
      {
        id: 'left_leg',
        name: 'Left Lower Extremity',
        status: 'stable',
        note: 'Normal motor/sensory function, dorsalis pedis pulse 2+',
        position: [-0.4, -0.9, 0]
      },
      {
        id: 'right_leg',
        name: 'Right Lower Extremity',
        status: emergencyType.toLowerCase().includes('accident') ? 'critical' : 'stable',
        note: emergencyType.toLowerCase().includes('accident')
          ? 'Suspected closed mid-shaft tibial fracture, traction splint applied'
          : 'Normal vascular perfusion, full range of motion',
        position: [0.4, -0.9, 0]
      }
    ],

    // 8. Treatments Provided During Transport
    treatments: [
      {
        id: "TRT-01",
        timestamp: new Date(Date.now() - 11 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "High-Flow Oxygen Therapy",
        category: "Airway & Respiratory",
        details: "10 L/min via Non-Rebreather Mask (Target SpO2 > 94%)",
        providerRole: "Paramedic",
        providerName: "S. Ramanathan (Paramedic-I)",
        status: "Active",
        routeOrMode: "Inhalation / Non-Rebreather"
      },
      {
        id: "TRT-02",
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Rigid Cervical Collar & Full Spine Board",
        category: "Trauma & Immobilization",
        details: "Full C-spine stabilization maintained throughout vehicle transport",
        providerRole: "Paramedic",
        providerName: "Vikram Singh (Crew Chief)",
        status: "Maintained",
        routeOrMode: "Spinal Immobilization"
      },
      {
        id: "TRT-03",
        timestamp: new Date(Date.now() - 6 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "18G Peripheral IV Access (Left AC)",
        category: "Circulatory & Resuscitation",
        details: "Large-bore intravenous cannula secured in left antecubital fossa for rapid fluid infusion",
        providerRole: "Paramedic",
        providerName: "S. Ramanathan",
        status: "Active",
        routeOrMode: "Peripheral Vascular Access"
      },
      {
        id: "TRT-04",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Right Leg Vacuum Traction Splint",
        category: "Trauma & Immobilization",
        details: "Immobilized right tibia/fibula, distal pedal pulses palpated and neurovascular checks normal",
        providerRole: "Paramedic",
        providerName: "S. Ramanathan",
        status: "Complete",
        routeOrMode: "Orthopedic Splinting"
      },
      {
        id: "TRT-05",
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Continuous 12-Lead ECG & Bio-Telemetry Streaming",
        category: "Monitoring",
        details: "Philips IntelliVue telemetry synchronized live to Hospital ER trauma bay",
        providerRole: "Paramedic",
        providerName: "Ambulance AMB-01 Telemetry Hub",
        status: "Streaming",
        routeOrMode: "Wireless Bio-Telemetry"
      }
    ],

    // 9. Medicines Administered During Transport
    medicinesAdministered: [
      {
        id: "MED-01",
        timestamp: new Date(Date.now() - 7 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        medicine: "Normal Saline (0.9% NaCl)",
        dose: "500 mL rapid IV infusion",
        route: "Intravenous (18G Left AC)",
        administeredBy: "Paramedic S. Ramanathan",
        indication: "Fluid resuscitation for borderline hypotension (95/60 mmHg, shock index 1.24)",
        effect: "BP stabilized to 95/60 mmHg, peripheral perfusion improved, capillary refill 3.2s"
      },
      {
        id: "MED-02",
        timestamp: new Date(Date.now() - 4 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        medicine: "Fentanyl Citrate",
        dose: "50 mcg slow IV push",
        route: "Intravenous",
        administeredBy: "Paramedic S. Ramanathan (Authorized by Dr. Ananya Sen)",
        indication: "Severe trauma pain relief (NRS pain score 9/10 down to 4/10)",
        effect: "Prompt analgesia achieved, patient calm, continuous respiratory rate & SpO2 monitored"
      },
      {
        id: "MED-03",
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        medicine: "Tranexamic Acid (TXA)",
        dose: "1 g in 100 mL Normal Saline over 10 min",
        route: "Intravenous Infusion",
        administeredBy: "Paramedic S. Ramanathan",
        indication: "Pre-hospital antifibrinolytic protocol for significant polytrauma",
        effect: "Infusion running smoothly via IV pump, no adverse anaphylactoid reaction"
      }
    ],

    // 9. Real-Time Patient Condition Timeline
    timeline: [
      {
        id: "EVT-01",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        event: "Emergency SOS Activated",
        details: "Patient mobile SOS alert triggered at Ring Road Flyover. GPS locked within 6m.",
        source: "Patient",
        severity: "Critical",
        vitalsSnapshot: `HR: ${heartRate + 12} | SpO2: 88% | BP: 92/58 | RR: 30`
      },
      {
        id: "EVT-02",
        timestamp: new Date(Date.now() - 11 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        event: "Paramedic On-Scene Triage Initialized",
        details: `Primary survey completed: ${consciousness}, ${abilityToWalk}. C-spine secured.`,
        source: "Paramedic",
        severity: "Critical",
        vitalsSnapshot: `HR: ${heartRate + 6} | SpO2: 90% | BP: 94/60 | RR: 28`
      },
      {
        id: "EVT-03",
        timestamp: new Date(Date.now() - 7 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        event: "Connected Medical Device Telemetry Streaming",
        details: "Philips IntelliVue 12-lead telemetry monitor paired. Wireless bio-signals transmitting to Digital Twin.",
        source: "Connected Medical Device",
        severity: "Normal",
        vitalsSnapshot: `HR: ${heartRate} | SpO2: ${spo2}% | BP: ${bp} | RR: ${rr}`
      },
      {
        id: "EVT-04",
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        event: "Hospital ER Trauma Team Remote Review",
        details: "Dr. Ananya Sen reviewed Digital Twin. Verified Penicillin allergy. Authorized IV analgesia & trauma bay prep.",
        source: "Doctor",
        severity: "Normal",
        vitalsSnapshot: `HR: ${heartRate} | SpO2: ${spo2}% | BP: ${bp} | RR: ${rr}`
      }
    ],

    // 10. Connected IoT Medical Devices
    connectedDevices: [
      {
        id: "DEV-01",
        name: "Philips IntelliVue MX40 Wireless Telemetry",
        type: "ECG / SpO2 / NIBP Monitor",
        status: "Streaming Live (500 Hz)",
        battery: "94%",
        lastSync: "Just now"
      },
      {
        id: "DEV-02",
        name: "Hamilton-T1 Transport Ventilator Telemetry",
        type: "Capnography & O2 Flow Telemetry",
        status: "Connected (10 L/min flow)",
        battery: "88%",
        lastSync: "Just now"
      }
    ],

    lastUpdated: new Date().toISOString()
  };
};

/**
 * Resilient lookup that resolves a Digital Twin regardless of whether
 * it was queried by twin.id, patientId, or emergencyId, with or without 'DT-' prefix
 */
export const findDigitalTwin = (twinId) => {
  if (!twinId) return null;
  // 1. Direct key match
  if (digitalTwinsStore[twinId]) return digitalTwinsStore[twinId];

  const str = String(twinId);
  const withPrefix = str.startsWith('DT-') ? str : `DT-${str}`;
  if (digitalTwinsStore[withPrefix]) return digitalTwinsStore[withPrefix];

  const clean = str.replace(/^DT-/, '');
  if (digitalTwinsStore[clean]) return digitalTwinsStore[clean];

  // 2. Scan in-memory store by all properties
  for (const stored of Object.values(digitalTwinsStore)) {
    if (
      stored.id === str ||
      stored.id === withPrefix ||
      stored.id === clean ||
      stored.patientId === clean ||
      stored.patientId === str ||
      stored.emergencyId === clean ||
      stored.emergencyId === str ||
      `DT-${stored.patientId}` === str ||
      `DT-${stored.emergencyId}` === str
    ) {
      return stored;
    }
  }
  return null;
};

/**
 * Retrieve or initialize the Digital Twin for a given patient or emergency
 */
export const getOrInitDigitalTwin = (patientOrEmergency, allPatients = [], allEmergencies = []) => {
  if (!patientOrEmergency) {
    const defaultPatient = allPatients[0] || { id: 'PAT-01', name: 'Rahul Verma', age: 34, gender: 'Male', bloodGroup: 'B+' };
    const defaultEmergency = allEmergencies[0] || { id: 'EMG-8821', emergencyType: 'Accident', severity: 'Critical' };
    return getOrInitDigitalTwin(defaultEmergency, allPatients, allEmergencies);
  }

  const id = patientOrEmergency.id || patientOrEmergency.patientId;
  const storeKey = `DT-${id}`;

  const existing = findDigitalTwin(id);
  if (existing) {
    // Ensure all aliases point to this record
    digitalTwinsStore[storeKey] = existing;
    digitalTwinsStore[existing.id] = existing;
    return existing;
  }

  // Determine whether argument is emergency or patient
  let patient = null;
  let emergency = null;

  if (patientOrEmergency.patientName || patientOrEmergency.emergencyType) {
    emergency = patientOrEmergency;
    patient = allPatients.find(p => p.id === emergency.patientId) || {
      id: emergency.patientId || 'PAT-01',
      name: emergency.patientName,
      age: emergency.patientAge,
      gender: emergency.patientGender,
      bloodGroup: emergency.patientBloodGroup
    };
  } else {
    patient = patientOrEmergency;
    emergency = allEmergencies.find(e => e.patientId === patient.id) || {
      id: `EMG-${patient.id}`,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientBloodGroup: patient.bloodGroup,
      emergencyType: "Acute Medical Assessment",
      severity: "Moderate"
    };
  }

  const newTwin = createInitialDigitalTwin(patient, emergency);
  
  // Store under all possible reference keys
  digitalTwinsStore[storeKey] = newTwin;
  digitalTwinsStore[newTwin.id] = newTwin;
  if (newTwin.patientId) {
    digitalTwinsStore[`DT-${newTwin.patientId}`] = newTwin;
    digitalTwinsStore[newTwin.patientId] = newTwin;
  }
  if (newTwin.emergencyId) {
    digitalTwinsStore[`DT-${newTwin.emergencyId}`] = newTwin;
    digitalTwinsStore[newTwin.emergencyId] = newTwin;
  }

  return newTwin;
};

/**
 * Update Vitals from Connected Medical Device or Paramedic
 */
export const updateDigitalTwinVitals = (twinId, vitalsUpdates = {}, source = 'Connected Medical Device', providerName = '') => {
  const twin = findDigitalTwin(twinId);
  if (!twin) return null;

  const hr = vitalsUpdates.heartRate !== undefined ? Number(vitalsUpdates.heartRate) : twin.vitals.heartRate;
  const rawSpo2 = vitalsUpdates.spo2 !== undefined ? vitalsUpdates.spo2 : (vitalsUpdates.oxygenSaturation !== undefined ? vitalsUpdates.oxygenSaturation : twin.vitals.spo2);
  const spo2Val = typeof rawSpo2 === 'number' ? rawSpo2 : (parseInt(rawSpo2) || twin.vitals.spo2);
  const bpVal = vitalsUpdates.bloodPressure !== undefined ? vitalsUpdates.bloodPressure : twin.vitals.bloodPressure;
  const rrVal = vitalsUpdates.respiratoryRate !== undefined ? Number(vitalsUpdates.respiratoryRate) : twin.vitals.respiratoryRate;
  const tempVal = vitalsUpdates.temperature !== undefined ? Number(vitalsUpdates.temperature) : twin.vitals.temperature;

  const updatedVitals = {
    ...twin.vitals,
    ...vitalsUpdates,
    heartRate: hr,
    spo2: spo2Val,
    oxygenSaturation: `${spo2Val}%`,
    bloodPressure: bpVal,
    respiratoryRate: rrVal,
    temperature: tempVal,
    perfusionStatus: hr > 100 ? "Borderline (Weak radial pulses, CRT 3.2s)" : "Normal (Brisk capillary refill < 2s)"
  };

  // Re-evaluate heart rate rhythm & ECG
  if (hr) {
    twin.ecg = {
      ...twin.ecg,
      rate: hr,
      rhythm: hr > 100
        ? "Sinus Tachycardia, narrow complex"
        : (hr < 60 ? "Sinus Bradycardia" : "Normal Sinus Rhythm"),
      isAbnormal: hr > 100 || hr < 60 || spo2Val < 90
    };
  }

  // Update anatomical region statuses dynamically
  const cardiacReg = twin.anatomicalRegions?.find(r => r.id === 'cardiac' || r.id === 'chest');
  if (cardiacReg) {
    cardiacReg.status = (hr > 125 || hr < 50) ? 'critical' : (hr > 100 ? 'warning' : 'stable');
    cardiacReg.note = `Rate: ${hr} BPM • ${twin.ecg?.rhythm || 'Sinus Rhythm'}`;
  }

  const pulmonaryReg = twin.anatomicalRegions?.find(r => r.id === 'pulmonary' || r.id === 'lungs');
  if (pulmonaryReg) {
    pulmonaryReg.status = spo2Val < 90 ? 'critical' : (spo2Val < 95 ? 'warning' : 'stable');
    pulmonaryReg.note = `SpO₂: ${spo2Val}% • RR: ${rrVal} bpm`;
  }

  // Dynamic survey update
  if (twin.emergencyAssessment) {
    twin.emergencyAssessment.primarySurvey = `Airway: Patent. Breathing: ${rrVal > 22 ? 'Tachypneic' : 'Eupneic'} (${rrVal} bpm), SpO₂ ${spo2Val}%. Circulation: ${hr > 100 ? 'Tachycardic' : 'Normal'} (${hr} bpm), BP ${bpVal}. Disability: GCS ${twin.vitals.gcsScore || 12}/15.`;
    twin.emergencyAssessment.perfusion = hr > 100 ? "Borderline (CRT 3.2s, weak radial pulses)" : "Normal (CRT < 2s, bounding radial pulses)";
  }

  twin.vitals = updatedVitals;
  twin.lastUpdated = new Date().toISOString();

  // Add timeline entry
  const timelineItem = {
    id: `EVT-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    event: `Vitals Stream Updated via ${source}`,
    details: `HR: ${hr} bpm | SpO2: ${spo2Val}% | BP: ${bpVal} | RR: ${rrVal} bpm | Temp: ${tempVal}°C`,
    source: source,
    providerName: providerName,
    severity: (spo2Val < 90 || hr > 130) ? 'Critical' : 'Normal',
    vitalsSnapshot: `HR: ${hr} | SpO2: ${spo2Val}% | BP: ${bpVal} | RR: ${rrVal}`
  };

  twin.timeline = twin.timeline || [];
  twin.timeline.unshift(timelineItem);

  return { ...twin };
};

/**
 * Update Functional Status (Consciousness / Ability to Walk)
 */
export const updateDigitalTwinStatus = (twinId, { consciousnessStatus, abilityToWalk }, source = 'Paramedic', providerName = '') => {
  const twin = findDigitalTwin(twinId);
  if (!twin) return null;

  if (consciousnessStatus) {
    twin.consciousnessStatus = consciousnessStatus;
    const newGcs = consciousnessStatus === 'Alert' ? 15 : (consciousnessStatus === 'Voice Responsive' ? 12 : (consciousnessStatus === 'Pain Responsive' ? 9 : 6));
    twin.vitals.gcsScore = newGcs;
    
    // Update head anatomical region status
    const headRegion = twin.anatomicalRegions?.find(r => r.id === 'head');
    if (headRegion) {
      headRegion.status = consciousnessStatus === 'Unconscious' ? 'critical' : (consciousnessStatus !== 'Alert' ? 'warning' : 'stable');
      headRegion.note = `Status: ${consciousnessStatus} (GCS ${newGcs})`;
    }

    if (twin.emergencyAssessment) {
      twin.emergencyAssessment.consciousness = consciousnessStatus;
      twin.emergencyAssessment.gcsScore = newGcs;
      twin.emergencyAssessment.gcsBreakdown = consciousnessStatus === 'Alert' ? "E4 V5 M6 (15/15 - Normal)" : (consciousnessStatus === 'Voice Responsive' ? "E3 V4 M5 (12/15 - Moderate Impairment)" : "E2 V3 M4 (9/15 - Severe Impairment)");
    }
  }

  if (abilityToWalk) {
    twin.abilityToWalk = abilityToWalk;
    if (twin.emergencyAssessment) {
      twin.emergencyAssessment.abilityToWalk = abilityToWalk;
      twin.emergencyAssessment.mobilityClassification = abilityToWalk.toLowerCase().includes('non') ? "Non-Ambulatory (Full Spine Board & Stretcher Mandated)" : "Ambulatory";
    }
  }

  twin.lastUpdated = new Date().toISOString();

  twin.timeline = twin.timeline || [];
  twin.timeline.unshift({
    id: `EVT-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    event: `Physical Status Updated by ${source}`,
    details: `Consciousness: ${twin.consciousnessStatus} | Mobility: ${twin.abilityToWalk} | GCS: ${twin.vitals.gcsScore}/15`,
    source,
    providerName,
    severity: twin.consciousnessStatus === 'Unconscious' ? 'Critical' : 'Normal',
    vitalsSnapshot: `HR: ${twin.vitals.heartRate} | SpO2: ${twin.vitals.spo2}% | BP: ${twin.vitals.bloodPressure} | RR: ${twin.vitals.respiratoryRate}`
  });

  return { ...twin };
};

/**
 * Record Treatment Provided
 */
export const addDigitalTwinTreatment = (twinId, treatment = {}, source = 'Paramedic') => {
  const twin = findDigitalTwin(twinId);
  if (!twin) return null;

  const newTreatment = {
    id: `TRT-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    action: treatment.action || "Emergency Stabilization",
    details: treatment.details || "Pre-hospital clinical protocol initiated",
    providerRole: source,
    providerName: treatment.providerName || "EMS Crew",
    status: treatment.status || "Active"
  };

  twin.treatments = twin.treatments || [];
  twin.treatments.unshift(newTreatment);
  twin.lastUpdated = new Date().toISOString();

  twin.timeline = twin.timeline || [];
  twin.timeline.unshift({
    id: `EVT-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    event: `Treatment Provided: ${newTreatment.action}`,
    details: `${newTreatment.details} (Administered by ${newTreatment.providerName})`,
    source,
    severity: 'Normal',
    vitalsSnapshot: `HR: ${twin.vitals.heartRate} | SpO2: ${twin.vitals.spo2}% | BP: ${twin.vitals.bloodPressure} | RR: ${twin.vitals.respiratoryRate}`
  });

  return { ...twin };
};

/**
 * Record Medicine Administered
 */
export const addDigitalTwinMedication = (twinId, medication = {}, source = 'Doctor') => {
  const twin = findDigitalTwin(twinId);
  if (!twin) return null;

  const newMed = {
    id: `MED-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    medicine: medication.medicine || "Emergency Medication",
    dose: medication.dose || "Standard dose",
    route: medication.route || "IV",
    administeredBy: medication.administeredBy || `${source}`,
    indication: medication.indication || "Emergency Stabilization",
    effect: medication.effect || "Under observation"
  };

  twin.medicinesAdministered = twin.medicinesAdministered || [];
  twin.medicinesAdministered.unshift(newMed);
  twin.lastUpdated = new Date().toISOString();

  twin.timeline = twin.timeline || [];
  twin.timeline.unshift({
    id: `EVT-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    event: `Medicine Administered: ${newMed.medicine} (${newMed.dose} ${newMed.route})`,
    details: `Indication: ${newMed.indication} | Effect: ${newMed.effect} | Auth: ${newMed.administeredBy}`,
    source,
    severity: 'Normal',
    vitalsSnapshot: `HR: ${twin.vitals.heartRate} | SpO2: ${twin.vitals.spo2}% | BP: ${twin.vitals.bloodPressure} | RR: ${twin.vitals.respiratoryRate}`
  });

  return { ...twin };
};

/**
 * Simulate live physiological sensor drift from Connected Medical Device
 */
export const simulateConnectedDeviceDrift = (twinId) => {
  const twin = findDigitalTwin(twinId);
  if (!twin) return null;

  // Realistic minor fluctuations in vitals
  const hrDelta = Math.floor(Math.random() * 5) - 2; // -2 to +2 bpm
  const spo2Delta = Math.floor(Math.random() * 3) - 1; // -1 to +1 %
  const newHr = Math.max(50, Math.min(170, twin.vitals.heartRate + hrDelta));
  const newSpo2 = Math.max(75, Math.min(100, twin.vitals.spo2 + spo2Delta));

  twin.vitals.heartRate = newHr;
  twin.vitals.spo2 = newSpo2;
  twin.lastUpdated = new Date().toISOString();

  return { ...twin };
};
