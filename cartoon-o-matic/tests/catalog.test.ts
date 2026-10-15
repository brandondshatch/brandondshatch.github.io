import { describe, expect, it } from 'vitest';
import { CATALOG, DISCS } from '../src/data/catalog';
import { RATINGS } from '../src/data/ratings';
import { CARTOONS } from '../src/data';
import { MOOD_KEYS } from '../src/data/types';

describe('physical inventory', () => {
  it('has exactly 236 main cartoons', () => {
    expect(CATALOG.length).toBe(236);
  });

  it('has 56 / 60 / 60 / 60 cartoons per volume', () => {
    const per = [1, 2, 3, 4].map((v) => CATALOG.filter((c) => c.vol === v).length);
    expect(per).toEqual([56, 60, 60, 60]);
  });

  it('every volume has exactly four discs, each with contiguous positions 1..n', () => {
    for (const vol of [1, 2, 3, 4]) {
      const discs = new Set(CATALOG.filter((c) => c.vol === vol).map((c) => c.disc));
      expect([...discs].sort()).toEqual([1, 2, 3, 4]);
      for (const disc of [1, 2, 3, 4]) {
        const pos = CATALOG.filter((c) => c.vol === vol && c.disc === disc).map((c) => c.pos);
        const n = vol === 1 ? 14 : 15;
        expect(pos).toEqual(Array.from({ length: n }, (_, i) => i + 1));
      }
    }
  });

  it('every physical location is occupied exactly once', () => {
    const keys = CATALOG.map((c) => `${c.vol}-${c.disc}-${c.pos}`);
    expect(new Set(keys).size).toBe(236);
  });

  it('every title appears exactly once and ids are unique', () => {
    expect(new Set(CATALOG.map((c) => c.title)).size).toBe(236);
    expect(new Set(CARTOONS.map((c) => c.id)).size).toBe(236);
  });

  it('has a name for all sixteen discs', () => {
    expect(DISCS.length).toBe(16);
    expect(CARTOONS.every((c) => c.discName.length > 0)).toBe(true);
  });

  it('has sane factual fields', () => {
    for (const c of CATALOG) {
      expect(c.year, c.title).toBeGreaterThanOrEqual(1935);
      expect(c.year, c.title).toBeLessThanOrEqual(1966);
      expect(c.directors.length, c.title).toBeGreaterThan(0);
      expect(c.synopsis.length, c.title).toBeGreaterThan(20);
    }
  });

  it('black-and-white entries are the expected 18', () => {
    const bw = CATALOG.filter((c) => !c.color).map((c) => c.title);
    expect(bw.length).toBe(18);
    // Volume 1 is all color.
    expect(CATALOG.filter((c) => c.vol === 1 && !c.color)).toEqual([]);
  });

  it('reports (does not enforce) discs that are not in chronological order', () => {
    const notChrono: string[] = [];
    for (const d of DISCS) {
      const years = CATALOG.filter((c) => c.vol === d.vol && c.disc === d.disc).map((c) => c.year);
      if (years.some((y, i) => i > 0 && y < years[i - 1])) notChrono.push(`V${d.vol}D${d.disc}`);
    }
    // The real discs are menu-ordered by theme, not date. Volume 4 Disc 3
    // (Speedy) is the one fully chronological disc in this set.
    expect(notChrono).not.toContain('V4D3');
    console.info('Discs whose menu order is not chronological:', notChrono.join(', '));
  });
});

describe('editorial ratings', () => {
  it('every catalog title has a rating and no rating is orphaned', () => {
    const titles = new Set(CATALOG.map((c) => c.title));
    const missing = CATALOG.filter((c) => !RATINGS[c.title]).map((c) => c.title);
    const orphans = Object.keys(RATINGS).filter((t) => !titles.has(t));
    expect(missing).toEqual([]);
    expect(orphans).toEqual([]);
  });

  it('all mood scores are integers 0–5 and fame is 0–5', () => {
    for (const [title, r] of Object.entries(RATINGS)) {
      for (const k of MOOD_KEYS) {
        expect(Number.isInteger(r.mood[k]), `${title} ${k}`).toBe(true);
        expect(r.mood[k], `${title} ${k}`).toBeGreaterThanOrEqual(0);
        expect(r.mood[k], `${title} ${k}`).toBeLessThanOrEqual(5);
      }
      expect(r.fame).toBeGreaterThanOrEqual(0);
      expect(r.fame).toBeLessThanOrEqual(5);
    }
  });
});
