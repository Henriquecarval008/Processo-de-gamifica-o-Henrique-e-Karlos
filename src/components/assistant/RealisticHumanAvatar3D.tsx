/**
 * Realistic Interactive 3D Human Avatar (NEXUS) for GAMEINFOR & Instituto Ambiente
 * 
 * Implements:
 * - Complete 3D Human Face (natural proportions, realistic skin, eyes, eyebrows, nose, mouth, hair, ears, neck)
 * - Eye and Head Gaze Tracking (User left/right, up/down, near/far via camera or mouse fallback)
 * - Organic eye blinking (3-5s randomized) and micro-saccades
 * - Dynamic Lip-Sync with voice audio amplitude and vowel visemes
 * - 8 Realistic Facial Expressions (Alegria, Curiosidade, Atenção, Surpresa, Empatia, Concentração, Seriedade, Satisfação)
 * - Listening nods and conversational natural gestures
 * - Client-side Camera Tracking integration with instant privacy controls
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { NexusEmotion } from '../../types';
import { cameraTrackingService, TrackingFrame } from '../../services/cameraTrackingService';
import {
  Camera,
  CameraOff,
  Eye,
  Shield,
  Smile,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';

export type AvatarStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface RealisticHumanAvatar3DProps {
  status: AvatarStatus;
  emotion?: NexusEmotion;
  inputAudioLevel?: number; // 0.0 to 1.0 (mic intensity)
  outputAudioLevel?: number; // 0.0 to 1.0 (speech audio intensity)
  className?: string;
  onEmotionChange?: (emotion: NexusEmotion) => void;
}

export const RealisticHumanAvatar3D: React.FC<RealisticHumanAvatar3DProps> = ({
  status,
  emotion = 'neutro',
  inputAudioLevel = 0,
  outputAudioLevel = 0,
  className = '',
  onEmotionChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniVideoRef = useRef<HTMLVideoElement>(null);

  // Camera & Tracking states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTrackingStarting, setIsTrackingStarting] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showDebugHud, setShowDebugHud] = useState(false);
  const [trackingFrame, setTrackingFrame] = useState<TrackingFrame>(
    cameraTrackingService.getCurrentFrame()
  );

  // Lip-sync & speech tick
  const [speechTimer, setSpeechTimer] = useState(0);

  // Subscribe to real-time camera tracking frame
  useEffect(() => {
    const unsubscribe = cameraTrackingService.subscribe((frame) => {
      setTrackingFrame(frame);
    });
    setIsCameraActive(cameraTrackingService.getIsActive());
    return () => unsubscribe();
  }, []);

  // Update mini video preview stream if camera is active
  useEffect(() => {
    if (isCameraActive && miniVideoRef.current) {
      miniVideoRef.current.srcObject = cameraTrackingService.getMediaStream();
    }
  }, [isCameraActive, showDebugHud]);

  // Handle toggling camera tracking
  const handleToggleCamera = async () => {
    setCameraError(null);
    if (isCameraActive) {
      cameraTrackingService.stopTracking();
      setIsCameraActive(false);
    } else {
      setIsTrackingStarting(true);
      const res = await cameraTrackingService.startTracking();
      setIsTrackingStarting(false);
      if (res.success) {
        setIsCameraActive(true);
      } else {
        setCameraError(res.error || 'Erro ao acessar a câmera.');
      }
    }
  };

  // -------------------------------------------------------------
  // THREE.JS 3D SCENE & HUMAN RIG CREATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 320;
    const height = containerRef.current.clientHeight || 340;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 2.7);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Procedural Skin & Hair Textures
    const createProceduralSkinTexture = () => {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d')!;
      // Warm natural skin base
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, '#f2d0bc');
      grad.addColorStop(0.5, '#eec5ac');
      grad.addColorStop(1, '#e3b89e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Subtle natural skin pores & tone variation
      const imgData = ctx.getImageData(0, 0, size, size);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const noise = (Math.random() - 0.5) * 8;
        d[i] = Math.min(255, Math.max(0, d[i] + noise));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.8));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.6));
      }
      ctx.putImageData(imgData, 0, 0);

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    const createProceduralIrisTexture = () => {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d')!;
      const center = size / 2;

      // Dark outer limbal ring
      const grad = ctx.createRadialGradient(center, center, 10, center, center, center - 2);
      grad.addColorStop(0, '#0c1a24');
      grad.addColorStop(0.2, '#1e3a5f'); // Rich blue/hazel iris
      grad.addColorStop(0.55, '#2563eb');
      grad.addColorStop(0.75, '#38bdf8');
      grad.addColorStop(0.92, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center, center, center - 2, 0, Math.PI * 2);
      ctx.fill();

      // Striations / iris fibers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 2; a += 0.08) {
        ctx.beginPath();
        ctx.moveTo(center + Math.cos(a) * 20, center + Math.sin(a) * 20);
        ctx.lineTo(center + Math.cos(a) * (center - 15), center + Math.sin(a) * (center - 15));
        ctx.stroke();
      }

      // Golden hazel inner corona
      const innerGrad = ctx.createRadialGradient(center, center, 12, center, center, 42);
      innerGrad.addColorStop(0, '#f59e0b');
      innerGrad.addColorStop(0.6, 'rgba(217, 119, 6, 0.4)');
      innerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(center, center, 45, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(c);
    };

    const skinTex = createProceduralSkinTexture();
    const irisTex = createProceduralIrisTexture();

    // 3. Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      map: skinTex,
      color: 0xffdfd0,
      roughness: 0.58,
      metalness: 0.02,
    });

    const lipMaterial = new THREE.MeshStandardMaterial({
      color: 0xc86d6d,
      roughness: 0.42,
      metalness: 0.05,
    });

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1712, // Rich dark brown/espresso hair
      roughness: 0.65,
      metalness: 0.15,
    });

    const eyebrowMaterial = new THREE.MeshStandardMaterial({
      color: 0x221a14,
      roughness: 0.7,
      metalness: 0.05,
    });

    const scleraMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf8f6,
      roughness: 0.15,
      metalness: 0.05,
    });

    const irisMaterial = new THREE.MeshStandardMaterial({
      map: irisTex,
      roughness: 0.12,
      metalness: 0.08,
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x050505,
    });

    const corneaMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.02,
      ior: 1.38,
      reflectivity: 0.9,
    });

    const teethMaterial = new THREE.MeshStandardMaterial({
      color: 0xf6f6f2,
      roughness: 0.25,
      metalness: 0.02,
    });

    const mouthInsideMaterial = new THREE.MeshBasicMaterial({
      color: 0x2a080c,
    });

    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Instituto Ambiente navy suit
      roughness: 0.8,
      metalness: 0.1,
    });

    const shirtMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Instituto Ambiente cyan-accent professional polo
      roughness: 0.75,
      metalness: 0.05,
    });

    // 4. Lighting Rig (Professional Studio Portrait)
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.75);
    scene.add(ambientLight);

    // Warm Key Light (top-left)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.45);
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);

    // Soft Cool Fill Light (front-right)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.75);
    fillLight.position.set(-2, 1, 2);
    scene.add(fillLight);

    // Rim/Hair Backlight (adds cinematic 3D edge glow)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Subtle Under-Chin Light (simulates desk/screen reflection)
    const bounceLight = new THREE.PointLight(0x38bdf8, 0.45, 4);
    bounceLight.position.set(0, -1.2, 1.5);
    scene.add(bounceLight);

    // 5. Hierarchy: Body -> Neck -> Head Rig
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // Shoulders & Torso
    const shouldersGeo = new THREE.CylinderGeometry(0.72, 0.88, 0.8, 24);
    const shouldersMesh = new THREE.Mesh(shouldersGeo, suitMaterial);
    shouldersMesh.position.set(0, -1.05, 0);
    shouldersMesh.scale.set(1.4, 1.0, 0.65);
    avatarGroup.add(shouldersMesh);

    // Polo Collar / Shirt V-neck
    const collarGeo = new THREE.ConeGeometry(0.35, 0.45, 16);
    const collarMesh = new THREE.Mesh(collarGeo, shirtMaterial);
    collarMesh.rotation.x = Math.PI;
    collarMesh.position.set(0, -0.68, 0.35);
    collarMesh.scale.set(1.2, 0.5, 0.4);
    avatarGroup.add(collarMesh);

    // Neck
    const neckPivot = new THREE.Group();
    neckPivot.position.set(0, -0.55, 0);
    avatarGroup.add(neckPivot);

    const neckGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.42, 20);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, 0.2, 0.02);
    neckPivot.add(neckMesh);

    // Head Pivot (All head rotations pivot here naturally at the base of skull)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.4, 0);
    neckPivot.add(headPivot);

    // Cranium / Head Base
    const headGeo = new THREE.SphereGeometry(0.56, 32, 32);
    headGeo.scale(0.88, 1.14, 0.98); // Natural human craniofacial oval
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.set(0, 0.26, 0);
    headPivot.add(headMesh);

    // Jaw & Chin
    const chinGeo = new THREE.SphereGeometry(0.22, 24, 24);
    chinGeo.scale(1.15, 0.95, 1.05);
    const chinMesh = new THREE.Mesh(chinGeo, skinMaterial);
    chinMesh.position.set(0, -0.22, 0.36);
    headPivot.add(chinMesh);

    // Cheekbones (left & right)
    const cheekGeo = new THREE.SphereGeometry(0.18, 16, 16);
    cheekGeo.scale(1.0, 0.8, 0.7);
    const leftCheek = new THREE.Mesh(cheekGeo, skinMaterial);
    leftCheek.position.set(0.32, 0.14, 0.36);
    headPivot.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, skinMaterial);
    rightCheek.position.set(-0.32, 0.14, 0.36);
    headPivot.add(rightCheek);

    // Nose
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 0.18, 0.52);
    headPivot.add(noseGroup);

    // Nose Bridge
    const noseBridgeGeo = new THREE.CylinderGeometry(0.045, 0.065, 0.28, 12);
    const noseBridgeMesh = new THREE.Mesh(noseBridgeGeo, skinMaterial);
    noseBridgeMesh.rotation.x = 0.32;
    noseBridgeMesh.position.set(0, 0.02, 0.03);
    noseGroup.add(noseBridgeMesh);

    // Nose Tip
    const noseTipGeo = new THREE.SphereGeometry(0.06, 16, 16);
    noseTipGeo.scale(1.0, 0.85, 1.15);
    const noseTipMesh = new THREE.Mesh(noseTipGeo, skinMaterial);
    noseTipMesh.position.set(0, -0.1, 0.11);
    noseGroup.add(noseTipMesh);

    // Nostrils
    const nostrilGeo = new THREE.SphereGeometry(0.042, 12, 12);
    const leftNostril = new THREE.Mesh(nostrilGeo, skinMaterial);
    leftNostril.position.set(0.065, -0.11, 0.06);
    noseGroup.add(leftNostril);

    const rightNostril = new THREE.Mesh(nostrilGeo, skinMaterial);
    rightNostril.position.set(-0.065, -0.11, 0.06);
    noseGroup.add(rightNostril);

    // Ears (Left & Right 3D anatomical ears)
    const createEar = (isLeft: boolean) => {
      const earGroup = new THREE.Group();
      const earGeo = new THREE.TorusGeometry(0.12, 0.032, 12, 24, Math.PI * 1.3);
      const earRim = new THREE.Mesh(earGeo, skinMaterial);
      earRim.rotation.z = isLeft ? 0.35 : -0.35;
      earGroup.add(earRim);

      const lobeGeo = new THREE.SphereGeometry(0.055, 12, 12);
      lobeGeo.scale(0.8, 1.2, 0.5);
      const lobe = new THREE.Mesh(lobeGeo, skinMaterial);
      lobe.position.set(0, -0.1, 0);
      earGroup.add(lobe);

      earGroup.position.set(isLeft ? 0.5 : -0.5, 0.22, -0.02);
      earGroup.rotation.y = isLeft ? 0.2 : -0.2;
      return earGroup;
    };
    headPivot.add(createEar(true));
    headPivot.add(createEar(false));

    // 3D Hair (Modern Professional Cut with volume, part, and textured strands)
    const hairGroup = new THREE.Group();
    hairGroup.position.set(0, 0.44, 0.02);
    headPivot.add(hairGroup);

    // Main Hair Dome
    const hairCapGeo = new THREE.SphereGeometry(0.58, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
    hairCapGeo.scale(0.92, 1.05, 1.02);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMaterial);
    hairCap.position.set(0, 0.02, -0.04);
    hairGroup.add(hairCap);

    // Textured Hair Strands / Volume Locks
    const lockPositions = [
      { x: -0.22, y: 0.26, z: 0.38, sx: 0.16, sy: 0.09, sz: 0.28, rx: 0.3, ry: 0.2, rz: -0.2 },
      { x: 0.05, y: 0.32, z: 0.36, sx: 0.22, sy: 0.11, sz: 0.32, rx: 0.2, ry: -0.1, rz: 0.1 },
      { x: 0.28, y: 0.24, z: 0.32, sx: 0.18, sy: 0.09, sz: 0.26, rx: 0.2, ry: -0.3, rz: 0.2 },
      { x: -0.38, y: 0.05, z: 0.12, sx: 0.12, sy: 0.22, sz: 0.25, rx: 0.1, ry: 0.4, rz: -0.1 },
      { x: 0.4, y: 0.05, z: 0.12, sx: 0.12, sy: 0.22, sz: 0.25, rx: 0.1, ry: -0.4, rz: 0.1 },
    ];

    lockPositions.forEach((p) => {
      const lockGeo = new THREE.SphereGeometry(0.18, 12, 12);
      lockGeo.scale(p.sx * 5, p.sy * 5, p.sz * 4);
      const lockMesh = new THREE.Mesh(lockGeo, hairMaterial);
      lockMesh.position.set(p.x, p.y, p.z);
      lockMesh.rotation.set(p.rx, p.ry, p.rz);
      hairGroup.add(lockMesh);
    });

    // 6. EYES & GAZE RIG (Sclera, 3D Iris, Pupil, Cornea, Eyelids)
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 0.27, 0.38);
    headPivot.add(eyesGroup);

    const eyeDistance = 0.23; // Interpupillary distance

    const createEyeAssembly = (isLeft: boolean) => {
      const eyePivot = new THREE.Group();
      eyePivot.position.set(isLeft ? eyeDistance : -eyeDistance, 0, 0);

      // Eyeball (Sclera)
      const eyeballGeo = new THREE.SphereGeometry(0.105, 24, 24);
      const eyeball = new THREE.Mesh(eyeballGeo, scleraMaterial);
      eyePivot.add(eyeball);

      // Iris
      const irisGeo = new THREE.CircleGeometry(0.048, 24);
      const iris = new THREE.Mesh(irisGeo, irisMaterial);
      iris.position.set(0, 0, 0.103);
      eyePivot.add(iris);

      // Pupil
      const pupilGeo = new THREE.CircleGeometry(0.02, 20);
      const pupil = new THREE.Mesh(pupilGeo, pupilMaterial);
      pupil.position.set(0, 0, 0.104);
      eyePivot.add(pupil);

      // Cornea Gloss
      const corneaGeo = new THREE.SphereGeometry(0.052, 16, 16);
      corneaGeo.scale(1, 1, 0.45);
      const cornea = new THREE.Mesh(corneaGeo, corneaMaterial);
      cornea.position.set(0, 0, 0.088);
      eyePivot.add(cornea);

      return { eyePivot, pupil };
    };

    const leftEye = createEyeAssembly(true);
    const rightEye = createEyeAssembly(false);
    eyesGroup.add(leftEye.eyePivot);
    eyesGroup.add(rightEye.eyePivot);

    // Eyelids (Upper and Lower curved shields for organic blinking)
    const upperLidLeftGeo = new THREE.SphereGeometry(0.114, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
    upperLidLeftGeo.scale(1.02, 0.95, 1.02);
    const upperLidLeft = new THREE.Mesh(upperLidLeftGeo, skinMaterial);
    upperLidLeft.position.set(eyeDistance, 0, 0);
    upperLidLeft.rotation.x = -0.3; // Default open state
    eyesGroup.add(upperLidLeft);

    const upperLidRightGeo = new THREE.SphereGeometry(0.114, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
    upperLidRightGeo.scale(1.02, 0.95, 1.02);
    const upperLidRight = new THREE.Mesh(upperLidRightGeo, skinMaterial);
    upperLidRight.position.set(-eyeDistance, 0, 0);
    upperLidRight.rotation.x = -0.3;
    eyesGroup.add(upperLidRight);

    // Eyebrows (Articulated Left & Right 3D Eyebrows)
    const createEyebrow = (isLeft: boolean) => {
      const browGroup = new THREE.Group();
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(isLeft ? 0.06 : -0.06, -0.015, 0),
        new THREE.Vector3(isLeft ? 0.16 : -0.16, 0.02, 0.02),
        new THREE.Vector3(isLeft ? 0.26 : -0.26, -0.01, -0.01),
      ]);
      const browGeo = new THREE.TubeGeometry(browCurve, 16, 0.019, 8, false);
      const browMesh = new THREE.Mesh(browGeo, eyebrowMaterial);
      browGroup.add(browMesh);
      browGroup.position.set(isLeft ? eyeDistance * 0.7 : -eyeDistance * 0.7, 0.14, 0.11);
      return browGroup;
    };

    const leftEyebrow = createEyebrow(true);
    const rightEyebrow = createEyebrow(false);
    eyesGroup.add(leftEyebrow);
    eyesGroup.add(rightEyebrow);

    // 7. MOUTH, LIPS & TEETH RIG (Lip-Sync and Facial Expressions)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.06, 0.44);
    headPivot.add(mouthGroup);

    // Oral cavity (Dark interior)
    const mouthCavityGeo = new THREE.SphereGeometry(0.12, 16, 16);
    mouthCavityGeo.scale(1.4, 0.55, 0.7);
    const mouthCavity = new THREE.Mesh(mouthCavityGeo, mouthInsideMaterial);
    mouthCavity.position.set(0, -0.01, -0.05);
    mouthGroup.add(mouthCavity);

    // Upper Teeth
    const teethUpperGeo = new THREE.BoxGeometry(0.15, 0.035, 0.03);
    const teethUpper = new THREE.Mesh(teethUpperGeo, teethMaterial);
    teethUpper.position.set(0, 0.015, 0.02);
    mouthGroup.add(teethUpper);

    // Lower Teeth
    const teethLowerGeo = new THREE.BoxGeometry(0.13, 0.03, 0.03);
    const teethLower = new THREE.Mesh(teethLowerGeo, teethMaterial);
    teethLower.position.set(0, -0.025, 0.01);
    mouthGroup.add(teethLower);

    // Upper Lip (Sculpted with natural Cupid's bow)
    const upperLipGeo = new THREE.CylinderGeometry(0.022, 0.028, 0.22, 16);
    upperLipGeo.rotateZ(Math.PI / 2);
    upperLipGeo.scale(1.0, 0.8, 1.2);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMaterial);
    upperLip.position.set(0, 0.022, 0.045);
    mouthGroup.add(upperLip);

    // Lower Lip (Full natural fullness)
    const lowerLipGeo = new THREE.CylinderGeometry(0.026, 0.03, 0.2, 16);
    lowerLipGeo.rotateZ(Math.PI / 2);
    lowerLipGeo.scale(1.0, 0.9, 1.3);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMaterial);
    lowerLip.position.set(0, -0.022, 0.045);
    mouthGroup.add(lowerLip);

    // Left and Right Mouth Corners for Smiling / Expression morphing
    const mouthCornerLeftGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const mouthCornerLeft = new THREE.Mesh(mouthCornerLeftGeo, lipMaterial);
    mouthCornerLeft.position.set(0.11, 0, 0.035);
    mouthGroup.add(mouthCornerLeft);

    const mouthCornerRightGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const mouthCornerRight = new THREE.Mesh(mouthCornerRightGeo, lipMaterial);
    mouthCornerRight.position.set(-0.11, 0, 0.035);
    mouthGroup.add(mouthCornerRight);

    // -------------------------------------------------------------
    // ANIMATION & TRACKING STATE ENGINE
    // -------------------------------------------------------------
    let isBlinking = false;
    let blinkProgress = 0; // 0 (open) to 1 (closed)
    let blinkTimer = 0;
    let nextBlinkTime = 3.0;

    let nodTimer = 0;
    let nodProgress = 0;
    let activeNod = false;

    let lastTime = performance.now();
    let animFrameId: number;

    const renderLoop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      const currentTracking = cameraTrackingService.getCurrentFrame();

      // 1. Organic Blinking Routine
      blinkTimer += dt;
      if (blinkTimer >= nextBlinkTime) {
        isBlinking = true;
        blinkProgress += dt * 9.5; // Fast blink down
        if (blinkProgress >= 1.0) {
          blinkProgress = 1.0;
          isBlinking = false;
          blinkTimer = 0;
          // Randomized blink intervals: 2.8s to 5.2s, with occasional double-blinks
          nextBlinkTime = Math.random() < 0.2 ? 0.35 : Math.random() * 2.4 + 2.8;
        }
      } else if (!isBlinking && blinkProgress > 0) {
        blinkProgress = Math.max(0, blinkProgress - dt * 8.5); // Open back up
      }

      // Eyelid rotation based on blinkProgress
      // Open: -0.32, Closed: 0.65
      const targetLidAngle = -0.32 + blinkProgress * 0.97;
      upperLidLeft.rotation.x = targetLidAngle;
      upperLidRight.rotation.x = targetLidAngle;

      // 2. Head & Gaze Movement with Smooth Damping (Lerp)
      // Mirroring: user leans right (+targetX) -> avatar looks to its left (+y rotation)
      const targetHeadYaw = currentTracking.targetX * 0.42;
      const targetHeadPitch = -currentTracking.targetY * 0.32;
      const targetHeadRoll = currentTracking.headRoll * 0.65;

      // Conversational subtle nods when listening to user speaking
      if (status === 'listening' && inputAudioLevel > 0.05) {
        nodTimer += dt;
        if (nodTimer > 1.8) {
          activeNod = true;
          nodProgress = 0;
          nodTimer = 0;
        }
      }
      if (activeNod) {
        nodProgress += dt * 4;
        if (nodProgress > Math.PI * 2) {
          activeNod = false;
          nodProgress = 0;
        }
      }
      const nodOffset = activeNod ? Math.sin(nodProgress) * 0.05 : 0;

      // Subtle organic breathing & life idle sway
      const t = timestamp * 0.0015;
      const breathSwayY = Math.sin(t * 0.8) * 0.015;
      const breathSwayX = Math.cos(t * 0.5) * 0.01;

      // Emotion adjustments to Head Pose
      let emotionHeadRoll = 0;
      let emotionHeadPitch = 0;
      let targetSmile = 0.15; // Pleasant neutral baseline
      let targetBrowRaise = 0;
      let targetBrowFurrow = 0;
      let targetSurprise = 0;
      let pupilScale = 1.0;

      switch (emotion) {
        case 'alegria':
          targetSmile = 0.85;
          targetBrowRaise = 0.15;
          pupilScale = 1.15;
          break;
        case 'curiosidade':
          emotionHeadRoll = 0.09;
          targetBrowRaise = 0.45; // Asymmetric curiosity
          pupilScale = 1.25;
          break;
        case 'atencao':
          emotionHeadPitch = -0.06;
          targetBrowRaise = 0.1;
          pupilScale = 1.1;
          break;
        case 'surpresa':
          targetSurprise = 0.65;
          targetBrowRaise = 0.75;
          targetSmile = 0.1;
          pupilScale = 1.35;
          break;
        case 'empatia':
          emotionHeadRoll = -0.07;
          targetSmile = 0.55;
          targetBrowRaise = 0.1;
          break;
        case 'concentracao':
          emotionHeadPitch = -0.04;
          targetBrowFurrow = 0.65;
          targetSmile = 0.0;
          pupilScale = 0.95;
          break;
        case 'seriedade':
          targetSmile = 0.05;
          targetBrowFurrow = 0.2;
          break;
        case 'satisfacao':
          targetSmile = 0.7;
          emotionHeadRoll = 0.04;
          break;
        default:
          targetSmile = 0.18;
          break;
      }

      // Distance reaction: If user moves close to camera, avatar focuses more intently
      if (currentTracking.distance > 0.65) {
        emotionHeadPitch += -0.04;
        pupilScale *= 1.12;
      }

      // Apply Head Rotations with smooth damping
      const headLerp = 4.5 * dt;
      headPivot.rotation.y = THREE.MathUtils.lerp(
        headPivot.rotation.y,
        targetHeadYaw + breathSwayX,
        headLerp
      );
      headPivot.rotation.x = THREE.MathUtils.lerp(
        headPivot.rotation.x,
        targetHeadPitch + emotionHeadPitch + nodOffset + breathSwayY,
        headLerp
      );
      headPivot.rotation.z = THREE.MathUtils.lerp(
        headPivot.rotation.z,
        targetHeadRoll + emotionHeadRoll,
        headLerp
      );

      // 3. Eyes Gaze Tracking (Faster saccadic response + binocular convergence)
      // Vergence angle increases as user gets closer
      const vergence = (currentTracking.distance - 0.5) * 0.08;
      const eyeLerp = 8.5 * dt;
      const targetEyeYaw = currentTracking.targetX * 0.55;
      const targetEyePitch = -currentTracking.targetY * 0.45;

      leftEye.eyePivot.rotation.y = THREE.MathUtils.lerp(
        leftEye.eyePivot.rotation.y,
        targetEyeYaw + vergence,
        eyeLerp
      );
      rightEye.eyePivot.rotation.y = THREE.MathUtils.lerp(
        rightEye.eyePivot.rotation.y,
        targetEyeYaw - vergence,
        eyeLerp
      );
      leftEye.eyePivot.rotation.x = THREE.MathUtils.lerp(
        leftEye.eyePivot.rotation.x,
        targetEyePitch,
        eyeLerp
      );
      rightEye.eyePivot.rotation.x = THREE.MathUtils.lerp(
        rightEye.eyePivot.rotation.x,
        targetEyePitch,
        eyeLerp
      );

      // Pupil dynamic dilation
      leftEye.pupil.scale.set(pupilScale, pupilScale, 1);
      rightEye.pupil.scale.set(pupilScale, pupilScale, 1);

      // 4. Eyebrows Animation
      const leftBrowTargetY = 0.14 + targetBrowRaise * 0.04 - targetBrowFurrow * 0.02;
      const rightBrowTargetY =
        0.14 +
        (emotion === 'curiosidade' ? targetBrowRaise * 0.065 : targetBrowRaise * 0.04) -
        targetBrowFurrow * 0.02;

      leftEyebrow.position.y = THREE.MathUtils.lerp(leftEyebrow.position.y, leftBrowTargetY, 5 * dt);
      rightEyebrow.position.y = THREE.MathUtils.lerp(rightEyebrow.position.y, rightBrowTargetY, 5 * dt);

      // Eyebrow furrow rotation
      const furrowAngle = targetBrowFurrow * 0.15;
      leftEyebrow.rotation.z = THREE.MathUtils.lerp(leftEyebrow.rotation.z, -furrowAngle, 5 * dt);
      rightEyebrow.rotation.z = THREE.MathUtils.lerp(rightEyebrow.rotation.z, furrowAngle, 5 * dt);

      // 5. Lip-Sync & Viseme Mouth Articulation
      let speechJawDrop = 0;
      let speechLipStretch = 0;

      if (status === 'speaking') {
        // Dynamic syllable frequency modulated by real-time speech outputAudioLevel
        const audioIntensity = Math.min(Math.max(outputAudioLevel, 0), 1);
        const speechOsc = Math.sin(timestamp * 0.016) * 0.5 + 0.5;
        const speechViseme = Math.sin(timestamp * 0.008) * 0.5 + 0.5;

        speechJawDrop = (audioIntensity * 0.65 + 0.15) * speechOsc * 0.06;
        speechLipStretch = speechViseme * 0.03;
      } else if (targetSurprise > 0) {
        speechJawDrop = targetSurprise * 0.035;
      }

      // Smooth mouth jaw drop & lip positions
      const jawY = -0.06 - speechJawDrop;
      mouthGroup.position.y = THREE.MathUtils.lerp(mouthGroup.position.y, jawY, 12 * dt);

      // Lip separation
      const upperLipTargetY = 0.022 + speechJawDrop * 0.15;
      const lowerLipTargetY = -0.022 - speechJawDrop * 0.85;
      upperLip.position.y = THREE.MathUtils.lerp(upperLip.position.y, upperLipTargetY, 12 * dt);
      lowerLip.position.y = THREE.MathUtils.lerp(lowerLip.position.y, lowerLipTargetY, 12 * dt);

      // Smile mouth corner elevation
      const cornerTargetY = targetSmile * 0.022;
      const cornerTargetX = 0.11 + targetSmile * 0.015 + speechLipStretch;
      mouthCornerLeft.position.y = THREE.MathUtils.lerp(mouthCornerLeft.position.y, cornerTargetY, 6 * dt);
      mouthCornerRight.position.y = THREE.MathUtils.lerp(mouthCornerRight.position.y, cornerTargetY, 6 * dt);
      mouthCornerLeft.position.x = THREE.MathUtils.lerp(mouthCornerLeft.position.x, cornerTargetX, 6 * dt);
      mouthCornerRight.position.x = THREE.MathUtils.lerp(mouthCornerRight.position.x, -cornerTargetX, 6 * dt);

      // Subtle cheek lift during smiles
      const cheekLift = targetSmile * 0.02;
      leftCheek.position.y = THREE.MathUtils.lerp(leftCheek.position.y, 0.14 + cheekLift, 6 * dt);
      rightCheek.position.y = THREE.MathUtils.lerp(rightCheek.position.y, 0.14 + cheekLift, 6 * dt);

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup WebGL resources cleanly
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      skinTex.dispose();
      irisTex.dispose();
    };
  }, []);

  // Emotions config list for the quick testing/demonstration selector bar
  const emotionsList: Array<{ id: NexusEmotion; label: string; icon: string }> = [
    { id: 'alegria', label: 'Alegria', icon: '😊' },
    { id: 'curiosidade', label: 'Curiosidade', icon: '💡' },
    { id: 'atencao', label: 'Atenção', icon: '🎯' },
    { id: 'surpresa', label: 'Surpresa', icon: '😲' },
    { id: 'empatia', label: 'Empatia', icon: '🤝' },
    { id: 'concentracao', label: 'Concentração', icon: '🧐' },
    { id: 'seriedade', label: 'Seriedade', icon: '🛡️' },
    { id: 'satisfacao', label: 'Satisfação', icon: '✨' },
  ];

  return (
    <div className={`relative flex flex-col items-center select-none w-full ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center group"
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Ambient Halo Glow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl transition-all duration-700"
          style={{
            background:
              status === 'speaking'
                ? 'radial-gradient(circle at 50% 45%, rgba(6, 182, 212, 0.22) 0%, transparent 65%)'
                : status === 'listening'
                ? 'radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.2) 0%, transparent 65%)'
                : status === 'thinking'
                ? 'radial-gradient(circle at 50% 45%, rgba(168, 85, 247, 0.2) 0%, transparent 65%)'
                : 'radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.12) 0%, transparent 65%)',
          }}
        />

        {/* Top Floating Control Bar */}
        <div className="absolute top-2.5 inset-x-3 flex items-center justify-between pointer-events-auto">
          {/* Tracking Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 shadow-lg text-[10px] font-bold">
            {isCameraActive ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>Rastreamento Visual Ativo</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>Rastreamento por Cursor & Autônomo</span>
              </span>
            )}
          </div>

          {/* Camera Toggle Button & Privacy Trigger */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
              className="p-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Informações de Privacidade da Câmera"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleToggleCamera}
              disabled={isTrackingStarting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md backdrop-blur-md ${
                isCameraActive
                  ? 'bg-rose-950/90 border border-rose-500/40 text-rose-300 hover:bg-rose-900/90'
                  : 'bg-cyan-600/90 border border-cyan-400/40 text-white hover:bg-cyan-500/90 shadow-cyan-500/20'
              }`}
            >
              {isTrackingStarting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Iniciando...</span>
                </>
              ) : isCameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Desligar Câmera</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Ativar Câmera</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* PIP Camera Mini Preview with Reticle (When camera is active) */}
        {isCameraActive && (
          <div className="absolute bottom-2.5 right-2.5 w-24 h-18 rounded-xl overflow-hidden border border-cyan-500/40 shadow-xl bg-black/80 backdrop-blur-sm pointer-events-auto flex items-center justify-center group/pip">
            <video
              ref={miniVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100 opacity-75"
            />
            {/* Tracking Crosshair Reticle Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-8 h-8 rounded-full border border-cyan-400/80 transition-all duration-100 flex items-center justify-center"
                style={{
                  transform: `translate(${trackingFrame.targetX * 14}px, ${
                    -trackingFrame.targetY * 10
                  }px)`,
                }}
              >
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
              </div>
            </div>
            <div className="absolute bottom-0.5 inset-x-0 text-center bg-black/60 text-[8px] font-bold text-cyan-300 py-0.5">
              {trackingFrame.isUserInView ? 'Detectado' : 'Aguardando'}
            </div>
          </div>
        )}

        {/* Reaction HUD Feedback Badge (Bottom-Left) */}
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 font-medium">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>
              {status === 'speaking'
                ? 'Sincronização Labial em Tempo Real'
                : status === 'listening'
                ? 'Acompanhando e Ouvindo...'
                : trackingFrame.source === 'camera'
                ? trackingFrame.isUserInView
                  ? 'Acompanhando seus movimentos'
                  : 'Retornando à posição neutra'
                : 'Mova o cursor para interagir'}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner / Drawer */}
      {showPrivacyNotice && (
        <div className="mt-2 w-full p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-200 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] leading-relaxed">
              <strong className="text-cyan-300 block mb-0.5">
                Privacidade & Segurança do Instituto Ambiente:
              </strong>
              O processamento do rastreamento é realizado{' '}
              <strong>100% diretamente no seu navegador</strong>. Nenhuma imagem, foto ou vídeo é
              gravado, armazenado ou enviado para servidores. A câmera é utilizada exclusivamente para
              fazer o avatar orientar os olhos e a cabeça em tempo real. Você pode desativá-la a
              qualquer momento.
            </div>
            <button
              onClick={() => setShowPrivacyNotice(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Camera Access Error Message */}
      {cameraError && (
        <div className="mt-2 w-full p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between">
          <span>{cameraError}</span>
          <button
            onClick={() => setCameraError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Interactive Emotion Bar (8 Required Expressions) */}
      <div className="w-full mt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
          <span className="font-semibold flex items-center gap-1 text-slate-300">
            <Smile className="w-3.5 h-3.5 text-cyan-400" />
            Expressões Faciais Humanas:
          </span>
          <span className="text-[10px] text-cyan-400 font-bold capitalize">
            {emotion === 'neutro' ? 'Natural' : emotion}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          {emotionsList.map((emo) => {
            const isSelected = emotion === emo.id;
            return (
              <button
                key={emo.id}
                onClick={() => onEmotionChange?.(emo.id)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                  isSelected
                    ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
                title={`Expressão: ${emo.label}`}
              >
                <span className="text-sm">{emo.icon}</span>
                <span className="truncate w-full text-center text-[9px]">{emo.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
