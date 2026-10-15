# The ACME Cartoon-O-Matic 4000

**Live:** https://brandon-hatch.com/cartoon-o-matic/

A ridiculously elaborate machine for deciding which cartoon to watch next
from **Looney Tunes Golden Collection Volumes 1–4** on DVD (Region 1).

Every pick tells you exactly where to find it:

```
VOLUME 3 · DISC 2 · CARTOON #7
The Film Fan
```

## Run it

You need Node.js 18 or newer.

```bash
cd _cartoon-o-matic-src
npm install
npm run dev          # http://localhost:5173 (add --host to open it from an iPad on the same Wi-Fi)
```

To build a static copy:

```bash
npm run build        # type-checks, then writes the site to ../cartoon-o-matic/
npm run preview      # serves that build at http://localhost:4173
```

There is no backend, no API key and no account. Fonts and data are bundled,
so searching and spinning work offline. The built site also registers a small
service worker, so it keeps working offline after the first visit. Watchlist,
watched history, favorites and settings are stored in the browser's
`localStorage`.

Tests and QA:

```bash
npm test                              # data integrity, selector, filters, search (38 tests)
npm run build && npm run preview &    # then:
node scripts/qa-screenshots.mjs       # drives Chromium at desktop/tablet/phone widths, saves ./qa-screenshots
```

## What's in the box

- **The Machine** is the wheel, the SPIN THE WHEEL! button, *Surprise Me*,
  *Triple Feature*, eight Special Modes, the ten-dial Mood Calibrator and
  the Hard Constraints Cabinet (presentation, era or exact years, characters,
  directors, themes, volumes and discs, fame, skip-watched).
- **Card Catalog** has live search over title, characters, director, year,
  decade, theme, description and location (`v3 d2`). Results sort by title,
  year, location or best mood match, and can optionally be filtered by the
  Cabinet and the mood dials.
- **Tonight's Bill** holds the watchlist (with "reorder by disc" to minimize
  swaps), favorites, recently watched, and the machine's recent picks.

## Where the data lives

| File | What it holds |
|---|---|
| `src/data/catalog.ts` | **Facts**: the 236 cartoons with volume, disc, position, title, year, directors, color/B&W, characters and synopsis. |
| `src/data/ratings.ts` | **Opinions**: ten mood scores (0–5), themes, fame, confidence and optional historical-context notes, keyed by exact title. |
| `src/data/characters.ts` | Star labels, search aliases and the "minor recurring characters" roster. |
| `SOURCES.md` | Where each disc listing was verified, plus known uncertainties. |

The two layers are separate on purpose. Fixing a year or a disc position in
`catalog.ts` never touches the ratings, and re-scoring a cartoon in
`ratings.ts` never touches where it lives.

### Correcting a cartoon

- **Wrong location, year, director or characters:** edit its row in
  `catalog.ts`. If you rename a title, rename its key in `ratings.ts` too.
- **Verified running time:** add `minutes: 7` (for example) to the row.
  Otherwise the app shows a labelled estimate.
- **Disagree with a mood score:** edit the number in `ratings.ts`. The
  column order and the 0–5 rubric for each dimension are documented at the
  top of the file.
- Then run `npm test`. It fails on a missing or duplicate location, a gap in
  positions, the wrong total, an out-of-range score, or a rating with no
  matching cartoon.

## How the weighted selector works (`src/lib/engine.ts`)

1. **Hard filters** decide who is eligible. They are strict, so a cartoon
   that fails one can never be picked or appear on the wheel.
   - Character and theme filters offer **Any of them** (at least one pick
     present) or **All together** (every pick in the same cartoon).
   - Directors match on any credited or co-credited director.
2. **Mood score.** Each *engaged* dial adds closeness:
   `1 − |rating − dial| / 5`. The score is the average across engaged dials.
   Idle dials are ignored completely, and with no dials engaged every
   cartoon scores 1.
3. **Weighted draw.** Each eligible cartoon gets weight
   `exp(12 × (score − 1))`, so a 100% match is about 3× as likely as a 90%
   match and about 11× as likely as an 80% match. Strong matches dominate,
   but long shots still win now and then. With no dials engaged the draw is
   uniform across all eligible cartoons (this is how *Dealer's Choice*
   works).
4. **The wheel** shows a shortlist of up to 12. The winner is drawn first
   from the **whole** eligible pool, then dropped into a random slot among
   11 more weighted draws, and the wheel decelerates onto it. The labels are
   theatre; the odds are real.
5. **Why this one?** lists the closest-matching dials and the constraints the
   winner satisfied.
6. **No match?** The machine lifts each active constraint in turn and reports
   how many cartoons would qualify, with one-click buttons to relax it.

The other buttons:

- **Spin Again** excludes the previous winner.
- **Surprise Me** randomizes two or three dials but keeps your hard
  constraints.
- **Find Similar** ranks all 236 by mood-vector distance, with small bonuses
  for shared stars, director and themes.
- **Triple Feature** picks three contrasting cartoons (about 20 minutes),
  favoring discs and volumes already chosen, and orders them by physical
  location to keep disc swaps to a minimum.

## Notes

- No parental controls, no hiding, no censorship. Political Incorrectness is
  a discovery dial like any other. Where it helps, the info card shows a
  short, factual **historical context** note (for example, the blackface
  sequence in *Southern Fried Rabbit*).
- Sound effects are synthesized live (Web Audio). There is a mute switch,
  and the Motion switch follows your system's reduced-motion setting by
  default (calm mode skips the spin animation).
- This is a fan-made companion and is not affiliated with Warner Bros. All
  illustrations are original CSS/SVG.

## Publishing

The source lives in `_cartoon-o-matic-src/`. `npm run build` writes the static
site to `cartoon-o-matic/` at the repository root, which GitHub Pages serves at
`/cartoon-o-matic/`. Commit both folders and push to `main` to publish.
