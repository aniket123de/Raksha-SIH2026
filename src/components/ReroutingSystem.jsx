import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  Radar,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Zap,
  Radio,
  RotateCcw,
  Activity,
  Clock,
  ArrowRight,
  AlertOctagon,
  Ambulance,
  Eye,
  Wifi,
  Signal,
  Car,
  TrendingUp,
  Bell,
  Shield,
  ChevronRight,
  RefreshCw,
  Route,
  Info,
  X,
  Volume2,
  VolumeX,
  Layers,
  Sliders,
  Send,
  Check
} from 'lucide-react';

// ─── Route Definitions with Traffic Speed & Delay Profile ────────────────────
const ROUTES = {
  primary: {
    id: 'primary',
    name: 'Outer Ring Road Express',
    type: 'Primary Arterial Expressway',
    distance: '2.8 km',
    eta: '5.0 mins',
    etaMins: 5.0,
    speedLimit: '65 km/h',
    normalSpeed: '58 km/h',
    congestedSpeed: '4 km/h',
    congestionIndex: 91, // %
    signalsCount: 4,
    color: 'emerald',
    segments: [
      { name: 'Station Exit → Outer Ring Ramp', dist: '450 m', speed: '40 km/h', signal: 'GREEN', clear: true },
      { name: 'Outer Ring Road Main Express', dist: '1.2 km', speed: '65 km/h', signal: 'GREEN', clear: false, blockedNote: 'Obstacle @ KM 4.2' },
      { name: 'Right Flyover Slipway', dist: '650 m', speed: '45 km/h', signal: 'GREEN', clear: true },
      { name: 'Trauma Bay Approach Corridor', dist: '300 m', speed: '20 km/h', signal: 'GREEN', clear: true },
    ]
  },
  bypass: {
    id: 'bypass',
    name: 'Barapullah Elevated Bypass',
    type: 'Grade-Separated Alternative Corridor',
    distance: '3.1 km',
    eta: '5.4 mins',
    etaMins: 5.4,
    speedLimit: '70 km/h',
    normalSpeed: '68 km/h',
    congestedSpeed: '62 km/h',
    congestionIndex: 12, // %
    signalsCount: 2,
    color: 'cyan',
    segments: [
      { name: 'Station Exit → Barapullah Direct Entry', dist: '600 m', speed: '38 km/h', signal: 'GREEN', clear: true },
      { name: 'Barapullah Elevated High-Speed Flyover', dist: '1.8 km', speed: '70 km/h', signal: 'GREEN', clear: true },
      { name: 'Dedicated Medical Slip Ramp', dist: '400 m', speed: '42 km/h', signal: 'GREEN', clear: true },
      { name: 'Trauma Center Express Approach', dist: '300 m', speed: '20 km/h', signal: 'GREEN', clear: true },
    ]
  },
  inner: {
    id: 'inner',
    name: 'Inner City Arterial Link (Avoid)',
    type: 'Surface Commercial Arterial',
    distance: '4.1 km',
    eta: '14.0 mins',
    etaMins: 14.0,
    speedLimit: '40 km/h',
    normalSpeed: '22 km/h',
    congestedSpeed: '8 km/h',
    congestionIndex: 94, // %
    signalsCount: 9,
    color: 'rose',
    segments: [
      { name: 'Old City Commercial Boulevard', dist: '1.1 km', speed: '18 km/h', signal: 'RED', clear: false },
      { name: 'Market Central Bottleneck', dist: '1.3 km', speed: '10 km/h', signal: 'RED', clear: false },
      { name: 'Suburban 4-Way Crossing Gridlock', dist: '1.2 km', speed: '8 km/h', signal: 'RED', clear: false },
      { name: 'Hospital Gate Final Turn', dist: '500 m', speed: '20 km/h', signal: 'AMBER', clear: true },
    ]
  }
};

// ─── Obstacle Presets ────────────────────────────────────────────────────────
const OBSTACLE_PRESETS = {
  'stalled-truck': {
    title: 'Stalled Commercial Heavy Truck',
    distance: 38.4, // meters
    lane: 'Primary Expressway Lane 2 & 3',
    elevation: '+2.4m',
    severity: 'CRITICAL',
    ptsReflected: 3140,
    confidence: '99.4%',
    impact: 'Complete lane blockage @ 38.4m. Zero forward vehicle passage.',
    trafficDelay: '18 mins standstill'
  },
  'traffic-jam': {
    title: 'Severe Multi-Vehicle Gridlock & Pileup',
    distance: 45.2,
    lane: 'All Inbound Expressway Lanes',
    elevation: '+1.9m',
    severity: 'CRITICAL',
    ptsReflected: 4200,
    confidence: '99.9%',
    impact: 'Total arterial jam. Speed 0 km/h. Multiple vehicles entangled.',
    trafficDelay: '22 mins gridlock'
  },
  'waterlog': {
    title: 'Flash Flood / Road Underpass Waterlogging',
    distance: 29.0,
    lane: 'Underpass Both Directions',
    elevation: '-0.4m depth / +0.8m splash',
    severity: 'CRITICAL',
    ptsReflected: 2450,
    confidence: '98.1%',
    impact: 'Water depth > 45cm. Extreme engine hydro-lock & stall risk.',
    trafficDelay: '15 mins delay'
  },
  'debris': {
    title: 'Fallen Construction Concrete Barrier',
    distance: 52.1,
    lane: 'Center Lane & Shoulder Barrier',
    elevation: '+1.1m',
    severity: 'HIGH',
    ptsReflected: 1890,
    confidence: '97.8%',
    impact: 'High-speed hazard. Puncture & rollover threat.',
    trafficDelay: '12 mins bottleneck'
  }
};

// ─── Initial Nearby Fleet ───────────────────────────────────────────────────
const INITIAL_FLEET = [
  { id: 'AMB-02', plate: 'WB-02-AMB-1892', type: 'Advanced Life Support (ALS)', driver: 'Rajesh Kumar', distKm: '1.2 km', lat: 22.5748, lng: 88.3621, status: 'En Route', route: 'primary', notified: false, speed: 52 },
  { id: 'AMB-03', plate: 'WB-03-AMB-7734', type: 'Basic Life Support (BLS)', driver: 'Priya Sharma', distKm: '2.4 km', lat: 22.5702, lng: 88.3590, status: 'En Route', route: 'primary', notified: false, speed: 48 },
  { id: 'AMB-04', plate: 'WB-04-AMB-5501', type: 'Advanced Life Support (ALS)', driver: 'Amit Roy', distKm: '3.7 km', lat: 22.5659, lng: 88.3556, status: 'Standby / En Route', route: 'primary', notified: false, speed: 60 },
  { id: 'AMB-05', plate: 'WB-05-AMB-9923', type: 'Neonatal ICU Transport', driver: 'Sunita Das', distKm: '4.8 km', lat: 22.5810, lng: 88.3700, status: 'Available Fleet', route: 'primary', notified: false, speed: 0 },
];

// ─── Live GPS Waypoints ──────────────────────────────────────────────────────
const GPS_TRACK = [
  { lat: 22.5730, lng: 88.3639, name: 'Outer Ring Exit' },
  { lat: 22.5736, lng: 88.3644, name: 'Flyover Merge Ramp' },
  { lat: 22.5742, lng: 88.3650, name: 'Barapullah Junction' },
  { lat: 22.5749, lng: 88.3658, name: 'Elevated High-Speed Deck' },
  { lat: 22.5756, lng: 88.3665, name: 'Descent Slip Ramp' },
  { lat: 22.5762, lng: 88.3672, name: 'Hospital Trauma Corridor' },
  { lat: 22.5768, lng: 88.3679, name: 'Emergency Bay Entrance' },
];

// ─── Pre-Alert Traffic Corridor & GPS Radar Visualizer ─────────────────────
const PreAlertRadarCanvas = ({ viewMode, hasObstacle, obstacleData, activeRoute }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const simProgressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;

    const render = () => {
      angle = (angle + 0.04) % (Math.PI * 2);
      const W = canvas.width;
      const H = canvas.height;

      // Dark Spatial Grid
      ctx.fillStyle = '#060c18';
      ctx.fillRect(0, 0, W, H);

      const originX = W / 2;
      const originY = H * 0.82; // Ego-vehicle position
      const horizonY = H * 0.18;

      if (viewMode === '2.5D') {
        // ─── 2.5D PERSPECTIVE ISOMETRIC ROAD & TRAFFIC RADAR SCANNER ─────────
        // Vanishing Perspective grid
        ctx.strokeStyle = 'rgba(15, 45, 80, 0.4)';
        ctx.lineWidth = 1;
        for (let x = -W * 0.6; x <= W * 1.6; x += 40) {
          ctx.beginPath();
          ctx.moveTo(originX, horizonY);
          ctx.lineTo(x, H);
          ctx.stroke();
        }

        // Horizontal distance rungs
        for (let i = 1; i <= 8; i++) {
          const depthRatio = Math.pow(i / 8, 1.8);
          const py = horizonY + (originY - horizonY) * depthRatio;
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(20, 90, 160, 0.4)' : 'rgba(15, 60, 110, 0.2)';
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(W, py);
          ctx.stroke();

          if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(70, 160, 240, 0.55)';
            ctx.font = '9px monospace';
            const distM = (9 - i) * 18;
            ctx.fillText(`${distM}m`, 15, py - 3);
            ctx.fillText(`${distM}m`, W - 42, py - 3);
          }
        }

        // Road corridor boundary
        const leftKerb = originX - 130;
        const rightKerb = originX + 130;
        const roadFarLeft = originX - 32;
        const roadFarRight = originX + 32;

        // Primary Corridor (Straight)
        ctx.fillStyle = hasObstacle ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.15)';
        ctx.strokeStyle = hasObstacle ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftKerb, originY);
        ctx.lineTo(roadFarLeft, horizonY);
        ctx.lineTo(roadFarRight, horizonY);
        ctx.lineTo(rightKerb, originY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Road centerline
        ctx.strokeStyle = hasObstacle ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX, horizonY);
        ctx.stroke();
        ctx.setLineDash([]);

        // IF OBSTACLE DETECTED -> Draw Alternative Bypass Corridor branching right!
        if (hasObstacle) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.95)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(originX + 20, originY - 35);
          ctx.bezierCurveTo(originX + 110, originY - 90, originX + 210, horizonY + 110, originX + 250, horizonY + 20);
          ctx.lineTo(originX + 210, horizonY + 15);
          ctx.bezierCurveTo(originX + 170, horizonY + 95, originX + 75, originY - 80, originX - 10, originY - 30);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Animated Bypass Arrow Flow
          const flow = (Date.now() / 15) % 60;
          ctx.strokeStyle = '#38bdf8';
          ctx.setLineDash([10, 12]);
          ctx.lineDashOffset = -flow;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(originX + 10, originY - 30);
          ctx.bezierCurveTo(originX + 90, originY - 85, originX + 190, horizonY + 100, originX + 230, horizonY + 18);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        }

        // Point cloud points
        for (let p = 0; p < 180; p++) {
          const pz = (p % 15) / 15;
          const py = horizonY + (originY - horizonY) * Math.pow(pz, 1.8);
          const span = (leftKerb - rightKerb) * pz;
          const px = originX + (Math.sin(p * 47) * span * 0.45);
          ctx.fillStyle = p % 6 === 0 ? 'rgba(56, 189, 248, 0.7)' : 'rgba(20, 184, 166, 0.4)';
          ctx.fillRect(px, py, 2, 2);
        }

        // DRAW 2.5D BOUNDING BOX IF OBSTACLE ACTIVE
        if (hasObstacle && obstacleData) {
          const obsDepth = 0.52;
          const obsBaseY = horizonY + (originY - horizonY) * obsDepth;
          const obsX = originX - 8;
          const obsW = 76;
          const obsH = 46;
          const extrudeZ = 22;

          // Ground footprint
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(obsX - obsW / 2, obsBaseY - obsH / 2, obsW, obsH);
          ctx.fill();
          ctx.stroke();

          // Isometric 2.5D box
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.rect(obsX - obsW / 2, obsBaseY - obsH / 2 - extrudeZ, obsW, obsH);
          ctx.stroke();

          // Connectors
          ctx.beginPath();
          ctx.moveTo(obsX - obsW / 2, obsBaseY - obsH / 2);
          ctx.lineTo(obsX - obsW / 2, obsBaseY - obsH / 2 - extrudeZ);
          ctx.moveTo(obsX + obsW / 2, obsBaseY - obsH / 2);
          ctx.lineTo(obsX + obsW / 2, obsBaseY - obsH / 2 - extrudeZ);
          ctx.moveTo(obsX - obsW / 2, obsBaseY + obsH / 2);
          ctx.lineTo(obsX - obsW / 2, obsBaseY + obsH / 2 - extrudeZ);
          ctx.moveTo(obsX + obsW / 2, obsBaseY + obsH / 2);
          ctx.lineTo(obsX + obsW / 2, obsBaseY + obsH / 2 - extrudeZ);
          ctx.stroke();

          // Obstacle Point Cluster inside Box
          for (let k = 0; k < 45; k++) {
            const kx = obsX - obsW / 2 + 5 + Math.random() * (obsW - 10);
            const ky = obsBaseY - obsH / 2 - extrudeZ + Math.random() * (obsH + extrudeZ);
            ctx.fillStyle = Math.random() > 0.3 ? '#fca5a5' : '#ef4444';
            ctx.fillRect(kx, ky, 2.5, 2.5);
          }

          // Target Crosshair
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(obsX, obsBaseY - extrudeZ / 2, 13, 0, Math.PI * 2);
          ctx.stroke();

          // Detection HUD Banner
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(obsX + 46, obsBaseY - extrudeZ - 32, 168, 50, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`🚨 ROAD BLOCKED: ${obstacleData.distance}m`, obsX + 54, obsBaseY - extrudeZ - 18);
          ctx.fillStyle = '#f87171';
          ctx.font = '9px sans-serif';
          ctx.fillText(obstacleData.title.slice(0, 24), obsX + 54, obsBaseY - extrudeZ - 5);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`PRE-ALERT BYPASS ACTIVE`, obsX + 54, obsBaseY - extrudeZ + 8);
        }

      } else {
        // ─── TOP-DOWN RADAR POINT CLOUD VIEW ─────────────────────────────────
        const radarCenterY = H / 2;
        const maxR = Math.min(W, H) * 0.42;

        [0.25, 0.5, 0.75, 1.0].forEach((ratio, idx) => {
          const r = maxR * ratio;
          ctx.strokeStyle = idx === 3 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 58, 138, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(originX, radarCenterY, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.font = '9px monospace';
          ctx.fillText(`${Math.round(ratio * 150)}m`, originX + 6, radarCenterY - r + 10);
        });

        // 360 Sweep Conic
        const sweepGrd = ctx.createConicGradient(angle, originX, radarCenterY);
        sweepGrd.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        sweepGrd.addColorStop(0.12, 'rgba(6, 182, 212, 0.05)');
        sweepGrd.addColorStop(0.15, 'transparent');
        sweepGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = sweepGrd;
        ctx.beginPath();
        ctx.arc(originX, radarCenterY, maxR, 0, Math.PI * 2);
        ctx.fill();

        // Laser beam
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originX, radarCenterY);
        ctx.lineTo(originX + Math.cos(angle) * maxR, radarCenterY + Math.sin(angle) * maxR);
        ctx.stroke();

        // Obstacle in Top-Down
        if (hasObstacle && obstacleData) {
          const obsDistPx = (obstacleData.distance / 150) * maxR;
          const obsX = originX;
          const obsY = radarCenterY - obsDistPx;

          ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.beginPath();
          ctx.arc(obsX, obsY, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(obsX, obsY, 14 + Math.sin(Date.now() / 150) * 3, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`OBSTACLE ${obstacleData.distance}m`, obsX + 16, obsY + 3);
        }
      }

      // EGO-AMBULANCE VEHICLE AT ORIGIN
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(originX - 16, originY - 14, 32, 28, 5);
      ctx.fill();
      ctx.stroke();

      // Red Cross on Ambulance Roof
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(originX - 2, originY - 8, 4, 16);
      ctx.fillRect(originX - 8, originY - 2, 16, 4);

      // GPS Ego-Vehicle Emitter (Gold / Cyan)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(originX, originY - 16, 4, 0, Math.PI * 2);
      ctx.fill();

      // Sensor Emitter Waves
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(originX, originY - 16, 8 + (Date.now() / 45) % 20, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, [viewMode, hasObstacle, obstacleData, activeRoute]);

  return (
    <canvas
      ref={canvasRef}
      width={720}
      height={380}
      className="w-full h-[320px] sm:h-[380px] block rounded-2xl bg-slate-950"
    />
  );
};

// ─── Main Component: Pre-Alert Vehicles System ──────────────────────────────
export const ReroutingSystem = ({
  ambulance,
  activeEmergency,
  ambulances = [],
  addNotification,
  lidarState,
  preAlertState,
  onLidarChange,
  onPreAlertChange
}) => {
  const currentExternalState = preAlertState || lidarState;
  const notifyExternalChange = onPreAlertChange || onLidarChange;

  // ── Core Rerouting State ──────────────────────────────────────────────────
  const [hasObstacle, setHasObstacle] = useState(currentExternalState?.hasObstacle ?? true);
  const [obstacleType, setObstacleType] = useState('stalled-truck');
  const [activeRoute, setActiveRoute] = useState(currentExternalState?.hasObstacle ? 'bypass' : 'primary');
  const [previousRoute, setPreviousRoute] = useState('primary');
  const [isRerouting, setIsRerouting] = useState(false);
  const [viewMode, setViewMode] = useState('2.5D'); // '2.5D' | 'radar'
  const [autoSimLoop, setAutoSimLoop] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);

  // ── Fleet & Broadcast State ───────────────────────────────────────────────
  const [nearbyFleet, setNearbyFleet] = useState(INITIAL_FLEET);
  const [latestAlert, setLatestAlert] = useState({
    id: 'INIT',
    time: new Date().toLocaleTimeString(),
    type: 'broadcast',
    title: 'Road Blockage Detected — Auto-Fleet Pre-Alert Sent',
    message: 'Road blocked at Outer Ring Road KM 4.2. All 4 nearby ambulances automatically pre-alerted and rerouted to Barapullah Elevated Bypass.',
    savedTime: '6.4 mins'
  });
  const [showToastAlert, setShowToastAlert] = useState(true);
  const [alertLog, setAlertLog] = useState([
    {
      id: 'ALT-101',
      time: new Date().toLocaleTimeString(),
      severity: 'CRITICAL',
      type: 'ROAD_BLOCKAGE_PREALERT',
      fromUnit: 'AMB-01',
      recipients: 'AMB-02, AMB-03, AMB-04, AMB-05',
      routeAdopted: 'Barapullah Elevated Bypass',
      latency: '24 ms',
      status: 'DELIVERED & ACKNOWLEDGED'
    }
  ]);

  // ── GPS Telemetry Stream ──────────────────────────────────────────────────
  const [gpsIdx, setGpsIdx] = useState(0);
  const [currentGps, setCurrentGps] = useState(GPS_TRACK[0]);
  const [gpsSpeed, setGpsSpeed] = useState(58);
  const [gpsHeading, setGpsHeading] = useState(45);
  const [satellites, setSatellites] = useState(11);
  const [missionElapsed, setMissionElapsed] = useState(148); // seconds

  const currentObstacle = OBSTACLE_PRESETS[obstacleType] || OBSTACLE_PRESETS['stalled-truck'];

  // ── Sync with external blockage state ────────────────────────────────────
  useEffect(() => {
    if (currentExternalState && currentExternalState.hasObstacle !== undefined && currentExternalState.hasObstacle !== hasObstacle) {
      if (currentExternalState.hasObstacle) {
        triggerBlockage('stalled-truck', false);
      } else {
        clearBlockage(false);
      }
    }
  }, [currentExternalState]);

  // ── GPS Simulation Loop ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setGpsIdx(prev => {
        const next = (prev + 1) % GPS_TRACK.length;
        setCurrentGps(GPS_TRACK[next]);
        return next;
      });
      setMissionElapsed(s => s + 2);
      // Realistic speed variation
      setGpsSpeed(prev => {
        const target = hasObstacle ? 66 : 58;
        return target + Math.floor(Math.random() * 7) - 3;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [hasObstacle]);

  // ── Core: Trigger Road Blockage / Traffic Jam & Auto-Notify Fleet ─────────
  const triggerBlockage = useCallback((typeKey = 'stalled-truck', notifyParent = true) => {
    setIsRerouting(true);
    setObstacleType(typeKey);
    const obs = OBSTACLE_PRESETS[typeKey] || OBSTACLE_PRESETS['stalled-truck'];
    setHasObstacle(true);
    setPreviousRoute('primary');

    setTimeout(() => {
      setActiveRoute('bypass');
      setIsRerouting(false);

      const timestamp = new Date().toLocaleTimeString();
      const alertMsg = `⚠️ ROAD BLOCKED: ${obs.title} detected @ ${obs.distance}m. Outer Ring Road suspended. Switched to Barapullah Bypass.`;

      // 1. AUTOMATIC FLEET-WIDE PRE-ALERT NOTIFICATION
      setNearbyFleet(prev => prev.map(a => ({
        ...a,
        route: 'bypass',
        notified: true,
        notifiedAt: timestamp,
        status: 'Rerouted via Bypass'
      })));

      // 2. Alert Log Entry
      const newLog = {
        id: `ALT-${Date.now()}`,
        time: timestamp,
        severity: 'CRITICAL',
        type: typeKey === 'traffic-jam' ? 'TRAFFIC_JAM_GRIDLOCK' : 'ROAD_BLOCKAGE_PREALERT',
        fromUnit: ambulance?.plateNumber || 'AMB-01',
        recipients: 'AMB-02, AMB-03, AMB-04, AMB-05',
        routeAdopted: 'Barapullah Elevated Bypass',
        latency: '18 ms (VHF Mesh)',
        status: 'AUTO-BROADCAST ACKNOWLEDGED'
      };
      setAlertLog(l => [newLog, ...l.slice(0, 9)]);

      // 3. Instant On-Screen Toast Alert
      setLatestAlert({
        id: newLog.id,
        time: timestamp,
        type: 'blockage',
        title: `🚨 AUTOMATIC FLEET PRE-ALERT: Road Blocked (${obs.title})`,
        message: `4 nearby ambulances automatically notified & rerouted to Barapullah Bypass. Delay avoided: ${obs.trafficDelay}.`,
        savedTime: '6.4 mins'
      });
      setShowToastAlert(true);

      // 4. Global Context Notification
      if (addNotification) {
        addNotification(
          '🚨 Pre-Alert: Traffic Blockage on Primary Route',
          `Obstacle detected @ ${obs.distance}m. All nearby ambulances alerted and diverted to Barapullah Bypass. Time saved: 6.4 mins.`,
          'warning',
          'ambulance'
        );
      }

      // 5. Parent state callback
      if (notifyParent && notifyExternalChange) {
        notifyExternalChange({
          hasObstacle: true,
          activeRoute: 'bypass',
          bypassedVia: 'Barapullah Elevated Bypass (Corridor B)',
          timeSaved: '6.4 mins',
          obstacle: obs
        });
      }
    }, 450);
  }, [ambulance, addNotification, notifyExternalChange]);

  // ── Core: Clear Obstacle & Return to Previous Route ───────────────────────
  const clearBlockage = useCallback((notifyParent = true) => {
    setIsRerouting(true);

    setTimeout(() => {
      setHasObstacle(false);
      // When the road blockage is cleared it follows the previous route
      setActiveRoute('primary');
      setIsRerouting(false);

      const timestamp = new Date().toLocaleTimeString();

      // 1. REVERT NEARBY FLEET BACK TO PRIMARY ROUTE
      setNearbyFleet(prev => prev.map(a => ({
        ...a,
        route: 'primary',
        notified: true,
        notifiedAt: timestamp,
        status: 'En Route (Primary Route 1)'
      })));

      // 2. Alert Log Entry for Clearance
      const newLog = {
        id: `ALT-CLR-${Date.now()}`,
        time: timestamp,
        severity: 'SUCCESS',
        type: 'ROAD_BLOCKAGE_CLEARED',
        fromUnit: ambulance?.plateNumber || 'AMB-01',
        recipients: 'AMB-02, AMB-03, AMB-04, AMB-05',
        routeAdopted: 'Outer Ring Road (Previous Route Restored)',
        latency: '15 ms (VHF Mesh)',
        status: 'CORRIDOR RESTORED'
      };
      setAlertLog(l => [newLog, ...l.slice(0, 9)]);

      // 3. Instant On-Screen Toast Alert
      setLatestAlert({
        id: newLog.id,
        time: timestamp,
        type: 'clear',
        title: '✅ Corridor Clear: Previous Route Restored',
        message: 'Hazard removed. All nearby ambulances automatically informed. Resumed Outer Ring Road Express.',
        savedTime: null
      });
      setShowToastAlert(true);

      // 4. Global Context Notification
      if (addNotification) {
        addNotification(
          '✅ Corridor Clear: Primary Route Restored',
          'Road hazard cleared. Resumed previous Primary Route (Outer Ring Road Express). All nearby fleet updated.',
          'success',
          'ambulance'
        );
      }

      // 5. Parent state callback
      if (notifyParent && notifyExternalChange) {
        notifyExternalChange({
          hasObstacle: false,
          activeRoute: 'primary',
          bypassedVia: null
        });
      }
    }, 450);
  }, [ambulance, addNotification, notifyExternalChange]);

  // ── Autonomous Loop for Evaluation / Demo ─────────────────────────────────
  useEffect(() => {
    if (!autoSimLoop) return;
    const interval = setInterval(() => {
      if (hasObstacle) {
        clearBlockage(true);
      } else {
        const keys = Object.keys(OBSTACLE_PRESETS);
        const randKey = keys[Math.floor(Math.random() * keys.length)];
        triggerBlockage(randKey, true);
      }
    }, 9000);
    return () => clearInterval(interval);
  }, [autoSimLoop, hasObstacle, clearBlockage, triggerBlockage]);

  const activeRouteData = ROUTES[activeRoute];
  const primaryRouteData = ROUTES['primary'];
  const bypassRouteData = ROUTES['bypass'];

  const missionMins = Math.floor(missionElapsed / 60);
  const missionSecs = missionElapsed % 60;

  return (
    <div className="space-y-6">

      {/* ── TOP SYSTEM STATUS & TELEMETRY BANNER ─────────────────────────── */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border transition-all ${
            hasObstacle
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
              : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
          }`}>
            <Radar className="w-6 h-6 animate-spin" style={{ animationDuration: hasObstacle ? '2s' : '4s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Navigation className="w-6 h-6 text-amber-400" />
                Pre-Alert Vehicles System
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 shadow-sm ${
                isRerouting
                  ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
                  : hasObstacle
                    ? 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isRerouting ? 'bg-amber-400 animate-ping' : hasObstacle ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                {isRerouting ? '⟳ REROUTING IN PROGRESS' : hasObstacle ? '🚨 BYPASS ACTIVE (ROAD BLOCKED)' : '🟢 PRIMARY ROUTE CLEAR'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time traffic congestion & road blockage detection • Auto-broadcast to nearby fleet • Live GPS & alternative routing • Auto-restore to previous route
            </p>
          </div>
        </div>

        {/* Live GPS Telemetry Badges */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3 text-red-400" /> GPS Coordinates
            </span>
            <span className="text-xs font-bold font-mono text-white">
              {currentGps.lat.toFixed(4)}°N, {currentGps.lng.toFixed(4)}°E
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold flex items-center justify-end gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Speed & Nav
            </span>
            <span className="text-xs font-bold font-mono text-amber-400">
              {gpsSpeed} km/h • {gpsHeading}° NE
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold flex items-center justify-end gap-1">
              <Signal className="w-3 h-3 text-emerald-400" /> GNSS Lock
            </span>
            <span className="text-xs font-bold font-mono text-emerald-300">
              {satellites} Sats (HDOP 0.8)
            </span>
          </div>
        </div>
      </section>

      {/* ── INSTANT ALERT TOAST / BROADCAST NOTIFIER ─────────────────────── */}
      {showToastAlert && latestAlert && (
        <div className={`p-4 rounded-2xl border-2 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 ${
          latestAlert.type === 'clear'
            ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border-emerald-500 shadow-emerald-950/40'
            : 'bg-gradient-to-r from-rose-950/95 via-slate-900 to-cyan-950/90 border-rose-500 shadow-rose-950/50'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              latestAlert.type === 'clear'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/30 text-rose-300 border-rose-500/60 animate-pulse'
            }`}>
              {latestAlert.type === 'clear' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertOctagon className="w-5 h-5 text-rose-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-white text-sm">
                  {latestAlert.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-700">
                  {latestAlert.time}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                  Instant Fleet Broadcast
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {latestAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {latestAlert.savedTime && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Delay Prevented</span>
                <span className="text-base font-black font-mono text-cyan-300">-{latestAlert.savedTime}</span>
              </div>
            )}
            <button
              onClick={() => setShowToastAlert(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN 3-COLUMN WORKSPACE: VISUALIZER + CONTROLS ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT (2 Columns): SENSOR CANVAS & LIVE NAVIGATION FOLLOW ─── */}
        <div className="lg:col-span-2 space-y-5">

          {/* 1. Traffic Radar & Corridor Visualizer */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Top Canvas Controls */}
            <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="text-xs font-bold text-white font-mono bg-slate-900/85 px-2.5 py-1 rounded-xl border border-slate-700/80 backdrop-blur-md flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Real-Time Traffic Radar & Corridor Visualizer</span>
                </span>
                <span className={`text-[11px] font-mono px-2 py-1 rounded-xl border backdrop-blur-md ${
                  hasObstacle ? 'text-rose-300 bg-rose-950/85 border-rose-700' : 'text-emerald-300 bg-emerald-950/85 border-emerald-700'
                }`}>
                  {hasObstacle ? `Blockage @ ${currentObstacle.distance}m` : 'Corridor Clear (150m)'}
                </span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 backdrop-blur-md pointer-events-auto">
                <button
                  onClick={() => setViewMode('2.5D')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === '2.5D' ? 'bg-cyan-500 text-slate-950 shadow-sm font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2.5D Elevation
                </button>
                <button
                  onClick={() => setViewMode('radar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'radar' ? 'bg-cyan-500 text-slate-950 shadow-sm font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  360° Radar
                </button>
              </div>
            </div>

            {/* Canvas Rendering Component */}
            <PreAlertRadarCanvas
              viewMode={viewMode}
              hasObstacle={hasObstacle}
              obstacleData={currentObstacle}
              activeRoute={activeRoute}
            />

            {/* Bottom Canvas Telemetry Strip */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-900/85 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${hasObstacle ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
                  Following: <strong className={hasObstacle ? 'text-cyan-300' : 'text-emerald-300'}>{activeRouteData.name}</strong>
                </span>
                <span>•</span>
                <span>Live GPS Feed • 20 Hz</span>
              </div>

              <div className="flex items-center gap-3">
                <span className={hasObstacle ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {hasObstacle ? `REROUTED TO BYPASS (-6.4m)` : 'PRIMARY FASTEST NOMINAL'}
                </span>
                <span>•</span>
                <span className="text-white">ETA: {activeRouteData.eta}</span>
              </div>
            </div>
          </div>

          {/* 2. THREE ALTERNATIVE ROUTES COMPARISON & EVALUATION ENGINE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Route 1: Primary Arterial (Outer Ring Road) */}
            <div className={`p-4 rounded-2xl border transition-all relative ${
              activeRoute === 'primary'
                ? 'bg-emerald-950/70 border-2 border-emerald-500 shadow-xl ring-2 ring-emerald-500/30'
                : hasObstacle
                  ? 'bg-red-950/30 border-red-700/60 opacity-85'
                  : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  ROUTE 1 — PRIMARY
                </span>
                {hasObstacle ? (
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase animate-pulse">
                    ❌ BLOCKED @ {currentObstacle.distance}m
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px] uppercase">
                    ACTIVE (FOLLOWING)
                  </span>
                )}
              </div>

              <h3 className={`text-sm font-bold mb-1 ${hasObstacle ? 'text-red-300' : 'text-white'}`}>
                {primaryRouteData.name}
              </h3>
              
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${hasObstacle ? 'text-red-400 line-through' : 'text-emerald-400'}`}>
                  {primaryRouteData.eta}
                </span>
                <span className="text-xs text-slate-400 font-mono">{primaryRouteData.distance}</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Congestion Index:</span>
                  <span className={hasObstacle ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {hasObstacle ? '91% (Standstill)' : '18% (Green Wave)'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Speed:</span>
                  <span className="font-mono text-white">
                    {hasObstacle ? primaryRouteData.congestedSpeed : primaryRouteData.normalSpeed}
                  </span>
                </div>
                {hasObstacle && (
                  <div className="p-1.5 rounded bg-red-950/70 border border-red-800/80 text-red-300 text-[10px] font-medium mt-1">
                    ⚠️ Hazard in trajectory: {currentObstacle.title}
                  </div>
                )}
              </div>
            </div>

            {/* Route 2: Barapullah Elevated Bypass (Alternative Detour) */}
            <div className={`p-4 rounded-2xl border transition-all relative ${
              activeRoute === 'bypass'
                ? 'bg-cyan-950/70 border-2 border-cyan-400 shadow-xl ring-2 ring-cyan-500/40'
                : 'bg-slate-900/80 border-slate-800 opacity-75'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  ROUTE 2 — BYPASS DETOUR
                </span>
                {activeRoute === 'bypass' ? (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-black text-[9px] uppercase animate-pulse">
                    ⚡ ACTIVE (FOLLOWING)
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">
                    STANDBY
                  </span>
                )}
              </div>

              <h3 className={`text-sm font-bold mb-1 ${activeRoute === 'bypass' ? 'text-white' : 'text-slate-300'}`}>
                {bypassRouteData.name}
              </h3>

              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${activeRoute === 'bypass' ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {bypassRouteData.eta}
                </span>
                <span className="text-xs text-slate-400 font-mono">{bypassRouteData.distance} (+300m)</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Congestion Index:</span>
                  <span className="text-cyan-300 font-bold font-mono">12% (Clear)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Corridor Speed:</span>
                  <span className="font-mono text-cyan-400 font-bold">{bypassRouteData.normalSpeed}</span>
                </div>
                {hasObstacle && (
                  <div className="p-1.5 rounded bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 text-[10px] font-medium mt-1">
                    ✓ Avoided {currentObstacle.trafficDelay} delay
                  </div>
                )}
              </div>
            </div>

            {/* Route 3: Inner City Arterial Link (High Congestion Avoid) */}
            <div className="p-4 rounded-2xl border bg-slate-950/60 border-slate-800/80 opacity-60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  ROUTE 3 — AVOID
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 text-[9px] font-mono font-bold border border-rose-800">
                  HEAVY GRIDLOCK
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-400 mb-1">
                {ROUTES.inner.name}
              </h3>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-rose-500 line-through">
                  {ROUTES.inner.eta}
                </span>
                <span className="text-xs text-slate-500 font-mono">{ROUTES.inner.distance}</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Congestion:</span>
                  <span className="text-rose-500 font-bold font-mono">94% (Heavy)</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Speed:</span>
                  <span className="font-mono text-rose-400">{ROUTES.inner.congestedSpeed}</span>
                </div>
                <div className="text-rose-400 text-[10px]">
                  +9.0 mins commercial bottleneck delay
                </div>
              </div>
            </div>

          </div>

          {/* 3. DYNAMIC TURN-BY-TURN TACTICAL MANEUVERS (FOLLOWS ACTIVE ROUTE) */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Turn-by-Turn Maneuvers: Following {activeRouteData.name}</span>
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                activeRoute === 'bypass'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}>
                {activeRoute === 'bypass' ? '⚡ Detour Trajectory Active' : '🟢 Primary Trajectory Active'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {activeRouteData.segments.map((seg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                    i === 0
                      ? activeRoute === 'bypass'
                        ? 'bg-cyan-950/60 border-cyan-500/80 ring-1 ring-cyan-500/30'
                        : 'bg-emerald-950/60 border-emerald-500/80 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      i === 0
                        ? activeRoute === 'bypass' ? 'bg-cyan-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      0{i + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{seg.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Target Speed: <span className="text-white font-mono">{seg.speed}</span> • Signal Preemption: <span className="text-emerald-400 font-bold">{seg.signal}</span>
                        {seg.blockedNote && (
                          <span className="text-rose-400 font-bold ml-2">({seg.blockedNote})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-white font-bold text-sm block">{seg.dist}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{i === 0 ? 'Executing' : 'Upcoming'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT (1 Column): CONTROLS, FLEET STATUS & INSTANT ALERTS ── */}
        <div className="space-y-5">

          {/* 1. INTERACTIVE ROAD BLOCKAGE & TRAFFIC JAM SIMULATION CONTROLS */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Traffic Congestion & Blockage Controls</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Interactive</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Detects road blockages & traffic jams in real time, automatically pre-alerts nearby ambulances, and auto-returns to previous route upon clearance.
            </p>

            {/* Presets to simulate road blockage or traffic jam */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Simulate Road Blockage / Traffic Jam:
              </span>
              
              {Object.entries(OBSTACLE_PRESETS).map(([key, data]) => {
                const isCurrent = hasObstacle && obstacleType === key;
                return (
                  <button
                    key={key}
                    onClick={() => triggerBlockage(key, true)}
                    className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all ${
                      isCurrent
                        ? 'bg-rose-950/80 border-rose-500 text-white shadow-md shadow-rose-950 ring-1 ring-rose-500/40'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate">{data.title}</span>
                      <span className="font-mono text-[10px] text-rose-400 shrink-0 ml-2">
                        {data.distance}m
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span className="truncate">{data.impact.slice(0, 32)}...</span>
                      <span className="text-amber-400 font-mono font-bold shrink-0">{data.trafficDelay}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Obstacle Clearance Action */}
            <div className="pt-2 border-t border-slate-800/80">
              {hasObstacle ? (
                <button
                  onClick={() => clearBlockage(true)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950 flex flex-col items-center justify-center gap-1 font-mono cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span className="text-sm font-black">Clear Hazard & Resume Primary Route</span>
                  </div>
                  <span className="text-[10px] text-emerald-100 font-normal">First ambulance & fleet will follow the previous route</span>
                </button>
              ) : (
                <button
                  onClick={() => triggerBlockage('stalled-truck', true)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-950 flex items-center justify-center gap-2 font-mono"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Inject Road Blockage on Primary Route</span>
                </button>
              )}
            </div>

            {/* Autonomous Evaluation Cycle Loop */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">Autonomous Cycle Mode</span>
                <span className="text-[11px] text-slate-400">Auto-toggles hazard & clearance (9s)</span>
              </div>
              <button
                onClick={() => setAutoSimLoop(!autoSimLoop)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs font-mono transition-all ${
                  autoSimLoop ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {autoSimLoop ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 2. AUTOMATICALLY NOTIFIED NEARBY AMBULANCE FLEET */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-violet-400" />
                <span>Nearby Ambulances Auto-Notified</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                hasObstacle
                  ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}>
                {hasObstacle ? '4 Rerouted via Bypass' : '4 Following Primary'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              When road blockages or traffic jams occur, all nearby units receive an instant pre-alert broadcast and switch route immediately:
            </p>

            <div className="space-y-2">
              {nearbyFleet.map(amb => (
                <div key={amb.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${amb.route === 'bypass' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                      <span className="font-bold text-white font-mono">{amb.id}</span>
                      <span className="text-[10px] text-slate-400">({amb.plate})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      amb.route === 'bypass'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    }`}>
                      {amb.route === 'bypass' ? '⚡ Barapullah Bypass' : '🟢 Outer Ring Road'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Driver: <strong className="text-slate-200">{amb.driver}</strong></span>
                    <span>Distance: <strong className="text-amber-400 font-mono">{amb.distKm}</strong></span>
                  </div>

                  <div className="text-[10px] text-emerald-400 font-mono flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>{amb.type}</span>
                    <span>✓ Broadcast Delivered ({hasObstacle ? 'Bypass' : 'Primary'})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. REAL-TIME TRAFFIC DATA FEED */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Real-Time Traffic Congestion Data</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
                Live ITMS
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white">Outer Ring Road Express</span>
                  <span className={`font-mono font-bold ${hasObstacle ? 'text-red-400' : 'text-emerald-400'}`}>
                    {hasObstacle ? '4 km/h (91% Congestion - Blocked)' : '58 km/h (18% Light)'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${hasObstacle ? 'bg-red-500 w-[91%]' : 'bg-emerald-500 w-[18%]'}`}
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white">Barapullah Elevated Bypass</span>
                  <span className="font-mono font-bold text-cyan-300">
                    68 km/h (12% Light - Free Flow)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-400 w-[12%]" />
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white">Inner City Link</span>
                  <span className="font-mono font-bold text-rose-400">
                    8 km/h (94% Heavy Bottleneck)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500 w-[94%]" />
                </div>
              </div>
            </div>
          </div>

          {/* 4. INSTANT ALERT BROADCAST LOG */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Instant Alert Dispatch Log</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Live Feed</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {alertLog.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                    log.severity === 'CRITICAL'
                      ? 'bg-rose-950/30 border-rose-800/60'
                      : 'bg-emerald-950/30 border-emerald-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${log.severity === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {log.type}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{log.time}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Recipients: <strong className="text-white">{log.recipients}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Route: {log.routeAdopted}</span>
                    <span className="text-emerald-400 font-mono">{log.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export const PreAlertVehiclesSystem = ReroutingSystem;
export default ReroutingSystem;
