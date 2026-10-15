# Sources & verification notes

The inventory in `src/data/catalog.ts` covers the **main program** of the original
North American (Region 1) four-disc editions of *Looney Tunes Golden Collection*
Volumes 1–4 (2003–2006): 56 + 60 + 60 + 60 = **236 cartoons**. Bonus cartoons,
documentaries and featurettes are **not** included, because their disc locations
could not be verified to the same standard.

## How the listings were researched

The build environment could not open Wikipedia or ltrestorationguide.com
directly (its network policy blocked those hosts), so each disc was assembled
from web-search results that quote these sources, and cross-checked so that
every disc rests on at least two independent listings:

- Wikipedia: *Looney Tunes Golden Collection: Volume 1 / 2 / 3 / 4* (track
  tables and notes, as quoted in search results)
- Looney Tunes Wiki, Warner Bros. Entertainment Wiki and DVD Wiki (fandom.com)
  pages for each volume
- DVD Talk reviews (Volumes 2, 3 and 4), DVD Savant's Volume 2 review, Home
  Theater Forum's Volume 2 review, Animated Views' Volume 1 review
- Library catalog contents notes (UW–Madison, Orange County Library System)
- *Looney Tunes Center Stage* Volumes 1–2 (2014), straight reissues of
  Volume 1 Discs 3 and 4, whose published contents confirm those two discs
- The IMDb "Looney Tunes Golden Collection Volume 1" list, which annotates
  entries with their disc positions

Years and directors are the standard filmography credits. Characters and
synopses come from general knowledge of the shorts, checked against episode
summaries where I was less sure (*Swallow the Leader*, *Booby Hatched*,
*Tortilla Flaps*, *Porky Chops*).

## Per-disc notes

| Disc | Theme | Verification |
|---|---|---|
| V1 D1 | Best of Bugs Bunny | Wikipedia table (1–7) plus library catalog and fan wiki (8–14) agree. |
| V1 D2 | Best of Daffy & Porky | Two fan-wiki listings agree. The IMDb list confirms *The Ducksters* is 5th. |
| V1 D3 | All-Stars Part 1 | The Center Stage Vol. 1 reissue lists all 14. Wikipedia's note "1–12 Chuck Jones (10 co-directed by Abe Levitow), 13–14 Bob Clampett" matches. |
| V1 D4 | All-Stars Part 2 | Animated Views review plus fan wiki ("first nine Freleng, last five McKimson") agree. |
| V2 D1 | Bugs Bunny Masterpieces | DVD Talk, DVD Savant and HTF agree. The order is roughly alphabetical, not chronological. |
| V2 D2 | Road Runner and Friends | DVD Savant and a wiki list agree on all 15. |
| V2 D3 | Tweety & Sylvester and Friends | Library catalog (1–11 with years) plus fan wiki (12–15). |
| V2 D4 | All-Stars: On Stage and Screen | DVD Savant and the DVD Wiki chapter list agree. |
| V3 D1 | Bugs Bunny Classics | Fan-wiki table with years and directors. A second wiki table matches the first five. |
| V3 D2 | Hollywood Caricatures and Parodies | Looney Tunes Wiki listing, with the first five confirmed by DVD Talk. |
| V3 D3 | Porky and the Pigs | DVD Wiki chapter list. Heykidscomics wiki confirms #15 *Rocket Squad*. |
| V3 D4 | All-Stars Cartoon Party | Two fan-wiki lists agree on 1–12 and the full 15. Wikipedia notes that the single-disc version replaced *Gonzales' Tamales*, confirming it belongs here. |
| V4 D1 | Bugs Bunny Favorites | Fan wiki and DVD Talk agree on all 15. |
| V4 D2 | A Dash of Tashlin | The DVD Talk review lists all 15 in order. DVDCompare's commentary list mentions *Porky's Poultry Plant*, but that title is not in the main program and is treated as a bonus item. |
| V4 D3 | Speedy Gonzales | Warner wiki (1–5) plus Looney Tunes Wiki (6–15, ending *A-Haunting We Will Go*). The only disc in strict chronological order. |
| V4 D4 | Kitty Korner | DVD Talk and DVDCompare agree. A library catalog lists the same run. |

## Unresolved or uncertain points

1. **Volume 1 Disc 3, #12.** One fan-wiki excerpt mentions *A Bear for
   Punishment* on this disc. The Center Stage reissue lists *Don't Give Up the
   Sheep* instead, and *A Bear for Punishment* is independently confirmed as
   Volume 2 Disc 2 #15. The catalog follows the reissue.
2. **Positions on Volume 2 Discs 1 and 4** come from reviewers' menu listings,
   not from Wikipedia directly. Three sources agree, but the order is unusual
   (mostly alphabetical with exceptions). Check it against the disc menu.
3. **Disc theme names** follow the fan wikis and reviews. Packaging wording may
   differ slightly.
4. **Running times have not been individually verified.** The app shows an
   era-typical estimate (≈7 min; ≈6 min for 1960s shorts) and labels it
   "(est.)". Add a verified `minutes:` value to any entry to override it.
5. **Chronological order.** The brief asked to verify chronological order on
   each DVD. The real discs are **not** chronological: they follow each disc's
   menu order (themes, alphabetical runs, pairings). The catalog records that
   real menu order, because the menu position is what you need at the player.
   `npm test` prints which discs are out of date order.
6. **Mood ratings** are one editor's subjective scores against the rubric in
   `src/data/ratings.ts`. Entries marked `'l'` (low confidence) were rated
   mainly from synopsis and reputation.

## Quick physical audit

The fastest way to settle points 1–3 is to put each disc in and compare its
menu against the Card Catalog sorted by "Volume / disc / position". To fix a
position, edit `catalog.ts`, then run `npm test`: it fails if any location is
duplicated, skipped, or left without a rating.
