// ---------------------------------------------------------------------------
// Shared data types for the ACME Cartoon-O-Matic 4000.
//
// The FACTUAL inventory (catalog.ts) and the SUBJECTIVE editorial ratings
// (ratings.ts) are deliberately kept in separate files so either can be
// corrected without disturbing the other. They are joined by `id`, which is
// derived from the title (see slugify in lib/util.ts).
// ---------------------------------------------------------------------------

export type Volume = 1 | 2 | 3 | 4;
export type Disc = 1 | 2 | 3 | 4;

/** The fourteen headline stars that get their own filter chips. */
export type StarKey =
  | 'bugs'
  | 'daffy'
  | 'porky'
  | 'elmer'
  | 'sam'
  | 'wile'
  | 'roadrunner'
  | 'sylvester'
  | 'tweety'
  | 'foghorn'
  | 'marvin'
  | 'pepe'
  | 'speedy'
  | 'taz';

/** One main-program cartoon, exactly as it sits on the physical DVD. */
export interface CatalogEntry {
  vol: Volume;
  disc: Disc;
  /** 1-based position of the cartoon on its disc (the disc menu order). */
  pos: number;
  title: string;
  /** Original theatrical release year. */
  year: number;
  directors: string[];
  /** false = black-and-white. */
  color: boolean;
  /** Headline stars who genuinely appear (cameos included only when on screen). */
  stars: StarKey[];
  /** Every other named or notable character (supporting, one-off, caricatures). */
  cast: string[];
  synopsis: string;
  /**
   * Running time in minutes, only when individually verified. When absent the
   * UI shows an era-typical estimate clearly labelled as approximate.
   */
  minutes?: number;
}

export interface DiscInfo {
  vol: Volume;
  disc: Disc;
  /** Disc theme as printed/commonly listed. */
  name: string;
}

/** The ten mood dimensions, in a fixed order. */
export const MOOD_KEYS = [
  'violence',
  'incorrect',
  'whimsy',
  'chaos',
  'clever',
  'music',
  'spooky',
  'talk',
  'sweet',
  'weird',
] as const;
export type MoodKey = (typeof MOOD_KEYS)[number];
export type MoodVector = Record<MoodKey, number>;

export type ThemeKey =
  | 'scifi'
  | 'horror'
  | 'western'
  | 'fairytale'
  | 'music'
  | 'hollywood'
  | 'sports'
  | 'wartime'
  | 'meta'
  | 'surreal'
  | 'chase'
  | 'rivalry'
  | 'holiday';

export type Confidence = 'high' | 'medium' | 'low';

/** Editorial (subjective) classification for one cartoon. */
export interface Rating {
  mood: MoodVector;
  themes: ThemeKey[];
  /** 0 = deep obscurity, 5 = everybody's-seen-it household classic. */
  fame: number;
  /** How sure the editor is about these subjective scores. */
  confidence: Confidence;
  /** Optional factual context about dated / uncomfortable content. */
  context?: string;
}

/** The joined record the app actually works with. */
export interface Cartoon extends CatalogEntry, Rating {
  id: string;
  discName: string;
  /** Minutes to show (verified value or era estimate). */
  runtime: number;
  runtimeVerified: boolean;
  /** Non-star characters that belong to the minor recurring roster. */
  minorChars: string[];
}
