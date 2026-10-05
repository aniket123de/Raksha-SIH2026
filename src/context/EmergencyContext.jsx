import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialData } from '../../server/data.js';
import {
  createInitialDigitalTwin,
  getOrInitDigitalTwin,
  updateDigitalTwinVitals,
  updateDigitalTwinStatus,
  addDigitalTwinTreatment,
  addDigitalTwinMedication
} from '../services/digitalTwinService.js';
import {
  offlineSyncService,
  NETWORK_MODES,
  SMS_ROUTING_MATRIX,
  getAllowedSendersForRole,
  isRoleEligibleToReceiveSms
} from '../services/offlineSyncService.js';
import { isEmtUser } from '../utils/userRoleUtils.js';

const EmergencyContext = createContext(null);

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};

export const EmergencyProvider = ({ children }) => {
  // Authentication & Active User Session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('emergencylink_auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const freshUser = initialData.users.find(u => u.id === parsed.id || u.username === parsed.username);
        return freshUser || parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Current Role: 'patient' | 'doctor' | 'ambulance' | 'hospital' | 'control-room'
  const currentRole = currentUser?.role ? currentUser.role.toLowerCase().replace(/_/g, '-') : null;

  // Active Tab inside Current Portal
  const [portalTab, setPortalTab] = useState(() => {
    try {
      const savedUser = localStorage.getItem('emergencylink_auth_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role?.toLowerCase() === 'patient') return 'Home';
        if (u.role?.toLowerCase() === 'paramedic') return 'Profile';
      }
    } catch {}
    return 'Dashboard';
  });

  // Modal Controls
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState('patient');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isMedicalQrModalOpen, setIsMedicalQrModalOpen] = useState(false);
  const [medicalQrPatient, setMedicalQrPatient] = useState(null);

  const openMedicalQrForPatient = (pat) => {
    setMedicalQrPatient(pat || patients[0]);
    setIsMedicalQrModalOpen(true);
  };

  // 3D Digital Twin Modal & Target State
  const [isDigitalTwinModalOpen, setIsDigitalTwinModalOpen] = useState(false);
  const [digitalTwinTarget, setDigitalTwinTarget] = useState(null);
  const [digitalTwinRevision, setDigitalTwinRevision] = useState(0);

  const openDigitalTwinForPatient = (target) => {
    setDigitalTwinTarget(target || activeEmergencies[0] || patients[0]);
    setIsDigitalTwinModalOpen(true);
  };

  // Operational Data State
  const [users, setUsers] = useState(initialData.users);

  const [hospitals, setHospitals] = useState(() => {
    try {
      const saved = localStorage.getItem('emergencylink_hospitals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].lat > 25) {
          localStorage.removeItem('emergencylink_hospitals');
          return initialData.hospitals;
        }
        return parsed;
      }
    } catch {}
    return initialData.hospitals;
  });

  const [ambulances, setAmbulances] = useState(() => {
    try {
      const saved = localStorage.getItem('emergencylink_ambulances');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].lat > 25) {
          localStorage.removeItem('emergencylink_ambulances');
          return initialData.ambulances;
        }
        return initialData.ambulances.map(initAmb => {
          const matching = parsed.find(p => p.id === initAmb.id);
          const assignedStatus = ['AMB-01', 'AMB-02', 'AMB-03'].includes(initAmb.id) ? 'Assigned' : (matching?.status || initAmb.status);
          return matching ? { ...initAmb, ...matching, status: assignedStatus, lat: initAmb.lat, lng: initAmb.lng, direction: initAmb.direction, baseStation: initAmb.baseStation } : initAmb;
        });
      }
    } catch {}
    return initialData.ambulances;
  });

  const [doctors, setDoctors] = useState(() => {
    const saved = localStorage.getItem('emergencylink_doctors');
    return saved ? JSON.parse(saved) : initialData.doctors;
  });

  const [patients, setPatients] = useState(() => {
    try {
      const saved = localStorage.getItem('emergencylink_patients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(p => p.address && p.address.includes('New Delhi'))) {
          localStorage.removeItem('emergencylink_patients');
          return initialData.patients;
        }
        return parsed;
      }
    } catch {}
    return initialData.patients;
  });

  const [activeEmergencies, setActiveEmergencies] = useState(() => {
    try {
      const saved = localStorage.getItem('emergencylink_emergencies');
      if (saved) {
        let emgs = JSON.parse(saved);
        if (Array.isArray(emgs) && emgs.some(e => e.location?.lat > 25 || (e.location?.address && e.location.address.includes('New Delhi')))) {
          localStorage.removeItem('emergencylink_emergencies');
          return initialData.activeEmergencies;
        }
        if (Array.isArray(emgs) && emgs.length > 0) {
          const emg0 = emgs[0];
          if (!emg0.assignedAmbulanceIds || emg0.assignedAmbulanceIds.length <= 1 || emg0.status === 'Transporting' || emg0.numberOfAmbulances === 1) {
            emgs[0] = {
              ...emg0,
              status: 'En Route',
              numberOfAmbulances: 3,
              assignedAmbulanceIds: ['AMB-01', 'AMB-02', 'AMB-03'],
              assignedAmbulanceId: 'AMB-01'
            };
            localStorage.setItem('emergencylink_emergencies', JSON.stringify(emgs));
          }
        }
        return emgs;
      }
    } catch {}
    return initialData.activeEmergencies;
  });

  const [organTransports, setOrganTransports] = useState(() => {
    const saved = localStorage.getItem('emergencylink_organ_transports');
    return saved ? JSON.parse(saved) : initialData.organTransports;
  });

  const [trafficSignals, setTrafficSignals] = useState(() => {
    const saved = localStorage.getItem('emergencylink_traffic_signals');
    return saved ? JSON.parse(saved) : initialData.trafficSignals;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('emergencylink_audit_logs');
    return saved ? JSON.parse(saved) : initialData.auditLogs;
  });

  const [notifications, setNotifications] = useState([
    {
      id: "NOTIF-1",
      timestamp: new Date().toLocaleTimeString(),
      title: "System Ready",
      message: "Raksha 24/7 network initialized. GPS and GIS telemetry linked.",
      type: "info",
      targetRole: "all"
    }
  ]);

  // LiDAR Obstacle & Dynamic Rerouting State (Shared across all portals and maps)
  const [lidarRerouteState, setLidarRerouteState] = useState(() => {
    try {
      const saved = localStorage.getItem('emergencylink_lidar_reroute');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      hasObstacle: true,
      activeRoute: 'bypass',
      bypassedVia: 'Barapullah Elevated Bypass (Corridor B)',
      timeSaved: '6.4 mins',
      obstacleTitle: 'Stalled Heavy Commercial Truck',
      obstacleDistance: 38.4
    };
  });

  // Track whether Emergency SOS Assistance Protocol was completed from the beginning
  const [sosSessionActive, setSosSessionActive] = useState(() => {
    try {
      return sessionStorage.getItem('raksha_sos_wizard_completed') === 'true';
    } catch {
      return false;
    }
  });

  const isEmergencyProtocolCompleted = Boolean(
    sosSessionActive &&
    (typeof window !== 'undefined' && sessionStorage.getItem('raksha_sos_wizard_completed') === 'true') &&
    activeEmergencies?.some(e =>
      e.status !== 'Completed' &&
      e.sosPressed === true &&
      (e.assessmentCompleted || (e.triageScore && e.triageScore.consciousness && e.triageScore.abilityToWalk && e.triageScore.breathing))
    )
  );

  const updateLidarReroute = (newState) => {
    setLidarRerouteState(prev => {
      const updated = typeof newState === 'function' ? newState(prev) : { ...prev, ...newState };
      try {
        localStorage.setItem('emergencylink_lidar_reroute', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const triggerLidarObstacle = (type = 'stalled-truck', details = {}) => {
    const state = {
      hasObstacle: true,
      activeRoute: 'bypass',
      bypassedVia: 'Barapullah Elevated Bypass (Corridor B)',
      timeSaved: '6.4 mins',
      obstacleType: type,
      obstacleTitle: details.title || 'Stalled Heavy Commercial Truck',
      obstacleDistance: details.distance || 38.4
    };
    updateLidarReroute(state);
    addNotification(
      '🚨 LiDAR Obstacle Detected — Route Diverted',
      `Forward hazard detected @ ${state.obstacleDistance}m. First ambulance rerouted via Barapullah Bypass. Nearby fleet notified.`,
      'warning',
      'ambulance'
    );
  };

  const clearLidarObstacle = () => {
    const state = {
      hasObstacle: false,
      activeRoute: 'primary',
      bypassedVia: null,
      timeSaved: null,
      obstacleType: null,
      obstacleTitle: null,
      obstacleDistance: null
    };
    updateLidarReroute(state);
    addNotification(
      '✅ LiDAR Hazard Cleared — Primary Route Resumed',
      'Corridor confirmed clear (> 150m). First ambulance resumed previous primary route (Outer Ring Road Express).',
      'success',
      'ambulance'
    );
  };

  // Digital Green Corridor Organ Logistics Multi-Ambulance State
  const [organCorridorState, setOrganCorridorState] = useState(() => {
    try {
      const saved = localStorage.getItem('emergencylink_organ_corridor_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isDispatched: Boolean(parsed.isDispatched ?? parsed.isMapGenerated),
          isMapGenerated: Boolean(parsed.isDispatched ?? parsed.isMapGenerated)
        };
      }
    } catch {}
    return {
      isDispatched: false,
      isMapGenerated: false,
      numberOfAmbulances: 1, // 1, 2, 3, 4, or 'Many'
      assignedAmbulanceIds: ['AMB-03'],
      selectedAmbulanceId: 'AMB-03',
      organType: "Donor Heart (24M, Brainstem Death)",
      donorHospitalName: "Institute of Neurosciences Kolkata (I-NK)",
      donorLocation: { lat: 22.5430, lng: 88.3640 },
      recipientHospitalName: "Apollo Multispeciality Hospitals Kolkata",
      recipientLocation: { lat: 22.5744, lng: 88.4038 },
      medicalEscort: "Dr. K. Nair (NOTTO Transplant Surgeon)",
      coldIschemiaLimitHours: 4.0,
      ischemiaElapsedMinutes: 38,
      preservationTemp: "4.1 °C (Optimal)",
      routeDistanceKm: 7.2,
      etaMinutes: 11,
      speedKmh: 68,
      greenWaveSignalsPreempted: 8,
      trafficPoliceClearance: "GRANTED",
      lastUpdated: new Date().toISOString()
    };
  });

  const dispatchOrganCorridor = (forcedState) => {
    let nextDispatchedVal = true;
    setOrganCorridorState(prev => {
      const nextDispatched = forcedState !== undefined ? forcedState : !(prev.isDispatched ?? prev.isMapGenerated);
      nextDispatchedVal = nextDispatched;
      const updated = {
        ...prev,
        isDispatched: nextDispatched,
        isMapGenerated: nextDispatched,
        dispatchedAt: nextDispatched ? new Date().toISOString() : null,
        lastUpdated: new Date().toISOString()
      };
      try {
        localStorage.setItem('emergencylink_organ_corridor_state', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const isMany = organCorridorState.numberOfAmbulances === 'Many' || organCorridorState.numberOfAmbulances === 'many';
    const countLabel = isMany ? 'Many (5 Convoy Ambulances)' : `${organCorridorState.numberOfAmbulances || 1} Convoy Ambulance(s)`;

    if (nextDispatchedVal) {
      addNotification(
        'Digital Green Corridor Dispatched',
        `🚨 Digital Green Corridor Organ Convoy DISPATCHED: ${countLabel} carrying Donor Heart en route to Apollo Multispeciality Hospitals with synchronized Green Wave signals. Live map unlocked across Ambulance & Hospital portals.`,
        'success',
        'all'
      );
    } else {
      addNotification(
        'Digital Green Corridor Standby',
        'Digital Green Corridor convoy returned to Standby mode across Ambulance and Hospital portals.',
        'info',
        'all'
      );
    }
  };

  const toggleOrganCorridorMap = (forcedState) => {
    dispatchOrganCorridor(forcedState);
  };

  const setOrganCorridorAmbulanceCount = (count) => {
    const isMany = count === 'Many' || count === 'many';
    const num = isMany ? 5 : Number(count) || 1;
    const defaultIds = ['AMB-03', 'AMB-01', 'AMB-02', 'AMB-04', 'AMB-05'];
    const assignedIds = defaultIds.slice(0, num);

    setOrganCorridorState(prev => {
      const updated = {
        ...prev,
        numberOfAmbulances: count,
        assignedAmbulanceIds: assignedIds,
        lastUpdated: new Date().toISOString()
      };
      try {
        localStorage.setItem('emergencylink_organ_corridor_state', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    addNotification(
      'Organ Convoy Fleet Scaled',
      `Digital Green Corridor Organ transit fleet scaled to ${isMany ? 'Many (Full Convoy)' : `${count} Ambulance(s)`} carrying organ. Synchronized with Hospital Portal.`,
      'info',
      'all'
    );
  };

  const setSelectedCorridorAmbulance = (ambulanceId) => {
    setOrganCorridorState(prev => {
      const updated = {
        ...prev,
        selectedAmbulanceId: ambulanceId,
        lastUpdated: new Date().toISOString()
      };
      try {
        localStorage.setItem('emergencylink_organ_corridor_state', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Telemedicine Directives & Clinical Orders (Synchronized between Doctor and Paramedic/EMT)
  const [teleDirectives, setTeleDirectives] = useState(() => {
    try {
      const saved = localStorage.getItem('emergencylink_tele_directives');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'DIR-1',
        time: '2 mins ago',
        order: 'Administer 1g IV Tranexamic Acid (TXA) over 10 min for suspected pelvic internal bleeding.',
        status: 'Executed',
        priority: 'high',
        author: 'Dr. Ananya Sen'
      },
      {
        id: 'DIR-2',
        time: 'Just now',
        order: 'Maintain High-Flow O2 via non-rebreather at 15 L/min. Target SpO2 ≥ 94%.',
        status: 'Active',
        priority: 'urgent',
        author: 'Dr. Ananya Sen'
      },
      {
        id: 'DIR-3',
        time: 'Awaiting Ack',
        order: 'Infuse 500 mL warm Normal Saline under pressure; prepare Trauma Bay 1 for immediate ultrasound (FAST).',
        status: 'Pending',
        priority: 'urgent',
        author: 'Dr. Ananya Sen'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('emergencylink_tele_directives', JSON.stringify(teleDirectives));
    } catch {}
  }, [teleDirectives]);

  // Synchronize Digital Green Corridor Organ state across windows/tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'emergencylink_organ_corridor_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setOrganCorridorState(prev => ({
            ...prev,
            ...parsed,
            isDispatched: Boolean(parsed.isDispatched ?? parsed.isMapGenerated),
            isMapGenerated: Boolean(parsed.isDispatched ?? parsed.isMapGenerated)
          }));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('emergencylink_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('emergencylink_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('emergencylink_emergencies', JSON.stringify(activeEmergencies));
  }, [activeEmergencies]);

  useEffect(() => {
    localStorage.setItem('emergencylink_ambulances', JSON.stringify(ambulances));
  }, [ambulances]);

  useEffect(() => {
    localStorage.setItem('emergencylink_hospitals', JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    localStorage.setItem('emergencylink_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('emergencylink_doctors', JSON.stringify(doctors));
  }, [doctors]);

  const sirenAudioContextRef = useRef(null);
  const sirenNodesRef = useRef(null);

  // Start continuous emergency siren synthesis (realistic Code 3 / European emergency wail)
  const startContinuousSiren = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!sirenAudioContextRef.current || sirenAudioContextRef.current.state === 'closed') {
        sirenAudioContextRef.current = new AudioCtx();
      }
      const ctx = sirenAudioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // If already playing, do not create duplicate oscillators
      if (sirenNodesRef.current) return;

      // 1. Primary Carrier Oscillator (Emergency vehicle horn sawtooth)
      const carrier = ctx.createOscillator();
      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(750, ctx.currentTime);

      // 2. Continuous Low-Frequency Oscillator (LFO) for authentic Wail sweep
      const lfo = ctx.createOscillator();
      lfo.type = 'triangle';
      lfo.frequency.setValueAtTime(0.55, ctx.currentTime); // ~1.8s full cycle (realistic ambulance wail)

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(260, ctx.currentTime); // sweeps pitch smoothly between 490 Hz and 1010 Hz

      lfo.connect(lfoGain);
      lfoGain.connect(carrier.frequency);

      // 3. Acoustic Speaker Horn Resonance Filter (Low-pass)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, ctx.currentTime);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);

      // 4. Master Volume Gain Node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3); // smooth, non-jarring ramp up

      carrier.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      carrier.start();
      lfo.start();

      sirenNodesRef.current = { carrier, lfo, lfoGain, filter, masterGain, ctx };
    } catch (err) {
      console.warn('AudioContext autoplay restricted until user interaction:', err);
    }
  };

  // Stop continuous emergency siren synthesis
  const stopContinuousSiren = () => {
    try {
      if (sirenNodesRef.current) {
        const { carrier, lfo, masterGain, ctx } = sirenNodesRef.current;
        masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15); // smooth fade out
        setTimeout(() => {
          try {
            carrier.stop();
            lfo.stop();
            carrier.disconnect();
            lfo.disconnect();
            masterGain.disconnect();
          } catch {
            // ignore cleanup errors
          }
        }, 160);
        sirenNodesRef.current = null;
      }
    } catch {
      sirenNodesRef.current = null;
    }
  };

  // Toggle continuous siren on/off
  const toggleSiren = () => {
    setSoundEnabled(prev => !prev);
  };

  // Synchronize continuous siren state with soundEnabled
  useEffect(() => {
    if (soundEnabled) {
      startContinuousSiren();
    } else {
      stopContinuousSiren();
    }
    return () => {
      stopContinuousSiren();
    };
  }, [soundEnabled]);

  // Short alert tone for discrete notification events
  const playAlertSound = (type = 'urgent') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = sirenAudioContextRef.current || new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type === 'urgent' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(type === 'urgent' ? 880 : 440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(type === 'urgent' ? 440 : 880, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext policy restriction fallback
    }
  };

  // Helper for audit logging
  const logAudit = (actorId, actorRole, action, details) => {
    const entry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorId,
      actorRole,
      action,
      details
    };
    setAuditLogs(prev => [entry, ...prev.slice(0, 50)]);
    return entry;
  };

  // Push notification helper
  const addNotification = (title, message, type = 'info', targetRole = 'all') => {
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title,
      message,
      type, // 'urgent', 'success', 'warning', 'info'
      targetRole
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 30)]);
    if (type === 'urgent') playAlertSound('urgent');
    else playAlertSound('normal');
  };

  // --- OFFLINE-FIRST & CELLULAR SMS FALLBACK STATE ---
  const [networkMode, setNetworkModeState] = useState(() => offlineSyncService.getNetworkMode());
  const [smsTransmissions, setSmsTransmissions] = useState(() => offlineSyncService.getSmsTransmissions());
  const [offlineQueue, setOfflineQueue] = useState(() => offlineSyncService.getOfflineQueue());
  const [authorizedSmsContacts, setAuthorizedSmsContactsState] = useState(() => offlineSyncService.getAuthorizedContacts(currentRole || 'ambulance'));
  const [isSyncing, setIsSyncing] = useState(false);

  // Keep authorized contacts in sync when portal role changes
  useEffect(() => {
    const role = (currentRole === 'control_room' ? 'control-room' : currentRole) || 'ambulance';
    setAuthorizedSmsContactsState(offlineSyncService.getAuthorizedContacts(role));
  }, [currentRole]);

  const setAuthorizedSmsContacts = (contacts, role = null) => {
    const targetRole = role || (currentRole === 'control_room' ? 'control-room' : currentRole) || 'ambulance';
    offlineSyncService.saveAuthorizedContacts(contacts, targetRole);
    setAuthorizedSmsContactsState(contacts);
  };

  const getRoleContacts = (role) => {
    return offlineSyncService.getAuthorizedContacts(role);
  };

  const getReceivedSmsForRole = (role) => {
    return offlineSyncService.getReceivedSmsForRole(role);
  };

  const receivedSms = offlineSyncService.getReceivedSmsForRole(currentRole || 'ambulance');

  const triggerEmergencySmsFallback = (customEmergency = null, customAmbulance = null, reason = 'Automated Fallback Trigger', options = {}) => {
    const role = options.role || (currentRole === 'control_room' ? 'control-room' : currentRole) || 'ambulance';
    const emg = customEmergency || activeEmergencies.find(e => e.status !== 'Completed') || activeEmergencies[0];
    const amb = customAmbulance || ambulances.find(a => a.id === emg?.assignedAmbulanceId) || ambulances[0];
    const pat = (currentUser?.role?.toLowerCase() === 'patient' ? patients.find(p => p.id === currentUser?.referenceId) : null)
      || patients.find(p => p.id === emg?.patientId) || patients[0];
    const doc = doctors.find(d => d.id === currentUser?.referenceId) || doctors[0];
    const hosp = hospitals.find(h => h.id === emg?.destinationHospitalId) || hospitals[0];

    const roleContacts = options.customContacts || offlineSyncService.getAuthorizedContacts(role);

    const res = offlineSyncService.queueAndTransmitEmergencySms({
      role,
      emergency: emg,
      ambulance: amb,
      patient: pat,
      doctor: doc,
      hospital: hosp,
      currentUser,
      reason,
      customContacts: roleContacts,
      extraData: options.extraData || {}
    });

    if (res) {
      const senderAuditLabel = role === 'ambulance' ? 'Ambulance GSM Modem' : `${role.toUpperCase()} Radio Link`;
      logAudit(
        currentUser?.id || amb?.id || 'FALLBACK-GSM',
        senderAuditLabel,
        'EMERGENCY_SMS_DISPATCHED',
        `[${role.toUpperCase()}] Emergency SMS queued and transmitted to ${res.transmissions.length} authorized contacts via cellular failover. Status: Stored -> Sent (Awaiting Tower Delivery Confirmation).`
      );
      
      const roleNotifTitle = role === 'ambulance'
        ? '📡 Ambulance SMS Fallback Dispatched'
        : `📡 ${role.replace('-', ' ').toUpperCase()} Emergency SMS Dispatched`;

      addNotification(
        roleNotifTitle,
        `Role-specific packet (${res.payloadInfo?.roleTitle || 'Minimal Emergency SMS'}) transmitted via cellular radio for ${emg?.id || 'Active Incident'}. Delivery confirmation pending from SMSC.`,
        'urgent',
        'all'
      );
    }
    return res;
  };

  const setNetworkMode = (mode) => {
    offlineSyncService.setNetworkMode(mode);
    setNetworkModeState(mode);
    if (mode === NETWORK_MODES.SMS_FALLBACK) {
      triggerEmergencySmsFallback(null, null, 'Auto-triggered on SMS Fallback mode activation');
    }
  };

  const syncOfflineQueue = async () => {
    setIsSyncing(true);
    const result = await offlineSyncService.syncQueuedData();
    setIsSyncing(false);
    if (result.success && result.count > 0) {
      logAudit('SYSTEM-SYNC', 'Cloud Sync Engine', 'OFFLINE_DATA_SYNCHRONIZED', `Successfully reconciled ${result.count} queued records from local storage into cloud database.`);
      addNotification('Cloud Sync Complete', `Reconciled ${result.count} offline records with central server.`, 'success', 'all');
    }
    return result;
  };

  // Subscribe to offlineSyncService changes
  useEffect(() => {
    const unsubNet = offlineSyncService.subscribeToNetworkChanges((mode, oldMode) => {
      setNetworkModeState(mode);
      if (mode === NETWORK_MODES.OFFLINE) {
        addNotification('📶 Offline Mode Activated', 'Internet connectivity lost. Local GPS, cached maps, patient records, triage, and data logging active.', 'warning', 'all');
      } else if (mode === NETWORK_MODES.SMS_FALLBACK) {
        addNotification('📡 Cellular SMS Fallback Active', 'Mobile data unavailable. Cellular GSM SMS fallback active. Minimal emergency packets armed.', 'urgent', 'all');
      } else if (mode === NETWORK_MODES.WEAK_NETWORK) {
        addNotification('⚠️ Weak Network Connection', 'High packet loss / 2G detected. Priority queueing engaged.', 'warning', 'all');
      } else if (mode === NETWORK_MODES.ONLINE && oldMode !== NETWORK_MODES.ONLINE) {
        addNotification('🟢 Online Connection Restored', 'Broadband internet re-established. Synchronizing offline queue with central cloud...', 'success', 'all');
      }
    });

    const unsubSms = offlineSyncService.subscribeToSmsTransmissions((transmissions) => {
      setSmsTransmissions(transmissions);
    });

    const unsubQueue = offlineSyncService.subscribeToQueueChanges((queue) => {
      setOfflineQueue(queue);
    });

    return () => {
      unsubNet();
      unsubSms();
      unsubQueue();
    };
  }, []);

  // --- AUTHENTICATION ACTIONS ---
  const login = ({ username, password, role }) => {
    const foundUser = users.find(
      u => u.username.toLowerCase() === username?.trim().toLowerCase()
    );

    if (foundUser && (!password || foundUser.password === password)) {
      setCurrentUser(foundUser);
      const isPat = foundUser.role.toLowerCase() === 'patient';
      const isParamedicOrEmt = foundUser.role.toLowerCase() === 'paramedic';
      setPortalTab(isPat ? 'Home' : (isParamedicOrEmt ? 'Profile' : 'Dashboard'));
      setIsLoginModalOpen(false);
      logAudit(foundUser.id, foundUser.role, 'LOGIN_SUCCESS', `User ${foundUser.name} authenticated.`);
      addNotification('Welcome to Raksha', `Logged in as ${foundUser.name} (${foundUser.role}).`, 'success', foundUser.role.toLowerCase());
      return { success: true, user: foundUser };
    }

    // Fallback: direct demo login by target role
    const demoUser = users.find(u => u.role.toLowerCase() === role?.toLowerCase()) || users[0];
    setCurrentUser(demoUser);
    const isPatDemo = demoUser.role.toLowerCase() === 'patient';
    const isParamedicOrEmtDemo = demoUser.role.toLowerCase() === 'paramedic';
    setPortalTab(isPatDemo ? 'Home' : (isParamedicOrEmtDemo ? 'Profile' : 'Dashboard'));
    setIsLoginModalOpen(false);
    logAudit(demoUser.id, demoUser.role, 'DEMO_LOGIN', `Demo access granted as ${demoUser.name}.`);
    return { success: true, user: demoUser };
  };

  const logout = () => {
    if (currentUser) {
      logAudit(currentUser.id, currentUser.role, 'USER_LOGOUT', `User ${currentUser.name} logged out.`);
    }
    setCurrentUser(null);
    setPortalTab('Dashboard');
    setIsProfileModalOpen(false);
  };

  const openLoginForRole = (role) => {
    setLoginTargetRole(role);
    setIsLoginModalOpen(true);
  };

  // 1. SOS Dispatch Action
  const triggerSOS = ({
    patientId = 'PAT-01',
    emergencyType = 'Accident',
    severity = 'Critical',
    location = { address: "AJC Bose Road Flyover near Exide Crossing, Kolkata", lat: 22.5415, lng: 88.3485 },
    numberOfAmbulances = 1,
    triageData = null
  }) => {
    const patient = patients.find(p => p.id === patientId) || patients[0];

    // Smart Match: Find best available ambulance(s) based on requested count
    const isMany = numberOfAmbulances === 'Many' || numberOfAmbulances === 'many';
    const reqCount = isMany ? Math.max(ambulances.length, 5) : Math.max(1, Number(numberOfAmbulances) || 1);
    const availableAmbs = ambulances.filter(a => a.status === 'Available');
    const otherAmbs = ambulances.filter(a => a.status !== 'Available');
    const assignedAmbs = [...availableAmbs, ...otherAmbs].slice(0, reqCount);
    let matchedAmbulance = assignedAmbs[0] || ambulances[0] || null;

    // Target hospital: Best equipped hospital with ICU capacity
    const targetHosp = hospitals.find(h => h.icuBeds > 0) || hospitals[0];

    const newId = `EMG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmergency = {
      id: newId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientBloodGroup: patient.bloodGroup,
      emergencyType,
      severity,
      location,
      numberOfAmbulances,
      assignedAmbulanceIds: assignedAmbs.map(a => a.id),
      triageScore: triageData || {
        consciousness: "Alert",
        abilityToWalk: "No",
        breathing: "Rapid (24 bpm)",
        heartRate: 112,
        bloodPressure: "105/70 mmHg",
        oxygenSaturation: "92%",
        temperature: "37.0 °C",
        vitalsSummary: "Emergency triage recorded"
      },
      triageData: triageData || null,
      sosPressed: true,
      assessmentCompleted: Boolean(
        triageData &&
        triageData.consciousness &&
        triageData.abilityToWalk &&
        triageData.breathing
      ),
      wizardCompleted: true,
      status: matchedAmbulance ? 'Assigned' : 'Requested',
      assignedAmbulanceId: matchedAmbulance ? matchedAmbulance.id : null,
      destinationHospitalId: targetHosp.id,
      greenCorridorActive: false,
      trafficPreemptionStatus: 'Standard Routing (Traffic Police Permission Required)',
      trafficPolicePermission: 'PENDING',
      trafficPoliceRequired: true,
      trafficPoliceStatus: 'Traffic Police Permission Required - Click Grant Clearance to Activate Green Waves',
      etaMinutes: matchedAmbulance ? 6 : 10,
      distanceKm: 2.8,
      createdAt: new Date().toISOString(),
      medicalNotes: []
    };

    if (assignedAmbs.length > 0) {
      const assignedIds = assignedAmbs.map(a => a.id);
      setAmbulances(prev => prev.map(a => assignedIds.includes(a.id) ? { ...a, status: 'Assigned', currentEmergencyId: newId } : a));
    }

    setActiveEmergencies(prev => [newEmergency, ...prev]);
    setSosSessionActive(true);
    try {
      sessionStorage.setItem('raksha_sos_wizard_completed', 'true');
      localStorage.setItem('raksha_sos_wizard_completed', 'true');
    } catch {}

    // Automatically trigger continuous emergency siren for critical SOS
    setSoundEnabled(true);

    logAudit(patient.id, 'Patient', 'SOS_TRIGGERED', `Emergency (${emergencyType}) flagged as ${severity} at ${location.address}. Requested: ${numberOfAmbulances} units.`);
    addNotification('🚨 NEW CRITICAL SOS', `${emergencyType} reported for ${patient.name}. Severity: ${severity}.`, 'urgent', 'all');

    if (numberOfAmbulances === 'Many') {
      addNotification('🚨 MASS FLEET MOBILIZATION', `Mass casualty incident reported at ${location.address}. Many ambulances dispatched across regional sectors.`, 'urgent', 'all');
    } else if (matchedAmbulance) {
      addNotification('Ambulance Dispatched', `${matchedAmbulance.id} (${matchedAmbulance.plateNumber}) assigned to emergency ${newId}.`, 'urgent', 'ambulance');
    }

    return newEmergency;
  };

  // 2. Submit Emergency Assessment & Triage
  const submitEmergencyAssessment = (emergencyId, triageData, severity) => {
    setActiveEmergencies(prev => prev.map(emg => {
      if (emg.id === emergencyId) {
        return {
          ...emg,
          triageScore: triageData,
          triageData: triageData,
          severity: severity || emg.severity,
          assessmentCompleted: true
        };
      }
      return emg;
    }));

    logAudit('PAT-ASSESSMENT', 'Patient', 'ASSESSMENT_COMPLETED', `Clinical emergency assessment completed for emergency ${emergencyId}. Live GIS telemetry unlocked.`);
    addNotification('Assessment Completed', `Clinical emergency assessment submitted. Live map and corridor telemetry unlocked.`, 'success', 'patient');
  };

  // 3. Update Triage
  const updateTriage = (emergencyId, triageVitals, severity) => {
    setActiveEmergencies(prev => prev.map(emg => {
      if (emg.id === emergencyId) {
        return {
          ...emg,
          triageScore: triageVitals,
          triageData: triageVitals,
          severity: severity || emg.severity,
          assessmentCompleted: true
        };
      }
      return emg;
    }));

    logAudit('EMT-TRIAGE', 'Ambulance Personnel', 'TRIAGE_UPDATED', `Emergency ${emergencyId} triage vitals updated. SpO2: ${triageVitals.oxygenSaturation}, HR: ${triageVitals.heartRate}.`);
    addNotification('Triage Updated', `Vitals updated for emergency ${emergencyId}.`, 'info', 'doctor');
  };

  // 3. Update Ambulance status
  const updateAmbulanceStatus = (ambulanceId, newStatus, lat, lng) => {
    setAmbulances(prev => prev.map(amb => {
      if (amb.id === ambulanceId) {
        const updated = { ...amb, status: newStatus };
        if (lat !== undefined) updated.lat = lat;
        if (lng !== undefined) updated.lng = lng;
        return updated;
      }
      return amb;
    }));

    setActiveEmergencies(prev => prev.map(emg => {
      if (emg.assignedAmbulanceId === ambulanceId) {
        return { ...emg, status: newStatus };
      }
      return emg;
    }));

    logAudit(ambulanceId, 'Ambulance Unit', 'STATUS_CHANGE', `Ambulance ${ambulanceId} transitioned to "${newStatus}".`);
    addNotification(`Ambulance ${newStatus}`, `Vehicle ${ambulanceId} status changed to ${newStatus}.`, 'info', 'all');
  };

  // 4. Update Hospital Resources
  const updateHospitalResources = (hospitalId, updates) => {
    setHospitals(prev => prev.map(hosp => {
      if (hosp.id === hospitalId) {
        return { ...hosp, ...updates };
      }
      return hosp;
    }));

    logAudit(hospitalId, 'Hospital Admin', 'RESOURCE_UPDATE', `Hospital resources modified: ${JSON.stringify(updates)}`);
    addNotification('Resource Inventory Updated', `Hospital ${hospitalId} updated emergency capacity telemetry.`, 'info', 'hospital');
  };

  // 5. Add Doctor Clinical Note
  const addDoctorNote = (emergencyId, doctorName, noteText) => {
    const noteEntry = {
      id: `NOTE-${Date.now()}`,
      author: doctorName || 'Attending Physician',
      time: 'Just now',
      timestamp: new Date().toISOString(),
      note: noteText
    };

    setActiveEmergencies(prev => prev.map(emg => {
      if (emg.id === emergencyId) {
        return {
          ...emg,
          medicalNotes: [...(emg.medicalNotes || []), noteEntry]
        };
      }
      return emg;
    }));

    logAudit('DOC-01', 'Doctor', 'CLINICAL_NOTE_ADDED', `Clinical instruction logged for incident ${emergencyId}.`);
    addNotification('New Doctor Note', `${doctorName} added clinical instructions for emergency ${emergencyId}.`, 'info', 'all');
  };

  // 6. Emergency Consent Break-Glass
  const requestBreakGlassConsent = (patientId, doctorId, reason) => {
    logAudit(
      doctorId,
      'Doctor',
      'BREAK_GLASS_AUTHORIZATION',
      `Emergency Override: Full medical record access authorized for patient ${patientId}. Reason: ${reason}`
    );
    addNotification('Emergency Consent Access', `Medical record access authorized under emergency break-glass protocol.`, 'warning', 'doctor');
    return true;
  };

  // 7. Toggle Traffic Police Permission & Green Corridor
  const toggleTrafficPolicePermission = (emergencyId, enable) => {
    const isGranted = enable !== undefined ? enable : true;
    setActiveEmergencies(prev => {
      const targetId = emergencyId || prev[0]?.id;
      return prev.map(emg => {
        if (!targetId || emg.id === targetId) {
          return {
            ...emg,
            greenCorridorActive: isGranted,
            trafficPolicePermission: isGranted ? 'GRANTED' : 'NOT_GRANTED',
            trafficPolicePermissionRequired: true,
            trafficPreemptionStatus: isGranted
              ? 'Traffic Police Permission Granted - Route Turned GREEN'
              : 'Standard Routing (Traffic Police Permission Inactive)',
            trafficPoliceStatus: isGranted
              ? 'Traffic Police Permission Granted - Route Turned GREEN'
              : 'Traffic Police Permission Inactive'
          };
        }
        return emg;
      });
    });

    setTrafficSignals(prev => prev.map(sig => ({
      ...sig,
      state: isGranted ? 'GREEN' : 'NORMAL_CYCLE'
    })));

    logAudit(
      'TRAFFIC-POLICE-ITMS',
      'Traffic Police ITMS',
      isGranted ? 'TRAFFIC_POLICE_PERMISSION_GRANTED' : 'TRAFFIC_POLICE_PERMISSION_REVOKED',
      `Traffic police permission ${isGranted ? 'GRANTED - Routes turned GREEN' : 'REVOKED'} for emergency ${emergencyId || 'active'}.`
    );

    addNotification(
      isGranted ? '🟢 TRAFFIC POLICE PERMISSION: ROUTES TURNED GREEN' : 'Traffic Police Permission Deactivated',
      isGranted
        ? `Traffic Police ITMS authorized emergency clearance. Responding ambulance routes turned GREEN.`
        : 'Emergency route returned to standard traffic cycle.',
      isGranted ? 'urgent' : 'info',
      'all'
    );
  };

  const toggleGreenCorridor = (emergencyId, enable) => {
    toggleTrafficPolicePermission(emergencyId, enable);
  };

  // 8. Update Organ Transport
  const updateOrganTransport = (transportId, updates) => {
    setOrganTransports(prev => prev.map(ot => {
      if (ot.id === transportId) {
        return { ...ot, ...updates, lastUpdated: new Date().toISOString() };
      }
      return ot;
    }));

    logAudit(transportId, 'NOTTO Transplant Coordinator', 'ORGAN_TRANSPORT_UPDATE', `Organ transport status updated: ${JSON.stringify(updates)}`);
    addNotification('Organ Transport Telemetry', `Case ${transportId} updated: ${updates.status || 'condition logged'}.`, 'warning', 'all');
  };

  // 10. Role Switching for Demo & Walkthrough
  const setCurrentRole = (role) => {
    const roleKey = role?.toLowerCase();
    const demoUser = users.find(u => u.role.toLowerCase() === roleKey) || users[0];
    setCurrentUser(demoUser);
    setPortalTab(roleKey === 'patient' ? 'Home' : (roleKey === 'paramedic' ? 'Profile' : 'Dashboard'));
  };

  const switchUserRole = setCurrentRole;

  // 11. Patient Profile Update
  const updatePatientProfile = (patientId, updatedData) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...updatedData } : p));
    if (currentUser?.referenceId === patientId) {
      setCurrentUser(prev => ({
        ...prev,
        name: updatedData.name || prev.name,
        phone: updatedData.phone || prev.phone
      }));
    }
    logAudit(patientId, 'Patient', 'PROFILE_UPDATED', `Patient medical record updated for ${updatedData.name || patientId}.`);
    addNotification('Profile Updated', 'Medical record updated and encrypted.', 'success', 'patient');
  };

  // 11b. Doctor Profile Update
  const updateDoctorProfile = (doctorId, updatedData) => {
    setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, ...updatedData } : d));
    if (currentUser?.referenceId === doctorId) {
      setCurrentUser(prev => ({
        ...prev,
        name: updatedData.name || prev.name,
        email: updatedData.email || prev.email,
        phone: updatedData.phone || prev.phone
      }));
    }
    logAudit(doctorId, 'Doctor', 'PROFILE_UPDATED', `Doctor profile and credentials updated for ${updatedData.name || doctorId}.`);
    addNotification('Doctor Profile Updated', `Credentials and shift details saved successfully.`, 'success', 'doctor');
  };

  // 11c. Ambulance Profile Update
  const updateAmbulanceProfile = (ambulanceId, updatedData) => {
    setAmbulances(prev => prev.map(a => a.id === ambulanceId ? { ...a, ...updatedData } : a));
    logAudit(ambulanceId, 'Ambulance', 'PROFILE_UPDATED', `Ambulance unit specs and crew profile updated for ${updatedData.plateNumber || ambulanceId}.`);
    addNotification('Ambulance Profile Updated', `Vehicle telemetry and crew credentials updated successfully.`, 'success', 'ambulance');
  };

  // 11d. Update Pre-Treatment Equipment Checklist (Synchronized across Paramedic, Hospital & Control Room)
  const updateAmbulanceEquipment = (ambulanceId, equipmentUpdates, verifiedBy = 'Paramedic Crew') => {
    let updatedAmb = null;
    setAmbulances(prev => prev.map(a => {
      if (a.id === ambulanceId) {
        const newEquipment = {
          ...(a.equipment || {}),
          ...equipmentUpdates
        };
        updatedAmb = {
          ...a,
          equipment: newEquipment,
          equipmentLastChecked: new Date().toISOString(),
          equipmentVerifiedBy: verifiedBy
        };
        return updatedAmb;
      }
      return a;
    }));

    logAudit(
      ambulanceId,
      verifiedBy,
      'EQUIPMENT_CHECKLIST_UPDATED',
      `Pre-treatment equipment checklist verified for ${ambulanceId}. Telemetry synchronized to Hospital ER, Paramedic EMT, and Control Room.`
    );

    addNotification(
      'Pre-Treatment Equipment Verified',
      `Ambulance ${ambulanceId} equipment checklist updated by ${verifiedBy}. Visible to Hospital & Control Room.`,
      'info',
      'all'
    );

    return updatedAmb;
  };

  // 12. Update Emergency Status
  const updateEmergencyStatus = (emergencyId, newStatus, extraData = {}) => {
    setActiveEmergencies(prev => prev.map(emg => {
      if (emg.id === emergencyId) {
        return { ...emg, status: newStatus, ...extraData };
      }
      return emg;
    }));
    logAudit('SYSTEM', 'Emergency Coordinator', 'STATUS_CHANGE', `Emergency ${emergencyId} status set to "${newStatus}".`);
    addNotification(`Emergency ${newStatus}`, `Incident ${emergencyId} transitioned to ${newStatus}.`, 'info', 'all');
  };

  // 13. Add Prescription
  const addPrescription = (emergencyId, doctorName, prescriptionData) => {
    const prescEntry = {
      id: `RX-${Date.now()}`,
      emergencyId,
      doctorName,
      time: new Date().toLocaleTimeString(),
      ...prescriptionData
    };
    setActiveEmergencies(prev => prev.map(emg => {
      if (emg.id === emergencyId) {
        return {
          ...emg,
          prescriptions: [...(emg.prescriptions || []), prescEntry]
        };
      }
      return emg;
    }));
    logAudit('DOC', 'Doctor', 'PRESCRIPTION_ISSUED', `Rx issued for emergency ${emergencyId}: ${prescriptionData.medicationName || 'Medication'}.`);
    addNotification('Prescription Issued', `Dr. ${doctorName} issued digital prescription for incident ${emergencyId}.`, 'info', 'all');
  };

  // 14. Reassign Ambulance
  const reassignEmergencyAmbulance = (emergencyId, newAmbulanceId) => {
    const newAmb = ambulances.find(a => a.id === newAmbulanceId);
    setActiveEmergencies(prev => prev.map(emg => {
      if (emg.id === emergencyId) {
        const oldAmbId = emg.assignedAmbulanceId;
        if (oldAmbId) {
          setAmbulances(ambs => ambs.map(a => a.id === oldAmbId ? { ...a, status: 'Available' } : a));
        }
        return { ...emg, assignedAmbulanceId: newAmbulanceId, status: 'Assigned' };
      }
      return emg;
    }));
    if (newAmb) {
      setAmbulances(ambs => ambs.map(a => a.id === newAmbulanceId ? { ...a, status: 'Assigned' } : a));
    }
    logAudit('CONTROL-ROOM', 'Control Room Operator', 'AMBULANCE_REASSIGNED', `Emergency ${emergencyId} reassigned to vehicle ${newAmb?.plateNumber || newAmbulanceId}.`);
    addNotification('Ambulance Reassigned', `Emergency ${emergencyId} assigned to ${newAmb?.plateNumber || newAmbulanceId}.`, 'urgent', 'all');
  };

  // 15. Reassign Hospital
  const reassignEmergencyHospital = (emergencyId, newHospitalId) => {
    const hosp = hospitals.find(h => h.id === newHospitalId);
    setActiveEmergencies(prev => prev.map(emg => {
      if (emg.id === emergencyId) {
        return { ...emg, destinationHospitalId: newHospitalId };
      }
      return emg;
    }));
    logAudit('CONTROL-ROOM', 'Control Room Operator', 'HOSPITAL_REROUTED', `Destination hospital for ${emergencyId} rerouted to ${hosp?.name || newHospitalId}.`);
    addNotification('Hospital Rerouted', `Incident destination updated to ${hosp?.name || newHospitalId}.`, 'info', 'all');
  };

  // 16. Dispatch Multiple Ambulances (accepts count number, 'Many', or array of specific ambulance IDs)
  const dispatchMultipleAmbulances = (emergencyId, countOrIds) => {
    const targetId = emergencyId || activeEmergencies[0]?.id;
    let assignedIds = [];
    let countLabel = 1;

    if (Array.isArray(countOrIds)) {
      assignedIds = countOrIds;
      countLabel = countOrIds.length >= ambulances.length ? 'Many' : countOrIds.length;
    } else {
      const isMany = countOrIds === 'Many' || countOrIds === 'many';
      const reqCount = isMany ? Math.max(ambulances.length, 5) : Math.max(1, Number(countOrIds) || 1);
      countLabel = isMany ? 'Many' : reqCount;

      const sortedPool = ambulances.slice().sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
      assignedIds = sortedPool.slice(0, reqCount).map(a => a.id);
    }

    setAmbulances(prev => prev.map(a => {
      if (assignedIds.includes(a.id)) {
        return { ...a, status: 'Assigned', currentEmergencyId: targetId };
      }
      if (a.currentEmergencyId === targetId) {
        return { ...a, status: 'Available', currentEmergencyId: null };
      }
      return a;
    }));

    setActiveEmergencies(prev => {
      return prev.map(emg => {
        if (!targetId || emg.id === targetId) {
          return { 
            ...emg, 
            numberOfAmbulances: countLabel,
            assignedAmbulanceIds: assignedIds,
            assignedAmbulanceId: assignedIds[0] || emg.assignedAmbulanceId,
            status: 'Assigned'
          };
        }
        return emg;
      });
    });

    const isMany = countLabel === 'Many' || countLabel >= 5;
    if (isMany) {
      logAudit('CONTROL-ROOM', 'Control Room Operator', 'MASS_FLEET_MOBILIZATION', `🚨 MASS FLEET MOBILIZATION: Dispatched ${assignedIds.length} distinct fleet units for emergency ${targetId || 'active'}.`);
      addNotification('🚨 Mass Fleet Mobilization Dispatched', `Control room dispatched multi-fleet (${assignedIds.length} distinct vehicles from different approach directions) for mass casualty incident.`, 'critical', 'all');
    } else {
      logAudit('CONTROL-ROOM', 'Control Room Operator', 'MULTI_AMBULANCE_DISPATCH', `Dispatched ${assignedIds.length} distinct ambulance(s) (${assignedIds.join(', ')}) for emergency ${targetId || 'active'}.`);
      addNotification('Ambulance Fleet Dispatched', `Updated dispatch to ${assignedIds.length} vehicle(s) approaching from distinct radial corridors.`, 'urgent', 'ambulance');
    }
  };

  // Toggle specific ambulance assignment for an emergency
  const toggleAmbulanceDispatch = (emergencyId, ambulanceId) => {
    const targetId = emergencyId || activeEmergencies[0]?.id;
    const targetEmg = activeEmergencies.find(e => e.id === targetId) || activeEmergencies[0];
    const currentAssigned = targetEmg?.assignedAmbulanceIds || (targetEmg?.assignedAmbulanceId ? [targetEmg.assignedAmbulanceId] : ['AMB-01']);
    
    let newAssigned = [];
    if (currentAssigned.includes(ambulanceId)) {
      if (currentAssigned.length > 1) {
        newAssigned = currentAssigned.filter(id => id !== ambulanceId);
      } else {
        newAssigned = currentAssigned; // Keep at least one
      }
    } else {
      newAssigned = [...currentAssigned, ambulanceId];
    }
    dispatchMultipleAmbulances(targetId, newAssigned);
  };

  // 17. Send Control Room Message
  const sendControlRoomMessage = (target, messageText) => {
    logAudit('CONTROL-ROOM', 'Control Room Operator', 'RADIO_BROADCAST', `Message to [${target}]: ${messageText}`);
    addNotification(`Control Room (${target})`, messageText, 'urgent', target === 'Ambulances' ? 'ambulance' : target === 'Doctors' ? 'doctor' : 'all');
  };

  // 18. Reset All Demo State
  const resetToDemoState = () => {
    try {
      localStorage.removeItem('emergencylink_emergencies');
      localStorage.removeItem('emergencylink_ambulances');
      localStorage.removeItem('emergencylink_hospitals');
      localStorage.removeItem('emergencylink_doctors');
      localStorage.removeItem('emergencylink_patients');
      localStorage.removeItem('emergencylink_organ_transports');
      localStorage.removeItem('emergencylink_traffic_signals');
      localStorage.removeItem('emergencylink_audit_logs');
      sessionStorage.removeItem('raksha_sos_wizard_completed');
      localStorage.removeItem('raksha_sos_wizard_completed');
      localStorage.removeItem('emergencylink_organ_corridor_state');
    } catch {
      // ignore
    }
    setSosSessionActive(false);
    setOrganCorridorState({
      isDispatched: false,
      isMapGenerated: false,
      numberOfAmbulances: 1,
      assignedAmbulanceIds: ['AMB-03'],
      organType: "Donor Heart (24M, Brainstem Death)",
      donorHospitalName: "Institute of Neurosciences Kolkata (I-NK)",
      donorLocation: { lat: 22.5430, lng: 88.3640 },
      recipientHospitalName: "Apollo Multispeciality Hospitals Kolkata",
      recipientLocation: { lat: 22.5744, lng: 88.4038 },
      medicalEscort: "Dr. K. Nair (NOTTO Transplant Surgeon)",
      coldIschemiaLimitHours: 4.0,
      ischemiaElapsedMinutes: 38,
      preservationTemp: "4.1 °C (Optimal)",
      routeDistanceKm: 7.2,
      etaMinutes: 11,
      speedKmh: 68,
      greenWaveSignalsPreempted: 8,
      trafficPoliceClearance: "GRANTED",
      lastUpdated: new Date().toISOString()
    });
    setHospitals(JSON.parse(JSON.stringify(initialData.hospitals)));
    setAmbulances(JSON.parse(JSON.stringify(initialData.ambulances)));
    setDoctors(JSON.parse(JSON.stringify(initialData.doctors)));
    setPatients(JSON.parse(JSON.stringify(initialData.patients)));
    setActiveEmergencies(JSON.parse(JSON.stringify(initialData.activeEmergencies)));
    setOrganTransports(JSON.parse(JSON.stringify(initialData.organTransports)));
    setTrafficSignals(JSON.parse(JSON.stringify(initialData.trafficSignals)));
    setAuditLogs(JSON.parse(JSON.stringify(initialData.auditLogs)));
    logAudit('SYSTEM-ADMIN', 'Administrator', 'RESET_DEMO_DATA', 'All demo data reset to default factory state.');
    addNotification('System Reset', 'All demo data reset to default factory state.', 'info', 'all');
  };

  // 17. Emergency 3D Digital Twin Handlers
  const getDigitalTwin = (target) => {
    return getOrInitDigitalTwin(target || digitalTwinTarget, patients, activeEmergencies);
  };

  const isParamedicOrEmtAuthorized = () => {
    return currentRole === 'paramedic' || currentUser?.role === 'PARAMEDIC' || isEmtUser(currentUser);
  };

  const updateDigitalTwinVitalsHandler = (twinId, vitalsUpdates, source = 'Connected Medical Device', providerName = '') => {
    if (!isParamedicOrEmtAuthorized()) {
      logAudit(twinId, currentUser?.name || 'Viewer', 'DIGITAL_TWIN_MUTATION_BLOCKED', `Unauthorized attempt to alter 3D digital patient vitals from ${currentRole || 'unauthorized'} portal. Edits strictly reserved for Paramedics and EMTs.`);
      addNotification('Access Restricted', 'Only on-scene Paramedics and licensed EMTs can alter the 3D digital patient. View-only access active.', 'warning', 'all');
      return null;
    }

    const updated = updateDigitalTwinVitals(twinId, vitalsUpdates, source, providerName);
    if (updated) {
      // Synchronize with active emergencies so triage vitals match everywhere
      setActiveEmergencies(prev => prev.map(emg => {
        if (emg.id === updated.emergencyId || emg.patientId === updated.patientId || `DT-${emg.id}` === twinId || `DT-${emg.patientId}` === twinId) {
          return {
            ...emg,
            triageScore: {
              ...emg.triageScore,
              heartRate: vitalsUpdates.heartRate !== undefined ? Number(vitalsUpdates.heartRate) : emg.triageScore?.heartRate,
              oxygenSaturation: vitalsUpdates.spo2 !== undefined ? `${vitalsUpdates.spo2}%` : emg.triageScore?.oxygenSaturation,
              bloodPressure: vitalsUpdates.bloodPressure !== undefined ? vitalsUpdates.bloodPressure : emg.triageScore?.bloodPressure,
              breathing: vitalsUpdates.respiratoryRate !== undefined ? `${vitalsUpdates.respiratoryRate} bpm` : emg.triageScore?.breathing,
              temperature: vitalsUpdates.temperature !== undefined ? `${vitalsUpdates.temperature} °C` : emg.triageScore?.temperature,
            }
          };
        }
        return emg;
      }));

      setDigitalTwinRevision(r => r + 1);
      logAudit(twinId, source, 'DIGITAL_TWIN_VITALS_UPDATED', `Vitals updated for ${updated.name}: HR ${updated.vitals.heartRate} bpm, SpO2 ${updated.vitals.spo2}%, BP ${updated.vitals.bloodPressure}`);
      addNotification('Digital Twin Telemetry Stream', `${updated.name}'s vitals updated via ${source}: HR ${updated.vitals.heartRate} bpm, SpO2 ${updated.vitals.spo2}%.`, updated.vitals.spo2 < 90 ? 'urgent' : 'info', 'all');
    }
    return updated;
  };

  const updateDigitalTwinStatusHandler = (twinId, statusUpdates, source = 'Paramedic', providerName = '') => {
    if (!isParamedicOrEmtAuthorized()) {
      logAudit(twinId, currentUser?.name || 'Viewer', 'DIGITAL_TWIN_MUTATION_BLOCKED', `Unauthorized attempt to alter 3D digital patient status from ${currentRole || 'unauthorized'} portal. Edits strictly reserved for Paramedics and EMTs.`);
      addNotification('Access Restricted', 'Only on-scene Paramedics and licensed EMTs can alter the 3D digital patient. View-only access active.', 'warning', 'all');
      return null;
    }

    const updated = updateDigitalTwinStatus(twinId, statusUpdates, source, providerName);
    if (updated) {
      setActiveEmergencies(prev => prev.map(emg => {
        if (emg.id === updated.emergencyId || emg.patientId === updated.patientId || `DT-${emg.id}` === twinId || `DT-${emg.patientId}` === twinId) {
          return {
            ...emg,
            triageScore: {
              ...emg.triageScore,
              consciousness: statusUpdates.consciousnessStatus || emg.triageScore?.consciousness,
              abilityToWalk: statusUpdates.abilityToWalk || emg.triageScore?.abilityToWalk,
            }
          };
        }
        return emg;
      }));

      setDigitalTwinRevision(r => r + 1);
      logAudit(twinId, source, 'DIGITAL_TWIN_STATUS_UPDATED', `Status updated for ${updated.name}: Consciousness ${updated.consciousnessStatus}, Mobility ${updated.abilityToWalk}`);
      addNotification('Digital Twin Condition Shift', `${updated.name} condition updated: ${updated.consciousnessStatus}, ${updated.abilityToWalk}.`, updated.consciousnessStatus === 'Unconscious' ? 'urgent' : 'warning', 'all');
    }
    return updated;
  };

  const addDigitalTwinTreatmentHandler = (twinId, treatment, source = 'Paramedic') => {
    if (!isParamedicOrEmtAuthorized()) {
      logAudit(twinId, currentUser?.name || 'Viewer', 'DIGITAL_TWIN_MUTATION_BLOCKED', `Unauthorized attempt to log treatments for 3D digital patient from ${currentRole || 'unauthorized'} portal. Edits strictly reserved for Paramedics and EMTs.`);
      addNotification('Access Restricted', 'Only on-scene Paramedics and licensed EMTs can alter the 3D digital patient. View-only access active.', 'warning', 'all');
      return null;
    }

    const updated = addDigitalTwinTreatment(twinId, treatment, source);
    if (updated) {
      setDigitalTwinRevision(r => r + 1);
      logAudit(twinId, source, 'DIGITAL_TWIN_TREATMENT_ADDED', `Treatment "${treatment.action}" recorded for ${updated.name}.`);
      addNotification('Emergency Treatment Administered', `New intervention for ${updated.name}: ${treatment.action}.`, 'success', 'all');
    }
    return updated;
  };

  const addDigitalTwinMedicationHandler = (twinId, medication, source = 'Paramedic') => {
    if (!isParamedicOrEmtAuthorized()) {
      logAudit(twinId, currentUser?.name || 'Viewer', 'DIGITAL_TWIN_MUTATION_BLOCKED', `Unauthorized attempt to record medications for 3D digital patient from ${currentRole || 'unauthorized'} portal. Edits strictly reserved for Paramedics and EMTs.`);
      addNotification('Access Restricted', 'Only on-scene Paramedics and licensed EMTs can alter the 3D digital patient. View-only access active.', 'warning', 'all');
      return null;
    }

    const updated = addDigitalTwinMedication(twinId, medication, source);
    if (updated) {
      setDigitalTwinRevision(r => r + 1);
      logAudit(twinId, source, 'DIGITAL_TWIN_MEDICATION_ADMINISTERED', `Medicine "${medication.medicine} ${medication.dose}" administered to ${updated.name}.`);
      addNotification('Resuscitation Medicine Given', `${medication.medicine} (${medication.dose}) administered to ${updated.name}.`, 'warning', 'all');
    }
    return updated;
  };

  const addTeleDirective = (orderText, priority = 'urgent', author = 'Dr. Ananya Sen') => {
    const newDirective = {
      id: `DIR-${Date.now()}`,
      time: 'Just now',
      order: orderText,
      status: 'Pending',
      priority,
      author
    };
    setTeleDirectives(prev => [newDirective, ...prev]);
    logAudit(currentUser?.id || 'DOC-01', 'Doctor', 'TELE_DIRECTIVE_TRANSMITTED', `Physician directive transmitted to field EMS unit: "${orderText}"`);
    addNotification('Pre-Hospital Clinical Directive', `${author}: ${orderText}`, 'urgent', 'all');
    return newDirective;
  };

  const updateTeleDirectiveStatus = (directiveId, newStatus) => {
    setTeleDirectives(prev => prev.map(d => d.id === directiveId ? { ...d, status: newStatus } : d));
    logAudit(currentUser?.id || 'EMT-01', 'Paramedic / EMT', 'TELE_DIRECTIVE_STATUS_CHANGED', `Directive ${directiveId} status set to ${newStatus}`);
  };

  return (
    <EmergencyContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        switchUserRole,
        portalTab,
        setPortalTab,
        users,
        hospitals,
        ambulances,
        doctors,
        patients,
        activeEmergencies,
        organTransports,
        trafficSignals,
        auditLogs,
        notifications,
        teleDirectives,
        addTeleDirective,
        updateTeleDirectiveStatus,
        soundEnabled,
        setSoundEnabled,
        toggleSiren,
        startContinuousSiren,
        stopContinuousSiren,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginTargetRole,
        openLoginForRole,
        login,
        logout,
        isDemoModalOpen,
        setIsDemoModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isMedicalQrModalOpen,
        setIsMedicalQrModalOpen,
        medicalQrPatient,
        setMedicalQrPatient,
        openMedicalQrForPatient,
        isDigitalTwinModalOpen,
        setIsDigitalTwinModalOpen,
        digitalTwinTarget,
        setDigitalTwinTarget,
        openDigitalTwinForPatient,
        getDigitalTwin,
        digitalTwinRevision,
        updateDigitalTwinVitals: updateDigitalTwinVitalsHandler,
        updateDigitalTwinStatus: updateDigitalTwinStatusHandler,
        addDigitalTwinTreatment: addDigitalTwinTreatmentHandler,
        addDigitalTwinMedication: addDigitalTwinMedicationHandler,
        triggerSOS,
        submitEmergencyAssessment,
        updateTriage,
        updateAmbulanceStatus,
        updateHospitalResources,
        updatePatientProfile,
        updateDoctorProfile,
        updateAmbulanceProfile,
        updateEmergencyStatus,
        addPrescription,
        reassignEmergencyAmbulance,
        reassignEmergencyHospital,
        dispatchMultipleAmbulances,
        toggleAmbulanceDispatch,
        sendControlRoomMessage,
        addDoctorNote,
        requestBreakGlassConsent,
        toggleGreenCorridor,
        toggleTrafficPolicePermission,
        updateOrganTransport,
        updateAmbulanceEquipment,
        resetToDemoState,
        addNotification,
        playAlertSound,
        logAudit,
        networkMode,
        setNetworkMode,
        lidarRerouteState,
        setLidarRerouteState,
        updateLidarReroute,
        triggerLidarObstacle,
        clearLidarObstacle,
        organCorridorState,
        setOrganCorridorState,
        dispatchOrganCorridor,
        toggleOrganCorridorMap,
        setOrganCorridorAmbulanceCount,
        setSelectedCorridorAmbulance,
        isEmergencyProtocolCompleted,
        setSosSessionActive,
        isOffline: networkMode === NETWORK_MODES.OFFLINE || networkMode === NETWORK_MODES.SMS_FALLBACK,
        smsTransmissions,
        offlineQueue,
        authorizedSmsContacts,
        setAuthorizedSmsContacts,
        getRoleContacts,
        receivedSms,
        getReceivedSmsForRole,
        SMS_ROUTING_MATRIX,
        getAllowedSendersForRole,
        isRoleEligibleToReceiveSms,
        isSyncing,
        triggerEmergencySmsFallback,
        syncOfflineQueue,
        NETWORK_MODES
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};
