import React, { useEffect, useRef } from 'react';

interface BeamsProps {
  lightColor?: string;
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
  className?: string;
}

interface Beam {
  x: number;
  y: number;
  length: number;
  width: number;
  speed: number;
  opacity: number;
  targetOpacity: number;
  phase: number;
  driftSpeed: number;
}

export function Beams({
  lightColor = '#6D5DF6',
  beamWidth = 2,
  beamHeight = 18,
  beamNumber = 14,
  speed = 1.4,
  noiseIntensity = 1.2,
  scale = 0.18,
  rotation = 0,
  className = '',
}: BeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const beamsRef = useRef<Beam[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = (rect?.width || window.innerWidth) * window.devicePixelRatio;
      canvas.height = (rect?.height || 600) * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize beams
    const initBeams = () => {
      const beams: Beam[] = [];
      const parentRect = canvas.parentElement?.getBoundingClientRect();
      const w = parentRect?.width || window.innerWidth;
      const h = parentRect?.height || 600;

      for (let i = 0; i < beamNumber; i++) {
        beams.push({
          x: Math.random() * w,
          y: Math.random() * h,
          length: (h * (0.3 + Math.random() * 0.4)) * (beamHeight / 18),
          width: (2 + Math.random() * 3) * (beamWidth / 2),
          speed: (0.2 + Math.random() * 0.4) * speed,
          opacity: 0.4 + Math.random() * 0.5,
          targetOpacity: 0.6 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          driftSpeed: (0.05 + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1) * speed,
        });
      }
      beamsRef.current = beams;
    };

    initBeams();

    // Create noise pattern canvas to cache and draw quickly
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128;
    noiseCanvas.height = 128;
    const noiseCtx = noiseCanvas.getContext('2d');
    if (noiseCtx) {
      const imgData = noiseCtx.createImageData(128, 128);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const val = Math.floor(Math.random() * 255);
        imgData.data[i] = val;
        imgData.data[i + 1] = val;
        imgData.data[i + 2] = val;
        imgData.data[i + 3] = noiseIntensity * 12; // opacity of noise
      }
      noiseCtx.putImageData(imgData, 0, 0);
    }

    // Animation loop
    const animate = () => {
      const parentRect = canvas.parentElement?.getBoundingClientRect();
      const w = parentRect?.width || window.innerWidth;
      const h = parentRect?.height || 600;

      // Clear with transparent black so the wrapper background shows through
      ctx.clearRect(0, 0, w, h);

      // Save canvas state for rotation
      ctx.save();
      if (rotation !== 0) {
        ctx.translate(w / 2, h / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-w / 2, -h / 2);
      }

      // Draw Beams
      beamsRef.current.forEach((beam) => {
        // Update physics
        beam.y -= beam.speed;
        beam.x += beam.driftSpeed * 0.2;
        beam.phase += 0.005 * speed;
        
        // Oscillate opacity
        beam.opacity += (beam.targetOpacity - beam.opacity) * 0.01;
        if (Math.abs(beam.opacity - beam.targetOpacity) < 0.05) {
          beam.targetOpacity = 0.1 + Math.random() * 0.8;
        }

        // Boundary checks
        if (beam.y + beam.length < 0) {
          beam.y = h + Math.random() * 100;
          beam.x = Math.random() * w;
        }
        if (beam.x < -100) beam.x = w + 50;
        if (beam.x > w + 100) beam.x = -50;

        // Helper for reliable color parsing
        const hexToRgba = (hexColor: string, alpha: number) => {
          const cleanHex = hexColor.replace('#', '');
          const r = parseInt(cleanHex.substring(0, 2), 16);
          const g = parseInt(cleanHex.substring(2, 4), 16);
          const b = parseInt(cleanHex.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        // Draw light beam using cross-browser safe rgba
        const gradient = ctx.createLinearGradient(
          beam.x,
          beam.y,
          beam.x,
          beam.y + beam.length
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.3, hexToRgba(lightColor, 0));
        // Soft glow center
        gradient.addColorStop(0.5, hexToRgba(lightColor, beam.opacity));
        gradient.addColorStop(0.7, hexToRgba(lightColor, 0));
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        
        // Scale with scale prop
        const currentWidth = beam.width * (1 + Math.sin(beam.phase) * 0.15) * (scale / 0.18);
        ctx.fillRect(beam.x - currentWidth / 2, beam.y, currentWidth, beam.length);
      });

      ctx.restore();

      // Draw subtle noise grain
      if (noiseIntensity > 0 && noiseCtx) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        const pattern = ctx.createPattern(noiseCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [lightColor, beamWidth, beamHeight, beamNumber, speed, noiseIntensity, scale, rotation]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full select-none ${className}`}
      style={{
        mixBlendMode: 'normal',
        willChange: 'transform',
      }}
    />
  );
}
