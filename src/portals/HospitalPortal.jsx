import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { EmergencyMap } from '../components/EmergencyMap';
import { EmergencyMapLockScreen } from '../components/EmergencyMapLockScreen';
import { openInGoogleMapsApp } from '../utils/googleMaps';
import confetti from 'canvas-confetti';
import {
  Building2,
  Bed,
  Activity,
  Wind,
  Droplets,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ambulance,
  Phone,
  Mail,
  MapPin,
  Layers,
  Save,
  Plus,
  Minus,
  Shield,
  Award,
  Edit3,
  X,
  FileText,
  Check,
  ExternalLink,
  Radio,
  HeartPulse,
  User,
  Compass,
  Zap,
  Info,
  Bell,
  Send,
  AlertOctagon,
  CheckSquare,
  ShieldCheck,
  Users,
  Search,
  PhoneCall,
  Video,
  Filter
} from 'lucide-react';
import { PreTreatmentEquipmentChecklist } from '../components/PreTreatmentEquipmentChecklist';
import { DigitalGreenCorridorMap } from '../components/DigitalGreenCorridorMap';

export const HospitalPortal = () => {
  const {
    hospitals,
    activeEmergencies,
    ambulances,
    doctors,
    trafficSignals,
    updateHospitalResources,
    updateAmbulanceStatus,
    addNotification,
    notifications,
    portalTab,
    setPortalTab,
    isEmergencyProtocolCompleted,
    openDigitalTwinForPatient
  } = useEmergency();

  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[1]?.id || hospitals[0].id); // Apollo Emergency
  const hospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

  // Incoming emergencies routed to this hospital
  const incomingEmergencies = activeEmergencies.filter(
    e => e.destinationHospitalId === hospital.id && e.status !== 'Completed'
  );

  const [expandedEquipmentEmgId, setExpandedEquipmentEmgId] = useState(null);

  // Resource Editor State
  const [generalBeds, setGeneralBeds] = useState(hospital.generalBeds);
  const [icuBeds, setIcuBeds] = useState(hospital.icuBeds);
  const [ventilators, setVentilators] = useState(hospital.ventilators);
  const [oxygenStatus, setOxygenStatus] = useState(hospital.oxygenStatus);
  const [bloodBank, setBloodBank] = useState(hospital.bloodBank);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Hospital Alerts & Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('warning');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const hospitalNotifications = (notifications || []).filter(
    n => n.targetRole === 'hospital' || n.targetRole === 'all' || !n.targetRole
  );

  // Staff Directory & Roster State
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all'); // 'all' | 'doctor' | 'paramedic'
  const [staffStatusFilter, setStaffStatusFilter] = useState('all'); // 'all' | 'on_duty' | 'available' | 'in_transit'
  const [staffActionNotice, setStaffActionNotice] = useState(null);

  // Comprehensive Doctor Directory mapped with credentials
  const allHospitalDoctors = [
    {
      id: 'DOC-01',
      name: 'Dr. Ananya Sen',
      gender: 'Female',
      qualifications: 'MBBS, MS (General Surgery), FACS (Trauma)',
      registrationNumber: 'DMC-48291 / MCI-2007',
      specialization: 'Chief Trauma & Polytrauma Surgery',
      department: 'Trauma & Acute Care Resuscitation',
      hospitalId: 'HOSP-02',
      hospitalName: 'Apollo Emergency & Critical Care',
      availability: 'On Duty - Resuscitation Bay 1',
      statusCategory: 'on_duty',
      shift: 'Day Trauma Shift (08:00 - 20:00)',
      intercom: 'Ext. 401',
      phone: '+91 11 2692 5858 (Ext. 401)',
      mobile: '+91 98111 22340',
      experience: '14+ years (1,800+ emergency & polytrauma interventions)',
      activePatientLoad: '2 Critical Polytrauma Patients (Red Bay 1)',
      skills: ['Damage Control Laparotomy', 'Emergency Thoracotomy', 'FAST Ultrasound', 'Complex Vascular Shunting', 'Difficult Airway RSI']
    },
    {
      id: 'DOC-05',
      name: 'Dr. Sunita Kulkarni',
      gender: 'Female',
      qualifications: 'MBBS, MD (Pediatrics), Fellowship Pediatric Critical Care',
      registrationNumber: 'DMC-39088 / MCI-2005',
      specialization: 'Pediatric Emergency & Neonatal Trauma',
      department: 'Pediatric Critical Care & ER',
      hospitalId: 'HOSP-02',
      hospitalName: 'Apollo Emergency & Critical Care',
      availability: 'On Duty - Pediatric ER Bay 2',
      statusCategory: 'on_duty',
      shift: 'Day Trauma Shift (08:00 - 20:00)',
      intercom: 'Ext. 415',
      phone: '+91 11 2692 5858 (Ext. 415)',
      mobile: '+91 98111 44550',
      experience: '15+ years (Pediatric airway, shock resuscitation, Broselow protocols)',
      activePatientLoad: '1 Pediatric Inbound Casualty',
      skills: ['Pediatric Advanced Life Support (PALS)', 'Neonatal Resuscitation', 'Pediatric IO Access', 'Pediatric Fiberoptic Intubation']
    },
    {
      id: 'DOC-07',
      name: 'Dr. Vikramaditya Rathore',
      gender: 'Male',
      qualifications: 'MBBS, MD (Anesthesiology), EDIC (European Diploma Critical Care)',
      registrationNumber: 'DMC-37210 / MCI-2003',
      specialization: 'Trauma Anesthesia & Resuscitative Critical Care',
      department: 'Critical Care Medicine & Anesthesia',
      hospitalId: 'HOSP-02',
      hospitalName: 'Apollo Emergency & Critical Care',
      availability: 'In Emergency OR Suite 3 (Active)',
      statusCategory: 'in_or',
      shift: 'Trauma Call Shift (24h Standby)',
      intercom: 'Ext. 403',
      phone: '+91 11 2692 5858 (Ext. 403)',
      mobile: '+91 98112 55667',
      experience: '17+ years (Massive transfusion protocols, ECMO, hemodynamic lines)',
      activePatientLoad: 'Emergency Laparotomy in OR-3',
      skills: ['Invasive Hemodynamic Monitoring', 'Rapid Infuser System', 'Cricothyroidotomy', 'ECMO Cannulation', 'TEE Echocardiography']
    },
    {
      id: 'DOC-08',
      name: 'Dr. Meenakshi Sundaram',
      gender: 'Female',
      qualifications: 'MBBS, MS, MCh (Cardiothoracic & Vascular Surgery)',
      registrationNumber: 'DMC-51204 / MCI-2009',
      specialization: 'Cardiovascular Trauma & Primary PCI',
      department: 'Interventional Cardiology & Cardiac ER',
      hospitalId: 'HOSP-02',
      hospitalName: 'Apollo Emergency & Critical Care',
      availability: 'Cath Lab / Standby (< 5 min)',
      statusCategory: 'on_duty',
      shift: 'Emergency Cardiac Coverage',
      intercom: 'Ext. 408',
      phone: '+91 11 2692 5858 (Ext. 408)',
      mobile: '+91 98108 77665',
      experience: '12+ years (Door-to-balloon STEMI angioplasty, aortic dissection repair)',
      activePatientLoad: '1 STEMI Alert on Standby',
      skills: ['Primary Percutaneous Coronary Intervention', 'Pericardiocentesis', 'Intra-Aortic Balloon Pump (IABP)', 'Aortic Cross-Clamping']
    },
    {
      id: 'DOC-09',
      name: 'Dr. Alok Nath Tripathy',
      gender: 'Male',
      qualifications: 'MBBS, MS (Orthopedic Surgery), AO Trauma Fellow',
      registrationNumber: 'DMC-44819 / MCI-2006',
      specialization: 'Pelvic Trauma & Complex Fracture Reconstruction',
      department: 'Orthopedic Trauma Surgery',
      hospitalId: 'HOSP-02',
      hospitalName: 'Apollo Emergency & Critical Care',
      availability: 'On Call - Standby (Response < 8 min)',
      statusCategory: 'on_call',
      shift: 'Emergency Trauma On-Call',
      intercom: 'Ext. 410',
      phone: '+91 11 2692 5858 (Ext. 410)',
      mobile: '+91 98115 88990',
      experience: '16+ years (External fixation, open fracture debridement, pelvic binders)',
      activePatientLoad: '3 Post-Stabilization Patients',
      skills: ['Pelvic C-Clamp Application', 'Compartment Syndrome Fasciotomy', 'Spinal Alignment & Traction', 'Open Fracture Fixation']
    },
    {
      id: 'DOC-02',
      name: 'Dr. Arvind Mehta',
      gender: 'Male',
      qualifications: 'MBBS, MD (Medicine), DM (Cardiology)',
      registrationNumber: 'DMC-31902 / MCI-1999',
      specialization: 'Cardiovascular Critical Care & Resuscitation',
      department: 'Emergency Cardiology & ICU',
      hospitalId: 'HOSP-01',
      hospitalName: 'City Trauma & Super Specialty Hospital',
      availability: 'On Duty - Resuscitation Bay',
      statusCategory: 'on_duty',
      shift: 'Day Shift (08:00 - 20:00)',
      intercom: 'Ext. 204',
      phone: '+91 11 2659 8700 (Ext. 204)',
      mobile: '+91 98101 22334',
      experience: '19+ years (Emergency Angioplasty & ECMO management)',
      activePatientLoad: '3 Cardiac Resuscitation Cases',
      skills: ['ECMO Initiation', 'Transvenous Pacing', 'Advanced Cardiac Life Support (ACLS)', 'Emergency Echocardiography']
    },
    {
      id: 'DOC-10',
      name: 'Dr. Hemant Bhardwaj',
      gender: 'Male',
      qualifications: 'MBBS, MS (General & Trauma Surgery), FACS',
      registrationNumber: 'DMC-41098 / MCI-2004',
      specialization: 'Emergency Trauma Surgery & FAST Resuscitation',
      department: 'Department of Trauma & Acute Care',
      hospitalId: 'HOSP-01',
      hospitalName: 'City Trauma & Super Specialty Hospital',
      availability: 'On Duty - Trauma Red Bay',
      statusCategory: 'on_duty',
      shift: '24h Trauma Coverage',
      intercom: 'Ext. 206',
      phone: '+91 11 2659 8700 (Ext. 206)',
      mobile: '+91 98104 33445',
      experience: '18+ years (Blunt abdominal trauma, splenic salvage, exploratory laparotomy)',
      activePatientLoad: '1 Inbound Polytrauma Case',
      skills: ['Damage Control Resuscitation', 'Thoracic Drainage', 'Pelvic Packing', 'Endoscopic Hemostasis']
    },
    {
      id: 'DOC-11',
      name: 'Dr. Neha Swaminathan',
      gender: 'Female',
      qualifications: 'MBBS, MD (Emergency Medicine), MRCEM (UK)',
      registrationNumber: 'DMC-58190 / MCI-2013',
      specialization: 'Emergency Triage & Acute Medical Resuscitation',
      department: 'Emergency Medicine',
      hospitalId: 'HOSP-01',
      hospitalName: 'City Trauma & Super Specialty Hospital',
      availability: 'On Duty - Triage Intake',
      statusCategory: 'on_duty',
      shift: 'Day Emergency Shift',
      intercom: 'Ext. 201',
      phone: '+91 11 2659 8700 (Ext. 201)',
      mobile: '+91 98113 44556',
      experience: '9+ years (Disaster triage, toxicology, acute poisoning antidotes)',
      activePatientLoad: '4 Triage Red/Yellow Cases',
      skills: ['START Triage Matrix', 'Tox-SLUDGE Decontamination', 'Procedural Sedation', 'Ultrasound Guided Vascular Access']
    },
    {
      id: 'DOC-04',
      name: 'Dr. Rajeshwar Iyer',
      gender: 'Male',
      qualifications: 'MBBS, MCh (Neurosurgery)',
      registrationNumber: 'DMC-42119 / MCI-2004',
      specialization: 'Neurotrauma & Critical Brain Resuscitation',
      department: 'Neurosurgery & Neuro-ICU',
      hospitalId: 'HOSP-03',
      hospitalName: 'Max Healthcare Trauma Pavilion',
      availability: 'On Duty - Neuro-Trauma Suite',
      statusCategory: 'on_duty',
      shift: 'Neuro Trauma Shift',
      intercom: 'Ext. 312',
      phone: '+91 11 2651 5050 (Ext. 312)',
      mobile: '+91 98105 55667',
      experience: '16+ years (Emergency craniotomy, ICP monitor, subdural evacuation)',
      activePatientLoad: '2 Traumatic Brain Injury Patients',
      skills: ['Emergency Decompressive Craniectomy', 'Intracranial Pressure (ICP) Monitoring', 'Spine Decompression', 'Cerebral Perfusion Protocol']
    },
    {
      id: 'DOC-12',
      name: 'Dr. Shalini Kapoor',
      gender: 'Female',
      qualifications: 'MBBS, MD (Critical Care), FNB (Intensive Care)',
      registrationNumber: 'DMC-46102 / MCI-2008',
      specialization: 'Multi-Organ Failure & Invasive ICU Resuscitation',
      department: 'Intensive Care Unit (ICU)',
      hospitalId: 'HOSP-03',
      hospitalName: 'Max Healthcare Trauma Pavilion',
      availability: 'On Duty - ICU Lead',
      statusCategory: 'on_duty',
      shift: 'Critical Care Shift (08:00 - 20:00)',
      intercom: 'Ext. 315',
      phone: '+91 11 2651 5050 (Ext. 315)',
      mobile: '+91 98114 66778',
      experience: '14+ years (Mechanical ventilation, prone positioning, ARDS management)',
      activePatientLoad: '4 Critical ICU Patients',
      skills: ['Protective Lung Ventilation', 'Continuous Renal Replacement Therapy (CRRT)', 'Invasive Arterial Line', 'Hemodynamic Ultrasound']
    },
    {
      id: 'DOC-03',
      name: 'Dr. Preeti Deshmukh',
      gender: 'Female',
      qualifications: 'MBBS, MD (Emergency Medicine), MRCEM (UK)',
      registrationNumber: 'DMC-55120 / MCI-2011',
      specialization: 'Disaster Medicine & Polytrauma Triage',
      department: 'Disaster Medicine & Apex Trauma',
      hospitalId: 'HOSP-04',
      hospitalName: 'National Institute of Emergency & Disaster Medicine',
      availability: 'On Duty - Triage Red Bay',
      statusCategory: 'on_duty',
      shift: 'Disaster Command Shift',
      intercom: 'Ext. 105',
      phone: '+91 11 2616 5060 (Ext. 105)',
      mobile: '+91 98116 77889',
      experience: '10+ years (Disaster Response, Airway, Thoracostomy, Chemical incidents)',
      activePatientLoad: '3 High-Acuity Trauma Cases',
      skills: ['HazMat Emergency Response', 'Mass Casualty Decontamination', 'Apex Trauma Airway', 'Needle & Tube Thoracostomy']
    },
    {
      id: 'DOC-13',
      name: 'Dr. Devendra Pandey',
      gender: 'Male',
      qualifications: 'MBBS, MS (General & Trauma Surgery), FACS',
      registrationNumber: 'DMC-34011 / MCI-2001',
      specialization: 'Mass Casualty Incident Command & Thoracic Trauma',
      department: 'Department of Emergency Surgery',
      hospitalId: 'HOSP-04',
      hospitalName: 'National Institute of Emergency & Disaster Medicine',
      availability: 'On Duty - Resuscitation Command',
      statusCategory: 'on_duty',
      shift: 'National Disaster Standby',
      intercom: 'Ext. 102',
      phone: '+91 11 2616 5060 (Ext. 102)',
      mobile: '+91 98117 88990',
      experience: '21+ years (Senior Government Trauma Advisor, blast injury management)',
      activePatientLoad: 'Incident Command Desk Lead',
      skills: ['Incident Command System (ICS)', 'Blast Lung Injury Protocol', 'Emergency Tracheostomy', 'Major Crush Syndrome Resuscitation']
    }
  ];

  // Comprehensive Paramedic & EMT Directory mapped with ambulance telemetry
  const allHospitalParamedics = [
    {
      id: 'EMT-01',
      name: 'S. Ramanathan',
      designation: 'Lead ALS Trauma Paramedic',
      certificationLevel: 'Advanced Life Support (ALS) Paramedic',
      licenseNumber: 'National Council License #DL-EMT-2017-88492 (Valid 2029)',
      qualifications: 'B.Sc. in Emergency Medical Technology (EMT), Post-Graduate Diploma in Critical Care & Trauma Management',
      ambulancePlate: 'DL-01-EA-1081',
      ambulanceCallSign: 'AMB-01 (ALS Mobile ICU)',
      ambulanceType: 'Advanced Life Support (ALS)',
      hospitalId: 'HOSP-02',
      hospitalName: 'Apollo Emergency & Critical Care',
      baseStation: 'West Station (Ring Road / AIIMS Sector)',
      phone: '+91 98102 33445',
      driverName: 'Vikram Singh',
      driverPhone: '+91 98991 12233',
      radioChannel: 'VHF Emergency Ch 4 (155.340 MHz)',
      experienceYears: 9,
      status: incomingEmergencies.some(e => e.assignedAmbulanceId === 'AMB-01')
        ? `In Transit with Critical Trauma (ETA ${incomingEmergencies[0]?.etaMinutes || 6} min)`
        : 'On Duty - En Route with Casualty (ETA 6 min)',
      statusCategory: 'in_transit',
      currentEmergencyId: 'EMG-8821',
      patientName: 'Baljeet Kaur (Age 63, Severe Polytrauma)',
      certifications: [
        'AHA Advanced Cardiovascular Life Support (ACLS)',
        'International Trauma Life Support (ITLS) - Advanced Provider',
        'Prehospital Trauma Life Support (PHTLS) Certified',
        'Pediatric Advanced Life Support (PALS) Certified'
      ],
      verifiedSkills: [
        'Combat Application Tourniquet (CAT) & Hemostatic Wound Packing',
        'Emergency Needle Thoracostomy & Chest Decompression',
        'Advanced Airway Management & Endotracheal Intubation',
        'IV Cannulation (14G/16G) & Rapid IO Access',
        '12-Lead ECG Interpretation & STEMI Recognition'
      ],
      equipmentReadiness: '100% Operational (Defibrillator, Ventilator, Suction, O2 Cylinder, Trauma Pack)'
    },
    {
      id: 'EMT-02',
      name: 'EMT Amit Verma',
      designation: 'Emergency Medical Technician',
      certificationLevel: 'Licensed EMT Provider (BLS / Intermediate)',
      licenseNumber: 'National Registry #DL-EMT-2021-44109 (Valid 2029)',
      qualifications: 'Diploma in Emergency Medical Services (EMS), Advanced First Responder Certification',
      ambulancePlate: 'DL-02-EA-2044',
      ambulanceCallSign: 'AMB-02 (BLS Rapid Response)',
      ambulanceType: 'Basic Life Support (BLS)',
      hospitalId: 'HOSP-01',
      hospitalName: 'City Trauma & Super Specialty Hospital',
      baseStation: 'Central Station (Connaught Place / Ring Road North)',
      phone: '+91 98103 44556',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91 98112 44556',
      radioChannel: 'VHF Emergency Ch 2 (155.220 MHz)',
      experienceYears: 4,
      status: 'Available at Hospital Ambulance Bay',
      statusCategory: 'available',
      currentEmergencyId: null,
      patientName: null,
      certifications: [
        'AHA Basic Life Support (BLS) for Healthcare Providers',
        'Prehospital Trauma Life Support (PHTLS) - EMT Provider',
        'Emergency Vehicle Operations & Defensive Driving (EVOC)',
        'PEARS Pediatric Emergency Assessment'
      ],
      verifiedSkills: [
        'Rapid Primary Trauma Assessment & START Triage Scoring',
        'Airway Adjuncts (OPA / NPA) & High-Flow Oxygen Therapy',
        'Bag-Valve-Mask (BVM) Resuscitation & Suctioning',
        'C-Spine Immobilization, Cervical Collar & Long Spine Board',
        'Automated External Defibrillator (AED) Operations & CPR'
      ],
      equipmentReadiness: '100% Operational (AED, Oxygen Unit, Spine Board, BLS Bag)'
    },
    {
      id: 'EMT-05',
      name: 'Anil Sharma',
      designation: 'Critical Care Flight & Trauma Paramedic',
      certificationLevel: 'Critical Care Paramedic (CCP-C / FP-C)',
      licenseNumber: 'National Council #DL-EMT-2015-39201 (Valid 2030)',
      qualifications: 'B.Sc. EMS, Board Certified Critical Care Paramedic (BCPA)',
      ambulancePlate: 'DL-05-EA-5512',
      ambulanceCallSign: 'AMB-05 (ALS Trauma Interceptor)',
      ambulanceType: 'Advanced Life Support (ALS) Trauma Interceptor',
      hospitalId: 'HOSP-01',
      hospitalName: 'City Trauma & Super Specialty Hospital',
      baseStation: 'North-West Station (Shanti Path / Diplomatic Sector)',
      phone: '+91 98112 33445',
      driverName: 'Ramesh Chand',
      driverPhone: '+91 98112 33446',
      radioChannel: 'VHF Tactical Ch 7 (155.600 MHz)',
      experienceYears: 11,
      status: 'Dispatched & En Route to Casualty Scene',
      statusCategory: 'in_transit',
      currentEmergencyId: 'EMG-9042',
      patientName: 'Casualty En Route',
      certifications: [
        'Critical Care Paramedic Certified (CCP-C)',
        'Flight Paramedic Certified (FP-C)',
        'AHA ACLS & PALS Instructor',
        'Advanced Trauma Life Support for Paramedics (ATLS-P)'
      ],
      verifiedSkills: [
        'Rapid Sequence Intubation (RSI) with Video Laryngoscopy',
        'Surgical Cricothyroidotomy & Needle Decompression',
        'Invasive Arterial Line & Central Venous Line Infusion',
        'Pre-Hospital Blood Product Transfusion (Warm Whole Blood)',
        'Pre-Hospital Ultrasound (POCUS / eFAST)'
      ],
      equipmentReadiness: '100% Operational (Zoll X-Series Defib, Hamilton T1 Transport Vent, Blood Warmer)'
    },
    {
      id: 'EMT-03',
      name: 'Dr. K. Nair (Transplant Escort)',
      designation: 'Organ Transit Specialist & Paramedic Lead',
      certificationLevel: 'Critical Organ & Tissue Transit Escort (NOTTO Certified)',
      licenseNumber: 'National Registry #DL-EMT-2016-55102',
      qualifications: 'B.Sc. Perfusion Technology & Emergency Life Support',
      ambulancePlate: 'DL-03-EA-3099',
      ambulanceCallSign: 'AMB-03 (Green Corridor Transit)',
      ambulanceType: 'Green Corridor Organ Transit Unit',
      hospitalId: 'HOSP-04',
      hospitalName: 'National Institute of Emergency & Disaster Medicine',
      baseStation: 'Park Circus Station (Maa Flyover 7-Point)',
      phone: '+91 98100 88776',
      driverName: 'Gurpreet Singh',
      driverPhone: '+91 98100 88775',
      radioChannel: 'VHF Green Corridor Ch 5 (155.450 MHz)',
      experienceYears: 8,
      status: 'Regional Green Corridor Standby',
      statusCategory: 'available',
      currentEmergencyId: null,
      patientName: null,
      certifications: [
        'NOTTO Organ Transport Protocol Certified',
        'Advanced Cardiovascular Life Support (ACLS)',
        'Cryogenic Telemetry & Cold Ischemia Preservation'
      ],
      verifiedSkills: [
        'Organ Preservation Chamber Management',
        'Continuous Perfusion Monitoring',
        'Traffic Police Green Wave Coordination',
        'Emergency Telemetry Relay'
      ],
      equipmentReadiness: 'Cryogenic Chamber Active (4.0°C Verified, Battery 100%)'
    },
    {
      id: 'EMT-04',
      name: 'Sister Mary Varghese',
      designation: 'Neonatal & Pediatric Transport Paramedic',
      certificationLevel: 'Neonatal Resuscitation Specialist (NRP / PALS)',
      licenseNumber: 'National Registry #DL-EMT-2018-77219',
      qualifications: 'B.Sc. Nursing & Advanced Pediatric Pre-Hospital Care',
      ambulancePlate: 'DL-04-EA-4050',
      ambulanceCallSign: 'AMB-04 (Neonatal & Pediatric ICU)',
      ambulanceType: 'NICU / Pediatric Emergency Mobile Unit',
      hospitalId: 'HOSP-03',
      hospitalName: 'Max Healthcare Trauma Pavilion',
      baseStation: 'South Station (Nehru Place / Outer Ring)',
      phone: '+91 98110 55443',
      driverName: 'Deepak Joshi',
      driverPhone: '+91 98110 55442',
      radioChannel: 'VHF Pediatric Net Ch 3 (155.280 MHz)',
      experienceYears: 7,
      status: 'Available at South Sector Base',
      statusCategory: 'available',
      currentEmergencyId: null,
      patientName: null,
      certifications: [
        'Neonatal Resuscitation Program (NRP)',
        'Pediatric Advanced Life Support (PALS)',
        'Neonatal Transport & Incubator Management'
      ],
      verifiedSkills: [
        'Neonatal Incubator Temperature Regulation',
        'Neonatal & Infant Intubation (2.5 - 3.5 mm ETT)',
        'Umbilical Venous Catheterization (UVC)',
        'Surfactant Administration & Micro-drip Infusion'
      ],
      equipmentReadiness: 'Transport Incubator Pre-Warmed to 36.8°C, Nitric Oxide Standby'
    }
  ];

  // Filter doctors and paramedics for current hospital view
  const currentHospitalDoctors = allHospitalDoctors.filter(
    d => d.hospitalId === hospital.id
  );
  const otherHospitalDoctors = allHospitalDoctors.filter(
    d => d.hospitalId !== hospital.id
  );
  const displayDoctors = currentHospitalDoctors.length > 0
    ? [...currentHospitalDoctors, ...otherHospitalDoctors]
    : allHospitalDoctors;

  const currentHospitalParamedics = allHospitalParamedics.filter(
    p => p.hospitalId === hospital.id || incomingEmergencies.some(e => e.assignedAmbulanceId === p.ambulanceCallSign?.split(' ')[0] || e.assignedAmbulanceId === p.ambulancePlate)
  );
  const otherHospitalParamedics = allHospitalParamedics.filter(
    p => !currentHospitalParamedics.some(cp => cp.id === p.id)
  );
  const displayParamedics = [...currentHospitalParamedics, ...otherHospitalParamedics];

  // Intercom paging action
  const handlePageDoctor = (doc) => {
    addNotification(
      'Emergency Doctor Paged via ER Intercom',
      `${doc.name} (${doc.specialization}) paged to Trauma Resuscitation Bay. Intercom: ${doc.intercom}`,
      'urgent',
      'all'
    );
    setStaffActionNotice(`Paged ${doc.name} via ${doc.intercom}. Alert sent to emergency trauma console.`);
    setTimeout(() => setStaffActionNotice(null), 4000);
  };

  // VHF Radio Hail action
  const handleHailRadio = (paramedic) => {
    addNotification(
      'Emergency Radio Dispatch Hail',
      `Trauma Desk calling ${paramedic.name} on ${paramedic.radioChannel} (${paramedic.ambulanceCallSign}). Inbound report requested.`,
      'warning',
      'all'
    );
    setStaffActionNotice(`Hailing ${paramedic.name} over ${paramedic.radioChannel}...`);
    setTimeout(() => setStaffActionNotice(null), 4000);
  };

  // Hospital Profile Editing State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: hospital.name,
    emergencyHotline: hospital.emergencyHotline,
    phone: hospital.phone,
    email: hospital.email,
    address: hospital.address,
    traumaLevel: 'Level 1 Comprehensive Trauma Resuscitation Center',
    accreditation: 'NABH & NABL Apex Accredited Super Specialty',
    erDirector: 'Dr. S. K. Narang, MD (Trauma & Critical Care)',
    radioChannel: 'VHF Emergency Ch 4 (155.340 MHz)',
    helipadStatus: 'Available (Rooftop Helipad Active)',
    specialNotes: '24/7 Red Bay Resuscitation Active. Cath Lab & Burn ICU on continuous standby. Green Corridor organ transit certified.'
  });

  // Sync state if hospital selection changes
  const handleSelectHospital = (id) => {
    setSelectedHospitalId(id);
    const h = hospitals.find(item => item.id === id);
    if (h) {
      setGeneralBeds(h.generalBeds);
      setIcuBeds(h.icuBeds);
      setVentilators(h.ventilators);
      setOxygenStatus(h.oxygenStatus);
      setBloodBank(h.bloodBank);
      setProfileForm(prev => ({
        ...prev,
        name: h.name,
        emergencyHotline: h.emergencyHotline || '+91 33 2223 1589',
        phone: h.phone || '+91 33 2223 1500',
        email: h.email || 'emergency@sskmhospital.wb.gov.in',
        address: h.address || '244, AJC Bose Road, Bhowanipore, Kolkata',
        traumaLevel: h.traumaLevel || 'Level 1 Comprehensive Trauma Resuscitation Center',
        accreditation: h.accreditation || 'NABH & NABL Apex Accredited Super Specialty',
        erDirector: h.erDirector || 'Dr. S. K. Narang, MD (Trauma & Critical Care)',
        radioChannel: h.radioChannel || 'VHF Emergency Ch 4 (155.340 MHz)',
        helipadStatus: h.helipadStatus || 'Available (Rooftop Helipad Active)',
        specialNotes: h.specialNotes || '24/7 Red Bay Resuscitation Active. Cath Lab & Burn ICU on continuous standby. Green Corridor organ transit certified.'
      }));
    }
  };

  const handleSaveHospitalProfile = (e) => {
    e.preventDefault();
    updateHospitalResources(hospital.id, {
      name: profileForm.name,
      emergencyHotline: profileForm.emergencyHotline,
      phone: profileForm.phone,
      email: profileForm.email,
      address: profileForm.address,
      traumaLevel: profileForm.traumaLevel,
      accreditation: profileForm.accreditation,
      erDirector: profileForm.erDirector,
      radioChannel: profileForm.radioChannel,
      helipadStatus: profileForm.helipadStatus,
      specialNotes: profileForm.specialNotes
    });
    setIsEditProfileModalOpen(false);
    addNotification(
      'Facility Profile Updated',
      `${profileForm.name} profile credentials, trauma level, and contact directories updated successfully.`,
      'success',
      'hospital'
    );
  };

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    addNotification(
      `[${hospital.name}] ${broadcastTitle}`,
      broadcastMsg,
      broadcastSeverity,
      'hospital'
    );
    setBroadcastTitle('');
    setBroadcastMsg('');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const handleSaveResources = () => {
    updateHospitalResources(hospital.id, {
      generalBeds,
      icuBeds,
      ventilators,
      oxygenStatus,
      bloodBank
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleConfirmArrival = (emergency) => {
    if (emergency.assignedAmbulanceId) {
      updateAmbulanceStatus(emergency.assignedAmbulanceId, 'Completed');
    }
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    addNotification(
      'Patient Received at ER',
      `${emergency.patientName} (${emergency.id}) successfully admitted to ${hospital.name} Trauma Bay.`,
      'success',
      'all'
    );
  };

  const handleBloodStockChange = (group, delta) => {
    setBloodBank(prev => ({
      ...prev,
      [group]: Math.max(0, (prev[group] || 0) + delta)
    }));
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* SECTION 1: HOSPITAL IDENTIFICATION & HEADER */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">{hospital.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-400 border border-blue-800">
                  {hospital.type}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                  ID: {hospital.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {hospital.address}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1 text-slate-200">
                  <Phone className="w-3.5 h-3.5 text-red-500" />
                  ER Hotline: <strong className="font-mono text-emerald-400">{hospital.emergencyHotline}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {hospital.email}
                </span>
                <span>•</span>
                <span className="text-purple-400 font-semibold">{hospital.organTransplantStatus}</span>
              </div>
            </div>
          </div>

          {/* Quick Hospital Switcher & Profile Navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Switch Operating Hospital:</label>
              <select
                value={selectedHospitalId}
                onChange={(e) => handleSelectHospital(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPortalTab(portalTab === 'Staff Directory' ? 'Dashboard' : 'Staff Directory')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                  portalTab === 'Staff Directory'
                    ? 'bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/60'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-200" />
                <span>{portalTab === 'Staff Directory' ? 'Back to Operations' : 'Doctors & Paramedics'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Roster
                </span>
              </button>

              <button
                onClick={() => setPortalTab(portalTab === 'Notifications' ? 'Dashboard' : 'Notifications')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                  portalTab === 'Notifications'
                    ? 'bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/60'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>{portalTab === 'Notifications' ? 'Back to Operations' : 'Hospital Alerts'}</span>
                {hospitalNotifications.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-teal-400 text-slate-950">
                    {hospitalNotifications.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setPortalTab(portalTab === 'Profile' ? 'Dashboard' : 'Profile')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                  portalTab === 'Profile'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-300" />
                <span>{portalTab === 'Profile' ? 'Back to Operations' : 'Hospital Profile'}</span>
              </button>

              <button
                onClick={() => openInGoogleMapsApp(hospital.lat, hospital.lng, hospital.name)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 hover:border-slate-600"
                title="Open in Google Maps App"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Maps</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* HOSPITAL ALERTS SECTION (portalTab === 'Notifications') */}
      {/* ========================================================================= */}
      {portalTab === 'Notifications' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Alerts Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-teal-950/20 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                  <Bell className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black text-white">Hospital Alerts & Trauma Broadcasts</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-950 text-teal-300 border border-teal-800">
                      {hospitalNotifications.length} Active Alerts
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Live system alerts, incoming trauma notifications, bed capacity warnings, and hospital network broadcasts for <strong>{hospital.name}</strong>.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                    <span className="text-emerald-400 font-bold">● Network: Synchronized</span>
                    <span>•</span>
                    <span className="text-amber-400">ER Hotline: {hospital.emergencyHotline}</span>
                    <span>•</span>
                    <span className="text-purple-300">{hospital.traumaLevel || 'Level 1 Trauma Center'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPortalTab('Dashboard')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Operations Dashboard</span>
                </button>
                <button
                  onClick={() => setPortalTab('Profile')}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
                >
                  <Building2 className="w-4 h-4 text-emerald-200" />
                  <span>Hospital Profile</span>
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Incoming Trauma Cases</span>
                <span className="text-lg font-bold font-mono text-red-400">{incomingEmergencies.length} Active</span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">ICU Bed Availability</span>
                <span className={`text-lg font-bold font-mono ${icuBeds < 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {icuBeds} Units Available
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Oxygen Reserves</span>
                <span className="text-lg font-bold font-mono text-cyan-400">{oxygenStatus}</span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Trauma Radio Channel</span>
                <span className="text-lg font-bold font-mono text-purple-300">VHF Ch 4 (155.340)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Dispatch Emergency Broadcast Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Send Hospital Trauma Broadcast</h3>
                  <p className="text-[11px] text-slate-400">Broadcast alert to ER teams, ambulances, and control room</p>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Broadcast Title / Subject:</label>
                  <input
                    type="text"
                    placeholder="e.g., Red Bay 1 at Full Capacity • Diverting ALS-2"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Alert Severity Level:</label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500 font-medium"
                  >
                    <option value="warning">Warning / Capacity Alert</option>
                    <option value="urgent">Urgent / Red Trauma Priority</option>
                    <option value="info">Operational Info / Standby</option>
                    <option value="success">Clear / All Clear Notice</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Detailed Message:</label>
                  <textarea
                    rows={3}
                    placeholder="Specify trauma bay readiness, blood requirements, or diversion guidance..."
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                {broadcastSent && (
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Broadcast successfully dispatched across emergency grid!</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Network Broadcast</span>
                </button>
              </form>
            </div>

            {/* Live Alerts Stream */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-400" />
                  <h3 className="font-bold text-white text-sm">Real-Time Hospital Alert Log</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Auto-refresh active</span>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {hospitalNotifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800/80">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                    No active hospital alerts. Systems operating at normal baseline.
                  </div>
                ) : (
                  hospitalNotifications.map(n => {
                    const isUrgent = n.type === 'urgent' || n.type === 'error';
                    const isWarning = n.type === 'warning';
                    return (
                      <div
                        key={n.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isUrgent
                            ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                            : isWarning
                            ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                              isUrgent
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : isWarning
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-teal-950 text-teal-400 border border-teal-800'
                            }`}>
                              {isUrgent ? <AlertOctagon className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{n.title}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  isUrgent
                                    ? 'bg-red-950 text-red-300 border border-red-800'
                                    : isWarning
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-teal-950 text-teal-300 border border-teal-800'
                                }`}>
                                  {n.type || 'info'}
                                </span>
                              </div>
                              <p className="text-xs mt-1 text-slate-300 leading-relaxed">{n.message}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{n.timestamp}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* HOSPITAL PROFILE SECTION (portalTab === 'Profile') */}
      {/* ========================================================================= */}
      {portalTab === 'Profile' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Facility Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Emergency Facility
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Trauma Registry: {hospital.id}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    {profileForm.accreditation}
                  </span>
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight">{hospital.name}</h2>
                
                <p className="text-sm text-slate-300 flex items-center gap-2 max-w-2xl">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  {hospital.address}
                </p>

                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-emerald-400" />
                  {profileForm.traumaLevel}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Facility Profile & Specs
                </button>
                <button
                  onClick={() => openInGoogleMapsApp(hospital.lat, hospital.lng, hospital.name)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  Open in Google Maps
                </button>
              </div>
            </div>

            {/* Quick Spec Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Emergency Hotline</span>
                <div className="text-sm font-black font-mono text-emerald-400 mt-0.5">{profileForm.emergencyHotline}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Direct Landline</span>
                <div className="text-sm font-black font-mono text-white mt-0.5">{profileForm.phone}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rooftop Helipad</span>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">{profileForm.helipadStatus}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CAD Radio Channel</span>
                <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">{profileForm.radioChannel}</div>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Leadership & Operational Administration */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-emerald-400" />
                Medical Leadership & Protocol
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Chief of Emergency & Trauma:</span>
                  <div className="font-bold text-white text-sm mt-0.5">{profileForm.erDirector}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Official ER Contact Dispatch:</span>
                  <div className="text-slate-200 mt-0.5 font-mono">{profileForm.email}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Facility Classification:</span>
                  <div className="text-emerald-400 font-semibold mt-0.5">{hospital.type} ({hospital.distance || '1.8 km'} from Central District)</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Green Corridor Transit Certification:</span>
                  <div className="text-purple-300 font-semibold mt-0.5">{hospital.organTransplantStatus}</div>
                </div>
                <div className="pt-2">
                  <span className="text-slate-400 font-semibold">Special Operational Protocol:</span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-[11px] leading-relaxed mt-1">
                    {profileForm.specialNotes}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Resuscitation Bays & Critical Facilities */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                Resuscitation & Trauma Capabilities
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-red-600/20 text-red-400 rounded-lg shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Dedicated Red Bays 1 & 2</span>
                    <span className="text-slate-400 text-[11px]">Equipped for invasive hemodynamic monitoring, defibrillation, and crash cart triage.</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">24/7 Digital Cath Lab & CT</span>
                    <span className="text-slate-400 text-[11px]">Priority stroke thrombolysis & primary PCI angioplasty door-to-balloon &lt; 45 mins.</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg shrink-0">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Burn ICU & Negative Pressure</span>
                    <span className="text-slate-400 text-[11px]">Specialized isolation chambers and hyperbaric oxygen capability.</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">In-House Blood Bank & Aphaeresis</span>
                    <span className="text-slate-400 text-[11px]">All components (PRBC, FFP, Platelets, Cryo) with emergency uncrossmatched O-negative stock.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Live Telemetry & Capacity Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Layers className="w-4 h-4 text-blue-400" />
                Live Bed & Resource Capacity
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Emergency Beds</span>
                  <div className="text-2xl font-mono font-black text-white mt-1">{generalBeds}</div>
                  <span className="text-[10px] text-emerald-400">Available Now</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">ICU Beds</span>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-1">{icuBeds}</div>
                  <span className="text-[10px] text-emerald-400">Critical Care Ready</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Ventilators</span>
                  <div className="text-2xl font-mono font-black text-purple-400 mt-1">{ventilators}</div>
                  <span className="text-[10px] text-purple-400">Invasive & BiPAP</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Oxygen Pipeline</span>
                  <div className="text-sm font-bold text-amber-400 mt-2">{oxygenStatus}</div>
                  <span className="text-[10px] text-slate-400">Cryogenic Plant</span>
                </div>
              </div>

              {/* Total Blood Bank Units */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Blood Bank Total Reserves:</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {Object.values(bloodBank).reduce((a, b) => a + b, 0)} Units
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  {Object.entries(bloodBank).map(([grp, units]) => (
                    <div key={grp} className="p-1.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-red-400 font-bold block">{grp}</span>
                      <span className="font-mono text-white">{units}u</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setPortalTab('Dashboard')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Go to Live ER Arrival & Operations Dashboard
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* HOSPITAL DOCTORS & PARAMEDIC/EMT STAFF DIRECTORY (portalTab === 'Staff Directory') */}
      {/* ========================================================================= */}
      {portalTab === 'Staff Directory' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Hero Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Hospital Clinical & Field EMS Roster
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Facility: {hospital.name}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    {hospital.traumaLevel || 'Level 1 Apex Resuscitation Center'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Emergency Doctors & Paramedic / EMT Directory
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                  Comprehensive credentials, surgical licenses, radio channels, and live duty status for attending emergency trauma physicians and sector paramedic units.
                </p>

                {staffActionNotice && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{staffActionNotice}</span>
                  </div>
                )}
              </div>

              {/* Top Summary KPI Cards */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">ER Doctors on Duty</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                    {displayDoctors.filter(d => d.statusCategory === 'on_duty' || d.statusCategory === 'in_or').length} Active
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Total Roster: {displayDoctors.length}</span>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Paramedic Units</span>
                  <div className="text-2xl font-black font-mono text-teal-400 mt-0.5">
                    {displayParamedics.length} Units
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono">
                    {displayParamedics.filter(p => p.statusCategory === 'in_transit').length} In Transit
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Frequency & Status Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Trauma ER Director</span>
                <span className="text-sm font-bold text-white">{profileForm.erDirector || 'Dr. S. K. Narang, MD'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Emergency Intercom Hub</span>
                <span className="text-sm font-mono font-bold text-emerald-400">Ext. 400 - 420 (ER Desk)</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">CAD VHF Radio Dispatch</span>
                <span className="text-sm font-mono font-bold text-amber-300">{hospital.radioChannel || 'VHF Ch 4 (155.340 MHz)'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Inbound Patient Handover</span>
                <span className="text-sm font-mono font-bold text-cyan-300">{incomingEmergencies.length} Active Trauma Bays</span>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="Search staff by name, license #, specialty, or ambulance..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              {/* Role Filter Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStaffRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    staffRoleFilter === 'all'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Staff
                </button>
                <button
                  onClick={() => setStaffRoleFilter('doctor')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    staffRoleFilter === 'doctor'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Doctors ({displayDoctors.length})
                </button>
                <button
                  onClick={() => setStaffRoleFilter('paramedic')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    staffRoleFilter === 'paramedic'
                      ? 'bg-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paramedics & EMTs ({displayParamedics.length})
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={staffStatusFilter}
                onChange={(e) => setStaffStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">All Duty Statuses</option>
                <option value="on_duty">On Duty / In OR / Active</option>
                <option value="in_transit">In Transit with Patient</option>
                <option value="available">Available / Standby</option>
              </select>
            </div>
          </div>

          {/* DOCTORS DIRECTORY SECTION */}
          {(staffRoleFilter === 'all' || staffRoleFilter === 'doctor') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-black text-white">Emergency Doctors & Trauma Surgeons</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Faculty & Resuscitation Staff
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Showing {displayDoctors.filter(d => {
                    const matchesSearch = !staffSearchQuery || 
                      d.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      d.specialization.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      d.registrationNumber.toLowerCase().includes(staffSearchQuery.toLowerCase());
                    const matchesStatus = staffStatusFilter === 'all' ||
                      (staffStatusFilter === 'on_duty' && (d.statusCategory === 'on_duty' || d.statusCategory === 'in_or')) ||
                      (staffStatusFilter === 'available' && d.statusCategory === 'on_call');
                    return matchesSearch && matchesStatus;
                  }).length} Physicians
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayDoctors
                  .filter(d => {
                    const matchesSearch = !staffSearchQuery || 
                      d.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      d.specialization.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      d.registrationNumber.toLowerCase().includes(staffSearchQuery.toLowerCase());
                    const matchesStatus = staffStatusFilter === 'all' ||
                      (staffStatusFilter === 'on_duty' && (d.statusCategory === 'on_duty' || d.statusCategory === 'in_or')) ||
                      (staffStatusFilter === 'available' && d.statusCategory === 'on_call');
                    return matchesSearch && matchesStatus;
                  })
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 shadow-xl space-y-4 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Header: Avatar, Name & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-900/30 shrink-0 border border-blue-400/30">
                              <Stethoscope className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-black text-white text-base group-hover:text-blue-300 transition-colors">
                                {doc.name}
                              </h4>
                              <p className="text-xs text-blue-400 font-semibold">{doc.specialization}</p>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                Reg: {doc.registrationNumber}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border ${
                            doc.statusCategory === 'on_duty'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : doc.statusCategory === 'in_or'
                              ? 'bg-purple-950 text-purple-300 border-purple-700 animate-pulse'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}>
                            {doc.availability}
                          </span>
                        </div>

                        {/* Medical Qualifications & Department */}
                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Qualifications</span>
                            <span className="text-white font-medium text-[11px]">{doc.qualifications}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Department</span>
                            <span className="text-slate-300 text-[11px]">{doc.department}</span>
                          </div>
                          <div className="pt-1 border-t border-slate-900 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Shift Hours:</span>
                            <span className="font-mono text-slate-200">{doc.shift}</span>
                          </div>
                        </div>

                        {/* Contact & Patient Load */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Hospital Intercom</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs">{doc.intercom}</span>
                          </div>
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Clinical Experience</span>
                            <span className="font-bold text-white text-[11px]">{doc.experience.split('(')[0]}</span>
                          </div>
                        </div>

                        {/* Active Patient Load */}
                        <div className="p-2.5 bg-blue-950/30 rounded-xl border border-blue-900/40 text-xs flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-slate-300 text-[11px]">
                            Current Load: <strong className="text-blue-300">{doc.activePatientLoad}</strong>
                          </span>
                        </div>

                        {/* Verified Surgical Skills */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Key Surgical Competencies:</span>
                          <div className="flex flex-wrap gap-1">
                            {doc.skills.map((sk) => (
                              <span key={sk} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Doctor Action Buttons */}
                      <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                        <button
                          onClick={() => handlePageDoctor(doc)}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Page Intercom</span>
                        </button>
                        <a
                          href={`tel:${doc.mobile}`}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1"
                          title="Call Doctor Direct Mobile"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* PARAMEDIC & EMT DIRECTORY SECTION */}
          {(staffRoleFilter === 'all' || staffRoleFilter === 'paramedic') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-black text-white">Paramedic & Emergency Medical Technician (EMT) Units</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                    Field Resuscitation & Mobile ICU Crews
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Showing {displayParamedics.filter(p => {
                    const matchesSearch = !staffSearchQuery || 
                      p.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      p.ambulancePlate.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      p.licenseNumber.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      p.certificationLevel.toLowerCase().includes(staffSearchQuery.toLowerCase());
                    const matchesStatus = staffStatusFilter === 'all' ||
                      (staffStatusFilter === 'in_transit' && p.statusCategory === 'in_transit') ||
                      (staffStatusFilter === 'available' && p.statusCategory === 'available') ||
                      (staffStatusFilter === 'on_duty' && (p.statusCategory === 'in_transit' || p.statusCategory === 'available'));
                    return matchesSearch && matchesStatus;
                  }).length} Field Units
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayParamedics
                  .filter(p => {
                    const matchesSearch = !staffSearchQuery || 
                      p.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      p.ambulancePlate.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      p.licenseNumber.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      p.certificationLevel.toLowerCase().includes(staffSearchQuery.toLowerCase());
                    const matchesStatus = staffStatusFilter === 'all' ||
                      (staffStatusFilter === 'in_transit' && p.statusCategory === 'in_transit') ||
                      (staffStatusFilter === 'available' && p.statusCategory === 'available') ||
                      (staffStatusFilter === 'on_duty' && (p.statusCategory === 'in_transit' || p.statusCategory === 'available'));
                    return matchesSearch && matchesStatus;
                  })
                  .map((paramedic) => (
                    <div
                      key={paramedic.id}
                      className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-5 shadow-xl space-y-4 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Header: Ambulance Unit & Paramedic Name */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 flex items-center justify-center text-white font-black text-base shadow-lg shadow-teal-900/30 shrink-0 border border-teal-400/30">
                              <Ambulance className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-black text-white text-base group-hover:text-teal-300 transition-colors">
                                {paramedic.name}
                              </h4>
                              <p className="text-xs text-teal-400 font-semibold">{paramedic.designation}</p>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                Unit: <strong>{paramedic.ambulancePlate}</strong> ({paramedic.ambulanceCallSign?.split(' ')[0]})
                              </span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border ${
                            paramedic.statusCategory === 'in_transit'
                              ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          }`}>
                            {paramedic.statusCategory === 'in_transit' ? 'In Transit' : 'Available'}
                          </span>
                        </div>

                        {/* License & Certification Level */}
                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">License & Certification</span>
                            <span className="text-teal-300 font-bold text-[11px] block">{paramedic.certificationLevel}</span>
                            <span className="text-slate-400 font-mono text-[10px]">{paramedic.licenseNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Ambulance Fleet Type</span>
                            <span className="text-white text-[11px]">{paramedic.ambulanceType}</span>
                          </div>
                          <div className="pt-1 border-t border-slate-900 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Driver & Crew:</span>
                            <span className="font-mono text-slate-300">{paramedic.driverName}</span>
                          </div>
                        </div>

                        {/* Direct Radio Frequency & Telemetry */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                              <Radio className="w-3 h-3 text-cyan-400" /> Radio Channel
                            </span>
                            <span className="font-mono font-bold text-amber-300 text-xs">{paramedic.radioChannel?.split(' ')[0]} {paramedic.radioChannel?.split(' ')[1]}</span>
                          </div>
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Field Experience</span>
                            <span className="font-bold text-white text-xs">{paramedic.experienceYears} Years Active</span>
                          </div>
                        </div>

                        {/* Status Note & Active Casualty */}
                        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                          <div className="text-[11px] text-slate-300">
                            Status: <strong className={paramedic.statusCategory === 'in_transit' ? 'text-rose-400' : 'text-emerald-400'}>{paramedic.status}</strong>
                          </div>
                          {paramedic.patientName && (
                            <div className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                              <span>Patient:</span>
                              <span className="text-white">{paramedic.patientName}</span>
                            </div>
                          )}
                        </div>

                        {/* Verified Field Resuscitation Competencies */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Verified Clinical Procedures:</span>
                          <div className="flex flex-wrap gap-1">
                            {paramedic.verifiedSkills.map((sk) => (
                              <span key={sk} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Equipment Readiness Badge */}
                        <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[10px] text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Pre-Trip Equipment: {paramedic.equipmentReadiness}</span>
                        </div>
                      </div>

                      {/* Paramedic Action Buttons */}
                      <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                        <button
                          onClick={() => handleHailRadio(paramedic)}
                          className="flex-1 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-950/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Radio className="w-3.5 h-3.5 text-cyan-200" />
                          <span>Hail VHF Radio</span>
                        </button>
                        <a
                          href={`tel:${paramedic.phone}`}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1"
                          title="Call Paramedic Mobile"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-400" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* OPERATIONAL DASHBOARD SECTIONS (Shown when not on Profile, Notifications or Staff Directory) */}
      {/* ========================================================================= */}
      {portalTab !== 'Profile' && portalTab !== 'Notifications' && portalTab !== 'Staff Directory' && (
        <>
          {/* SECTION: DIGITAL GREEN CORRIDOR ORGAN LOGISTICS GOOGLE MAP */}
          {(portalTab === 'Dashboard' || portalTab === 'Green Corridor') && (
            <DigitalGreenCorridorMap isHospitalView={true} />
          )}

          {/* SECTION 2: INCOMING PATIENT ARRIVAL MANAGEMENT */}
          {(portalTab === 'Dashboard' || portalTab === 'Incoming ER') && (
            <section className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Incoming Emergency Patient Arrival Queue
                  </h2>
                  <p className="text-xs text-slate-400">Live incoming ambulances en route to this facility with trauma prep checklists</p>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 px-3 py-1 rounded-xl border border-amber-800">
                  {incomingEmergencies.length} Incoming Transports
                </span>
              </div>

              {incomingEmergencies.length === 0 ? (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-50" />
                  No active incoming ambulance transports right now. Hospital emergency department is in ready state.
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingEmergencies.map(emg => {
                    const amb = ambulances.find(a => a.id === emg.assignedAmbulanceId);
                    return (
                      <div
                        key={emg.id}
                        className="bg-slate-900 border border-red-800/60 rounded-3xl p-6 shadow-2xl space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-3 bg-red-600/20 text-red-500 rounded-2xl border border-red-600/30">
                              <Activity className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-lg">{emg.patientName}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-950 text-red-400 border border-red-800">
                                  {emg.severity}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">({emg.id})</span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1">
                                {emg.emergencyType} • Age: {emg.patientAge} • Blood Group: <strong className="text-red-400 font-mono">{emg.patientBloodGroup}</strong>
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Ambulance: <strong className="text-amber-400">{amb?.plateNumber || 'DL-01-EA-1081'}</strong> ({amb?.driverName} - {amb?.driverPhone})
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-2">
                            <div className="text-2xl font-black font-mono text-emerald-400">
                              ETA: {emg.etaMinutes || 6} MINS
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => openDigitalTwinForPatient(emg)}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-cyan-400/30"
                              >
                                <HeartPulse className="w-4 h-4 text-cyan-200 animate-pulse" />
                                🧬 3D Digital Twin
                              </button>
                              <button
                                onClick={() => setExpandedEquipmentEmgId(expandedEquipmentEmgId === emg.id ? null : emg.id)}
                                className={`px-4 py-2 font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border ${
                                  expandedEquipmentEmgId === emg.id
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/40'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                }`}
                              >
                                <CheckSquare className="w-4 h-4 text-amber-400" />
                                {expandedEquipmentEmgId === emg.id ? 'Hide Equipment' : 'Equipment Checklist'}
                              </button>
                              <button
                                onClick={() => handleConfirmArrival(emg)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Confirm Arrival
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Trauma Bay Preparation Checklist */}
                        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Red Bay 1 Cleared</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Trauma Team Alerted</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Blood Bank Standby</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>CT Scanner Standby</span>
                          </div>
                        </div>

                        {/* Expandable Live Pre-Treatment Equipment Checklist */}
                        {expandedEquipmentEmgId === emg.id && (
                          <div className="pt-4 border-t border-slate-800 space-y-3 animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl">
                              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                                <CheckSquare className="w-4 h-4 text-amber-400" />
                                <span>INCOMING AMBULANCE PRE-TREATMENT EQUIPMENT TELEMETRY</span>
                              </div>
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                Verified by Paramedic / EMT Crew • Read-Only
                              </span>
                            </div>
                            <PreTreatmentEquipmentChecklist
                              ambulance={amb}
                              ambulanceId={amb?.id}
                              emergency={emg}
                              canEdit={false}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* SECTION: ER MEDICAL STAFF & INBOUND PARAMEDIC SQUAD OVERVIEW */}
          {portalTab === 'Dashboard' && (
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>Hospital ER Clinical Faculty & Inbound Paramedic Roster</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Active trauma surgeons, critical care physicians, and sector paramedic crews assigned to {hospital.name}
                  </p>
                </div>

                <button
                  onClick={() => setPortalTab('Staff Directory')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center"
                >
                  <Users className="w-4 h-4" />
                  <span>Open Full Staff Directory</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* On-Duty Doctors Preview */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-blue-400" />
                      Attending Trauma Physicians On Duty
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {displayDoctors.filter(d => d.statusCategory === 'on_duty' || d.statusCategory === 'in_or').length} Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    {displayDoctors.slice(0, 3).map((d) => (
                      <div key={d.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{d.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">({d.registrationNumber})</span>
                          </div>
                          <span className="text-[11px] text-blue-300">{d.specialization}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 block">
                            {d.intercom}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{d.availability.split('-')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inbound / Sector Paramedics Preview */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Ambulance className="w-4 h-4 text-teal-400" />
                      Sector Paramedic & EMT Units
                    </span>
                    <span className="font-mono text-teal-400 font-bold">
                      {displayParamedics.length} Fleet Crews
                    </span>
                  </div>

                  <div className="space-y-2">
                    {displayParamedics.slice(0, 3).map((p) => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="text-[10px] font-mono text-teal-300">({p.ambulanceCallSign?.split(' ')[0]})</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{p.certificationLevel}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold block ${
                            p.statusCategory === 'in_transit'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {p.statusCategory === 'in_transit' ? 'In Transit' : 'Available'}
                          </span>
                          <span className="text-[10px] font-mono text-amber-300 mt-0.5 block">{p.radioChannel?.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION: AMBULANCE PRE-TREATMENT EQUIPMENT READINESS VIEW */}
          {portalTab === 'Equipment' && (
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-amber-400" />
                    Ambulance Pre-Treatment Equipment Inspection Matrix
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live telemetry of equipment, resuscitation medications, and immobilization tools verified by Paramedic / EMT units
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Live ER Inspection View (Read-Only)
                </span>
              </div>

              {/* Grid of Ambulances Equipment Status */}
              <div className="grid grid-cols-1 gap-6">
                {(incomingEmergencies.length > 0
                  ? incomingEmergencies.map(e => ({ emergency: e, ambulance: ambulances.find(a => a.id === e.assignedAmbulanceId) || ambulances[0] }))
                  : ambulances.map(a => ({ emergency: null, ambulance: a }))
                ).map(({ emergency, ambulance: ambItem }, idx) => (
                  <div key={ambItem?.id || idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Ambulance className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm">
                              {ambItem?.plateNumber || ambItem?.callSign || 'Ambulance Unit'}
                            </h3>
                            <span className="text-xs font-mono text-slate-400">({ambItem?.id})</span>
                            {emergency && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                                En Route: {emergency.patientName} ({emergency.emergencyType})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            Driver: {ambItem?.driverName} ({ambItem?.driverPhone}) • Paramedic: {ambItem?.paramedicName || 'Trauma Team'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          Base: {ambItem?.hospitalName || hospital.name}
                        </span>
                      </div>
                    </div>

                    <PreTreatmentEquipmentChecklist
                      ambulance={ambItem}
                      ambulanceId={ambItem?.id}
                      emergency={emergency}
                      canEdit={false}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: REAL-TIME RESOURCE CAPACITY MANAGEMENT */}
          {(portalTab === 'Dashboard' || portalTab === 'Beds & ICU' || portalTab === 'Resources' || portalTab === 'Blood Bank') && (
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    Live Hospital Resource & Inventory Controller
                  </h2>
                  <p className="text-xs text-slate-400">Modify live telemetry visible to control rooms, ambulances, and patients</p>
                </div>

                <div className="flex items-center gap-3">
                  {savedSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" /> Telemetry Saved!
                    </span>
                  )}
                  <button
                    onClick={handleSaveResources}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Update Live System Capacity
                  </button>
                </div>
              </div>

              {/* Sliders & Numeric Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                
                {/* General Beds */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Available Emergency Beds</span>
                    <span className="font-mono text-base font-bold text-white">{generalBeds}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGeneralBeds(Math.max(0, generalBeds - 1))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={generalBeds}
                      onChange={(e) => setGeneralBeds(Number(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <button
                      onClick={() => setGeneralBeds(generalBeds + 1)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ICU Beds */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Available ICU Beds</span>
                    <span className="font-mono text-base font-bold text-emerald-400">{icuBeds}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIcuBeds(Math.max(0, icuBeds - 1))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={icuBeds}
                      onChange={(e) => setIcuBeds(Number(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <button
                      onClick={() => setIcuBeds(icuBeds + 1)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Ventilators */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Available Ventilators</span>
                    <span className="font-mono text-base font-bold text-purple-400">{ventilators}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVentilators(Math.max(0, ventilators - 1))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={ventilators}
                      onChange={(e) => setVentilators(Number(e.target.value))}
                      className="flex-1 accent-purple-500"
                    />
                    <button
                      onClick={() => setVentilators(ventilators + 1)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Oxygen Reserve Status */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Oxygen Pipeline Status</span>
                    <span className="font-bold text-amber-400">{oxygenStatus}</span>
                  </div>
                  <select
                    value={oxygenStatus}
                    onChange={(e) => setOxygenStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-medium"
                  >
                    <option value="Available">Available (Optimal reserves &gt; 5000L)</option>
                    <option value="Limited">Limited (Refill requested)</option>
                    <option value="Unavailable">Unavailable (Critical low)</option>
                  </select>
                </div>

              </div>

              {/* Blood Bank Inventory by Group */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Bank Available Units:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-xs">
                  {Object.entries(bloodBank).map(([grp, units]) => (
                    <div key={grp} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                      <span className="text-red-400 font-extrabold text-sm">{grp}</span>
                      <div className="font-mono font-bold text-white text-base">{units} u</div>
                      <div className="flex items-center justify-center gap-1 pt-1">
                        <button
                          onClick={() => handleBloodStockChange(grp, -1)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleBloodStockChange(grp, 1)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>
          )}

          {/* SECTION 4: HOSPITAL VICINITY MAP */}
          {(portalTab === 'Dashboard' || portalTab === 'Vicinity Map') && (
            !isEmergencyProtocolCompleted ? (
              <EmergencyMapLockScreen
                portalName="Hospital Portal"
                featureName="Hospital Vicinity Emergency GIS Map & Inbound Fastest Route"
                themeColor="emerald"
              />
            ) : (
              <section className="space-y-3 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    Hospital Vicinity Emergency GIS Map & Inbound Fastest Route
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1 shadow-sm w-fit">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    Traffic Police Green Wave Corridor
                  </span>
                </div>
                <EmergencyMap
                  center={[hospital.lat, hospital.lng]}
                  zoom={14}
                  hospitals={[hospital]}
                  ambulances={ambulances}
                  activeEmergency={incomingEmergencies[0] || activeEmergencies[0]}
                  trafficSignals={trafficSignals}
                  patientLocation={incomingEmergencies[0]?.location || activeEmergencies[0]?.location}
                  height="450px"
                  defaultMode="interactive"
                  showGrantClearance={false}
                />
              </section>
            )
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* EDIT HOSPITAL PROFILE MODAL */}
      {/* ========================================================================= */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-600 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Edit Hospital Facility Profile & Telemetry Specs
              </span>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHospitalProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Hospital Name:</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Emergency 24/7 Hotline:</label>
                  <input
                    type="text"
                    value={profileForm.emergencyHotline}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyHotline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Direct Switchboard Phone:</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">ER Contact Email:</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-400 font-semibold">Physical Facility Address:</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Trauma Center Classification:</label>
                  <input
                    type="text"
                    value={profileForm.traumaLevel}
                    onChange={(e) => setProfileForm({ ...profileForm, traumaLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Accreditation & Standards:</label>
                  <input
                    type="text"
                    value={profileForm.accreditation}
                    onChange={(e) => setProfileForm({ ...profileForm, accreditation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">ER Medical Director:</label>
                  <input
                    type="text"
                    value={profileForm.erDirector}
                    onChange={(e) => setProfileForm({ ...profileForm, erDirector: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">CAD / VHF Radio Channel:</label>
                  <input
                    type="text"
                    value={profileForm.radioChannel}
                    onChange={(e) => setProfileForm({ ...profileForm, radioChannel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-400 font-semibold">Rooftop Helipad Availability & Status:</label>
                  <input
                    type="text"
                    value={profileForm.helipadStatus}
                    onChange={(e) => setProfileForm({ ...profileForm, helipadStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-400 font-semibold">Special Operational & Trauma Standby Protocols:</label>
                  <textarea
                    rows={3}
                    value={profileForm.specialNotes}
                    onChange={(e) => setProfileForm({ ...profileForm, specialNotes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Hospital Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
