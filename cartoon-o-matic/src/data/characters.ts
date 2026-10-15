import type { StarKey } from './types';

export const STAR_LABELS: Record<StarKey, string> = {
  bugs: 'Bugs Bunny',
  daffy: 'Daffy Duck',
  porky: 'Porky Pig',
  elmer: 'Elmer Fudd',
  sam: 'Yosemite Sam',
  wile: 'Wile E. Coyote',
  roadrunner: 'Road Runner',
  sylvester: 'Sylvester',
  tweety: 'Tweety',
  foghorn: 'Foghorn Leghorn',
  marvin: 'Marvin the Martian',
  pepe: 'Pepé Le Pew',
  speedy: 'Speedy Gonzales',
  taz: 'Tasmanian Devil',
};

export const STAR_KEYS = Object.keys(STAR_LABELS) as StarKey[];

/** Extra search aliases for the stars (lower-case). */
export const STAR_ALIASES: Record<StarKey, string[]> = {
  bugs: ['bugs', 'bunny', 'rabbit', 'wabbit'],
  daffy: ['daffy', 'duck'],
  porky: ['porky', 'pig'],
  elmer: ['elmer', 'fudd'],
  sam: ['yosemite', 'sam'],
  wile: ['wile', 'coyote'],
  roadrunner: ['road', 'runner', 'roadrunner', 'beep'],
  sylvester: ['sylvester', 'puddy', 'putty'],
  tweety: ['tweety', 'tweetie', 'canary'],
  foghorn: ['foghorn', 'leghorn', 'rooster'],
  marvin: ['marvin', 'martian'],
  pepe: ['pepe', 'pepé', 'skunk'],
  speedy: ['speedy', 'gonzales'],
  taz: ['taz', 'tasmanian', 'devil'],
};

/**
 * Minor recurring characters: the "Minor & obscure characters" filter matches
 * any cartoon whose cast includes one of these. A cast entry matches when it
 * starts with one of these names.
 */
export const MINOR_RECURRING: string[] = [
  'Gossamer',
  'Hubie and Bertie',
  'Claude Cat',
  'Charlie Dog',
  'Marc Antony',
  'Pussyfoot',
  'Ralph Wolf',
  'Sam Sheepdog',
  'Beaky Buzzard',
  'Mama Buzzard',
  'Cecil Turtle',
  'Granny',
  'Hector the Bulldog',
  'Henery Hawk',
  'Barnyard Dawg',
  'Miss Prissy',
  'Prissy the hen',
  'Witch Hazel',
  'The Crusher',
  'Gruesome Gorilla',
  'Willoughby',
  'The Three Bears',
  'Mama Bear',
  'Penelope Pussycat',
  'The Goofy Gophers',
  'Rocky',
  'Mugsy',
  'Nasty Canasta',
  'Melissa Duck',
  'Petunia Pig',
  'Pete Puma',
  'Playboy Penguin',
  'Michigan J. Frog',
  'Egghead',
  'Beans',
  'Ham and Ex',
  'Slowpoke Rodriguez',
  'Dodsworth',
  'Conrad the Cat',
  'A. Flea',
  'Frisky Puppy',
  'The Do-Do',
  'Big Bad Wolf',
  'The Three Little Pigs',
];

export const DIRECTOR_ORDER = [
  'Chuck Jones',
  'Friz Freleng',
  'Robert McKimson',
  'Bob Clampett',
  'Tex Avery',
  'Frank Tashlin',
  'Arthur Davis',
  'Abe Levitow',
  'Hawley Pratt',
  'Maurice Noble',
  'Jack King',
  'Ben Hardaway',
  'Cal Dalton',
  'Cal Howard',
];
