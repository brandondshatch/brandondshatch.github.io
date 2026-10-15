// Visual QA: drives the built app in Chromium at several widths, spins the
// wheel, opens overlays and saves screenshots to ./qa-screenshots.
//   npm run build && npx vite preview --port 4173 &  node scripts/qa-screenshots.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.QA_URL ?? 'http://localhost:4173/';
const OUT = 'qa-screenshots';
mkdirSync(OUT, { recursive: true });


const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const sizes = [
  ['desktop', 1440, 1000],
  ['tablet-landscape', 1180, 820],
  ['tablet-portrait', 820, 1180],
  ['mobile', 390, 844],
];
const errors = [];
for (const [name, width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name} console: ${m.text()}`));
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-1-machine.png`, fullPage: false });
  await page.screenshot({ path: `${OUT}/${name}-1b-machine-full.png`, fullPage: true });
  // Engage a preset and spin
  await page.getByRole('button', { name: /Maximum ACME Damage/ }).click();
  await page.getByRole('button', { name: /Spin the Wheel!/ }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}-2-spinning.png` });
  await page.waitForSelector('.reveal-overlay', { timeout: 12000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/${name}-3-reveal.png` });
  const loc = await page.locator('.reveal-overlay .loc-stamp').innerText();
  const title = await page.locator('.reveal-overlay .ticket-title').innerText();
  console.log(name, '→', loc.replace(/\s+/g, ' '), '|', title);
  await page.keyboard.press('Escape');
  // Triple feature
  await page.getByRole('button', { name: /Triple Feature/ }).click();
  await page.waitForSelector('.triple-overlay');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}-4-triple.png` });
  await page.keyboard.press('Escape');
  // Catalog
  await page.getByRole('tab', { name: /Card Catalog/ }).click();
  await page.getByLabel('Search the catalog').fill('1940s black-and-white Porky');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}-5-catalog.png` });
  await page.locator('.stub').first().click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}-6-card.png` });
  await page.close();
}

// ── behaviour checks (desktop) ──
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (e) => errors.push(`behaviour: ${e.message}`));
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const check = (cond, msg) => {
    if (!cond) errors.push('FAILED: ' + msg);
    else console.log('ok -', msg);
  };

  // B&W filter through the real UI; every spin result must be B&W
  await page.locator('summary', { hasText: 'Presentation' }).click();
  await page.getByRole('radio', { name: 'Black & White' }).click();
  const hopper = await page.locator('.hopper-n').innerText();
  check(hopper === '18', `B&W hopper shows 18 (got ${hopper})`);
  await page.getByRole('button', { name: /Motion:/ }).click(); // → calm, fast spins
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: /Spin the Wheel!/ }).click();
    await page.waitForSelector('.reveal-overlay', { timeout: 5000 });
    const meta = await page.locator('.reveal-overlay .meta-line').innerText();
    check(/Black & white/.test(meta), `spin ${i + 1} is black-and-white`);
    await page.keyboard.press('Escape');
  }
  // Conflicting constraints → no-match diagnosis
  await page.locator('summary', { hasText: 'Characters' }).click();
  await page.getByRole('button', { name: 'Speedy Gonzales', exact: true }).click();
  await page.getByRole('button', { name: /Spin the Wheel!/ }).click();
  await page.waitForSelector('.no-match');
  await page.locator('.no-match').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/behaviour-no-match.png` });
  check((await page.locator('.no-match li').count()) === 2, 'no-match lists the two conflicting constraints');
  await page.locator('.no-match button', { hasText: 'Presentation' }).click();
  check((await page.locator('.hopper-n').innerText()) === '17', 'lifting Presentation leaves the 17 Speedy cartoons');

  // Persistence: favorite + watched survive reload
  await page.getByRole('tab', { name: /Card Catalog/ }).click();
  await page.getByLabel('Search the catalog').fill('Duck Amuck');
  await page.waitForTimeout(300);
  const first = page.locator('.stub').first();
  await first.getByRole('button', { name: 'Add to favorites' }).click();
  await first.getByRole('button', { name: 'Mark watched' }).click();
  await page.reload();
  await page.getByRole('tab', { name: /Tonight/ }).click();
  const tonight = await page.locator('.tonight').innerText();
  check(/Favorites[\s\S]*Duck Amuck/.test(tonight), 'favorite persisted across reload');
  check(/Recently Watched[\s\S]*Duck Amuck/.test(tonight), 'watched history persisted across reload');
  await page.screenshot({ path: `${OUT}/behaviour-tonight.png`, fullPage: true });
  await page.close();
}

await browser.close();
if (errors.length) {
  console.error('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('QA screenshots written to', OUT);
