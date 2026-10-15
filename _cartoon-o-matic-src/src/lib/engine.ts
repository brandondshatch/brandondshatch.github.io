// ===========================================================================
//  THE SELECTION ENGINE
//
//  1. Hard filters decide who is eligible (presentation, era, characters,
//     directors, themes, physical discs, fame, watched status).
//  2. Engaged mood sliders give every eligible cartoon a match score 0–1.
//  3. A weighted random draw favors strong matches but keeps surprises:
//         weight = exp(SHARPNESS × (score − 1))
//     score 1.0 → 1.00, 0.9 → 0.30, 0.8 → 0.09, 0.6 → 0.008 (relative odds).
//     With no sliders engaged every eligible cartoon weighs exactly 1, i.e.
//     a uniform draw.
//  4. The wheel shows a shortlist that always contains the winner; the
//     winner itself is drawn from the WHOLE eligible pool, not the shortlist.
// ===========================================================================

import type { Cartoon, MoodKey, StarKey, ThemeKey, Volume } from '../data/types';
import { MOOD_KEYS } from '../data/types';
import { STAR_LABELS } from '../data/characters';
import type { Rng } from './util';

export type ColorMode = 'any' | 'color' | 'bw';
export type FameMode = 'any' | 'classics' | 'deep';
export type CharFilterKey = StarKey | 'minor' | 'oneoff';
export type Decade = 1930 | 1940 | 1950 | 1960;

export interface SliderState {
  on: boolean;
  value: number; // 0–5
}

export interface Filters {
  color: ColorMode;
  decades: Decade[];
  yearRangeOn: boolean;
  yearMin: number;
  yearMax: number;
  characters: CharFilterKey[];
  charMode: 'any' | 'all';
  directors: string[];
  themes: ThemeKey[];
  themeMode: 'any' | 'all';
  /** Allowed discs as "vol-disc" keys; empty = all sixteen. */
  discs: string[];
  fame: FameMode;
  skipWatched: boolean;
}

export interface Settings {
  sliders: Record<MoodKey, SliderState>;
  filters: Filters;
}

export const YEAR_MIN = 1935;
export const YEAR_MAX = 1966;
export const SHARPNESS = 12;

export function defaultSliders(): Record<MoodKey, SliderState> {
  return Object.fromEntries(MOOD_KEYS.map((k) => [k, { on: false, value: 3 }])) as Record<
    MoodKey,
    SliderState
  >;
}

export function defaultFilters(): Filters {
  return {
    color: 'any',
    decades: [],
    yearRangeOn: false,
    yearMin: YEAR_MIN,
    yearMax: YEAR_MAX,
    characters: [],
    charMode: 'any',
    directors: [],
    themes: [],
    themeMode: 'any',
    discs: [],
    fame: 'any',
    skipWatched: false,
  };
}

export function defaultSettings(): Settings {
  return { sliders: defaultSliders(), filters: defaultFilters() };
}

export const discKey = (vol: number, disc: number) => `${vol}-${disc}`;
export const allDiscKeysOfVolume = (vol: Volume) => [1, 2, 3, 4].map((d) => discKey(vol, d));

// ─── individual hard-filter predicates (named so we can diagnose misses) ───

export interface FilterContext {
  watched: Set<string>;
}

type Predicate = (c: Cartoon, f: Filters, ctx: FilterContext) => boolean;

export function matchesCharacters(c: Cartoon, f: Filters): boolean {
  if (f.characters.length === 0) return true;
  const test = (k: CharFilterKey) => {
    if (k === 'minor') return c.minorChars.length > 0;
    if (k === 'oneoff') return c.stars.length === 0;
    return c.stars.includes(k);
  };
  return f.charMode === 'all' ? f.characters.every(test) : f.characters.some(test);
}

export const PREDICATES: Record<string, { label: string; test: Predicate; active: (f: Filters) => boolean }> = {
  color: {
    label: 'Presentation',
    active: (f) => f.color !== 'any',
    test: (c, f) => f.color === 'any' || (f.color === 'color' ? c.color : !c.color),
  },
  decades: {
    label: 'Era',
    active: (f) => f.decades.length > 0,
    test: (c, f) => f.decades.length === 0 || f.decades.includes((Math.floor(c.year / 10) * 10) as Decade),
  },
  years: {
    label: 'Year range',
    active: (f) => f.yearRangeOn,
    test: (c, f) => !f.yearRangeOn || (c.year >= f.yearMin && c.year <= f.yearMax),
  },
  characters: {
    label: 'Characters',
    active: (f) => f.characters.length > 0,
    test: (c, f) => matchesCharacters(c, f),
  },
  directors: {
    label: 'Director',
    active: (f) => f.directors.length > 0,
    test: (c, f) => f.directors.length === 0 || c.directors.some((d) => f.directors.includes(d)),
  },
  themes: {
    label: 'Themes',
    active: (f) => f.themes.length > 0,
    test: (c, f) =>
      f.themes.length === 0 ||
      (f.themeMode === 'all'
        ? f.themes.every((t) => c.themes.includes(t))
        : f.themes.some((t) => c.themes.includes(t))),
  },
  discs: {
    label: 'Volumes & discs',
    active: (f) => f.discs.length > 0,
    test: (c, f) => f.discs.length === 0 || f.discs.includes(discKey(c.vol, c.disc)),
  },
  fame: {
    label: 'Fame',
    active: (f) => f.fame !== 'any',
    test: (c, f) => f.fame === 'any' || (f.fame === 'classics' ? c.fame >= 4 : c.fame <= 1),
  },
  watched: {
    label: 'Skip watched',
    active: (f) => f.skipWatched,
    test: (c, f, ctx) => !f.skipWatched || !ctx.watched.has(c.id),
  },
};

export function passesFilters(c: Cartoon, f: Filters, ctx: FilterContext, skip?: string): boolean {
  for (const [key, p] of Object.entries(PREDICATES)) {
    if (key === skip) continue;
    if (!p.test(c, f, ctx)) return false;
  }
  return true;
}

export function applyFilters(all: Cartoon[], f: Filters, ctx: FilterContext): Cartoon[] {
  return all.filter((c) => passesFilters(c, f, ctx));
}

// ─── mood scoring ───

export function engagedSliders(s: Settings): MoodKey[] {
  return MOOD_KEYS.filter((k) => s.sliders[k].on);
}

/** 0–1. Mean closeness across engaged sliders; 1 when none are engaged. */
export function moodScore(c: Cartoon, s: Settings): number {
  const keys = engagedSliders(s);
  if (keys.length === 0) return 1;
  let total = 0;
  for (const k of keys) total += 1 - Math.abs(c.mood[k] - s.sliders[k].value) / 5;
  return total / keys.length;
}

export function weightFor(score: number): number {
  return Math.exp(SHARPNESS * (score - 1));
}

export interface Scored {
  cartoon: Cartoon;
  score: number;
  weight: number;
}

export function rankPool(pool: Cartoon[], s: Settings): Scored[] {
  return pool
    .map((cartoon) => {
      const score = moodScore(cartoon, s);
      return { cartoon, score, weight: weightFor(score) };
    })
    .sort((a, b) => b.score - a.score || a.cartoon.vol - b.cartoon.vol || a.cartoon.disc - b.cartoon.disc || a.cartoon.pos - b.cartoon.pos);
}

export function weightedPick<T extends { weight: number }>(items: T[], rng: Rng): T | undefined {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  if (items.length === 0 || total <= 0) return undefined;
  let r = rng() * total;
  for (const i of items) {
    r -= i.weight;
    if (r <= 0) return i;
  }
  return items[items.length - 1];
}

export interface SpinResult {
  winner: Scored;
  shortlist: Scored[]; // in wheel order; contains winner
  winnerIndex: number;
  poolSize: number;
}

export const WHEEL_SLOTS = 12;

/**
 * Picks the winner from the full eligible pool, then builds the visual
 * shortlist: more weighted draws (without replacement) to fill the wheel,
 * shuffled, with the winner dropped into a random slot.
 */
export function spin(
  all: Cartoon[],
  s: Settings,
  ctx: FilterContext,
  rng: Rng,
  opts: { exclude?: string[] } = {},
): SpinResult | null {
  let pool = applyFilters(all, s.filters, ctx);
  if (opts.exclude?.length) {
    // "Spin again" avoids repeats, unless that would leave nothing at all.
    const fresh = pool.filter((c) => !opts.exclude!.includes(c.id));
    if (fresh.length) pool = fresh;
  }
  if (pool.length === 0) return null;
  const ranked = rankPool(pool, s);
  const winner = weightedPick(ranked, rng)!;

  const others: Scored[] = [];
  const remaining = ranked.filter((r) => r !== winner);
  const slots = Math.min(WHEEL_SLOTS, ranked.length) - 1;
  while (others.length < slots && remaining.length) {
    const pick = weightedPick(remaining, rng)!;
    others.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  // Fisher–Yates for the decoys, then insert winner at random slot.
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const winnerIndex = Math.floor(rng() * (others.length + 1));
  const shortlist = [...others.slice(0, winnerIndex), winner, ...others.slice(winnerIndex)];
  return { winner, shortlist, winnerIndex, poolSize: pool.length };
}

// ─── explanations ───

export const MOOD_META: Record<MoodKey, { name: string; low: string; high: string }> = {
  violence: { name: 'Cartoon Violence', low: 'Mild slapstick', high: 'Unregulated anvil warfare' },
  incorrect: { name: 'Political Incorrectness', low: 'Relatively tame', high: 'A museum of questionable historical attitudes' },
  whimsy: { name: 'Whimsy', low: 'Grounded cartoon logic', high: 'Complete surrealist madness' },
  chaos: { name: 'Chaos', low: 'Relaxed pacing', high: 'Total pandemonium' },
  clever: { name: 'Cleverness', low: 'Physical gags', high: 'Ingenious verbal and conceptual comedy' },
  music: { name: 'Musicality', low: 'Minimal music', high: 'Symphonic lunacy' },
  spooky: { name: 'Spookiness', low: 'Cheerful nonsense', high: 'Gothic cartoon nightmare' },
  talk: { name: 'Dialogue', low: 'Almost wordless', high: 'Everybody’s a wise guy' },
  sweet: { name: 'Sentimentality', low: 'Cynical and abrasive', high: 'Unexpectedly sweet' },
  weird: { name: 'Experimental Weirdness', low: 'Traditional cartoon', high: 'What on earth did I just watch?' },
};

const BULLSEYE = [
  'dead on the money',
  'a perfect bullseye',
  'calibrated to the decimal',
  'exactly as ordered',
];
const CLOSE = ['close enough for cartoon work', 'within a whisker', 'near as makes no difference'];
const OFF = ['a bit of a stretch, admittedly', 'the machine took liberties', 'not quite—call it a wildcard'];

export interface Reason {
  text: string;
  tone: 'hit' | 'near' | 'miss' | 'filter';
}

export function explain(c: Cartoon, s: Settings, rng: Rng = Math.random): Reason[] {
  const reasons: Reason[] = [];
  const pick = (arr: string[]) => arr[Math.floor(rng() * arr.length)];
  const keys = engagedSliders(s)
    .map((k) => ({ k, diff: Math.abs(c.mood[k] - s.sliders[k].value) }))
    .sort((a, b) => a.diff - b.diff);
  for (const { k, diff } of keys.slice(0, 4)) {
    const meta = MOOD_META[k];
    const want = s.sliders[k].value;
    const end = want >= 3 ? meta.high : meta.low;
    const verdict = diff === 0 ? pick(BULLSEYE) : diff === 1 ? pick(CLOSE) : pick(OFF);
    reasons.push({
      text: `${meta.name}: you dialed ${want}/5 (“${end}”), it rates ${c.mood[k]}/5 — ${verdict}.`,
      tone: diff === 0 ? 'hit' : diff === 1 ? 'near' : 'miss',
    });
  }
  const f = s.filters;
  if (f.characters.length) {
    const hits = f.characters
      .filter((k) => k !== 'minor' && k !== 'oneoff' && c.stars.includes(k as StarKey))
      .map((k) => STAR_LABELS[k as StarKey]);
    if (hits.length) reasons.push({ text: `Features ${hits.join(' & ')}, as requested.`, tone: 'filter' });
    if (f.characters.includes('minor') && c.minorChars.length)
      reasons.push({ text: `Minor-league talent on the bill: ${c.minorChars.join(', ')}.`, tone: 'filter' });
    if (f.characters.includes('oneoff') && c.stars.length === 0)
      reasons.push({ text: 'No recurring headliners—strictly one-off players.', tone: 'filter' });
  }
  if (f.directors.length) {
    const d = c.directors.filter((x) => f.directors.includes(x));
    if (d.length) reasons.push({ text: `Directed by ${d.join(' & ')}.`, tone: 'filter' });
  }
  if (f.themes.length) {
    const t = c.themes.filter((x) => f.themes.includes(x));
    if (t.length) reasons.push({ text: `Theme match: ${t.map((x) => THEME_LABELS[x]).join(', ')}.`, tone: 'filter' });
  }
  if (f.color === 'bw') reasons.push({ text: 'Genuine black-and-white, as ordered.', tone: 'filter' });
  if (f.color === 'color') reasons.push({ text: 'In glorious color.', tone: 'filter' });
  if (f.fame === 'deep' && c.fame <= 1) reasons.push({ text: 'An honest-to-goodness deep cut.', tone: 'filter' });
  if (f.fame === 'classics' && c.fame >= 4) reasons.push({ text: 'A certified household classic.', tone: 'filter' });
  if (reasons.length === 0) {
    reasons.push({
      text: 'No dials engaged, no constraints set: the machine simply followed its heart (a uniform random draw across the eligible pool).',
      tone: 'filter',
    });
  }
  return reasons;
}

export const THEME_LABELS: Record<ThemeKey, string> = {
  scifi: 'Science fiction',
  horror: 'Horror & monsters',
  western: 'Westerns',
  fairytale: 'Fairy tales & legends',
  music: 'Music & opera',
  hollywood: 'Hollywood satire',
  sports: 'Sports',
  wartime: 'Wartime',
  meta: 'Meta / fourth wall',
  surreal: 'Surrealism',
  chase: 'Chases',
  rivalry: 'Rivalry & trickery',
  holiday: 'Holiday & seasonal',
};

// ─── when nothing matches ───

export interface Relaxation {
  key: string;
  label: string;
  wouldMatch: number;
}

/** For each active hard filter: how many cartoons qualify if only it is lifted. */
export function diagnoseEmpty(all: Cartoon[], f: Filters, ctx: FilterContext): Relaxation[] {
  return Object.entries(PREDICATES)
    .filter(([, p]) => p.active(f))
    .map(([key, p]) => ({
      key,
      label: p.label,
      wouldMatch: all.filter((c) => passesFilters(c, f, ctx, key)).length,
    }))
    .sort((a, b) => b.wouldMatch - a.wouldMatch);
}

// ─── similarity ───

export function moodDistance(a: Cartoon, b: Cartoon): number {
  let d = 0;
  for (const k of MOOD_KEYS) d += (a.mood[k] - b.mood[k]) ** 2;
  return Math.sqrt(d);
}

export function similar(target: Cartoon, all: Cartoon[], n = 8): { cartoon: Cartoon; similarity: number }[] {
  const maxDist = Math.sqrt(MOOD_KEYS.length * 25);
  return all
    .filter((c) => c.id !== target.id)
    .map((c) => {
      let sim = 1 - moodDistance(target, c) / maxDist; // 0–1
      const sharedStars = c.stars.filter((x) => target.stars.includes(x)).length;
      const sharedThemes = c.themes.filter((x) => target.themes.includes(x)).length;
      const sharedDir = c.directors.some((x) => target.directors.includes(x));
      sim += 0.03 * Math.min(sharedStars, 2) + 0.025 * Math.min(sharedThemes, 2) + (sharedDir ? 0.03 : 0);
      return { cartoon: c, similarity: Math.min(1, sim) };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, n);
}

// ─── triple feature ───

export interface TripleFeature {
  program: Scored[]; // in suggested playback (physical) order
  totalMinutes: number;
  discSwaps: number;
}

/**
 * Picks three contrasting cartoons for a ~20-minute bill:
 *  - first act drawn by the usual weighted pick;
 *  - each next act weighted by (mood weight × contrast), with a bonus for
 *    sharing a disc (no swap) or volume (same box) with the acts so far;
 *  - the program is then ordered by physical location to minimize swaps.
 */
export function tripleFeature(all: Cartoon[], s: Settings, ctx: FilterContext, rng: Rng): TripleFeature | null {
  const pool = rankPool(applyFilters(all, s.filters, ctx), s);
  if (pool.length < 3) return null;
  const chosen: Scored[] = [weightedPick(pool, rng)!];
  while (chosen.length < 3) {
    const candidates = pool
      .filter((p) => !chosen.includes(p))
      .map((p) => {
        const minDist = Math.min(...chosen.map((c) => moodDistance(c.cartoon, p.cartoon)));
        const sameDisc = chosen.some((c) => c.cartoon.vol === p.cartoon.vol && c.cartoon.disc === p.cartoon.disc);
        const sameVol = chosen.some((c) => c.cartoon.vol === p.cartoon.vol);
        const sameStars = chosen.some((c) => c.cartoon.stars.join() === p.cartoon.stars.join() && p.cartoon.stars.length > 0);
        const contrast = 0.25 + minDist / 6;
        const proximity = sameDisc ? 2.2 : sameVol ? 1.4 : 1;
        return { ...p, weight: p.weight * contrast * contrast * proximity * (sameStars ? 0.35 : 1) };
      });
    chosen.push(weightedPick(candidates, rng)!);
  }
  const program = chosen
    .map((c) => pool.find((p) => p.cartoon.id === c.cartoon.id)!)
    .sort((a, b) => a.cartoon.vol - b.cartoon.vol || a.cartoon.disc - b.cartoon.disc || a.cartoon.pos - b.cartoon.pos);
  let discSwaps = 0;
  for (let i = 1; i < program.length; i++) {
    const a = program[i - 1].cartoon;
    const b = program[i].cartoon;
    if (a.vol !== b.vol || a.disc !== b.disc) discSwaps++;
  }
  return { program, totalMinutes: program.reduce((t, p) => t + p.cartoon.runtime, 0), discSwaps };
}
