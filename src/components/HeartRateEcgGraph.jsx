import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Activity, Heart, Volume2, VolumeX, Radio } from 'lucide-react';
import { playMedicalHeartBeep, resumeAudioContext } from '../utils/heartBeeper';

export const HeartRateEcgGraph = ({
  heartRate = 118,
  spo2 = 91,
  isAbnormal = false,
  rhythmTitle = 'Lead II Telemetry',
  height = 46,
  showControls = true,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isBeeping, setIsBeeping] = useState(false);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isAudioMuted;
  }, [isAudioMuted]);

  const toggleSound = useCallback(() => {
    resumeAudioContext();
    setIsAudioMuted(prev => !prev);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = 0;
    const width = canvas.width;
    const heightCanvas = canvas.height;
    const midY = heightCanvas / 2;

    // Draw ECG oscilloscope green background grid
    const drawGrid = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, heightCanvas);

      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, heightCanvas);
        ctx.stroke();
      }
      for (let j = 0; j < heightCanvas; j += 14) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }
    };

    drawGrid();

    // P-Q-R-S-T wave calculation
    const getEcgPoint = (phase) => {
      const p = phase % 1;
      if (p < 0.15) {
        return midY;
      } else if (p < 0.25) {
        // P-wave
        return midY - (heightCanvas * 0.15) * Math.sin(((p - 0.15) / 0.10) * Math.PI);
      } else if (p < 0.32) {
        return midY;
      } else if (p < 0.35) {
        // Q-dip
        return midY + (heightCanvas * 0.12);
      } else if (p < 0.40) {
        // R-Spike (ventricular contraction peak)
        return midY - (heightCanvas * 0.42);
      } else if (p < 0.44) {
        // S-dip
        return midY + (heightCanvas * 0.18);
      } else if (p < 0.54) {
        // ST Segment
        const stElev = isAbnormal ? -(heightCanvas * 0.10) : 0;
        return midY + stElev;
      } else if (p < 0.70) {
        // T-wave
        return midY - (heightCanvas * 0.20) * Math.sin(((p - 0.54) / 0.16) * Math.PI);
      }
      return midY;
    };

    let beatProgress = 0;
    let lastBeatCount = -1;
    let beepTimer = null;
    const bpmSpeed = (heartRate / 60) * 0.016;

    const render = () => {
      animRef.current = requestAnimationFrame(render);

      // Erase ahead of scan line
      ctx.fillStyle = 'rgba(2, 6, 23, 0.28)';
      ctx.fillRect(x, 0, 16, heightCanvas);

      // Advance phase
      beatProgress += bpmSpeed;
      const y = getEcgPoint(beatProgress);

      // Check if passing R-spike peak (~0.39)
      const currentBeatCount = Math.floor(beatProgress - 0.38);
      if (currentBeatCount > lastBeatCount) {
        lastBeatCount = currentBeatCount;

        // 1. Play audible hospital beep tone
        playMedicalHeartBeep({
          heartRate,
          spo2,
          isMuted: isMutedRef.current,
          volume: 0.15
        });

        // 2. Trigger visual beep flash
        setIsBeeping(true);
        if (beepTimer) clearTimeout(beepTimer);
        beepTimer = setTimeout(() => {
          setIsBeeping(false);
        }, 130);

        // 3. Draw pulse ring at peak on canvas
        ctx.fillStyle = isAbnormal ? '#fbbf24' : '#34d399';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw the ECG stroke
      ctx.beginPath();
      ctx.strokeStyle = isAbnormal ? '#f59e0b' : '#10b981';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = isAbnormal ? '#fbbf24' : '#34d399';
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

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (beepTimer) clearTimeout(beepTimer);
    };
  }, [heartRate, spo2, isAbnormal]);

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-lg flex flex-col gap-2.5 ${className}`}>
      {/* Header bar: Rhythm title, Beeping LED badge, Sound toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="uppercase text-[11px] tracking-wide">{rhythmTitle}</span>
          </div>

          {/* Synchronized Visual Beep Indicator Badge */}
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black flex items-center gap-1 transition-all ${
            isBeeping
              ? 'bg-emerald-400 text-slate-950 scale-105 shadow-[0_0_15px_#10b981]'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
          }`}>
            <Heart className={`w-3 h-3 ${isBeeping ? 'fill-slate-950 text-slate-950 scale-125' : 'text-emerald-400'}`} />
            <span>{isBeeping ? 'BEEP!' : 'PULSE'}</span>
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-300">
              <span className="text-slate-400">HR:</span>
              <span className={`font-black text-xs ${heartRate > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                {heartRate} BPM
              </span>
            </div>

            {/* Audio Beep Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleSound}
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
          </div>
        )}
      </div>

      {/* Live ECG Waveform Canvas */}
      <div className="w-full rounded-xl overflow-hidden border border-emerald-950/80 bg-black relative shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={height}
          className="w-full h-full block"
          style={{ height: `${height}px` }}
        />

        {/* Ambient CRT Scanline Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none" />

        {/* Live Audio Waves Pulsing Bars */}
        <div className="absolute right-2 bottom-1.5 flex items-end gap-0.5 pointer-events-none opacity-80">
          <span className={`w-1 rounded-full transition-all duration-75 ${isBeeping ? 'h-4 bg-emerald-400' : 'h-1.5 bg-emerald-950'}`}></span>
          <span className={`w-1 rounded-full transition-all duration-75 ${isBeeping ? 'h-6 bg-emerald-300' : 'h-2 bg-emerald-900'}`}></span>
          <span className={`w-1 rounded-full transition-all duration-75 ${isBeeping ? 'h-3 bg-emerald-400' : 'h-1 bg-emerald-950'}`}></span>
        </div>
      </div>
    </div>
  );
};
