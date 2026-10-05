import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ExternalLink,
  Navigation,
  Map,
  Layers,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Compass,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  Ambulance,
  Users,
  Plus,
  Minus
} from 'lucide-react';
import {
  getGoogleMapsEmbedUrl,
  getGoogleMapsRouteEmbedUrl,
  openInGoogleMapsApp,
  navigateInGoogleMapsApp
} from '../utils/googleMaps';
import {
  interpolateRouteProgress,
  generateRoadWaypoints,
  generateDirectionalWaypoints,
  generateBypassWaypoints,
  calculateDistanceKm,
  AMBULANCE_DIRECTION_CONFIGS,
  CLEARANCE_GREEN_SHADES,
  getAmbulanceTheme
} from '../utils/routingEngine';
import { useEmergency } from '../context/EmergencyContext';

export const EmergencyMap = ({
  center = [22.5415, 88.3485],
  zoom = 13,
  patientLocation,
  ambulances = [],
  hospitals = [],
  activeEmergency,
  trafficSignals = [],
  showTrafficSignals = true,
  height = "450px",
  defaultMode = "interactive", // 'interactive' | 'tactical' | 'google-directions'
  focusOnInbound = true,
  focusedAmbulanceId = null,
  onAmbulanceSelect = null,
  showGrantClearance = true,
  lidarRerouteState = null
}) => {
  const [mapMode, setMapMode] = useState(
    defaultMode === 'tactical'
      ? 'tactical'
      : (defaultMode === 'google-directions' ? 'google-directions' : 'interactive')
  );
  const [selectedRouteId, setSelectedRouteId] = useState(() => focusedAmbulanceId || 'all');
  const [activeLeg, setActiveLeg] = useState('inbound'); // 'inbound' | 'hospital' | 'auto'

  // Dynamic zoom state tracked across both Leaflet and Google Directions modes
  const [currentZoom, setCurrentZoom] = useState(() => zoom || 13);
  const userHasInteractedZoomRef = useRef(false);

  useEffect(() => {
    if (focusedAmbulanceId) {
      setSelectedRouteId(focusedAmbulanceId);
    }
  }, [focusedAmbulanceId]);

  useEffect(() => {
    if (defaultMode) {
      setMapMode(defaultMode);
    }
  }, [defaultMode]);
  
  // Real-time animated transit simulation
  const [isSimulating, setIsSimulating] = useState(true);
  const [simProgress, setSimProgress] = useState(0.2); // 0 to 1 float

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const liveAmbulanceLayerRef = useRef(null);
  const liveMarkersRef = useRef({});

  // Compute primary target coordinates
  const targetPatient = patientLocation || (activeEmergency && activeEmergency.location) || {
    lat: 22.5415,
    lng: 88.3485,
    address: "AJC Bose Road Flyover near Exide Crossing, Kolkata"
  };
  const destinationHosp = hospitals.find(h => h.id === activeEmergency?.destinationHospitalId) || hospitals[0] || {
    lat: 22.5390,
    lng: 88.3420,
    name: "SSKM Hospital & IPGMER Apex Trauma Center"
  };
  const assignedAmb = ambulances.find(a => a.id === activeEmergency?.assignedAmbulanceId) || ambulances[0] || {
    lat: 22.5385,
    lng: 88.3370,
    id: "AMB-01",
    plateNumber: "WB-01-EA-1081"
  };

  // Determine actual leg routing
  const effectiveLeg = activeLeg === 'auto'
    ? (activeEmergency?.status === 'Transporting' ? 'hospital' : 'inbound')
    : activeLeg;

  const legOrigin = useMemo(() => {
    return effectiveLeg === 'inbound'
      ? { lat: assignedAmb.lat, lng: assignedAmb.lng, label: `Ambulance ${assignedAmb.plateNumber || assignedAmb.id}` }
      : { lat: targetPatient.lat, lng: targetPatient.lng, label: targetPatient.address || 'Patient Location' };
  }, [effectiveLeg, assignedAmb.lat, assignedAmb.lng, assignedAmb.plateNumber, assignedAmb.id, targetPatient.lat, targetPatient.lng, targetPatient.address]);

  const legDestination = useMemo(() => {
    return effectiveLeg === 'inbound'
      ? { lat: targetPatient.lat, lng: targetPatient.lng, label: targetPatient.address || 'Patient Pickup' }
      : { lat: destinationHosp.lat, lng: destinationHosp.lng, label: destinationHosp.name || 'Trauma Hospital' };
  }, [effectiveLeg, targetPatient.lat, targetPatient.lng, targetPatient.address, destinationHosp.lat, destinationHosp.lng, destinationHosp.name]);

  const { toggleTrafficPolicePermission, dispatchMultipleAmbulances, currentRole, networkMode, isOffline, lidarRerouteState: ctxLidarState } = useEmergency();
  const activeLidarReroute = lidarRerouteState || ctxLidarState;

  // Unified Zoom in / out handlers that control both Leaflet and Google Directions
  const handleZoomIn = useCallback(() => {
    userHasInteractedZoomRef.current = true;
    if (mapInstanceRef.current && mapMode !== 'google-directions') {
      try {
        const cur = mapInstanceRef.current.getZoom();
        const next = Math.min(19, cur + 1);
        mapInstanceRef.current.setZoom(next);
        setCurrentZoom(next);
        return;
      } catch {}
    }
    setCurrentZoom(prev => Math.min(19, prev + 1));
  }, [mapMode]);

  const handleZoomOut = useCallback(() => {
    userHasInteractedZoomRef.current = true;
    if (mapInstanceRef.current && mapMode !== 'google-directions') {
      try {
        const cur = mapInstanceRef.current.getZoom();
        const next = Math.max(5, cur - 1);
        mapInstanceRef.current.setZoom(next);
        setCurrentZoom(next);
        return;
      } catch {}
    }
    setCurrentZoom(prev => Math.max(5, prev - 1));
  }, [mapMode]);

  // Traffic police permission clearance action should only be accessible to control room / authority roles, strictly removed in patient portal and hospital portal
  const canShowClearanceButton = showGrantClearance && currentRole !== 'patient' && currentRole !== 'hospital';

  // Traffic police permission state (turns routes GREEN when granted)
  const isTrafficPoliceGranted = activeEmergency?.trafficPolicePermission !== undefined
    ? activeEmergency.trafficPolicePermission === 'GRANTED'
    : (activeEmergency?.greenCorridorActive ?? false);

  // Identify all responding ambulances based on assigned IDs or requested count (2, 3, 4, or Many)
  const respondingAmbulances = useMemo(() => {
    const assignedIds = Array.isArray(activeEmergency?.assignedAmbulanceIds) && activeEmergency.assignedAmbulanceIds.length >= 1
      ? activeEmergency.assignedAmbulanceIds
      : (activeEmergency?.assignedAmbulanceId ? [activeEmergency.assignedAmbulanceId] : []);

    let reqCount = 1;
    const num = activeEmergency?.numberOfAmbulances;
    if (assignedIds.length >= 1) {
      reqCount = assignedIds.length;
    } else if (num === 'Many' || num === 'many') {
      reqCount = Math.max(ambulances.length, 5);
    } else if (Number(num) >= 1) {
      reqCount = Number(num);
    }

    const list = [];
    const usedIds = new Set();

    // 1. Add assigned ambulances first in priority order, up to reqCount
    for (const id of assignedIds) {
      if (list.length >= reqCount) break;
      const amb = ambulances.find(a => a.id === id);
      if (amb && !usedIds.has(amb.id)) {
        list.push(amb);
        usedIds.add(amb.id);
      }
    }

    // 2. If assignedAmb is defined and not yet in list, insert if space permits
    if (assignedAmb && !usedIds.has(assignedAmb.id) && list.length < reqCount) {
      list.push(assignedAmb);
      usedIds.add(assignedAmb.id);
    }

    // 3. Supplement from remaining ambulances to reach exactly reqCount
    for (const amb of ambulances) {
      if (list.length >= reqCount) break;
      if (!usedIds.has(amb.id)) {
        list.push(amb);
        usedIds.add(amb.id);
      }
    }

    const finalFleet = list.slice(0, reqCount);
    return finalFleet.length > 0 ? finalFleet : [assignedAmb];
  }, [activeEmergency?.numberOfAmbulances, activeEmergency?.assignedAmbulanceIds, activeEmergency?.assignedAmbulanceId, ambulances, assignedAmb]);

  const isMultiAmbulance = respondingAmbulances.length > 1;

  // Selected Ambulance Routes: Evaluates direct GPS positions and directional corridors for all responding fleet units
  const selectedAmbulanceRoutes = useMemo(() => {
    const rawRoutes = respondingAmbulances.map((amb, idx) => {
      // Match theme by explicit ambulance direction (West, North, East, South, etc.) or fallback to fleet index
      const dirNorm = amb.direction ? amb.direction.toLowerCase().replace(/[^a-z]/g, '') : '';
      const matchedThemeIdx = dirNorm
        ? AMBULANCE_DIRECTION_CONFIGS.findIndex(c => c.key.toLowerCase().replace(/[^a-z]/g, '') === dirNorm || c.directionName.toLowerCase().replace(/[^a-z]/g, '') === dirNorm)
        : -1;
      const themeIdx = matchedThemeIdx >= 0 ? matchedThemeIdx : idx;
      const theme = getAmbulanceTheme(themeIdx, isTrafficPoliceGranted);

      // Determine approach origin: check real ambulance GPS vs directional corridor
      const endLat = legDestination.lat;
      const endLng = legDestination.lng;

      // Evaluate distance from real GPS coordinates vs synthetic directional corridor offset
      const ambHasCoords = Boolean(amb && amb.lat && amb.lng);
      const ambDist = ambHasCoords ? calculateDistanceKm(amb.lat, amb.lng, endLat, endLng) : 999;
      const syntheticLat = endLat + theme.dLat;
      const syntheticLng = endLng + theme.dLng;
      const syntheticDist = calculateDistanceKm(syntheticLat, syntheticLng, endLat, endLng);

      // Prioritize the closest valid origin to guarantee the shortest route
      const useDirect = ambHasCoords && (ambDist <= syntheticDist || ambDist < 4.5);
      const startLat = useDirect ? amb.lat : syntheticLat;
      const startLng = useDirect ? amb.lng : syntheticLng;

      const dist = calculateDistanceKm(startLat, startLng, endLat, endLng);
      const baseSpeed = isTrafficPoliceGranted ? 58 : 42;
      const corridorFactor = [1.0, 0.94, 0.90, 0.88, 0.84, 0.82, 0.86, 0.85][idx % 8];
      const speed = Math.round(baseSpeed * corridorFactor);
      const eta = Math.max(3, Math.round((dist / speed) * 60));
      // Check if this is the first ambulance and LiDAR obstacle is detected
      const isFirstAmb = (idx === 0 || amb.id === 'AMB-01' || amb.id === respondingAmbulances[0]?.id);
      const isReroutedByLidar = isFirstAmb && Boolean(activeLidarReroute?.hasObstacle);

      const waypoints = isReroutedByLidar
        ? generateBypassWaypoints(startLat, startLng, endLat, endLng)
        : generateDirectionalWaypoints(startLat, startLng, endLat, endLng, theme.key);

      // Keep original ambulance color even when LiDAR-rerouted — only the route path changes, not the color
      const color = theme.color;
      const glow = theme.glow;
      const colorName = theme.colorName;
      const textColor = theme.textColor;

      const name = isReroutedByLidar
        ? `${amb.plateNumber || amb.id} • ⚡ Barapullah Bypass (Pre-Alert Rerouted)`
        : (isTrafficPoliceGranted
            ? `${amb.plateNumber || amb.id} • ${theme.arrow} ${theme.directionName} Corridor (${colorName})`
            : `${amb.plateNumber || amb.id} • ${theme.arrow} ${theme.directionName} (${colorName})`);

      const unitTitle = isReroutedByLidar
        ? `Unit ${idx + 1}: ${amb.plateNumber || amb.id} (⚡ Barapullah Bypass)`
        : `Unit ${idx + 1}: ${amb.plateNumber || amb.id}`;

      const dirBadge = isReroutedByLidar ? '⚡ BYPASS' : theme.badge;
      const dirArrow = isReroutedByLidar ? '⚡' : theme.arrow;
      const corridorName = isReroutedByLidar ? 'Barapullah Elevated Bypass (Pre-Alert Detour)' : theme.corridorName;
      const trafficStatus = isReroutedByLidar
        ? '⚡ Pre-Alert Bypass Active: Diverted via Barapullah Bypass (Saved 6.4m vs Standstill)'
        : (isTrafficPoliceGranted
            ? `🟢 Clearance Active (Green Wave) • ${theme.directionName} Corridor (${colorName})`
            : `⚠️ Standard Routing • ${theme.directionName} Corridor (${colorName})`);

      return {
        id: `amb-route-${amb.id || idx}`,
        ambulanceId: amb.id,
        ambulance: amb,
        idx,
        name,
        shortName: isReroutedByLidar ? `${amb.plateNumber || amb.id} (Bypass)` : `${amb.plateNumber || amb.id}`,
        unitTitle,
        etaMinutes: isReroutedByLidar ? 5 : eta,
        distanceKm: isReroutedByLidar ? 3.1 : dist,
        avgSpeedKmh: isReroutedByLidar ? 68 : speed,
        theme,
        color,
        glow,
        colorName,
        textColor,
        dirKey: isReroutedByLidar ? 'bypass' : theme.key,
        dirName: isReroutedByLidar ? 'Barapullah Bypass' : theme.directionName,
        dirBadge,
        dirArrow,
        corridorName,
        landmark: isReroutedByLidar ? 'Barapullah Elevated Flyover' : theme.landmark,
        waypoints,
        isTrafficPoliceGranted,
        isLidarBypass: isReroutedByLidar,
        trafficStatus
      };
    });

    // Retain stable sequential fleet order (Unit 1, Unit 2, Unit 3...) for tabs while shortestRoute is tracked independently
    return rawRoutes;
  }, [respondingAmbulances, legDestination.lat, legDestination.lng, effectiveLeg, isTrafficPoliceGranted, activeLidarReroute?.hasObstacle]);

  // Guaranteed absolute shortest route among all candidate vehicles
  const shortestRoute = useMemo(() => {
    if (!selectedAmbulanceRoutes || selectedAmbulanceRoutes.length === 0) return null;
    return [...selectedAmbulanceRoutes].sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }, [selectedAmbulanceRoutes]);

  const activeRoute = useMemo(() => {
    if (selectedRouteId && selectedRouteId !== 'all') {
      const found = selectedAmbulanceRoutes.find(r => r.id === selectedRouteId || r.ambulanceId === selectedRouteId);
      if (found) return found;
    }
    // Default to the shortest route
    return shortestRoute || selectedAmbulanceRoutes[0] || null;
  }, [selectedRouteId, selectedAmbulanceRoutes, shortestRoute]);

  const handleSelectRoute = useCallback((routeId) => {
    setSelectedRouteId(routeId);
    if (onAmbulanceSelect) {
      const match = selectedAmbulanceRoutes.find(r => r.id === routeId || r.ambulanceId === routeId);
      if (match) onAmbulanceSelect(match.ambulance, match);
    }
  }, [onAmbulanceSelect, selectedAmbulanceRoutes]);

  useEffect(() => {
    window.__rakshaSelectAmbulanceGoogleNav = (routeId) => {
      handleSelectRoute(routeId);
      setMapMode('google-directions');
    };
    window.__rakshaOpenInGoogleMapsLive = (lat, lng, label) => {
      openInGoogleMapsApp(lat, lng, label);
    };
    return () => {
      delete window.__rakshaSelectAmbulanceGoogleNav;
      delete window.__rakshaOpenInGoogleMapsLive;
    };
  }, [handleSelectRoute]);

  // Animated progress for all selected responding ambulances
  const allLiveProgress = useMemo(() => {
    return selectedAmbulanceRoutes.map((r, idx) => {
      // Slightly stagger simulation progress per vehicle
      const staggeredProgress = (simProgress + idx * 0.12) % 1;
      const prog = interpolateRouteProgress(r, staggeredProgress);
      return {
        route: r,
        progress: prog,
        ambulance: r.ambulance,
        idx
      };
    });
  }, [selectedAmbulanceRoutes, simProgress]);

  // Dynamic live progress bound to the active clicked ambulance
  const activeLiveEntry = useMemo(() => {
    if (activeRoute) {
      const match = allLiveProgress.find(p => p.route.ambulanceId === activeRoute.ambulanceId || p.route.id === activeRoute.id);
      if (match) return match;
    }
    return allLiveProgress[0] || null;
  }, [activeRoute, allLiveProgress]);

  const liveProgress = activeLiveEntry?.progress || null;

  // Animation loop for live transit
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSimProgress(prev => {
        const next = prev + 0.015;
        if (next >= 1) {
          return 0; // loop smoothly for continuous demo
        }
        return next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Viewport updater that recalculates container size and fits bounds to show all selected responding ambulances
  const updateMapViewport = useCallback((force = false) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!force && userHasInteractedZoomRef.current) return;
    map.invalidateSize();

    if (selectedAmbulanceRoutes.length > 0) {
      const allWaypoints = selectedAmbulanceRoutes.flatMap(r => r.waypoints);
      if (targetPatient.lat && targetPatient.lng) {
        allWaypoints.push([targetPatient.lat, targetPatient.lng]);
      }
      if (allWaypoints.length > 1) {
        try {
          const bounds = L.latLngBounds(allWaypoints);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
          return;
        } catch {}
      }
    }

    if (activeRoute && activeRoute.waypoints && activeRoute.waypoints.length > 1) {
      try {
        const bounds = L.latLngBounds(activeRoute.waypoints);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
        return;
      } catch {}
    }

    const tLat = targetPatient.lat || center[0];
    const tLng = targetPatient.lng || center[1];
    map.setView([tLat, tLng], currentZoom || zoom);
  }, [selectedAmbulanceRoutes, activeRoute, targetPatient, center, currentZoom, zoom]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    try {
      const map = L.map(mapContainerRef.current, {
        center: [targetPatient.lat || center[0], targetPatient.lng || center[1]],
        zoom: currentZoom || zoom,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        smoothWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true
      });

      map.on('zoomend', () => {
        userHasInteractedZoomRef.current = true;
        setCurrentZoom(map.getZoom());
      });

      map.on('movestart', (e) => {
        if (e && !e.hard) {
          userHasInteractedZoomRef.current = true;
        }
      });

      const OFFLINE_TACTICAL_TILE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="%230b1329"><rect width="256" height="256" fill="%230b1329"/><path d="M0 64h256M0 128h256M0 192h256M64 0v256M128 0v256M192 0v256" stroke="%231e293b" stroke-width="0.75"/><circle cx="128" cy="128" r="2" fill="%2338bdf8" opacity="0.3"/></svg>';
      const isOfflineMode = networkMode && networkMode !== 'online';
      const isTactical = mapMode === 'tactical';
      const tileUrl = isOfflineMode
        ? OFFLINE_TACTICAL_TILE
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        className: isTactical ? 'tactical-dark-tiles' : '',
        timeout: 8000
      }).addTo(map);

      tileLayer.on('tileerror', () => {
        tileLayer.setUrl(OFFLINE_TACTICAL_TILE);
      });

      tileLayerRef.current = tileLayer;
      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      liveAmbulanceLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          updateMapViewport(true);
        }
      }, 250);
    } catch (err) {
      console.error('Failed to initialize Leaflet Map:', err);
    }

    return () => {
      liveMarkersRef.current = {};
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer Theme & Offline Fallback
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const OFFLINE_TACTICAL_TILE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="%230b1329"><rect width="256" height="256" fill="%230b1329"/><path d="M0 64h256M0 128h256M0 192h256M64 0v256M128 0v256M192 0v256" stroke="%231e293b" stroke-width="0.75"/><circle cx="128" cy="128" r="2" fill="%2338bdf8" opacity="0.3"/></svg>';

    if (networkMode && networkMode !== 'online') {
      tileLayerRef.current.setUrl(OFFLINE_TACTICAL_TILE);
    } else {
      const tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      tileLayerRef.current.setUrl(tileUrl);
      const container = tileLayerRef.current.getContainer();
      if (container) {
        if (mapMode === 'tactical') {
          container.classList.add('tactical-dark-tiles');
        } else {
          container.classList.remove('tactical-dark-tiles');
        }
      }
    }
  }, [mapMode, networkMode]);

  // Invalidate and fit bounds whenever route or fleet changes
  useEffect(() => {
    updateMapViewport();
  }, [selectedRouteId, updateMapViewport]);

  // 1. Static Map Elements: Patient SOS, Hospitals, Signals, Corridors, Base Stations, Directional Flow Chevrons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !routeLayerRef.current) return;

    try {
      markersLayerRef.current.clearLayers();
      routeLayerRef.current.clearLayers();

      // 1. Patient SOS Marker (Central Incident Scene)
      if (targetPatient && targetPatient.lat && targetPatient.lng) {
        const patientIcon = L.divIcon({
          className: 'custom-patient-icon',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-11 w-11 rounded-full bg-red-500 opacity-75 animate-ping"></span>
              <div class="w-9 h-9 rounded-full bg-red-600 border-2 border-white shadow-2xl flex items-center justify-center text-white font-black text-xs">
                SOS
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const pMarker = L.marker([targetPatient.lat, targetPatient.lng], { icon: patientIcon })
          .bindPopup(`
            <div class="p-2 text-slate-100 min-w-[220px]">
              <div class="font-bold text-red-400 text-xs flex items-center gap-1">🚨 PATIENT EMERGENCY SCENE</div>
              <div class="font-semibold text-white text-sm mt-0.5">${activeEmergency?.patientName || 'Emergency Scene'}</div>
              <div class="text-xs text-slate-300 mt-1">${targetPatient.address || 'GPS Coordinates Acquired'}</div>
              <div class="mt-2 text-[10px] bg-red-950 text-red-300 px-2 py-1 rounded border border-red-800 font-semibold flex items-center justify-between">
                <span>Severity: ${activeEmergency?.severity || 'Critical'}</span>
                <span>Fleet: ${respondingAmbulances.length} Units Converging</span>
              </div>
            </div>
          `);
        markersLayerRef.current.addLayer(pMarker);
      }

      // 2. Hospital Markers
      hospitals.forEach(hosp => {
        const isDestination = activeEmergency?.destinationHospitalId === hosp.id || destinationHosp.id === hosp.id;
        const hospIcon = L.divIcon({
          className: 'custom-hosp-icon',
          html: `
            <div class="relative flex flex-col items-center">
              <div class="w-7 h-7 rounded-lg ${isDestination ? 'bg-blue-600 ring-4 ring-blue-400/50' : 'bg-slate-800'} border border-white/80 shadow-lg flex items-center justify-center text-white text-xs font-bold">
                🏥
              </div>
              <span class="text-[9px] font-bold text-slate-900 bg-white/90 px-1 rounded shadow mt-0.5 whitespace-nowrap">
                ${hosp.icuBeds || 12} ICU
              </span>
            </div>
          `,
          iconSize: [28, 38],
          iconAnchor: [14, 19]
        });

        const hMarker = L.marker([hosp.lat, hosp.lng], { icon: hospIcon })
          .bindPopup(`
            <div class="p-1 text-slate-100">
              <div class="font-bold text-blue-400 text-xs">${(hosp.type || 'Government').toUpperCase()} HOSPITAL</div>
              <div class="font-bold text-white text-sm">${hosp.name}</div>
              <div class="text-xs text-slate-300 mt-1">24/7 ER Hotline: <span class="font-mono text-emerald-400">${hosp.emergencyHotline || '108'}</span></div>
            </div>
          `);
        markersLayerRef.current.addLayer(hMarker);
      });

      // 3. Traffic Signals (Preemption Active when Grant Clearance is Active)
      if (showTrafficSignals && trafficSignals.length > 0) {
        trafficSignals.forEach(sig => {
          const isGreen = isTrafficPoliceGranted || sig.state === 'GREEN';
          const sigIcon = L.divIcon({
            className: 'custom-sig-icon',
            html: `
              <div class="flex items-center justify-center w-5 h-5 rounded-full ${isGreen ? 'bg-emerald-500 ring-2 ring-emerald-300 shadow-emerald-500/50' : 'bg-rose-500'} text-[10px] text-white font-bold shadow">
                🚦
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const sMarker = L.marker([sig.lat, sig.lng], { icon: sigIcon })
            .bindPopup(`
              <div class="p-1">
                <div class="text-[10px] font-bold text-emerald-400">TRAFFIC SIGNAL PREEMPTION</div>
                <div class="text-xs font-semibold text-white">${sig.name}</div>
                <div class="mt-1 text-[11px] font-mono ${isGreen ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                  State: ${isGreen ? 'GREEN (Preemption Active)' : 'NORMAL CYCLE (Clearance Required)'}
                </div>
              </div>
            `);
          markersLayerRef.current.addLayer(sMarker);
        });
      }

      // 3b. Road Blockage Marker on Primary Route (When Obstacle is Active)
      if (activeLidarReroute?.hasObstacle) {
        const firstRoute = selectedAmbulanceRoutes[0];
        const startCoord = (firstRoute?.waypoints && firstRoute.waypoints[0]) || [22.5415 - 0.003, 88.3485 - 0.0115];
        const endCoord = [legDestination.lat, legDestination.lng];
        const obsLat = startCoord[0] + (endCoord[0] - startCoord[0]) * 0.42;
        const obsLng = startCoord[1] + (endCoord[1] - startCoord[1]) * 0.38;

        const hazardIcon = L.divIcon({
          className: 'custom-lidar-hazard-marker',
          html: `
            <div class="relative flex flex-col items-center">
              <span class="absolute inline-flex h-9 w-9 rounded-full bg-red-500 opacity-75 animate-ping"></span>
              <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-2xl flex items-center justify-center text-white text-xs font-black">
                🚨
              </div>
              <span class="text-[9px] font-black font-mono text-white bg-red-600 px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap border border-red-400 animate-pulse">
                ROAD BLOCKED (${activeLidarReroute.obstacleDistance || 38}m)
              </span>
            </div>
          `,
          iconSize: [36, 46],
          iconAnchor: [18, 23]
        });

        const hazardMarker = L.marker([obsLat, obsLng], { icon: hazardIcon })
          .bindPopup(`
            <div class="p-2 text-slate-100 min-w-[220px]">
              <div class="font-extrabold text-xs text-rose-400 flex items-center gap-1">
                🚨 ROAD BLOCKAGE DETECTED (PRE-ALERT ACTIVE)
              </div>
              <div class="font-bold text-white text-sm mt-1">
                ${activeLidarReroute.obstacleTitle || 'Stalled Commercial Truck'}
              </div>
              <div class="text-[11px] text-slate-300 mt-1">
                Location: Outer Ring Road @ KM 4.2 (${activeLidarReroute.obstacleDistance || 38.4}m ahead)
              </div>
              <div class="mt-1.5 p-1.5 rounded bg-cyan-950/80 border border-cyan-700 text-cyan-300 text-[10px] font-semibold">
                ⚡ First ambulance (${respondingAmbulances[0]?.plateNumber || 'AMB-01'}) dynamically rerouted via Barapullah Bypass.
              </div>
            </div>
          `);
        markersLayerRef.current.addLayer(hazardMarker);

        // Dashed Red Line showing the blocked portion of the primary route
        const blockedSegment = [
          [startCoord[0] + (endCoord[0] - startCoord[0]) * 0.30, startCoord[1] + (endCoord[1] - startCoord[1]) * 0.28],
          [obsLat, obsLng],
          [startCoord[0] + (endCoord[0] - startCoord[0]) * 0.54, startCoord[1] + (endCoord[1] - startCoord[1]) * 0.48]
        ];
        const blockedLine = L.polyline(blockedSegment, {
          color: '#ef4444',
          weight: 6,
          opacity: 0.9,
          dashArray: '6, 6',
          lineCap: 'round'
        });
        routeLayerRef.current.addLayer(blockedLine);
      }

      // 4. Draw Selected Ambulance Routes, Origin Base Stations, and Directional Flow Chevrons
      selectedAmbulanceRoutes.forEach(r => {
        const isSelected = selectedRouteId === 'all' || selectedRouteId === r.id || selectedRouteId === r.ambulanceId;

        // Outer glowing route corridor line
        const glowLine = L.polyline(r.waypoints, {
          color: r.glow,
          weight: isSelected ? 12 : 5,
          opacity: isSelected ? (isTrafficPoliceGranted ? 0.5 : 0.35) : 0.2,
          lineCap: 'round',
          lineJoin: 'round'
        });
        routeLayerRef.current.addLayer(glowLine);

        // Main crisp route line in vehicle's distinct color
        const mainLine = L.polyline(r.waypoints, {
          color: r.color,
          weight: isSelected ? 6 : 4,
          opacity: isSelected ? 0.95 : 0.65,
          dashArray: isTrafficPoliceGranted ? null : '8, 4',
          lineCap: 'round',
          lineJoin: 'round'
        });

        mainLine.bindPopup(`
          <div class="p-2 text-slate-100 min-w-[220px]">
            <div class="font-extrabold text-xs flex items-center justify-between" style="color: ${r.color}">
              <span>🚑 ${r.unitTitle}</span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase" style="background-color: ${r.color}">${r.dirBadge}</span>
            </div>
            <div class="text-[11px] text-white font-semibold mt-1 flex items-center gap-1">
              <span>${r.dirArrow}</span>
              <span>Approaching from: <b style="color: ${r.color}">${r.dirName}</b></span>
            </div>
            <div class="text-[11px] text-slate-300 mt-0.5">
              Corridor: <span class="text-slate-200">${r.corridorName}</span>
            </div>
            <div class="text-xs text-white font-mono mt-1 font-bold flex items-center justify-between border-t border-slate-800 pt-1">
              <span>ETA: <b class="text-cyan-400">${r.etaMinutes} mins</b></span>
              <span>Dist: <b class="text-emerald-400">${r.distanceKm} km</b></span>
            </div>
            <div class="text-[10px] mt-1.5 px-2 py-0.5 rounded font-bold flex items-center justify-between" style="background-color: ${r.color}20; color: ${r.color}">
              <span>${isTrafficPoliceGranted ? '🟢 Clearance Active (Green Wave)' : '⚠️ Standard Routing'}</span>
              <span>${r.avgSpeedKmh} km/h</span>
            </div>
          </div>
        `);
        routeLayerRef.current.addLayer(mainLine);

        // 4b. Base Station Origin Marker at route start (r.waypoints[0])
        if (r.waypoints && r.waypoints.length > 0) {
          const originCoords = r.waypoints[0];
          const stationIcon = L.divIcon({
            className: `custom-station-icon-${r.ambulanceId}`,
            html: `
              <div class="relative flex flex-col items-center group cursor-pointer" title="${r.shortName} Origin: ${r.dirName} Base">
                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-[9px] text-white shadow-2xl border-2 border-white/40 whitespace-nowrap" style="background-color: ${r.color}">
                  <span>${r.dirArrow}</span>
                  <span>${r.dirName.toUpperCase()} BASE</span>
                  <span class="opacity-90 font-mono text-[8px] bg-black/40 px-1 py-0.2 rounded">${r.shortName}</span>
                </div>
                <div class="w-2.5 h-2.5 rotate-45 border-2 border-white shadow-lg -mt-1" style="background-color: ${r.color}"></div>
              </div>
            `,
            iconSize: [110, 28],
            iconAnchor: [55, 28]
          });

          const stationMarker = L.marker(originCoords, { icon: stationIcon })
            .bindPopup(`
              <div class="p-2 text-slate-100 min-w-[220px]">
                <div class="font-extrabold text-xs flex items-center justify-between" style="color: ${r.color}">
                  <span>🏢 ${r.dirName} Base Station</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase" style="background-color: ${r.color}">${r.dirBadge}</span>
                </div>
                <div class="text-xs text-white font-semibold mt-1">
                  Dispatched: <b>${r.shortName}</b> (${r.ambulance?.type || 'ALS Trauma'})
                </div>
                <div class="text-[11px] text-slate-300 mt-0.5">
                  Station Location: <span class="text-slate-200">${r.landmark || r.corridorName}</span>
                </div>
                <div class="text-[11px] text-slate-300 mt-0.5">
                  Approach Corridor: <span class="text-slate-200">${r.corridorName}</span>
                </div>
                <div class="text-xs font-mono mt-1.5 pt-1 border-t border-slate-800 text-cyan-400 font-bold flex justify-between">
                  <span>Initial Dist: <b>${r.distanceKm} km</b></span>
                  <span>Est. ETA: <b>${r.etaMinutes}m</b></span>
                </div>
              </div>
            `);
          routeLayerRef.current.addLayer(stationMarker);
        }

        // 4c. Mid-Route Directional Flow Chevron
        if (r.waypoints && r.waypoints.length >= 3) {
          const midIdx = Math.floor(r.waypoints.length / 2);
          const midCoords = r.waypoints[midIdx];
          const midArrowIcon = L.divIcon({
            className: `custom-mid-arrow-${r.ambulanceId}`,
            html: `
              <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md border border-white/50 bg-slate-950" style="color: ${r.color}; box-shadow: 0 0 8px ${r.glow};">
                ${r.dirArrow}
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          const midMarker = L.marker(midCoords, { icon: midArrowIcon, interactive: false });
          routeLayerRef.current.addLayer(midMarker);
        }
      });
    } catch (err) {
      console.warn('Leaflet static layer render error:', err);
    }
  }, [
    targetPatient.lat,
    targetPatient.lng,
    targetPatient.address,
    destinationHosp.id,
    destinationHosp.lat,
    destinationHosp.lng,
    hospitals,
    trafficSignals,
    showTrafficSignals,
    selectedAmbulanceRoutes,
    selectedRouteId,
    isTrafficPoliceGranted,
    activeEmergency?.id,
    activeEmergency?.patientName,
    activeEmergency?.severity,
    activeEmergency?.destinationHospitalId,
    respondingAmbulances.length,
    activeLidarReroute?.hasObstacle
  ]);

  // 2. Dynamic Live Moving Ambulances - Smooth Coordinate Translation (No Screen Wiping)
  useEffect(() => {
    const liveLayer = liveAmbulanceLayerRef.current;
    if (!liveLayer) return;

    const currentIds = new Set();

    allLiveProgress.forEach(entry => {
      if (!entry.progress || !entry.progress.lat || !entry.progress.lng) return;
      const ambId = entry.ambulance?.id || `AMB-0${entry.idx + 1}`;
      currentIds.add(ambId);

      const ambColor = entry.route?.color || '#2563EB';
      const ambGlow = entry.route?.glow || '#3B82F6';
      const ambPlate = entry.ambulance?.plateNumber || entry.ambulance?.id || `AMB-0${entry.idx + 1}`;
      const dirBadge = entry.route?.dirBadge || `UNIT ${entry.idx + 1}`;
      const dirName = entry.route?.dirName || '';
      const dirArrow = entry.route?.dirArrow || '';
      const corridorName = entry.route?.corridorName || '';

      const latLng = [entry.progress.lat, entry.progress.lng];

      const isBypass = Boolean(entry.route?.isLidarBypass);
      const etaMin = entry.progress.etaRemainingMinutes ?? entry.route?.etaMinutes ?? 5;
      const distKm = entry.progress.distanceRemainingKm ?? entry.route?.distanceKm ?? 2.1;
      const speed = entry.route?.avgSpeedKmh || 55;

      const createAmbIcon = () => L.divIcon({
        className: `custom-live-amb-icon-${entry.idx}`,
        html: `
          <div class="relative flex flex-col items-center group cursor-pointer select-none">
            <span class="absolute -top-1.5 inline-flex h-12 w-12 rounded-full opacity-75 animate-ping" style="background-color: ${ambColor}"></span>
            <div class="w-10 h-10 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-slate-950 font-black text-lg ring-4 transition-transform group-hover:scale-110" style="background-color: ${ambColor}; box-shadow: 0 0 20px ${ambGlow};">
              🚑
            </div>
            <div class="flex flex-col items-center mt-1">
              <div class="flex items-center gap-1 text-[9px] font-mono font-black bg-slate-950/95 px-2 py-0.5 rounded-md shadow border whitespace-nowrap" style="color: ${ambColor}; border-color: ${ambColor}">
                <span class="w-2 h-2 rounded-full animate-ping" style="background-color: ${ambColor}"></span>
                <span class="px-1 py-0.2 rounded text-[8px] font-extrabold text-white" style="background-color: ${ambColor}">${dirBadge}</span>
                <span>${ambPlate}</span>
              </div>
              <div class="flex items-center gap-1.5 text-[8px] font-mono font-bold bg-slate-950/95 px-2 py-0.5 rounded-full text-slate-200 shadow-md border border-slate-700/90 -mt-0.5 whitespace-nowrap">
                <span class="text-cyan-300 font-black">${etaMin}m</span>
                <span class="text-slate-500">•</span>
                <span class="text-emerald-300">${distKm}km</span>
                <span class="text-slate-500">•</span>
                <span class="text-amber-300">${speed}km/h</span>
                ${isBypass ? '<span class="text-yellow-400 font-extrabold px-1 rounded bg-yellow-950/80 border border-yellow-500/50">⚡BYPASS</span>' : ''}
              </div>
            </div>
          </div>
        `,
        iconSize: [110, 68],
        iconAnchor: [55, 20]
      });

      if (liveMarkersRef.current[ambId]) {
        // Smoothly update position & telemetry without destroying marker or closing popup!
        liveMarkersRef.current[ambId].setLatLng(latLng);
        liveMarkersRef.current[ambId].setIcon(createAmbIcon());
      } else {
        const liveMarker = L.marker(latLng, {
          icon: createAmbIcon(),
          zIndexOffset: 1000 + entry.idx
        }).bindPopup(`
          <div class="p-2.5 text-slate-100 min-w-[240px]">
            <div class="font-extrabold text-xs flex items-center justify-between" style="color: ${ambColor}">
              <span>🚑 Unit ${entry.idx + 1}: ${ambPlate}</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase" style="background-color: ${ambColor}">${dirBadge}</span>
            </div>
            <div class="text-xs text-white font-semibold mt-1.5 flex items-center gap-1">
              <span>${dirArrow}</span>
              <span>Approaching from: <b style="color: ${ambColor}">${dirName}</b></span>
            </div>
            ${corridorName ? `<div class="text-[11px] text-slate-300 mt-0.5">Corridor: <span class="text-slate-200">${corridorName}</span></div>` : ''}
            <div class="text-xs text-slate-300 mt-1">Vehicle Type: <b class="text-white">${entry.ambulance?.type || 'ALS Trauma'}</b></div>
            <div class="text-xs text-slate-300 font-mono">Live GPS: <b class="text-cyan-300">${entry.progress.lat.toFixed(4)}° N, ${entry.progress.lng.toFixed(4)}° E</b></div>
            <div class="text-xs text-slate-300">Transit Distance: <b class="text-emerald-400 font-mono">${distKm} km remaining</b></div>
            <div class="text-xs text-slate-300">Live ETA: <b class="text-cyan-400 font-mono">${etaMin} mins</b></div>
            <div class="mt-2 text-[10px] px-2 py-0.5 rounded border font-bold flex items-center justify-between" style="background-color: ${ambColor}20; color: ${ambColor}; border-color: ${ambColor}60">
              <span>${isTrafficPoliceGranted ? '🟢 Clearance Active' : '⚡ Clearance Pending'}</span>
              <span>Speed: ${speed} km/h</span>
            </div>
            <div class="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer"
                onclick="window.__rakshaSelectAmbulanceGoogleNav && window.__rakshaSelectAmbulanceGoogleNav('${entry.route?.id}')"
              >
                🧭 Google Directions
              </button>
              <button
                type="button"
                class="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer"
                onclick="window.__rakshaOpenInGoogleMapsLive && window.__rakshaOpenInGoogleMapsLive(${entry.progress.lat}, ${entry.progress.lng}, 'Ambulance ${ambPlate}')"
              >
                🗺️ Google Maps App
              </button>
            </div>
          </div>
        `);

        liveMarker.on('click', () => {
          handleSelectRoute(entry.route?.id);
        });

        liveLayer.addLayer(liveMarker);
        liveMarkersRef.current[ambId] = liveMarker;
      }
    });

    // Cleanup markers that are no longer responding
    Object.keys(liveMarkersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        liveLayer.removeLayer(liveMarkersRef.current[id]);
        delete liveMarkersRef.current[id];
      }
    });
  }, [allLiveProgress, isTrafficPoliceGranted, handleSelectRoute]);

  // The specific origin location for the selected ambulance in Google Directions (guarantees shortest driving route)
  const activeAmbOrigin = useMemo(() => {
    if (effectiveLeg === 'inbound') {
      const targetRoute = activeRoute || shortestRoute;
      const amb = targetRoute?.ambulance || assignedAmb;
      const wayPt = (targetRoute && targetRoute.waypoints && targetRoute.waypoints.length > 0)
        ? { lat: targetRoute.waypoints[0][0], lng: targetRoute.waypoints[0][1] }
        : null;

      // Evaluate both vehicle live GPS and corridor waypoints to pick the shortest route to destination
      const candidates = [];
      if (amb && amb.lat && amb.lng) {
        candidates.push({
          lat: amb.lat,
          lng: amb.lng,
          dist: calculateDistanceKm(amb.lat, amb.lng, legDestination.lat, legDestination.lng),
          label: `Ambulance ${targetRoute?.shortName || amb.plateNumber || amb.id}`
        });
      }
      if (wayPt) {
        candidates.push({
          lat: wayPt.lat,
          lng: wayPt.lng,
          dist: calculateDistanceKm(wayPt.lat, wayPt.lng, legDestination.lat, legDestination.lng),
          label: `Corridor ${targetRoute?.shortName || 'Approach'}`
        });
      }

      if (candidates.length > 0) {
        // Sort strictly by distance to select the closest origin (shortest route)
        candidates.sort((a, b) => a.dist - b.dist);
        return {
          lat: candidates[0].lat,
          lng: candidates[0].lng,
          label: `${candidates[0].label} (${candidates[0].dist} km)`
        };
      }
    }
    return {
      lat: targetPatient.lat,
      lng: targetPatient.lng,
      label: targetPatient.address || 'Patient Pickup'
    };
  }, [effectiveLeg, activeRoute, shortestRoute, assignedAmb, targetPatient, legDestination.lat, legDestination.lng]);

  // Google Maps directions embed URL dynamically bound to the selected ambulance's location and active zoom level
  const googleDirectionsEmbedUrl = useMemo(() => {
    return getGoogleMapsRouteEmbedUrl(
      activeAmbOrigin.lat,
      activeAmbOrigin.lng,
      legDestination.lat,
      legDestination.lng,
      currentZoom
    );
  }, [activeAmbOrigin.lat, activeAmbOrigin.lng, legDestination.lat, legDestination.lng, currentZoom]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      {/* Top Map Control Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2">
          {/* Map Mode Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMapMode('interactive')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                mapMode === 'interactive'
                  ? isTrafficPoliceGranted
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>

            <button
              type="button"
              onClick={() => setMapMode('tactical')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                mapMode === 'tactical'
                  ? isTrafficPoliceGranted
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                    : 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tactical Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setMapMode('google-directions')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                mapMode === 'google-directions'
                  ? isTrafficPoliceGranted
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                    : 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Directions</span>
            </button>
          </div>

          {/* Traffic Police Grant Clearance Button (Hidden in Patient Portal) */}
          {canShowClearanceButton && (
            <button
              type="button"
              onClick={() => {
                if (toggleTrafficPolicePermission) {
                  toggleTrafficPolicePermission(activeEmergency?.id, !isTrafficPoliceGranted);
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                isTrafficPoliceGranted
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400 shadow-emerald-950/60'
                  : 'bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400 shadow-blue-950/60'
              }`}
              title={isTrafficPoliceGranted ? 'Click to revoke clearance' : 'Click to Grant Clearance (Green Wave Corridor)'}
            >
              <span className={`w-2 h-2 rounded-full ${isTrafficPoliceGranted ? 'bg-white animate-ping' : 'bg-blue-200'}`}></span>
              <span>
                {isTrafficPoliceGranted
                  ? '🟢 Traffic Police: CLEARANCE ACTIVE (Routes GREEN)'
                  : '⚡ Grant Clearance (Traffic Police Permission)'}
              </span>
            </button>
          )}
        </div>

        {/* Right Controls: Zoom, Recenter, Simulation Toggle, External App */}
        <div className="flex items-center gap-2">
          {/* Zoom In / Zoom Out Controls (Unified across Leaflet and Google Directions) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs shadow-sm">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-cyan-300 select-none">
              {currentZoom}x
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Transit Simulation Toggle */}
          <button
            type="button"
            onClick={() => setIsSimulating(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isSimulating
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isSimulating ? 'Simulating' : 'Paused'}</span>
          </button>

          {/* Recenter Viewport */}
          <button
            type="button"
            onClick={() => {
              userHasInteractedZoomRef.current = false;
              updateMapViewport(true);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Recenter map bounds to fit fleet"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Open Google Maps App with Live Real-Time Coordinates */}
          <button
            type="button"
            onClick={() => {
              const liveLat = liveProgress?.lat || activeAmbOrigin.lat;
              const liveLng = liveProgress?.lng || activeAmbOrigin.lng;
              navigateInGoogleMapsApp(
                legDestination.lat,
                legDestination.lng,
                liveLat,
                liveLng
              );
            }}
            className={`px-3 py-1 text-white ${
              isTrafficPoliceGranted
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60 ring-emerald-400'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/60 ring-blue-400'
            } rounded-lg text-xs font-bold flex items-center gap-1.5 shadow ring-1 transition-colors`}
            title={`Launch Turn-by-Turn GPS Navigation for ${activeRoute?.shortName || 'Ambulance'} in Google Maps App from Live Location`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in Google Maps App</span>
          </button>
        </div>
      </div>

      {/* Sub-Bar: Fleet Route Tabs & Dynamic Fleet Switcher */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1 text-[11px]">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            {selectedAmbulanceRoutes.length > 1 ? `Fleet Routes (${selectedAmbulanceRoutes.length}):` : 'Selected Route:'}
          </span>

          {selectedAmbulanceRoutes.length > 1 && (
            <button
              type="button"
              onClick={() => handleSelectRoute('all')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs whitespace-nowrap ${
                selectedRouteId === 'all'
                  ? 'bg-slate-800 text-white ring-1 ring-white/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>All Fleet ({selectedAmbulanceRoutes.length})</span>
            </button>
          )}

          {selectedAmbulanceRoutes.map(r => {
            const isSelected = selectedRouteId === r.id || selectedRouteId === r.ambulanceId || (selectedAmbulanceRoutes.length === 1 && selectedRouteId === 'all');
            const isShortest = r.id === shortestRoute?.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRoute(r.id)}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs whitespace-nowrap border ${
                  isSelected
                    ? 'ring-2 text-white shadow-md'
                    : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
                }`}
                style={isSelected ? {
                  backgroundColor: `${r.color}30`,
                  borderColor: r.color,
                  boxShadow: `0 0 10px ${r.color}40`,
                  color: '#ffffff'
                } : {}}
                title={`Click to select ${r.shortName} and change location in Google Directions`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }}></span>
                <span>{r.shortName}</span>
                <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase text-white shadow-sm" style={{ backgroundColor: r.color }}>
                  {r.dirArrow} {r.dirBadge}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-black/50 text-cyan-300 flex items-center gap-1">
                  <span>{r.etaMinutes}m</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-300">{r.distanceKm}km</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Fleet Size Quick Switcher & Route Leg Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Fleet Dispatch Scaler: 1, 2, 3, 4, Many */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-[10px] text-slate-400 font-bold px-1.5">Fleet:</span>
            {[1, 2, 3, 4, 'Many'].map(cnt => {
              const isCntActive = cnt === 'Many'
                ? (activeEmergency?.numberOfAmbulances === 'Many' || activeEmergency?.numberOfAmbulances === 'many' || respondingAmbulances.length >= 5)
                : (Number(activeEmergency?.numberOfAmbulances) === cnt || (respondingAmbulances.length === cnt && activeEmergency?.numberOfAmbulances !== 'Many'));
              return (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    if (dispatchMultipleAmbulances) {
                      dispatchMultipleAmbulances(activeEmergency?.id, cnt);
                    }
                  }}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    isCntActive
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Dispatch ${cnt === 'Many' ? 'Multiple (Mass Casualty)' : `${cnt} Ambulances`}`}
                >
                  {cnt === 'Many' ? 'Many' : `${cnt} Amb${cnt > 1 ? 's' : ''}`}
                </button>
              );
            })}
          </div>

          {/* Route Leg Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveLeg('inbound')}
              className={`px-2 py-0.5 rounded font-semibold ${
                effectiveLeg === 'inbound'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ambulance ➔ Patient
            </button>
            <button
              type="button"
              onClick={() => setActiveLeg('hospital')}
              className={`px-2 py-0.5 rounded font-semibold ${
                effectiveLeg === 'hospital'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Patient ➔ Hospital
            </button>
          </div>
        </div>
      </div>

      {/* Map View Area */}
      <div className="relative w-full overflow-hidden" style={{ height: height || '450px' }}>
        {/* Floating Canvas Zoom Controls (Works on both Leaflet and Google Directions modes) */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl space-y-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-blue-600 text-white font-bold flex items-center justify-center transition-all shadow hover:scale-105 active:scale-95 cursor-pointer"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="text-[10px] font-mono font-black text-cyan-300 py-0.5 px-1 select-none text-center">
            {currentZoom}x
          </div>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-blue-600 text-white font-bold flex items-center justify-center transition-all shadow hover:scale-105 active:scale-95 cursor-pointer"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* View A: Embedded Google Maps Route */}
        {mapMode === 'google-directions' && (
          <div className="relative w-full h-full">
            <iframe
              key={googleDirectionsEmbedUrl}
              title="Google Maps Navigation"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={googleDirectionsEmbedUrl}
              className={isTrafficPoliceGranted ? 'google-maps-green-route' : ''}
            />

            {/* Google Directions Header Banner & Ambulance Switcher */}
            <div
              className="absolute top-3 left-3 right-3 sm:right-auto z-20 bg-slate-950/95 border-2 rounded-xl p-3 shadow-2xl space-y-2 backdrop-blur-md max-w-xl"
              style={{ borderColor: activeRoute?.color || '#3B82F6' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full animate-ping shrink-0" style={{ backgroundColor: activeRoute?.color || '#3B82F6' }}></span>
                  <div>
                    <div className="font-extrabold text-xs text-white flex items-center gap-1.5 flex-wrap">
                      <span>GOOGLE DIRECTIONS:</span>
                      <span className="font-black" style={{ color: activeRoute?.color || '#3B82F6' }}>
                        {activeRoute?.unitTitle || 'Selected Ambulance'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase" style={{ backgroundColor: activeRoute?.color }}>
                        {activeRoute?.dirBadge}
                      </span>
                      {activeRoute?.id === shortestRoute?.id ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm font-mono">
                          <Zap className="w-3 h-3 text-slate-950 fill-slate-950" />
                          OPTIMAL ROUTE ({activeRoute?.distanceKm} km • {activeRoute?.etaMinutes}m)
                        </span>
                      ) : (
                        shortestRoute && (
                          <button
                            type="button"
                            onClick={() => handleSelectRoute(shortestRoute.id)}
                            className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow transition-all cursor-pointer font-mono"
                            title="Click to switch back to optimal driving route"
                          >
                            <Zap className="w-3 h-3 text-yellow-300" />
                            Switch to Optimal ({shortestRoute.distanceKm} km • {shortestRoute.etaMinutes}m)
                          </button>
                        )
                      )}
                      {isTrafficPoliceGranted && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase" style={{ backgroundColor: activeRoute?.color }}>
                          🟢 CLEARANCE ACTIVE • {activeRoute?.colorName}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Origin: <b style={{ color: activeRoute?.color }}>{activeRoute?.dirName} Base ({activeRoute?.corridorName})</b> ➔ Dest: <b className="text-white">{legDestination.label}</b>
                    </div>
                    {/* Live ETA, Distance and Real-Time GPS chips */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap font-mono text-xs">
                      <div className="px-2.5 py-0.5 rounded-lg bg-cyan-950/90 border border-cyan-700/80 text-cyan-300 font-bold flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ETA: <b className="text-white">{liveProgress?.etaRemainingMinutes ?? activeRoute?.etaMinutes ?? 5} mins</b></span>
                      </div>
                      <div className="px-2.5 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 font-bold flex items-center gap-1.5 shadow-sm">
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Distance: <b className="text-white">{liveProgress?.distanceRemainingKm ?? activeRoute?.distanceKm ?? 2.1} km</b></span>
                      </div>
                      <div className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1">
                        <span>Speed: <b className="text-white">{activeRoute?.avgSpeedKmh || 55} km/h</b></span>
                      </div>
                      <div className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 text-[11px] flex items-center gap-1">
                        <span>GPS: <b className="text-white">{liveProgress?.lat ? `${liveProgress.lat.toFixed(4)}° N, ${liveProgress.lng.toFixed(4)}° E` : `${activeAmbOrigin.lat.toFixed(4)}° N, ${activeAmbOrigin.lng.toFixed(4)}° E`}</b></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateInGoogleMapsApp(legDestination.lat, legDestination.lng, liveProgress?.lat || activeAmbOrigin.lat, liveProgress?.lng || activeAmbOrigin.lng)}
                    className="px-2.5 py-1.5 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1 shadow-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: activeRoute?.color || '#2563EB' }}
                    title="Open GPS Navigation for this vehicle in Google Maps App"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open in App</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode('interactive')}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    title="Switch to Interactive Google Maps with Live Moving Ambulances"
                  >
                    <Map className="w-3 h-3 text-cyan-400" />
                    <span>Live Map</span>
                  </button>
                </div>
              </div>

              {/* Quick Ambulance Number Selector inside Google Directions when multiple ambulances active */}
              {selectedAmbulanceRoutes.length > 1 && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Click Ambulance to Change Route:</span>
                  {selectedAmbulanceRoutes.map(r => {
                    const isSelected = activeRoute?.id === r.id || activeRoute?.ambulanceId === r.ambulanceId;
                    const isShortest = r.id === shortestRoute?.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectRoute(r.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all border whitespace-nowrap ${
                          isSelected
                            ? 'ring-2 text-white shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                        }`}
                        style={isSelected ? {
                          backgroundColor: `${r.color}35`,
                          borderColor: r.color,
                          boxShadow: `0 0 8px ${r.color}50`,
                          color: '#ffffff'
                        } : {}}
                        title={`Switch Google Directions, ETA and Distance to ${r.shortName}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                        <span>{r.shortName}</span>
                        <span className="px-1 py-0.2 rounded font-mono font-bold bg-black/50 text-cyan-300 text-[9px]">
                          {r.etaMinutes}m • {r.distanceKm}km
                        </span>
                        <span>{r.dirArrow} {r.dirBadge}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View B: Tactical Leaflet Map with Fleet Telemetry */}
        <div
          ref={mapContainerRef}
          className={`w-full transition-opacity duration-200 ${mapMode === 'tactical' ? 'dark-theme tactical-dark-mode' : ''}`}
          style={{
            display: mapMode === 'google-directions' ? 'none' : 'block',
            height: height || '520px',
            minHeight: '400px',
            width: '100%',
            background: mapMode === 'tactical' ? '#0b1329' : '#e2e8f0'
          }}
        />



        {/* Floating Offline GIS Cache Badge */}
        {networkMode !== 'online' && (
          <div className="absolute top-3 right-3 z-[1000] bg-indigo-950/90 backdrop-blur-md border border-indigo-500/60 rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-2 text-xs pointer-events-none animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="font-mono font-bold text-indigo-200 text-[11px]">
              OFFLINE VECTOR GIS CACHE ACTIVE
            </span>
            <span className="text-[9px] font-mono text-cyan-300 border-l border-indigo-700 pl-2">
              9 Sats • HDOP 0.8
            </span>
          </div>
        )}

        {/* Floating Route & Traffic HUD Overlay */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2.5 pointer-events-auto">
          {/* Header Tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${isTrafficPoliceGranted ? 'bg-emerald-400' : 'bg-blue-400'} animate-ping`}></span>
              <span className="font-black text-white text-xs flex items-center gap-1">
                {selectedAmbulanceRoutes.length > 1 ? (
                  <span className={isTrafficPoliceGranted ? 'text-emerald-400' : 'text-cyan-400'}>
                    {isTrafficPoliceGranted
                      ? `🟢 FLEET GREEN WAVE ACTIVE (${selectedAmbulanceRoutes.length} UNITS)`
                      : `🚑 FLEET EN ROUTE (${selectedAmbulanceRoutes.length} UNITS CONVERGING)`}
                  </span>
                ) : (
                  <span className={isTrafficPoliceGranted ? 'text-emerald-400' : 'text-blue-400'}>
                    {isTrafficPoliceGranted ? '🟢 FASTEST GREEN ROUTE ACTIVE' : `🚑 UNIT 1 EN ROUTE (${activeRoute?.dirName || 'West'} Corridor)`}
                  </span>
                )}
              </span>
            </div>
            <span className={`font-mono font-extrabold px-2 py-0.5 rounded border text-xs ${
              isTrafficPoliceGranted
                ? 'text-emerald-400 bg-emerald-950 border-emerald-800'
                : 'text-cyan-400 bg-slate-950 border-slate-800'
            }`}>
              ETA: {liveProgress?.etaRemainingMinutes ?? 5} MINS
            </span>
          </div>

          {/* Traffic Police Permission Clearance Status */}
          <div className={`p-2 rounded-xl border flex items-center justify-between text-[11px] ${
            isTrafficPoliceGranted
              ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300'
              : 'bg-blue-950/80 border-blue-600/70 text-blue-300'
          }`}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTrafficPoliceGranted ? 'bg-emerald-400' : 'bg-blue-400 animate-ping'}`}></span>
              <span className="font-bold">
                {isTrafficPoliceGranted
                  ? 'Traffic Police: PERMISSION GRANTED (Routes GREEN)'
                  : (canShowClearanceButton ? 'Traffic Police: PERMISSION REQUIRED' : 'Traffic Police: Signals Synchronized')}
              </span>
            </div>
            {canShowClearanceButton ? (
              <button
                type="button"
                onClick={() => {
                  if (toggleTrafficPolicePermission) {
                    toggleTrafficPolicePermission(activeEmergency?.id, !isTrafficPoliceGranted);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase transition-all shadow ${
                  isTrafficPoliceGranted
                    ? 'bg-emerald-800 hover:bg-emerald-700 text-white ring-1 ring-emerald-400'
                    : 'bg-blue-600 hover:bg-blue-500 text-white ring-1 ring-blue-400'
                }`}
              >
                {isTrafficPoliceGranted ? 'Clearance Active' : 'Grant Clearance'}
              </button>
            ) : (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                {isTrafficPoliceGranted ? '🟢 Green Wave Active' : 'Normal Traffic Cycle'}
              </span>
            )}
          </div>

          {/* Responding Ambulance Fleet Color Legend */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-between">
              <span>Selected Fleet ({selectedAmbulanceRoutes.length} {selectedAmbulanceRoutes.length === 1 ? 'Unit' : 'Units'} Converging from Different Directions):</span>
              <span className={isTrafficPoliceGranted ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                {isTrafficPoliceGranted ? '🟢 Clearance Active: Different Shades of Green' : '⚡ Distinct Colors & Converging Directions'}
              </span>
            </div>
            <div className={`grid gap-1.5 ${
              selectedAmbulanceRoutes.length === 1 ? 'grid-cols-1' :
              selectedAmbulanceRoutes.length === 2 ? 'grid-cols-2' :
              selectedAmbulanceRoutes.length === 3 ? 'grid-cols-3' :
              selectedAmbulanceRoutes.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            }`}>
              {selectedAmbulanceRoutes.map(r => {
                const isSelected = activeRoute?.id === r.id || activeRoute?.ambulanceId === r.ambulanceId;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRoute(r.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border text-[10px] cursor-pointer transition-all hover:scale-[1.02] ${
                      isSelected ? 'ring-2 ring-white/70 shadow-md' : 'border-slate-800 hover:border-slate-600'
                    }`}
                    style={{ borderLeftColor: r.color, borderLeftWidth: 3 }}
                    title={`Click to select ${r.ambulance.plateNumber || r.ambulance.id} (${r.dirName}) and change location in Google Directions`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: r.color }}></span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-bold text-white truncate">{r.ambulance.plateNumber || r.ambulance.id}</span>
                      <span className="text-[9px] font-semibold truncate" style={{ color: r.color }}>
                        {r.dirArrow} {r.dirName}
                      </span>
                    </div>
                    <div className="flex flex-col items-end ml-auto font-mono text-[9px] font-bold leading-tight">
                      <span className="text-cyan-400">{r.etaMinutes}m</span>
                      <span className="text-emerald-400">{r.distanceKm}km</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Telemetry Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Distance Left: <b className="text-white font-mono">{liveProgress?.distanceRemainingKm ?? activeRoute?.distanceKm ?? 2.1} km</b></span>
              <span>Speed: <b className="text-white font-mono">{activeRoute?.avgSpeedKmh || 58} km/h</b></span>
              <span>Progress: <b className="text-emerald-400 font-mono">{liveProgress?.progressPercent ?? 35}%</b></span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isTrafficPoliceGranted
                    ? 'bg-gradient-to-r from-emerald-500 to-green-300'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
                style={{ width: `${liveProgress?.progressPercent ?? 35}%` }}
              />
            </div>
          </div>

          {/* Current Turn-by-Turn Instruction */}
          <div className="pt-2 border-t border-slate-800 flex items-start gap-2">
            <div className={`w-6 h-6 rounded-lg ${isTrafficPoliceGranted ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-blue-950 border-blue-800 text-blue-400'} border flex items-center justify-center shrink-0 mt-0.5`}>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Next Tactical Maneuver:</div>
              <div className="text-xs font-semibold text-white truncate">
                {liveProgress?.currentManeuver?.instruction || (typeof liveProgress?.currentManeuver === 'string' ? liveProgress.currentManeuver : 'Following Fastest Route toward Destination')}
              </div>
              <div className={`text-[10px] font-mono mt-0.5 ${isTrafficPoliceGranted ? 'text-emerald-400' : 'text-blue-300'}`}>
                {activeRoute?.trafficStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
