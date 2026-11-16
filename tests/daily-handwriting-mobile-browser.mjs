import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

// Reproduce the Daily ERP handwriting page without needing auth or any remote
// stroke dataset. This is the exact missing-data state reported on iPhone PWA.
await mkdir('artifacts/daily-handwriting', { recursive: true });
const terms = [
  ['导入', 'dǎo rù', '', 'nhập dữ liệu', 'Kho', 'Dùng trong kho'],
  ['入库', 'rù kù', '', 'nhập kho', 'Kho', 'Dùng trong kho'],
  ['生产', 'shēng chǎn', '', 'sản xuất', '生产', 'Dùng tại xưởng'],
  ['库存', 'kù cún', '', 'tồn kho', 'Kho', 'Dùng trong kho'],
  ['工单', 'gōng dān', '', 'lệnh sản xuất', '生产', 'Dùng tại xưởng']
];
async function painted(page) {
  return page.locator('#dailyInkCanvas').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let nonTransparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonTransparent++;
    return nonTransparent;
  });
}
async function boot(page) {
  await page.route('https://daily-writing.test/', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body><div class="shell"><div class="study-layout"><div class="study-center"><main></main></div></div></div></body></html>'
  }));
  await page.goto('https://daily-writing.test/');
  await page.evaluate(data => { window.ERP_TERMS = data; }, terms);
  await page.addStyleTag({ path: resolve('assets/daily-learning-v2.css') });
  await page.addStyleTag({ path: resolve('assets/daily-handwriting-v1.css') });
  await page.addStyleTag({ path: resolve('assets/ai/duckie-chat.css') });
  await page.addScriptTag({ path: resolve('assets/daily-learning-freehand-v1.js') });
  await page.addScriptTag({ path: resolve('assets/ai/duckie-chat.js') });
  await page.addScriptTag({ path: resolve('assets/daily-learning-v2.js') });
  await page.evaluate(() => window.VDuckieDailyLearning.show('daily'));
  await page.locator('[data-session-next]').click();
  await page.locator('#dailyInkCanvas').waitFor({ state: 'visible' });
  assert.match(await page.locator('#dailyWritingStatus').innerText(), /viết tự do/i);
  assert.equal(await page.locator('[data-writing-replay]').isDisabled(), true,
    'missing verified stroke paths may disable preview but not freehand input');
  assert.equal(await page.locator('[data-writing-practice]').isEnabled(), true,
    'finger writing must never depend on verified HanziWriter paths');
}
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true });
  try {
    for (const width of [320, 390, 430]) {
      const page = await browser.newPage({
        viewport: { width, height: 850 }, isMobile: true, hasTouch: true,
        deviceScaleFactor: 2
      });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await boot(page);
      assert.equal(await painted(page), 0, 'empty canvas begins transparent');
      const target = page.locator('#dailyInkCanvas'), box = await target.boundingBox();
      assert(box && box.width >= 195 && box.x >= 0 && box.x + box.width <= width + 2,
        'ink surface is fully on screen');
      assert.equal(await target.evaluate(el => getComputedStyle(el).touchAction), 'none',
        'iOS touch must draw instead of scrolling the lesson');
      await page.touchscreen.tap(box.x + box.width * .4, box.y + box.height * .4);
      assert((await painted(page)) > 0, 'real touchscreen tap must put visible ink on canvas');
      await page.locator('[data-writing-clear]').click();
      assert.equal(await painted(page), 0, 'erase removes ink without changing the lesson');
      // Draw a continuous finger stroke, not just a synthetic click.
      await target.evaluate(el => {
        const r = el.getBoundingClientRect();
        const pointer = (name, dx, dy) => el.dispatchEvent(new PointerEvent(name, {
          bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true,
          pointerId: 15, clientX: r.x + dx, clientY: r.y + dy
        }));
        pointer('pointerdown', 34, 35);
        for (let i = 0; i < 8; i++) pointer('pointermove', 34 + 12 * i, 35 + 14 * i);
        pointer('pointerup', 130, 147);
      });
      assert((await painted(page)) > 80, 'drag gesture must paint a continuous stroke');
      await page.screenshot({ path: `artifacts/daily-handwriting/${name}-${width}-written.png` });
      // Ensure chat is not a transparent click-blocking layer over navigation.
      assert.equal(await page.locator('.duckie-chat-launch').evaluate(el => getComputedStyle(el).display), 'none');
      assert.equal(await page.locator('.duckie-chat-panel').evaluate(el => getComputedStyle(el).display), 'none');
      const next = page.locator('[data-session-next]');
      assert.equal(await next.isEnabled(), true);
      const clickable = await next.evaluate(el => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return top === el || el.contains(top);
      });
      assert(clickable, 'Next button must be exposed at its center');
      await next.tap();
      assert.equal(await page.locator('.learning-session').count(), 1, 'Next advances to a new Daily step');
      assert.equal(await page.locator('#dailyInkCanvas').count(), 0, 'old ink handlers are cleaned on navigation');
      await page.locator('[data-session-exit]').tap();
      assert.notEqual(await page.locator('.duckie-chat-launch').evaluate(el => getComputedStyle(el).display), 'none',
        'chat returns when the learning session closes');
      assert.deepEqual(errors, [], 'no page runtime errors');
      await page.close();
    }
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 850 } });
    await boot(desktop);
    assert.notEqual(await desktop.locator('.duckie-chat-launch').evaluate(el => getComputedStyle(el).display), 'none',
      'desktop chat remains available');
    await desktop.close();
  } finally { await browser.close(); }
}
console.log('PASS: finger and stylus canvas without stroke data; clear; touch-action; Next unobstructed; Chromium/WebKit mobile and desktop');
