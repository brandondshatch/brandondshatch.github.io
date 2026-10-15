import { describe, expect, it } from 'vitest';
import { CARTOONS } from '../src/data';
import { buildIndex, search } from '../src/lib/search';

const index = buildIndex(CARTOONS);
const titles = (q: string) => search(index, q).map((h) => h.cartoon.title);

describe('search', () => {
  it('exact title first', () => {
    expect(titles('Duck Amuck')[0]).toBe('Duck Amuck');
  });

  it('partial title', () => {
    expect(titles('rabbit of sev')[0]).toBe('The Rabbit of Seville');
    expect(titles('operaa doc')).toContain("What's Opera, Doc?");
  });

  it('tolerates misspellings', () => {
    expect(titles('Duk Amuk')).toContain('Duck Amuck');
    expect(titles('wackyland porki')).toContain('Porky in Wackyland');
    expect(titles('Clampet')).toContain('Porky in Wackyland');
  });

  it('1940s black-and-white Porky', () => {
    const r = search(index, '1940s black-and-white Porky');
    expect(r.length).toBeGreaterThan(0);
    for (const h of r) {
      expect(h.cartoon.color).toBe(false);
      expect(h.cartoon.year).toBeGreaterThanOrEqual(1940);
      expect(h.cartoon.year).toBeLessThan(1950);
      expect(h.cartoon.stars).toContain('porky');
    }
  });

  it('Chuck Jones surreal', () => {
    const r = titles('Chuck Jones surreal');
    expect(r).toContain('Duck Amuck');
    for (const h of search(index, 'Chuck Jones surreal')) {
      const c = h.cartoon;
      expect(c.directors.includes('Chuck Jones') || c.cast.some((x) => x.includes('Jones'))).toBe(true);
    }
  });

  it('years, volumes and discs', () => {
    expect(search(index, '1957').every((h) => h.cartoon.year === 1957)).toBe(true);
    expect(search(index, 'v3 d2').every((h) => h.cartoon.vol === 3 && h.cartoon.disc === 2)).toBe(true);
  });

  it('empty query returns everything', () => {
    expect(search(index, '').length).toBe(236);
  });
});
