import { useEffect, useRef, useState } from 'react';
import type { Scored } from '../lib/engine';
import { tick, whistleUp } from '../lib/sound';

const COLORS = ['#b3202a', '#f3e6c8', '#1f8f8a', '#e8b84a', '#1f4e9e', '#f3e6c8'];
const INK = ['#f3e6c8', '#1b1410', '#f3e6c8', '#1b1410', '#f3e6c8', '#1b1410'];

export interface SpinRequest {
  token: number;
  slices: Scored[];
  winnerIndex: number;
}

interface Props {
  idleSlices: Scored[];
  request: SpinRequest | null;
  reducedMotion: boolean;
  onDone: () => void;
  onHubClick: () => void;
  busy: boolean;
  poolSize: number;
}

const DURATION = 5600; // ms, main spin
const SETTLE = 520; // ms, overshoot recovery
const ACCEL = 0.11; // fraction of the spin spent accelerating

/** Normalized position along the spin (0→1) for a velocity profile that
 *  ramps up linearly, then decays as (1-u)^3 — the classic roulette feel. */
function spinProgress(p: number): number {
  const total = ACCEL / 2 + (1 - ACCEL) / 4;
  if (p <= ACCEL) return (p * p) / (2 * ACCEL) / total;
  const u = (p - ACCEL) / (1 - ACCEL);
  return (ACCEL / 2 + ((1 - ACCEL) * (1 - (1 - u) ** 4)) / 4) / total;
}

// Radial room for a label: from just outside the hub (r≈150) to r=390.
const LABEL_ROOM = 238;
const CHAR_W = 0.56; // average glyph width (em) for Limelight
const MIN_FONT = 17;

/** Shrink long titles to fit between hub and rim; truncate only as a last resort. */
function fitLabel(title: string, base: number): { text: string; size: number } {
  const size = Math.min(base, LABEL_ROOM / (title.length * CHAR_W));
  if (size >= MIN_FONT) return { text: title, size };
  const max = Math.floor(LABEL_ROOM / (MIN_FONT * CHAR_W));
  return { text: title.slice(0, max - 1).trimEnd() + '…', size: MIN_FONT };
}

export function Wheel({ idleSlices, request, reducedMotion, onDone, onHubClick, busy, poolSize }: Props) {
  const [slices, setSlices] = useState<Scored[]>(idleSlices);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [blur, setBlur] = useState(false);
  const [flap, setFlap] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const angleRef = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Show the idle preview whenever we're not mid-spin.
  useEffect(() => {
    if (!spinning && !request) setSlices(idleSlices);
  }, [idleSlices, spinning, request]);

  useEffect(() => {
    if (!request) return;
    const n = request.slices.length;
    const seg = 360 / n;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const landing = -(request.winnerIndex * seg + seg / 2) + jitter;
    const start = angleRef.current;
    setWinner(null);

    if (reducedMotion) {
      setSlices(request.slices);
      const final = ((landing % 360) + 360) % 360;
      angleRef.current = final;
      setAngle(final);
      const t = window.setTimeout(() => {
        setWinner(request.winnerIndex);
        doneRef.current();
      }, 350);
      return () => window.clearTimeout(t);
    }

    const turns = 6 + Math.floor(Math.random() * 3);
    const base = start - (start % 360);
    let target = base + turns * 360 + (((landing % 360) + 360) % 360);
    if (target - start < turns * 360) target += 360;
    const overshoot = seg * (0.18 + Math.random() * 0.12);
    const total = target + overshoot - start;

    let raf = 0;
    let t0 = 0;
    let lastIdx = -1;
    let swapped = false;
    setSpinning(true);
    whistleUp();

    const frame = (now: number) => {
      if (!t0) t0 = now;
      const el = now - t0;
      let a: number;
      if (el < DURATION) {
        const p = el / DURATION;
        a = start + total * spinProgress(p);
        setBlur(p > 0.06 && p < 0.42);
        if (!swapped && el > 380) {
          swapped = true;
          setSlices(request.slices);
        }
      } else {
        const q = Math.min(1, (el - DURATION) / SETTLE);
        const ease = 1 - (1 - q) ** 3;
        a = target + overshoot * (1 - ease);
        setBlur(false);
        if (q >= 1) {
          angleRef.current = target;
          setAngle(target);
          setSpinning(false);
          setWinner(request.winnerIndex);
          doneRef.current();
          return;
        }
      }
      angleRef.current = a;
      setAngle(a);
      // pointer clicks once per peg (slice boundary) passing under it
      const nNow = swapped ? n : Math.max(1, slices.length);
      const idx = Math.floor((((-a % 360) + 360) % 360) / (360 / nNow));
      if (idx !== lastIdx) {
        if (lastIdx !== -1) {
          tick(0.8 + Math.random() * 0.4);
          setFlap((f) => f + 1);
        }
        lastIdx = idx;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.token]);

  const n = Math.max(1, slices.length);
  const seg = 360 / n;
  const fontSize = n <= 6 ? 34 : n <= 9 ? 29 : 26;

  return (
    <div className={`wheel-wrap ${spinning ? 'is-spinning' : ''}`}>
      <div className="wheel-stand" aria-hidden="true" />
      <div className={`pointer ${flap % 2 ? 'flap-a' : 'flap-b'}`} aria-hidden="true">
        <svg viewBox="0 0 60 90">
          <path d="M30 88 L6 22 A26 26 0 1 1 54 22 Z" fill="#b3202a" stroke="#1b1410" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="30" cy="26" r="10" fill="#e8b84a" stroke="#1b1410" strokeWidth="3" />
        </svg>
      </div>
      <svg
        className={`wheel ${blur ? 'blurred' : ''}`}
        viewBox="0 0 1000 1000"
        role="img"
        aria-label={`Selection wheel showing ${slices.length} candidates from ${poolSize} eligible cartoons`}
      >
        <defs>
          <radialGradient id="rim" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#f6dc8e" />
            <stop offset="60%" stopColor="#c9a24a" />
            <stop offset="100%" stopColor="#7a5a1c" />
          </radialGradient>
          <radialGradient id="hubg" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ff6b5e" />
            <stop offset="70%" stopColor="#b3202a" />
            <stop offset="100%" stopColor="#6e0f15" />
          </radialGradient>
        </defs>
        <circle cx="500" cy="500" r="496" fill="url(#rim)" stroke="#1b1410" strokeWidth="8" />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <circle
              key={i}
              className={`rim-bulb ${i % 2 ? 'odd' : 'even'}`}
              cx={500 + 468 * Math.cos(a)}
              cy={500 + 468 * Math.sin(a)}
              r="13"
            />
          );
        })}
        <g transform={`rotate(${angle} 500 500)`}>
          {slices.length === 0 ? (
            <circle cx="500" cy="500" r="440" fill="#d9ccb0" stroke="#1b1410" strokeWidth="6" />
          ) : (
            slices.map((s, i) => {
              const a0 = ((i * seg - 90) * Math.PI) / 180;
              const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
              const R = 440;
              const large = seg > 180 ? 1 : 0;
              const d =
                n === 1
                  ? `M500 60 A440 440 0 1 1 499.9 60 Z`
                  : `M500 500 L${500 + R * Math.cos(a0)} ${500 + R * Math.sin(a0)} A${R} ${R} 0 ${large} 1 ${500 + R * Math.cos(a1)} ${500 + R * Math.sin(a1)} Z`;
              const colorIdx = n % COLORS.length === 1 && i === n - 1 ? 2 : i % COLORS.length;
              const isWinner = winner === i;
              const label = fitLabel(s.cartoon.title, fontSize);
              return (
                <g key={s.cartoon.id + i} className={isWinner ? 'slice winner' : 'slice'}>
                  <path d={d} fill={COLORS[colorIdx]} stroke="#1b1410" strokeWidth="5" strokeLinejoin="round" />
                  <g transform={`rotate(${i * seg + seg / 2 - 90} 500 500)`}>
                    <text
                      x="890"
                      y="500"
                      dy="0.35em"
                      textAnchor="end"
                      fontSize={label.size}
                      fill={INK[colorIdx]}
                      className="slice-label"
                    >
                      {label.text}
                    </text>
                  </g>
                </g>
              );
            })
          )}
          {slices.map((_, i) => {
            const a = ((i * seg - 90) * Math.PI) / 180;
            return <circle key={i} cx={500 + 432 * Math.cos(a)} cy={500 + 432 * Math.sin(a)} r="9" fill="#e8b84a" stroke="#1b1410" strokeWidth="3" />;
          })}
        </g>
        <g className="hub" onClick={busy ? undefined : onHubClick} role="presentation">
          <circle cx="500" cy="500" r="128" fill="#1b1410" />
          <circle cx="500" cy="500" r="116" fill="url(#hubg)" stroke="#e8b84a" strokeWidth="8" />
          <text x="500" y="488" textAnchor="middle" className="hub-acme">ACME</text>
          <text x="500" y="540" textAnchor="middle" className="hub-sub">
            {busy ? 'WHIRRR…' : 'PULL!'}
          </text>
        </g>
      </svg>
    </div>
  );
}
