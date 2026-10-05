import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Heart,
  Activity,
  Ambulance,
  Navigation,
  ExternalLink,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Layers,
  Sparkles,
  Phone,
  Eye,
  EyeOff,
  Building2,
  ChevronRight,
  Maximize2,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEmergency } from '../context/EmergencyContext';
import { getGoogleMapsRouteEmbedUrl, navigateInGoogleMapsApp, openInGoogleMapsApp } from '../utils/googleMaps';

/**
 * Large Green Transplant Icon & Digital Green Corridor Organ Logistics Map
 * Synchronized across Ambulance Portal and Hospital Portal.
 */
export const DigitalGreenCorridorMap = ({ isHospitalView = false }) => {
  const {
    organCorridorState,
    dispatchOrganCorridor,
    toggleOrganCorridorMap,
    setOrganCorridorAmbulanceCount,
    setSelectedCorridorAmbulance,
    ambulances = [],
    hospitals = [],
    trafficSignals = [],
    addNotification
  } = useEmergency();

  const [mapDisplayMode, setMapDisplayMode] = useState('google'); // 'google' | 'gis'

  const isDispatched = Boolean(organCorridorState?.isDispatched ?? organCorridorState?.isMapGenerated);
  const isMapGenerated = isDispatched;
  const ambulanceCount = organCorridorState?.numberOfAmbulances || 1;

  // Donor and Recipient details
  const donorHosp = useMemo(() => {
    return hospitals.find(h => h.id === 'HOSP-04') || {
      id: 'HOSP-04',
      name: 'Institute of Neurosciences Kolkata (I-NK)',
      lat: 22.5430,
      lng: 88.3640,
      address: '185/1, AJC Bose Road, Park Circus, Kolkata'
    };
  }, [hospitals]);

  const recipientHosp = useMemo(() => {
    return hospitals.find(h => h.id === 'HOSP-02') || {
      id: 'HOSP-02',
      name: 'Apollo Multispeciality Hospitals Kolkata',
      lat: 22.5744,
      lng: 88.4038,
      address: '58, Canal Circular Road, Kadapara, Phool Bagan, Kolkata'
    };
  }, [hospitals]);

  // Route coordinates: Donor Hospital (I-NK) ➔ Beckbagan ➔ Park Circus ➔ Maa Flyover ➔ EM Bypass ➔ Apollo Hospital
  const routeCoords = useMemo(() => [
    [donorHosp.lat, donorHosp.lng],
    [22.5410, 88.3580], // Beckbagan
    [22.5435, 88.3660], // Park Circus
    [22.5445, 88.3740], // Maa Flyover Ramp
    [22.5480, 88.3880], // EM Bypass Junction
    [22.5560, 88.3970], // Science City Radial
    [22.5650, 88.4010], // Kadapara Connector
    [recipientHosp.lat, recipientHosp.lng] // Apollo Hospital
  ], [donorHosp, recipientHosp]);

  // Ambulances pool for organ convoy with distinct live geographical locations along corridor
  const convoyAmbulanceConfigs = useMemo(() => {
    const defaultList = [
      {
        id: 'AMB-03',
        plateNumber: 'WB-03-GC-9901',
        callSign: 'Lead Organ Escort (NOTTO Unit 1)',
        type: 'Digital Green Corridor Organ / Super-Critical Transport',
        driverName: 'Gurpreet Singh',
        driverPhone: '+91 98300 88776',
        escortName: 'Dr. K. Nair (NOTTO Transplant Surgeon)',
        roleTag: 'PRIMARY ORGAN TRANSPORTER',
        color: '#10b981',
        speedKmh: 68,
        progressOffset: 0.60,
        currentLocationName: 'Maa Flyover Mid-Span (Science City Radial)',
        landmark: 'Science City Eastbound Overpass',
        distanceKm: 3.2,
        etaMinutes: 5
      },
      {
        id: 'AMB-01',
        plateNumber: 'WB-01-EA-1081',
        callSign: 'Advance Police Interceptor (Lead Scout)',
        type: 'Advanced Life Support (ALS) Trauma Interceptor',
        driverName: 'Mohd. Aslam',
        driverPhone: '+91 98312 34567',
        escortName: 'Insp. R. Banerjee (Traffic Green Wave Lead)',
        roleTag: 'CONVOY ADVANCE CLEARING',
        color: '#06b6d4',
        speedKmh: 72,
        progressOffset: 0.84,
        currentLocationName: 'Kadapara Connector & EM Bypass',
        landmark: 'Phoolbagan Junction (1.1 km to Apollo OT)',
        distanceKm: 1.1,
        etaMinutes: 2
      },
      {
        id: 'AMB-02',
        plateNumber: 'WB-02-EA-2044',
        callSign: 'Secondary Support & Resuscitation Escort',
        type: 'Basic Life Support (BLS)',
        driverName: 'Amitava Ghosh',
        driverPhone: '+91 98312 88990',
        escortName: 'Sister Neha Kumari (Transplant Perfusionist)',
        roleTag: 'BACKUP PERFUSION SUPPORT',
        color: '#8b5cf6',
        speedKmh: 65,
        progressOffset: 0.44,
        currentLocationName: 'Park Circus 7-Point Junction Ramp',
        landmark: 'Maa Flyover Western Ascent Ramp',
        distanceKm: 4.8,
        etaMinutes: 8
      },
      {
        id: 'AMB-04',
        plateNumber: 'WB-04-EA-4050',
        callSign: 'Pediatric/Mobile ICU Tactical Escort',
        type: 'Neonatal & Mobile ICU',
        driverName: 'Deepak Joshi',
        driverPhone: '+91 98110 55442',
        escortName: 'Dr. T. Roy (Cardiac Anesthesiologist)',
        roleTag: 'SURGICAL TRAUMA ESCORT',
        color: '#f59e0b',
        speedKmh: 63,
        progressOffset: 0.24,
        currentLocationName: 'AJC Bose Road / Beckbagan Crossing',
        landmark: 'Beckbagan Overpass Intersection',
        distanceKm: 6.1,
        etaMinutes: 10
      },
      {
        id: 'AMB-05',
        plateNumber: 'WB-05-EA-5512',
        callSign: 'Rear Security & Traffic Rear-Guard',
        type: 'ALS Trauma Interceptor',
        driverName: 'Ramesh Chand',
        driverPhone: '+91 98312 33445',
        escortName: 'Sgt. M. Mukherjee (Rear Highway Patrol)',
        roleTag: 'REAR CONVOY SHIELD',
        color: '#ec4899',
        speedKmh: 66,
        progressOffset: 0.08,
        currentLocationName: 'Institute of Neurosciences Kolkata (Gates)',
        landmark: 'Donor Hospital Exit Gate on AJC Bose Road',
        distanceKm: 7.2,
        etaMinutes: 13
      }
    ];

    const totalSegs = routeCoords.length - 1;
    const listWithCoords = defaultList.map((amb) => {
      const effectiveProgress = Math.min(0.96, Math.max(0.04, amb.progressOffset));
      const segIndex = Math.min(totalSegs - 1, Math.floor(effectiveProgress * totalSegs));
      const segFraction = (effectiveProgress * totalSegs) - segIndex;
      const p1 = routeCoords[segIndex];
      const p2 = routeCoords[segIndex + 1];
      const lat = Number((p1[0] + (p2[0] - p1[0]) * segFraction).toFixed(5));
      const lng = Number((p1[1] + (p2[1] - p1[1]) * segFraction).toFixed(5));
      return {
        ...amb,
        lat,
        lng
      };
    });

    const countNum = ambulanceCount === 'Many' ? 5 : Number(ambulanceCount) || 1;
    return listWithCoords.slice(0, countNum);
  }, [ambulanceCount, routeCoords]);

  const [localSelectedAmbulanceId, setLocalSelectedAmbulanceId] = useState(
    organCorridorState?.selectedAmbulanceId || 'AMB-03'
  );

  const selectedAmbulanceId = organCorridorState?.selectedAmbulanceId || localSelectedAmbulanceId || 'AMB-03';

  // Selected ambulance details
  const selectedAmb = useMemo(() => {
    return convoyAmbulanceConfigs.find(a => a.id === selectedAmbulanceId) || convoyAmbulanceConfigs[0];
  }, [convoyAmbulanceConfigs, selectedAmbulanceId]);

  // Ensure valid selection when fleet size changes
  useEffect(() => {
    if (convoyAmbulanceConfigs.length > 0 && !convoyAmbulanceConfigs.some(a => a.id === selectedAmbulanceId)) {
      handleSelectAmbulance(convoyAmbulanceConfigs[0].id);
    }
  }, [convoyAmbulanceConfigs, selectedAmbulanceId]);

  const handleSelectAmbulance = (ambId) => {
    setLocalSelectedAmbulanceId(ambId);
    if (setSelectedCorridorAmbulance) {
      setSelectedCorridorAmbulance(ambId);
    }
  };

  const handleDispatch = (forcedState) => {
    const nextState = forcedState !== undefined ? forcedState : !isDispatched;
    if (dispatchOrganCorridor) {
      dispatchOrganCorridor(nextState);
    } else if (toggleOrganCorridorMap) {
      toggleOrganCorridorMap(nextState);
    }
    if (nextState) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  // Leaflet map reference
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const markersByIdRef = useRef({});

  // Initialize and update interactive GIS map when mode is 'gis'
  useEffect(() => {
    if (!isMapGenerated || mapDisplayMode !== 'gis' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([selectedAmb?.lat || 22.5580, selectedAmb?.lng || 88.3840], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB & OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    group.clearLayers();
    markersByIdRef.current = {};

    // Neon Green Corridor Polyline
    L.polyline(routeCoords, {
      color: '#10b981',
      weight: 8,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(group);

    // Glowing dashed center line
    L.polyline(routeCoords, {
      color: '#ecfdf5',
      weight: 3,
      opacity: 0.85,
      dashArray: '10, 10'
    }).addTo(group);

    // Donor Hospital Pin
    const donorIcon = L.divIcon({
      className: 'custom-donor-icon',
      html: `
        <div style="background:#064e3b; border:3px solid #10b981; border-radius:12px; padding:6px; color:#fff; box-shadow:0 0 16px rgba(16,185,129,0.8); display:flex; align-items:center; gap:5px; font-size:10px; font-weight:bold; white-space:nowrap;">
          <span style="font-size:14px;">🏥</span>
          <span>DONOR: ${donorHosp.name.split(' ')[0]}</span>
        </div>
      `,
      iconSize: [140, 32],
      iconAnchor: [70, 16]
    });
    L.marker([donorHosp.lat, donorHosp.lng], { icon: donorIcon }).addTo(group);

    // Recipient Hospital Pin
    const recipientIcon = L.divIcon({
      className: 'custom-recipient-icon',
      html: `
        <div style="background:#1e1b4b; border:3px solid #6366f1; border-radius:12px; padding:6px; color:#fff; box-shadow:0 0 16px rgba(99,102,241,0.8); display:flex; align-items:center; gap:5px; font-size:10px; font-weight:bold; white-space:nowrap;">
          <span style="font-size:14px;">🎯</span>
          <span>RECIPIENT OT: ${recipientHosp.name.split(' ')[0]}</span>
        </div>
      `,
      iconSize: [150, 32],
      iconAnchor: [75, 16]
    });
    L.marker([recipientHosp.lat, recipientHosp.lng], { icon: recipientIcon }).addTo(group);

    // Position each ambulance along the route with distinct location and active selection
    convoyAmbulanceConfigs.forEach((amb) => {
      const isLead = amb.id === 'AMB-03';
      const isSelected = amb.id === selectedAmb?.id;

      const ambIcon = L.divIcon({
        className: 'custom-amb-convoy-icon',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            ${isSelected ? `
              <div style="background:#047857; color:#a7f3d0; border:1.5px solid #34d399; font-size:8px; font-weight:900; padding:1px 6px; border-radius:999px; margin-bottom:2px; box-shadow:0 0 12px #10b981; text-transform:uppercase; letter-spacing:0.5px; animation:pulse 1.5s infinite;">
                📍 ACTIVE TRACKING
              </div>
            ` : ''}
            <div style="background:${isSelected ? amb.color : '#0f172a'}; border:${isSelected ? '3px solid #ffffff' : `2.5px solid ${amb.color}`}; border-radius:999px; padding:${isSelected ? '6px 10px' : '5px 8px'}; color:#fff; font-size:10px; font-weight:900; box-shadow:${isSelected ? `0 0 25px ${amb.color}, 0 0 45px rgba(255,255,255,0.8)` : `0 0 15px ${amb.color}`}; display:flex; align-items:center; gap:4px; white-space:nowrap; transform:${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition:all 0.3s ease;">
              <span>🚑</span>
              <span>${amb.plateNumber}</span>
              ${isLead ? '<span style="background:#064e3b; color:#6ee7b7; padding:1px 4px; border-radius:4px; font-size:8px;">ORGAN</span>' : ''}
            </div>
            <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid ${isSelected ? '#ffffff' : amb.color};"></div>
          </div>
        `,
        iconSize: [140, 48],
        iconAnchor: [70, 48]
      });

      const m = L.marker([amb.lat, amb.lng], { icon: ambIcon }).addTo(group);
      m.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px; line-height:1.4; min-width:210px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
            <strong style="color:${amb.color}; font-size:13px;">${amb.plateNumber}</strong>
            <span style="background:#064e3b; color:#6ee7b7; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:4px;">${amb.roleTag}</span>
          </div>
          <div><b>Live Location:</b> ${amb.currentLocationName}</div>
          <div><b>Landmark:</b> ${amb.landmark}</div>
          <div><b>Coordinates:</b> ${amb.lat}, ${amb.lng}</div>
          <div><b>Distance to Recipient OT:</b> ${amb.distanceKm} km</div>
          <div><b>Estimated Time to OT:</b> ~${amb.etaMinutes} mins</div>
          <div><b>Driver:</b> ${amb.driverName} (${amb.driverPhone})</div>
          <div><b>Medical Escort:</b> ${amb.escortName}</div>
          <div><b>Corridor Speed:</b> ${amb.speedKmh} km/h (Preempted)</div>
        </div>
      `);

      m.on('click', () => {
        handleSelectAmbulance(amb.id);
      });

      markersByIdRef.current[amb.id] = m;
    });

  }, [isMapGenerated, mapDisplayMode, convoyAmbulanceConfigs, donorHosp, recipientHosp, selectedAmb?.id, routeCoords]);

  // Fly to selected ambulance location when selection changes in GIS mode
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedAmb || mapDisplayMode !== 'gis') return;
    try {
      mapInstanceRef.current.flyTo([selectedAmb.lat, selectedAmb.lng], 14, {
        animate: true,
        duration: 0.8
      });
      const marker = markersByIdRef.current[selectedAmb.id];
      if (marker) {
        marker.openPopup();
      }
    } catch {}
  }, [selectedAmb?.id, mapDisplayMode]);

  // Google Maps driving route embed URL originating from Selected Ambulance's live location to Recipient Hospital
  const googleMapsEmbedUrl = useMemo(() => {
    const originLat = selectedAmb?.lat || donorHosp.lat;
    const originLng = selectedAmb?.lng || donorHosp.lng;
    return getGoogleMapsRouteEmbedUrl(
      originLat,
      originLng,
      recipientHosp.lat,
      recipientHosp.lng,
      14
    );
  }, [selectedAmb, recipientHosp, donorHosp]);

  const handleLaunchGoogleMapsApp = () => {
    const originLat = selectedAmb?.lat || donorHosp.lat;
    const originLng = selectedAmb?.lng || donorHosp.lng;
    navigateInGoogleMapsApp(recipientHosp.lat, recipientHosp.lng, originLat, originLng);
  };

  return (
    <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
      {/* Ambient Emerald Radiance */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION WITH LARGE GREEN TRANSPLANT ICON                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800 relative z-10">
        
        {/* Left: Transplant Emblem (Interactive Button in Ambulance, Reception Emblem in Hospital) */}
        <div className="flex items-center gap-5">
          {!isHospitalView ? (
            <button
              type="button"
              onClick={() => handleDispatch()}
              title={isDispatched ? "Digital Green Corridor Dispatched • Click to toggle Standby" : "Click Large Green Transplant Icon to Dispatch Organ Convoy"}
              className={`group relative p-1 rounded-3xl transition-all duration-300 transform active:scale-95 focus:outline-none cursor-pointer ${
                isDispatched
                  ? 'ring-4 ring-emerald-400 ring-offset-4 ring-offset-slate-900 scale-105 shadow-[0_0_35px_rgba(16,185,129,0.7)]'
                  : 'hover:scale-105 ring-2 ring-emerald-500/60 hover:ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }`}
            >
              {/* Pulsing Concentric Outer Ring */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-70 blur-md group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse" />

              {/* Main Large Green Transplant Icon Emblem */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex flex-col items-center justify-center text-white shadow-2xl border-2 border-emerald-300/60 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_70%)]" />
                <div className="relative flex items-center justify-center">
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] animate-pulse" />
                  <Activity className="w-5 h-5 text-emerald-950 absolute stroke-[3]" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-100 font-mono mt-0.5">
                  TRANSPLANT
                </span>
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
              </div>
            </button>
          ) : (
            <div
              title="Hospital Organ Reception Console • NOTTO Protocol"
              className="relative p-1 rounded-3xl ring-2 ring-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              {/* Outer Glow Ring */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 blur-md animate-pulse" />

              {/* Main Large Green Transplant Icon Emblem */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex flex-col items-center justify-center text-white shadow-2xl border-2 border-emerald-300/60 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_70%)]" />
                <div className="relative flex items-center justify-center">
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] animate-pulse" />
                  <Activity className="w-5 h-5 text-emerald-950 absolute stroke-[3]" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-100 font-mono mt-0.5">
                  TRANSPLANT
                </span>
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
              </div>
            </div>
          )}

          {/* Title & Explanatory Subtitle */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                NOTTO Level-1 Green Corridor
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border ${
                isDispatched
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isDispatched ? '🟢 Convoy Dispatched • Live Tracking Active' : 'Standby • Awaiting Convoy Dispatch'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Digital Green Corridor Organ Logistics
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {isHospitalView
                ? 'Hospital Inbound Organ Reception Console: Real-time telemetry tracking organ transit convoys approaching surgical OT with synchronized green traffic waves. Live Google Map and cold ischemia clock will display automatically once dispatched by the donor hospital / ambulance team.'
                : 'Press "Dispatch" or click the large green Transplant icon above to dispatch the organ transit convoy and display the live Google Map across both the Ambulance and Hospital portals.'}
            </p>
          </div>
        </div>

        {/* Right: Primary Dispatch Action & Google Maps Direct Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!isHospitalView ? (
            isDispatched ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDispatch(true)}
                  className="px-5 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-300"
                  title="Convoy active. Click to refresh telemetry."
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Dispatched (Convoy Active)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDispatch(false)}
                  className="p-3 bg-slate-800 hover:bg-red-950/80 hover:text-red-400 text-slate-400 border border-slate-700 hover:border-red-800 rounded-2xl transition-all cursor-pointer flex items-center justify-center"
                  title="Reset Convoy to Standby"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleDispatch(true)}
                className="px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-950/70 ring-2 ring-emerald-300 hover:scale-105 active:scale-95 animate-pulse"
                title="Click Dispatch to launch the organ convoy and view the Digital Green Corridor map in Ambulance and Hospital portals"
              >
                <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                <span>Dispatch</span>
              </button>
            )
          ) : (
            isDispatched ? (
              <div className="px-4 py-2.5 bg-emerald-950/90 border border-emerald-600 rounded-2xl text-xs font-mono font-bold text-emerald-300 flex items-center gap-2 shadow-lg shadow-emerald-950/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Convoy Inbound to Trauma OT</span>
              </div>
            ) : (
              <div className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-400 flex items-center gap-2 shadow">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Awaiting Convoy Dispatch from Donor Hospital</span>
              </div>
            )
          )}

          <button
            type="button"
            onClick={handleLaunchGoogleMapsApp}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            title="Open Turn-by-Turn GPS Navigation directly in native Google Maps"
          >
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>Open in Google Maps App</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. FLEET SCALER: 1, 2, 3, 4, OR MANY AMBULANCES CARRYING ORGAN            */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                Organ Transit Convoy Fleet Selection
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Select how many ambulances are mobilized in the Green Corridor convoy carrying and escorting the organ:
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-800/80 font-bold self-start sm:self-auto">
            {convoyAmbulanceConfigs.length} Convoy Unit{convoyAmbulanceConfigs.length > 1 ? 's' : ''} Active
          </span>
        </div>

        {/* 5-Button Selector Grid: 1, 2, 3, 4, Many */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {[
            { count: 1, label: '1 Ambulance', desc: 'Lead Organ Unit (AMB-03)' },
            { count: 2, label: '2 Ambulances', desc: 'Lead + Advance Scout' },
            { count: 3, label: '3 Ambulances', desc: 'Lead + 2 Medical Escorts' },
            { count: 4, label: '4 Ambulances', desc: 'Lead + 3 Convoy Units' },
            { count: 'Many', label: 'Many Ambulances', desc: 'Full Regional Convoy (All Units)' }
          ].map(opt => {
            const isSelected = String(ambulanceCount) === String(opt.count);
            return (
              <button
                key={opt.count}
                type="button"
                onClick={() => setOrganCorridorAmbulanceCount(opt.count)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-400 shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/50 scale-[1.02]'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                    {opt.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-400 font-mono leading-tight">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GENERATED DIGITAL GREEN CORRIDOR MAP (GOOGLE MAPS & TACTICAL GIS)       */}
      {/* ========================================================================= */}
      {isMapGenerated ? (
        <div className="space-y-4 animate-fade-in">
          
          {/* Map Header & View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Navigation className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <span>Digital Green Corridor Google Map Tracking</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    Live Transit: {donorHosp.name.split(' ')[0]} ➔ {recipientHosp.name.split(' ')[0]}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tracking {convoyAmbulanceConfigs.length} vehicle(s) carrying organ under synchronized Green Wave preemption
                </p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMapDisplayMode('google')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mapDisplayMode === 'google'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Google Map Navigation</span>
              </button>
              <button
                type="button"
                onClick={() => setMapDisplayMode('gis')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mapDisplayMode === 'gis'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Interactive GIS Route</span>
              </button>
            </div>
          </div>

          {/* Active Convoy Vehicle Selector Bar: Change ambulance to update live map location */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="text-xs font-mono text-emerald-300 font-bold uppercase flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                Select Ambulance to Track:
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
              {convoyAmbulanceConfigs.map(amb => {
                const isSelected = amb.id === selectedAmb?.id;
                return (
                  <button
                    key={amb.id}
                    type="button"
                    onClick={() => handleSelectAmbulance(amb.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg ring-2 ring-emerald-300 scale-105 font-black'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: amb.color, boxShadow: `0 0 8px ${amb.color}` }} />
                    <span>{amb.plateNumber}</span>
                    <span className="text-[10px] text-slate-300 hidden lg:inline">({amb.currentLocationName.split(' ')[0]})</span>
                    {isSelected && (
                      <span className="text-[9px] bg-black/40 text-emerald-200 px-1.5 py-0.5 rounded font-black">
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Display Container */}
          <div className="rounded-2xl overflow-hidden border border-emerald-500/50 shadow-2xl relative bg-slate-950">
            
            {/* MODE 1: GOOGLE MAPS EMBED ROUTING FROM SELECTED AMBULANCE */}
            {mapDisplayMode === 'google' && (
              <div className="relative w-full h-[470px] bg-slate-950">
                <iframe
                  key={selectedAmb?.id || 'corridor-google-map'}
                  title="Digital Green Corridor Google Map Navigation"
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full filter contrast-105"
                />

                {/* Floating Telemetry Overlay Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/95 border border-emerald-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-sm space-y-2 pointer-events-none">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                      Live Convoy Tracking
                    </span>
                    <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      ETA: ~{selectedAmb?.etaMinutes} mins ({selectedAmb?.distanceKm} km)
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: selectedAmb?.color, boxShadow: `0 0 10px ${selectedAmb?.color}` }} />
                      <span className="font-mono">{selectedAmb?.plateNumber}</span>
                      <span
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border"
                        style={{ color: selectedAmb?.color, borderColor: `${selectedAmb?.color}80`, backgroundColor: `${selectedAmb?.color}15` }}
                      >
                        {selectedAmb?.roleTag}
                      </span>
                    </div>

                    <div className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center gap-1">
                      <span>📍</span>
                      <span className="truncate">{selectedAmb?.currentLocationName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate pl-4">
                      {selectedAmb?.landmark}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>GPS: {selectedAmb?.lat}, {selectedAmb?.lng}</span>
                    <span className="text-emerald-400 font-bold">{selectedAmb?.speedKmh} km/h (Preempted)</span>
                  </div>
                </div>

                {/* Bottom Launch Button Pill */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLaunchGoogleMapsApp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/80 border border-emerald-400 flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Expand in Google Maps App</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: INTERACTIVE GIS ROUTE MAP */}
            {mapDisplayMode === 'gis' && (
              <div className="relative w-full h-[470px]">
                <div ref={mapContainerRef} className="w-full h-full z-0" />
                
                {/* Overlay Legend */}
                <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-emerald-500/60 rounded-xl p-3 shadow-xl backdrop-blur-md text-[11px] space-y-1.5 z-10 pointer-events-none max-w-sm">
                  <div className="font-bold text-white flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                      Tracking: {selectedAmb?.plateNumber}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">ETA: ~{selectedAmb?.etaMinutes}m</span>
                  </div>
                  <div className="text-slate-200">📍 {selectedAmb?.currentLocationName}</div>
                  <div className="text-slate-400 text-[10px]">📌 {selectedAmb?.landmark}</div>
                  <div className="text-emerald-400 font-mono text-[10px] pt-0.5">8 Smart Traffic Signals Preempted to GREEN</div>
                </div>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* 4. CONVOY TELEMETRY STRIP & PER-AMBULANCE CARDS                           */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Organ Type</span>
              <span className="text-sm font-black text-white mt-0.5 block truncate">
                {organCorridorState.organType || 'Heart (Donor: 24M)'}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Priority: STAT National Level-1</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Cold Ischemia Clock</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-sm font-black font-mono text-amber-400">38 mins</span>
                <span className="text-[10px] font-mono text-slate-400">Max: 4.0h</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[24%] rounded-full" />
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Preservation Chamber</span>
              <span className="text-sm font-black font-mono text-cyan-400 mt-0.5 block">
                {organCorridorState.preservationTemp || '4.1 °C (Optimal)'}
              </span>
              <span className="text-[10px] text-emerald-400">Cryogenic sensors normal</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Preempted Traffic Signals</span>
              <span className="text-sm font-black font-mono text-emerald-400 mt-0.5 block">
                8 Signals Synchronized
              </span>
              <span className="text-[10px] text-emerald-300">All signals turned GREEN</span>
            </div>
          </div>

          {/* ACTIVE AMBULANCES IN CONVOY CARDS */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
                Active Ambulances in Organ Convoy Fleet ({convoyAmbulanceConfigs.length} Vehicle{convoyAmbulanceConfigs.length > 1 ? 's' : ''}):
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                💡 Click any vehicle below to shift map focus &amp; Google Maps route origin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {convoyAmbulanceConfigs.map((amb) => {
                const isSelected = selectedAmbulanceId === amb.id;
                return (
                  <div
                    key={amb.id}
                    onClick={() => handleSelectAmbulance(amb.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden group ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-950/50 scale-[1.01]'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Active Selection Glow accent */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 animate-pulse"
                          style={{ backgroundColor: amb.color, boxShadow: `0 0 10px ${amb.color}` }}
                        />
                        <span className="font-mono text-xs font-black text-white truncate">{amb.plateNumber}</span>
                        {amb.id === 'AMB-03' && (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0">
                            ORGAN
                          </span>
                        )}
                      </div>

                      {isSelected ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-400/80 bg-emerald-500/20 text-emerald-300 flex items-center gap-1 animate-pulse shrink-0">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>TRACKING ON MAP</span>
                        </span>
                      ) : (
                        <span
                          className="text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0"
                          style={{ color: amb.color, borderColor: `${amb.color}80`, backgroundColor: `${amb.color}15` }}
                        >
                          {amb.roleTag}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-200 font-bold truncate">
                      {amb.callSign}
                    </div>

                    {/* Real-time Location Milestone & GPS Telemetry */}
                    <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-slate-300 flex items-start gap-1 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="truncate" title={amb.currentLocationName}>{amb.currentLocationName}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold shrink-0">{amb.distanceKm} km</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate pr-2">Near: {amb.landmark}</span>
                        <span className="font-mono text-cyan-400 font-bold shrink-0">~{amb.etaMinutes}m ETA</span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                        <span>GPS: {amb.lat}, {amb.lng}</span>
                        <span className="text-emerald-400 font-bold">{amb.speedKmh} km/h</span>
                      </div>
                    </div>

                    {/* Crew Info */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                      <div className="truncate">
                        <span className="block text-slate-500 text-[9px]">Driver</span>
                        <strong className="text-slate-200 truncate block">{amb.driverName}</strong>
                      </div>
                      <div className="truncate text-right">
                        <span className="block text-slate-500 text-[9px]">Escort</span>
                        <strong className="text-slate-200 truncate block">{amb.escortName.split(' ')[0]}</strong>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className={`text-[10px] font-bold py-1 px-2 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/70'
                        : 'bg-slate-900/50 text-slate-400 group-hover:text-emerald-400'
                    }`}>
                      <span>{isSelected ? '✓ Origin route synchronized' : 'Select vehicle'}</span>
                      <span className="text-[9px] font-mono">{isSelected ? 'ACTIVE FOCUS' : 'Click to Track →'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Standby Banner when Map is not yet dispatched */
        <div className="p-8 bg-slate-950/90 rounded-3xl border-2 border-dashed border-emerald-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Heart className="w-8 h-8 animate-pulse text-emerald-400 fill-emerald-400/50" />
          </div>
          <div className="space-y-1.5 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold uppercase mb-1">
              <Clock className="w-3.5 h-3.5" />
              Awaiting Convoy Dispatch from Donor Facility
            </div>
            <h4 className="font-black text-white text-base sm:text-lg">
              {isHospitalView
                ? 'Organ Reception Standby — Surgical OT Preparation Underway'
                : 'Digital Green Corridor Organ Logistics Standby'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isHospitalView
                ? `The organ transit convoy has not yet been dispatched by the ambulance team at ${donorHosp.name}. Once dispatched from the Ambulance Portal, the live Digital Green Corridor Google Map and telemetry tracking will automatically appear here with real-time ETA and cold ischemia countdown.`
                : `Select the convoy fleet size (${convoyAmbulanceConfigs.length} ambulance${convoyAmbulanceConfigs.length > 1 ? 's' : ''} configured) and press Dispatch or click the large green Transplant icon above. The Digital Green Corridor Organ Logistics Google Map will immediately be visible on both the Ambulance Portal and Hospital Portal.`}
            </p>
          </div>
          {!isHospitalView && (
            <button
              type="button"
              onClick={() => handleDispatch(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/80 ring-2 ring-emerald-300 transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2 mx-auto"
            >
              <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              <span>Dispatch</span>
            </button>
          )}
        </div>
      )}

      {/* Footer Governance Note */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>National Organ & Tissue Transplant Organization (NOTTO) Certified Protocol</span>
        </div>
        <span>Traffic Police Green Wave Preemption Active • Zero Red Light Interruption</span>
      </div>

    </div>
  );
};

export default DigitalGreenCorridorMap;
