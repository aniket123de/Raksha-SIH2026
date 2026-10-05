/**
 * Raksha Medical Heart Rate Telemetry Audio Synthesizer
 * Generates authentic medical monitor ECG "beep" tones via Web Audio API.
 */

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const resumeAudioContext = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
};

/**
 * Plays a single medical monitor ECG R-wave beep.
 * @param {Object} options
 * @param {number} options.heartRate - Current BPM
 * @param {number} options.spo2 - Oxygen saturation (modulates pitch like a pulse oximeter)
 * @param {boolean} options.isMuted - If true, sound is silenced
 * @param {number} options.volume - Gain multiplier (default 0.12)
 */
export const playMedicalHeartBeep = ({
  heartRate = 75,
  spo2 = 98,
  isMuted = false,
  volume = 0.12
} = {}) => {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Pitch modulation: Authentic medical telemetry tone
    // Drops pitch if SpO2 drops below normal (like standard hospital patient monitors)
    let freq = 880; // Standard A5 medical beep
    if (spo2 < 88) {
      freq = 700;
    } else if (spo2 < 92) {
      freq = 760;
    } else if (spo2 < 95) {
      freq = 820;
    } else if (heartRate > 125) {
      freq = 960;
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Fast exponential decay envelope for authentic hospital monitor "pip"
    const now = ctx.currentTime;
    const duration = 0.075; // 75ms pulse

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.006); // 6ms attack
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  } catch (err) {
    // Autoplay restrictions or background tab throttling
  }
};
