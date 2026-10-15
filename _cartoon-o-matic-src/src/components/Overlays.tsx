import { useEffect, useRef, type ReactNode } from 'react';
import type { Cartoon, MoodKey } from '../data/types';
import { MOOD_KEYS } from '../data/types';
import { CARTOONS } from '../data';
import { MOOD_META, similar, type Reason, type Scored, type TripleFeature } from '../lib/engine';
import type { Library } from '../lib/library';
import { Actions, ConfidenceNote, LocationStamp, MetaLine, StarChips } from './Bits';

export function Overlay({ onClose, children, label, className = '' }: { onClose: () => void; children: ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className={`overlay ${className}`} onClick={onClose}>
      <div className="overlay-card" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function MoodBars({ c, highlight }: { c: Cartoon; highlight?: MoodKey[] }) {
  return (
    <div className="mood-bars" aria-label="Editorial mood ratings">
      {MOOD_KEYS.map((k) => (
        <div key={k} className={`mood-bar ${highlight?.includes(k) ? 'hl' : ''}`}>
          <span className="mb-name">{MOOD_META[k].name}</span>
          <span className="mb-track" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <i key={i} className={i < c.mood[k] ? 'full' : ''} />
            ))}
          </span>
          <span className="mb-val">{c.mood[k]}</span>
        </div>
      ))}
    </div>
  );
}

export function SimilarList({ c, onOpen }: { c: Cartoon; onOpen: (c: Cartoon) => void }) {
  const list = similar(c, CARTOONS, 8);
  return (
    <div className="similar">
      <h4>Kindred cartoons (across all four volumes)</h4>
      <ul>
        {list.map(({ cartoon, similarity }) => (
          <li key={cartoon.id}>
            <button onClick={() => onOpen(cartoon)}>
              <LocationStamp c={cartoon} size="sm" />
              <span className="sim-title">{cartoon.title}</span>
              <span className="sim-year">{cartoon.year}</span>
              <span className="sim-pct">{Math.round(similarity * 100)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CartoonCard({ c, lib, onOpen, onClose, matchPct }: { c: Cartoon; lib: Library; onOpen: (c: Cartoon) => void; onClose: () => void; matchPct?: number }) {
  const watchedTimes = lib.state.watched[c.id];
  return (
    <Overlay onClose={onClose} label={`${c.title} information card`} className="card-overlay">
      <div className="info-card">
        <LocationStamp c={c} />
        <p className="disc-name">
          Golden Collection Vol. {c.vol}, Disc {c.disc}: <em>{c.discName}</em>
        </p>
        <h3 className="card-title">{c.title}</h3>
        <MetaLine c={c} />
        <StarChips c={c} />
        <p className="synopsis">{c.synopsis}</p>
        {c.context && (
          <p className="context">
            <b>Historical context:</b> {c.context}
          </p>
        )}
        {matchPct !== undefined && <p className="match-pct">Mood match with the current dials: {matchPct}%</p>}
        <Actions c={c} lib={lib} />
        {watchedTimes && (
          <p className="fine">
            Watched {watchedTimes.length}× · last {new Date(watchedTimes[watchedTimes.length - 1]).toLocaleDateString()}
          </p>
        )}
        <div className="card-cols">
          <div>
            <h4>The editor’s dials</h4>
            <MoodBars c={c} />
            <ConfidenceNote c={c} />
          </div>
          <SimilarList c={c} onOpen={onOpen} />
        </div>
      </div>
    </Overlay>
  );
}

export function Reveal({
  winner,
  reasons,
  poolSize,
  lib,
  onClose,
  onSpinAgain,
  onSurprise,
  onSimilar,
  surpriseNote,
  highlight,
}: {
  winner: Scored;
  reasons: Reason[];
  poolSize: number;
  lib: Library;
  onClose: () => void;
  onSpinAgain: () => void;
  onSurprise: () => void;
  onSimilar: () => void;
  surpriseNote?: string;
  highlight: MoodKey[];
}) {
  const c = winner.cartoon;
  return (
    <Overlay onClose={onClose} label={`Winner: ${c.title}`} className="reveal-overlay">
      <div className="curtain left" aria-hidden="true" />
      <div className="curtain right" aria-hidden="true" />
      <div className="ticket">
        <p className="ticket-kicker">★ And the winner is ★</p>
        <LocationStamp c={c} />
        <h3 className="ticket-title">{c.title}</h3>
        <p className="disc-name">
          Golden Collection Vol. {c.vol} · Disc {c.disc}: <em>{c.discName}</em> · {pos(c.pos)} cartoon on the disc menu
        </p>
        <MetaLine c={c} />
        <StarChips c={c} />
        <p className="synopsis">{c.synopsis}</p>
        {c.context && (
          <p className="context">
            <b>Historical context:</b> {c.context}
          </p>
        )}
        <div className="why">
          <h4>
            Why this one? <span className="match-pct">{Math.round(winner.score * 100)}% mood match · drawn from {poolSize} eligible</span>
          </h4>
          {surpriseNote && <p className="surprise-note">{surpriseNote}</p>}
          <ul>
            {reasons.map((r, i) => (
              <li key={i} className={`reason ${r.tone}`}>
                {r.text}
              </li>
            ))}
          </ul>
        </div>
        <Actions c={c} lib={lib} />
        <div className="ticket-buttons">
          <button className="btn-big red" onClick={onSpinAgain}>
            Spin Again
          </button>
          <button className="btn-big teal" onClick={onSurprise}>
            Surprise Me
          </button>
          <button className="btn-big gold" onClick={onSimilar}>
            Find Similar
          </button>
        </div>
        <details className="ticket-dials">
          <summary>Show this cartoon’s editorial dials</summary>
          <MoodBars c={c} highlight={highlight} />
          <ConfidenceNote c={c} />
        </details>
      </div>
    </Overlay>
  );
}

function pos(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function TripleBill({ t, lib, onClose, onAgain, onOpen }: { t: TripleFeature; lib: Library; onClose: () => void; onAgain: () => void; onOpen: (c: Cartoon) => void }) {
  return (
    <Overlay onClose={onClose} label="Triple feature program" className="triple-overlay">
      <div className="playbill">
        <p className="ticket-kicker">★ Tonight · A Triple Feature ★</p>
        <h3 className="playbill-title">Three Contrasting Cartoons</h3>
        <p className="playbill-sub">
          About {t.totalMinutes} minutes (est.) · {t.discSwaps === 0 ? 'no disc swaps!' : `${t.discSwaps} disc swap${t.discSwaps > 1 ? 's' : ''}`} · in physical
          order so you can play straight through
        </p>
        <ol className="bill">
          {t.program.map((p, i) => (
            <li key={p.cartoon.id}>
              <span className="act-no">{['Opening act', 'Second feature', 'Grand finale'][i]}</span>
              <button className="bill-item" onClick={() => onOpen(p.cartoon)}>
                <LocationStamp c={p.cartoon} />
                <span className="bill-title">{p.cartoon.title}</span>
                <MetaLine c={p.cartoon} />
              </button>
            </li>
          ))}
        </ol>
        <div className="ticket-buttons">
          <button className="btn-big red" onClick={() => lib.addToWatchlist(t.program.map((p) => p.cartoon.id))}>
            Add all three to tonight’s bill
          </button>
          <button className="btn-big teal" onClick={onAgain}>
            Book a different bill
          </button>
        </div>
      </div>
    </Overlay>
  );
}
