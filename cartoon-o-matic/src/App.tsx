import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CARTOONS } from './data';
import type { Cartoon, MoodKey } from './data/types';
import { MOOD_KEYS } from './data/types';
import {
  applyFilters,
  defaultFilters,
  defaultSettings,
  defaultSliders,
  diagnoseEmpty,
  engagedSliders,
  explain,
  MOOD_META,
  moodScore,
  rankPool,
  spin as runSpin,
  tripleFeature,
  weightedPick,
  WHEEL_SLOTS,
  type Relaxation,
  type Reason,
  type Scored,
  type Settings,
  type TripleFeature,
} from './lib/engine';
import { PRESETS } from './lib/presets';
import { usePersistent } from './lib/storage';
import { useLibrary } from './lib/library';
import { mulberry32, shuffle } from './lib/util';
import { boing, fanfare, setMuted, wahWah } from './lib/sound';
import { Wheel, type SpinRequest } from './components/Wheel';
import { MoodPanel } from './components/MoodPanel';
import { FilterCabinet } from './components/FilterCabinet';
import { Catalog } from './components/Catalog';
import { Tonight } from './components/Tonight';
import { CartoonCard, Reveal, TripleBill } from './components/Overlays';
import { LocationStamp } from './components/Bits';
import { Anvil, Bolt, Bulbs, Crate, Gear, Rings, Sunburst } from './components/Decor';

type Tab = 'machine' | 'catalog' | 'tonight';
type Motion = 'auto' | 'full' | 'calm';

interface LastResult {
  winner: Scored;
  reasons: Reason[];
  poolSize: number;
  surpriseNote?: string;
  highlight: MoodKey[];
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Merge persisted settings over defaults so older saves never break the app. */
function sanitize(s: Settings): Settings {
  const d = defaultSettings();
  return {
    sliders: { ...d.sliders, ...(s?.sliders ?? {}) },
    filters: { ...d.filters, ...(s?.filters ?? {}) },
  };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export default function App() {
  const [rawSettings, setSettings] = usePersistent<Settings>('settings', defaultSettings);
  const settings = useMemo(() => sanitize(rawSettings), [rawSettings]);
  const [muted, setMutedState] = usePersistent('muted', false);
  const [motion, setMotion] = usePersistent<Motion>('motion', 'auto');
  const [tab, setTab] = usePersistent<Tab>('tab', 'machine');
  const [activePreset, setActivePreset] = usePersistent<string | null>('preset', null);
  const lib = useLibrary();
  const prefersReduced = usePrefersReducedMotion();
  const reducedMotion = motion === 'calm' || (motion === 'auto' && prefersReduced);

  const [request, setRequest] = useState<SpinRequest | null>(null);
  const pendingRef = useRef<LastResult | null>(null);
  const [last, setLast] = useState<LastResult | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);
  const [noMatch, setNoMatch] = useState<Relaxation[] | null>(null);
  const [triple, setTriple] = useState<TripleFeature | null>(null);
  const [card, setCard] = useState<Cartoon | null>(null);
  const [announce, setAnnounce] = useState('');

  useEffect(() => setMuted(muted), [muted]);
  useEffect(() => {
    document.documentElement.classList.toggle('calm', reducedMotion);
  }, [reducedMotion]);

  const ctx = useMemo(() => ({ watched: lib.watchedSet }), [lib.watchedSet]);
  const pool = useMemo(() => applyFilters(CARTOONS, settings.filters, ctx), [settings.filters, ctx]);
  const directorCounts = useMemo(() => {
    const m: Record<string, number> = {};
    CARTOONS.forEach((c) => c.directors.forEach((d) => (m[d] = (m[d] ?? 0) + 1)));
    return m;
  }, []);

  // Idle preview of the wheel: a stable weighted sample for the current settings.
  const idleSlices = useMemo(() => {
    const rng = mulberry32(hashString(JSON.stringify(settings)));
    const ranked = rankPool(pool, settings);
    const out: Scored[] = [];
    const rest = ranked.slice();
    while (out.length < Math.min(WHEEL_SLOTS, ranked.length)) {
      const p = weightedPick(rest, rng)!;
      out.push(p);
      rest.splice(rest.indexOf(p), 1);
    }
    return shuffle(out, rng);
  }, [pool, settings]);

  const busy = request !== null;

  const updateSettings = useCallback(
    (s: Settings) => {
      setSettings(s);
      setActivePreset(null);
      setNoMatch(null);
    },
    [setSettings, setActivePreset],
  );

  const doSpin = useCallback(
    (s: Settings, opts: { exclude?: string[]; surpriseNote?: string } = {}) => {
      if (busy) return;
      setRevealOpen(false);
      setTriple(null);
      const result = runSpin(CARTOONS, s, ctx, Math.random, { exclude: opts.exclude });
      if (!result) {
        setNoMatch(diagnoseEmpty(CARTOONS, s.filters, ctx));
        setAnnounce('No cartoons match those constraints.');
        wahWah();
        return;
      }
      setNoMatch(null);
      const highlight = engagedSliders(s);
      pendingRef.current = {
        winner: result.winner,
        reasons: explain(result.winner.cartoon, s),
        poolSize: result.poolSize,
        surpriseNote: opts.surpriseNote,
        highlight,
      };
      setAnnounce('The wheel is spinning…');
      setRequest({ token: Date.now(), slices: result.shortlist, winnerIndex: result.winnerIndex });
    },
    [busy, ctx],
  );

  const onSpinDone = useCallback(() => {
    setRequest(null);
    const p = pendingRef.current;
    pendingRef.current = null;
    if (!p) return;
    setLast(p);
    setRevealOpen(true);
    lib.recordSpin(p.winner.cartoon.id);
    const c = p.winner.cartoon;
    setAnnounce(`Winner: ${c.title}. Volume ${c.vol}, disc ${c.disc}, cartoon number ${c.pos}.`);
    fanfare();
  }, [lib]);

  const spinAgain = () => doSpin(settings, { exclude: last ? [last.winner.cartoon.id] : [] });

  const surprise = () => {
    const s: Settings = { sliders: defaultSliders(), filters: settings.filters };
    const keys = shuffle([...MOOD_KEYS]).slice(0, 2 + Math.floor(Math.random() * 2));
    const parts: string[] = [];
    for (const k of keys) {
      const value = Math.random() < 0.5 ? Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 2);
      s.sliders[k] = { on: true, value };
      parts.push(`${MOOD_META[k].name} ${value}`);
    }
    setSettings(s);
    setActivePreset(null);
    doSpin(s, {
      exclude: last ? [last.winner.cartoon.id] : [],
      surpriseNote: `The machine reconfigured its own dials: ${parts.join(', ')}. (Your hard constraints were left alone.)`,
    });
  };

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)!;
    const s = p.build();
    s.filters.skipWatched = settings.filters.skipWatched;
    setSettings(s);
    setActivePreset(id);
    setNoMatch(null);
    boing();
  };

  const bookTriple = () => {
    const t = tripleFeature(CARTOONS, settings, ctx, Math.random);
    if (!t) {
      setNoMatch(diagnoseEmpty(CARTOONS, settings.filters, ctx));
      wahWah();
      return;
    }
    setTriple(t);
    fanfare();
  };

  const relax = (key: string) => {
    const f = { ...settings.filters };
    const d = defaultFilters();
    if (key === 'years') f.yearRangeOn = false;
    else if (key === 'watched') f.skipWatched = false;
    else (f as unknown as Record<string, unknown>)[key] = (d as unknown as Record<string, unknown>)[key];
    updateSettings({ ...settings, filters: f });
  };

  const openCard = (c: Cartoon) => setCard(c);

  return (
    <div className="app">
      <a href="#main" className="skip">
        Skip to the machine
      </a>
      <header className="marquee">
        <Bulbs count={26} />
        <div className="marquee-inner">
          <div className="marquee-deco left" aria-hidden="true">
            <Gear size={54} className="spin-slow" />
          </div>
          <div className="title-block">
            <p className="presents">ACME Amusement Devices, Inc. proudly presents</p>
            <h1>
              <span className="t-the">The</span> <span className="t-acme">ACME</span>{' '}
              <span className="t-main">Cartoon-O-Matic</span> <span className="t-num">4000</span>
            </h1>
            <p className="tagline">
              A ridiculously elaborate device for deciding which cartoon comes next · 236 shorts · 16 discs · 4 boxes · patent pending
            </p>
          </div>
          <div className="marquee-deco right" aria-hidden="true">
            <Gear size={42} teeth={8} className="spin-slow reverse" />
          </div>
        </div>
        <Bulbs count={26} />
      </header>

      <nav className="toolbar" aria-label="Main">
        <div className="tabs" role="tablist">
          {(
            [
              ['machine', 'The Machine'],
              ['catalog', 'Card Catalog'],
              ['tonight', `Tonight’s Bill${lib.state.watchlist.length ? ` (${lib.state.watchlist.length})` : ''}`],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>
        <div className="switches">
          <button className={`toggle ${muted ? '' : 'on'}`} role="switch" aria-checked={!muted} onClick={() => setMutedState(!muted)}>
            <span className="toggle-track">
              <span className="toggle-knob" />
            </span>
            Sound {muted ? 'off' : 'on'}
          </button>
          <button
            className="toggle on"
            onClick={() => setMotion(motion === 'auto' ? (prefersReduced ? 'full' : 'calm') : motion === 'calm' ? 'full' : 'calm')}
            title="Motion: full spin animation, or calm (reduced motion). Defaults to your system setting."
          >
            <span className="toggle-track">
              <span className="toggle-knob" style={{ transform: reducedMotion ? 'translateX(0)' : undefined }} />
            </span>
            Motion: {reducedMotion ? 'calm' : 'full'}
          </button>
        </div>
      </nav>

      <div className="sr-only" aria-live="assertive">
        {announce}
      </div>

      <main id="main">
        {tab === 'machine' && (
          <div className="machine">
            <section className="stage" aria-label="The selection wheel">
              <div className="stage-bg" aria-hidden="true">
                <Rings />
                <Sunburst />
              </div>
              <div className="hopper">
                <span className="hopper-n">{pool.length}</span>
                <span className="hopper-l">
                  cartoon{pool.length === 1 ? '' : 's'}
                  <br />
                  in the hopper
                </span>
              </div>
              <div className="deco-crate" aria-hidden="true">
                <Crate size={74} />
              </div>
              <Wheel
                idleSlices={idleSlices}
                request={request}
                reducedMotion={reducedMotion}
                onDone={onSpinDone}
                onHubClick={() => doSpin(settings)}
                busy={busy}
                poolSize={pool.length}
              />
              <p className="wheel-note">
                The wheel shows a shortlist of up to {WHEEL_SLOTS}; the winner is drawn from all {pool.length} eligible cartoons, weighted by
                mood match.
              </p>
              <div className="spin-controls">
                <button className="spin-button" onClick={() => doSpin(settings)} disabled={busy}>
                  <span className="spin-face">
                    <Bolt /> {busy ? 'Spinning…' : 'Spin the Wheel!'} <Bolt />
                  </span>
                </button>
                <div className="spin-secondary">
                  <button className="btn-big teal" onClick={surprise} disabled={busy}>
                    Surprise Me
                  </button>
                  <button className="btn-big gold" onClick={bookTriple} disabled={busy}>
                    Triple Feature
                  </button>
                </div>
              </div>

              {noMatch && (
                <div className="no-match" role="alert">
                  <Anvil size={64} />
                  <h3>Sufferin’ succotash! Nothing fits.</h3>
                  <p>
                    No cartoon passes every constraint at once. Loosen one of these — the number shows how many cartoons would qualify if
                    you lifted just that rule:
                  </p>
                  <ul>
                    {noMatch.map((r) => (
                      <li key={r.key}>
                        <button className="chip" onClick={() => relax(r.key)} disabled={r.wouldMatch === 0}>
                          Lift “{r.label}” → {r.wouldMatch} cartoon{r.wouldMatch === 1 ? '' : 's'}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {noMatch.every((r) => r.wouldMatch === 0) && <p>Several constraints conflict; try emptying the cabinet.</p>}
                </div>
              )}

              {last && !busy && (
                <div className="now-showing">
                  <p className="ns-kicker">Now showing</p>
                  <button className="ns-body" onClick={() => setRevealOpen(true)}>
                    <LocationStamp c={last.winner.cartoon} />
                    <span className="ns-title">{last.winner.cartoon.title}</span>
                    <span className="ns-meta">
                      {last.winner.cartoon.year} · {last.winner.cartoon.directors.join(' & ')} · tap for details
                    </span>
                  </button>
                </div>
              )}
            </section>

            <div className="console">
              <section className="panel presets" aria-labelledby="presets-h">
                <header className="panel-head">
                  <h2 id="presets-h">Special Modes</h2>
                  <p className="panel-sub">Each lever sets real dials and constraints — then spin.</p>
                </header>
                <div className="preset-grid">
                  {PRESETS.map((p) => (
                    <button key={p.id} className={`preset ${activePreset === p.id ? 'on' : ''}`} onClick={() => applyPreset(p.id)} aria-pressed={activePreset === p.id}>
                      <span className="preset-name">{p.name}</span>
                      <span className="preset-blurb">{p.blurb}</span>
                    </button>
                  ))}
                </div>
              </section>
              <MoodPanel
                sliders={settings.sliders}
                onChange={(k, s) => updateSettings({ ...settings, sliders: { ...settings.sliders, [k]: s } })}
                onReset={() => updateSettings({ ...settings, sliders: defaultSliders() })}
              />
              <FilterCabinet
                filters={settings.filters}
                onChange={(filters) => updateSettings({ ...settings, filters })}
                directorCounts={directorCounts}
                poolSize={pool.length}
              />
            </div>
          </div>
        )}

        {tab === 'catalog' && <Catalog settings={settings} lib={lib} onOpen={openCard} />}
        {tab === 'tonight' && <Tonight lib={lib} onOpen={openCard} />}
      </main>

      <footer className="footer">
        <p>
          A fan-made viewing companion for the <em>Looney Tunes Golden Collection</em> DVDs, Volumes 1–4 (Region 1). Not affiliated with
          Warner Bros. Disc locations researched from published track listings — see SOURCES.md. Mood dials are one editor’s opinion.
        </p>
        <p className="fine">No anvils were harmed. Several coyotes were.</p>
      </footer>

      {revealOpen && last && (
        <Reveal
          winner={last.winner}
          reasons={last.reasons}
          poolSize={last.poolSize}
          lib={lib}
          surpriseNote={last.surpriseNote}
          highlight={last.highlight}
          onClose={() => setRevealOpen(false)}
          onSpinAgain={spinAgain}
          onSurprise={surprise}
          onSimilar={() => {
            setRevealOpen(false);
            setCard(last.winner.cartoon);
          }}
        />
      )}
      {triple && <TripleBill t={triple} lib={lib} onClose={() => setTriple(null)} onAgain={bookTriple} onOpen={openCard} />}
      {card && (
        <CartoonCard
          key={card.id}
          c={card}
          lib={lib}
          onOpen={openCard}
          onClose={() => setCard(null)}
          matchPct={engagedSliders(settings).length ? Math.round(moodScore(card, settings) * 100) : undefined}
        />
      )}
    </div>
  );
}
