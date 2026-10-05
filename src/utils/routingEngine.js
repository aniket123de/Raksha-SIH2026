/**
 * Raksha Emergency Routing Engine
 * 
 * Computes AI-optimized fastest emergency routes, alternative traffic paths,
 * turn-by-turn tactical maneuvers, and live transit progression for:
 * 1. Ambulance Navigation Portal (EMS Crew)
 * 2. Patient Live Ambulance Tracker (Inbound Route)
 */

// Helper to calculate Haversine distance in km
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Generate realistic intermediate road waypoints between two coordinates
export const generateRoadWaypoints = (startLat, startLng, endLat, endLng, routeType = 'fastest') => {
  if (!startLat || !startLng || !endLat || !endLng) return [];

  const points = [[startLat, startLng]];
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;

  // Add realistic street turn waypoints based on route type
  if (routeType === 'fastest') {
    // Route 1: Smooth highway / green corridor curvature
    points.push([startLat + dLat * 0.15, startLng + dLng * 0.05]);
    points.push([startLat + dLat * 0.35, startLng + dLng * 0.25]);
    points.push([startLat + dLat * 0.50, startLng + dLng * 0.55]);
    points.push([startLat + dLat * 0.70, startLng + dLng * 0.80]);
    points.push([startLat + dLat * 0.90, startLng + dLng * 0.95]);
  } else if (routeType === 'arterial') {
    // Route 2: Arterial grid path with 90-degree street jogs
    points.push([startLat + dLat * 0.10, startLng + dLng * 0.20]);
    points.push([startLat + dLat * 0.30, startLng + dLng * 0.45]);
    points.push([startLat + dLat * 0.60, startLng + dLng * 0.48]);
    points.push([startLat + dLat * 0.80, startLng + dLng * 0.75]);
    points.push([startLat + dLat * 0.92, startLng + dLng * 0.90]);
  } else {
    // Route 3: Inner city local detour
    points.push([startLat + dLat * 0.20, startLng - dLng * 0.15]);
    points.push([startLat + dLat * 0.45, startLng + dLng * 0.10]);
    points.push([startLat + dLat * 0.65, startLng + dLng * 0.40]);
    points.push([startLat + dLat * 0.85, startLng + dLng * 0.70]);
  }

  points.push([endLat, endLng]);
  return points;
};

// Generate realistic intermediate road waypoints based on cardinal approach direction
export const generateDirectionalWaypoints = (startLat, startLng, endLat, endLng, direction = 'west') => {
  if (!startLat || !startLng || !endLat || !endLng) return [];

  const points = [[startLat, startLng]];
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;

  if (direction === 'west') {
    // West approach along AJC Bose Road past SSKM Hospital (Eastbound)
    points.push([startLat + dLat * 0.15, startLng + dLng * 0.20]);
    points.push([startLat + dLat * 0.40, startLng + dLng * 0.45]);
    points.push([startLat + dLat * 0.70, startLng + dLng * 0.75]);
    points.push([startLat + dLat * 0.90, startLng + dLng * 0.92]);
  } else if (direction === 'north') {
    // North approach down Chowringhee / JL Nehru Road (Southbound)
    points.push([startLat + dLat * 0.20, startLng - dLng * 0.08]);
    points.push([startLat + dLat * 0.45, startLng + dLng * 0.15]);
    points.push([startLat + dLat * 0.70, startLng + dLng * 0.50]);
    points.push([startLat + dLat * 0.88, startLng + dLng * 0.82]);
  } else if (direction === 'east' || direction === 'parkcircus' || direction === 'park_circus') {
    // Approach from Park Circus 7-Point / Maa Flyover along AJC Bose Road (Westbound)
    points.push([startLat + dLat * 0.20, startLng + dLng * 0.20]);
    points.push([startLat + dLat * 0.50, startLng + dLng * 0.50]);
    points.push([startLat + dLat * 0.75, startLng + dLng * 0.75]);
    points.push([startLat + dLat * 0.90, startLng + dLng * 0.90]);
  } else if (direction === 'south') {
    // South approach from Hazra / Ashutosh Mukherjee Road (Northbound)
    points.push([startLat + dLat * 0.16, startLng + dLng * 0.12]);
    points.push([startLat + dLat * 0.40, startLng - dLng * 0.05]);
    points.push([startLat + dLat * 0.65, startLng + dLng * 0.35]);
    points.push([startLat + dLat * 0.86, startLng + dLng * 0.75]);
  } else if (direction === 'northwest') {
    // Diagonal North-West from Maidan / Red Road
    points.push([startLat + dLat * 0.16, startLng + dLng * 0.28]);
    points.push([startLat + dLat * 0.40, startLng + dLng * 0.52]);
    points.push([startLat + dLat * 0.68, startLng + dLng * 0.74]);
    points.push([startLat + dLat * 0.88, startLng + dLng * 0.90]);
  } else if (direction === 'southeast') {
    // Approach from Ballygunge Circular / Gariahat (North-West bound)
    points.push([startLat + dLat * 0.16, startLng + dLng * 0.14]);
    points.push([startLat + dLat * 0.38, startLng + dLng * 0.36]);
    points.push([startLat + dLat * 0.62, startLng + dLng * 0.64]);
    points.push([startLat + dLat * 0.84, startLng + dLng * 0.88]);
  } else if (direction === 'northeast') {
    // Approach from Sealdah / CIT Road / Entally (South-West bound)
    points.push([startLat + dLat * 0.18, startLng + dLng * 0.20]);
    points.push([startLat + dLat * 0.44, startLng + dLng * 0.46]);
    points.push([startLat + dLat * 0.70, startLng + dLng * 0.72]);
    points.push([startLat + dLat * 0.88, startLng + dLng * 0.90]);
  } else {
    // South-West from Alipore Zoo / D.L. Khan Road
    points.push([startLat + dLat * 0.18, startLng + dLng * 0.14]);
    points.push([startLat + dLat * 0.42, startLng + dLng * 0.40]);
    points.push([startLat + dLat * 0.68, startLng + dLng * 0.68]);
    points.push([startLat + dLat * 0.88, startLng + dLng * 0.88]);
  }

  points.push([endLat, endLng]);
  return points;
};

// Generate realistic alternative bypass detour waypoints around a road blockage
export const generateBypassWaypoints = (startLat, startLng, endLat, endLng) => {
  if (!startLat || !startLng || !endLat || !endLng) return [];

  const points = [[startLat, startLng]];
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;

  // Diverts via Barapullah Elevated Bypass corridor:
  // 1. Approaches along base corridor
  points.push([startLat + dLat * 0.18, startLng + dLng * 0.12]);
  // 2. Takes elevated slip ramp curving northeast before the road blockage
  points.push([startLat + dLat * 0.36 + 0.0075, startLng + dLng * 0.22 - 0.006]);
  // 3. Elevated grade-separated high-speed flyover bypassing the blocked intersection
  points.push([startLat + dLat * 0.58 + 0.0090, startLng + dLng * 0.48 - 0.004]);
  // 4. Descent slip ramp returning towards destination corridor
  points.push([startLat + dLat * 0.78 + 0.0050, startLng + dLng * 0.72 - 0.002]);
  // 5. Final merge onto emergency hospital approach
  points.push([startLat + dLat * 0.90, startLng + dLng * 0.90]);
  points.push([endLat, endLng]);

  return points;
};

// Distinct color themes and directional configurations for multi-ambulance dispatch
export const AMBULANCE_DIRECTION_CONFIGS = [
  {
    key: 'west',
    directionName: 'West',
    badge: 'WEST',
    arrow: '➡️',
    corridorName: 'AJC Bose Road (West) / Zeerut Bridge',
    landmark: 'Rabindra Sadan / Zeerut Bridge',
    dLat: -0.0030,
    dLng: -0.0115,
    color: '#2563EB',      // Royal Blue
    glow: '#3B82F6',
    colorName: 'Royal Blue Wave',
    textColor: 'text-blue-400',
    bgBadge: 'bg-blue-950 text-blue-300 border-blue-800'
  },
  {
    key: 'north',
    directionName: 'North',
    badge: 'NORTH',
    arrow: '⬇️',
    corridorName: 'Chowringhee Road / Park Street Radial (North)',
    landmark: 'Park Street / Chowringhee',
    dLat: 0.0120,
    dLng: 0.0025,
    color: '#F59E0B',      // Vivid Amber / Gold
    glow: '#FBBF24',
    colorName: 'Amber Express',
    textColor: 'text-amber-400',
    bgBadge: 'bg-amber-950 text-amber-300 border-amber-800'
  },
  {
    key: 'east',
    directionName: 'Park Circus',
    badge: 'PARK CIRCUS',
    arrow: '⬅️',
    corridorName: 'Maa Flyover / AJC Bose Road Corridor',
    landmark: 'Park Circus 7-Point / Maa Flyover',
    dLat: 0.0025,
    dLng: 0.0230,
    color: '#8B5CF6',      // Electric Purple / Violet
    glow: '#A78BFA',
    colorName: 'Purple Arterial',
    textColor: 'text-purple-400',
    bgBadge: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  {
    key: 'south',
    directionName: 'South',
    badge: 'SOUTH',
    arrow: '⬆️',
    corridorName: 'Ashutosh Mukherjee / Hazra Radial (South)',
    landmark: 'Hazra Road / Bhowanipore',
    dLat: -0.0185,
    dLng: -0.0020,
    color: '#06B6D4',      // Vivid Cyan / Turquoise
    glow: '#22D3EE',
    colorName: 'Cyan Rapid',
    textColor: 'text-cyan-400',
    bgBadge: 'bg-cyan-950 text-cyan-300 border-cyan-800'
  },
  {
    key: 'northwest',
    directionName: 'North-West',
    badge: 'NW',
    arrow: '↘️',
    corridorName: 'Red Road / Fort William Connector (North-West)',
    landmark: 'Maidan / Red Road',
    dLat: 0.0135,
    dLng: -0.0115,
    color: '#EC4899',      // Hot Pink / Magenta
    glow: '#F472B6',
    colorName: 'Magenta Interceptor',
    textColor: 'text-pink-400',
    bgBadge: 'bg-pink-950 text-pink-300 border-pink-800'
  },
  {
    key: 'southeast',
    directionName: 'Ballygunge',
    badge: 'BALLYGUNGE',
    arrow: '↖️',
    corridorName: 'Ballygunge Circular / Gariahat Arterial',
    landmark: 'Ballygunge Phari / Gariahat',
    dLat: -0.0160,
    dLng: 0.0180,
    color: '#F97316',      // Vivid Tangerine / Orange
    glow: '#FB923C',
    colorName: 'Orange Trauma',
    textColor: 'text-orange-400',
    bgBadge: 'bg-orange-950 text-orange-300 border-orange-800'
  },
  {
    key: 'northeast',
    directionName: 'Sealdah',
    badge: 'SEALDAH',
    arrow: '↙️',
    corridorName: 'CIT Road / Entally Connector',
    landmark: 'Sealdah / Entally',
    dLat: 0.0180,
    dLng: 0.0150,
    color: '#10B981',      // Emerald Green
    glow: '#34D399',
    colorName: 'Emerald Lifeline',
    textColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  },
  {
    key: 'southwest',
    directionName: 'South-West',
    badge: 'SW',
    arrow: '↗️',
    corridorName: 'Alipore Road / D.L. Khan Radial (South-West)',
    landmark: 'Alipore Zoo / D.L. Khan Road',
    dLat: -0.0170,
    dLng: -0.0140,
    color: '#EAB308',      // Electric Chartreuse / Yellow
    glow: '#FDE047',
    colorName: 'Solar Rescue',
    textColor: 'text-yellow-400',
    bgBadge: 'bg-yellow-950 text-yellow-300 border-yellow-800'
  }
];

// Distinct high-contrast shades of green when Traffic Police Grant Clearance (Green Wave Corridor) is active
export const CLEARANCE_GREEN_SHADES = [
  {
    key: 'neon-green',
    color: '#22C55E',      // Vivid Neon / Emerald 500
    glow: '#4ADE80',
    colorName: 'Neon Green',
    textColor: 'text-green-400',
    bgBadge: 'bg-green-950 text-green-300 border-green-700'
  },
  {
    key: 'emerald-green',
    color: '#10B981',      // Vibrant Emerald 500
    glow: '#34D399',
    colorName: 'Emerald Green',
    textColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-950 text-emerald-300 border-emerald-700'
  },
  {
    key: 'mint-green',
    color: '#14B8A6',      // Electric Mint / Teal 500
    glow: '#2DD4BF',
    colorName: 'Mint Green',
    textColor: 'text-teal-400',
    bgBadge: 'bg-teal-950 text-teal-300 border-teal-700'
  },
  {
    key: 'lime-green',
    color: '#84CC16',      // Bright Lime / Chartreuse 500
    glow: '#A3E635',
    colorName: 'Lime Green',
    textColor: 'text-lime-400',
    bgBadge: 'bg-lime-950 text-lime-300 border-lime-700'
  },
  {
    key: 'jade-green',
    color: '#059669',      // Deep Jade / Emerald 600
    glow: '#10B981',
    colorName: 'Jade Green',
    textColor: 'text-emerald-300',
    bgBadge: 'bg-emerald-950 text-emerald-200 border-emerald-600'
  },
  {
    key: 'leaf-green',
    color: '#16A34A',      // Lush Foliage / Forest Green 600
    glow: '#22C55E',
    colorName: 'Forest Green',
    textColor: 'text-green-300',
    bgBadge: 'bg-green-950 text-green-200 border-green-600'
  },
  {
    key: 'pine-green',
    color: '#0D9488',      // Rich Pine / Dark Aquamarine 600
    glow: '#14B8A6',
    colorName: 'Pine Green',
    textColor: 'text-teal-300',
    bgBadge: 'bg-teal-950 text-teal-200 border-teal-600'
  },
  {
    key: 'spring-green',
    color: '#4ADE80',      // Luminous Cyber Spring Green 400
    glow: '#86EFAC',
    colorName: 'Spring Green',
    textColor: 'text-green-200',
    bgBadge: 'bg-emerald-950 text-green-100 border-green-500'
  }
];

export const getAmbulanceTheme = (idx, isTrafficPoliceGranted = false) => {
  const dirConfig = AMBULANCE_DIRECTION_CONFIGS[idx % AMBULANCE_DIRECTION_CONFIGS.length];
  if (isTrafficPoliceGranted) {
    const greenShade = CLEARANCE_GREEN_SHADES[idx % CLEARANCE_GREEN_SHADES.length];
    return {
      ...dirConfig,
      color: greenShade.color,
      glow: greenShade.glow,
      colorName: greenShade.colorName,
      textColor: greenShade.textColor,
      bgBadge: greenShade.bgBadge,
      isGreenCleared: true
    };
  }
  return {
    ...dirConfig,
    isGreenCleared: false
  };
};

/**
 * Generate 3 comparative emergency routes:
 * 1. Fastest Route (AI Green Corridor Express)
 * 2. Alternative Route A (Arterial Road)
 * 3. Alternative Route B (Inner City Surface Streets)
 */
export const computeEmergencyRoutes = (origin, destination, options = {}) => {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return [];
  }

  const rawDist = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const baseDist = Math.max(1.8, rawDist * 1.25); // Road network factor

  // 1. Route 1: Fastest Route (Green Corridor)
  const distFastest = Math.round(baseDist * 10) / 10;
  // Green corridor speeds ~55-65 km/h + preempted signals
  const etaFastest = Math.max(3, Math.round((distFastest / 55) * 60));
  const waypointsFastest = generateRoadWaypoints(origin.lat, origin.lng, destination.lat, destination.lng, 'fastest');

  // 2. Route 2: Arterial Surface Road
  const distArterial = Math.round((baseDist * 1.2) * 10) / 10;
  const etaArterial = Math.round(etaFastest + 4);
  const waypointsArterial = generateRoadWaypoints(origin.lat, origin.lng, destination.lat, destination.lng, 'arterial');

  // 3. Route 3: Inner City Local
  const distInner = Math.round((baseDist * 1.35) * 10) / 10;
  const etaInner = Math.round(etaFastest + 9);
  const waypointsInner = generateRoadWaypoints(origin.lat, origin.lng, destination.lat, destination.lng, 'inner');

  const trafficPoliceGranted = options.trafficPoliceGranted !== undefined ? Boolean(options.trafficPoliceGranted) : false;

  return [
    {
      id: 'fastest',
      name: trafficPoliceGranted
        ? 'Outer Ring Expressway (Traffic Police Green Corridor)'
        : 'Outer Ring Expressway (Standard Navigation Cycle)',
      shortName: trafficPoliceGranted ? 'Fastest Green Route' : 'Fastest Route (Blue)',
      isFastest: true,
      tag: trafficPoliceGranted
        ? '🟢 Traffic Police Permission: GRANTED (Route GREEN)'
        : '⚠️ Traffic Police Permission: REQUIRED (Route Remains Blue)',
      tagColor: trafficPoliceGranted
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      badge: trafficPoliceGranted ? 'Green Wave Active' : 'Permission Required',
      etaMinutes: etaFastest,
      distanceKm: distFastest,
      avgSpeedKmh: trafficPoliceGranted ? 58 : 48,
      trafficStatus: trafficPoliceGranted
        ? 'Traffic Police Clearance Active • Fastest Route GREEN'
        : 'Police Permission Required • Standard Blue Route (Pending Clearance)',
      trafficColor: trafficPoliceGranted ? 'text-emerald-400' : 'text-blue-400',
      trafficDelay: trafficPoliceGranted ? '0 mins (Fastest)' : '+2 mins (Signals Cycling)',
      timeSavedMinutes: 6,
      corridorActive: trafficPoliceGranted,
      trafficPolicePermissionRequired: true,
      trafficPoliceGranted: trafficPoliceGranted,
      polylineColor: trafficPoliceGranted ? '#10B981' : '#2563EB', // Blue before permission, Green when granted
      polylineWidth: 6,
      waypoints: waypointsFastest,
      maneuvers: [
        {
          id: 'm1',
          instruction: 'Depart station & merge onto AJC Bose Road corridor',
          distance: '450 m',
          icon: 'straight',
          speed: '40 km/h',
          note: 'Emergency sirens and strobe active'
        },
        {
          id: 'm2',
          instruction: 'Continue straight through Exide Crossing / Flyover (Signal Preempted: GREEN)',
          distance: '1.2 km',
          icon: 'straight',
          speed: '65 km/h',
          note: 'Green wave preemption hold active'
        },
        {
          id: 'm3',
          instruction: 'Take emergency right slip ramp toward Incident Zone',
          distance: '650 m',
          icon: 'right',
          speed: '45 km/h',
          note: 'Traffic cleared by control room'
        },
        {
          id: 'm4',
          instruction: 'Arrive at Destination Coordinates',
          distance: '300 m',
          icon: 'destination',
          speed: '20 km/h',
          note: 'Prepare stretcher and triage kit'
        }
      ]
    },
    {
      id: 'arterial',
      name: 'AJC Bose Road Surface Arterial',
      shortName: 'Arterial Route',
      isFastest: false,
      tag: 'Alternative 1 • Moderate Traffic',
      tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      badge: '+4 mins delay',
      etaMinutes: etaArterial,
      distanceKm: distArterial,
      avgSpeedKmh: 38,
      trafficStatus: 'Moderate Congestion • Standard Signal Cycle',
      trafficColor: 'text-blue-400',
      trafficDelay: '+4 mins vs Fastest Route',
      timeSavedMinutes: 0,
      corridorActive: false,
      polylineColor: '#3B82F6', // Blue
      polylineWidth: 4,
      waypoints: waypointsArterial,
      maneuvers: [
        {
          id: 'm1',
          instruction: 'Head toward AJC Bose Road Surface Lane',
          distance: '600 m',
          icon: 'straight',
          speed: '35 km/h',
          note: 'Normal traffic cycle'
        },
        {
          id: 'm2',
          instruction: 'Turn Left at Rabindra Sadan Crossing',
          distance: '1.4 km',
          icon: 'left',
          speed: '35 km/h',
          note: 'Potential congestion at crossing'
        },
        {
          id: 'm3',
          instruction: 'Proceed toward Destination',
          distance: '1.1 km',
          icon: 'destination',
          speed: '30 km/h',
          note: 'Approach with caution'
        }
      ]
    },
    {
      id: 'inner',
      name: 'Park Street - Camac Street Inner Link',
      shortName: 'Inner City Link',
      isFastest: false,
      tag: 'Alternative 2 • Heavy Congestion',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badge: '+9 mins delay',
      etaMinutes: etaInner,
      distanceKm: distInner,
      avgSpeedKmh: 24,
      trafficStatus: 'Heavy Traffic • Multiple Red Signals',
      trafficColor: 'text-rose-400',
      trafficDelay: '+9 mins vs Fastest Route',
      timeSavedMinutes: 0,
      corridorActive: false,
      polylineColor: '#F59E0B', // Amber
      polylineWidth: 4,
      waypoints: waypointsInner,
      maneuvers: [
        {
          id: 'm1',
          instruction: 'Navigate inner commercial ring roads',
          distance: '1.2 km',
          icon: 'right',
          speed: '20 km/h',
          note: 'Dense pedestrian & vehicle traffic'
        },
        {
          id: 'm2',
          instruction: 'Merge back toward main connector',
          distance: '1.8 km',
          icon: 'left',
          speed: '25 km/h',
          note: 'Delay expected at traffic lights'
        },
        {
          id: 'm3',
          instruction: 'Arrive at destination',
          distance: '800 m',
          icon: 'destination',
          speed: '20 km/h',
          note: 'Final approach'
        }
      ]
    }
  ];
};

/**
 * Calculates current interpolated position and remaining telemetry
 * given a route and progress ratio (0.0 to 1.0)
 */
export const interpolateRouteProgress = (route, progress = 0) => {
  const defaultManeuver = {
    instruction: 'Following Fastest Route toward Destination',
    distance: '2.5 km',
    icon: 'straight'
  };

  if (!route || !route.waypoints || route.waypoints.length < 2) {
    return {
      lat: 28.5500,
      lng: 77.2400,
      distanceRemainingKm: 2.5,
      etaRemainingMinutes: 5,
      currentManeuver: defaultManeuver,
      progressPercent: 0,
      isArrived: false
    };
  }

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const points = route.waypoints;
  const numSegments = points.length - 1;
  const targetSegment = Math.min(Math.floor(clampedProgress * numSegments), numSegments - 1);
  const segmentFraction = (clampedProgress * numSegments) - targetSegment;

  const p1 = points[targetSegment];
  const p2 = points[targetSegment + 1];

  const currentLat = p1[0] + (p2[0] - p1[0]) * segmentFraction;
  const currentLng = p1[1] + (p2[1] - p1[1]) * segmentFraction;

  const remainingRatio = 1 - clampedProgress;
  const distanceRemainingKm = Math.max(0.1, Math.round(route.distanceKm * remainingRatio * 10) / 10);
  const etaRemainingMinutes = Math.max(1, Math.ceil(route.etaMinutes * remainingRatio));

  // Determine current maneuver
  const maneuvers = route.maneuvers || [];
  const maneuverIndex = Math.min(Math.floor(clampedProgress * maneuvers.length), maneuvers.length - 1);
  const currentManeuver = maneuvers[maneuverIndex] || {
    instruction: 'Following Fastest Route toward Destination',
    distance: `${distanceRemainingKm} km`,
    icon: 'straight'
  };

  return {
    lat: currentLat,
    lng: currentLng,
    distanceRemainingKm,
    etaRemainingMinutes,
    currentManeuver,
    progressPercent: Math.round(clampedProgress * 100),
    isArrived: clampedProgress >= 0.98
  };
};
