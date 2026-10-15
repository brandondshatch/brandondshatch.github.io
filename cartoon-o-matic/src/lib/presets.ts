// Special modes. Each preset starts from a clean slate and sets real metadata
// constraints and slider targets — no hand-picked result lists.

import type { MoodKey } from '../data/types';
import { defaultSettings, type Settings } from './engine';

export interface Preset {
  id: string;
  name: string;
  blurb: string;
  build: () => Settings;
}

function withSliders(s: Settings, values: Partial<Record<MoodKey, number>>): Settings {
  for (const [k, v] of Object.entries(values)) s.sliders[k as MoodKey] = { on: true, value: v! };
  return s;
}

export const PRESETS: Preset[] = [
  {
    id: 'acme-damage',
    name: 'Maximum ACME Damage',
    blurb: 'Catastrophic slapstick. Anvils pre-loaded, safety catch removed.',
    build: () => withSliders(defaultSettings(), { violence: 5, chaos: 4 }),
  },
  {
    id: 'fever-dream',
    name: 'The Termite Terrace Fever Dream',
    blurb: 'Surreal, experimental and strange. Reality is optional.',
    build: () => withSliders(defaultSettings(), { whimsy: 5, weird: 5 }),
  },
  {
    id: 'what-were-they-thinking',
    name: 'What Were They Thinking?',
    blurb: 'Dated cultural attitudes and audacious humor, exactly as originally released.',
    build: () => withSliders(defaultSettings(), { incorrect: 4, talk: 3 }),
  },
  {
    id: 'comfort-food',
    name: 'Saturday Morning Comfort Food',
    blurb: 'The familiar favorites. Warm, reliable, beloved.',
    build: () => {
      const s = defaultSettings();
      s.filters.fame = 'classics';
      return s;
    },
  },
  {
    id: 'jones-contraption',
    name: 'The Chuck Jones Contraption',
    blurb: 'Clever, meticulously timed comic inventions.',
    build: () => {
      const s = withSliders(defaultSettings(), { clever: 5 });
      s.filters.directors = ['Chuck Jones'];
      return s;
    },
  },
  {
    id: 'deep-cuts',
    name: 'Deep Cuts',
    blurb: 'Obscure and lesser-known shorts from the back of the vault.',
    build: () => {
      const s = defaultSettings();
      s.filters.fame = 'deep';
      return s;
    },
  },
  {
    id: 'musical-mayhem',
    name: 'Musical Mayhem',
    blurb: 'Opera, swing, Liszt and Wagner—music-centered lunacy.',
    build: () => {
      const s = withSliders(defaultSettings(), { music: 5 });
      s.filters.themes = ['music'];
      return s;
    },
  },
  {
    id: 'dealers-choice',
    name: "Dealer's Choice",
    blurb: 'True unrestricted randomness across all four volumes. Every cartoon, equal odds.',
    build: () => defaultSettings(),
  },
];
