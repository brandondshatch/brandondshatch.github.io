import { useDeferredValue, useMemo } from 'react';
import { CARTOONS } from '../data';
import type { Cartoon } from '../data/types';
import { STAR_LABELS } from '../data/characters';
import { engagedSliders, moodScore, passesFilters, type Settings } from '../lib/engine';
import type { Library } from '../lib/library';
import { buildIndex, search } from '../lib/search';
import { usePersistent } from '../lib/storage';
import { Actions, LocationStamp } from './Bits';

type SortKey = 'relevance' | 'title' | 'year' | 'location' | 'mood';

const INDEX = buildIndex(CARTOONS);
const sortTitle = (t: string) => t.replace(/^(the|a|an)\s+/i, '');

interface Props {
  settings: Settings;
  lib: Library;
  onOpen: (c: Cartoon) => void;
}

export function Catalog({ settings, lib, onOpen }: Props) {
  const [query, setQuery] = usePersistent('catalog-query', '');
  const [sort, setSort] = usePersistent<SortKey>('catalog-sort', 'location');
  const [useFilters, setUseFilters] = usePersistent('catalog-use-filters', false);
  const [minMatch, setMinMatch] = usePersistent('catalog-min-match', 0);
  const deferred = useDeferredValue(query);
  const engaged = engagedSliders(settings).length;

  const results = useMemo(() => {
    let hits = search(INDEX, deferred).map((h) => ({ ...h, score: moodScore(h.cartoon, settings) }));
    if (useFilters) hits = hits.filter((h) => passesFilters(h.cartoon, settings.filters, { watched: lib.watchedSet }));
    if (engaged && minMatch > 0) hits = hits.filter((h) => h.score * 100 >= minMatch);
    const loc = (c: Cartoon) => c.vol * 1000 + c.disc * 100 + c.pos;
    const by: Record<SortKey, (a: (typeof hits)[number], b: (typeof hits)[number]) => number> = {
      relevance: (a, b) => b.relevance - a.relevance || loc(a.cartoon) - loc(b.cartoon),
      title: (a, b) => sortTitle(a.cartoon.title).localeCompare(sortTitle(b.cartoon.title)),
      year: (a, b) => a.cartoon.year - b.cartoon.year || loc(a.cartoon) - loc(b.cartoon),
      location: (a, b) => loc(a.cartoon) - loc(b.cartoon),
      mood: (a, b) => b.score - a.score || loc(a.cartoon) - loc(b.cartoon),
    };
    const key: SortKey = sort === 'relevance' && !deferred.trim() ? 'location' : sort;
    return hits.sort(by[key]);
  }, [deferred, settings, useFilters, minMatch, engaged, sort, lib.watchedSet]);

  let lastDisc = '';
  return (
    <section className="catalog panel" aria-labelledby="cat-h">
      <header className="panel-head">
        <h2 id="cat-h">The Card Catalog</h2>
        <p className="panel-sub">
          All 236 shorts, searchable by title, character, director, year, theme or description. Plain keyword matching, forgiving of
          typos—no mind-reading.
        </p>
      </header>
      <div className="search-bar">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “Duck Amuck”, “1940s black-and-white Porky”, “Chuck Jones surreal”, “v3 d2”…"
          aria-label="Search the catalog"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className="btn-small" onClick={() => setQuery('')}>
            Clear
          </button>
        )}
      </div>
      <div className="catalog-controls">
        <label>
          Sort by{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="relevance">Best search match</option>
            <option value="location">Volume / disc / position</option>
            <option value="title">Title</option>
            <option value="year">Year</option>
            <option value="mood">Best mood match</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={useFilters} onChange={(e) => setUseFilters(e.target.checked)} />
          Apply the Cabinet’s hard constraints
        </label>
        <label className={engaged ? '' : 'disabled'} title={engaged ? '' : 'Engage a mood dial on the Machine tab first'}>
          Mood match at least{' '}
          <select value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))} disabled={!engaged}>
            <option value={0}>any</option>
            <option value={60}>60%</option>
            <option value={75}>75%</option>
            <option value={90}>90%</option>
          </select>
        </label>
        <span className="result-count" aria-live="polite">
          {results.length} cartoon{results.length === 1 ? '' : 's'}
        </span>
      </div>
      {results.length === 0 && <p className="empty">No cartoons match that. Try fewer words, or untick the hard constraints.</p>}
      <ul className="stubs">
        {results.map(({ cartoon: c, score }) => {
          const discHead = sort === 'location' ? `${c.vol}-${c.disc}` : '';
          const showHead = discHead && discHead !== lastDisc;
          lastDisc = discHead || lastDisc;
          return (
            <li key={c.id} className="stub-li">
              {showHead && (
                <h3 className="disc-head">
                  Volume {c.vol} · Disc {c.disc} <em>{c.discName}</em>
                </h3>
              )}
              <div className={`stub ${lib.watchedSet.has(c.id) ? 'watched' : ''}`} role="button" tabIndex={0} onClick={() => onOpen(c)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(c))}>
                <LocationStamp c={c} size="sm" />
                <div className="stub-main">
                  <span className="stub-title">{c.title}</span>
                  <span className="stub-meta">
                    {c.year} · {c.directors.join(' & ')}
                    {!c.color && <span className="tag-bw">B&amp;W</span>}
                    {c.stars.length > 0 && <> · {c.stars.map((s) => STAR_LABELS[s]).join(', ')}</>}
                  </span>
                </div>
                {engaged > 0 && <span className="stub-match">{Math.round(score * 100)}%</span>}
                <Actions c={c} lib={lib} compact />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
