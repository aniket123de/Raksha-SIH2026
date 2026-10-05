import React, { useState } from 'react';
import { EmergencyProvider, useEmergency } from './context/EmergencyContext';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { PortalHeader } from './components/PortalHeader';
import { ProfileModal } from './components/ProfileModal';
import { NotificationCenter } from './components/NotificationCenter';
import { PatientPortal } from './portals/PatientPortal';
import { DoctorPortal } from './portals/DoctorPortal';
import { AmbulancePortal } from './portals/AmbulancePortal';
import { ParamedicPortal } from './portals/ParamedicPortal';
import { HospitalPortal } from './portals/HospitalPortal';
import { ControlRoomPortal } from './portals/ControlRoomPortal';
import { PortalSidebar } from './components/PortalSidebar';
import { Phone, Shield, ShieldAlert } from 'lucide-react';

import { MedicalQrModal } from './components/MedicalQrModal';
import { DigitalTwinModal } from './components/DigitalTwinModal';
import { OfflineSmsBanner } from './components/OfflineSmsBanner';
import { OfflineEmergencyTerminal } from './components/OfflineEmergencyTerminal';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppContent = () => {
  const {
    currentUser,
    currentRole,
    portalTab,
    setPortalTab,
    networkMode,
    isMedicalQrModalOpen,
    setIsMedicalQrModalOpen,
    medicalQrPatient,
    patients,
    isDigitalTwinModalOpen,
    setIsDigitalTwinModalOpen,
    digitalTwinTarget
  } = useEmergency();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // If user is unauthenticated, display Landing Page with the 5 Vertical Portal Cards & Login Modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-red-500 selection:text-white">
        <DisclaimerBanner />
        <LandingPage />
        <LoginModal />
        <MedicalQrModal
          isOpen={isMedicalQrModalOpen}
          onClose={() => setIsMedicalQrModalOpen(false)}
          patient={medicalQrPatient}
          allPatients={patients}
        />
        <DigitalTwinModal
          isOpen={isDigitalTwinModalOpen}
          onClose={() => setIsDigitalTwinModalOpen(false)}
          patientOrEmergency={digitalTwinTarget}
        />
      </div>
    );
  }

  // Once authenticated: Render dedicated VERTICAL PORTAL LAYOUT!
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-red-500 selection:text-white">
      
      {/* 1. DISCLAIMER BANNER */}
      <DisclaimerBanner />

      {/* 2. VERTICAL PORTAL CONTAINER (Vertical Sidebar on Left, Portal Workspace on Right) */}
      <div className="flex-1 flex w-full min-h-0">
        
        {/* Dedicated Vertical Portal Navigation Sidebar */}
        <PortalSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenNotifications={() => setIsNotifOpen(true)}
        />

        {/* Portal Body (Header + Main Workspace + Footer) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          <PortalHeader
            onOpenNotifications={() => setIsNotifOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* EXCLUSIVE ROLE DASHBOARD CONTAINER (Occupies full available screen) */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ErrorBoundary>
              {/* GLOBAL REAL-TIME OFFLINE HUD BANNER (Accessible across all portals) */}
              {portalTab !== 'Offline' && (
                <div className="mb-6">
                  <OfflineSmsBanner onOpenTerminal={() => setPortalTab('Offline')} />
                </div>
              )}

              {portalTab === 'Offline' ? (
                <OfflineEmergencyTerminal />
              ) : (
                <>
                  {currentRole === 'patient' && <PatientPortal />}
                  {currentRole === 'doctor' && <DoctorPortal />}
                  {currentRole === 'ambulance' && <AmbulancePortal />}
                  {currentRole === 'paramedic' && <ParamedicPortal />}
                  {currentRole === 'hospital' && <HospitalPortal />}
                  {(currentRole === 'control-room' || currentRole === 'control_room') && <ControlRoomPortal />}
                </>
              )}
            </ErrorBoundary>
          </main>

          {/* RESPONSIVE EMERGENCY HOTLINE FOOTER */}
          <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-auto text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="font-bold text-white">Raksha Network</span>
                <span>• Emergency Medical & Disaster Response System</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-red-400" /> Ambulance: <b className="text-white">108</b>
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> Police/Disaster: <b className="text-white">112</b>
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Medical Helpline: <b className="text-white">102</b>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Emergency Response System • Role-Isolated</span>
              </div>
            </div>
          </footer>

        </div>

      </div>

      {/* 4. MODALS & DRAWERS */}
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <ProfileModal />
      <LoginModal />
      <MedicalQrModal
        isOpen={isMedicalQrModalOpen}
        onClose={() => setIsMedicalQrModalOpen(false)}
        patient={medicalQrPatient}
        allPatients={patients}
      />
      <DigitalTwinModal
        isOpen={isDigitalTwinModalOpen}
        onClose={() => setIsDigitalTwinModalOpen(false)}
        patientOrEmergency={digitalTwinTarget}
      />

    </div>
  );
};

export default function App() {
  return (
    <EmergencyProvider>
      <AppContent />
    </EmergencyProvider>
  );
}
