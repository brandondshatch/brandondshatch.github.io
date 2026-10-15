import { BY_ID } from '../data';
import type { Cartoon } from '../data/types';
import type { Library } from '../lib/library';
import { Actions, LocationStamp } from './Bits';

function Row({ c, lib, onOpen, extra }: { c: Cartoon; lib: Library; onOpen: (c: Cartoon) => void; extra?: React.ReactNode }) {
  return (
    <li className="stub" role="button" tabIndex={0} onClick={() => onOpen(c)} onKeyDown={(e) => e.key === 'Enter' && onOpen(c)}>
      <LocationStamp c={c} size="sm" />
      <div className="stub-main">
        <span className="stub-title">{c.title}</span>
        <span className="stub-meta">
          {c.year} · {c.directors.join(' & ')} · ≈{c.runtime} min
          {extra}
        </span>
      </div>
      <Actions c={c} lib={lib} compact />
    </li>
  );
}

export function Tonight({ lib, onOpen }: { lib: Library; onOpen: (c: Cartoon) => void }) {
  const list = lib.state.watchlist.map((id) => BY_ID.get(id)).filter(Boolean) as Cartoon[];
  const favs = lib.state.favorites.map((id) => BY_ID.get(id)).filter(Boolean) as Cartoon[];
  const watched = Object.entries(lib.state.watched)
    .map(([id, times]) => ({ c: BY_ID.get(id), last: times[times.length - 1], n: times.length }))
    .filter((x) => x.c)
    .sort((a, b) => b.last - a.last) as { c: Cartoon; last: number; n: number }[];
  const spins = lib.state.spins.map((s) => ({ c: BY_ID.get(s.id), at: s.at })).filter((x) => x.c) as { c: Cartoon; at: number }[];
  const minutes = list.reduce((t, c) => t + c.runtime, 0);
  let swaps = 0;
  for (let i = 1; i < list.length; i++) if (list[i].vol !== list[i - 1].vol || list[i].disc !== list[i - 1].disc) swaps++;

  return (
    <div className="tonight">
      <section className="panel" aria-labelledby="bill-h">
        <header className="panel-head">
          <h2 id="bill-h">Tonight’s Bill</h2>
          <p className="panel-sub">
            {list.length === 0
              ? 'Nothing booked yet. Add cartoons from the wheel or the catalog.'
              : `${list.length} cartoon${list.length > 1 ? 's' : ''} · about ${minutes} minutes · ${swaps} disc swap${swaps === 1 ? '' : 's'} in this order`}
          </p>
          {list.length > 1 && (
            <button
              className="btn-small"
              onClick={() => lib.setWatchlist([...list].sort((a, b) => a.vol - b.vol || a.disc - b.disc || a.pos - b.pos).map((c) => c.id))}
            >
              Reorder by disc (fewest swaps)
            </button>
          )}
          {list.length > 0 && (
            <button className="btn-small" onClick={() => lib.setWatchlist([])}>
              Clear the bill
            </button>
          )}
        </header>
        <ol className="stubs numbered">
          {list.map((c, i) => (
            <Row
              key={c.id}
              c={c}
              lib={lib}
              onOpen={onOpen}
              extra={
                i > 0 && (list[i - 1].vol !== c.vol || list[i - 1].disc !== c.disc) ? <span className="swap"> · swap disc</span> : null
              }
            />
          ))}
        </ol>
      </section>

      <section className="panel" aria-labelledby="fav-h">
        <header className="panel-head">
          <h2 id="fav-h">Favorites</h2>
          {favs.length === 0 && <p className="panel-sub">Tap ♡ on any cartoon to keep it here.</p>}
        </header>
        <ul className="stubs">
          {favs.map((c) => (
            <Row key={c.id} c={c} lib={lib} onOpen={onOpen} />
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="hist-h">
        <header className="panel-head">
          <h2 id="hist-h">Recently Watched</h2>
          {watched.length === 0 && <p className="panel-sub">Mark cartoons as watched and they’ll be logged here.</p>}
          {(watched.length > 0 || spins.length > 0) && (
            <button className="btn-small" onClick={() => confirm('Clear watched history and spin log?') && lib.clearHistory()}>
              Clear history
            </button>
          )}
        </header>
        <ul className="stubs">
          {watched.map(({ c, last, n }) => (
            <Row key={c.id} c={c} lib={lib} onOpen={onOpen} extra={<span> · {n > 1 ? `${n}× · ` : ''}{new Date(last).toLocaleString()}</span>} />
          ))}
        </ul>
        {spins.length > 0 && (
          <>
            <h3 className="sub-h">The Machine’s recent picks</h3>
            <ul className="spin-log">
              {spins.slice(0, 15).map(({ c, at }, i) => (
                <li key={i}>
                  <button onClick={() => onOpen(c)}>
                    <LocationStamp c={c} size="sm" /> {c.title} <time>{new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
