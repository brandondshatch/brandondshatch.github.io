import type { MoodKey } from '../data/types';
import { MOOD_KEYS } from '../data/types';
import { MOOD_META, type SliderState } from '../lib/engine';

const QUIPS: Record<MoodKey, string[]> = {
  violence: ['a gentle bonk', 'light concussions', 'standard mayhem', 'heavy ordnance', 'industrial accidents', 'ANVILS. ALL OF THEM.'],
  incorrect: ['squeaky clean', 'mildly dated', 'raised eyebrows', 'yikes, 1940s', 'mouth agape', 'the full museum'],
  whimsy: ['strictly Newtonian', 'mostly sensible', 'cartoon physics', 'loosely moored', 'reality optional', 'Dalí on a bender'],
  chaos: ['a Sunday stroll', 'brisk', 'lively', 'frantic', 'pandemonium', 'the whole barn is on fire'],
  clever: ['pie in the face', 'mostly pratfalls', 'balanced', 'witty', 'devilishly clever', 'Wagner-grade wit'],
  music: ['near silence', 'background tune', 'hummable', 'musical', 'operatic', 'SYMPHONIC LUNACY'],
  spooky: ['sunshine', 'a little shadow', 'creaky floorboards', 'haunted', 'gothic', 'full nightmare'],
  talk: ['pantomime', 'a few words', 'conversational', 'chatty', 'motor-mouthed', 'all wise guys'],
  sweet: ['pure vinegar', 'cynical', 'neutral', 'warm', 'tender', 'a lump in the throat'],
  weird: ['by the book', 'a quirk or two', 'odd', 'strange', 'experimental', 'WHAT DID I JUST WATCH'],
};

function Gauge({ value, on }: { value: number; on: boolean }) {
  const angle = -120 + (value / 5) * 240;
  return (
    <svg className={`gauge ${on ? 'on' : ''}`} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#f3e6c8" stroke="#1b1410" strokeWidth="3" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = ((-120 + i * 48 - 90) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={32 + 22 * Math.cos(a)}
            y1={32 + 22 * Math.sin(a)}
            x2={32 + 27 * Math.cos(a)}
            y2={32 + 27 * Math.sin(a)}
            stroke="#1b1410"
            strokeWidth="2.5"
          />
        );
      })}
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '32px 32px' }} className="needle">
        <line x1="32" y1="32" x2="32" y2="10" stroke={on ? '#b3202a' : '#8a7f6e'} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <circle cx="32" cy="32" r="5" fill="#1b1410" />
      <text x="32" y="53" textAnchor="middle" fontFamily="'Courier Prime', monospace" fontSize="12" fontWeight="700" fill="#1b1410">
        {on ? value : '—'}
      </text>
    </svg>
  );
}

interface Props {
  sliders: Record<MoodKey, SliderState>;
  onChange: (k: MoodKey, s: SliderState) => void;
  onReset: () => void;
}

export function MoodPanel({ sliders, onChange, onReset }: Props) {
  const engaged = MOOD_KEYS.filter((k) => sliders[k].on).length;
  return (
    <section className="panel mood-panel" aria-labelledby="mood-h">
      <header className="panel-head">
        <h2 id="mood-h">
          The Mood Calibrator <span className="model">Mk. IV</span>
        </h2>
        <p className="panel-sub">
          Engage a dial to make it count. Idle dials are ignored entirely.{' '}
          <strong>{engaged === 0 ? 'All dials idle.' : `${engaged} engaged.`}</strong>
        </p>
        {engaged > 0 && (
          <button className="btn-small" onClick={onReset}>
            Idle all dials
          </button>
        )}
      </header>
      <div className="sliders">
        {MOOD_KEYS.map((k) => {
          const meta = MOOD_META[k];
          const s = sliders[k];
          const id = `slider-${k}`;
          return (
            <div key={k} className={`slider-row ${s.on ? 'on' : 'off'}`}>
              <div className="slider-top">
                <label htmlFor={id} className="slider-name">
                  {meta.name}
                </label>
                <button
                  className={`lever ${s.on ? 'on' : ''}`}
                  role="switch"
                  aria-checked={s.on}
                  aria-label={`${meta.name} dial ${s.on ? 'engaged' : 'idle'}`}
                  onClick={() => onChange(k, { ...s, on: !s.on })}
                >
                  <span className="lever-knob" />
                  <span className="lever-text">{s.on ? 'ENGAGED' : 'IDLE'}</span>
                </button>
              </div>
              <div className="slider-body">
                <Gauge value={s.value} on={s.on} />
                <div className="slider-track-wrap">
                  <input
                    id={id}
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={s.value}
                    aria-valuetext={`${s.value} of 5: ${QUIPS[k][s.value]}${s.on ? '' : ' (idle)'}`}
                    onChange={(e) => onChange(k, { on: true, value: Number(e.target.value) })}
                    className="knob-slider"
                  />
                  <div className="ends">
                    <span>{meta.low}</span>
                    <span className="quip">{s.on ? `“${QUIPS[k][s.value]}”` : ''}</span>
                    <span>{meta.high}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
