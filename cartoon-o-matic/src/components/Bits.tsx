import type { Cartoon } from '../data/types';
import { STAR_LABELS } from '../data/characters';
import type { Library } from '../lib/library';
import { boing } from '../lib/sound';

export function LocationStamp({ c, size = 'lg' }: { c: Cartoon; size?: 'lg' | 'sm' }) {
  if (size === 'sm') {
    return (
      <span className="loc-sm" aria-label={`Volume ${c.vol}, Disc ${c.disc}, Cartoon ${c.pos}`}>
        <b>V{c.vol}</b>
        <i>·</i>
        <b>D{c.disc}</b>
        <i>·</i>
        <b>#{c.pos}</b>
      </span>
    );
  }
  return (
    <div className="loc-stamp" aria-label={`Volume ${c.vol}, Disc ${c.disc}, Cartoon number ${c.pos}`}>
      <span>VOLUME {c.vol}</span>
      <span className="dot">·</span>
      <span>DISC {c.disc}</span>
      <span className="dot">·</span>
      <span>CARTOON #{c.pos}</span>
    </div>
  );
}

export function MetaLine({ c }: { c: Cartoon }) {
  return (
    <p className="meta-line">
      <span>{c.year}</span>
      <span>{c.directors.join(' & ')}</span>
      <span>
        <b className={c.color ? 'tag-color' : 'tag-bw'}>{c.color ? 'Color' : 'Black & white'}</b>
      </span>
      <span title={c.runtimeVerified ? 'Verified running time' : 'Era-typical estimate, not individually verified'}>
        ≈{c.runtime} min{c.runtimeVerified ? '' : ' (est.)'}
      </span>
    </p>
  );
}

export function StarChips({ c }: { c: Cartoon }) {
  if (c.stars.length === 0 && c.cast.length === 0) return null;
  return (
    <div className="star-chips">
      {c.stars.map((s) => (
        <span key={s} className="star-chip">
          {STAR_LABELS[s]}
        </span>
      ))}
      {c.cast.map((s) => (
        <span key={s} className={`cast-chip ${c.minorChars.includes(s) ? 'minor' : ''}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

export function Actions({ c, lib, compact = false }: { c: Cartoon; lib: Library; compact?: boolean }) {
  const inList = lib.state.watchlist.includes(c.id);
  const fav = lib.state.favorites.includes(c.id);
  const watched = lib.watchedSet.has(c.id);
  const click = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    boing();
    fn();
  };
  return (
    <div className={`actions ${compact ? 'compact' : ''}`}>
      <button className={`act ${inList ? 'on' : ''}`} aria-pressed={inList} onClick={click(() => lib.toggleWatchlist(c.id))}>
        {inList ? '✓ On tonight’s bill' : '+ Tonight’s bill'}
      </button>
      <button className={`act ${watched ? 'on' : ''}`} aria-pressed={watched} onClick={click(() => (watched ? lib.unmarkWatched(c.id) : lib.markWatched(c.id)))}>
        {watched ? '✓ Watched' : 'Mark watched'}
      </button>
      <button className={`act heart ${fav ? 'on' : ''}`} aria-pressed={fav} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} onClick={click(() => lib.toggleFavorite(c.id))}>
        {fav ? '♥' : '♡'}
        {compact ? '' : fav ? ' Favorite' : ' Favorite'}
      </button>
    </div>
  );
}

export function ConfidenceNote({ c }: { c: Cartoon }) {
  if (c.confidence === 'high') return null;
  return (
    <p className="confidence">
      {c.confidence === 'low'
        ? 'Mood ratings for this short are a first draft (rated from synopsis and reputation) — treat them as approximate.'
        : 'Mood ratings: medium confidence.'}
    </p>
  );
}
