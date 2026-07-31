'use strict';
const fs = require('node:fs');
const { chromium } = require('playwright');

const base = process.env.HSK_SMOKE_BASE_URL || 'http://127.0.0.1:4173/';
const result = { base, desktop: {}, mobile: {}, consoleErrors: [] };

async function waitReady(page) {
  await page.waitForFunction(() => document.body && document.body.getAttribute('data-hsk-prof-ready') === 'true', null, { timeout: 20000 });
  return page.evaluate(() => window.VDuckieHskProfessionalRuntime && window.VDuckieHskProfessionalRuntime.getState());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    desktop.on('console', (msg) => { if (msg.type() === 'error') result.consoleErrors.push('desktop: ' + msg.text()); });
    await desktop.goto(base + '?area=hsk', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const dState = await waitReady(desktop);
    result.desktop.state = dState;
    if (!dState || dState.readOnly !== true || dState.progressWritesEnabled !== false) throw new Error('Desktop runtime is not read-only.');
    const expected = { units: 10, lessons: 24, grammar: 21, characters: 50, exercises: 120, assessments: 13, vocabulary: 300 };
    for (const [key, value] of Object.entries(expected)) if (dState.counts[key] !== value) throw new Error(`Desktop count ${key}: ${dState.counts[key]} != ${value}`);

    if (await desktop.locator('.hsk-pro-unit').count() !== 10) throw new Error('Desktop unit list is incomplete.');
    if (await desktop.locator('[data-pro-lesson]').count() !== 24) throw new Error('Desktop lesson list is incomplete.');
    if (await desktop.locator('[data-pro-assessment]').count() !== 13) throw new Error('Desktop assessment list is incomplete.');
    await desktop.locator('#hskLesson').getByText('Nghe rõ bốn thanh', { exact: true }).waitFor();
    await desktop.locator('#hskLesson').getByText('听清四声', { exact: true }).waitFor();

    await desktop.locator('[data-pro-lesson="hsk1-lesson-02"]').click();
    await desktop.locator('#hskLesson').getByText('Viết nhóm chữ đầu tiên', { exact: true }).waitFor();
    await desktop.locator('[data-pro-prev]').click();
    await desktop.locator('#hskLesson').getByText('Nghe rõ bốn thanh', { exact: true }).waitFor();

    const firstExercise = desktop.locator('[data-pro-exercise="hsk1-lesson-01-exercise-1"]');
    await firstExercise.locator('[data-pro-input-for="hsk1-lesson-01-exercise-1"]').fill('一、七、八、十');
    await firstExercise.locator('[data-pro-check="hsk1-lesson-01-exercise-1"]').click();
    await firstExercise.locator('[data-pro-feedback="hsk1-lesson-01-exercise-1"]').getByText('Đúng.', { exact: true }).waitFor();

    await desktop.locator('[data-pro-assessment="hsk1-assessment-unit-01"]').click();
    await desktop.locator('#hskLesson').getByText(/Checkpoint Unit 1/).waitFor();
    await desktop.locator('[data-pro-assessment="hsk1-assessment-final"]').click();
    await desktop.locator('#hskLesson').getByText(/Final/i).first().waitFor();
    result.desktop.currentUrl = desktop.url();
    result.desktop.overflow = await desktop.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await desktop.screenshot({ path: '/tmp/hsk1-c2-desktop.png', fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.on('console', (msg) => { if (msg.type() === 'error') result.consoleErrors.push('mobile: ' + msg.text()); });
    await mobile.goto(base + '?area=hsk&hskLesson=hsk1-lesson-24', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const mState = await waitReady(mobile);
    result.mobile.state = mState;
    await mobile.locator('#hskLesson').getByText(/Bài 24/i).first().waitFor();
    result.mobile.overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (result.mobile.overflow > 2) throw new Error('Mobile page has horizontal overflow: ' + result.mobile.overflow);
    const minButton = await mobile.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#hskLesson button:not([disabled])'));
      return buttons.length ? Math.min(...buttons.map((button) => button.getBoundingClientRect().height)) : 0;
    });
    result.mobile.minLessonButtonHeight = minButton;
    if (minButton && minButton < 40) throw new Error('Mobile lesson controls are too small: ' + minButton);
    await mobile.screenshot({ path: '/tmp/hsk1-c2-mobile.png', fullPage: true });

    fs.writeFileSync('/tmp/hsk1-c2-browser-smoke.json', JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  result.error = error && error.stack || String(error);
  try { fs.writeFileSync('/tmp/hsk1-c2-browser-smoke.json', JSON.stringify(result, null, 2) + '\n'); } catch (_) {}
  console.error(error);
  process.exit(1);
});
