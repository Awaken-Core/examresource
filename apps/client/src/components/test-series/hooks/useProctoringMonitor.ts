import { useState, useEffect, useRef, useCallback } from 'react';

export interface ProctoringState {
  readonly isLive: boolean;
  readonly isScreenSharing: boolean;
  readonly movementDetected: boolean;
  readonly motionScore: number;
  readonly tabWarningCount: number;
  readonly movementWarningCount: number;
  readonly lastAlertMessage: string | null;
  readonly permissionDenied: boolean;
}

export function useProctoringMonitor() {
  const [isLive, setIsLive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [movementDetected, setMovementDetected] = useState(false);
  const [motionScore, setMotionScore] = useState(0);
  const [tabWarningCount, setTabWarningCount] = useState(0);
  const [movementWarningCount, setMovementWarningCount] = useState(0);
  const [lastAlertMessage, setLastAlertMessage] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIncidentTimeRef = useRef<number>(0);

  // Stop active media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
    setIsScreenSharing(false);
    prevFrameDataRef.current = null;
  }, []);

  // Trigger brief alert with cooldown
  const triggerMovementAlert = useCallback((msg: string) => {
    const now = Date.now();
    if (now - lastIncidentTimeRef.current > 3000) {
      lastIncidentTimeRef.current = now;
      setMovementWarningCount((prev) => prev + 1);
      setLastAlertMessage(msg);
    }
    setMovementDetected(true);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setMovementDetected(false);
    }, 1800);
  }, []);

  // Start webcam monitoring
  const startCamera = useCallback(async () => {
    try {
      stopStream();
      setPermissionDenied(false);
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera device access not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsLive(true);
      setIsScreenSharing(false);
    } catch {
      setPermissionDenied(true);
      setIsLive(false);
    }
  }, [stopStream]);

  // Start screen share monitoring
  const startScreenShare = useCallback(async () => {
    try {
      stopStream();
      setPermissionDenied(false);
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      // Listen to user ending stream via browser UI
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopStream();
      });
      setIsLive(true);
      setIsScreenSharing(true);
    } catch {
      setPermissionDenied(true);
      setIsLive(false);
    }
  }, [stopStream]);

  // Auto-request webcam on mount for CBT examination
  useEffect(() => {
    void startCamera();
    return () => {
      stopStream();
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [startCamera, stopStream]);

  // Motion Detection Loop (Canvas Pixel Diffing)
  useEffect(() => {
    if (!isLive) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 64;
      canvasRef.current.height = 48;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const prevData = prevFrameDataRef.current;

      if (prevData?.length === data.length) {
        let totalDiff = 0;
        const totalPixels = data.length / 4;

        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
          const rDiff = Math.abs(data[i] - prevData[i]);
          const gDiff = Math.abs(data[i + 1] - prevData[i + 1]);
          const bDiff = Math.abs(data[i + 2] - prevData[i + 2]);
          const pixelDiff = (rDiff + gDiff + bDiff) / 3;
          if (pixelDiff > 25) {
            totalDiff += 1;
          }
        }

        const sampledPixels = totalPixels / 4;
        const diffRatio = totalDiff / sampledPixels;
        const score = Math.min(100, Math.round(diffRatio * 300));
        setMotionScore(score);

        // Movement Threshold
        if (score > 35) {
          triggerMovementAlert(
            isScreenSharing
              ? 'Rapid screen movement detected!'
              : 'Unusual candidate movement detected!',
          );
        }
      }

      // Store clone of current frame
      prevFrameDataRef.current = new Uint8ClampedArray(data);
    }, 250);

    return () => clearInterval(interval);
  }, [isLive, isScreenSharing, triggerMovementAlert]);

  // Tab switch & Unwanted screen blur tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarningCount((prev) => prev + 1);
        setLastAlertMessage('Warning: Browser tab switched or minimized!');
        setMovementDetected(true);
      }
    };

    const handleWindowBlur = () => {
      setTabWarningCount((prev) => prev + 1);
      setLastAlertMessage('Warning: Exam window lost focus!');
      setMovementDetected(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  return {
    videoRef,
    isLive,
    isScreenSharing,
    movementDetected,
    motionScore,
    tabWarningCount,
    movementWarningCount,
    lastAlertMessage,
    permissionDenied,
    startCamera,
    startScreenShare,
    stopStream,
  };
}
