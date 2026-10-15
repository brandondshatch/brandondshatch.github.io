// ===========================================================================
//  THE EDITORIAL LAYER (subjective)
//
//  Matched to catalog.ts by exact title. Nothing in here affects where a
//  cartoon lives on the discs; change a score and only the matching changes.
//
//  Mood vector order (0–5 each):
//
//    V  violence    0 none · 1 the odd bonk · 2 standard slapstick ·
//                   3 frequent heavy hits / explosions · 4 relentless ·
//                   5 unregulated anvil warfare
//    P  incorrect   0 nothing notable · 1 mildly dated jokes ·
//                   2 noticeable dated stereotypes or gags ·
//                   3 a prominent stereotyped sequence ·
//                   4 stereotype is central to the premise ·
//                   5 reserved for the pervasive extreme
//    W  whimsy      0 grounded cartoon logic → 5 complete surrealist madness
//    C  chaos       0 relaxed pacing → 5 total pandemonium
//    K  cleverness  0 purely physical gags → 5 ingenious verbal/conceptual
//    M  music       0 minimal score → 5 the music IS the cartoon
//    S  spooky      0 cheerful nonsense → 5 gothic cartoon nightmare
//    D  dialogue    0 almost wordless → 5 everybody's a wise guy
//    T  sweet       0 cynical and abrasive → 5 unexpectedly sweet
//    X  weird       0 traditional cartoon → 5 what on earth did I just watch?
//
//  fame: 0 deep cut … 5 household classic (drives "Deep Cuts" and
//        "Saturday Morning Comfort Food").
//  conf: h / m / l = editor's confidence in these subjective scores.
//        'l' marks shorts rated mainly from synopsis and reputation rather
//        than close familiarity — treat those numbers as a first draft.
//  ctx:  optional factual note about dated or uncomfortable content. Nothing
//        is hidden; the note is there so nobody is surprised.
// ===========================================================================

import type { Confidence, Rating, ThemeKey } from './types';
import { MOOD_KEYS } from './types';

type Row = [number, number, number, number, number, number, number, number, number, number];

function m(
  v: Row,
  themes: ThemeKey[],
  fame: number,
  conf: 'h' | 'm' | 'l' = 'm',
  ctx?: string,
): Rating {
  const mood = Object.fromEntries(MOOD_KEYS.map((k, i) => [k, v[i]])) as Rating['mood'];
  const confidence: Confidence = conf === 'h' ? 'high' : conf === 'l' ? 'low' : 'medium';
  return { mood, themes, fame, confidence, ...(ctx ? { context: ctx } : {}) };
}

export const RATINGS: Record<string, Rating> = {
  //                                     V  P  W  C  K  M  S  D  T  X
  // ── Volume 1 · Disc 1 ──
  'Baseball Bugs':                   m([3, 0, 2, 4, 3, 1, 0, 3, 1, 1], ['sports', 'rivalry'], 5, 'h'),
  'Rabbit Seasoning':                m([4, 0, 1, 3, 5, 0, 0, 5, 0, 1], ['rivalry'], 5, 'h'),
  'Long-Haired Hare':                m([2, 0, 1, 2, 4, 5, 0, 2, 1, 1], ['music', 'rivalry'], 5, 'h'),
  'High Diving Hare':                m([4, 0, 1, 3, 3, 0, 0, 3, 0, 1], ['rivalry'], 4, 'h'),
  'Bully for Bugs':                  m([4, 1, 1, 3, 4, 3, 0, 2, 0, 1], ['sports', 'rivalry'], 5, 'h'),
  "What's Up Doc?":                  m([2, 1, 1, 2, 3, 3, 0, 4, 2, 1], ['hollywood', 'meta'], 3, 'm', 'Caricatures of 1930s–40s entertainers, including Al Jolson, appear in the vaudeville sequences.'),
  "Rabbit's Kin":                    m([3, 0, 1, 3, 3, 0, 0, 4, 2, 1], ['rivalry'], 3, 'm'),
  'Water, Water Every Hare':         m([3, 0, 3, 3, 3, 1, 4, 3, 0, 2], ['horror', 'scifi', 'rivalry'], 4, 'h'),
  'Big House Bunny':                 m([3, 0, 1, 3, 3, 0, 0, 3, 0, 1], ['rivalry'], 3, 'm'),
  'Big Top Bunny':                   m([3, 0, 1, 3, 2, 1, 0, 2, 0, 1], ['rivalry'], 2, 'm'),
  'My Bunny Lies over the Sea':      m([2, 1, 1, 2, 3, 3, 0, 3, 1, 1], ['sports', 'rivalry'], 3, 'm', 'Plays broadly with Scottish stereotypes (kilts, bagpipes, thrift).'),
  'Wabbit Twouble':                  m([3, 0, 2, 3, 2, 1, 0, 3, 0, 2], ['rivalry'], 3, 'm'),
  'Ballot Box Bunny':                m([4, 0, 1, 3, 4, 1, 0, 4, 0, 1], ['rivalry'], 3, 'h'),
  'The Rabbit of Seville':           m([3, 0, 2, 3, 4, 5, 0, 1, 0, 2], ['music', 'rivalry', 'chase'], 5, 'h'),

  // ── Volume 1 · Disc 2 ──
  'Duck Amuck':                      m([2, 0, 5, 3, 5, 1, 0, 4, 0, 5], ['meta', 'surreal'], 5, 'h'),
  'Dough for the Do-Do':             m([1, 1, 5, 3, 3, 2, 1, 2, 1, 5], ['surreal'], 3, 'm', 'Like the original it remakes, includes brief dated caricature gags among the Wackyland creatures.'),
  'Drip-Along Daffy':                m([3, 0, 1, 3, 4, 1, 0, 4, 1, 1], ['western', 'rivalry'], 4, 'h'),
  'Scaredy Cat':                     m([3, 0, 2, 2, 3, 1, 4, 2, 2, 2], ['horror'], 3, 'm'),
  'The Ducksters':                   m([4, 0, 2, 4, 4, 1, 0, 5, 0, 2], ['rivalry'], 3, 'h'),
  'The Scarlet Pumpernickel':        m([3, 0, 3, 3, 5, 1, 0, 5, 1, 3], ['meta', 'hollywood', 'fairytale'], 4, 'h'),
  'Yankee Doodle Daffy':             m([2, 1, 2, 4, 4, 4, 0, 5, 1, 2], ['music', 'hollywood', 'rivalry'], 3, 'm'),
  'Porky Chops':                     m([2, 1, 1, 2, 2, 1, 0, 3, 1, 1], ['rivalry'], 1, 'l'),
  'The Wearing of the Grin':         m([1, 1, 3, 2, 3, 2, 3, 3, 1, 4], ['fairytale', 'surreal', 'horror', 'holiday'], 2, 'm', 'Leprechaun-and-shamrock Irish folklore played for laughs.'),
  'Deduce, You Say!':                m([2, 1, 1, 3, 4, 1, 1, 5, 0, 2], ['rivalry'], 2, 'm'),
  'Boobs in the Woods':              m([3, 0, 1, 3, 2, 0, 0, 3, 0, 1], ['rivalry'], 1, 'm'),
  'Golden Yeggs':                    m([3, 0, 1, 3, 3, 0, 0, 4, 0, 1], ['rivalry'], 2, 'm'),
  'Rabbit Fire':                     m([4, 0, 1, 3, 5, 0, 0, 5, 0, 1], ['rivalry'], 5, 'h'),
  'Duck Dodgers in the 24½th Century': m([4, 0, 3, 3, 4, 1, 0, 4, 0, 3], ['scifi', 'rivalry'], 5, 'h'),

  // ── Volume 1 · Disc 3 ──
  "Elmer's Candid Camera":           m([1, 0, 1, 2, 2, 0, 0, 2, 0, 1], ['rivalry'], 2, 'm'),
  'Bugs Bunny and the Three Bears':  m([3, 0, 2, 3, 3, 1, 0, 3, 1, 1], ['fairytale', 'rivalry'], 3, 'm'),
  'Fast and Furry-ous':              m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 5, 'h'),
  'Hair-Raising Hare':               m([3, 0, 3, 3, 3, 1, 4, 3, 0, 2], ['horror', 'rivalry'], 4, 'h'),
  'The Awful Orphan':                m([1, 0, 1, 2, 3, 0, 0, 4, 2, 1], ['rivalry'], 2, 'm'),
  'Haredevil Hare':                  m([3, 0, 3, 3, 3, 0, 0, 3, 0, 2], ['scifi', 'rivalry'], 4, 'h'),
  'For Scent-imental Reasons':       m([1, 2, 2, 2, 3, 2, 0, 4, 1, 1], ['chase'], 4, 'h', 'The premise is Pepé\'s persistent romantic pursuit of a cat who is plainly trying to escape him.'),
  'Frigid Hare':                     m([2, 2, 1, 2, 2, 1, 0, 2, 3, 1], ['rivalry'], 2, 'm', 'Features a stereotyped Eskimo hunter.'),
  'The Hypo-Chondri-Cat':            m([1, 0, 2, 2, 4, 0, 1, 4, 1, 2], ['rivalry'], 1, 'm'),
  'Baton Bunny':                     m([1, 0, 2, 2, 3, 5, 0, 0, 1, 2], ['music'], 2, 'm'),
  'Feed the Kitty':                  m([2, 0, 1, 3, 3, 1, 0, 1, 5, 1], [], 4, 'h'),
  "Don't Give Up the Sheep":         m([4, 0, 2, 2, 4, 1, 0, 1, 1, 2], ['rivalry'], 3, 'h'),
  'Bugs Bunny Gets the Boid':        m([3, 0, 2, 3, 2, 1, 0, 3, 1, 2], ['rivalry'], 2, 'm'),
  'Tortoise Wins by a Hare':         m([3, 0, 2, 3, 3, 1, 0, 3, 0, 2], ['sports', 'rivalry'], 2, 'm'),

  // ── Volume 1 · Disc 4 ──
  'Canary Row':                      m([4, 0, 1, 3, 3, 1, 0, 2, 0, 1], ['chase', 'rivalry'], 5, 'h'),
  'Bunker Hill Bunny':               m([4, 0, 1, 3, 3, 1, 0, 3, 0, 1], ['rivalry'], 2, 'm'),
  'Kit for Cat':                     m([2, 0, 1, 3, 3, 0, 0, 2, 3, 1], ['rivalry'], 2, 'm'),
  'Putty Tat Trouble':               m([3, 0, 1, 3, 2, 0, 0, 1, 0, 1], ['chase', 'rivalry'], 2, 'm'),
  'Bugs and Thugs':                  m([3, 0, 1, 3, 4, 0, 0, 4, 0, 1], ['rivalry', 'hollywood'], 3, 'm'),
  'Canned Feud':                     m([3, 0, 1, 2, 3, 0, 0, 0, 0, 1], ['rivalry'], 2, 'm'),
  'Lumber Jerks':                    m([1, 0, 2, 2, 3, 1, 0, 3, 3, 2], [], 2, 'm'),
  'Speedy Gonzales':                 m([3, 2, 1, 4, 2, 2, 0, 2, 2, 1], ['chase', 'rivalry'], 4, 'h', 'Mexican stereotypes are built into the premise, as in most Speedy shorts.'),
  "Tweety's S.O.S.":                 m([3, 0, 1, 3, 2, 1, 0, 2, 0, 1], ['chase', 'rivalry'], 3, 'm'),
  'The Foghorn Leghorn':             m([3, 0, 1, 3, 3, 0, 0, 5, 1, 1], ['rivalry'], 3, 'm'),
  'Daffy Duck Hunt':                 m([3, 0, 1, 3, 3, 0, 0, 3, 0, 1], ['rivalry'], 2, 'm'),
  'Early to Bet':                    m([3, 0, 3, 2, 3, 0, 0, 3, 0, 3], [], 1, 'm'),
  'A Broken Leghorn':                m([3, 0, 1, 3, 3, 0, 0, 5, 1, 1], ['rivalry'], 2, 'm'),
  'Devil May Hare':                  m([4, 0, 2, 4, 3, 1, 1, 2, 1, 2], ['rivalry'], 4, 'h'),

  // ── Volume 2 · Disc 1 ──
  'The Big Snooze':                  m([3, 0, 4, 4, 4, 1, 1, 3, 0, 4], ['meta', 'surreal', 'rivalry'], 2, 'm'),
  'Broom-Stick Bunny':               m([2, 0, 3, 3, 4, 1, 3, 4, 2, 2], ['horror', 'holiday', 'rivalry'], 3, 'h'),
  'Bugs Bunny Rides Again':          m([4, 0, 1, 3, 3, 1, 0, 4, 0, 1], ['western', 'rivalry'], 4, 'h'),
  'Bunny Hugged':                    m([4, 0, 1, 4, 3, 0, 0, 2, 0, 1], ['sports', 'rivalry'], 3, 'm'),
  'French Rarebit':                  m([2, 1, 1, 3, 5, 0, 0, 5, 0, 1], ['rivalry'], 3, 'h', 'Broad French-chef caricatures.'),
  'Gorilla My Dreams':               m([4, 0, 1, 4, 2, 0, 0, 2, 1, 1], ['rivalry'], 2, 'm'),
  'The Hare-Brained Hypnotist':      m([2, 0, 2, 3, 3, 0, 0, 3, 0, 2], ['rivalry'], 2, 'm'),
  'Hare Conditioned':                m([3, 0, 2, 3, 3, 0, 0, 3, 0, 2], ['rivalry'], 2, 'm'),
  'The Heckling Hare':               m([3, 0, 2, 3, 2, 0, 0, 3, 0, 2], ['rivalry'], 2, 'm'),
  'Little Red Riding Rabbit':        m([3, 0, 2, 4, 3, 1, 0, 4, 0, 2], ['fairytale', 'rivalry'], 3, 'm'),
  'Tortoise Beats Hare':             m([2, 0, 2, 3, 3, 0, 0, 3, 0, 2], ['sports', 'meta', 'rivalry'], 3, 'm'),
  'Rabbit Transit':                  m([3, 0, 2, 3, 3, 0, 0, 3, 0, 2], ['sports', 'rivalry'], 2, 'm'),
  'Slick Hare':                      m([3, 0, 1, 3, 3, 1, 0, 3, 0, 1], ['hollywood', 'chase'], 2, 'm'),
  'Baby Buggy Bunny':                m([3, 0, 1, 3, 3, 0, 0, 4, 1, 1], ['rivalry'], 3, 'm'),
  'Hyde and Hare':                   m([3, 0, 3, 3, 3, 1, 4, 2, 1, 2], ['horror', 'scifi'], 3, 'm'),

  // ── Volume 2 · Disc 2 ──
  'Beep, Beep':                      m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Going! Going! Gosh!':             m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Zipping Along':                   m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Stop! Look! And Hasten!':         m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Ready.. Set.. Zoom!':             m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Guided Muscle':                   m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Gee Whiz-z-z-z-z-z-z':            m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'There They Go-Go-Go!':            m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Scrambled Aches':                 m([5, 0, 3, 3, 3, 1, 0, 0, 0, 2], ['chase', 'surreal'], 3, 'h'),
  'Zoom and Bored':                  m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Whoa, Be-Gone!':                  m([5, 0, 2, 3, 3, 1, 0, 0, 0, 1], ['chase'], 3, 'h'),
  'Cheese Chasers':                  m([2, 0, 3, 2, 4, 0, 0, 4, 2, 3], ['surreal'], 2, 'm'),
  'The Dover Boys at Pimento University': m([2, 0, 3, 3, 4, 2, 0, 4, 1, 4], ['surreal'], 3, 'h'),
  'Mouse Wreckers':                  m([3, 0, 3, 3, 4, 0, 1, 3, 0, 3], ['surreal', 'rivalry'], 2, 'm'),
  'A Bear for Punishment':           m([3, 0, 2, 3, 4, 2, 0, 3, 1, 2], ['holiday'], 2, 'm'),

  // ── Volume 2 · Disc 3 ──
  "Bad Ol' Putty Tat":               m([3, 0, 1, 3, 2, 0, 0, 1, 0, 1], ['chase', 'rivalry'], 2, 'm'),
  'All a Bir-r-r-d':                 m([3, 0, 1, 3, 2, 0, 0, 1, 0, 1], ['chase', 'rivalry'], 2, 'm'),
  'Room and Bird':                   m([3, 0, 1, 4, 2, 0, 0, 2, 0, 1], ['chase', 'rivalry'], 2, 'm'),
  'Tweet Tweet Tweety':              m([3, 0, 1, 3, 2, 0, 0, 1, 0, 1], ['chase', 'rivalry'], 1, 'l'),
  'Gift Wrapped':                    m([3, 0, 1, 3, 2, 1, 0, 2, 1, 1], ['holiday', 'chase'], 2, 'm'),
  "Ain't She Tweet":                 m([4, 0, 1, 3, 2, 0, 0, 1, 0, 1], ['chase', 'rivalry'], 1, 'l'),
  'A Bird in a Guilty Cage':         m([3, 0, 1, 3, 2, 0, 0, 1, 0, 1], ['chase', 'rivalry'], 1, 'l'),
  'Snow Business':                   m([3, 0, 1, 3, 2, 0, 0, 2, 0, 1], ['chase', 'rivalry'], 2, 'm'),
  'Tweetie Pie':                     m([3, 0, 1, 3, 2, 0, 0, 2, 1, 1], ['chase', 'rivalry'], 3, 'h'),
  'Kitty Kornered':                  m([2, 1, 3, 4, 3, 0, 1, 3, 0, 3], ['scifi', 'rivalry'], 2, 'm'),
  'Baby Bottleneck':                 m([2, 1, 3, 5, 3, 2, 0, 3, 1, 3], ['surreal'], 2, 'm', 'Fast-paced 1946 Clampett with a few dated ethnic gags among its baby deliveries.'),
  'Old Glory':                       m([0, 1, 1, 0, 2, 3, 0, 3, 4, 1], [], 1, 'm', 'A sincere patriotic history lesson rather than a comedy.'),
  'The Great Piggy Bank Robbery':    m([3, 0, 5, 5, 3, 1, 2, 3, 0, 5], ['surreal', 'hollywood'], 3, 'h'),
  'Duck Soup to Nuts':               m([3, 0, 1, 3, 3, 0, 0, 4, 0, 1], ['rivalry'], 1, 'm'),
  'Porky in Wackyland':              m([1, 2, 5, 3, 3, 2, 1, 2, 1, 5], ['surreal'], 3, 'h', 'Its parade of absurd creatures includes a brief blackface-style caricature gag.'),

  // ── Volume 2 · Disc 4 ──
  'Back Alley Oproar':               m([3, 0, 2, 3, 3, 5, 0, 1, 0, 2], ['music', 'rivalry'], 2, 'm'),
  'Book Revue':                      m([2, 2, 4, 4, 3, 4, 1, 3, 1, 4], ['music', 'fairytale', 'surreal', 'hollywood'], 3, 'h', 'Lively 1946 spoof of popular culture; Daffy\'s zoot-suit scat routine and a few caricatures reflect period attitudes.'),
  'A Corny Concerto':                m([2, 0, 3, 2, 3, 5, 0, 1, 2, 3], ['music'], 3, 'h'),
  'Have You Got Any Castles?':       m([1, 1, 3, 2, 3, 5, 1, 2, 2, 3], ['music', 'fairytale'], 1, 'l', 'Literary-character revue with some period caricatures.'),
  'Hollywood Steps Out':             m([1, 1, 2, 2, 3, 4, 0, 3, 1, 2], ['hollywood', 'music'], 2, 'm', 'Celebrity caricatures with a few period jokes at the stars\' expense.'),
  'I Love to Singa':                 m([0, 0, 2, 1, 2, 5, 0, 2, 4, 2], ['music'], 2, 'm'),
  'Katnip Kollege':                  m([0, 1, 2, 2, 2, 5, 0, 2, 3, 2], ['music'], 1, 'l', 'Swing-era jive slang throughout.'),
  'The Hep Cat':                     m([2, 1, 1, 2, 2, 2, 0, 3, 1, 1], ['rivalry'], 1, 'l'),
  'Three Little Bops':               m([2, 0, 3, 2, 3, 5, 0, 2, 2, 3], ['music', 'fairytale'], 3, 'h'),
  'One Froggy Evening':              m([1, 0, 4, 1, 5, 5, 0, 1, 1, 3], ['music'], 5, 'h'),
  'Rhapsody Rabbit':                 m([2, 0, 2, 3, 3, 5, 0, 0, 0, 2], ['music', 'rivalry'], 3, 'h'),
  'Show Biz Bugs':                   m([3, 0, 1, 3, 4, 4, 0, 4, 0, 1], ['music', 'hollywood', 'rivalry'], 4, 'h'),
  'Stage Door Cartoon':              m([3, 0, 2, 3, 3, 3, 0, 3, 0, 2], ['music', 'hollywood', 'rivalry'], 1, 'm'),
  "What's Opera, Doc?":              m([3, 0, 4, 2, 5, 5, 1, 2, 2, 4], ['music', 'fairytale'], 5, 'h'),
  'You Ought to Be in Pictures':     m([2, 0, 3, 2, 4, 1, 0, 4, 2, 4], ['meta', 'hollywood'], 3, 'h'),

  // ── Volume 3 · Disc 1 ──
  'Hare Force':                      m([3, 0, 1, 3, 3, 0, 0, 3, 1, 1], ['rivalry'], 1, 'm'),
  'Hare Remover':                    m([3, 0, 2, 3, 2, 0, 2, 3, 0, 2], ['scifi', 'horror', 'rivalry'], 1, 'm'),
  'Hare Tonic':                      m([2, 0, 3, 3, 5, 0, 1, 4, 0, 3], ['meta', 'rivalry'], 3, 'h'),
  'A Hare Grows in Manhattan':       m([3, 1, 1, 3, 3, 1, 0, 4, 1, 1], ['hollywood', 'chase'], 2, 'm'),
  'Easter Yeggs':                    m([3, 0, 2, 3, 3, 0, 0, 3, 1, 1], ['holiday', 'rivalry'], 2, 'm'),
  'The Wabbit Who Came to Supper':   m([2, 0, 2, 3, 4, 1, 0, 3, 0, 2], ['rivalry'], 1, 'm'),
  'Bowery Bugs':                     m([3, 1, 1, 3, 3, 1, 0, 4, 0, 1], ['rivalry'], 1, 'm'),
  'Homeless Hare':                   m([4, 0, 1, 3, 3, 0, 0, 2, 0, 1], ['rivalry'], 1, 'm'),
  'Case of the Missing Hare':        m([2, 1, 1, 2, 3, 0, 0, 3, 0, 1], ['rivalry'], 1, 'l'),
  'Acrobatty Bunny':                 m([3, 0, 1, 3, 2, 1, 0, 2, 0, 1], ['rivalry'], 1, 'm'),
  'Wackiki Wabbit':                  m([1, 4, 3, 2, 4, 2, 0, 4, 0, 3], ['rivalry', 'meta'], 2, 'm', 'Built around caricatured Pacific Islander "natives" and their nonsense-language subtitles.'),
  'Hare Do':                         m([3, 0, 1, 3, 3, 0, 0, 3, 0, 1], ['hollywood', 'meta', 'rivalry'], 1, 'm'),
  'Rebel Rabbit':                    m([2, 0, 2, 3, 4, 0, 0, 3, 0, 2], ['rivalry'], 1, 'm'),
  'Hillbilly Hare':                  m([3, 1, 2, 4, 3, 4, 0, 3, 0, 2], ['music', 'rivalry'], 3, 'h', 'Broad hillbilly caricatures.'),
  'Duck! Rabbit, Duck!':             m([4, 0, 2, 3, 5, 0, 0, 5, 0, 2], ['rivalry'], 4, 'h'),

  // ── Volume 3 · Disc 2 ──
  'Daffy Duck in Hollywood':         m([2, 1, 3, 4, 3, 1, 0, 3, 0, 3], ['hollywood', 'meta'], 1, 'm'),
  'Hollywood Capers':                m([2, 0, 2, 3, 1, 1, 1, 1, 0, 2], ['hollywood'], 0, 'l'),
  'The Coo-Coo Nut Grove':           m([1, 2, 2, 2, 2, 4, 0, 2, 1, 2], ['hollywood', 'music'], 1, 'l', 'Celebrity caricature parade with some period ethnic and racial caricatures.'),
  "Porky's Road Race":               m([2, 1, 1, 3, 2, 1, 0, 1, 1, 1], ['hollywood', 'sports'], 0, 'l'),
  'The Woods Are Full of Cuckoos':   m([0, 1, 2, 2, 2, 5, 0, 2, 1, 2], ['hollywood', 'music'], 0, 'l', 'Radio-star caricatures from the 1930s.'),
  "She Was an Acrobat's Daughter":   m([1, 1, 2, 2, 3, 3, 0, 2, 1, 2], ['hollywood', 'music', 'meta'], 0, 'l'),
  'The Film Fan':                    m([1, 0, 1, 2, 2, 1, 0, 2, 1, 1], ['hollywood'], 0, 'l'),
  'Speaking of the Weather':         m([1, 1, 2, 3, 3, 4, 0, 2, 1, 2], ['hollywood', 'music'], 0, 'l'),
  'Thugs with Dirty Mugs':           m([2, 1, 2, 2, 4, 0, 0, 4, 0, 3], ['hollywood', 'meta'], 1, 'm'),
  'Goofy Groceries':                 m([2, 1, 3, 3, 2, 3, 1, 2, 1, 3], ['music', 'surreal'], 0, 'l'),
  'Swooner Crooner':                 m([1, 0, 2, 2, 3, 5, 0, 2, 1, 2], ['music', 'hollywood', 'wartime'], 1, 'm'),
  'Wideo Wabbit':                    m([3, 0, 1, 3, 3, 0, 0, 4, 0, 2], ['hollywood', 'rivalry'], 1, 'm'),
  'The Honey-Mousers':               m([1, 0, 1, 2, 3, 0, 0, 5, 1, 1], ['hollywood'], 1, 'm'),
  'The Last Hungry Cat':             m([1, 0, 2, 1, 5, 1, 4, 3, 1, 3], ['hollywood', 'horror', 'meta'], 1, 'm'),
  'The Mouse That Jack Built':       m([1, 0, 2, 2, 4, 1, 0, 5, 2, 3], ['hollywood', 'meta'], 1, 'm'),

  // ── Volume 3 · Disc 3 ──
  "I Haven't Got a Hat":             m([1, 0, 1, 2, 2, 3, 0, 3, 3, 1], ['music'], 1, 'm'),
  "Porky's Romance":                 m([1, 1, 2, 2, 2, 1, 1, 2, 2, 2], [], 0, 'l', 'Opens with Porky attempting suicide and ends on a mean-spirited marriage gag.'),
  "Porky's Party":                   m([2, 0, 3, 4, 1, 1, 0, 1, 1, 3], ['surreal'], 0, 'l'),
  'Porky in Egypt':                  m([1, 1, 4, 3, 2, 1, 2, 1, 1, 4], ['surreal'], 0, 'l', 'Includes period Egyptian/Arab caricatures.'),
  'Porky and Teabiscuit':            m([1, 0, 1, 2, 1, 1, 0, 1, 2, 1], ['sports'], 0, 'l'),
  'Pigs Is Pigs':                    m([2, 0, 3, 2, 2, 1, 3, 1, 0, 4], ['surreal', 'horror'], 1, 'm'),
  'Pigs in a Polka':                 m([3, 1, 2, 3, 3, 5, 0, 0, 0, 2], ['music', 'fairytale'], 2, 'm', 'The wolf\'s "gypsy" disguise draws on period stereotypes.'),
  "Porky Pig's Feat":                m([3, 0, 1, 3, 3, 0, 0, 3, 0, 1], ['rivalry'], 1, 'm'),
  'Daffy Duck Slept Here':           m([2, 0, 3, 3, 3, 0, 0, 4, 0, 2], [], 1, 'm'),
  'Bye, Bye Bluebeard':              m([3, 0, 2, 3, 3, 0, 2, 2, 1, 2], ['horror', 'fairytale'], 1, 'l'),
  'An Egg Scramble':                 m([2, 0, 1, 3, 2, 0, 0, 2, 3, 1], ['chase'], 0, 'l'),
  'Robin Hood Daffy':                m([3, 0, 1, 3, 5, 0, 0, 5, 0, 2], ['fairytale'], 3, 'h'),
  'The Windblown Hare':              m([3, 0, 2, 3, 3, 0, 0, 3, 0, 2], ['fairytale', 'rivalry'], 2, 'm'),
  'Claws for Alarm':                 m([3, 0, 2, 2, 3, 1, 4, 1, 2, 2], ['horror'], 2, 'm'),
  'Rocket Squad':                    m([2, 0, 2, 3, 4, 1, 0, 4, 0, 2], ['scifi', 'hollywood'], 2, 'm'),

  // ── Volume 3 · Disc 4 ──
  'Daffy Duck and the Dinosaur':     m([2, 0, 2, 3, 2, 1, 0, 2, 0, 2], ['rivalry'], 1, 'm'),
  'Super-Rabbit':                    m([3, 1, 2, 3, 3, 1, 0, 3, 0, 2], ['wartime', 'western', 'rivalry'], 2, 'm', 'A 1943 morale cartoon; ends with Bugs enlisting in the Marines.'),
  'Daffy Duck & Egghead':            m([2, 1, 3, 4, 3, 1, 0, 3, 0, 3], ['meta', 'rivalry'], 1, 'm'),
  'A Gruesome Twosome':              m([3, 0, 3, 4, 2, 1, 0, 2, 0, 3], ['chase', 'rivalry'], 1, 'm'),
  'Draftee Daffy':                   m([3, 1, 3, 4, 3, 1, 1, 4, 0, 3], ['wartime'], 2, 'm', 'Wartime draft-dodging comedy from 1945.'),
  'Falling Hare':                    m([3, 1, 3, 4, 3, 0, 1, 3, 0, 3], ['wartime', 'meta', 'rivalry'], 3, 'h', 'Set on a WWII airfield; includes period wartime jokes.'),
  'Steal Wool':                      m([4, 0, 2, 2, 4, 0, 0, 0, 1, 2], ['rivalry'], 2, 'm'),
  'Birds Anonymous':                 m([2, 0, 2, 3, 4, 1, 0, 3, 2, 2], ['rivalry'], 3, 'h'),
  'No Barking':                      m([2, 0, 1, 3, 2, 0, 0, 1, 2, 1], [], 1, 'l'),
  'Rabbit Punch':                    m([4, 0, 2, 3, 3, 0, 0, 3, 0, 2], ['sports', 'meta', 'rivalry'], 2, 'm'),
  'An Itch in Time':                 m([3, 0, 3, 4, 2, 1, 0, 2, 0, 3], ['surreal'], 2, 'm'),
  'Odor-able Kitty':                 m([2, 2, 2, 3, 3, 1, 0, 3, 1, 2], ['chase'], 1, 'm', 'The premise is Pepé\'s persistent romantic pursuit of an unwilling, fleeing partner.'),
  'Walky Talky Hawky':               m([3, 0, 1, 3, 3, 0, 0, 5, 1, 1], ['rivalry'], 3, 'h'),
  "Gonzales' Tamales":               m([3, 2, 1, 4, 2, 1, 0, 2, 0, 1], ['chase', 'rivalry'], 2, 'm', 'Mexican stereotypes are built into the premise.'),
  'To Beep or Not to Beep':          m([5, 0, 2, 3, 3, 1, 0, 0, 0, 2], ['chase'], 2, 'h'),

  // ── Volume 4 · Disc 1 ──
  'Roman Legion-Hare':               m([4, 0, 1, 3, 3, 0, 0, 4, 0, 1], ['rivalry'], 2, 'm'),
  'The Grey Hounded Hare':           m([2, 0, 2, 3, 2, 0, 0, 2, 2, 2], ['sports'], 1, 'm'),
  'Rabbit Hood':                     m([3, 0, 2, 3, 4, 0, 0, 3, 0, 2], ['fairytale', 'hollywood', 'meta', 'rivalry'], 3, 'h'),
  'Operation: Rabbit':               m([4, 0, 2, 3, 4, 0, 0, 4, 0, 1], ['scifi', 'rivalry'], 3, 'h'),
  'Knight-mare Hare':                m([3, 0, 4, 3, 4, 1, 1, 3, 0, 3], ['fairytale', 'surreal'], 2, 'm'),
  'Southern Fried Rabbit':           m([4, 4, 1, 3, 3, 2, 0, 4, 0, 1], ['rivalry'], 2, 'h', 'Includes a sequence of Bugs in blackface and Civil War "Old South" imagery; it was cut from the later Spotlight Collection release.'),
  'Mississippi Hare':                m([3, 3, 1, 3, 3, 2, 0, 3, 0, 1], ['rivalry'], 2, 'm', 'Old South riverboat setting with a blackface gag and stereotyped imagery.'),
  'Hurdy-Gurdy Hare':                m([3, 0, 1, 3, 2, 3, 0, 2, 0, 1], ['music', 'rivalry'], 1, 'm'),
  'Forward March Hare':              m([3, 0, 1, 3, 3, 1, 0, 3, 0, 1], ['rivalry'], 1, 'm'),
  'Sahara Hare':                     m([4, 1, 1, 3, 3, 0, 0, 4, 0, 1], ['rivalry'], 2, 'm', 'Desert "Arab" costume caricature for Sam.'),
  'Barbary-Coast Bunny':             m([3, 0, 1, 3, 4, 0, 0, 3, 0, 1], ['western', 'rivalry'], 2, 'm'),
  'To Hare Is Human':                m([4, 0, 2, 3, 4, 0, 0, 3, 0, 2], ['scifi', 'rivalry'], 2, 'm'),
  '8 Ball Bunny':                    m([2, 0, 2, 3, 3, 0, 0, 3, 3, 2], ['hollywood'], 2, 'm'),
  'Knighty Knight Bugs':             m([4, 0, 2, 3, 3, 1, 0, 4, 0, 1], ['fairytale', 'rivalry'], 3, 'h'),
  'Rabbit Romeo':                    m([2, 1, 1, 3, 3, 0, 0, 3, 1, 1], ['rivalry'], 1, 'm', 'Jokes about Millicent\'s size and looks.'),

  // ── Volume 4 · Disc 2 ──
  'The Case of the Stuttering Pig':  m([2, 0, 2, 3, 2, 1, 4, 2, 0, 3], ['horror', 'meta'], 1, 'm'),
  'Little Pancho Vanilla':           m([1, 3, 1, 2, 1, 2, 0, 2, 3, 1], ['sports'], 0, 'l', 'Built on Mexican stereotypes.'),
  'Little Beau Porky':               m([2, 2, 1, 3, 2, 1, 0, 2, 1, 2], ['rivalry'], 0, 'l', 'Arab-bandit caricatures.'),
  'Now That Summer Is Gone':         m([1, 0, 1, 1, 2, 3, 0, 2, 3, 1], ['music'], 0, 'l'),
  'Porky in the North Woods':        m([2, 0, 1, 2, 2, 1, 0, 2, 2, 1], ['rivalry'], 0, 'l'),
  "You're an Education":             m([1, 2, 3, 3, 3, 4, 0, 2, 1, 3], ['music', 'surreal'], 0, 'l', 'Its tour of the globe leans on period national and ethnic caricatures.'),
  "Porky's Railroad":                m([2, 0, 2, 3, 2, 1, 0, 1, 2, 2], ['sports'], 0, 'l'),
  'Plane Daffy':                     m([3, 2, 2, 4, 4, 1, 0, 4, 0, 3], ['wartime'], 1, 'm', 'WWII propaganda-era spy spoof, with Nazi caricatures.'),
  'Porky the Fireman':               m([3, 0, 2, 4, 1, 1, 0, 1, 1, 2], [], 0, 'l'),
  'Cracked Ice':                     m([2, 1, 2, 2, 2, 1, 0, 3, 1, 2], ['sports'], 0, 'l', 'Built on drinking-and-drunkenness gags.'),
  "Puss n' Booty":                   m([2, 0, 1, 2, 3, 0, 1, 1, 0, 2], ['rivalry'], 0, 'l'),
  'I Got Plenty of Mutton':          m([2, 0, 2, 3, 3, 1, 0, 2, 0, 2], ['rivalry'], 0, 'l'),
  'Booby Hatched':                   m([2, 0, 3, 3, 2, 1, 0, 2, 3, 3], ['chase'], 0, 'l'),
  'Unruly Hare':                     m([3, 0, 2, 3, 3, 1, 0, 3, 0, 2], ['rivalry'], 1, 'm'),
  'The Stupid Cupid':                m([2, 0, 2, 3, 3, 1, 0, 3, 1, 2], ['holiday'], 1, 'm'),

  // ── Volume 4 · Disc 3 ──
  'Cat-Tails for Two':               m([2, 2, 1, 3, 2, 1, 0, 3, 0, 1], ['chase'], 0, 'l', 'Early, stereotyped version of Speedy.'),
  'Tabasco Road':                    m([2, 3, 1, 3, 2, 2, 0, 3, 2, 1], ['chase'], 1, 'l', 'Centered on drunken Mexican mice; heavy period stereotyping.'),
  'Tortilla Flaps':                  m([3, 2, 1, 3, 2, 2, 0, 2, 1, 1], ['chase', 'holiday'], 0, 'l', 'Mexican stereotypes throughout.'),
  'Mexicali Shmoes':                 m([3, 3, 1, 3, 2, 1, 0, 3, 0, 1], ['chase', 'rivalry'], 1, 'm', 'Stereotyped Mexican cats and mice.'),
  'Here Today, Gone Tamale':         m([3, 3, 1, 3, 2, 1, 0, 2, 0, 1], ['chase', 'rivalry'], 1, 'm', 'Its starving-mice premise and stereotypes led to it being dropped from some later releases.'),
  'West of the Pesos':               m([3, 2, 1, 3, 2, 1, 0, 2, 1, 1], ['chase', 'rivalry'], 0, 'l', 'Mexican stereotypes throughout.'),
  'Cannery Woe':                     m([3, 2, 1, 3, 2, 1, 0, 3, 0, 1], ['chase', 'rivalry'], 0, 'l', 'Mexican stereotypes throughout.'),
  'The Pied Piper of Guadalupe':     m([3, 2, 1, 3, 3, 3, 0, 2, 0, 1], ['chase', 'music', 'fairytale'], 1, 'm', 'Mexican stereotypes throughout.'),
  'Mexican Boarders':                m([3, 2, 1, 3, 3, 1, 0, 3, 1, 1], ['chase', 'rivalry'], 1, 'm', 'Mexican stereotypes throughout.'),
  'Chili Weather':                   m([3, 2, 2, 3, 2, 1, 0, 2, 0, 2], ['chase', 'rivalry'], 0, 'l', 'Mexican stereotypes throughout.'),
  'A Message to Gracias':            m([3, 2, 1, 3, 2, 1, 0, 2, 0, 1], ['chase', 'rivalry'], 0, 'l', 'Mexican stereotypes throughout.'),
  'Nuts and Volts':                  m([3, 2, 2, 3, 3, 1, 0, 2, 0, 2], ['scifi', 'chase', 'rivalry'], 0, 'l', 'Mexican stereotypes throughout.'),
  "Pancho's Hideaway":               m([3, 2, 1, 3, 2, 1, 0, 3, 0, 1], ['western', 'rivalry'], 0, 'l', 'Mexican-bandit caricature for Yosemite Sam.'),
  'The Wild Chase':                  m([4, 1, 1, 4, 2, 1, 0, 1, 0, 2], ['sports', 'chase'], 1, 'm'),
  'A-Haunting We Will Go':           m([2, 1, 3, 3, 3, 1, 3, 3, 1, 2], ['horror', 'holiday'], 1, 'm'),

  // ── Volume 4 · Disc 4 ──
  'The Night Watchman':              m([2, 1, 1, 2, 1, 2, 1, 2, 4, 1], [], 0, 'l'),
  'Conrad the Sailor':               m([3, 0, 2, 3, 2, 1, 0, 2, 0, 2], ['rivalry'], 0, 'l'),
  'The Sour Puss':                   m([2, 1, 2, 3, 2, 1, 1, 2, 0, 3], ['rivalry'], 0, 'l', 'Includes a cat\'s attempted-suicide gag; it was cut from the Spotlight Collection release.'),
  'The Aristo-Cat':                  m([2, 0, 1, 2, 3, 1, 1, 3, 1, 2], ['rivalry'], 1, 'm'),
  'Dough Ray Me-ow':                 m([3, 0, 1, 3, 3, 0, 0, 3, 0, 2], ['rivalry'], 0, 'l'),
  'Pizzicato Pussycat':              m([1, 0, 2, 2, 3, 5, 0, 1, 2, 2], ['music'], 0, 'l'),
  'Kiss Me Cat':                     m([2, 0, 1, 2, 3, 1, 0, 1, 4, 1], [], 1, 'm'),
  'Cat Feud':                        m([3, 0, 1, 3, 3, 0, 0, 0, 3, 1], ['rivalry'], 1, 'm'),
  'The Unexpected Pest':             m([2, 0, 1, 2, 3, 0, 0, 3, 2, 1], [], 0, 'l'),
  'Go Fly a Kit':                    m([2, 0, 3, 2, 3, 1, 0, 2, 4, 3], [], 1, 'l'),
  "Kiddin' the Kitten":              m([2, 0, 1, 2, 3, 0, 0, 3, 2, 1], [], 0, 'l'),
  "A Peck o' Trouble":               m([3, 0, 1, 3, 2, 0, 0, 2, 0, 1], ['rivalry'], 0, 'l'),
  'Mouse and Garden':                m([3, 0, 1, 2, 3, 0, 0, 3, 1, 1], ['rivalry'], 0, 'l'),
  "Porky's Poor Fish":               m([2, 0, 2, 3, 2, 1, 0, 1, 1, 2], ['rivalry'], 0, 'l'),
  'Swallow the Leader':              m([3, 0, 1, 2, 2, 0, 0, 0, 0, 1], ['rivalry'], 0, 'l'),
};
