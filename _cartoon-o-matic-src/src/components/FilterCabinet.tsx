import type { ReactNode } from 'react';
import { DISCS } from '../data';
import { STAR_KEYS, STAR_LABELS, DIRECTOR_ORDER } from '../data/characters';
import type { ThemeKey, Volume } from '../data/types';
import {
  allDiscKeysOfVolume,
  defaultFilters,
  discKey,
  PREDICATES,
  THEME_LABELS,
  YEAR_MAX,
  YEAR_MIN,
  type CharFilterKey,
  type Decade,
  type Filters,
} from '../lib/engine';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  directorCounts: Record<string, number>;
  poolSize: number;
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Chip({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Drawer({ title, count, children, hint }: { title: string; count: number; children: ReactNode; hint?: string }) {
  return (
    <details className="drawer">
      <summary>
        <span className="drawer-title">{title}</span>
        {count > 0 && <span className="drawer-count">{count}</span>}
        {hint && <span className="drawer-hint">{hint}</span>}
        <span className="drawer-handle" aria-hidden="true" />
      </summary>
      <div className="drawer-body">{children}</div>
    </details>
  );
}

const DECADES: Decade[] = [1930, 1940, 1950, 1960];
const THEMES = Object.keys(THEME_LABELS) as ThemeKey[];

export function FilterCabinet({ filters: f, onChange, directorCounts, poolSize }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  const activeCount = Object.values(PREDICATES).filter((p) => p.active(f)).length;
  const directors = DIRECTOR_ORDER.filter((d) => directorCounts[d]);

  return (
    <section className="panel cabinet" aria-labelledby="cab-h">
      <header className="panel-head">
        <h2 id="cab-h">The Hard Constraints Cabinet</h2>
        <p className="panel-sub">
          Strict rules. A cartoon that breaks one never reaches the wheel.{' '}
          <strong>
            {poolSize} of 236 cartoons in the hopper{activeCount ? ` · ${activeCount} constraint${activeCount > 1 ? 's' : ''} active` : ''}.
          </strong>
        </p>
        {activeCount > 0 && (
          <button className="btn-small" onClick={() => onChange(defaultFilters())}>
            Empty the cabinet
          </button>
        )}
      </header>

      <Drawer title="Presentation" count={f.color !== 'any' ? 1 : 0} hint={f.color === 'bw' ? 'black & white' : f.color === 'color' ? 'color' : ''}>
        <Segmented
          label="Presentation"
          value={f.color}
          onChange={(color) => set({ color })}
          options={[
            { value: 'any', label: 'Either' },
            { value: 'color', label: 'Glorious Color' },
            { value: 'bw', label: 'Black & White' },
          ]}
        />
      </Drawer>

      <Drawer title="Era" count={(f.decades.length ? 1 : 0) + (f.yearRangeOn ? 1 : 0)}>
        <div className="chips">
          <Chip on={f.decades.length === 0} onClick={() => set({ decades: [] })}>
            Any era
          </Chip>
          {DECADES.map((d) => (
            <Chip key={d} on={f.decades.includes(d)} onClick={() => set({ decades: toggle(f.decades, d) })}>
              {d}s
            </Chip>
          ))}
        </div>
        <div className="year-range">
          <label className="check">
            <input type="checkbox" checked={f.yearRangeOn} onChange={(e) => set({ yearRangeOn: e.target.checked })} />
            Precise years
          </label>
          <label>
            from{' '}
            <input
              type="number"
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={f.yearMin}
              onChange={(e) => set({ yearRangeOn: true, yearMin: Math.min(Number(e.target.value), f.yearMax) })}
            />
          </label>
          <label>
            to{' '}
            <input
              type="number"
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={f.yearMax}
              onChange={(e) => set({ yearRangeOn: true, yearMax: Math.max(Number(e.target.value), f.yearMin) })}
            />
          </label>
        </div>
      </Drawer>

      <Drawer title="Characters" count={f.characters.length}>
        <div className="chips">
          {STAR_KEYS.map((k) => (
            <Chip key={k} on={f.characters.includes(k)} onClick={() => set({ characters: toggle<CharFilterKey>(f.characters, k) })}>
              {STAR_LABELS[k]}
            </Chip>
          ))}
          <Chip
            on={f.characters.includes('minor')}
            onClick={() => set({ characters: toggle<CharFilterKey>(f.characters, 'minor') })}
            title="Hubie & Bertie, Gossamer, Marc Antony, Ralph & Sam, Witch Hazel, Henery Hawk, Charlie Dog…"
          >
            Minor &amp; obscure regulars
          </Chip>
          <Chip
            on={f.characters.includes('oneoff')}
            onClick={() => set({ characters: toggle<CharFilterKey>(f.characters, 'oneoff') })}
            title="None of the fourteen headline stars appear"
          >
            No recurring stars
          </Chip>
        </div>
        <div className="mode-row">
          <span>When several are picked:</span>
          <Segmented
            label="Character matching"
            value={f.charMode}
            onChange={(charMode) => set({ charMode })}
            options={[
              { value: 'any', label: 'Any of them' },
              { value: 'all', label: 'All together' },
            ]}
          />
        </div>
        <p className="fine">
          “Any” finds cartoons featuring at least one pick; “All together” requires every pick in the same cartoon.
        </p>
      </Drawer>

      <Drawer title="Director" count={f.directors.length}>
        <div className="chips">
          {directors.map((d) => (
            <Chip key={d} on={f.directors.includes(d)} onClick={() => set({ directors: toggle(f.directors, d) })}>
              {d} <span className="chip-n">{directorCounts[d]}</span>
            </Chip>
          ))}
        </div>
        <p className="fine">Matches cartoons credited (or co-credited) to any selected director.</p>
      </Drawer>

      <Drawer title="Themes & Genres" count={f.themes.length}>
        <div className="chips">
          {THEMES.map((t) => (
            <Chip key={t} on={f.themes.includes(t)} onClick={() => set({ themes: toggle(f.themes, t) })}>
              {THEME_LABELS[t]}
            </Chip>
          ))}
        </div>
        <div className="mode-row">
          <span>When several are picked:</span>
          <Segmented
            label="Theme matching"
            value={f.themeMode}
            onChange={(themeMode) => set({ themeMode })}
            options={[
              { value: 'any', label: 'Any of them' },
              { value: 'all', label: 'All together' },
            ]}
          />
        </div>
      </Drawer>

      <Drawer title="Physical Collection" count={f.discs.length ? 1 : 0} hint={f.discs.length ? `${f.discs.length} of 16 discs` : 'all four volumes'}>
        <div className="shelf">
          {([1, 2, 3, 4] as Volume[]).map((v) => {
            const keys = allDiscKeysOfVolume(v);
            const allOn = f.discs.length === 0 || keys.every((k) => f.discs.includes(k));
            const someOn = keys.some((k) => f.discs.includes(k));
            return (
              <div key={v} className={`dvd-box ${allOn ? 'on' : someOn ? 'partial' : ''}`}>
                <button
                  className="dvd-spine"
                  aria-pressed={f.discs.length > 0 && keys.every((k) => f.discs.includes(k))}
                  onClick={() => {
                    const current = f.discs;
                    const hasAll = keys.every((k) => current.includes(k));
                    set({ discs: hasAll ? current.filter((k) => !keys.includes(k)) : [...new Set([...current, ...keys])] });
                  }}
                >
                  <span className="spine-small">Golden Collection</span>
                  <span className="spine-vol">Vol. {v}</span>
                </button>
                <div className="disc-row">
                  {[1, 2, 3, 4].map((d) => {
                    const k = discKey(v, d);
                    const on = f.discs.includes(k);
                    const name = DISCS.find((x) => x.vol === v && x.disc === d)?.name;
                    return (
                      <button
                        key={k}
                        className={`disc-btn ${on ? 'on' : ''}`}
                        aria-pressed={on}
                        title={`Volume ${v}, Disc ${d}: ${name}`}
                        aria-label={`Volume ${v}, Disc ${d}: ${name}`}
                        onClick={() => set({ discs: toggle(f.discs, k) })}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="fine">
          Nothing selected = all sixteen discs. Tap a box to select a whole volume, or individual discs to stay on whatever is already in
          the player.
        </p>
      </Drawer>

      <Drawer title="Fame & History" count={(f.fame !== 'any' ? 1 : 0) + (f.skipWatched ? 1 : 0)}>
        <Segmented
          label="Fame"
          value={f.fame}
          onChange={(fame) => set({ fame })}
          options={[
            { value: 'any', label: 'Famous or forgotten' },
            { value: 'classics', label: 'Household classics' },
            { value: 'deep', label: 'Deep cuts' },
          ]}
        />
        <label className="check">
          <input type="checkbox" checked={f.skipWatched} onChange={(e) => set({ skipWatched: e.target.checked })} />
          Skip cartoons already marked as watched
        </label>
      </Drawer>
    </section>
  );
}
