import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Activity,
  Heart,
  Brain,
  ShieldAlert,
  Maximize2,
  Minimize2,
  X,
  Crosshair,
  Layers,
  Eye,
  Sparkles,
  User,
  Wind,
  Thermometer,
  Droplets,
  Volume2,
  VolumeX
} from 'lucide-react';
import { playMedicalHeartBeep, resumeAudioContext } from '../utils/heartBeeper';
import patient3dModelImg from '../assets/patient_3d_bright.jpg';
import organHeartImg from '../assets/organ_3d_heart.jpg';
import organLungsImg from '../assets/organ_3d_lungs.jpg';
import organBrainImg from '../assets/organ_3d_brain.jpg';

export const DigitalTwin3D = ({
  twin,
  onSelectRegion = null,
  activeRegionId = null,
  height = "520px",
  isFullscreen: externalFullscreen = undefined,
  onToggleFullscreen = null
}) => {
  const containerRef = useRef(null);
  const ecgCanvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const reqAnimRef = useRef(null);
  const ecgAnimRef = useRef(null);

  const [viewMode, setViewMode] = useState('3d_model'); // '3d_model' | 'interactive_webgl'
  const [selectedOrgan, setSelectedOrgan] = useState('full'); // 'full' | 'heart' | 'lungs' | 'brain'
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [activeLayer, setActiveLayer] = useState('all'); // 'all' | 'cardiac' | 'neuro' | 'trauma'
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isBeeping, setIsBeeping] = useState(false);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isMutedRef = useRef(false);

  const isFullscreen = externalFullscreen !== undefined ? externalFullscreen : internalFullscreen;

  const handleToggleFullscreen = () => {
    const next = !isFullscreen;
    if (externalFullscreen === undefined) {
      setInternalFullscreen(next);
    }
    if (onToggleFullscreen) {
      onToggleFullscreen(next);
    }
  };

  // Keyboard shortcut: Escape exits full screen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (externalFullscreen === undefined) {
          setInternalFullscreen(false);
        }
        if (onToggleFullscreen) {
          onToggleFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, externalFullscreen, onToggleFullscreen]);

  useEffect(() => {
    isMutedRef.current = isAudioMuted;
  }, [isAudioMuted]);

  // Synchronize with external activeRegionId if passed
  useEffect(() => {
    if (activeRegionId) {
      const lower = String(activeRegionId).toLowerCase();
      if (lower.includes('cardiac') || lower.includes('heart')) {
        setSelectedOrgan('heart');
      } else if (lower.includes('lung') || lower.includes('pulmonary')) {
        setSelectedOrgan('lungs');
      } else if (lower.includes('chest') || lower.includes('thorax')) {
        setSelectedOrgan('heart');
      } else if (lower.includes('brain') || lower.includes('cranial') || lower.includes('neuro') || lower.includes('head')) {
        setSelectedOrgan('brain');
      } else {
        setSelectedOrgan('full');
      }
    }
  }, [activeRegionId]);

  // Dynamic values from digital twin
  const heartRate = twin?.vitals?.heartRate !== undefined ? Number(twin.vitals.heartRate) : 118;
  const respiratoryRate = twin?.vitals?.respiratoryRate !== undefined ? Number(twin.vitals.respiratoryRate) : 28;
  const consciousnessStatus = twin?.consciousnessStatus || 'Voice Responsive';
  const spo2 = twin?.vitals?.spo2 !== undefined
    ? Number(twin.vitals.spo2)
    : (twin?.vitals?.oxygenSaturation
        ? (typeof twin.vitals.oxygenSaturation === 'number' ? twin.vitals.oxygenSaturation : parseInt(twin.vitals.oxygenSaturation) || 91)
        : 91);
  const bp = twin?.vitals?.bloodPressure || '95/60 mmHg';
  const isUnconscious = consciousnessStatus === 'Unconscious';

  // Resize Three.js viewport when switching to interactive_webgl
  useEffect(() => {
    if (viewMode === 'interactive_webgl' && containerRef.current && rendererRef.current && cameraRef.current) {
      const timer = setTimeout(() => {
        const w = containerRef.current?.clientWidth || 600;
        const h = containerRef.current?.clientHeight || 520;
        if (w > 0 && h > 0) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // 1. Initialize Three.js 3D WebGL Canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const heightPx = containerRef.current.clientHeight || 520;

    // Scene setup (no black fog so all meshes remain 100% visible)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(0, 0.8, 5.0);
    cameraRef.current = camera;

    // Renderer setup (clear color: transparent, so the illuminated chamber background shows through without black screen)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 100% transparent to prevent black canvas!
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Glowing cyan ground grid for 3D depth
    const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x0284c7);
    gridHelper.position.y = -1.95;
    scene.add(gridHelper);

    // High-intensity holographic lights
    const ambientLight = new THREE.AmbientLight(0x67e8f9, 3.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 4.0);
    dirLight.position.set(3, 8, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 3.5);
    rimLight.position.set(-3, -2, -4);
    scene.add(rimLight);

    // Root model group that can be rotated
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -0.4, 0);
    scene.add(bodyGroup);

    // Holographic Circular Pedestal at feet
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.08, 36);
    const pedestalMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -1.9, 0);
    bodyGroup.add(pedestal);

    // Rotating pulse ring around pedestal
    const ringGeo = new THREE.RingGeometry(1.4, 1.55, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(0, -1.86, 0);
    bodyGroup.add(ringMesh);

    // --- MATERIALS FOR HOLOGRAPHIC ANATOMY (High-visibility neon cyber-medical shaders) ---
    const holoBlueMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.5,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });

    const skinGhostMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.55,
      roughness: 0.2,
      metalness: 0.1
    });

    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.8,
      wireframe: true
    });

    // 1. Head & Cranium
    const headGeo = new THREE.SphereGeometry(0.36, 24, 20);
    const headMesh = new THREE.Mesh(headGeo, skinGhostMat);
    headMesh.position.set(0, 2.1, 0);
    const headWire = new THREE.Mesh(headGeo, holoBlueMat);
    headMesh.add(headWire);
    bodyGroup.add(headMesh);

    // Brain Node (Dynamic consciousness illumination)
    const brainColor = isUnconscious
      ? 0xef4444 // Red for unconscious
      : (consciousnessStatus === 'Alert' ? 0x10b981 : 0xf59e0b); // Green or Amber

    const brainGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const brainMat = new THREE.MeshStandardMaterial({
      color: brainColor,
      emissive: brainColor,
      emissiveIntensity: 1.2,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const brainMesh = new THREE.Mesh(brainGeo, brainMat);
    brainMesh.position.set(0, 2.1, 0.02);
    bodyGroup.add(brainMesh);

    const brainLight = new THREE.PointLight(brainColor, 2, 2);
    brainLight.position.set(0, 2.1, 0.1);
    bodyGroup.add(brainLight);

    // 2. Neck
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.24, 16);
    const neckMesh = new THREE.Mesh(neckGeo, holoBlueMat);
    neckMesh.position.set(0, 1.76, 0);
    bodyGroup.add(neckMesh);

    // 3. Torso (Chest & Ribcage)
    const chestGeo = new THREE.CylinderGeometry(0.48, 0.40, 0.80, 20);
    const chestMesh = new THREE.Mesh(chestGeo, skinGhostMat);
    chestMesh.position.set(0, 1.35, 0);
    const chestWire = new THREE.Mesh(chestGeo, holoBlueMat);
    chestMesh.add(chestWire);
    bodyGroup.add(chestMesh);

    // Spine Column
    const spineGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.4, 12);
    const spineMesh = new THREE.Mesh(spineGeo, spineMat);
    spineMesh.position.set(0, 1.15, -0.05);
    bodyGroup.add(spineMesh);

    // 4. Pulsing 3D Heart
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.1, -0.15, 0.18, -0.2, 0);
    heartShape.bezierCurveTo(-0.25, -0.15, 0, -0.3, 0, -0.38);
    heartShape.bezierCurveTo(0, -0.3, 0.25, -0.15, 0.2, 0);
    heartShape.bezierCurveTo(0.15, 0.18, 0, 0.1, 0, 0);

    const heartExtrude = new THREE.ExtrudeGeometry(heartShape, { depth: 0.12, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 });
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.5,
      roughness: 0.3
    });
    const heartMesh = new THREE.Mesh(heartExtrude, heartMat);
    heartMesh.scale.set(0.65, 0.65, 0.65);
    heartMesh.position.set(-0.12, 1.48, 0.14);
    bodyGroup.add(heartMesh);

    const heartLight = new THREE.PointLight(0xef4444, 3, 2.5);
    heartLight.position.set(-0.12, 1.48, 0.25);
    bodyGroup.add(heartLight);

    // 5. Breathing Lungs
    const lungGeo = new THREE.CapsuleGeometry(0.16, 0.38, 10, 14);
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    const leftLung = new THREE.Mesh(lungGeo, lungMat);
    leftLung.position.set(-0.22, 1.40, 0.06);
    bodyGroup.add(leftLung);

    const rightLung = new THREE.Mesh(lungGeo, lungMat);
    rightLung.position.set(0.22, 1.40, 0.06);
    bodyGroup.add(rightLung);

    // 6. Abdomen & Pelvis
    const abdomenGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.55, 18);
    const abdomenMesh = new THREE.Mesh(abdomenGeo, holoBlueMat);
    abdomenMesh.position.set(0, 0.72, 0);
    bodyGroup.add(abdomenMesh);

    const pelvisGeo = new THREE.CylinderGeometry(0.42, 0.34, 0.35, 18);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, holoBlueMat);
    pelvisMesh.position.set(0, 0.32, 0);
    bodyGroup.add(pelvisMesh);

    // 7. Arms (Left & Right)
    const armGeo = new THREE.CylinderGeometry(0.10, 0.08, 0.85, 12);
    const jointGeo = new THREE.SphereGeometry(0.11, 12, 12);

    // Left Arm
    const leftArm = new THREE.Mesh(armGeo, holoBlueMat);
    leftArm.position.set(-0.65, 1.15, 0);
    leftArm.rotation.z = 0.18;
    bodyGroup.add(leftArm);

    const leftForearm = new THREE.Mesh(armGeo, holoBlueMat);
    leftForearm.position.set(-0.76, 0.35, 0.05);
    leftForearm.rotation.z = 0.08;
    bodyGroup.add(leftForearm);

    // Right Arm (Non-invasive BP Cuff attached)
    const rightArm = new THREE.Mesh(armGeo, holoBlueMat);
    rightArm.position.set(0.65, 1.15, 0);
    rightArm.rotation.z = -0.18;
    bodyGroup.add(rightArm);

    const bpCuffGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16);
    const bpCuffMat = new THREE.MeshStandardMaterial({ color: 0x10b981, wireframe: false });
    const bpCuff = new THREE.Mesh(bpCuffGeo, bpCuffMat);
    bpCuff.position.set(0.65, 1.15, 0);
    bodyGroup.add(bpCuff);

    const rightForearm = new THREE.Mesh(armGeo, holoBlueMat);
    rightForearm.position.set(0.76, 0.35, 0.05);
    rightForearm.rotation.z = -0.08;
    bodyGroup.add(rightForearm);

    // 8. Legs (Left & Right)
    const thighGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.95, 14);
    const shinGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.95, 14);

    // Left Leg
    const leftThigh = new THREE.Mesh(thighGeo, holoBlueMat);
    leftThigh.position.set(-0.28, -0.35, 0);
    bodyGroup.add(leftThigh);

    const leftShin = new THREE.Mesh(shinGeo, holoBlueMat);
    leftShin.position.set(-0.28, -1.25, 0);
    bodyGroup.add(leftShin);

    // Right Leg (Trauma zone if accident)
    const isRightLegTrauma = twin?.currentEmergency?.toLowerCase().includes('accident') || twin?.abilityToWalk?.toLowerCase().includes('leg');
    const rightThigh = new THREE.Mesh(thighGeo, holoBlueMat);
    rightThigh.position.set(0.28, -0.35, 0);
    bodyGroup.add(rightThigh);

    const rightShinMat = isRightLegTrauma
      ? new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, wireframe: true })
      : holoBlueMat;
    const rightShin = new THREE.Mesh(shinGeo, rightShinMat);
    rightShin.position.set(0.28, -1.25, 0);
    bodyGroup.add(rightShin);

    // 3D Trauma Hotspot Rings (Flashing pulsating indicator)
    const traumaRings = [];
    if (isRightLegTrauma) {
      const tRingGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 24);
      const tRingMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.9 });
      const tRing = new THREE.Mesh(tRingGeo, tRingMat);
      tRing.rotation.x = Math.PI / 2;
      tRing.position.set(0.28, -1.20, 0);
      bodyGroup.add(tRing);
      traumaRings.push(tRing);
    }

    // Interactive Raycaster for Region Hover / Clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', handlePointerMove);

    // Mouse drag rotation handling
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e) => {
      isDragging = true;
      setIsAutoRotating(false);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      bodyGroup.rotation.y += deltaX * 0.008;
      bodyGroup.rotation.x = Math.max(-0.4, Math.min(0.4, bodyGroup.rotation.x + deltaY * 0.005));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(2.8, Math.min(7.5, camera.position.z + e.deltaY * 0.004));
    };

    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });

    // Touch gesture support for mobile
    let touchStartX = 0;
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        setIsAutoRotating(false);
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartX;
        bodyGroup.rotation.y += deltaX * 0.008;
        touchStartX = e.touches[0].clientX;
      }
    };
    domEl.addEventListener('touchstart', handleTouchStart);
    domEl.addEventListener('touchmove', handleTouchMove);

    // Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // 1. Auto-rotation around vertical axis
      if (isAutoRotating) {
        bodyGroup.rotation.y += 0.005;
      }

      // 2. Pedestal ring counter-rotation
      ringMesh.rotation.z += 0.01;

      // 3. Heartbeat animation synchronized to live Heart Rate (BPM)
      const heartRateBps = heartRate / 60; // Beats per second
      const heartPhase = (elapsedTime * heartRateBps * Math.PI * 2);
      // Realistic systolic-diastolic double pulse
      const pulseScale = 0.65 + 0.12 * Math.pow(Math.max(0, Math.sin(heartPhase)), 6);
      heartMesh.scale.set(pulseScale, pulseScale, pulseScale);
      heartLight.intensity = 1.5 + 2.5 * Math.pow(Math.max(0, Math.sin(heartPhase)), 6);

      // 4. Lungs Respiration animation synchronized to Respiratory Rate
      const respBps = respiratoryRate / 60;
      const respPhase = elapsedTime * respBps * Math.PI * 2;
      const lungScale = 1.0 + 0.15 * Math.sin(respPhase);
      leftLung.scale.set(lungScale, lungScale, lungScale);
      rightLung.scale.set(lungScale, lungScale, lungScale);

      // 5. Brain Node consciousness glow pulse
      brainMesh.rotation.y += 0.015;
      brainLight.intensity = isUnconscious ? (0.6 + 0.3 * Math.sin(elapsedTime * 2)) : (1.8 + 0.8 * Math.sin(elapsedTime * 4));

      // 6. Trauma radar rings expansion
      traumaRings.forEach((tRing, i) => {
        const ringScale = 1 + ((elapsedTime * 1.5 + i * 0.5) % 1) * 0.8;
        tRing.scale.set(ringScale, ringScale, ringScale);
        tRing.material.opacity = Math.max(0, 0.9 - ((elapsedTime * 1.5 + i * 0.5) % 1));
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      domEl.removeEventListener('pointermove', handlePointerMove);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('wheel', handleWheel);
      domEl.removeEventListener('touchstart', handleTouchStart);
      domEl.removeEventListener('touchmove', handleTouchMove);

      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, [heartRate, respiratoryRate, consciousnessStatus, isUnconscious, isAutoRotating]);

  // 2. Real-time Animated 12-Lead ECG Waveform Monitor (Canvas bottom strip)
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = 0;
    const width = canvas.width;
    const heightCanvas = canvas.height;
    const midY = heightCanvas / 2;

    // Draw background grid lines
    const drawGrid = () => {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, heightCanvas);

      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, heightCanvas);
        ctx.stroke();
      }
      for (let j = 0; j < heightCanvas; j += 15) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }
    };

    drawGrid();

    // ECG waveform generation: P wave, Q dip, R spike, S dip, T wave
    const getEcgPoint = (phase) => {
      const p = phase % 1; // 0 to 1
      if (p < 0.15) {
        // Flat baseline
        return midY;
      } else if (p < 0.25) {
        // P-Wave (atrial depolarization)
        return midY - 6 * Math.sin(((p - 0.15) / 0.10) * Math.PI);
      } else if (p < 0.32) {
        // PR segment
        return midY;
      } else if (p < 0.35) {
        // Q dip
        return midY + 5;
      } else if (p < 0.40) {
        // R-Spike (ventricular depolarization)
        return midY - 26;
      } else if (p < 0.44) {
        // S dip
        return midY + 10;
      } else if (p < 0.54) {
        // ST Segment (elevated if cardiac / STEMI)
        const stElev = twin?.ecg?.isAbnormal ? -5 : 0;
        return midY + stElev;
      } else if (p < 0.70) {
        // T-Wave (ventricular repolarization)
        return midY - 10 * Math.sin(((p - 0.54) / 0.16) * Math.PI);
      }
      return midY;
    };

    let beatProgress = 0;
    let lastBeatCount = -1;
    let beepTimer = null;
    const bpmSpeed = (heartRate / 60) * 0.015;

    const renderEcg = () => {
      ecgAnimRef.current = requestAnimationFrame(renderEcg);

      // Erase ahead of scan line
      ctx.fillStyle = 'rgba(3, 7, 18, 0.25)';
      ctx.fillRect(x, 0, 18, heightCanvas);

      // Calculate next Y
      beatProgress += bpmSpeed;
      const y = getEcgPoint(beatProgress);

      // Synchronized Medical Beep Detection at R-Wave Peak (~0.39 phase)
      const currentBeatCount = Math.floor(beatProgress - 0.38);
      if (currentBeatCount > lastBeatCount) {
        lastBeatCount = currentBeatCount;

        // 1. Play synthesized hospital monitor beep
        playMedicalHeartBeep({
          heartRate,
          spo2,
          isMuted: isMutedRef.current,
          volume: 0.15
        });

        // 2. Trigger visual flash on graph & header
        setIsBeeping(true);
        if (beepTimer) clearTimeout(beepTimer);
        beepTimer = setTimeout(() => setIsBeeping(false), 130);

        // 3. Highlight R-wave peak pulse point on canvas
        ctx.fillStyle = twin?.ecg?.isAbnormal ? '#fbbf24' : '#34d399';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.strokeStyle = twin?.ecg?.isAbnormal ? '#f59e0b' : '#10b981';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = twin?.ecg?.isAbnormal ? '#fbbf24' : '#34d399';
      ctx.shadowBlur = 8;
      ctx.moveTo(x, y);

      x += 2.2;
      if (x >= width) {
        x = 0;
        drawGrid();
      }

      const nextY = getEcgPoint(beatProgress + bpmSpeed);
      ctx.lineTo(x, nextY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    renderEcg();

    return () => {
      if (ecgAnimRef.current) cancelAnimationFrame(ecgAnimRef.current);
      if (beepTimer) clearTimeout(beepTimer);
    };
  }, [heartRate, spo2, twin?.ecg?.isAbnormal]);

  const handleResetCamera = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(0, 0.8, 5.0);
  };

  const handleSelectOrgan = (organ) => {
    setSelectedOrgan(organ);
    if (onSelectRegion) onSelectRegion(organ);

    if (cameraRef.current) {
      setIsAutoRotating(false);
      if (organ === 'brain') {
        cameraRef.current.position.set(0, 2.05, 1.8);
      } else if (organ === 'heart') {
        cameraRef.current.position.set(-0.12, 1.48, 1.6);
      } else if (organ === 'lungs') {
        cameraRef.current.position.set(0, 1.40, 2.0);
      } else {
        cameraRef.current.position.set(0, 0.8, 5.0);
      }
    }
  };

  const handleFocusZone = (zone) => {
    if (zone === 'head') {
      handleSelectOrgan('brain');
    } else if (zone === 'chest') {
      handleSelectOrgan('heart');
    } else if (zone === 'legs') {
      handleSelectOrgan('full');
      if (cameraRef.current) {
        cameraRef.current.position.set(0, -0.6, 2.5);
      }
    } else {
      handleSelectOrgan('full');
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[3000] w-screen h-screen bg-[#020a14] flex flex-col overflow-hidden p-2 sm:p-4 shadow-2xl animate-in fade-in duration-200"
          : "relative rounded-3xl overflow-hidden border-2 border-cyan-500/40 bg-[#061527] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)]"
      }
    >
      {/* Top 3D Scanner Telemetry Overlay Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>3D DIGITAL TWIN • {isFullscreen ? 'FULL SCREEN VIEW' : 'REAL-TIME TELEMETRY'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-300 flex-wrap">
            <span>Patient: <strong className="text-white">{twin?.name}</strong> ({twin?.age}y / {twin?.gender})</span>
            <span>•</span>
            <span className="text-red-400 font-bold">{twin?.bloodGroup}</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{twin?.currentEmergency || 'Emergency'}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{twin?.treatments?.length || 0} Transport Rx</span>
            <span>•</span>
            <span className="text-purple-400 font-bold">{twin?.medicinesAdministered?.length || 0} Meds</span>
          </div>
        </div>

        {/* View Mode & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Organ Selector Navigation Pills */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleSelectOrgan('full')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedOrgan === 'full'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Full Body Patient Telemetry View"
            >
              <User className="w-3.5 h-3.5 text-cyan-300" />
              <span>Full Body</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectOrgan('heart')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedOrgan === 'heart'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="3D Heart & Cardiac Telemetry View"
            >
              <Heart className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>❤️ Heart ({heartRate} BPM)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectOrgan('lungs')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedOrgan === 'lungs'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="3D Lungs & Respiratory Telemetry View"
            >
              <Wind className="w-3.5 h-3.5 text-cyan-300" />
              <span>🫁 Lungs ({respiratoryRate} bpm)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectOrgan('brain')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedOrgan === 'brain'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="3D Brain & Neurological GCS View"
            >
              <Brain className="w-3.5 h-3.5 text-amber-300" />
              <span>🧠 Brain (GCS {twin?.vitals?.gcsScore || 13})</span>
            </button>
          </div>

          {/* 3D Mode Toggle */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('3d_model')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === '3d_model'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>3D Render</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('interactive_webgl')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'interactive_webgl'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3 text-cyan-300" />
              <span>360° Mesh</span>
            </button>
          </div>

          {viewMode === 'interactive_webgl' && (
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsAutoRotating(prev => !prev)}
                className={`p-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  isAutoRotating ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title={isAutoRotating ? 'Pause 360° rotation' : 'Start 360° rotation'}
              >
                {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleResetCamera}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Reset Camera View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isFullscreen
                ? 'bg-rose-950/90 hover:bg-rose-900 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/50'
                : 'bg-slate-900/90 hover:bg-cyan-950/90 border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white'
            }`}
            title={isFullscreen ? "Exit Full Screen (ESC)" : "Expand 3D Digital Twin to Full Screen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Full Screen</span>
              </>
            )}
          </button>

          {/* Dedicated Close Button when Full Screen */}
          {isFullscreen && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1 rounded-xl bg-slate-900 hover:bg-rose-900/70 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Close Full Screen (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3D HOLOGRAPHIC MEDICAL CHAMBER (High-Visibility Illuminated Environment - NEVER BLACK) */}
      <div
        className="w-full relative overflow-hidden flex items-center justify-center border-t border-cyan-500/20"
        style={{
          height: isFullscreen ? 'calc(100vh - 125px)' : (height || '520px'),
          minHeight: isFullscreen ? '500px' : '440px',
          flex: isFullscreen ? '1 1 0%' : 'none'
        }}
      >
        {/* A. High-Tech Cyan/Sky Illuminated Chamber Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#0d3d6b_0%,#092644_45%,#041426_85%,#020a14_100%)] pointer-events-none">
          {/* Top Medical Scanner Spotlight Cone */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-3/4 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.35)_0%,rgba(6,182,212,0.15)_45%,transparent_75%)]" />

          {/* Perspective Cyber Floor Grid */}
          <div
            className="absolute bottom-0 left-0 right-0 h-44 opacity-40"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(6, 182, 212, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.4) 1px, transparent 1px)`,
              backgroundSize: '40px 30px',
              transform: 'perspective(320px) rotateX(60deg)',
              transformOrigin: 'bottom center'
            }}
          />

          {/* Holographic Glowing Base Pedestal with Cyber Rings */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-16 rounded-[100%] border-2 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.9),inset_0_0_30px_rgba(6,182,212,0.7)] bg-cyan-950/40 flex items-center justify-center">
            <div className="w-56 sm:w-72 h-10 rounded-[100%] border border-cyan-300/70 animate-chamber-rings" />
            <div className="absolute w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_15px_#38bdf8] animate-ping" />
          </div>
        </div>

        {/* B. LAYER 1: PHOTOREALISTIC 3D HOLOGRAPHIC PATIENT & MULTI-ORGAN RENDER VIEW */}
        <div
          className={`absolute inset-0 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
            viewMode === '3d_model' ? 'opacity-100 z-10 scale-100' : 'opacity-0 pointer-events-none z-0 scale-95'
          }`}
        >
          {/* Always-visible SVG Holographic Wireframe Fallback */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
            <svg viewBox="0 0 200 300" className="w-48 h-72 text-cyan-400 stroke-current fill-none stroke-[1.5]">
              <circle cx="100" cy="40" r="22" className="stroke-cyan-300" />
              <line x1="100" y1="62" x2="100" y2="150" />
              <line x1="100" y1="80" x2="60" y2="130" />
              <line x1="100" y1="80" x2="140" y2="130" />
              <line x1="100" y1="150" x2="70" y2="250" />
              <line x1="100" y1="150" x2="130" y2="250" />
              <circle cx="95" cy="95" r="10" className="stroke-red-400 fill-red-500/20 animate-pulse" />
            </svg>
          </div>

          {/* Interactive Clickable 3D Organ & Body Image */}
          <div
            onClick={handleToggleFullscreen}
            className={`relative group cursor-pointer flex items-center justify-center transition-transform duration-300 ${
              isFullscreen ? 'max-h-[80vh] max-w-[85vw]' : 'max-w-full max-h-full hover:scale-[1.02]'
            }`}
            title={isFullscreen ? "Click 3D image to exit full screen (or press ESC)" : "Click 3D image to view Full Screen"}
          >
            {/* Dynamic 3D Organ & Body Image with Active Pulsing Keyframes */}
            <img
              key={selectedOrgan}
              src={
                selectedOrgan === 'heart'
                  ? organHeartImg
                  : selectedOrgan === 'lungs'
                  ? organLungsImg
                  : selectedOrgan === 'brain'
                  ? organBrainImg
                  : patient3dModelImg
              }
              alt={
                selectedOrgan === 'heart'
                  ? '3D Anatomical Heart with Live Heart Rate Telemetry'
                  : selectedOrgan === 'lungs'
                  ? '3D Anatomical Lungs with Respiratory Telemetry'
                  : selectedOrgan === 'brain'
                  ? '3D Anatomical Brain with Neurological Telemetry'
                  : '3D Holographic Patient Model with Live Vitals'
              }
              className={`object-contain select-none pointer-events-auto transition-all duration-500 ${
                isFullscreen ? 'max-h-[78vh] max-w-[85vw]' : 'max-w-full max-h-full'
              } ${
                selectedOrgan === 'heart'
                  ? 'animate-cardiac-beat'
                  : selectedOrgan === 'lungs'
                  ? 'animate-pulmonary-breathe'
                  : selectedOrgan === 'brain'
                  ? 'animate-neural-synapse'
                  : 'filter drop-shadow-[0_0_60px_rgba(6,182,212,0.8)]'
              }`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                if (selectedOrgan === 'heart') e.currentTarget.src = '/organ_3d_heart.jpg';
                else if (selectedOrgan === 'lungs') e.currentTarget.src = '/organ_3d_lungs.jpg';
                else if (selectedOrgan === 'brain') e.currentTarget.src = '/organ_3d_brain.jpg';
                else e.currentTarget.src = '/patient_3d_bright.jpg';
              }}
            />

            {/* Click to expand/minimize badge affordance */}
            <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-cyan-400/80 text-cyan-300 text-xs font-mono font-bold shadow-xl flex items-center gap-1.5 transition-all duration-200 pointer-events-none ${
              isFullscreen ? 'opacity-0 group-hover:opacity-100' : 'opacity-85 group-hover:opacity-100 group-hover:scale-105'
            }`}>
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Click image to exit full screen (ESC)</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>🔍 Click 3D Image for Full Screen</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* C. LAYER 2: 360° WEBGL INTERACTIVE CANVAS (Kept active in DOM with non-zero bounds, transparent clearColor) */}
        <div
          ref={containerRef}
          className={`absolute inset-0 cursor-grab active:cursor-grabbing transition-all duration-300 ${
            viewMode === 'interactive_webgl' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 pointer-events-none z-0'
          }`}
        />

        {/* D. FLOATING HUD OVERLAYS (Visible across both 3D Render & 360° Mesh modes) */}
        
        {/* Left Side: Consciousness & Mobility Badges */}
        <div className="absolute left-3 sm:left-5 top-16 z-20 space-y-2 pointer-events-none">
          <div className={`p-2.5 rounded-2xl backdrop-blur-md border text-xs shadow-xl space-y-1 ${
            isUnconscious
              ? 'bg-red-950/85 border-red-500/80 text-red-200'
              : (consciousnessStatus === 'Alert' ? 'bg-slate-900/90 border-emerald-500/70 text-emerald-200' : 'bg-slate-900/90 border-amber-500/70 text-amber-200')
          }`}>
            <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5" />
              <span>Consciousness Level</span>
            </div>
            <div className="text-sm font-black flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isUnconscious ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span>{consciousnessStatus}</span>
            </div>
            <div className="text-[10px] font-mono opacity-90">
              GCS Score: <strong>{twin?.vitals?.gcsScore || 12}/15</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl backdrop-blur-md border border-slate-700 bg-slate-900/90 text-xs shadow-xl space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobility Status</div>
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <span>⚠️</span>
              <span>{twin?.abilityToWalk || 'Non-ambulatory'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Dynamic Active Organ Focus Telemetry Badge */}
        <div className="absolute right-3 sm:right-5 top-16 z-20 space-y-2 pointer-events-none text-right">
          {selectedOrgan === 'heart' ? (
            <div className="bg-red-950/90 backdrop-blur-md border-2 border-red-500/80 rounded-2xl p-3 shadow-2xl animate-cardiac-beat">
              <span className="text-[10px] uppercase font-black text-red-300 tracking-wider flex items-center justify-end gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                <span>CARDIAC FREQUENCY</span>
              </span>
              <div className="text-3xl font-black font-mono text-white mt-0.5">
                {heartRate} <span className="text-xs text-red-400 font-bold">BPM</span>
              </div>
              <div className="text-[10px] font-mono text-amber-300 mt-1 max-w-[190px] leading-tight">
                {twin?.ecg?.rhythm || 'Sinus Rhythm (Active Lead II)'}
              </div>
              <div className="text-[10px] font-mono text-slate-300 mt-1">
                Cardiac Output: <strong className="text-white">4.8 L/min</strong>
              </div>
            </div>
          ) : selectedOrgan === 'lungs' ? (
            <div className="bg-cyan-950/90 backdrop-blur-md border-2 border-cyan-500/80 rounded-2xl p-3 shadow-2xl animate-pulmonary-breathe">
              <span className="text-[10px] uppercase font-black text-cyan-300 tracking-wider flex items-center justify-end gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>PULMONARY VENTILATION</span>
              </span>
              <div className="text-3xl font-black font-mono text-cyan-300 mt-0.5">
                {respiratoryRate} <span className="text-xs text-slate-300 font-bold">Br/min</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-1">
                SpO₂ Saturation: <strong>{spo2}%</strong> (O₂)
              </div>
              <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                Tidal Volume: <strong className="text-white">480 mL</strong>
              </div>
            </div>
          ) : selectedOrgan === 'brain' ? (
            <div className="bg-amber-950/90 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl p-3 shadow-2xl animate-neural-synapse">
              <span className="text-[10px] uppercase font-black text-amber-300 tracking-wider flex items-center justify-end gap-1.5">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                <span>CEREBRAL CRANIAL</span>
              </span>
              <div className="text-2xl font-black font-mono text-amber-300 mt-0.5">
                {consciousnessStatus}
              </div>
              <div className="text-[10px] font-mono text-slate-200 mt-1">
                Glasgow Coma Scale: <strong className="text-amber-400 text-xs">{twin?.vitals?.gcsScore || 13}/15</strong>
              </div>
              <div className="text-[10px] font-mono text-emerald-300 mt-0.5">
                Pupils: <strong>Reactive (PERRL)</strong>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/60 rounded-2xl p-3 shadow-2xl space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-red-400 flex items-center justify-end gap-1">
                <Heart className="w-3 h-3 text-red-400 animate-pulse" /> Heart Rate: <strong className="text-white font-mono text-sm ml-1">{heartRate} BPM</strong>
              </div>
              <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center justify-end gap-1">
                <Wind className="w-3 h-3 text-cyan-400" /> SpO₂: <strong className="text-white font-mono text-sm ml-1">{spo2}%</strong>
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-300 flex items-center justify-end gap-1">
                BP: <strong className="text-white font-mono text-sm ml-1">{bp}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Organ Selector Strip (Clickable shortcuts inside viewport) */}
        <div className="absolute bottom-2 left-3 right-3 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleSelectOrgan('brain')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              selectedOrgan === 'brain' ? 'bg-amber-950 text-amber-300 ring-1 ring-amber-500 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3 h-3 text-amber-400" />
            <span className="font-mono text-[11px]">Brain (GCS {twin?.vitals?.gcsScore || 13})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectOrgan('heart')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              selectedOrgan === 'heart' ? 'bg-red-950 text-red-300 ring-1 ring-red-500 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Heart className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="font-mono text-[11px]">Heart ({heartRate} BPM)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectOrgan('lungs')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              selectedOrgan === 'lungs' ? 'bg-cyan-950 text-cyan-300 ring-1 ring-cyan-500 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Wind className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-[11px]">Lungs ({respiratoryRate} bpm)</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-slate-400 font-mono text-[11px]">
            <span>BP: <strong className="text-white">{bp}</strong></span>
            <span>•</span>
            <span>Temp: <strong className="text-amber-300">{twin?.vitals?.temperature || 36.8}°C</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Live ECG Continuous Waveform Banner with Audio-Visual Beep */}
      <div className="relative z-20 border-t border-slate-800/80 bg-slate-950 px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>LEAD II TELEMETRY</span>
          </div>

          {/* Synchronous Visual Beep Flashing Badge */}
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black flex items-center gap-1 transition-all ${
            isBeeping
              ? 'bg-emerald-400 text-slate-950 scale-105 shadow-[0_0_15px_#10b981]'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
          }`}>
            <Heart className={`w-3 h-3 ${isBeeping ? 'fill-slate-950 text-slate-950 scale-125' : 'text-emerald-400'}`} />
            <span>{isBeeping ? 'BEEP!' : 'PULSE'}</span>
          </div>

          <div className="text-[11px] text-slate-300 font-mono hidden sm:block">
            {twin?.ecg?.rhythm || 'Continuous 12-Lead Rhythm Active'}
          </div>
        </div>

        {/* Live Canvas Waveform Strip with Audio Wave Bars */}
        <div className="flex-1 max-w-lg h-10 rounded-lg overflow-hidden border border-slate-800 bg-black relative">
          <canvas
            ref={ecgCanvasRef}
            width={500}
            height={40}
            className="w-full h-full block"
          />
          {/* Soundwave equalizer indicator */}
          <div className="absolute right-2 bottom-1 flex items-end gap-0.5 pointer-events-none opacity-80">
            <span className={`w-1 rounded-full transition-all duration-75 ${isBeeping ? 'h-3 bg-emerald-400' : 'h-1 bg-emerald-950'}`}></span>
            <span className={`w-1 rounded-full transition-all duration-75 ${isBeeping ? 'h-5 bg-emerald-300' : 'h-1.5 bg-emerald-900'}`}></span>
            <span className={`w-1 rounded-full transition-all duration-75 ${isBeeping ? 'h-2.5 bg-emerald-400' : 'h-1 bg-emerald-950'}`}></span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0">
          {/* Audio Beep Sound Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={() => {
              resumeAudioContext();
              setIsAudioMuted(prev => !prev);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              !isAudioMuted
                ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
            title={isAudioMuted ? "Click to enable heart rate monitor audio beep" : "Click to mute heart rate beep sound"}
          >
            {!isAudioMuted ? (
              <>
                <Volume2 className="w-3 h-3 text-white animate-pulse" />
                <span>🔊 Beep ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-slate-500" />
                <span>🔇 Muted</span>
              </>
            )}
          </button>

          <span>RR: <strong className="text-cyan-300">{respiratoryRate} bpm</strong></span>
          <span>Temp: <strong className="text-amber-300">{twin?.vitals?.temperature || 36.8}°C</strong></span>
        </div>
      </div>
    </div>
  );
};
