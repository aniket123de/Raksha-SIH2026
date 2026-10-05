import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  Radar,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Navigation,
  Compass,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  Minimize2,
  Layers,
  Radio,
  Sliders,
  Eye,
  Info,
  Car,
  Activity,
  AlertOctagon,
  Box,
  Camera,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Sparkles
} from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';

/**
 * 3D LiDAR Obstacle Detection & Dynamic Rerouting Engine
 * Displays 3D format volumetric LiDAR obstacles shifted to the side of the 3D map/road,
 * while computing and displaying precise 2.5D Spatial & Elevation Coordinates.
 * (Does NOT show the 2D ambulance tracking map in the 3D LiDAR Obstacle station).
 */
export const LidarObstacleDetector = ({ onRerouteChange }) => {
  const containerRef = useRef(null);
  const { lidarRerouteState, triggerLidarObstacle, clearLidarObstacle: ctxClearLidar } = useEmergency();

  // 3D Camera View Preset: 'orbit' | 'cockpit' | 'top-down' | 'target'
  const [cameraView, setCameraView] = useState('orbit');
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Obstacle simulation state
  const [hasObstacle, setHasObstacle] = useState(lidarRerouteState?.hasObstacle ?? true);
  const [obstacleType, setObstacleType] = useState('stalled-truck'); // 'stalled-truck' | 'debris' | 'waterlog' | 'accident'
  const [activeRoute, setActiveRoute] = useState(lidarRerouteState?.hasObstacle ? 'bypass' : 'primary');
  const [isRerouting, setIsRerouting] = useState(false);
  const [lastRerouteTimestamp, setLastRerouteTimestamp] = useState(new Date().toLocaleTimeString());
  const [autoSimLoop, setAutoSimLoop] = useState(false);
  const [scanAngleDeg, setScanAngleDeg] = useState(0);

  // Screen projected coordinates for floating 2.5D HUD overlay
  const [hudPos, setHudPos] = useState({ x: 0, y: 0, visible: false });

  // Sync with global LiDAR state
  useEffect(() => {
    if (lidarRerouteState) {
      if (lidarRerouteState.hasObstacle !== hasObstacle) {
        setHasObstacle(lidarRerouteState.hasObstacle);
        setActiveRoute(lidarRerouteState.hasObstacle ? 'bypass' : 'primary');
      }
    }
  }, [lidarRerouteState?.hasObstacle]);

  // Available Obstacle Presets - Shifted to the side of the 3D map (Roadside / Shoulder Y: +4.5m)
  const obstaclePresets = {
    'stalled-truck': {
      title: 'Stalled Heavy Commercial Truck',
      distance: 38.4,
      coords25D: {
        x: '+38.4m', // Longitudinal distance ahead
        y: '+4.5m (Side of Road / Shoulder)', // Shifted to side of map
        z: '+2.4m',  // Height / elevation profile
        elevationASL: '+214.2m ASL',
        gpsLat: '28.59124° N',
        gpsLng: '77.22851° E',
        azimuth: '+6.7° (Right Roadside)',
        polarElevation: '+3.6°',
        dimensions: '7.2m (L) × 2.6m (W) × 2.4m (H)',
        groundClearance: '+0.35m'
      },
      lane: 'Right Shoulder & Outer Roadside Corridor',
      elevation: '+2.4m (Ground Clearance: +0.35m)',
      severity: 'CRITICAL',
      ptsReflected: 3120,
      confidence: '99.4%',
      impact: 'Corridor side obstruction @ 38m. Shifted at side of road map.'
    },
    'debris': {
      title: 'Fallen Construction Barrier & Debris',
      distance: 52.1,
      coords25D: {
        x: '+52.1m',
        y: '+4.8m (Side of Road / Kerb)',
        z: '+1.1m',
        elevationASL: '+215.1m ASL',
        gpsLat: '28.59210° N',
        gpsLng: '77.22915° E',
        azimuth: '+5.3°',
        polarElevation: '+1.2°',
        dimensions: '4.8m (L) × 1.8m (W) × 1.1m (H)',
        groundClearance: '0.0m (Kerb Impact)'
      },
      lane: 'Right Roadside Kerb & Hard Shoulder',
      elevation: '+1.1m (Pavement Hazard)',
      severity: 'HIGH',
      ptsReflected: 1840,
      confidence: '97.8%',
      impact: 'Sharp road obstruction hazard at side of map. Puncture threat.'
    },
    'waterlog': {
      title: 'Flash Waterlogging & Open Manhole',
      distance: 29.0,
      coords25D: {
        x: '+29.0m',
        y: '+4.2m (Side of Road Drainage)',
        z: '-0.42m', // Depression below grade
        elevationASL: '+211.8m ASL (Underpass Low Point)',
        gpsLat: '28.58980° N',
        gpsLng: '77.22740° E',
        azimuth: '+8.2°',
        polarElevation: '-0.8°',
        dimensions: '12.0m (L) × 6.5m (W) × 0.42m (Depth)',
        groundClearance: '-0.42m Water Depth'
      },
      lane: 'Underpass Side Drainage & Shoulder',
      elevation: '-0.42m depression / +0.8m splash',
      severity: 'CRITICAL',
      ptsReflected: 2450,
      confidence: '98.1%',
      impact: 'Hydroplaning danger at side of road. Water depth > 40cm.'
    },
    'accident': {
      title: 'Multi-Vehicle Collision Pileup',
      distance: 64.7,
      coords25D: {
        x: '+64.7m',
        y: '+4.6m (Side of Road / Barrier)',
        z: '+1.95m',
        elevationASL: '+216.4m ASL',
        gpsLat: '28.59340° N',
        gpsLng: '77.23010° E',
        azimuth: '+4.1°',
        polarElevation: '+1.8°',
        dimensions: '14.5m (L) × 5.2m (W) × 2.0m (H)',
        groundClearance: '+0.25m'
      },
      lane: 'Right Roadside Barrier Multi-Collision',
      elevation: '+1.95m (Multiple Entanglements)',
      severity: 'CRITICAL',
      ptsReflected: 4200,
      confidence: '99.9%',
      impact: 'Wreckage at side of map corridor. 3 vehicles entangled.'
    }
  };

  const currentObstacleData = obstaclePresets[obstacleType] || obstaclePresets['stalled-truck'];

  // Handle Obstacle Detection & Route Auto-Switch
  const triggerObstacleDetection = (type = 'stalled-truck') => {
    setObstacleType(type);
    const data = obstaclePresets[type];
    setHasObstacle(true);
    setIsRerouting(true);

    setTimeout(() => {
      setActiveRoute('bypass');
      setIsRerouting(false);
      setLastRerouteTimestamp(new Date().toLocaleTimeString());
      if (triggerLidarObstacle) {
        triggerLidarObstacle(type, data);
      }
      if (onRerouteChange) {
        onRerouteChange({
          hasObstacle: true,
          activeRoute: 'bypass',
          obstacle: data,
          bypassedVia: 'Barapullah Elevated Bypass (Corridor B)',
          timeSaved: '6.4 mins'
        });
      }
    }, 250);
  };

  const clearObstacle = () => {
    setIsRerouting(true);
    setTimeout(() => {
      setHasObstacle(false);
      setActiveRoute('primary');
      setIsRerouting(false);
      setLastRerouteTimestamp(new Date().toLocaleTimeString());
      if (ctxClearLidar) {
        ctxClearLidar();
      }
      if (onRerouteChange) {
        onRerouteChange({
          hasObstacle: false,
          activeRoute: 'primary',
          obstacle: null,
          bypassedVia: null
        });
      }
    }, 300);
  };

  // Autonomous Simulation Loop
  useEffect(() => {
    if (!autoSimLoop) return;
    const interval = setInterval(() => {
      if (hasObstacle) {
        clearObstacle();
      } else {
        const types = Object.keys(obstaclePresets);
        const randomType = types[Math.floor(Math.random() * types.length)];
        triggerObstacleDetection(randomType);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [autoSimLoop, hasObstacle]);

  // =========================================================================
  // THREE.JS 3D FORMAT WEBGL SCENE SETUP & ANIMATION LOOP
  // =========================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 760;
    let height = container.clientHeight || 480;

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x060c18, 0.007);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x7dd3fc, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(25, 45, -15);
    scene.add(sunLight);

    const headlight = new THREE.PointLight(0xffffff, 2.5, 45);
    headlight.position.set(0, 1.2, 0);
    scene.add(headlight);

    const emergencyBeacon = new THREE.PointLight(0x38bdf8, 2, 20);
    emergencyBeacon.position.set(0, 2.8, -3);
    scene.add(emergencyBeacon);

    const hazardLight = new THREE.PointLight(0xef4444, 3, 30);
    scene.add(hazardLight);

    // 3. Ground & Road Infrastructure in 3D
    const root3DGroup = new THREE.Group();
    scene.add(root3DGroup);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(260, 52, 0x0284c7, 0x0f2744);
    gridHelper.position.y = -0.05;
    root3DGroup.add(gridHelper);

    // Dark Asphalt Road Plane (220m long corridor)
    const roadGeo = new THREE.PlaneGeometry(16, 220);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      roughness: 0.8,
      metalness: 0.2
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, 80);
    root3DGroup.add(roadMesh);

    // Road Kerbs
    const kerbMat = new THREE.MeshBasicMaterial({
      color: hasObstacle ? 0xef4444 : 0x10b981
    });
    [-8, 8].forEach(x => {
      const kerbGeo = new THREE.BoxGeometry(0.3, 0.25, 220);
      const kerbMesh = new THREE.Mesh(kerbGeo, kerbMat);
      kerbMesh.position.set(x, 0.1, 80);
      root3DGroup.add(kerbMesh);
    });

    // Dashed Centerlines
    const laneDashGroup = new THREE.Group();
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    for (let z = -20; z < 180; z += 6) {
      const dashGeo = new THREE.PlaneGeometry(0.25, 3.2);
      const dashMesh = new THREE.Mesh(dashGeo, dashMat);
      dashMesh.rotation.x = -Math.PI / 2;
      dashMesh.position.set(0, 0.02, z);
      laneDashGroup.add(dashMesh);
    }
    root3DGroup.add(laneDashGroup);

    // 4. Dynamic Elevated Bypass Reroute in 3D
    const bypassGroup = new THREE.Group();
    root3DGroup.add(bypassGroup);

    if (hasObstacle) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.1, 8),
        new THREE.Vector3(4, 1.2, 18),
        new THREE.Vector3(12, 3.5, 34),
        new THREE.Vector3(16, 5.0, 58),
        new THREE.Vector3(16, 5.0, 110)
      ]);

      const tubeGeo = new THREE.TubeGeometry(curve, 40, 1.8, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.65,
        roughness: 0.3,
        metalness: 0.8
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      bypassGroup.add(tubeMesh);

      const linePoints = curve.getPoints(60);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
      const splineLine = new THREE.Line(lineGeo, lineMat);
      bypassGroup.add(splineLine);

      [22, 42, 70, 95].forEach(pz => {
        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 5, 8);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(16, 2.5, pz);
        bypassGroup.add(pillar);
      });
    }

    // 5. 3D Ego Ambulance Model
    const ambGroup = new THREE.Group();
    ambGroup.position.set(0, 0, -4);
    root3DGroup.add(ambGroup);

    const ambBodyGeo = new THREE.BoxGeometry(2.4, 1.8, 5.2);
    const ambBodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const ambBody = new THREE.Mesh(ambBodyGeo, ambBodyMat);
    ambBody.position.y = 1.3;
    ambGroup.add(ambBody);

    const stripeGeo = new THREE.BoxGeometry(2.44, 0.35, 5.0);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 1.25;
    ambGroup.add(stripe);

    const glassGeo = new THREE.BoxGeometry(2.2, 0.8, 1.2);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.6, 1.8);
    ambGroup.add(glass);

    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    wheelGeo.rotateZ(Math.PI / 2);

    [
      [-1.25, 0.48, 1.6],
      [1.25, 0.48, 1.6],
      [-1.25, 0.48, -1.6],
      [1.25, 0.48, -1.6]
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      ambGroup.add(wheel);
    });

    // Spinning 3D LiDAR Sensor Puck (Gold / Cyan)
    const lidarPuckGroup = new THREE.Group();
    lidarPuckGroup.position.set(0, 2.35, 0.8);
    ambGroup.add(lidarPuckGroup);

    const puckGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    const puckMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const puckMesh = new THREE.Mesh(puckGeo, puckMat);
    lidarPuckGroup.add(puckMesh);

    // 3D Laser Fan Sweep Visualizer
    const laserConeGeo = new THREE.ConeGeometry(18, 38, 32, 1, true);
    laserConeGeo.rotateX(-Math.PI / 2);
    const laserConeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.12,
      wireframe: true
    });
    const laserCone = new THREE.Mesh(laserConeGeo, laserConeMat);
    laserCone.position.set(0, 2.35, 19);
    ambGroup.add(laserCone);

    // 6. 3D LiDAR Point Cloud (1400 reflective returns)
    const pointsCount = 1400;
    const pointPositions = new Float32Array(pointsCount * 3);
    const pointColors = new Float32Array(pointsCount * 3);

    for (let i = 0; i < pointsCount; i++) {
      const i3 = i * 3;
      const pz = Math.random() * 110;
      const px = (Math.random() - 0.5) * 15;
      const py = Math.random() * 0.4;

      pointPositions[i3] = px;
      pointPositions[i3 + 1] = py;
      pointPositions[i3 + 2] = pz;

      pointColors[i3] = 0.05;
      pointColors[i3 + 1] = 0.75;
      pointColors[i3 + 2] = 0.85;
    }

    const pointCloudGeo = new THREE.BufferGeometry();
    pointCloudGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    pointCloudGeo.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));

    const pointCloudMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const pointCloud = new THREE.Points(pointCloudGeo, pointCloudMat);
    root3DGroup.add(pointCloud);

    // 7. 3D Volumetric Obstacle Group - SHIFTED TO THE SIDE OF THE MAP (Roadside/Shoulder)
    const obstacleGroup = new THREE.Group();
    root3DGroup.add(obstacleGroup);

    // Obstacle is explicitly shifted to the SIDE of the 3D road/map (x = +4.6m at right shoulder)
    const obsDistZ = currentObstacleData.distance * 0.72;
    const obsOffsetX = 4.6; // Shifted at the side of the 3D map!
    const obsElevationY = obstacleType === 'waterlog' ? 0.05 : 1.2;

    obstacleGroup.position.set(obsOffsetX, 0, obsDistZ);
    hazardLight.position.set(obsOffsetX, 2.5, obsDistZ);

    if (hasObstacle) {
      if (obstacleType === 'stalled-truck') {
        const cabinGeo = new THREE.BoxGeometry(2.7, 2.8, 3.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.4, -1.8);
        obstacleGroup.add(cabin);

        const truckGlassGeo = new THREE.BoxGeometry(2.5, 1.0, 0.4);
        const truckGlass = new THREE.Mesh(truckGlassGeo, glassMat);
        truckGlass.position.set(0, 1.9, -0.2);
        obstacleGroup.add(truckGlass);

        const trailerGeo = new THREE.BoxGeometry(2.8, 3.6, 6.2);
        const trailerMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
        const trailer = new THREE.Mesh(trailerGeo, trailerMat);
        trailer.position.set(0, 2.0, 3.0);
        obstacleGroup.add(trailer);

        [-1.4, 1.4].forEach(tx => {
          [ -1.8, 1.2, 4.2 ].forEach(tz => {
            const tw = new THREE.Mesh(wheelGeo, wheelMat);
            tw.position.set(tx, 0.5, tz);
            obstacleGroup.add(tw);
          });
        });

      } else if (obstacleType === 'debris') {
        [-1.5, 0.2, 1.8].forEach((bx, idx) => {
          const barrierGeo = new THREE.BoxGeometry(1.6, 1.1, 0.5);
          const barrierMat = new THREE.MeshStandardMaterial({
            color: idx % 2 === 0 ? 0xf97316 : 0xf8fafc,
            roughness: 0.7
          });
          const barrier = new THREE.Mesh(barrierGeo, barrierMat);
          barrier.position.set(bx, 0.55, idx * 0.4);
          barrier.rotation.y = (idx - 1) * 0.25;
          obstacleGroup.add(barrier);
        });

        [-0.8, 0.9].forEach(cx => {
          const coneGeo = new THREE.ConeGeometry(0.35, 0.9, 12);
          const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.position.set(cx, 0.45, -1.2);
          obstacleGroup.add(cone);
        });

      } else if (obstacleType === 'waterlog') {
        const puddleGeo = new THREE.CylinderGeometry(4.2, 4.8, 0.15, 24);
        const puddleMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          roughness: 0.05,
          metalness: 0.9,
          transparent: true,
          opacity: 0.85
        });
        const puddle = new THREE.Mesh(puddleGeo, puddleMat);
        puddle.position.set(0, 0.05, 0);
        obstacleGroup.add(puddle);

        const manholeGeo = new THREE.TorusGeometry(0.8, 0.2, 12, 24);
        manholeGeo.rotateX(Math.PI / 2);
        const manholeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        const manhole = new THREE.Mesh(manholeGeo, manholeMat);
        manhole.position.set(0, 0.08, 0);
        obstacleGroup.add(manhole);

      } else if (obstacleType === 'accident') {
        const car1Geo = new THREE.BoxGeometry(2.1, 1.4, 4.4);
        const car1Mat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
        const car1 = new THREE.Mesh(car1Geo, car1Mat);
        car1.position.set(-0.6, 0.7, -1.2);
        car1.rotation.y = 0.4;
        obstacleGroup.add(car1);

        const car2Geo = new THREE.BoxGeometry(2.2, 1.5, 4.6);
        const car2Mat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const car2 = new THREE.Mesh(car2Geo, car2Mat);
        car2.position.set(0.8, 0.75, 1.4);
        car2.rotation.y = -0.55;
        car2.rotation.z = 0.15;
        obstacleGroup.add(car2);
      }

      // 3D Pulsing Hazard Bounding Box Wireframe
      const bboxGeo = new THREE.BoxGeometry(
        obstacleType === 'accident' ? 5.2 : obstacleType === 'stalled-truck' ? 3.4 : 4.2,
        obstacleType === 'stalled-truck' ? 4.2 : 2.5,
        obstacleType === 'accident' ? 8.2 : obstacleType === 'stalled-truck' ? 9.5 : 5.0
      );
      const bboxMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        wireframe: true,
        transparent: true,
        opacity: 0.65
      });
      const bboxMesh = new THREE.Mesh(bboxGeo, bboxMat);
      bboxMesh.position.y = obstacleType === 'stalled-truck' ? 2.1 : 1.25;
      obstacleGroup.add(bboxMesh);

      // Dense 3D Point Cloud Cluster around obstacle at the side of map
      const obsPointsCount = 280;
      const obsPositions = new Float32Array(obsPointsCount * 3);
      for (let j = 0; j < obsPointsCount; j++) {
        const j3 = j * 3;
        obsPositions[j3] = (Math.random() - 0.5) * 3.5;
        obsPositions[j3 + 1] = Math.random() * 3.2;
        obsPositions[j3 + 2] = (Math.random() - 0.5) * 8.0;
      }
      const obsCloudGeo = new THREE.BufferGeometry();
      obsCloudGeo.setAttribute('position', new THREE.BufferAttribute(obsPositions, 3));
      const obsCloudMat = new THREE.PointsMaterial({
        size: 0.45,
        color: 0xef4444,
        transparent: true,
        opacity: 0.95
      });
      const obsCloud = new THREE.Points(obsCloudGeo, obsCloudMat);
      obstacleGroup.add(obsCloud);
    }

    // 8. Camera Views Configuration
    const applyCameraPreset = (mode) => {
      if (mode === 'orbit') {
        camera.position.set(16, 15, -20);
        camera.lookAt(2, 2, 22);
      } else if (mode === 'cockpit') {
        camera.position.set(0, 1.85, 0.8);
        camera.lookAt(1.5, 1.7, 45);
      } else if (mode === 'top-down') {
        camera.position.set(0, 52, 22);
        camera.lookAt(2, 0, 22);
      } else if (mode === 'target') {
        camera.position.set(obsOffsetX + 5, 4.5, obsDistZ - 9);
        camera.lookAt(obsOffsetX, 1.5, obsDistZ);
      }
    };
    applyCameraPreset(cameraView);

    // 9. Interactive Orbit / Mouse Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let orbitAngleX = 0;
    let orbitAngleY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      orbitAngleX += deltaX * 0.006;
      orbitAngleY = Math.max(-0.6, Math.min(1.2, orbitAngleY + deltaY * 0.006));

      if (cameraView === 'orbit') {
        const radius = 32;
        const camY = 15 + Math.sin(orbitAngleY) * 12;
        const camX = Math.sin(orbitAngleX) * radius;
        const camZ = -20 + Math.cos(orbitAngleX) * radius;
        camera.position.set(camX, camY, camZ);
        camera.lookAt(2, 2, 22);
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.fov = Math.max(25, Math.min(75, camera.fov + e.deltaY * 0.03));
      camera.updateProjectionMatrix();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    // Handle Window & Container Resize
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 760;
      height = container.clientHeight || 480;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Spinning LiDAR Puck at 20 Hz
      puckMesh.rotation.y += 0.08;
      laserCone.rotation.z += 0.04;
      setScanAngleDeg(Math.round(((elapsedTime * 80) % 360)));

      // Emergency Beacon Flash
      const flashTick = Math.sin(elapsedTime * 12);
      emergencyBeacon.color.setHex(flashTick > 0 ? 0xef4444 : 0x38bdf8);
      emergencyBeacon.intensity = 1.5 + Math.abs(flashTick) * 2;

      // Obstacle Hazard Strobe
      hazardLight.intensity = Math.sin(elapsedTime * 10) > 0 ? 3.5 : 0.2;

      // Auto-Orbit camera if enabled
      if (isAutoRotating && !isDragging && cameraView === 'orbit') {
        const autoAngle = elapsedTime * 0.15;
        const radius = 30;
        camera.position.x = Math.sin(autoAngle) * radius;
        camera.position.z = -18 + (Math.cos(autoAngle) * radius * 0.6);
        camera.position.y = 14 + Math.sin(elapsedTime * 0.4) * 2.5;
        camera.lookAt(2, 2, 22);
      }

      // Calculate 2D Screen Position for 2.5D Coordinates HUD Tag
      if (hasObstacle) {
        const worldPos = new THREE.Vector3(obsOffsetX, obsElevationY + 2.8, obsDistZ);
        worldPos.project(camera);

        const isBehind = worldPos.z > 1.0;
        if (!isBehind) {
          const sx = (worldPos.x * 0.5 + 0.5) * width;
          const sy = (-(worldPos.y * 0.5) + 0.5) * height;
          setHudPos({ x: sx, y: sy, visible: true });
        } else {
          setHudPos(prev => ({ ...prev, visible: false }));
        }
      } else {
        setHudPos(prev => ({ ...prev, visible: false }));
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(domElem)) {
        container.removeChild(domElem);
      }
    };
  }, [hasObstacle, obstacleType, cameraView, isAutoRotating]);

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: 3D LIDAR VISUALIZER & 2.5D SPATIAL TELEMETRY               */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950">
            <Radar className="w-6 h-6 animate-spin text-cyan-400" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Obstacle Detection through 3D LiDAR Visualizer</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700">
                  3D Format
                </span>
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 shadow-sm ${
                hasObstacle
                  ? 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${hasObstacle ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                <span>{hasObstacle ? '🚨 HAZARD IN TRAJECTORY' : '🟢 CORRIDOR CLEAR'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Solid-State 128-Beam Automotive LiDAR • 3D Format Volumetric Obstacles Shifted at Side of Map • 2.5D Coordinates &amp; Elevation Profile
            </p>
          </div>
        </div>

        {/* Dynamic Route Status & 2.5D Coordinates Quick Badge */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
              Active Navigation Route
            </span>
            <span className={`text-xs font-bold font-mono flex items-center justify-end gap-1.5 ${
              activeRoute === 'bypass' ? 'text-cyan-400' : 'text-emerald-400'
            }`}>
              {activeRoute === 'bypass' ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span>Route 2: Barapullah Bypass (Rerouted)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Route 1: Outer Ring Road (Primary)</span>
                </>
              )}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
              Target 2.5D Coordinates
            </span>
            <span className="text-xs font-bold font-mono text-amber-300">
              {hasObstacle
                ? `X: ${currentObstacleData.coords25D.x} | Y: ${currentObstacleData.coords25D.y} | Z: ${currentObstacleData.coords25D.z}`
                : 'X: >150m (Clear)'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC REROUTE ALERT BANNER                                           */}
      {/* ========================================================================= */}
      {hasObstacle ? (
        <div className="p-4 bg-gradient-to-r from-rose-950/90 via-slate-900 to-cyan-950/80 border-2 border-rose-500 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 text-red-400 border border-red-500/60 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <AlertOctagon className="w-5 h-5 text-red-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-extrabold text-sm flex items-center gap-1.5">
                  <span>Obstacle Rendered in 3D Format at Side of Map:</span>
                  <span className="text-rose-400 font-mono underline">{currentObstacleData.title}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold">
                  2.5D Coords: [X: {currentObstacleData.coords25D.x}, Y: {currentObstacleData.coords25D.y}, Z: {currentObstacleData.coords25D.z}]
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Forward corridor hazard detected @ {currentObstacleData.distance}m, positioned at the side of the 3D map. <strong className="text-cyan-300">Route automatically switched to Barapullah Elevated Bypass.</strong> 2.5D elevation profile indicates safe overhead grade-separation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Bypass ETA</div>
              <div className="text-xl font-mono font-black text-cyan-400">~5.4 mins</div>
              <div className="text-[10px] text-emerald-400 font-mono font-bold">Saved: 6.4 mins vs standstill</div>
            </div>
            <button
              onClick={clearObstacle}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Manually clear obstacle and verify path clear"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Obstacle</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Corridor Clear: Primary Route Active (Outer Ring Road Express)</span>
                <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-bold">150m Range Safe</span>
              </div>
              <p className="text-xs text-slate-400">
                3D LiDAR point cloud reports zero obstructions in current forward vector. 2.5D road grade verified nominal.
              </p>
            </div>
          </div>
          <button
            onClick={() => triggerObstacleDetection('stalled-truck')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-950 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate 3D Obstacle at Side of Map</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN 3D FORMAT LIDAR OBSTACLE MAP & 2.5D COORDINATES HUD               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Three.js WebGL 3D Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Top Canvas Controls & Camera Presets Overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="text-xs font-bold text-white font-mono bg-slate-900/85 px-3 py-1.5 rounded-xl border border-slate-700/80 backdrop-blur-md flex items-center gap-2 shadow-lg">
                  <Box className="w-4 h-4 text-cyan-400" />
                  <span>3D LiDAR Obstacle Map (Shifted at Side of Road)</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/85 px-2.5 py-1.5 rounded-xl border border-cyan-800/80 backdrop-blur-md shadow-lg">
                  Sweep: {scanAngleDeg}°
                </span>
              </div>

              {/* 3D Camera Preset Switcher */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 backdrop-blur-md pointer-events-auto shadow-lg">
                <button
                  type="button"
                  onClick={() => setCameraView('orbit')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    cameraView === 'orbit'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/40 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="3D Orbit View (Drag to rotate freely)"
                >
                  3D Orbit
                </button>
                <button
                  type="button"
                  onClick={() => setCameraView('cockpit')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    cameraView === 'cockpit'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/40 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ambulance Cockpit Driver Perspective"
                >
                  3D Cockpit
                </button>
                <button
                  type="button"
                  onClick={() => setCameraView('top-down')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    cameraView === 'top-down'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/40 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="3D Bird's Eye Tactical View"
                >
                  3D Top-Down
                </button>
                {hasObstacle && (
                  <button
                    type="button"
                    onClick={() => setCameraView('target')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      cameraView === 'target'
                        ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/40 font-black'
                        : 'text-rose-300 hover:text-white'
                    }`}
                    title="Lock onto 3D Obstacle Target at Side of Map"
                  >
                    Target Lock
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isAutoRotating ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle 3D Orbit Auto-Rotation"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                </button>
              </div>
            </div>

            {/* Floating 2.5D Coordinates Projected Tag (Above 3D Obstacle at side of map) */}
            {hasObstacle && hudPos.visible && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full mb-3"
                style={{ left: `${hudPos.x}px`, top: `${hudPos.y}px` }}
              >
                <div className="bg-slate-900/95 border-2 border-rose-500 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md space-y-1 min-w-[210px]">
                  <div className="flex items-center justify-between gap-2 border-b border-rose-500/40 pb-1">
                    <span className="text-[10px] font-mono font-black text-rose-400 uppercase flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-rose-400 animate-spin" />
                      3D Obstacle (Side of Map)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-rose-950 text-rose-300 rounded font-bold">
                      2.5D Coords
                    </span>
                  </div>

                  <div className="text-xs font-black font-mono text-white">
                    {currentObstacleData.title.slice(0, 26)}
                  </div>

                  {/* Explicit 2.5D Coordinates */}
                  <div className="bg-slate-950/90 p-1.5 rounded-lg border border-slate-800 text-[10px] font-mono space-y-0.5">
                    <div className="text-amber-300 font-bold flex items-center justify-between">
                      <span>2.5D Spatial:</span>
                      <span>[X: {currentObstacleData.coords25D.x}, Y: {currentObstacleData.coords25D.y}, Z: {currentObstacleData.coords25D.z}]</span>
                    </div>
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Elevation:</span>
                      <span className="text-cyan-300 font-semibold">{currentObstacleData.coords25D.elevationASL}</span>
                    </div>
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>GPS:</span>
                      <span className="text-slate-200">{currentObstacleData.coords25D.gpsLat}, {currentObstacleData.coords25D.gpsLng}</span>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-cyan-400 font-bold text-center pt-0.5">
                    ⚡ SHIFTED AT SIDE OF ROAD CORRIDOR
                  </div>
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rose-500 mx-auto" />
              </div>
            )}

            {/* Three.js 3D Canvas Mounting Container */}
            <div
              ref={containerRef}
              className="w-full h-[450px] sm:h-[490px] bg-slate-950 block cursor-grab active:cursor-grabbing"
            />

            {/* 3D Interaction Hint */}
            <div className="absolute top-16 right-4 z-10 pointer-events-none hidden sm:block">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                🖱️ Drag to rotate 3D view • Scroll to zoom
              </span>
            </div>

            {/* Canvas Bottom Diagnostics HUD: 2.5D Coordinates & Metrics */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px] font-mono text-slate-300 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Solid-State 128 Array (3D Format)
                </span>
                <span>•</span>
                <span className="text-slate-400">Position: Side of Map</span>
                <span>•</span>
                <span className="text-slate-400">FOV: 120° H × 30° V</span>
              </div>

              {/* Explicit 2.5D Coordinates Banner */}
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Target 2.5D Vector:</span>
                <span className={hasObstacle ? 'text-amber-300 font-black font-mono' : 'text-emerald-400 font-bold font-mono'}>
                  {hasObstacle
                    ? `[X: ${currentObstacleData.coords25D.x}, Y: ${currentObstacleData.coords25D.y}, Z: ${currentObstacleData.coords25D.z}]`
                    : 'X: >150m (Safe)'}
                </span>
                <span>•</span>
                <span className="text-white font-bold">
                  Confidence: {hasObstacle ? currentObstacleData.confidence : '99.9%'}
                </span>
              </div>
            </div>

          </div>

          {/* DYNAMIC ROUTE COMPARISON CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Route 1 Card (Primary) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              activeRoute === 'primary'
                ? 'bg-emerald-950/70 border-2 border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                : 'bg-slate-900/80 border-slate-800 opacity-75'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-300">ROUTE 1 (PRIMARY ARTERIAL)</span>
                {hasObstacle ? (
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-mono font-bold border border-red-800">
                    ❌ BLOCKED @ 38m
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-800">
                    ✅ ACTIVE
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Outer Ring Road Express</h4>
              <p className="text-xs text-slate-400 mb-3">
                {hasObstacle
                  ? 'Hazard obstruction detected by 3D LiDAR. Route suspended to prevent ambulance stall in gridlock.'
                  : 'Fastest direct corridor with AI green wave preemption clearance.'}
              </p>
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
                <span className="text-slate-400">Length: 2.8 km</span>
                <span className={`font-bold ${hasObstacle ? 'text-red-400 line-through' : 'text-emerald-400'}`}>
                  ETA: ~5.0 mins
                </span>
              </div>
            </div>

            {/* Route 2 Card (Bypass) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              activeRoute === 'bypass'
                ? 'bg-cyan-950/70 border-2 border-cyan-400 shadow-xl ring-2 ring-cyan-500/40'
                : 'bg-slate-900/80 border-slate-800 opacity-75'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-cyan-300">ROUTE 2 (3D DYNAMIC BYPASS)</span>
                {activeRoute === 'bypass' ? (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-700 animate-pulse">
                    ⚡ ACTIVATED (BYPASS)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                    STANDBY
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Barapullah Elevated Bypass</h4>
              <p className="text-xs text-slate-400 mb-3">
                Autonomous avoidance detour via elevated flyover ramp. Zero ground obstruction, grade-separated signal hold.
              </p>
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
                <span className="text-slate-400">Length: 3.1 km (+300m)</span>
                <span className="text-cyan-400 font-bold">ETA: ~5.4 mins (Clear)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: 2.5D Coordinates Matrix & Simulation Controls */}
        <div className="space-y-5">
          
          {/* ========================================================================= */}
          {/* CRITICAL PANEL: 2.5D SPATIAL COORDINATE MATRIX BREAKDOWN                  */}
          {/* ========================================================================= */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>2.5D Spatial Coordinate Matrix</span>
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 font-bold">
                2.5D Coordinates
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Obstacles are rendered in full <strong>3D format at the side of the map</strong>, while spatial telemetry and positioning are referenced using high-precision <strong>2.5D coordinates</strong>:
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Distance Ahead (X):</span>
                <strong className="text-white text-sm">{currentObstacleData.coords25D.x}</strong>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Side of Road (Y):</span>
                <strong className="text-cyan-300 text-sm">{currentObstacleData.coords25D.y}</strong>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Vertical Elevation (Z):</span>
                <strong className="text-amber-300 text-sm">{currentObstacleData.coords25D.z}</strong>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Digital Elevation (ASL):</span>
                <strong className="text-emerald-400">{currentObstacleData.coords25D.elevationASL}</strong>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">2.5D Bounding Box:</span>
                <span className="text-slate-200 text-[11px]">{currentObstacleData.coords25D.dimensions}</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">2.5D Geographic Landmark:</span>
                <span className="text-slate-300 text-[11px]">{currentObstacleData.coords25D.gpsLat}, {currentObstacleData.coords25D.gpsLng}</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Polar Beam Vector:</span>
                <span className="text-cyan-400 text-[11px]">{currentObstacleData.coords25D.azimuth} | Elev: {currentObstacleData.coords25D.polarElevation}</span>
              </div>
            </div>
          </div>

          {/* Obstacle Simulation & Injection Panel */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Simulate 3D Obstacle Scenarios</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Interactive Test</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Select hazard scenarios to render in the 3D LiDAR map at the side of the road with real-time 2.5D coordinates:
            </p>

            <div className="space-y-2">
              {Object.entries(obstaclePresets).map(([key, data]) => {
                const isSelected = hasObstacle && obstacleType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => triggerObstacleDetection(key)}
                    className={`w-full text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950/80 border-rose-500 text-white shadow-md shadow-rose-950'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate">{data.title}</span>
                      <span className="font-mono text-[10px] font-bold text-amber-300 shrink-0 ml-2">
                        2.5D: [{data.coords25D.x}, {data.coords25D.z}]
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span className="truncate">{data.lane}</span>
                      <span className="text-cyan-400 font-mono font-bold shrink-0">{data.confidence}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Action Button Bar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {hasObstacle ? (
                <button
                  type="button"
                  onClick={clearObstacle}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clear Hazard &amp; Resume Primary Route</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => triggerObstacleDetection('stalled-truck')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Spawn 3D Obstacle at Side of Map</span>
                </button>
              )}
            </div>

            {/* Auto Simulation Loop Toggle */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">Auto Hazard Cycle</span>
                <span className="text-[11px] text-slate-400">Randomly cycles 3D obstacles</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoSimLoop(!autoSimLoop)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer ${
                  autoSimLoop
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {autoSimLoop ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 3D LiDAR Hardware Specifications */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 text-xs">
            <span className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>3D LiDAR Sensor &amp; 2.5D Positioning Specs</span>
            </span>

            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800/60">
                <span>Rendering Engine</span>
                <span className="text-cyan-400 font-bold">Three.js WebGL (3D Format)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800/60">
                <span>Spatial Coordinate Model</span>
                <span className="text-amber-300 font-bold">2.5D (X, Y, Z Elevation)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800/60">
                <span>Hardware Unit</span>
                <span className="text-white font-bold">Velodyne 128 Puck Solid-State</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800/60">
                <span>Resolution / Beams</span>
                <span className="text-cyan-400 font-bold">128 Channels (0.1° Angular)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800/60">
                <span>Detection Range</span>
                <span className="text-white font-bold">150 meters (0.5m - 150m)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800/60">
                <span>Reroute Latency</span>
                <span className="text-yellow-400 font-bold">120 ms (Autonomous)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Last Reroute Trigger</span>
                <span className="text-slate-300 font-bold">{lastRerouteTimestamp}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
