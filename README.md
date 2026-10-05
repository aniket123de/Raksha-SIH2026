# EmergencyLink - Disaster & Emergency Management Platform

> **Main Goal**: Reduce the critical delay between a medical emergency and treatment by seamlessly interconnecting patients, hospitals, doctors, ambulances, and emergency control rooms in a unified, high-speed response network.

---

## 🚑 Project Overview

**EmergencyLink** is a modern, responsive, full-stack disaster and emergency management application built for smart cities and disaster response teams. It features four specialized operational portals, an integrated central command room, real-time GIS mapping, AI medical prescription simplification, and a simulated **Digital Green Corridor** for organ transplants and critical polytrauma care.

---

## 🌟 Key Features Across Four Portals

### 1. Patient Portal
- **One-Tap Emergency SOS**: Immediate emergency broadcast with quick confirmation and live GPS coordinate capture.
- **Accident & Disaster Types**: Categorization for highway accidents, cardiac arrest, fires, floods, earthquakes, breathing difficulties, and severe trauma.
- **Quick Emergency Assessment (Triage Support)**: Records consciousness, mobility, respiratory status, pulse, blood pressure, and SpO2, dynamically computing emergency severity (Critical, High, Moderate, Low).
- **Live Ambulance Tracking**: Interactive Leaflet map displaying real-time vehicle movement, destination hospital, remaining distance, and ETA.
- **Hospital Directory & Resource Monitor**: Live view of general beds, ICU beds, oxygen reserves, blood bank inventory by group, and ventilators.
- **On-Duty Doctor Directory**: Credentials, surgical experience, registration numbers, and emergency hospital contact.
- **Multilingual AI Prescription Simplifier**: Translates complex prescriptions and discharge summaries into plain language in **English, Hindi (हिंदी), Bengali (বাংলা), Marathi (मराठी), and Tamil (தமிழ்)** with mandatory medical disclaimers.

### 2. Doctor Portal
- **Emergency Patient Alerts**: Real-time incoming trauma alerts with triage severity indicators and ambulance ETAs.
- **Emergency Break-Glass Access Gate**: Simulates patient consent and emergency medical override access with tamper-evident audit logging.
- **Clinical Orders & Digital Prescriptions**: Doctors can issue immediate trauma bay preparation orders and digital prescriptions.
- **AI Clinical Summary**: Rapidly summarizes patient allergies, chronic conditions, and contraindications.

### 3. Ambulance Portal
- **Turn-by-Turn Navigation**: Real-time routing from ambulance base to patient pickup, and to the nearest equipped trauma hospital.
- **Pre-Trip Equipment Checklist**: Digital verification for oxygen cylinders, ventilators, defibrillators, trauma kits, and suction units.
- **Digital Green Corridor (Organ Transport)**: Dedicated workflow for authorized transplant logistics, featuring cold ischemia timers, temperature telemetry, "Organ at Risk" alerts, and "Organ Received" handover confirmations.
- **Ambulance Crew Safety SOS**: Direct distress radio link connecting ambulance crew to central dispatch.

### 4. Hospital & Control Room Portals
- **Hospital Resource Management**: Real-time sliders and counters to update ICU beds, general beds, oxygen availability, and blood bank units.
- **Patient Arrival Management**: Live incoming ambulance countdowns and trauma bay preparation checklists.
- **Central Control Room Master Map**: City-wide monitoring of all active emergencies, ambulance units, and hospital capacities.
- **Smart Traffic Signal Preemption**: Simulates urban traffic signals preemptively switching to GREEN along active ambulance routes.

---

## 🎯 12-Step SIH Demo Walkthrough Simulation

Evaluators and judges can trigger the complete end-to-end emergency response lifecycle using the **"SIH Demo Walkthrough"** button in the top navigation:
1. Patient presses SOS
2. Emergency type selected (Accident / Cardiac)
3. GPS location pinpointed
4. Triage severity recorded (Critical)
5. Smart matching identifies best ALS ambulance
6. Ambulance assigned & driver alerted
7. Destination hospital selected (ICU capacity checked)
8. Hospital alerted & trauma bay prepared
9. Ambulance en route with Green Corridor activated
10. Control room monitors green traffic signals
11. Patient tracks ambulance in real time
12. Hospital confirms patient arrival & handover complete!

---

## 💻 Running the Application Locally

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Run the Frontend Development Server (Vite)
npm run dev

# 3. Open in browser:
# http://localhost:3000

# 4. Optional: Run the Express REST API backend
npm run server
```

---

## 🔒 Security, Privacy & Academic Disclaimer

- **Role-Based Access Control (RBAC)**: Distinct permissions for Patients, Doctors, Ambulance Crew, and Hospital Administrators.
- **Audit Logs**: Tamper-evident logging of every medical record access, resource update, and SOS dispatch.
- **Compliance Disclaimer**: *EmergencyLink is an academic and Smart India Hackathon (SIH) prototype designed for decision support and emergency coordination simulation. It does not replace qualified medical practitioners or government emergency command centers (Dial 112 / 108).*
