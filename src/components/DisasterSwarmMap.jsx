import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  Zap,
  Wind,
  Droplets,
  Flame,
  Activity,
  Radio,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Minus,
  MapPin,
  Layers,
  Navigation,
  ExternalLink,
  Compass,
} from 'lucide-react';
import {
  openInGoogleMapsApp,
  navigateInGoogleMapsApp,
  getGoogleMapsEmbedUrl
} from '../utils/googleMaps';

// ─── TERRAIN RADAR CANVAS ────────────────────────────────────────────────────────
// Renders a full-black radar display with:
//  • 1 large thin yellow outer boundary circle
//  • Continuous concentric rings animating (rippling) inward
//  • Colored glowing dots per disaster zone
//  • Rotating sweep line + grid overlay
function TerrainRadarCanvas({ disasters, selectedId, onSelectId }) {
  const canvasRef = useRef(null);
  const animRef  = useRef(null);
  const timeRef  = useRef(0);

  // Map lat/lng → normalised canvas coords relative to bounding box
  const project = useCallback((lat, lng, bounds, W, H) => {
    const { minLat, maxLat, minLng, maxLng } = bounds;
    const pad = 0.12;
    const x = ((lng - minLng) / (maxLng - minLng)) * W * (1 - 2 * pad) + W * pad;
    const y = ((maxLat - lat) / (maxLat - minLat)) * H * (1 - 2 * pad) + H * pad;
    return { x, y };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !disasters.length) return;
    const ctx = canvas.getContext('2d');

    // Compute bounding box of all disaster coords
    const lats = disasters.map(d => d.lat);
    const lngs = disasters.map(d => d.lng);
    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
    // Pad bounds a little so the outermost dots don't sit on the edge ring
    const latRange = (bounds.maxLat - bounds.minLat) || 0.05;
    const lngRange = (bounds.maxLng - bounds.minLng) || 0.05;
    bounds.minLat -= latRange * 0.25;
    bounds.maxLat += latRange * 0.25;
    bounds.minLng -= lngRange * 0.25;
    bounds.maxLng += lngRange * 0.25;

    const draw = (ts) => {
      timeRef.current = ts;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const outerR = Math.min(W, H) * 0.44; // big outer ring radius

      // ── Background: pure black ──────────────────────────────────────────
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      // ── Polar grid (subtle dark-green lines) ───────────────────────────
      const gridCount = 8;
      ctx.save();
      ctx.strokeStyle = 'rgba(0,255,80,0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < gridCount; i++) {
        const angle = (i / gridCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * outerR * 1.1, cy + Math.sin(angle) * outerR * 1.1);
        ctx.stroke();
      }
      ctx.restore();

      // ── Rotating sweep line ────────────────────────────────────────────
      const sweepAngle = (ts / 3000) * Math.PI * 2; // full rotation every 3 s
      const sweepLen = outerR;
      ctx.save();
      // Gradient fade on the sweep
      const sweepGrad = ctx.createConicalGradient
        ? null // not available everywhere; draw as a wedge
        : null;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      // Draw sweep as a filled arc wedge (40° arc)
      ctx.arc(cx, cy, sweepLen, sweepAngle - (40 * Math.PI / 180), sweepAngle);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,255,80,0.07)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * sweepLen, cy + Math.sin(sweepAngle) * sweepLen);
      ctx.strokeStyle = 'rgba(0,255,80,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // ── Inner concentric rings (ripple inward, thinner, yellow-ish) ────
      const ringCount = 7;
      const period = 2800; // ms for one full cycle
      const phase = (ts % period) / period; // 0→1
      for (let i = 0; i < ringCount; i++) {
        // Each ring starts at outerR and shrinks to 0 over one period,
        // staggered so they're evenly spaced
        const t = ((phase + i / ringCount) % 1);
        const r = outerR * t;
        const opacity = Math.sin(t * Math.PI) * 0.55; // fade in + fade out
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,230,0,${opacity.toFixed(3)})`;
        ctx.lineWidth = 0.8 + (1 - t) * 0.5; // slightly thicker when small
        ctx.stroke();
      }

      // ── ONE large thin outer yellow boundary circle ─────────────────────
      // Slow gentle pulse ±2%
      const pulseScale = 1 + 0.02 * Math.sin((ts / 1200) * Math.PI * 2);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * pulseScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,220,0,0.9)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(255,220,0,0.7)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // ── Disaster zone dots ──────────────────────────────────────────────
      disasters.forEach((disaster, idx) => {
        const meta = DISASTER_TYPES[disaster.type] || DISASTER_TYPES.fire;
        const { x, y } = project(disaster.lat, disaster.lng, bounds, W, H);
        const isSelected = disaster.id === selectedId;

        // Glow / pulse radius
        const pulseR = isSelected
          ? 10 + 4 * Math.abs(Math.sin((ts / 500 + idx) * Math.PI))
          : 7 + 2 * Math.abs(Math.sin((ts / 900 + idx * 0.7) * Math.PI));

        // Outer glow halo
        const grad = ctx.createRadialGradient(x, y, 0, x, y, pulseR * 2.5);
        grad.addColorStop(0, meta.color + 'cc');
        grad.addColorStop(1, meta.color + '00');
        ctx.beginPath();
        ctx.arc(x, y, pulseR * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = meta.color;
        ctx.shadowColor = meta.color;
        ctx.shadowBlur = isSelected ? 22 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // White centre dot
        ctx.beginPath();
        ctx.arc(x, y, pulseR * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();

        // Label
        ctx.font = `bold ${isSelected ? 11 : 9}px monospace`;
        ctx.fillStyle = isSelected ? '#ffe000' : 'rgba(255,255,255,0.75)';
        ctx.textAlign = 'center';
        ctx.fillText(meta.emoji, x, y - pulseR - 4);
        if (isSelected) {
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffe000';
          ctx.fillText(disaster.id, x, y + pulseR + 12);
        }
      });

      // ── Centre cross-hair ───────────────────────────────────────────────
      ctx.save();
      ctx.strokeStyle = 'rgba(0,255,80,0.30)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR * 1.05);
      ctx.lineTo(cx, cy + outerR * 1.05);
      ctx.moveTo(cx - outerR * 1.05, cy);
      ctx.lineTo(cx + outerR * 1.05, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ── HUD label ───────────────────────────────────────────────────────
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = 'rgba(255,220,0,0.55)';
      ctx.textAlign = 'left';
      ctx.fillText('TERRAIN · DISASTER RADAR', 10, 16);
      ctx.fillStyle = 'rgba(0,255,80,0.45)';
      ctx.textAlign = 'right';
      ctx.fillText(`${disasters.length} ZONES ACTIVE`, W - 10, 16);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [disasters, selectedId, project]);

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    // Initial size
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, []);

  // Click hit-test: select the nearest disaster dot
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !disasters.length) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width;
    const H = canvas.height;

    const lats = disasters.map(d => d.lat);
    const lngs = disasters.map(d => d.lng);
    const latRange = Math.max(...lats) - Math.min(...lats) || 0.05;
    const lngRange = Math.max(...lngs) - Math.min(...lngs) || 0.05;
    const bounds = {
      minLat: Math.min(...lats) - latRange * 0.25,
      maxLat: Math.max(...lats) + latRange * 0.25,
      minLng: Math.min(...lngs) - lngRange * 0.25,
      maxLng: Math.max(...lngs) + lngRange * 0.25,
    };

    let closest = null;
    let closestDist = 30; // px threshold
    disasters.forEach(d => {
      const { x, y } = project(d.lat, d.lng, bounds, W, H);
      const dist = Math.hypot(mx - x, my - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = d.id;
      }
    });
    if (closest) onSelectId(closest);
  }, [disasters, project, onSelectId]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        background: '#000',
        cursor: 'crosshair',
        zIndex: 10,
      }}
    />
  );
}

// ─── TILE PRESETS (GOOGLE MAPS DEFAULT) ──────────────────────────────────────────
const TILE_PRESETS = {
  'google-roadmap': {
    name: 'Google Maps',
    icon: '🗺️',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps'
  },
  'google-satellite': {
    name: 'Google Satellite',
    icon: '🛰️',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Satellite'
  },
  'google-terrain': {
    name: 'Google Terrain',
    icon: '🏔️',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Terrain'
  },
  'tactical-dark': {
    name: 'Tactical Dark',
    icon: '🌑',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Tactical Dark',
    className: 'tactical-dark-tiles'
  }
};

// ─── KOLKATA DISASTER ZONE DATA ────────────────────────────────────────────────
// Seeded around AJC Bose Road / Exide Crossing hub (22.5415, 88.3485)

const DISASTER_TYPES = {
  flood:          { label: 'Flash Flood',           color: '#0EA5E9', ring: '#38BDF8', emoji: '🌊', icon: 'Droplets',  severity: 'high'   },
  cyclone:        { label: 'Cyclone / Storm Surge',  color: '#8B5CF6', ring: '#A78BFA', emoji: '🌀', icon: 'Wind',      severity: 'critical'},
  fire:           { label: 'Urban Fire',             color: '#F97316', ring: '#FB923C', emoji: '🔥', icon: 'Flame',     severity: 'high'   },
  earthquake:     { label: 'Seismic Event',          color: '#EAB308', ring: '#FDE047', emoji: '🏔️', icon: 'Zap',       severity: 'critical'},
  chemical:       { label: 'Chemical Spill / HAZMAT',color: '#10B981', ring: '#34D399', emoji: '☣️', icon: 'AlertTriangle', severity: 'medium'},
  stampede:       { label: 'Mass Casualty / Stampede',color:'#EF4444', ring: '#F87171', emoji: '🚨', icon: 'Activity',  severity: 'critical'},
  landslide:      { label: 'Landslide / Collapse',  color: '#78716C', ring: '#A8A29E', emoji: '⛰️', icon: 'AlertTriangle', severity: 'high'},
  gas_leak:       { label: 'Gas Leak / Explosion',  color: '#F59E0B', ring: '#FCD34D', emoji: '💥', icon: 'Zap',       severity: 'high'   },
};

const INITIAL_DISASTERS = [
  {
    id: 'DST-001',
    type: 'flood',
    lat: 22.5600, lng: 88.3300,
    area: 'Howrah / Shyambazar Low-Lying Zone',
    affectedPeople: 4200,
    radiusMeters: 950,
    reportedAt: '14:22 IST',
    agentsDeployed: 6,
    status: 'Active',
    notes: 'Drainage overflow. Roads inundated. NDRF team en route.',
  },
  {
    id: 'DST-002',
    type: 'cyclone',
    lat: 22.5200, lng: 88.3800,
    area: 'Garden Reach / Kidderpore Port',
    affectedPeople: 11800,
    radiusMeters: 1800,
    reportedAt: '12:10 IST',
    agentsDeployed: 12,
    status: 'Critical',
    notes: 'Category 2 wind. Port Authority alerted. Evacuation underway.',
  },
  {
    id: 'DST-003',
    type: 'fire',
    lat: 22.5700, lng: 88.3600,
    area: 'Burrabazar Textile Market',
    affectedPeople: 870,
    radiusMeters: 400,
    reportedAt: '15:05 IST',
    agentsDeployed: 4,
    status: 'Contained',
    notes: 'Fire Brigade on scene. Partial structural collapse risk.',
  },
  {
    id: 'DST-004',
    type: 'stampede',
    lat: 22.5415, lng: 88.3485,
    area: 'AJC Bose Road – Exide Crossing Event Zone',
    affectedPeople: 320,
    radiusMeters: 250,
    reportedAt: '15:42 IST',
    agentsDeployed: 3,
    status: 'Critical',
    notes: 'Mass casualty incident. 40+ injuries reported. Control Room primary zone.',
  },
  {
    id: 'DST-005',
    type: 'chemical',
    lat: 22.5050, lng: 88.3350,
    area: 'Alipore Industrial Belt',
    affectedPeople: 560,
    radiusMeters: 600,
    reportedAt: '13:30 IST',
    agentsDeployed: 5,
    status: 'Active',
    notes: 'Ammonia leak from storage. HAZMAT unit deployed. 500m exclusion zone.',
  },
  {
    id: 'DST-006',
    type: 'earthquake',
    lat: 22.5750, lng: 88.4200,
    area: 'Salt Lake / Bidhannagar Sector V',
    affectedPeople: 6600,
    radiusMeters: 2200,
    reportedAt: '11:55 IST',
    agentsDeployed: 9,
    status: 'Monitoring',
    notes: 'M4.1 tremor. Building inspections ongoing. Power outages reported.',
  },
  {
    id: 'DST-007',
    type: 'gas_leak',
    lat: 22.5300, lng: 88.3250,
    area: 'Bhowanipore / Hazra Road Locality',
    affectedPeople: 1100,
    radiusMeters: 350,
    reportedAt: '16:01 IST',
    agentsDeployed: 3,
    status: 'Active',
    notes: 'LPG pipeline rupture. NDRF cordoning area. Residents evacuating.',
  },
  {
    id: 'DST-008',
    type: 'landslide',
    lat: 22.5900, lng: 88.2900,
    area: 'Uttarpara / Bally River Bank Erosion',
    affectedPeople: 780,
    radiusMeters: 500,
    reportedAt: '13:10 IST',
    agentsDeployed: 2,
    status: 'Active',
    notes: 'Riverbank collapse after heavy rain. 3 houses submerged. Rescue ongoing.',
  },
];

// ─── SWARM AGENT DOT MARKER ─────────────────────────────────────────────────────
function makeAgentIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:10px;height:10px;
      border-radius:50%;
      background:${color};
      border:2px solid rgba(255,255,255,0.85);
      box-shadow:0 0 6px ${color};
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function makeDisasterIcon(type) {
  const d = DISASTER_TYPES[type] || DISASTER_TYPES.fire;
  return L.divIcon({
    className: '',
    html: `<div style="
      font-size:22px;
      line-height:1;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    ">${d.emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ─── AUTO FIT MAP BOUNDS ────────────────────────────────────────────────────────
function FitBounds({ disasters }) {
  const map = useMap();
  useEffect(() => {
    if (!disasters.length) return;
    const bounds = L.latLngBounds(disasters.map(d => [d.lat, d.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ─── RECENTER ON ZONE SELECTION ────────────────────────────────────────────────
function RecenterOnSelect({ disaster }) {
  const map = useMap();
  const prevIdRef = useRef(disaster?.id);
  useEffect(() => {
    if (disaster && disaster.id !== prevIdRef.current) {
      prevIdRef.current = disaster.id;
      map.flyTo([disaster.lat, disaster.lng], 13, { duration: 1 });
    }
  }, [disaster, map]);
  return null;
}

// ─── SEVERITY BADGE ─────────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  critical:  'bg-red-950 text-red-400 border-red-800',
  high:      'bg-orange-950 text-orange-400 border-orange-800',
  medium:    'bg-amber-950 text-amber-400 border-amber-800',
  low:       'bg-slate-800 text-slate-400 border-slate-700',
  Monitoring:'bg-blue-950 text-blue-400 border-blue-800',
};

const STATUS_STYLES = {
  Critical:   'bg-red-950 text-red-400 border-red-800',
  Active:     'bg-orange-950 text-orange-400 border-orange-800',
  Contained:  'bg-emerald-950 text-emerald-400 border-emerald-800',
  Monitoring: 'bg-blue-950 text-blue-400 border-blue-800',
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export const DisasterSwarmMap = () => {
  const [disasters, setDisasters] = useState(INITIAL_DISASTERS);
  const [selectedId, setSelectedId] = useState(INITIAL_DISASTERS[0].id);
  const [mapStyle, setMapStyle] = useState('google-roadmap'); // 'google-roadmap' | 'google-satellite' | 'google-terrain' | 'tactical-dark'
  const [viewMode, setViewMode] = useState('swarm-map'); // 'swarm-map' | 'google-embed'
  const [showHeatRings, setShowHeatRings] = useState(true);
  const [showAgents, setShowAgents] = useState(true);
  const [tick, setTick] = useState(0);
  const [addingMode, setAddingMode] = useState(false);
  const [newType, setNewType] = useState('flood');
  const mapRef = useRef(null);

  // Live pulse: jitter affected people count and agent positions every 4s
  useEffect(() => {
    const t = setInterval(() => {
      setTick(p => p + 1);
      setDisasters(prev => prev.map(d => ({
        ...d,
        affectedPeople: Math.max(10, d.affectedPeople + Math.round((Math.random() - 0.48) * 12)),
        agentsDeployed: Math.max(1, d.agentsDeployed + (Math.random() > 0.8 ? 1 : 0)),
      })));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const selectedDisaster = disasters.find(d => d.id === selectedId) || disasters[0];

  // Generate synthetic swarm agent positions around a disaster zone
  const getAgentPositions = useCallback((disaster) => {
    const r = disaster.radiusMeters / 111320; // rough degrees
    const agents = [];
    const seed = disaster.id.charCodeAt(disaster.id.length - 1);
    for (let i = 0; i < disaster.agentsDeployed; i++) {
      const angle = ((seed * 17 + i * 137.5) % 360) * (Math.PI / 180);
      const dist = r * (0.5 + (((seed + i * 31) % 10) / 20));
      agents.push({
        lat: disaster.lat + Math.sin(angle) * dist,
        lng: disaster.lng + Math.cos(angle) * dist,
        id: `${disaster.id}-AGT-${i}`,
      });
    }
    return agents;
  }, []);

  // Summary stats
  const totalAffected = disasters.reduce((a, d) => a + d.affectedPeople, 0);
  const totalAgents = disasters.reduce((a, d) => a + d.agentsDeployed, 0);
  const criticalCount = disasters.filter(d => d.status === 'Critical').length;
  const activeCount = disasters.filter(d => d.status === 'Active').length;

  return (
    <div className="bg-slate-900 border border-red-900/40 rounded-3xl overflow-hidden shadow-2xl">

      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-red-950/20 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-white tracking-tight">DISASTER SWARM MODE</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">
                ● LIVE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {disasters.length} Disaster Zones
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time multi-hazard situation map · Kolkata Metropolitan Command · Swarm agents shown as live field units
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Style Selector: Google Maps / Satellite / Terrain / Dark */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] gap-1">
            {Object.entries(TILE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMapStyle(key);
                  if (viewMode !== 'swarm-map') setViewMode('swarm-map');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  mapStyle === key && viewMode === 'swarm-map'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Switch map view to ${preset.name}`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'google-embed' ? 'swarm-map' : 'google-embed')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                viewMode === 'google-embed'
                  ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle direct Google Maps Embed"
            >
              <Navigation className="w-3 h-3" />
              <span>Google Embed</span>
            </button>
          </div>

          {/* Toggle heat rings */}
          <button
            onClick={() => setShowHeatRings(p => !p)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
              showHeatRings ? 'bg-orange-950 text-orange-300 border-orange-800' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {showHeatRings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Blast Rings
          </button>

          {/* Toggle agent dots */}
          <button
            onClick={() => setShowAgents(p => !p)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
              showAgents ? 'bg-blue-950 text-blue-300 border-blue-800' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {showAgents ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Swarm Agents
          </button>

          {/* Live pulse indicator */}
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1.5 rounded-xl border border-emerald-900">
            <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
            Telemetry Sync: 4s
          </span>
        </div>
      </div>

      {/* ── Summary Strip ── */}
      <div className="grid grid-cols-4 divide-x divide-slate-800 border-b border-slate-800">
        {[
          { label: 'Critical Zones', value: criticalCount, color: 'text-red-400', bg: 'bg-red-950/30' },
          { label: 'Active Zones',   value: activeCount,   color: 'text-orange-400', bg: 'bg-orange-950/30' },
          { label: 'People Affected',value: totalAffected.toLocaleString(), color: 'text-amber-400', bg: '' },
          { label: 'Swarm Agents',   value: totalAgents,   color: 'text-blue-400', bg: '' },
        ].map(s => (
          <div key={s.label} className={`px-4 py-2.5 text-center ${s.bg}`}>
            <div className={`text-xl font-black font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Two-Column Layout: Map Left, Sidebar Right ── */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: '540px' }}>

        {/* ─── Map Area (Google Maps Swarm or Google Embed) ─── */}
        <div className="flex-1 relative" style={{ minHeight: '420px' }}>
          {viewMode === 'google-embed' ? (
            <div className="relative w-full h-full min-h-[420px] bg-slate-950">
              <iframe
                key={`${selectedDisaster.lat}-${selectedDisaster.lng}`}
                title={`Google Maps - ${selectedDisaster.area}`}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '420px' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={getGoogleMapsEmbedUrl(selectedDisaster.lat, selectedDisaster.lng, 14)}
              />
              <div className="absolute top-3 left-3 z-20 bg-slate-950/95 border border-slate-700 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl max-w-md space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{DISASTER_TYPES[selectedDisaster.type]?.emoji || '⚠️'}</span>
                    <span>GOOGLE MAPS: {selectedDisaster.area}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${STATUS_STYLES[selectedDisaster.status] || 'bg-slate-800'}`}>
                    {selectedDisaster.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300">
                  Epicenter GPS: <b className="text-white font-mono">{selectedDisaster.lat.toFixed(4)}, {selectedDisaster.lng.toFixed(4)}</b> · Radius: <b className="text-amber-300">{(selectedDisaster.radiusMeters / 1000).toFixed(1)} km</b>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openInGoogleMapsApp(selectedDisaster.lat, selectedDisaster.lng, `${selectedDisaster.area} - ${selectedDisaster.type.toUpperCase()}`)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-md"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Google Maps App
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateInGoogleMapsApp(selectedDisaster.lat, selectedDisaster.lng)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-md"
                  >
                    <Navigation className="w-3 h-3" />
                    Directions
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('swarm-map')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                  >
                    ← Back to Swarm View
                  </button>
                </div>
              </div>
            </div>
          ) : mapStyle === 'google-terrain' ? (
            /* ── TERRAIN BLACK RADAR VIEW ─────────────────────────────────── */
            <div className="relative w-full h-full min-h-[420px]" style={{ background: '#000' }}>
              <TerrainRadarCanvas
                disasters={disasters}
                selectedId={selectedId}
                onSelectId={setSelectedId}
              />

              {/* Selected zone info panel overlay */}
              {selectedDisaster && (() => {
                const meta = DISASTER_TYPES[selectedDisaster.type] || DISASTER_TYPES.fire;
                return (
                  <div
                    className="absolute top-3 right-3 z-20 rounded-2xl p-3.5 backdrop-blur-sm shadow-2xl max-w-[240px] space-y-2 border"
                    style={{
                      background: 'rgba(0,0,0,0.82)',
                      borderColor: meta.color + '60',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div>
                        <div className="text-[11px] font-black text-white leading-tight">{selectedDisaster.area}</div>
                        <div className="text-[10px] font-bold mt-0.5" style={{ color: meta.color }}>{meta.label}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                      {[
                        { k: 'Status',   v: selectedDisaster.status,                          c: selectedDisaster.status === 'Critical' ? '#f87171' : '#fb923c' },
                        { k: 'Radius',   v: `${(selectedDisaster.radiusMeters/1000).toFixed(1)} km`, c: '#94a3b8' },
                        { k: 'Reported', v: selectedDisaster.reportedAt,                      c: '#94a3b8' },
                        { k: 'Agents',   v: `${selectedDisaster.agentsDeployed} units`,        c: '#60a5fa' },
                      ].map(r => (
                        <div key={r.k} className="rounded-lg px-2 py-1 border border-slate-800 bg-slate-900/60">
                          <div className="text-slate-500 uppercase tracking-wide text-[8px]">{r.k}</div>
                          <div className="font-black font-mono mt-0.5" style={{ color: r.c }}>{r.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[9px] text-slate-400 leading-relaxed border-t border-slate-800 pt-1.5">{selectedDisaster.notes}</div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openInGoogleMapsApp(selectedDisaster.lat, selectedDisaster.lng, selectedDisaster.area)}
                        className="flex-1 py-1 text-[9px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                      >📍 Maps</button>
                      <button
                        type="button"
                        onClick={() => navigateInGoogleMapsApp(selectedDisaster.lat, selectedDisaster.lng)}
                        className="flex-1 py-1 text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                      >🧭 Nav</button>
                    </div>
                  </div>
                );
              })()}

              {/* Terrain radar HUD bottom bar */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-mono border"
                  style={{ background: 'rgba(0,0,0,0.80)', borderColor: 'rgba(255,220,0,0.35)', color: 'rgba(255,220,0,0.85)' }}>
                  <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#ffe000' }} />
                  TERRAIN RADAR · LIVE
                </div>
                <div className="px-2.5 py-1.5 rounded-xl text-[9px] font-mono border"
                  style={{ background: 'rgba(0,0,0,0.80)', borderColor: 'rgba(0,255,80,0.25)', color: 'rgba(0,255,80,0.75)' }}>
                  {disasters.length} zones · click dot to select
                </div>
              </div>

              {/* Dot colour legend */}
              <div className="absolute bottom-3 right-3 z-20 rounded-xl px-2.5 py-2 text-[8px] font-mono space-y-0.5 border"
                style={{ background: 'rgba(0,0,0,0.82)', borderColor: 'rgba(255,255,255,0.08)' }}>
                {Object.entries(DISASTER_TYPES).slice(0, 6).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: val.color, boxShadow: `0 0 5px ${val.color}` }} />
                    <span style={{ color: val.color }}>{val.emoji} {val.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <MapContainer
              ref={mapRef}
              center={[22.5415, 88.3485]}
              zoom={12}
              style={{ width: '100%', height: '100%', minHeight: '420px' }}
              zoomControl={false}
            >
              <TileLayer
                key={mapStyle}
                attribution={TILE_PRESETS[mapStyle]?.attribution || '&copy; Google Maps'}
                url={TILE_PRESETS[mapStyle]?.url || TILE_PRESETS['google-roadmap'].url}
                subdomains={TILE_PRESETS[mapStyle]?.subdomains || ['mt0', 'mt1', 'mt2', 'mt3']}
                maxZoom={TILE_PRESETS[mapStyle]?.maxZoom || 20}
                className={TILE_PRESETS[mapStyle]?.className || ''}
              />
              <FitBounds disasters={disasters} />
              <RecenterOnSelect disaster={selectedDisaster} />

              {disasters.map(disaster => {
                const meta = DISASTER_TYPES[disaster.type] || DISASTER_TYPES.fire;
                const isSelected = disaster.id === selectedId;
                const agents = getAgentPositions(disaster);

                return (
                  <React.Fragment key={disaster.id}>
                    {/* Outer heatmap rings */}
                    {showHeatRings && (
                      <>
                        <Circle
                          center={[disaster.lat, disaster.lng]}
                          radius={disaster.radiusMeters * 1.8}
                          pathOptions={{ color: meta.ring, fillColor: meta.ring, fillOpacity: 0.04, weight: 0 }}
                        />
                        <Circle
                          center={[disaster.lat, disaster.lng]}
                          radius={disaster.radiusMeters * 1.2}
                          pathOptions={{ color: meta.ring, fillColor: meta.ring, fillOpacity: 0.08, weight: 0 }}
                        />
                        <Circle
                          center={[disaster.lat, disaster.lng]}
                          radius={disaster.radiusMeters}
                          pathOptions={{
                            color: meta.color,
                            fillColor: meta.color,
                            fillOpacity: isSelected ? 0.25 : 0.15,
                            weight: isSelected ? 3 : 1.5,
                            dashArray: '6 4',
                          }}
                        />
                      </>
                    )}

                    {/* Disaster epicentre marker */}
                    <Marker
                      position={[disaster.lat, disaster.lng]}
                      icon={makeDisasterIcon(disaster.type)}
                      eventHandlers={{ click: () => setSelectedId(disaster.id) }}
                    >
                      <Popup className="disaster-popup">
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', minWidth: '220px' }}>
                          <b style={{ color: meta.color, fontSize: '13px' }}>{meta.emoji} {meta.label}</b><br />
                          <span style={{ color: '#94a3b8' }}>{disaster.area}</span><br /><br />
                          <span>Status: </span><b style={{ color: disaster.status === 'Critical' ? '#f87171' : '#fb923c' }}>{disaster.status}</b><br />
                          <span>Affected: </span><b style={{ color: '#fbbf24' }}>{disaster.affectedPeople.toLocaleString()} people</b><br />
                          <span>Agents: </span><b style={{ color: '#60a5fa' }}>{disaster.agentsDeployed} deployed</b><br />
                          <span>Reported: </span>{disaster.reportedAt}<br /><br />
                          <span style={{ color: '#cbd5e1' }}>{disaster.notes}</span>
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #475569', display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openInGoogleMapsApp(disaster.lat, disaster.lng, disaster.area)}
                              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              Open Google Maps
                            </button>
                            <button
                              type="button"
                              onClick={() => navigateInGoogleMapsApp(disaster.lat, disaster.lng)}
                              style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              Directions
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Swarm agent dots */}
                    {showAgents && agents.map(agent => (
                      <Marker
                        key={agent.id}
                        position={[agent.lat, agent.lng]}
                        icon={makeAgentIcon(meta.color)}
                      >
                        <Popup>
                          <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                            Swarm Agent · {disaster.id}<br />
                            <span style={{ color: meta.color }}>{meta.label}</span>
                          </span>
                        </Popup>
                      </Marker>
                    ))}
                  </React.Fragment>
                );
              })}
            </MapContainer>
          )}

          {/* Map legend overlay — hidden in terrain radar mode (it has its own legend) */}
          {mapStyle !== 'google-terrain' && (
            <div className="absolute bottom-3 left-3 z-[1000] bg-black/85 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2 text-[9px] font-mono text-slate-300 space-y-1 max-w-[170px] shadow-2xl">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold text-white">Legend</span>
                <span className="text-[8px] px-1 py-0.2 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800">
                  {TILE_PRESETS[mapStyle]?.icon} {TILE_PRESETS[mapStyle]?.name}
                </span>
              </div>
              {Object.entries(DISASTER_TYPES).slice(0, 5).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span>{val.emoji}</span>
                  <span className="truncate" style={{ color: val.color }}>{val.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Sidebar: Zone List + Selected Detail ─── */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col bg-slate-950">

          {/* Zone List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60" style={{ maxHeight: '300px' }}>
            <div className="sticky top-0 z-10 bg-slate-950 px-3 py-2 border-b border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Disaster Zones</span>
            </div>
            {disasters.map(disaster => {
              const meta = DISASTER_TYPES[disaster.type] || DISASTER_TYPES.fire;
              const isSelected = disaster.id === selectedId;
              return (
                <button
                  key={disaster.id}
                  type="button"
                  onClick={() => setSelectedId(disaster.id)}
                  className={`w-full text-left px-3 py-2.5 transition-all flex items-start gap-2.5 ${
                    isSelected ? 'bg-slate-800/80 ring-1 ring-inset ring-slate-600' : 'hover:bg-slate-900'
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-white truncate">{disaster.area}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${STATUS_STYLES[disaster.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {disaster.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{disaster.affectedPeople.toLocaleString()} affected</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-mono font-bold" style={{ color: meta.color }}>
                      {disaster.agentsDeployed} 🤖
                    </div>
                    <div className="text-[9px] text-slate-500">{disaster.reportedAt}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Zone Detail */}
          {selectedDisaster && (() => {
            const meta = DISASTER_TYPES[selectedDisaster.type] || DISASTER_TYPES.fire;
            return (
              <div className="border-t border-slate-800 p-4 space-y-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{meta.emoji}</span>
                  <div>
                    <div className="text-xs font-black text-white">{selectedDisaster.area}</div>
                    <div className="text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Status',    value: selectedDisaster.status,                          color: selectedDisaster.status === 'Critical' ? 'text-red-400' : 'text-orange-400' },
                    { label: 'Radius',    value: `${(selectedDisaster.radiusMeters / 1000).toFixed(2)} km`, color: 'text-slate-300' },
                    { label: 'Affected',  value: selectedDisaster.affectedPeople.toLocaleString(), color: 'text-amber-400' },
                    { label: 'Agents',    value: `${selectedDisaster.agentsDeployed} units`,        color: 'text-blue-400' },
                  ].map(row => (
                    <div key={row.label} className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                      <div className="text-[9px] text-slate-500 uppercase tracking-wide">{row.label}</div>
                      <div className={`text-xs font-black font-mono mt-0.5 ${row.color}`}>{row.value}</div>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Field Report</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{selectedDisaster.notes}</p>
                </div>

                {/* Agent deployment bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide">Swarm Coverage</span>
                    <span className="text-[10px] font-mono text-blue-400">{selectedDisaster.agentsDeployed} / {Math.ceil(selectedDisaster.affectedPeople / 400)} needed</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (selectedDisaster.agentsDeployed / Math.ceil(selectedDisaster.affectedPeople / 400)) * 100)}%`,
                        backgroundColor: meta.color,
                        boxShadow: `0 0 8px ${meta.color}`,
                      }}
                    />
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDisasters(prev => prev.map(d =>
                      d.id === selectedDisaster.id
                        ? { ...d, agentsDeployed: d.agentsDeployed + 1 }
                        : d
                    ))}
                    className="flex-1 py-1.5 text-[10px] font-bold bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Deploy Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisasters(prev => prev.map(d =>
                      d.id === selectedDisaster.id
                        ? { ...d, agentsDeployed: Math.max(1, d.agentsDeployed - 1) }
                        : d
                    ))}
                    className="flex-1 py-1.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Minus className="w-3 h-3" /> Recall Agent
                  </button>
                </div>

                {/* Google Maps Zone Navigation */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openInGoogleMapsApp(selectedDisaster.lat, selectedDisaster.lng, `${selectedDisaster.area} (${meta.label})`)}
                      className="flex-1 py-2 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-[1.02]"
                      title="Open this disaster zone in Google Maps App"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Open Google Maps</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateInGoogleMapsApp(selectedDisaster.lat, selectedDisaster.lng)}
                      className="py-2 px-3 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1 shadow-md transition-all hover:scale-[1.02]"
                      title="Navigate to epicenter in Google Maps"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Disaster Type Grid ── */}
      <div className="border-t border-slate-800 px-5 py-4">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Active Hazard Classification Legend</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {Object.entries(DISASTER_TYPES).map(([key, val]) => {
            const count = disasters.filter(d => d.type === key).length;
            return (
              <div
                key={key}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-default"
                style={{
                  borderColor: count > 0 ? val.color + '60' : '#1e293b',
                  backgroundColor: count > 0 ? val.color + '10' : 'transparent',
                }}
              >
                <span className="text-lg">{val.emoji}</span>
                <span className="text-[9px] text-center font-bold" style={{ color: count > 0 ? val.color : '#475569' }}>
                  {val.label}
                </span>
                {count > 0 && (
                  <span className="text-[10px] font-black font-mono" style={{ color: val.color }}>
                    ×{count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DisasterSwarmMap;
