import { describe, expect, it } from 'vitest';
import { CARTOONS } from '../src/data';
import {
  applyFilters,
  defaultSettings,
  diagnoseEmpty,
  moodScore,
  passesFilters,
  similar,
  spin,
  tripleFeature,
  type Settings,
} from '../src/lib/engine';
import { PRESETS } from '../src/lib/presets';
import { mulberry32 } from '../src/lib/util';

const ctx = { watched: new Set<string>() };

function settings(mut: (s: Settings) => void): Settings {
  const s = defaultSettings();
  mut(s);
  return s;
}

describe('hard filters', () => {
  it('no filters → all 236', () => {
    expect(applyFilters(CARTOONS, defaultSettings().filters, ctx).length).toBe(236);
  });

  it('B&W only returns only black-and-white; color only excludes them; together they partition', () => {
    const bw = applyFilters(CARTOONS, settings((s) => (s.filters.color = 'bw')).filters, ctx);
    const col = applyFilters(CARTOONS, settings((s) => (s.filters.color = 'color')).filters, ctx);
    expect(bw.every((c) => !c.color)).toBe(true);
    expect(col.every((c) => c.color)).toBe(true);
    expect(bw.length + col.length).toBe(236);
  });

  it('character "any" vs "all" behave as documented', () => {
    const any = applyFilters(CARTOONS, settings((s) => (s.filters.characters = ['bugs', 'daffy'])).filters, ctx);
    const all = applyFilters(
      CARTOONS,
      settings((s) => {
        s.filters.characters = ['bugs', 'daffy'];
        s.filters.charMode = 'all';
      }).filters,
      ctx,
    );
    expect(any.every((c) => c.stars.includes('bugs') || c.stars.includes('daffy'))).toBe(true);
    expect(all.every((c) => c.stars.includes('bugs') && c.stars.includes('daffy'))).toBe(true);
    expect(all.map((c) => c.title)).toContain('Duck Amuck');
    expect(all.length).toBeLessThan(any.length);
  });

  it('"one-off" means no headline stars', () => {
    const one = applyFilters(CARTOONS, settings((s) => (s.filters.characters = ['oneoff'])).filters, ctx);
    expect(one.length).toBeGreaterThan(20);
    expect(one.every((c) => c.stars.length === 0)).toBe(true);
  });

  it('combined filters: 1940s + B&W + Porky', () => {
    const f = settings((s) => {
      s.filters.decades = [1940];
      s.filters.color = 'bw';
      s.filters.characters = ['porky'];
    }).filters;
    const r = applyFilters(CARTOONS, f, ctx);
    expect(r.map((c) => c.title).sort()).toEqual(["Porky Pig's Feat", "Porky's Poor Fish", 'The Sour Puss', 'You Ought to Be in Pictures'].sort());
  });

  it('disc and year-range filters', () => {
    const f = settings((s) => {
      s.filters.discs = ['3-2'];
      s.filters.yearRangeOn = true;
      s.filters.yearMin = 1950;
      s.filters.yearMax = 1966;
    }).filters;
    const r = applyFilters(CARTOONS, f, ctx);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.vol === 3 && c.disc === 2 && c.year >= 1950)).toBe(true);
  });

  it('skip-watched removes watched cartoons', () => {
    const watched = new Set(CARTOONS.slice(0, 50).map((c) => c.id));
    const r = applyFilters(CARTOONS, settings((s) => (s.filters.skipWatched = true)).filters, { watched });
    expect(r.length).toBe(186);
  });
});

describe('spin', () => {
  const combos: [string, (s: Settings) => void][] = [
    ['b&w', (s) => (s.filters.color = 'bw')],
    ['color + jones + violence 5', (s) => {
      s.filters.color = 'color';
      s.filters.directors = ['Chuck Jones'];
      s.sliders.violence = { on: true, value: 5 };
    }],
    ['vol 2 disc 3 + sweet', (s) => {
      s.filters.discs = ['2-3'];
      s.sliders.sweet = { on: true, value: 5 };
    }],
    ['1930s music', (s) => {
      s.filters.decades = [1930];
      s.filters.themes = ['music'];
    }],
    ['minor chars + all-mode with sylvester', (s) => {
      s.filters.characters = ['minor', 'sylvester'];
      s.filters.charMode = 'all';
    }],
  ];

  for (const [name, mut] of combos) {
    it(`results always satisfy hard filters: ${name}`, () => {
      const s = settings(mut);
      const rng = mulberry32(42);
      for (let i = 0; i < 300; i++) {
        const r = spin(CARTOONS, s, ctx, rng);
        expect(r).not.toBeNull();
        expect(passesFilters(r!.winner.cartoon, s.filters, ctx)).toBe(true);
        expect(r!.shortlist).toContain(r!.winner);
        expect(r!.shortlist[r!.winnerIndex]).toBe(r!.winner);
        for (const x of r!.shortlist) expect(passesFilters(x.cartoon, s.filters, ctx)).toBe(true);
      }
    });
  }

  it('returns null and a useful diagnosis when nothing matches', () => {
    const s = settings((s) => {
      s.filters.color = 'bw';
      s.filters.characters = ['speedy'];
    });
    expect(spin(CARTOONS, s, ctx, mulberry32(1))).toBeNull();
    const d = diagnoseEmpty(CARTOONS, s.filters, ctx);
    expect(d.map((x) => x.key).sort()).toEqual(['characters', 'color']);
    expect(d.every((x) => x.wouldMatch > 0)).toBe(true);
  });

  it('weighted draw favors strong matches but is not deterministic', () => {
    const s = settings((s) => (s.sliders.violence = { on: true, value: 5 }));
    const rng = mulberry32(7);
    const counts = new Map<string, number>();
    let strong = 0;
    for (let i = 0; i < 2000; i++) {
      const w = spin(CARTOONS, s, ctx, rng)!.winner;
      counts.set(w.cartoon.id, (counts.get(w.cartoon.id) ?? 0) + 1);
      if (w.cartoon.mood.violence >= 4) strong++;
    }
    const strongShare = CARTOONS.filter((c) => c.mood.violence >= 4).length / CARTOONS.length;
    expect(strong / 2000).toBeGreaterThan(strongShare * 1.5);
    expect(counts.size).toBeGreaterThan(30); // still unpredictable
  });

  it('no sliders → uniform odds', () => {
    const rng = mulberry32(3);
    const seen = new Set<string>();
    for (let i = 0; i < 3000; i++) seen.add(spin(CARTOONS, defaultSettings(), ctx, rng)!.winner.cartoon.id);
    expect(seen.size).toBeGreaterThan(220);
  });

  it('exclude avoids immediate repeats', () => {
    const s = settings((s) => (s.filters.discs = ['1-1']));
    const rng = mulberry32(9);
    for (let i = 0; i < 100; i++) {
      const a = spin(CARTOONS, s, ctx, rng)!.winner.cartoon.id;
      const b = spin(CARTOONS, s, ctx, rng, { exclude: [a] })!.winner.cartoon.id;
      expect(b).not.toBe(a);
    }
  });

  it('mood score is 1 for an exact match and drops with distance', () => {
    const duckAmuck = CARTOONS.find((c) => c.title === 'Duck Amuck')!;
    const s = settings((s) => (s.sliders.weird = { on: true, value: duckAmuck.mood.weird }));
    expect(moodScore(duckAmuck, s)).toBe(1);
    s.sliders.weird.value = Math.max(0, duckAmuck.mood.weird - 5);
    expect(moodScore(duckAmuck, s)).toBeLessThan(0.1);
  });
});

describe('presets', () => {
  it('every preset yields a non-empty pool and shifts results toward its intent', () => {
    for (const p of PRESETS) {
      const s = p.build();
      expect(applyFilters(CARTOONS, s.filters, ctx).length, p.name).toBeGreaterThan(5);
    }
    const dmg = PRESETS.find((p) => p.id === 'acme-damage')!.build();
    const rng = mulberry32(11);
    let total = 0;
    for (let i = 0; i < 500; i++) total += spin(CARTOONS, dmg, ctx, rng)!.winner.cartoon.mood.violence;
    expect(total / 500).toBeGreaterThan(3.8);
    const jones = PRESETS.find((p) => p.id === 'jones-contraption')!.build();
    for (let i = 0; i < 100; i++) expect(spin(CARTOONS, jones, ctx, rng)!.winner.cartoon.directors).toContain('Chuck Jones');
  });
});

describe('similar & triple feature', () => {
  it('similar never returns the target and is sorted', () => {
    const t = CARTOONS.find((c) => c.title === 'Rabbit Fire')!;
    const s = similar(t, CARTOONS);
    expect(s.map((x) => x.cartoon.id)).not.toContain(t.id);
    expect(s.map((x) => x.cartoon.title)).toContain('Rabbit Seasoning');
  });

  it('triple feature: three distinct, filter-respecting, physically ordered', () => {
    const rng = mulberry32(5);
    const s = settings((s) => (s.filters.color = 'color'));
    for (let i = 0; i < 100; i++) {
      const t = tripleFeature(CARTOONS, s, ctx, rng)!;
      expect(new Set(t.program.map((p) => p.cartoon.id)).size).toBe(3);
      expect(t.program.every((p) => p.cartoon.color)).toBe(true);
      const keys = t.program.map((p) => p.cartoon.vol * 1000 + p.cartoon.disc * 100 + p.cartoon.pos);
      expect(keys).toEqual([...keys].sort((a, b) => a - b));
      expect(t.totalMinutes).toBeGreaterThanOrEqual(18);
      expect(t.totalMinutes).toBeLessThanOrEqual(24);
    }
  });
});
