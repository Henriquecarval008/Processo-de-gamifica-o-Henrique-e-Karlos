/**
 * Camera Tracking & Computer Vision Service for GAMEINFOR
 * 
 * Provides 100% Client-Side Face & Movement Tracking for the Realistic Human 3D Avatar.
 * 
 * PRIVACY GUARANTEE:
 * - Operates entirely in the browser using local canvas/video processing.
 * - Zero images or video feeds are ever stored, recorded, or transmitted to any server.
 * - Explicit user permission is required before camera activation.
 * - Instant toggle off at any moment.
 */

export interface TrackingFrame {
  targetX: number; // -1.0 (user to left) to +1.0 (user to right)
  targetY: number; // -1.0 (down) to +1.0 (up)
  distance: number; // 0.0 (far away) to 1.0 (very close); ~0.5 is normal
  headRoll: number; // -0.5 to +0.5 rad (head tilt)
  isUserInView: boolean;
  confidence: number; // 0.0 to 1.0
  source: 'camera' | 'mouse' | 'autonomous';
}

export type TrackingListener = (frame: TrackingFrame) => void;

class CameraTrackingService {
  private mediaStream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private listeners: Set<TrackingListener> = new Set();

  private isTrackingActive = false;
  private isUserInView = false;
  private currentFrame: TrackingFrame = {
    targetX: 0,
    targetY: 0,
    distance: 0.5,
    headRoll: 0,
    isUserInView: false,
    confidence: 0,
    source: 'autonomous',
  };

  // Smoothed internal targets
  private smoothX = 0;
  private smoothY = 0;
  private smoothDistance = 0.5;
  private smoothRoll = 0;

  // Timers & fallbacks
  private lastDetectedTimestamp = 0;
  private lastMouseMoveTimestamp = 0;
  private mouseTargetX = 0;
  private mouseTargetY = 0;
  private nativeFaceDetector: any = null;

  // Processing resolution (optimized for high speed & low CPU)
  private readonly PROC_WIDTH = 80;
  private readonly PROC_HEIGHT = 60;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for native browser FaceDetector API
      if ('FaceDetector' in window) {
        try {
          this.nativeFaceDetector = new (window as any).FaceDetector({
            maxDetectedFaces: 1,
            fastMode: true,
          });
        } catch {
          this.nativeFaceDetector = null;
        }
      }

      // Attach mouse tracking listener as high-fidelity fallback
      window.addEventListener('mousemove', this.handleWindowMouseMove, { passive: true });
    }
  }

  private handleWindowMouseMove = (e: MouseEvent) => {
    this.lastMouseMoveTimestamp = performance.now();
    // Convert mouse coordinates to normalized -1 to +1 space
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -((e.clientY / window.innerHeight) * 2 - 1);
    this.mouseTargetX = Math.max(-1, Math.min(1, nx));
    this.mouseTargetY = Math.max(-1, Math.min(1, ny));
  };

  public subscribe(listener: TrackingListener): () => void {
    this.listeners.add(listener);
    // Send immediate current state
    listener(this.currentFrame);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(frame: TrackingFrame) {
    this.currentFrame = frame;
    this.listeners.forEach((listener) => {
      try {
        listener(frame);
      } catch (err) {
        console.error('Error in tracking listener', err);
      }
    });
  }

  public getIsActive(): boolean {
    return this.isTrackingActive;
  }

  public getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  public getCurrentFrame(): TrackingFrame {
    return this.currentFrame;
  }

  /**
   * Request camera permission and start the real-time tracking loop
   */
  public async startTracking(): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { success: false, error: 'Câmera não suportada neste navegador.' };
    }

    if (this.isTrackingActive && this.mediaStream) {
      return { success: true };
    }

    try {
      // Request low-overhead 320x240 video feed
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.mediaStream = stream;

      // Create hidden video element to feed the vision pipeline
      if (!this.videoEl) {
        this.videoEl = document.createElement('video');
        this.videoEl.autoplay = true;
        this.videoEl.muted = true;
        this.videoEl.playsInline = true;
        this.videoEl.style.display = 'none';
        document.body.appendChild(this.videoEl);
      }

      this.videoEl.srcObject = stream;
      await this.videoEl.play().catch(() => {});

      // Create offscreen canvas for computer vision downsampling
      if (!this.offscreenCanvas) {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.PROC_WIDTH;
        this.offscreenCanvas.height = this.PROC_HEIGHT;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      }

      this.isTrackingActive = true;
      this.startLoop();

      return { success: true };
    } catch (err: any) {
      this.stopTracking();
      const msg =
        err.name === 'NotAllowedError'
          ? 'Permissão da câmera foi negada. Autorize o acesso no navegador.'
          : err.name === 'NotFoundError'
          ? 'Nenhuma câmera encontrada no dispositivo.'
          : 'Não foi possível acessar a câmera.';
      return { success: false, error: msg };
    }
  }

  /**
   * Stop camera access and return to autonomous/mouse tracking
   */
  public stopTracking(): void {
    this.isTrackingActive = false;
    this.isUserInView = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }

    // Start background loop for autonomous & mouse tracking
    this.startAutonomousLoop();
  }

  public toggleTracking(): Promise<{ success: boolean; error?: string }> {
    if (this.isTrackingActive) {
      this.stopTracking();
      return Promise.resolve({ success: true });
    } else {
      return this.startTracking();
    }
  }

  /**
   * Primary vision processing loop (runs when camera is active)
   */
  private startLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    let lastProcessTime = 0;
    const PROCESS_INTERVAL_MS = 33; // ~30 fps processing limit to protect CPU

    const loop = (timestamp: number) => {
      if (!this.isTrackingActive) {
        this.startAutonomousLoop();
        return;
      }

      if (timestamp - lastProcessTime >= PROCESS_INTERVAL_MS) {
        lastProcessTime = timestamp;
        this.processCameraFrame();
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Fallback autonomous/mouse loop when camera is disabled
   */
  private startAutonomousLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      if (this.isTrackingActive) return; // Handled by camera loop

      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      const timeSinceMouse = timestamp - this.lastMouseMoveTimestamp;

      let targetX = 0;
      let targetY = 0;
      let targetDistance = 0.5;
      let targetRoll = 0;
      let source: 'mouse' | 'autonomous' = 'autonomous';

      if (timeSinceMouse < 3000) {
        // User recently moved mouse -> Avatar tracks mouse gaze gently
        targetX = this.mouseTargetX * 0.75;
        targetY = this.mouseTargetY * 0.5;
        targetDistance = 0.5;
        targetRoll = -this.mouseTargetX * 0.05;
        source = 'mouse';
      } else {
        // Autonomous organic gaze saccades & breathing wander
        const t = timestamp * 0.001;
        // Subtle natural wander
        const wanderX = Math.sin(t * 0.45) * 0.18 + Math.cos(t * 0.95) * 0.08;
        const wanderY = Math.cos(t * 0.35) * 0.12 + Math.sin(t * 0.8) * 0.05;
        const wanderRoll = Math.sin(t * 0.25) * 0.03;

        targetX = wanderX;
        targetY = wanderY;
        targetDistance = 0.5 + Math.sin(t * 0.2) * 0.03;
        targetRoll = wanderRoll;
        source = 'autonomous';
      }

      // Smooth interpolation (lerp)
      const lerpSpeed = source === 'mouse' ? 6.0 * dt : 2.5 * dt;
      this.smoothX += (targetX - this.smoothX) * Math.min(lerpSpeed, 1);
      this.smoothY += (targetY - this.smoothY) * Math.min(lerpSpeed, 1);
      this.smoothDistance += (targetDistance - this.smoothDistance) * Math.min(lerpSpeed, 1);
      this.smoothRoll += (targetRoll - this.smoothRoll) * Math.min(lerpSpeed, 1);

      this.notify({
        targetX: this.smoothX,
        targetY: this.smoothY,
        distance: this.smoothDistance,
        headRoll: this.smoothRoll,
        isUserInView: source === 'mouse',
        confidence: source === 'mouse' ? 0.8 : 0.4,
        source,
      });

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Real-time computer vision frame analysis
   */
  private async processCameraFrame() {
    if (!this.videoEl || !this.offscreenCtx || !this.offscreenCanvas) return;
    if (this.videoEl.readyState < 2) return; // HAVE_CURRENT_DATA

    const width = this.PROC_WIDTH;
    const height = this.PROC_HEIGHT;

    // 1. Try Native FaceDetector if available
    if (this.nativeFaceDetector) {
      try {
        const faces = await this.nativeFaceDetector.detect(this.videoEl);
        if (faces && faces.length > 0) {
          const face = faces[0];
          const bb = face.boundingBox;
          const vw = this.videoEl.videoWidth || 320;
          const vh = this.videoEl.videoHeight || 240;

          // Normalized center of face (mirrored: video right is user right)
          const centerX = (bb.x + bb.width / 2) / vw;
          const centerY = (bb.y + bb.height / 2) / vh;

          // Target X: -1 (left) to +1 (right) from the user's perspective (mirrored)
          const rawTargetX = (1 - centerX) * 2 - 1;
          // Target Y: -1 (down) to +1 (up)
          const rawTargetY = -(centerY * 2 - 1);

          // Distance: larger bounding box = closer to camera
          const faceAreaRatio = (bb.width * bb.height) / (vw * vh);
          const rawDistance = Math.min(1, Math.max(0.1, faceAreaRatio * 4.5));

          this.updateFromDetection(rawTargetX, rawTargetY, rawDistance, 0, 0.95);
          return;
        }
      } catch {
        // Fallback to optical skin-centroid tracking
      }
    }

    // 2. Optical Skin Chrominance & Mass Centroid Tracking (Ultra-fast, zero dependencies)
    try {
      this.offscreenCtx.drawImage(this.videoEl, 0, 0, width, height);
      const imgData = this.offscreenCtx.getImageData(0, 0, width, height);
      const data = imgData.data;

      let totalWeight = 0;
      let weightedSumX = 0;
      let weightedSumY = 0;
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;

      // Analyze pixels for human skin tones in lighting-invariant subspace
      // Restrict to upper 85% of frame (head/shoulders region)
      const maxRows = Math.floor(height * 0.85);

      for (let y = 5; y < maxRows; y += 2) {
        for (let x = 5; x < width - 5; x += 2) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Normalized skin detector filter
          const isSkin =
            r > 80 &&
            g > 40 &&
            b > 25 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 15 &&
            r - b > 15 &&
            r < 250;

          if (isSkin) {
            // Give higher weight to central vertical region (face vs background clutter)
            const yWeight = 1.0 - Math.abs(y - height * 0.4) / (height * 0.5);
            const weight = Math.max(0.2, yWeight);

            totalWeight += weight;
            weightedSumX += x * weight;
            weightedSumY += y * weight;

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const minSkinPixelsThreshold = 40;

      if (totalWeight > minSkinPixelsThreshold) {
        const centroidX = weightedSumX / totalWeight;
        const centroidY = weightedSumY / totalWeight;

        // Mirror X for natural user reflection
        const rawTargetX = (1 - centroidX / width) * 2 - 1;
        const rawTargetY = -((centroidY / height) * 2 - 1);

        // Bounding box size = distance metric
        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;
        const boxArea = (boxWidth * boxHeight) / (width * height);
        const rawDistance = Math.min(1, Math.max(0.1, boxArea * 3.2));

        // Slight head roll estimation
        const rawRoll = rawTargetX * -0.06;

        this.updateFromDetection(rawTargetX, rawTargetY, rawDistance, rawRoll, 0.85);
      } else {
        // No user detected in view
        this.handleUserOutOfView();
      }
    } catch (err) {
      console.warn('Vision processing error', err);
      this.handleUserOutOfView();
    }
  }

  private updateFromDetection(
    rawX: number,
    rawY: number,
    rawDistance: number,
    rawRoll: number,
    confidence: number
  ) {
    this.isUserInView = true;
    this.lastDetectedTimestamp = performance.now();

    // Responsive yet smooth exponential moving average
    const alphaPos = 0.35;
    const alphaDist = 0.25;

    this.smoothX += (rawX - this.smoothX) * alphaPos;
    this.smoothY += (rawY - this.smoothY) * alphaPos;
    this.smoothDistance += (rawDistance - this.smoothDistance) * alphaDist;
    this.smoothRoll += (rawRoll - this.smoothRoll) * alphaPos;

    this.notify({
      targetX: Math.max(-1, Math.min(1, this.smoothX)),
      targetY: Math.max(-1, Math.min(1, this.smoothY)),
      distance: Math.max(0.1, Math.min(1, this.smoothDistance)),
      headRoll: Math.max(-0.4, Math.min(0.4, this.smoothRoll)),
      isUserInView: true,
      confidence,
      source: 'camera',
    });
  }

  private handleUserOutOfView() {
    const now = performance.now();
    const timeSinceLastDetection = now - this.lastDetectedTimestamp;

    if (timeSinceLastDetection > 1200) {
      // User is confirmed out of view -> Return smoothly to neutral center without abrupt jumps
      this.isUserInView = false;
      const returnAlpha = 0.08;

      this.smoothX += (0 - this.smoothX) * returnAlpha;
      this.smoothY += (0 - this.smoothY) * returnAlpha;
      this.smoothDistance += (0.5 - this.smoothDistance) * returnAlpha;
      this.smoothRoll += (0 - this.smoothRoll) * returnAlpha;

      this.notify({
        targetX: this.smoothX,
        targetY: this.smoothY,
        distance: this.smoothDistance,
        headRoll: this.smoothRoll,
        isUserInView: false,
        confidence: 0,
        source: 'camera',
      });
    }
  }
}

export const cameraTrackingService = new CameraTrackingService();
