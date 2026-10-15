// ===========================================================================
//  CATALOG SEARCH — plain multi-field keyword matching, no AI.
//
//  The query is split into words. Every word must match at least one field
//  of a cartoon (AND across words). A word can match:
//    • a title, character, director, disc name, theme or synopsis word
//      (prefix match, or a small edit distance for typos);
//    • a year ("1949"), a decade ("1940s", "40s");
//    • presentation keywords ("b&w", "black-and-white", "bw", "color");
//    • a location like "v3", "vol3", "disc2", "d2".
//  The full query is also tested as a title substring, so "Duck Amuck" or
//  "rabbit of sev" find the title directly.
// ===========================================================================

import type { Cartoon } from '../data/types';
import { STAR_ALIASES, STAR_LABELS } from '../data/characters';
import { THEME_LABELS } from './engine';
import { levenshtein, normalize } from './util';

const STOP = new Set(['the', 'a', 'an', 'and', 'of', 'with', 'in', 'by', 'cartoon', 'cartoons', 'short', 'shorts', 'starring']);

const THEME_WORDS: Record<string, string[]> = {
  scifi: ['scifi', 'sci', 'science', 'fiction', 'space', 'martian', 'rocket', 'future'],
  horror: ['horror', 'monster', 'monsters', 'spooky', 'scary', 'witch'],
  western: ['western', 'westerns', 'cowboy', 'wild', 'west'],
  fairytale: ['fairy', 'tale', 'tales', 'fairytale', 'legend', 'fable'],
  music: ['music', 'musical', 'opera', 'symphony', 'jazz', 'concert', 'song', 'singing'],
  hollywood: ['hollywood', 'movie', 'movies', 'celebrity', 'caricature', 'caricatures', 'satire'],
  sports: ['sport', 'sports', 'baseball', 'boxing', 'race', 'racing', 'wrestling'],
  wartime: ['war', 'wartime', 'army', 'wwii', 'draft'],
  meta: ['meta', 'fourth', 'wall'],
  surreal: ['surreal', 'surrealism', 'surrealist', 'weird', 'bizarre', 'dream'],
  chase: ['chase', 'chases', 'chasing'],
  rivalry: ['rivalry', 'trickery', 'trick', 'tricks'],
  holiday: ['holiday', 'christmas', 'easter', 'halloween', 'valentine'],
};

interface Indexed {
  cartoon: Cartoon;
  title: string;
  titleWords: string[];
  words: Set<string>; // all searchable words, normalized
}

function wordsOf(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean);
}

export function buildIndex(all: Cartoon[]): Indexed[] {
  return all.map((c) => {
    const words = new Set<string>();
    const add = (s: string) => wordsOf(s).forEach((w) => words.add(w));
    add(c.title);
    c.stars.forEach((k) => {
      add(STAR_LABELS[k]);
      STAR_ALIASES[k].forEach(add);
    });
    c.cast.forEach(add);
    c.directors.forEach(add);
    add(c.discName);
    add(c.synopsis);
    c.themes.forEach((t) => {
      add(THEME_LABELS[t]);
      THEME_WORDS[t].forEach(add);
    });
    return { cartoon: c, title: normalize(c.title), titleWords: wordsOf(c.title), words };
  });
}

type TokenMatch = { score: number } | null;

function fuzzyWordMatch(token: string, word: string): number {
  if (word === token) return 1;
  if (token.length >= 3 && word.startsWith(token)) return 0.8;
  if (token.length >= 4 || (token.length === 3 && word.length > 3)) {
    const cap = token.length >= 7 ? 2 : 1;
    // compare against the same-length prefix too, so "amuk" ~ "amuck"
    const d = Math.min(levenshtein(token, word, cap), levenshtein(token, word.slice(0, token.length + 1), cap));
    if (d <= cap) return 0.55 - 0.1 * d;
  }
  return 0;
}

function matchToken(token: string, ix: Indexed): TokenMatch {
  const c = ix.cartoon;
  // structured tokens
  const decade = token.match(/^(19)?([3-6])0s$/);
  if (decade) return Math.floor(c.year / 10) % 10 === Number(decade[2]) ? { score: 1 } : null;
  if (/^19[3-6]\d$/.test(token)) return c.year === Number(token) ? { score: 1.2 } : null;
  if (['bw', 'b&w', 'b w', 'blackandwhite', 'monochrome'].includes(token)) return !c.color ? { score: 1 } : null;
  if (token === 'black' || token === 'white') return !c.color ? { score: 0.6 } : null;
  if (token === 'color' || token === 'colour' || token === 'technicolor') return c.color ? { score: 0.4 } : null;
  const vol = token.match(/^v(?:ol(?:ume)?)?([1-4])$/);
  if (vol) return c.vol === Number(vol[1]) ? { score: 1 } : null;
  const disc = token.match(/^d(?:isc)?([1-4])$/);
  if (disc) return c.disc === Number(disc[1]) ? { score: 1 } : null;

  let best = 0;
  for (const w of ix.titleWords) best = Math.max(best, fuzzyWordMatch(token, w) * 1.5);
  for (const w of ix.words) best = Math.max(best, fuzzyWordMatch(token, w));
  return best > 0 ? { score: best } : null;
}

/** Collapse "black and white" / "black-and-white" into a single token. */
function tokenize(q: string): string[] {
  const n = normalize(q.replace(/black\s*-?\s*and\s*-?\s*white/gi, ' blackandwhite ').replace(/b\s*&\s*w/gi, ' bw '));
  return n.split(' ').filter((t) => t && !STOP.has(t));
}

export interface SearchHit {
  cartoon: Cartoon;
  relevance: number;
}

export function search(index: Indexed[], query: string): SearchHit[] {
  const q = normalize(query);
  if (!q) return index.map((ix) => ({ cartoon: ix.cartoon, relevance: 0 }));
  const tokens = tokenize(query);
  const hits: SearchHit[] = [];
  for (const ix of index) {
    let relevance = 0;
    if (ix.title === q) relevance += 10;
    else if (ix.title.includes(q)) relevance += 6;
    let ok = tokens.length > 0;
    for (const t of tokens) {
      const m = matchToken(t, ix);
      if (!m) {
        ok = false;
        break;
      }
      relevance += m.score;
    }
    if (ok || relevance >= 6) hits.push({ cartoon: ix.cartoon, relevance });
  }
  return hits.sort((a, b) => b.relevance - a.relevance);
}
