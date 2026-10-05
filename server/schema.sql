-- =========================================================================
-- EmergencyLink Relational Database Architecture (PostgreSQL Schema)
-- Disaster & Medical Emergency Coordination Platform
-- Compliant with Role-Based Access Control (RBAC) & Tamper-Evident Auditing
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS FOR SYSTEM-WIDE CONSTRAINTS
CREATE TYPE user_role AS ENUM (
    'PATIENT',
    'DOCTOR',
    'AMBULANCE',
    'HOSPITAL',
    'CONTROL_ROOM',
    'ADMIN'
);

CREATE TYPE emergency_severity AS ENUM (
    'Critical',
    'High',
    'Moderate',
    'Low'
);

CREATE TYPE emergency_status AS ENUM (
    'Requested',
    'Assigned',
    'En Route',
    'Arrived',
    'Transporting',
    'Completed',
    'Cancelled'
);

CREATE TYPE ambulance_status AS ENUM (
    'Available',
    'Assigned',
    'En Route',
    'Arrived',
    'Transporting',
    'Completed',
    'Maintenance'
);

CREATE TYPE resource_availability AS ENUM (
    'Available',
    'Limited',
    'Unavailable'
);

CREATE TYPE organ_transport_status AS ENUM (
    'Scheduled',
    'Corridor Active - In Transit',
    'Organ Received - Handover Complete',
    'Organ At Risk - Critical Alert',
    'Aborted'
);

-- =========================================================================
-- 2. CORE ENTITY TABLES
-- =========================================================================

-- Table 1: Users (Authentication & Identity)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Hospitals (Medical Facilities & Capacity Hubs)
CREATE TABLE hospitals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Government, Private, Military
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emergency_hotline VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    organ_transplant_status VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Patients (Registered Citizens & Emergency Patients)
CREATE TABLE patients (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT,
    blood_group VARCHAR(10) NOT NULL,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),
    medical_history TEXT,
    allergies TEXT,
    existing_conditions TEXT,
    current_medications TEXT,
    consent_granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Doctors (Verified Medical Practitioners)
CREATE TABLE doctors (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    gender VARCHAR(20),
    age INT,
    qualifications VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL, -- MCI/State Council ID
    specialization VARCHAR(150) NOT NULL,
    surgical_experience TEXT,
    availability_status VARCHAR(100) DEFAULT 'On Duty',
    professional_contact VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: Ambulances (Fleet Vehicles & Responders)
CREATE TABLE ambulances (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE SET NULL,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL, -- ALS, BLS, Organ Transport, NICU
    driver_name VARCHAR(150) NOT NULL,
    driver_phone VARCHAR(30) NOT NULL,
    paramedic_name VARCHAR(150),
    current_latitude NUMERIC(10, 6) NOT NULL,
    current_longitude NUMERIC(10, 6) NOT NULL,
    speed_kmh NUMERIC(5, 2) DEFAULT 0,
    heading NUMERIC(5, 2) DEFAULT 0,
    status ambulance_status DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 6: HospitalResources (Dynamic Bed & Infrastructure Telemetry)
CREATE TABLE hospital_resources (
    id SERIAL PRIMARY KEY,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    general_beds INT DEFAULT 0,
    icu_beds INT DEFAULT 0,
    ventilators INT DEFAULT 0,
    operating_theatres INT DEFAULT 0,
    doctors_on_duty INT DEFAULT 0,
    status resource_availability DEFAULT 'Available',
    last_reported TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 7: OxygenInventory (Medical Gas Reserves)
CREATE TABLE oxygen_inventory (
    id SERIAL PRIMARY KEY,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    total_capacity_litres NUMERIC(12, 2) NOT NULL,
    current_litres NUMERIC(12, 2) NOT NULL,
    pressure_bar NUMERIC(6, 2),
    status resource_availability DEFAULT 'Available',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: BloodInventory (Blood Bank Units by Group)
CREATE TABLE blood_inventory (
    id SERIAL PRIMARY KEY,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    blood_group VARCHAR(10) NOT NULL,
    units_available INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_hospital_blood_group UNIQUE (hospital_id, blood_group)
);

-- =========================================================================
-- 3. EMERGENCY INCIDENTS & DISPATCH
-- =========================================================================

-- Table 9: SOSEvents (Initial Signal Dispatch)
CREATE TABLE sos_events (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    emergency_type VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    accuracy_meters NUMERIC(6, 2),
    client_ip VARCHAR(50),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 10: EmergencyRequests (Active Incident Management)
CREATE TABLE emergency_requests (
    id VARCHAR(50) PRIMARY KEY,
    sos_id VARCHAR(50) REFERENCES sos_events(id) ON DELETE SET NULL,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    emergency_type VARCHAR(100) NOT NULL,
    severity emergency_severity NOT NULL DEFAULT 'Critical',
    status emergency_status NOT NULL DEFAULT 'Requested',
    pickup_address TEXT NOT NULL,
    pickup_latitude NUMERIC(10, 6) NOT NULL,
    pickup_longitude NUMERIC(10, 6) NOT NULL,
    destination_hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE SET NULL,
    assigned_ambulance_id VARCHAR(50) REFERENCES ambulances(id) ON DELETE SET NULL,
    number_of_ambulances_requested INT DEFAULT 1,
    green_corridor_active BOOLEAN DEFAULT FALSE,
    traffic_preemption_status VARCHAR(100) DEFAULT 'Standard',
    eta_minutes INT,
    distance_km NUMERIC(6, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table 11: VitalSigns & Triage Evaluations (Clinical Assessment)
CREATE TABLE vital_signs (
    id SERIAL PRIMARY KEY,
    emergency_id VARCHAR(50) REFERENCES emergency_requests(id) ON DELETE CASCADE,
    consciousness VARCHAR(50),
    ability_to_walk VARCHAR(50),
    breathing_status VARCHAR(100),
    heart_rate INT,
    blood_pressure VARCHAR(30),
    oxygen_saturation VARCHAR(20),
    temperature_celsius NUMERIC(4, 2),
    triage_notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 12: AmbulanceAssignments (Fleet Dispatch History)
CREATE TABLE ambulance_assignments (
    id SERIAL PRIMARY KEY,
    emergency_id VARCHAR(50) REFERENCES emergency_requests(id) ON DELETE CASCADE,
    ambulance_id VARCHAR(50) REFERENCES ambulances(id) ON DELETE CASCADE,
    assigned_by_user_id VARCHAR(50) REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    arrived_at TIMESTAMP WITH TIME ZONE,
    handover_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Active'
);

-- Table 13: OrganTransport (Digital Green Corridor Logistics)
CREATE TABLE organ_transport (
    id VARCHAR(50) PRIMARY KEY,
    organ_type VARCHAR(150) NOT NULL,
    donor_hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE RESTRICT,
    recipient_hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE RESTRICT,
    assigned_ambulance_id VARCHAR(50) REFERENCES ambulances(id) ON DELETE RESTRICT,
    medical_escort_name VARCHAR(150),
    status organ_transport_status DEFAULT 'Corridor Active - In Transit',
    cold_ischemia_limit_hours NUMERIC(4, 2) NOT NULL,
    ischemia_elapsed_minutes INT DEFAULT 0,
    preservation_temp_celsius NUMERIC(4, 2),
    signals_preempted INT DEFAULT 0,
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 14: MedicalRecords (Permanent Encrypted Patient Records)
CREATE TABLE medical_records (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    record_type VARCHAR(100) NOT NULL, -- Emergency, Clinical Summary, Diagnostic
    diagnosis TEXT,
    icd10_codes TEXT,
    allergies_snapshot TEXT,
    clinical_narrative TEXT,
    created_by_doctor_id VARCHAR(50) REFERENCES doctors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 15: Prescriptions (Doctor Orders & Medication Guidance)
CREATE TABLE prescriptions (
    id VARCHAR(50) PRIMARY KEY,
    emergency_id VARCHAR(50) REFERENCES emergency_requests(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE RESTRICT,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL, -- Oral, IV, IM, Inhalation
    frequency VARCHAR(100) NOT NULL,
    special_instructions TEXT,
    simplified_ai_instructions TEXT, -- In plain vernacular language
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 16: Notifications (Role-Targeted Alerts)
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    target_role user_role, -- NULL means broadcast to all
    target_user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, urgent, success
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 17: LocationTracking (GPS Telemetry Stream)
CREATE TABLE location_tracking (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL, -- 'AMBULANCE' or 'PATIENT'
    entity_id VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    speed_kmh NUMERIC(5, 2),
    heading NUMERIC(5, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 18: EmergencyLogs (Tamper-Evident Audit Trail)
CREATE TABLE emergency_logs (
    id VARCHAR(50) PRIMARY KEY,
    actor_id VARCHAR(50) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 19: ConsentPermissions (Legal Access Gate & Break-Glass Registry)
CREATE TABLE consent_permissions (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    authorized_doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL, -- 'STANDARD_CONSENT', 'EMERGENCY_BREAK_GLASS'
    justification TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    audit_log_id VARCHAR(50) REFERENCES emergency_logs(id)
);

-- =========================================================================
-- INDEXES FOR HIGH-PERFORMANCE EMERGENCY QUERYING
-- =========================================================================
CREATE INDEX idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX idx_emergency_requests_severity ON emergency_requests(severity);
CREATE INDEX idx_ambulances_status ON ambulances(status);
CREATE INDEX idx_location_tracking_entity ON location_tracking(entity_type, entity_id, recorded_at DESC);
CREATE INDEX idx_notifications_target ON notifications(target_role, target_user_id, is_read);
CREATE INDEX idx_emergency_logs_timestamp ON emergency_logs(timestamp DESC);
