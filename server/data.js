// EmergencyLink Initial Mock & Persistent Data Seed
export const initialData = {
  // Pre-configured User Accounts for Role-Based Access Control (RBAC)
  users: [
    {
      id: "USR-PAT-01",
      username: "patient.rahul",
      password: "password123", // In production hashed via bcrypt
      role: "PATIENT",
      name: "Rahul Verma",
      email: "rahul.verma@example.com",
      referenceId: "PAT-01"
    },
    {
      id: "USR-PAT-02",
      username: "patient.sunita",
      password: "password123",
      role: "PATIENT",
      name: "Sunita Sharma",
      email: "sunita.sharma@example.com",
      referenceId: "PAT-02"
    },
    {
      id: "USR-DOC-01",
      username: "doctor.ananya",
      password: "password123",
      role: "DOCTOR",
      name: "Dr. Ananya Sen",
      email: "dr.ananya@apollo-delhi.com",
      referenceId: "DOC-01"
    },
    {
      id: "USR-DOC-02",
      username: "doctor.arvind",
      password: "password123",
      role: "DOCTOR",
      name: "Dr. Arvind Mehta",
      email: "arvind.mehta@citytrauma.gov.in",
      referenceId: "DOC-02"
    },
    {
      id: "USR-AMB-01",
      username: "ambulance.vikram",
      password: "password123",
      role: "AMBULANCE",
      name: "Vikram Singh (Ambulance DL-01-EA-1081)",
      email: "amb1081@delhiems.gov.in",
      referenceId: "AMB-01"
    },
    {
      id: "USR-AMB-02",
      username: "ambulance.aslam",
      password: "password123",
      role: "AMBULANCE",
      name: "Mohd. Aslam (Ambulance DL-02-EA-2044)",
      email: "amb2044@citytrauma.gov.in",
      referenceId: "AMB-02"
    },
    {
      id: "USR-HOSP-01",
      username: "hospital.apollo",
      password: "password123",
      role: "HOSPITAL",
      name: "Apollo ER Administrator",
      email: "er.admin@apollo-delhi.com",
      referenceId: "HOSP-02"
    },
    {
      id: "USR-EMT-01",
      username: "paramedic.rajesh",
      password: "password123",
      designation: "Lead Trauma Paramedic",
      role: "PARAMEDIC",
      name: "Paramedic Rajesh Sharma (ALS Lead)",
      email: "rajesh.emt@delhiems.gov.in",
      referenceId: "EMT-01",
      phone: "+91 98102 33445",
      yearsOfExperience: 9,
      experienceDetails: "9+ Years in Pre-hospital Emergency Medical Services & Polytrauma Care",
      qualifications: "B.Sc. in Emergency Medical Technology (EMT), Post-Graduate Diploma in Critical Care & Trauma Management",
      certificationsAndLicenses: [
        "National Emergency Medical Council License #DL-EMT-2017-88492 (Valid 2029)",
        "AHA Advanced Cardiovascular Life Support (ACLS) Certified",
        "International Trauma Life Support (ITLS) - Advanced Provider",
        "Prehospital Trauma Life Support (PHTLS) Certified",
        "Pediatric Advanced Life Support (PALS) Certified",
        "Basic Disaster Life Support (BDLS) & HazMat Awareness"
      ],
      clinicalSkills: [
        "Advanced Airway Management & Endotracheal Intubation",
        "IV Cannulation (14G/16G) & Rapid Intraosseous (IO) Access",
        "12-Lead ECG Interpretation & Acute STEMI Recognition",
        "Manual & Biphasic Defibrillation / Synchronized Cardioversion",
        "Emergency Needle Thoracostomy & Chest Decompression",
        "Combat Tourniquet (CAT) & Hemostatic Wound Packing",
        "Pelvic Circumferential Compression & Traction Splinting",
        "Pre-hospital Resuscitation Pharmacology Administration",
        "Bag-Valve-Mask (BVM) Synchronized Ventilation & PEEP Care",
        "Telemedicine Encrypted Video Stream & Biometric Telemetry Operations"
      ]
    },
    {
      id: "USR-EMT-02",
      username: "emt.amit",
      password: "password123",
      designation: "Emergency Medical Technician",
      role: "PARAMEDIC",
      name: "EMT Amit Verma (Emergency Medical Technician)",
      email: "amit.emt@delhiems.gov.in",
      referenceId: "EMT-02",
      phone: "+91 98103 44556",
      yearsOfExperience: 4,
      experienceDetails: "4+ Years in Emergency Medical Technician (EMT-B / EMT-I) Field Response & Resuscitation",
      qualifications: "Diploma in Emergency Medical Services (EMS), Advanced First Responder Certification",
      certificationsAndLicenses: [
        "National EMT Registry License #DL-EMT-2021-44109 (Valid 2029)",
        "AHA Basic Life Support (BLS) for Healthcare Providers",
        "Prehospital Trauma Life Support (PHTLS) - EMT Provider",
        "Emergency Vehicle Operations & Defensive Driving Certified",
        "Pediatric Emergency Assessment, Recognition, and Stabilization (PEARS)",
        "Disaster Triage & Incident Command System (ICS-100) Certified"
      ],
      clinicalSkills: [
        "Rapid Primary Trauma Assessment & START Triage Scoring",
        "Airway Adjuncts (OPA / NPA) & High-Flow Oxygenation Therapy",
        "Bag-Valve-Mask (BVM) Resuscitation & Suctioning",
        "C-Spine Immobilization, Cervical Collars & Long Spine Board Handling",
        "Automated External Defibrillator (AED) Operations & CPR",
        "Pressure Bandaging, Hemostatic Gauze & Combat Tourniquet (CAT)",
        "Extremity & Traction Splinting for Closed/Open Fractures",
        "Vital Signs Telemetry Transmission & Radio Hospital Handover"
      ]
    },
    {
      id: "USR-CTRL-01",
      username: "control.operator",
      password: "password123",
      role: "CONTROL_ROOM",
      name: "Central Dispatcher - Officer Rajeev Kumar",
      email: "dispatcher01@delhicontrolroom.gov.in",
      referenceId: "CTRL-01"
    }
  ],

  hospitals: [
    {
      id: "HOSP-01",
      name: "SSKM Hospital & IPGMER Apex Trauma Center",
      type: "Government",
      address: "244, AJC Bose Road, Bhowanipore, Kolkata",
      phone: "+91 33 2223 1589",
      emergencyHotline: "108 / 033-22231589",
      email: "er@sskmhospital.wb.gov.in",
      lat: 22.5390,
      lng: 88.3420,
      generalBeds: 48,
      icuBeds: 14,
      ventilators: 9,
      oxygenLitres: 4500,
      oxygenStatus: "Available", // Available, Limited, Unavailable
      doctorsOnDuty: 12,
      operatingTheatres: 6,
      organTransplantStatus: "Authorized Center (Active)",
      bloodBank: {
        "A+": 18,
        "A-": 6,
        "B+": 22,
        "B-": 4,
        "O+": 35,
        "O-": 8,
        "AB+": 9,
        "AB-": 3
      },
      facilities: ["Level 1 Trauma Center", "Burn ICU", "Emergency Cath Lab", "CT & MRI 24/7", "Blood Bank 24/7", "Decontamination Bay"]
    },
    {
      id: "HOSP-02",
      name: "Apollo Multispeciality Hospitals Kolkata",
      type: "Private",
      address: "58, Canal Circular Road, Kadapara, EM Bypass, Kolkata",
      phone: "+91 33 2320 3040",
      emergencyHotline: "1066 / 033-23202122",
      email: "emergency@apollo-kolkata.com",
      lat: 22.5744,
      lng: 88.4038,
      generalBeds: 34,
      icuBeds: 11,
      ventilators: 15,
      oxygenLitres: 7200,
      oxygenStatus: "Available",
      doctorsOnDuty: 16,
      operatingTheatres: 8,
      organTransplantStatus: "Regional Green Corridor Hub",
      bloodBank: {
        "A+": 28,
        "A-": 9,
        "B+": 24,
        "B-": 5,
        "O+": 42,
        "O-": 11,
        "AB+": 14,
        "AB-": 4
      },
      facilities: ["Cardiac Resuscitation Unit", "Stroke Emergency Unit", "Hyperbaric Chamber", "Dedicated Green Corridor Helipad", "Advanced Blood Bank"]
    },
    {
      id: "HOSP-03",
      name: "Calcutta National Medical College & Hospital (CNMCH)",
      type: "Government",
      address: "32, Gorachand Road, Beniapukur, Park Circus, Kolkata",
      phone: "+91 33 2284 4834",
      emergencyHotline: "033-22844834",
      email: "trauma@cnmch-kolkata.gov.in",
      lat: 22.5435,
      lng: 88.3705,
      generalBeds: 16,
      icuBeds: 4,
      ventilators: 5,
      oxygenLitres: 2900,
      oxygenStatus: "Limited",
      doctorsOnDuty: 8,
      operatingTheatres: 4,
      organTransplantStatus: "Authorized Recipient Center",
      bloodBank: {
        "A+": 10,
        "A-": 2,
        "B+": 14,
        "B-": 2,
        "O+": 12,
        "O-": 2,
        "AB+": 4,
        "AB-": 1
      },
      facilities: ["Neuro-Trauma Unit", "Pediatric Emergency", "Rapid Triage Bay"]
    },
    {
      id: "HOSP-04",
      name: "Institute of Neurosciences Kolkata (I-NK)",
      type: "Super Specialty",
      address: "185/1, AJC Bose Road, Park Circus, Kolkata",
      phone: "+91 33 4030 9999",
      emergencyHotline: "102 / 033-40309999",
      email: "emergency@neurokolkata.org",
      lat: 22.5430,
      lng: 88.3640,
      generalBeds: 62,
      icuBeds: 19,
      ventilators: 18,
      oxygenLitres: 9500,
      oxygenStatus: "Available",
      doctorsOnDuty: 20,
      operatingTheatres: 10,
      organTransplantStatus: "National Organ & Tissue Transplant Organization (NOTTO) Partner",
      bloodBank: {
        "A+": 32,
        "A-": 11,
        "B+": 30,
        "B-": 8,
        "O+": 50,
        "O-": 14,
        "AB+": 18,
        "AB-": 6
      },
      facilities: ["Mass Casualty Disaster Bay", "Chemical/Biological Incident Response", "Major Burn Unit", "Critical Airway Bay"]
    }
  ],

  ambulances: [
    {
      id: "AMB-01",
      plateNumber: "WB-01-EA-1081",
      type: "Advanced Life Support (ALS)",
      hospitalId: "HOSP-01",
      hospitalName: "SSKM Hospital & IPGMER Apex Trauma Center",
      baseStation: "West Station (Rabindra Sadan / Zeerut Bridge)",
      direction: "West",
      driverName: "Subhash Mukherjee",
      driverPhone: "+91 98301 12233",
      paramedicName: "S. Ramanathan (Paramedic-I)",
      lat: 22.5385,
      lng: 88.3370,
      status: "Assigned", // Available, Assigned, En Route, Arrived, Transporting, Completed
      equipment: {
        oxygenCylinder: true,
        ventilator: true,
        defibrillator: true,
        stretcher: true,
        firstAidKit: true,
        traumaKit: true,
        suctionUnit: true,
        cardiacMonitor: true,
        emergencyMeds: true
      },
      speedKmh: 54,
      heading: 90
    },
    {
      id: "AMB-02",
      plateNumber: "WB-02-EA-2044",
      type: "Basic Life Support (BLS)",
      hospitalId: "HOSP-01",
      hospitalName: "SSKM Hospital & IPGMER Apex Trauma Center",
      baseStation: "North Station (Park Street / Chowringhee Corridor)",
      direction: "North",
      driverName: "Mohd. Aslam",
      driverPhone: "+91 98312 34567",
      paramedicName: "Neha Kumari (EMT)",
      lat: 22.5535,
      lng: 88.3510,
      status: "Assigned",
      equipment: {
        oxygenCylinder: true,
        ventilator: false,
        defibrillator: true,
        stretcher: true,
        firstAidKit: true,
        traumaKit: true,
        suctionUnit: true,
        cardiacMonitor: false,
        emergencyMeds: true
      },
      speedKmh: 48,
      heading: 180
    },
    {
      id: "AMB-03",
      plateNumber: "WB-03-GC-9901",
      type: "Digital Green Corridor Organ / Super-Critical Transport",
      hospitalId: "HOSP-04",
      hospitalName: "Institute of Neurosciences Kolkata (I-NK)",
      baseStation: "Park Circus Station (Maa Flyover 7-Point)",
      direction: "Park Circus",
      driverName: "Gurpreet Singh",
      driverPhone: "+91 98300 88776",
      paramedicName: "Dr. K. Nair (Transplant Escort)",
      lat: 22.5440,
      lng: 88.3715,
      status: "Assigned",
      equipment: {
        organPreservationChamber: true,
        cryogenicTemperatureTelemetry: true,
        oxygenCylinder: true,
        ventilator: true,
        defibrillator: true,
        stretcher: true,
        firstAidKit: true,
        traumaKit: true,
        cardiacMonitor: true,
        emergencyMeds: true
      },
      speedKmh: 52,
      heading: 270
    },
    {
      id: "AMB-04",
      plateNumber: "WB-04-EA-4050",
      type: "Neonatal & Pediatric Intensive Care Unit (NICU)",
      hospitalId: "HOSP-03",
      hospitalName: "Calcutta National Medical College & Hospital",
      baseStation: "South Station (Hazra Road / Ashutosh Mukherjee Radial)",
      direction: "South",
      driverName: "Deepak Joshi",
      driverPhone: "+91 98310 55443",
      paramedicName: "Sister Mary Varghese",
      lat: 22.5230,
      lng: 88.3465,
      status: "Available",
      equipment: {
        incubator: true,
        neonatalVentilator: true,
        oxygenCylinder: true,
        defibrillator: true,
        stretcher: true,
        firstAidKit: true,
        emergencyMeds: true
      },
      speedKmh: 0,
      heading: 360
    },
    {
      id: "AMB-05",
      plateNumber: "WB-05-EA-5512",
      type: "Advanced Life Support (ALS) Trauma Interceptor",
      hospitalId: "HOSP-02",
      hospitalName: "Apollo Multispeciality Hospitals Kolkata",
      baseStation: "North-West Station (Strand Road / Fort William Base)",
      direction: "North-West",
      driverName: "Ramesh Chand",
      driverPhone: "+91 98312 33445",
      paramedicName: "Anil Sharma (Critical Care Paramedic)",
      lat: 22.5550,
      lng: 88.3370,
      status: "Available",
      equipment: {
        oxygenCylinder: true,
        ventilator: true,
        defibrillator: true,
        stretcher: true,
        firstAidKit: true,
        traumaKit: true,
        suctionUnit: true,
        cardiacMonitor: true,
        emergencyMeds: true
      },
      speedKmh: 0,
      heading: 135
    }
  ],

  doctors: [
    {
      id: "DOC-01",
      name: "Dr. Ananya Sen",
      gender: "Female",
      age: 41,
      qualifications: "MBBS, MS (General Surgery), FACS (Trauma)",
      registrationNumber: "DMC-48291 / MCI-2007",
      specialization: "Trauma & Emergency Surgery",
      surgicalExperience: "14+ years (1,800+ emergency & polytrauma interventions)",
      hospitalId: "HOSP-02",
      hospitalName: "Apollo Emergency & Critical Care",
      availability: "On Duty - ER Bay 1",
      professionalContact: "+91 11 2692 5858 (Ext. 401)",
      distanceKm: 2.4
    },
    {
      id: "DOC-02",
      name: "Dr. Arvind Mehta",
      gender: "Male",
      age: 49,
      qualifications: "MBBS, MD (Medicine), DM (Cardiology)",
      registrationNumber: "DMC-31902 / MCI-1999",
      specialization: "Cardiovascular Critical Care & Resuscitation",
      surgicalExperience: "19+ years (Emergency Angioplasty & ECMO management)",
      hospitalId: "HOSP-01",
      hospitalName: "City Trauma & Super Specialty Hospital",
      availability: "On Duty - Resuscitation Bay",
      professionalContact: "+91 11 2659 8700 (Ext. 204)",
      distanceKm: 3.8
    },
    {
      id: "DOC-03",
      name: "Dr. Preeti Deshmukh",
      gender: "Female",
      age: 38,
      qualifications: "MBBS, MD (Emergency Medicine), MRCEM (UK)",
      registrationNumber: "DMC-55120 / MCI-2011",
      specialization: "Disaster Medicine & Polytrauma Triage",
      surgicalExperience: "10+ years (Disaster Response, Airway & Thoracostomy)",
      hospitalId: "HOSP-04",
      hospitalName: "National Institute of Emergency Medicine",
      availability: "On Duty - Triage Red Bay",
      professionalContact: "+91 11 2616 5060 (Ext. 105)",
      distanceKm: 4.5
    },
    {
      id: "DOC-04",
      name: "Dr. Rajeshwar Iyer",
      gender: "Male",
      age: 45,
      qualifications: "MBBS, MCh (Neurosurgery)",
      registrationNumber: "DMC-42119 / MCI-2004",
      specialization: "Neurotrauma & Critical Brain Resuscitation",
      surgicalExperience: "16+ years (Emergency craniotomy, ICP management)",
      hospitalId: "HOSP-03",
      hospitalName: "Max Healthcare Trauma Pavilion",
      availability: "On Duty - Neuro-Trauma Suite",
      professionalContact: "+91 11 2651 5050 (Ext. 312)",
      distanceKm: 3.1
    },
    {
      id: "DOC-05",
      name: "Dr. Sunita Kulkarni",
      gender: "Female",
      age: 43,
      qualifications: "MBBS, MD (Pediatrics), Fellowship Pediatric Critical Care",
      registrationNumber: "DMC-39088 / MCI-2005",
      specialization: "Pediatric Emergency & Neonatal Trauma",
      surgicalExperience: "15+ years (Pediatric airway, shock resuscitation)",
      hospitalId: "HOSP-02",
      hospitalName: "Apollo Emergency & Critical Care",
      availability: "On Duty - Pediatric ER",
      professionalContact: "+91 11 2692 5858 (Ext. 415)",
      distanceKm: 2.7
    }
  ],

  patients: [
    {
      id: "PAT-01",
      name: "Rahul Verma",
      age: 34,
      gender: "Male",
      phone: "+91 98765 43210",
      address: "B-42, South Extension Part II, New Delhi",
      bloodGroup: "B+",
      emergencyContact: "Priya Verma (Wife) - +91 98765 43211",
      medicalHistory: "Childhood bronchial asthma, mild seasonal rhinitis",
      allergies: "Penicillin (Severe anaphylactic reaction), NSAIDs (Mild rash)",
      existingConditions: "Bronchial Asthma (Intermittent)",
      currentMedications: "Salbutamol Inhaler (PRN), Montelukast 10mg OD",
      consentGranted: true
    },
    {
      id: "PAT-02",
      name: "Sunita Sharma",
      age: 58,
      gender: "Female",
      phone: "+91 98311 22334",
      address: "Block B, Lake Gardens, South Kolkata",
      bloodGroup: "O+",
      emergencyContact: "Amit Sharma (Son) - +91 98311 22335",
      medicalHistory: "Diagnosed with hypertension 8 years ago, Type 2 diabetes 5 years ago",
      allergies: "Sulfa antibiotics (Urticaria)",
      existingConditions: "Type 2 Diabetes Mellitus, Essential Hypertension",
      currentMedications: "Metformin 500mg BD, Amlodipine 5mg OD, Telmisartan 40mg OD",
      consentGranted: true
    },
    {
      id: "PAT-03",
      name: "Harish Patel",
      age: 46,
      gender: "Male",
      phone: "+91 98334 56789",
      address: "Flat 4B, Camac Street, Kolkata",
      bloodGroup: "A+",
      emergencyContact: "Meena Patel (Wife) - +91 98334 56780",
      medicalHistory: "Coronary artery disease (stented 2023), Hyperlipidemia",
      allergies: "Aspirin (Gastric bleeding tendency)",
      existingConditions: "Ischemic Heart Disease, Dyslipidemia",
      currentMedications: "Clopidogrel 75mg OD, Atorvastatin 40mg HS, Metoprolol 25mg BD",
      consentGranted: false
    },
    {
      id: "PAT-04",
      name: "Fatima Khan",
      age: 27,
      gender: "Female",
      phone: "+91 98380 12345",
      address: "7, Shakespeare Sarani, Kolkata",
      bloodGroup: "AB+",
      emergencyContact: "Zafar Khan (Brother) - +91 98380 12346",
      medicalHistory: "No chronic illnesses, occasional migraine",
      allergies: "No known drug allergies (NKDA)",
      existingConditions: "None",
      currentMedications: "Sumatriptan 50mg PRN for acute migraine",
      consentGranted: true
    },
    {
      id: "PAT-05",
      name: "Baljeet Kaur",
      age: 63,
      gender: "Female",
      phone: "+91 98301 99887",
      address: "22, Southern Avenue, Kolkata",
      bloodGroup: "O-",
      emergencyContact: "Simran Kaur (Daughter) - +91 98301 99888",
      medicalHistory: "Chronic Kidney Disease Stage 3, Osteoporosis",
      allergies: "Iodinated Radiocontrast Media (Anaphylactoid), Morphine",
      existingConditions: "CKD Stage 3, Hypertension, Osteoporosis",
      currentMedications: "Torsemide 10mg OD, Calcium + Vit D3, Clonidine 0.1mg OD",
      consentGranted: true
    }
  ],

  activeEmergencies: [
    {
      id: "EMG-8821",
      patientId: "PAT-05",
      patientName: "Baljeet Kaur",
      patientAge: 63,
      patientGender: "Female",
      patientBloodGroup: "O-",
      emergencyType: "Accident",
      severity: "Critical", // Critical, High, Moderate, Low
      triageScore: {
        consciousness: "Voice Responsive",
        abilityToWalk: "No (Severe leg trauma)",
        breathing: "Rapid / Labored (28 bpm)",
        heartRate: 118,
        bloodPressure: "95/60 mmHg",
        oxygenSaturation: "91%",
        temperature: "36.8 °C",
        vitalsSummary: "Tachycardic, borderline hypotensive, hypoxemic"
      },
      location: {
        address: "AJC Bose Road Flyover near Exide Crossing, Kolkata",
        lat: 22.5415,
        lng: 88.3485
      },
      status: "En Route", // Requested, Assigned, En Route, Arrived, Transporting, Completed
      assignedAmbulanceId: "AMB-01",
      assignedAmbulanceIds: ["AMB-01", "AMB-02", "AMB-03"],
      destinationHospitalId: "HOSP-01",
      requiredEquipment: ["Advanced Trauma Kit", "Ventilator", "Oxygen Cylinder", "Spinal Board"],
      numberOfAmbulances: 3,
      sosPressed: false,
      assessmentCompleted: false,
      greenCorridorActive: false,
      trafficPreemptionStatus: "Standard Routing (Traffic Police Permission Required)",
      trafficPolicePermission: "REQUIRED",
      trafficPoliceRequired: true,
      trafficPoliceStatus: "Traffic Police Permission Required - Route Remains BLUE",
      etaMinutes: 4,
      distanceKm: 1.3,
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      medicalNotes: [
        {
          id: "NOTE-1",
          author: "Dr. Ananya Sen",
          time: "10 mins ago",
          note: "Triage Alert acknowledged. Preparing Red Trauma Bay 1 at SSKM. Blood Bank alerted for 2 units B+ PRBC standby."
        }
      ]
    },
    {
      id: "EMG-8822",
      patientId: "PAT-03",
      patientName: "Harish Patel",
      patientAge: 46,
      patientGender: "Male",
      patientBloodGroup: "A+",
      emergencyType: "Heart emergency",
      severity: "Critical",
      triageScore: {
        consciousness: "Alert",
        abilityToWalk: "No (Severe chest tightness)",
        breathing: "Dyspneic (22 bpm)",
        heartRate: 104,
        bloodPressure: "145/95 mmHg",
        oxygenSaturation: "94%",
        temperature: "37.1 °C",
        vitalsSummary: "Acute coronary syndrome suspected, ST changes reported by EMT"
      },
      location: {
        address: "Park Street Crossing, Kolkata",
        lat: 22.5510,
        lng: 88.3525
      },
      status: "En Route",
      assignedAmbulanceId: "AMB-05",
      destinationHospitalId: "HOSP-01",
      requiredEquipment: ["Cardiac Monitor", "Defibrillator", "Oxygen Cylinder"],
      numberOfAmbulances: 1,
      greenCorridorActive: false,
      trafficPreemptionStatus: "Standard Priority Routing",
      etaMinutes: 6,
      distanceKm: 2.1,
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      medicalNotes: []
    }
  ],

  organTransports: [
    {
      id: "GC-2026-09",
      organType: "Heart (Donor: 24M, Brainstem Death)",
      donorHospitalId: "HOSP-04",
      donorHospitalName: "Institute of Neurosciences Kolkata (I-NK)",
      donorLocation: { lat: 22.5430, lng: 88.3640 },
      recipientHospitalId: "HOSP-02",
      recipientHospitalName: "Apollo Multispeciality Hospitals Kolkata",
      recipientLocation: { lat: 22.5744, lng: 88.4038 },
      ambulanceId: "AMB-03",
      assignedVehicle: "WB-03-GC-9901 (Rapid Organ Escort)",
      medicalEscort: "Dr. K. Nair (NOTTO Transplant Surgeon)",
      status: "Corridor Active - In Transit", // Scheduled, Corridor Active - In Transit, Organ Received, Organ At Risk, Aborted
      priorityLevel: "Highest Priority (Level-1 National Green Corridor)",
      coldIschemiaTimeMaxHours: 4.0,
      ischemiaElapsedMinutes: 48,
      organPreservationTemp: "4.1 °C (Optimal)",
      routeDistanceKm: 7.2,
      etaMinutes: 11,
      trafficSignalsPreempted: 8,
      checkpointsCleared: 5,
      totalCheckpoints: 8,
      organConditionNotes: "Myocardial preservation solution circulating; ice slush intact; temperature telemetry steady at 4.1°C.",
      lastUpdated: new Date().toISOString()
    }
  ],

  trafficSignals: [
    { id: "SIG-01", name: "Exide Crossing (AJC Bose & Chowringhee)", lat: 22.5415, lng: 88.3485, state: "GREEN", preemptionCountdown: 45 },
    { id: "SIG-02", name: "Park Circus 7-Point Junction", lat: 22.5435, lng: 88.3660, state: "GREEN", preemptionCountdown: 62 },
    { id: "SIG-03", name: "Rabindra Sadan - Cathedral Road Crossing", lat: 22.5400, lng: 88.3440, state: "GREEN", preemptionCountdown: 85 },
    { id: "SIG-04", name: "Beckbagan - Maa Flyover Entry", lat: 22.5395, lng: 88.3610, state: "GREEN", preemptionCountdown: 120 }
  ],

  auditLogs: [
    {
      id: "LOG-101",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      actorId: "PAT-01",
      actorRole: "Patient",
      action: "SOS_TRIGGERED",
      details: "SOS event triggered at AJC Bose Road Flyover near Exide Crossing, Kolkata. GPS pinpointed with accuracy 6m."
    },
    {
      id: "LOG-102",
      timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
      actorId: "SYS-DISPATCH",
      actorRole: "Control Room / Smart Match",
      action: "AMBULANCE_ASSIGNED",
      details: "Assigned AMB-01 (ALS) to EMG-8821 based on proximity (1.3 km) and equipment compatibility."
    },
    {
      id: "LOG-103",
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      actorId: "DOC-01",
      actorRole: "Doctor",
      action: "EMERGENCY_MEDICAL_RECORD_ACCESSED",
      details: "Dr. Ananya Sen accessed medical history under Emergency Break-Glass authorization."
    },
    {
      id: "LOG-104",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      actorId: "CTL-01",
      actorRole: "Control Room Operator",
      action: "GREEN_CORRIDOR_ACTIVATED",
      details: "Preemption protocol activated for Route 4A (AJC Bose Road Corridor). 4 Traffic signals synchronized to GREEN."
    }
  ]
};
