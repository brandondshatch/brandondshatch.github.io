// Joins the factual catalog with the editorial ratings into the records the
// app uses. If a rating is missing for a title, the cartoon still appears
// (with neutral, low-confidence scores) so the inventory is never silently
// shortened — and the test suite flags the gap.

import { CATALOG, DISCS } from './catalog';
import { RATINGS } from './ratings';
import { MINOR_RECURRING } from './characters';
import type { Cartoon, CatalogEntry, Rating } from './types';
import { MOOD_KEYS } from './types';
import { slugify } from '../lib/util';

const NEUTRAL: Rating = {
  mood: Object.fromEntries(MOOD_KEYS.map((k) => [k, 2])) as Rating['mood'],
  themes: [],
  fame: 1,
  confidence: 'low',
};

/** Era-typical running time, used only when no verified time is recorded. */
export function estimateMinutes(year: number): number {
  if (year >= 1960) return 6;
  return 7;
}

function discName(e: CatalogEntry): string {
  return DISCS.find((d) => d.vol === e.vol && d.disc === e.disc)?.name ?? '';
}

export const CARTOONS: Cartoon[] = CATALOG.map((e) => {
  const rating = RATINGS[e.title] ?? NEUTRAL;
  const minorChars = e.cast.filter((c) => MINOR_RECURRING.some((m) => c.startsWith(m)));
  return {
    ...e,
    ...rating,
    id: slugify(e.title),
    discName: discName(e),
    runtime: e.minutes ?? estimateMinutes(e.year),
    runtimeVerified: e.minutes !== undefined,
    minorChars,
  };
});

export const BY_ID: Map<string, Cartoon> = new Map(CARTOONS.map((c) => [c.id, c]));

export { DISCS };
