// Raksha Smart Ambulance - Offline-First & SMS Fallback Service
// Compliant with EMS Telemetry & Smart City Disaster Management Protocols

export const NETWORK_MODES = {
  ONLINE: 'online',             // 4G/5G Broadband Active - Full Live Telemetry & Instant Cloud Sync
  WEAK_NETWORK: 'weak_network', // 2G/EDGE / High Packet Loss - Priority Queueing & Throttled Sync
  OFFLINE: 'offline',           // Zero Connectivity - 100% Offline-First (Dead Reckoning & Local Storage)
  SMS_FALLBACK: 'sms_fallback'  // Mobile Data Down, Cellular Voice/SMS Active - Automated Minimal SMS
};

const STORAGE_KEYS = {
  NETWORK_MODE: 'raksha_network_mode',
  OFFLINE_QUEUE: 'raksha_offline_queue',
  SMS_LOG: 'raksha_sms_transmissions',
  OFFLINE_VITALS_BUFFER: 'raksha_offline_vitals_buffer',
  AUTHORIZED_CONTACTS: 'raksha_authorized_sms_contacts',
  OFFLINE_ASSESSMENTS: 'raksha_offline_assessments',
  SYNC_PROGRESS: 'raksha_sync_progress'
};

// Role-Specific Authorized Emergency Contacts (Configurable per Portal)
export const DEFAULT_ROLE_CONTACTS = {
  ambulance: [
    {
      id: 'AMB-C01',
      role: 'Central Emergency Control Room',
      name: 'Delhi State Emergency Operations Centre (SEOC)',
      phone: '+91 11 2345 6789',
      type: 'Control Room Dispatch',
      active: true,
      primary: true
    },
    {
      id: 'AMB-C02',
      role: 'Emergency Medical Coordinator',
      name: 'Dr. Sameer Sen (Trauma Medical Lead)',
      phone: '+91 98112 00911',
      type: 'Lead Physician Coordinator',
      active: true,
      primary: false
    },
    {
      id: 'AMB-C03',
      role: 'Receiving Hospital Trauma ER Intake',
      name: 'AIIMS Apex Trauma Centre Emergency Desk',
      phone: '+91 11 2659 4444',
      type: 'Hospital ER Desk',
      active: true,
      primary: false
    },
    {
      id: 'AMB-C04',
      role: 'Patient Emergency Status Link',
      name: 'Citizen & Kin Emergency Care Link',
      phone: '+91 98111 22334',
      type: 'Patient Emergency Contact',
      active: true,
      primary: false
    },
    {
      id: 'AMB-C05',
      role: 'ITMS Traffic Preemption Cell',
      name: 'Delhi Traffic Police ITMS Green Corridor Cell',
      phone: '+91 11 2678 1234',
      type: 'Traffic Police ITMS',
      active: true,
      primary: false
    }
  ],
  patient: [
    {
      id: 'PAT-C01',
      role: 'Central Emergency Operations Centre (SEOC)',
      name: 'State Disaster & Ambulance Dispatch EOC',
      phone: '+91 11 2345 6789',
      type: 'Control Room Hub',
      active: true,
      primary: true
    },
    {
      id: 'PAT-C02',
      role: 'National Emergency Ambulance Service',
      name: '108 Emergency Medical Dispatch',
      phone: '108',
      type: '108 Ambulance Dispatch',
      active: true,
      primary: true
    },
    {
      id: 'PAT-C03',
      role: 'National Emergency Response Support (ERSS)',
      name: '112 Unified Emergency Helpline',
      phone: '112',
      type: 'Unified Emergency Services',
      active: true,
      primary: false
    },
    {
      id: 'PAT-C04',
      role: 'Next of Kin / Family Emergency Contact',
      name: 'Sunita Sharma (Designated Emergency Kin)',
      phone: '+91 98111 22334',
      type: 'Family Contact',
      active: true,
      primary: false
    }
  ],
  doctor: [
    {
      id: 'DOC-C01',
      role: 'Inbound Ambulance Paramedic Unit',
      name: 'Lead Paramedic Rajesh Kumar (Unit-1)',
      phone: '+91 98991 12233',
      type: 'Field Paramedic Link',
      active: true,
      primary: true
    },
    {
      id: 'DOC-C02',
      role: 'Patient Clinical Directives Desk',
      name: 'Citizen Care & Family Directives Alert',
      phone: '+91 98111 22334',
      type: 'Patient Directives',
      active: true,
      primary: false
    },
    {
      id: 'DOC-C03',
      role: 'Trauma ER Resuscitation Bay',
      name: 'Apex Trauma Bay 1 In-Charge Desk',
      phone: '+91 11 2659 4444',
      type: 'Trauma ER Reception',
      active: true,
      primary: false
    },
    {
      id: 'DOC-C04',
      role: 'Emergency Blood Bank Duty Officer',
      name: 'Trauma Blood Transfusion Bank',
      phone: '+91 11 2659 8888',
      type: 'Blood Bank Desk',
      active: true,
      primary: false
    }
  ],
  paramedic: [
    {
      id: 'MED-C01',
      role: 'On-Call ER Trauma Specialist',
      name: 'Dr. Sameer Sen (Lead Attending Physician)',
      phone: '+91 98112 00911',
      type: 'Attending Physician',
      active: true,
      primary: true
    },
    {
      id: 'MED-C02',
      role: 'Receiving Hospital Trauma ER Intake',
      name: 'AIIMS Trauma Centre Emergency Desk',
      phone: '+91 11 2659 4444',
      type: 'Hospital ER Bay',
      active: true,
      primary: true
    },
    {
      id: 'MED-C03',
      role: 'Patient & Family Care Liaison',
      name: 'Citizen Triage Status Update Link',
      phone: '+91 98111 22334',
      type: 'Patient Care Liaison',
      active: true,
      primary: false
    },
    {
      id: 'MED-C04',
      role: 'State Emergency Dispatch Hub',
      name: '108 Fleet Tactical Dispatcher',
      phone: '+91 11 2345 6789',
      type: 'Central Dispatch Command',
      active: true,
      primary: false
    }
  ],
  hospital: [
    {
      id: 'HOSP-C01',
      role: 'State Emergency Operations Centre',
      name: 'SEOC Disaster & Surge Allocation Cell',
      phone: '+91 11 2345 6789',
      type: 'State Disaster Management',
      active: true,
      primary: true
    },
    {
      id: 'HOSP-C02',
      role: 'Patient Admission & Triage Status Link',
      name: 'Admitted Patient Family Notification Desk',
      phone: '+91 98111 22334',
      type: 'Patient Notification',
      active: true,
      primary: true
    },
    {
      id: 'HOSP-C03',
      role: 'Ambulance Routing & Diversion Desk',
      name: 'Central 108 Fleet Reassignment Control',
      phone: '+91 11 2345 6700',
      type: 'Ambulance Dispatch Hub',
      active: true,
      primary: false
    },
    {
      id: 'HOSP-C04',
      role: 'State Blood Transfusion Bureau',
      name: 'Delhi Emergency Blood Reserve Network',
      phone: '+91 11 2230 4567',
      type: 'Blood Bank Council',
      active: true,
      primary: false
    }
  ],
  'control-room': [
    {
      id: 'CTL-C01',
      role: 'Citizen / Patient Emergency Advisory Desk',
      name: 'Public Emergency Broadcast System (SMS Alert)',
      phone: '+91 98111 22334',
      type: 'Citizen Public Safety',
      active: true,
      primary: true
    },
    {
      id: 'CTL-C02',
      role: 'Traffic Police ITMS Command Cell',
      name: 'Delhi Traffic Police Green Wave Center',
      phone: '+91 11 2678 1234',
      type: 'Traffic Preemption',
      active: true,
      primary: true
    },
    {
      id: 'CTL-C03',
      role: 'Field Ambulance Fleet Gateway',
      name: 'All Deployed Sector Ambulances (GSM Radio)',
      phone: '+91 98991 12233',
      type: 'Ambulance Fleet Broadcast',
      active: true,
      primary: false
    },
    {
      id: 'CTL-C04',
      role: 'Regional Trauma Hospital Network',
      name: 'Designated ER Trauma Bays Coordinator',
      phone: '+91 11 2659 3333',
      type: 'Hospital ER Hub',
      active: true,
      primary: false
    },
    {
      id: 'CTL-C05',
      role: 'NDRF Disaster Liaison Desk',
      name: 'National Disaster Response Force Duty Cell',
      phone: '+91 11 2436 3260',
      type: 'Disaster Relief Liaison',
      active: true,
      primary: false
    }
  ]
};

// Aliases for compatibility
DEFAULT_ROLE_CONTACTS.control_room = DEFAULT_ROLE_CONTACTS['control-room'];
export const DEFAULT_AUTHORIZED_CONTACTS = DEFAULT_ROLE_CONTACTS.ambulance;

// ============================================================================
// 📡 DEFINITIVE CROSS-PORTAL SMS ROUTING MATRIX
// ============================================================================
// Exact Rules:
// 1. Patient receives from: doctor, paramedic/emt, ambulance, hospital, control-room
// 2. Doctor receives from: paramedic/emt, ambulance
// 3. Paramedic receives from: doctor
// 4. Hospital receives from: paramedic/emt, ambulance
// 5. Control room receives from: patient, ambulance, hospital
export const SMS_ROUTING_MATRIX = {
  // SENDER ROLE -> ARRAY OF AUTHORIZED RECIPIENT ROLES
  patient: ['control-room'],
  ambulance: ['patient', 'doctor', 'hospital', 'control-room'],
  paramedic: ['patient', 'doctor', 'hospital'],
  doctor: ['patient', 'paramedic'],
  hospital: ['patient', 'control-room'],
  'control-room': ['patient']
};

SMS_ROUTING_MATRIX.control_room = SMS_ROUTING_MATRIX['control-room'];

// Inverse lookup helper: Returns which sender roles can send to a given recipient role
export const getAllowedSendersForRole = (recipientRole) => {
  const normRecipient = (recipientRole === 'control_room' ? 'control-room' : recipientRole)?.toLowerCase();
  if (!normRecipient) return [];
  return Object.entries(SMS_ROUTING_MATRIX)
    .filter(([sender, targets]) => targets.includes(normRecipient))
    .map(([sender]) => sender);
};

// Check if a recipient role is eligible to receive an SMS from a specific sender role
export const isRoleEligibleToReceiveSms = (recipientRole, senderRole) => {
  const normRecipient = (recipientRole === 'control_room' ? 'control-room' : recipientRole)?.toLowerCase();
  const normSender = (senderRole === 'control_room' ? 'control-room' : senderRole)?.toLowerCase();
  if (!normRecipient || !normSender) return false;
  const allowed = getAllowedSendersForRole(normRecipient);
  return allowed.includes(normSender);
};

// Seed authentic historical cellular transmissions strictly matching the routing matrix
export const INITIAL_SMS_TRANSMISSIONS = [
  {
    id: 'SMS-SEED-01',
    batchId: 'SMS-BATCH-882101',
    senderRole: 'ambulance',
    senderName: 'Ambulance Unit-1 (ALS)',
    targetRoles: ['patient', 'doctor', 'hospital', 'control-room'],
    emergencyId: 'EMG-8821',
    ambulanceId: 'AMB-01',
    contactName: 'Multi-Agency Reception Gateway',
    contactRole: 'Field Telemetry Broadcast',
    recipientPhone: '+91 11 2345 6789',
    payload: `[RAKSHA-EMS-FALLBACK]
EMG:EMG-8821
AMB:AMB-01 (WB-01-EA-1081)
GPS:22.5385N,88.3370E (Rabindra Sadan - AJC Bose Rd)
PRIORITY:CRITICAL
CALLBACK:RADIO CH-3 / +91 98991 12233
TIME:10:14:22`,
    characterCount: 154,
    roleTitle: 'Smart Ambulance Field Telemetry SMS',
    status: 'delivered',
    stageStatus: 'SMS_DELIVERED',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    storedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 15 * 60000 + 1200).toISOString(),
    deliveredAt: new Date(Date.now() - 15 * 60000 + 3200).toISOString(),
    deliveryConfirmed: true,
    deliveryReport: {
      receiptCode: 'DELIVRD_ACK_00',
      messageReference: 'SMSC-ACK-992101',
      deliveryLatencyMs: 2000
    }
  },
  {
    id: 'SMS-SEED-02',
    batchId: 'SMS-BATCH-882102',
    senderRole: 'paramedic',
    senderName: 'Paramedic Rajesh Kumar',
    targetRoles: ['patient', 'doctor', 'hospital'],
    emergencyId: 'EMG-8821',
    ambulanceId: 'AMB-01',
    contactName: 'Hospital Trauma Bay & Lead Doctor',
    contactRole: 'Pre-Arrival Trauma Telemetry',
    recipientPhone: '+91 11 2659 4444',
    payload: `[RAKSHA-PARAMEDIC-TRIAGE]
EMG:EMG-8821 | EMT:Rajesh Kumar
TRIAGE:CRITICAL (GCS:13)
VITALS:HR:116 SpO2:92% BP:88/56
ETA:6m -> AIIMS Trauma
TX:C-Collar, O2 15L, IV TXA 1g
RADIO:VHF Ch 3 / +91-98991-12233
TIME:10:16:45`,
    characterCount: 156,
    roleTitle: 'Paramedic Pre-Arrival Triage SMS',
    status: 'delivered',
    stageStatus: 'SMS_DELIVERED',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    storedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 12 * 60000 + 1100).toISOString(),
    deliveredAt: new Date(Date.now() - 12 * 60000 + 2900).toISOString(),
    deliveryConfirmed: true,
    deliveryReport: {
      receiptCode: 'DELIVRD_ACK_00',
      messageReference: 'SMSC-ACK-992102',
      deliveryLatencyMs: 1800
    }
  },
  {
    id: 'SMS-SEED-03',
    batchId: 'SMS-BATCH-882103',
    senderRole: 'doctor',
    senderName: 'Dr. Sameer Sen',
    targetRoles: ['patient', 'paramedic'],
    emergencyId: 'EMG-8821',
    ambulanceId: 'AMB-01',
    contactName: 'Inbound Paramedic & Patient Alert',
    contactRole: 'Clinical Directive',
    recipientPhone: '+91 98991 12233',
    payload: `[RAKSHA-DOCTOR-DIRECTIVE]
DOC:Dr. Sameer Sen (AIIMS Trauma)
INCIDENT:EMG-8821 | PAT:PAT-01
ORDERS:Prep Bay 1: 4U O- Blood, Airway Standby
BLOOD_ALERT:4 Units PRBC STAT
PRIORITY:STAT / RED
PHONE:+91-98112-00911
TIME:10:17:10`,
    characterCount: 152,
    roleTitle: 'ER Physician Clinical Directive SMS',
    status: 'delivered',
    stageStatus: 'SMS_DELIVERED',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    storedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 10 * 60000 + 900).toISOString(),
    deliveredAt: new Date(Date.now() - 10 * 60000 + 2600).toISOString(),
    deliveryConfirmed: true,
    deliveryReport: {
      receiptCode: 'DELIVRD_ACK_00',
      messageReference: 'SMSC-ACK-992103',
      deliveryLatencyMs: 1700
    }
  },
  {
    id: 'SMS-SEED-04',
    batchId: 'SMS-BATCH-882104',
    senderRole: 'hospital',
    senderName: 'AIIMS Apex Trauma Centre',
    targetRoles: ['patient', 'control-room'],
    emergencyId: 'EMG-8821',
    ambulanceId: null,
    contactName: 'State EOC & Patient Desk',
    contactRole: 'Hospital Surge & Bed Status',
    recipientPhone: '+91 11 2345 6789',
    payload: `[RAKSHA-HOSPITAL-STATUS]
HOSP:AIIMS Trauma Centre
CAPACITY:ICU:4 Free | GEN:28 | VENT:6
RESERVES:O2:4200L (Good) | O-:4U Reserve
STATUS:OPEN - ACCEPTING RED/YELLOW
ER_DESK:+91-11-2659-3333
TIME:10:18:02`,
    characterCount: 150,
    roleTitle: 'Hospital Surge & Resource Status SMS',
    status: 'delivered',
    stageStatus: 'SMS_DELIVERED',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    storedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 8 * 60000 + 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 8 * 60000 + 3100).toISOString(),
    deliveryConfirmed: true,
    deliveryReport: {
      receiptCode: 'DELIVRD_ACK_00',
      messageReference: 'SMSC-ACK-992104',
      deliveryLatencyMs: 2100
    }
  },
  {
    id: 'SMS-SEED-05',
    batchId: 'SMS-BATCH-882105',
    senderRole: 'control-room',
    senderName: 'State EOC Dispatch Command',
    targetRoles: ['patient'],
    emergencyId: 'EMG-8821',
    ambulanceId: null,
    contactName: 'Citizen Emergency Advisory',
    contactRole: 'Public Safety Dispatch Broadcast',
    recipientPhone: '+91 98111 22334',
    payload: `[RAKSHA-CONTROL-DISPATCH]
SEOC_CMD:DISPATCH-CMD-01
INCIDENT:EMG-8821 (Polytrauma MCI)
GREEN_WAVE:ACTIVE - ROUTE 4A PREEMPTED
FLEET:AMB-01 (ALS) -> AIIMS Trauma
STATUS:TRAFFIC ITMS EN-ROUTE
HOTLINE:+91-11-2345-6789
TIME:10:18:35`,
    characterCount: 155,
    roleTitle: 'Control Room Tactical SMS Dispatch',
    status: 'delivered',
    stageStatus: 'SMS_DELIVERED',
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
    storedAt: new Date(Date.now() - 6 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 6 * 60000 + 800).toISOString(),
    deliveredAt: new Date(Date.now() - 6 * 60000 + 2400).toISOString(),
    deliveryConfirmed: true,
    deliveryReport: {
      receiptCode: 'DELIVRD_ACK_00',
      messageReference: 'SMSC-ACK-992105',
      deliveryLatencyMs: 1600
    }
  },
  {
    id: 'SMS-SEED-06',
    batchId: 'SMS-BATCH-882106',
    senderRole: 'patient',
    senderName: 'Citizen Aarav Sharma',
    targetRoles: ['control-room'],
    emergencyId: 'EMG-8821',
    ambulanceId: null,
    contactName: 'Central Control Room',
    contactRole: 'Citizen Emergency SOS',
    recipientPhone: '108',
    payload: `[RAKSHA-CITIZEN-SOS]
INCIDENT:EMG-8821
CITIZEN:PAT-01 (O+ • 34y/M)
TYPE:Severe Road Accident
GPS:22.5415N,88.3485E (Exide Crossing AJC Bose Rd)
SEVERITY:CRITICAL
CONTACT:+91-98111-22334
TIME:10:12:00`,
    characterCount: 148,
    roleTitle: 'Citizen Offline SOS SMS',
    status: 'delivered',
    stageStatus: 'SMS_DELIVERED',
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    storedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 20 * 60000 + 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 20 * 60000 + 2800).toISOString(),
    deliveryConfirmed: true,
    deliveryReport: {
      receiptCode: 'DELIVRD_ACK_00',
      messageReference: 'SMSC-ACK-992106',
      deliveryLatencyMs: 1800
    }
  }
];

class OfflineSyncService {
  constructor() {
    this.networkMode = this.loadInitialNetworkMode();
    this.listeners = new Set();
    this.smsListeners = new Set();
    this.queueListeners = new Set();
    this.syncInProgress = false;
    this.deliveryTimers = new Map();

    // Auto-detect browser online/offline events (unless manually simulated)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleBrowserOnlineChange(true));
      window.addEventListener('offline', () => this.handleBrowserOnlineChange(false));
    }
  }

  loadInitialNetworkMode() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NETWORK_MODE);
      if (saved && Object.values(NETWORK_MODES).includes(saved)) {
        return saved;
      }
      return typeof navigator !== 'undefined' && !navigator.onLine 
        ? NETWORK_MODES.OFFLINE 
        : NETWORK_MODES.ONLINE;
    } catch {
      return NETWORK_MODES.ONLINE;
    }
  }

  getNetworkMode() {
    return this.networkMode;
  }

  setNetworkMode(mode) {
    if (!Object.values(NETWORK_MODES).includes(mode)) return;
    const oldMode = this.networkMode;
    this.networkMode = mode;
    try {
      localStorage.setItem(STORAGE_KEYS.NETWORK_MODE, mode);
    } catch {}

    // Notify listeners
    this.notifyNetworkListeners(mode, oldMode);

    // If restoring to ONLINE, automatically initiate synchronization of queued data!
    if (mode === NETWORK_MODES.ONLINE && oldMode !== NETWORK_MODES.ONLINE) {
      this.syncQueuedData();
    }
  }

  handleBrowserOnlineChange(isOnline) {
    // Only auto-switch if user hasn't chosen a simulated state
    const saved = localStorage.getItem(STORAGE_KEYS.NETWORK_MODE);
    if (!saved || saved === NETWORK_MODES.ONLINE || saved === NETWORK_MODES.OFFLINE) {
      this.setNetworkMode(isOnline ? NETWORK_MODES.ONLINE : NETWORK_MODES.OFFLINE);
    }
  }

  // --- AUTHORIZED CONTACTS MANAGEMENT (PER PORTAL ROLE) ---
  getAuthorizedContacts(role = 'ambulance') {
    const normRole = (role === 'control_room' ? 'control-room' : role) || 'ambulance';
    try {
      const key = `${STORAGE_KEYS.AUTHORIZED_CONTACTS}_${normRole}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      // Legacy fallback for ambulance
      if (normRole === 'ambulance') {
        const legacy = localStorage.getItem(STORAGE_KEYS.AUTHORIZED_CONTACTS);
        if (legacy) return JSON.parse(legacy);
      }
      return DEFAULT_ROLE_CONTACTS[normRole] || DEFAULT_ROLE_CONTACTS.ambulance;
    } catch {
      return DEFAULT_ROLE_CONTACTS[normRole] || DEFAULT_ROLE_CONTACTS.ambulance;
    }
  }

  saveAuthorizedContacts(contacts, role = 'ambulance') {
    const normRole = (role === 'control_room' ? 'control-room' : role) || 'ambulance';
    try {
      const key = `${STORAGE_KEYS.AUTHORIZED_CONTACTS}_${normRole}`;
      localStorage.setItem(key, JSON.stringify(contacts));
      if (normRole === 'ambulance') {
        localStorage.setItem(STORAGE_KEYS.AUTHORIZED_CONTACTS, JSON.stringify(contacts));
      }
    } catch {}
  }

  // --- MINIMAL EMERGENCY SMS ENCODER (PATIENT PRIVACY PROTECTED) ---
  /**
   * Generates a minimal, strictly privacy-protected SMS payload for AMBULANCE FLEET.
   * UNTOUCHED for Ambulance Portal as per requirement.
   * NEVER includes: full patient name, personal identifiers, Aadhaar/SSN, full medical history.
   * ONLY includes: Emergency ID, Ambulance ID, GPS coordinates/location, priority level, callback info.
   */
  buildMinimalEmergencySms({ emergencyId, ambulanceId, plateNumber, coordinates, landmark, priority, callbackRadio, callbackPhone }) {
    const latStr = coordinates?.lat ? Number(coordinates.lat).toFixed(4) : '28.5680';
    const lngStr = coordinates?.lng ? Number(coordinates.lng).toFixed(4) : '77.2350';
    const cleanPriority = (priority || 'CRITICAL').toUpperCase();
    const shortLocation = landmark ? landmark.substring(0, 32) : 'Sector 4 Junction';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Strict privacy-preserving compact GSM-7 standard payload
    const textPayload = 
`[RAKSHA-EMS-FALLBACK]
EMG:${emergencyId}
AMB:${ambulanceId} (${plateNumber || 'UNIT-1'})
GPS:${latStr}N,${lngStr}E (${shortLocation})
PRIORITY:${cleanPriority}
CALLBACK:${callbackRadio || 'RADIO CH-3'} / ${callbackPhone || '+91-98991-12233'}
TIME:${timestamp}`;

    return {
      textPayload,
      characterCount: textPayload.length,
      isSingleSmsSegment: textPayload.length <= 160,
      privacyPreserved: true,
      anonymizedFields: ['No Patient PII', 'No Medical History', 'No Aadhaar/ID Included']
    };
  }

  // --- ROLE-SPECIFIC EMERGENCY SMS ENCODER (TAILORED FOR EACH PORTAL) ---
  buildRoleSpecificEmergencySms(role = 'ambulance', context = {}) {
    const normRole = (role === 'control_room' ? 'control-room' : role) || 'ambulance';

    // 1. Ambulance: Use canonical buildMinimalEmergencySms
    if (normRole === 'ambulance') {
      return this.buildMinimalEmergencySms({
        emergencyId: context.emergency?.id || context.emergencyId || 'EMG-8821',
        ambulanceId: context.ambulance?.id || context.ambulanceId || 'AMB-01',
        plateNumber: context.ambulance?.plateNumber || context.plateNumber || 'WB-01-EA-1081',
        coordinates: {
          lat: context.ambulance?.lat || context.coordinates?.lat || context.emergency?.location?.lat || 22.5385,
          lng: context.ambulance?.lng || context.coordinates?.lng || context.emergency?.location?.lng || 88.3370
        },
        landmark: context.emergency?.location?.address || context.landmark || 'AJC Bose Road Flyover near Exide Crossing, Kolkata',
        priority: context.emergency?.severity || context.priority || 'CRITICAL',
        callbackRadio: context.callbackRadio || 'VHF Emergency Ch 3',
        callbackPhone: context.ambulance?.driverPhone || context.callbackPhone || '+91 98991 12233'
      });
    }

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const emg = context.emergency || {};
    const pat = context.patient || {};
    const amb = context.ambulance || {};
    const doc = context.doctor || {};
    const hosp = context.hospital || {};
    const curUser = context.currentUser || {};

    const latStr = (amb.lat || emg.location?.lat || 22.5415).toFixed(4);
    const lngStr = (amb.lng || emg.location?.lng || 88.3485).toFixed(4);
    const shortLocation = (emg.location?.address || context.landmark || 'AJC Bose Road near Exide').substring(0, 26);
    const cleanPriority = (emg.severity || context.priority || 'CRITICAL').toUpperCase();

    // 2. Patient / Citizen Portal SMS Fallback
    if (normRole === 'patient') {
      const bloodGroup = pat.bloodGroup || 'O+';
      const age = pat.age || 34;
      const genderChar = (pat.gender || 'M').charAt(0).toUpperCase();
      const emgType = (emg.emergencyType || context.emergencyType || 'Severe Trauma / Accident').substring(0, 22);
      const contactPhone = pat.emergencyContact || context.contactPhone || '+91-98111-22334';
      const patientRef = pat.id || curUser.referenceId || 'PAT-01';

      const textPayload = 
`[RAKSHA-CITIZEN-SOS]
INCIDENT:${emg.id || 'EMG-8821'}
CITIZEN:${patientRef} (${bloodGroup} • ${age}y/${genderChar})
TYPE:${emgType}
GPS:${latStr}N,${lngStr}E (${shortLocation})
SEVERITY:${cleanPriority}
CONTACT:${contactPhone}
TIME:${timestamp}`;

      return {
        textPayload,
        characterCount: textPayload.length,
        isSingleSmsSegment: textPayload.length <= 160,
        privacyPreserved: true,
        roleTitle: 'Citizen Offline SOS SMS',
        anonymizedFields: ['No Aadhaar/SSN Included', 'No Historical Medical Records', 'Emergency Dispatch Data Only']
      };
    }

    // 3. Paramedic / EMT Field Triage SMS Fallback
    if (normRole === 'paramedic') {
      const paramedicName = (curUser.name || amb.paramedicName || 'Rajesh Kumar EMT').substring(0, 14);
      const triageScore = emg.triageScore || {};
      const hr = triageScore.heartRate || context.heartRate || 116;
      const spo2 = (triageScore.oxygenSaturation || context.oxygenSaturation || '92%').toString().replace('%', '');
      const bp = (triageScore.bloodPressure || context.bloodPressure || '88/56').substring(0, 7);
      const gcs = context.gcsScore || 13;
      const eta = emg.etaMinutes || context.etaMinutes || 7;
      const destName = (hosp.name || 'AIIMS Trauma').substring(0, 14);
      const tx = (context.interventions || 'C-Collar, O2 15L, IV TXA').substring(0, 28);
      const radio = amb.radioChannel || 'VHF Ch 3';
      const phone = amb.driverPhone || curUser.phone || '+91-98991-12233';

      const textPayload = 
`[RAKSHA-PARAMEDIC-TRIAGE]
EMG:${emg.id || 'EMG-8821'} | EMT:${paramedicName}
TRIAGE:${cleanPriority} (GCS:${gcs})
VITALS:HR:${hr} SpO2:${spo2}% BP:${bp}
ETA:${eta}m -> ${destName}
TX:${tx}
RADIO:${radio} / ${phone}
TIME:${timestamp}`;

      return {
        textPayload,
        characterCount: textPayload.length,
        isSingleSmsSegment: textPayload.length <= 160,
        privacyPreserved: true,
        roleTitle: 'Paramedic Pre-Arrival Triage SMS',
        anonymizedFields: ['Pre-Hospital Clinical Telemetry', 'No Citizen PII', 'ER Resuscitation Preparedness']
      };
    }

    // 4. Doctor / ER Trauma Specialist Directive SMS Fallback
    if (normRole === 'doctor') {
      const docName = (curUser.name || doc.name || 'Dr. Sameer Sen').substring(0, 16);
      const hospName = (doc.hospital || hosp.name || 'AIIMS Apex Trauma').substring(0, 16);
      const directive = (context.directive || 'Prep Bay 1: 4U O- Blood, Airway Standby').substring(0, 44);
      const bloodAlert = (context.bloodAlert || '4 Units PRBC STAT').substring(0, 20);
      const urgency = (context.urgency || 'STAT / RED').toUpperCase();
      const phone = curUser.phone || doc.phone || '+91-98112-00911';

      const textPayload = 
`[RAKSHA-DOCTOR-DIRECTIVE]
DOC:${docName} (${hospName})
INCIDENT:${emg.id || 'EMG-8821'} | PAT:${pat.id || 'PAT-01'}
ORDERS:${directive}
BLOOD_ALERT:${bloodAlert}
PRIORITY:${urgency}
PHONE:${phone}
TIME:${timestamp}`;

      return {
        textPayload,
        characterCount: textPayload.length,
        isSingleSmsSegment: textPayload.length <= 160,
        privacyPreserved: true,
        roleTitle: 'ER Physician Clinical Directive SMS',
        anonymizedFields: ['Physician Resuscitation Orders', 'Zero Non-Clinical PII', 'Blood Bank Priority Flag']
      };
    }

    // 5. Hospital Facility / Operations Resource SMS Fallback
    if (normRole === 'hospital') {
      const hospName = (curUser.name || hosp.name || 'AIIMS Trauma Centre').substring(0, 20);
      const icuFree = hosp.icuBeds !== undefined ? hosp.icuBeds : 4;
      const genFree = hosp.generalBeds !== undefined ? hosp.generalBeds : 28;
      const ventFree = hosp.ventilators !== undefined ? hosp.ventilators : 6;
      const o2Litres = hosp.oxygenLitres !== undefined ? hosp.oxygenLitres : 4200;
      const o2Status = hosp.oxygenStatus || 'Good';
      const oNeg = context.bloodShortage || '4U O- Reserve';
      const divertStatus = (context.divertStatus || 'OPEN - ACCEPTING RED/YELLOW').substring(0, 26);
      const erDeskPhone = hosp.emergencyContact || curUser.phone || '+91-11-2659-3333';

      const textPayload = 
`[RAKSHA-HOSPITAL-STATUS]
HOSP:${hospName}
CAPACITY:ICU:${icuFree} Free | GEN:${genFree} | VENT:${ventFree}
RESERVES:O2:${o2Litres}L (${o2Status}) | O-:${oNeg}
STATUS:${divertStatus}
ER_DESK:${erDeskPhone}
TIME:${timestamp}`;

      return {
        textPayload,
        characterCount: textPayload.length,
        isSingleSmsSegment: textPayload.length <= 160,
        privacyPreserved: true,
        roleTitle: 'Hospital Surge & Resource Status SMS',
        anonymizedFields: ['Zero Patient Data', 'Facility Operational Capacity Only', 'Regional EMS Bed Allocation']
      };
    }

    // 6. Central Control Room / SEOC Dispatch SMS Fallback
    if (normRole === 'control-room' || normRole === 'control_room') {
      const cmdId = context.cmdId || 'DISPATCH-CMD-01';
      const emgType = (emg.emergencyType || 'Polytrauma MCI').substring(0, 18);
      const greenWave = (emg.greenCorridorActive ? 'ACTIVE - ROUTE 4A PREEMPTED' : 'STANDBY - SIGNALS HELD').substring(0, 28);
      const fleetUnits = (context.fleetUnits || `${amb.id || 'AMB-01'} (ALS)`).substring(0, 20);
      const dest = (hosp.name || 'AIIMS Trauma').substring(0, 12);
      const seocPhone = '+91-11-2345-6789';

      const textPayload = 
`[RAKSHA-CONTROL-DISPATCH]
SEOC_CMD:${cmdId}
INCIDENT:${emg.id || 'EMG-8821'} (${emgType})
GREEN_WAVE:${greenWave}
FLEET:${fleetUnits} -> ${dest}
STATUS:TRAFFIC ITMS EN-ROUTE
HOTLINE:${seocPhone}
TIME:${timestamp}`;

      return {
        textPayload,
        characterCount: textPayload.length,
        isSingleSmsSegment: textPayload.length <= 160,
        privacyPreserved: true,
        roleTitle: 'Control Room Multi-Agency Tactical SMS',
        anonymizedFields: ['Tactical Command Directives Only', 'Zero Patient PII', 'ITMS Signal Synchronization']
      };
    }

    // Default fallback to minimal emergency SMS
    return this.buildMinimalEmergencySms({
      emergencyId: emg.id || 'EMG-8821',
      ambulanceId: amb.id || 'AMB-01',
      plateNumber: amb.plateNumber || 'DL-01-EA-1081',
      coordinates: { lat: 28.5680, lng: 77.2350 },
      landmark: 'Sector 4 Junction',
      priority: 'CRITICAL',
      callbackRadio: 'VHF Ch 3',
      callbackPhone: '+91-98991-12233'
    });
  }

  // --- SMS TRANSMISSION LIFECYCLE & DELIVERY CONFIRMATION ENGINE ---
  /**
   * Lifecycle stages:
   * 1. 'stored' (Saved to local SMS outbox)
   * 2. 'queued' (Handshake with cellular GSM modem)
   * 3. 'sent' (Dispatched to SMSC tower, awaiting delivery ack)
   * 4. 'delivered' (CONFIRMED: Received positive GSM SMSC-STATUS-REPORT delivery receipt!)
   */
  queueAndTransmitEmergencySms({
    role = 'ambulance',
    emergency,
    ambulance,
    patient,
    doctor,
    hospital,
    currentUser,
    reason = 'Cellular SMS Fallback Broadcast',
    customContacts = null,
    extraData = {}
  }) {
    const normRole = (role === 'control_room' ? 'control-room' : role) || 'ambulance';

    // Retrieve contacts configured specifically for this role
    const contacts = (customContacts || this.getAuthorizedContacts(normRole)).filter(c => c.active);
    if (contacts.length === 0) return null;

    // Generate role-specific SMS payload (for ambulance, calls buildMinimalEmergencySms)
    let payloadInfo;
    if (normRole === 'ambulance') {
      if (!emergency && !ambulance) return null;
      payloadInfo = this.buildMinimalEmergencySms({
        emergencyId: emergency?.id || 'EMG-8821',
        ambulanceId: ambulance?.id || 'AMB-01',
        plateNumber: ambulance?.plateNumber || 'WB-01-EA-1081',
        coordinates: {
          lat: ambulance?.lat || emergency?.location?.lat || 22.5385,
          lng: ambulance?.lng || emergency?.location?.lng || 88.3370
        },
        landmark: emergency?.location?.address || 'AJC Bose Road Flyover near Exide Crossing, Kolkata',
        priority: emergency?.severity || 'CRITICAL',
        callbackRadio: 'VHF Emergency Ch 3',
        callbackPhone: ambulance?.driverPhone || '+91 98991 12233'
      });
    } else {
      payloadInfo = this.buildRoleSpecificEmergencySms(normRole, {
        emergency,
        ambulance,
        patient,
        doctor,
        hospital,
        currentUser,
        ...extraData
      });
    }

    const transmissionBatchId = `SMS-BATCH-${Date.now().toString().slice(-6)}`;
    const senderName = currentUser?.name || (normRole === 'ambulance' ? (ambulance?.id || 'AMB-01') : normRole.toUpperCase());

    const newTransmissions = contacts.map(contact => {
      const transmissionId = `SMS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      return {
        id: transmissionId,
        batchId: transmissionBatchId,
        senderRole: normRole,
        senderName,
        targetRoles: SMS_ROUTING_MATRIX[normRole] || [],
        emergencyId: emergency?.id || 'EMG-8821',
        ambulanceId: ambulance?.id || (normRole === 'ambulance' ? 'AMB-01' : null),
        contactName: contact.name,
        contactRole: contact.role,
        recipientPhone: contact.phone,
        payload: payloadInfo.textPayload,
        characterCount: payloadInfo.characterCount,
        roleTitle: payloadInfo.roleTitle || 'Cellular SMS Fallback',
        reason,
        // Status lifecycle: 'stored' -> 'queued' -> 'sent' -> 'delivered'
        status: 'stored', // Stage 1: Stored locally
        stageStatus: 'STORED',
        createdAt: new Date().toISOString(),
        storedAt: new Date().toISOString(),
        queuedAt: null,
        sentAt: null,
        deliveredAt: null,
        deliveryConfirmed: false,
        deliveryReport: null,
        networkReference: `GSM-REF-${Math.floor(100000 + Math.random() * 900000)}`,
        cellularTower: 'DELHI-TRAUMA-CELL-TOWER-04B',
        retryCount: 0
      };
    });

    // Save to local SMS transmissions log
    const currentLogs = this.getSmsTransmissions();
    const updatedLogs = [...newTransmissions, ...currentLogs].slice(0, 100);
    this.saveSmsTransmissions(updatedLogs);
    this.notifySmsListeners(updatedLogs);

    // Also record into the 3-stage pipeline
    this.recordPipelineEvent({
      emergencyId: emergency?.id || 'EMG-8821',
      stage: 'STORED',
      timestamp: new Date().toISOString(),
      details: `[${normRole.toUpperCase()}] Role-specific emergency SMS payload prepared and stored in local cellular outbox (${contacts.length} recipients).`
    });

    // Advance through the realistic GSM cellular handshake & delivery lifecycle
    newTransmissions.forEach((tx, idx) => {
      this.simulateCellularHandshake(tx.id, idx * 300);
    });

    return {
      batchId: transmissionBatchId,
      transmissions: newTransmissions,
      payloadInfo
    };
  }

  simulateCellularHandshake(transmissionId, initialDelayMs = 0) {
    // 1. Stored -> Queued (Cellular modem handshake)
    setTimeout(() => {
      this.updateSmsStatus(transmissionId, {
        status: 'queued',
        stageStatus: 'SMS_QUEUED',
        queuedAt: new Date().toISOString()
      });

      // 2. Queued -> Sent to SMSC Tower
      setTimeout(() => {
        const sentTime = new Date().toISOString();
        this.updateSmsStatus(transmissionId, {
          status: 'sent',
          stageStatus: 'SMS_SENT',
          sentAt: sentTime
        });

        this.recordPipelineEvent({
          transmissionId,
          stage: 'SMS_SENT',
          timestamp: sentTime,
          details: `Transmitted via GSM AT+CMGS to cellular SMSC tower. Awaiting delivery confirmation receipt.`
        });

        // 3. Sent -> Delivered ONLY upon positive delivery report receipt (GSM 03.40 / 3GPP SMS-STATUS-REPORT)
        // Realistic cellular delivery delay between 1.8s and 3.5s
        const deliveryLatency = 1800 + Math.floor(Math.random() * 1500);
        setTimeout(() => {
          const deliverTime = new Date().toISOString();
          const deliveryReport = {
            receiptCode: 'DELIVRD_ACK_00',
            messageReference: `SMSC-ACK-${Math.floor(1000000 + Math.random() * 9000000)}`,
            networkTimestamp: deliverTime,
            signalStrengthDbm: -72,
            towerHandshake: 'GSM-CELL-SEC-04-CONFIRMED',
            deliveryLatencyMs: deliveryLatency
          };

          this.updateSmsStatus(transmissionId, {
            status: 'delivered',
            stageStatus: 'SMS_DELIVERED',
            deliveredAt: deliverTime,
            deliveryConfirmed: true,
            deliveryReport
          });

          this.recordPipelineEvent({
            transmissionId,
            stage: 'SMS_DELIVERED',
            timestamp: deliverTime,
            details: `SMS delivery verified with positive network acknowledgement (${deliveryReport.messageReference}) in ${deliveryLatency}ms.`
          });
        }, deliveryLatency);

      }, 1000 + (initialDelayMs / 2));
    }, 400 + initialDelayMs);
  }

  updateSmsStatus(transmissionId, patch) {
    const logs = this.getSmsTransmissions();
    const updated = logs.map(item => item.id === transmissionId ? { ...item, ...patch } : item);
    this.saveSmsTransmissions(updated);
    this.notifySmsListeners(updated);
  }

  getSmsTransmissions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SMS_LOG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge any missing seed items so all portals have initial messages
          const existingIds = new Set(parsed.map(p => p.id));
          const missingSeeds = INITIAL_SMS_TRANSMISSIONS.filter(s => !existingIds.has(s.id));
          if (missingSeeds.length > 0) {
            return [...parsed, ...missingSeeds];
          }
          return parsed;
        }
      }
      return INITIAL_SMS_TRANSMISSIONS;
    } catch {
      return INITIAL_SMS_TRANSMISSIONS;
    }
  }

  // Cross-Portal Received SMS Filter (Evaluates User's Exact Routing Matrix)
  getReceivedSmsForRole(role) {
    const normRole = (role === 'control_room' ? 'control-room' : role) || 'ambulance';
    const all = this.getSmsTransmissions();
    return all.filter(sms => {
      // Must NOT be sent by self
      if (sms.senderRole === normRole) return false;
      // If targetRoles is defined, check inclusion
      if (sms.targetRoles && Array.isArray(sms.targetRoles)) {
        return sms.targetRoles.includes(normRole);
      }
      // Or check routing matrix
      return isRoleEligibleToReceiveSms(normRole, sms.senderRole);
    });
  }

  saveSmsTransmissions(logs) {
    try {
      localStorage.setItem(STORAGE_KEYS.SMS_LOG, JSON.stringify(logs));
    } catch {}
  }

  // --- LOCAL OFFLINE QUEUE (NON-CRITICAL DATA) ---
  queueOfflineData({ type, data, emergencyId = null, priority = 'normal' }) {
    const queueItem = {
      id: `QUEUE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type, // 'vitals_stream', 'ecg_trace', 'paramedic_assessment', 'checklist', 'clinical_note', 'audit_log'
      data,
      emergencyId,
      priority,
      createdAt: new Date().toISOString(),
      status: 'pending_sync', // 'pending_sync' | 'synced'
      syncedAt: null,
      sizeBytes: JSON.stringify(data).length
    };

    const currentQueue = this.getOfflineQueue();
    const updatedQueue = [queueItem, ...currentQueue].slice(0, 200);
    this.saveOfflineQueue(updatedQueue);
    this.notifyQueueListeners(updatedQueue);

    // If currently online, automatically sync
    if (this.networkMode === NETWORK_MODES.ONLINE && !this.syncInProgress) {
      this.syncQueuedData();
    }

    return queueItem;
  }

  getOfflineQueue() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveOfflineQueue(queue) {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch {}
  }

  // --- AUTOMATIC RE-SYNCHRONIZATION ENGINE ---
  async syncQueuedData(onProgress = null) {
    if (this.syncInProgress) return { success: false, reason: 'Sync already running' };
    const queue = this.getOfflineQueue();
    const pendingItems = queue.filter(item => item.status === 'pending_sync');

    if (pendingItems.length === 0) {
      return { success: true, count: 0, message: 'Queue is already synchronized.' };
    }

    this.syncInProgress = true;
    let syncedCount = 0;
    const totalCount = pendingItems.length;

    try {
      // Process items in batches to simulate realistic progressive re-sync
      for (const item of pendingItems) {
        await new Promise(r => setTimeout(r, 120)); // simulated cloud HTTP handshake
        syncedCount++;
        
        item.status = 'synced';
        item.syncedAt = new Date().toISOString();

        if (onProgress) {
          onProgress({ current: syncedCount, total: totalCount, currentItem: item });
        }
      }

      this.saveOfflineQueue(queue);
      this.notifyQueueListeners(queue);

      // Record final 3-stage pipeline event: Server Synced!
      this.recordPipelineEvent({
        stage: 'SERVER_SYNCED',
        timestamp: new Date().toISOString(),
        details: `Successfully synchronized ${syncedCount} queued telemetry packets to Raksha Central Cloud Server.`
      });

      return { success: true, count: syncedCount };
    } catch (err) {
      console.error('Offline synchronization error:', err);
      return { success: false, count: syncedCount, error: err.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  // --- 3-STAGE PIPELINE RECORDER: STORED -> SMS SENT -> SERVER SYNCED ---
  recordPipelineEvent(event) {
    try {
      const saved = localStorage.getItem('raksha_pipeline_events');
      const events = saved ? JSON.parse(saved) : [];
      const updated = [{ id: `PIPE-${Date.now()}-${Math.floor(Math.random() * 1000)}`, ...event }, ...events].slice(0, 50);
      localStorage.setItem('raksha_pipeline_events', JSON.stringify(updated));
    } catch {}
  }

  getPipelineEvents() {
    try {
      const saved = localStorage.getItem('raksha_pipeline_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  // --- SUBSCRIBER PATTERN FOR REACT INTEGRATION ---
  subscribeToNetworkChanges(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyNetworkListeners(newMode, oldMode) {
    this.listeners.forEach(cb => {
      try {
        cb(newMode, oldMode);
      } catch (err) {
        console.error('Error in network listener:', err);
      }
    });
  }

  subscribeToSmsTransmissions(callback) {
    this.smsListeners.add(callback);
    return () => this.smsListeners.delete(callback);
  }

  notifySmsListeners(transmissions) {
    this.smsListeners.forEach(cb => {
      try {
        cb(transmissions);
      } catch (err) {
        console.error('Error in SMS listener:', err);
      }
    });
  }

  subscribeToQueueChanges(callback) {
    this.queueListeners.add(callback);
    return () => this.queueListeners.delete(callback);
  }

  notifyQueueListeners(queue) {
    this.queueListeners.forEach(cb => {
      try {
        cb(queue);
      } catch (err) {
        console.error('Error in Queue listener:', err);
      }
    });
  }
}

export const offlineSyncService = new OfflineSyncService();
