// Tiny synthesized sound effects (Web Audio, no audio files, works offline).

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, endFreq?: number) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

/** Pointer clicking past a peg. */
export function tick(pitch = 1) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime;
  const len = Math.floor(a.sampleRate * 0.025);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 2200 * pitch;
  f.Q.value = 3;
  const g = a.createGain();
  g.gain.value = 0.5;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

/** Rising slide whistle as the wheel launches. */
export function whistleUp() {
  tone(420, 0, 0.55, 'sine', 0.12, 1500);
}

/** Descending "boing" for button presses. */
export function boing() {
  tone(240, 0, 0.18, 'triangle', 0.15, 120);
  tone(480, 0.02, 0.12, 'sine', 0.05, 300);
}

/** Little brass fanfare for the reveal. */
export function fanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => tone(n, i * 0.11, i === notes.length - 1 ? 0.6 : 0.16, 'square', 0.06));
  notes.forEach((n, i) => tone(n / 2, i * 0.11, i === notes.length - 1 ? 0.6 : 0.16, 'triangle', 0.08));
}

/** Sad trombone for "no cartoons match". */
export function wahWah() {
  [392, 370, 349, 311].forEach((n, i) => tone(n, i * 0.28, i === 3 ? 0.8 : 0.26, 'sawtooth', 0.05, i === 3 ? 280 : undefined));
}
