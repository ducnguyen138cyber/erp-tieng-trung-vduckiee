'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const base = process.env.BASE_URL;
const target = process.argv[2] || 'unknown';
const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '390x844', width: 390, height: 844 },
  { name: '320x568', width: 320, height: 568 }
];
const targets = [0, 25, 50, 75, 99];
const expected = { 0: 'resting', 25: 'first-crack', 50: 'peek', 75: 'ready', 99: 'ready' };
const report = { target, base, viewports: {}, failures: [] };

function fail(message) { throw new Error(message); }

async function waitApp(page) {
  await page.waitForFunction(() => window.VDuckieMascot && window.VDuckieProgressStore && document.querySelector('.v92-evolution-visual [data-v95-mascot]'), null, { timeout: 30000 });
}

async function expFor(page, percent) {
  return page.evaluate(targetPercent => {
    let best = null;
    for (let total = 0; total <= 5000; total += 1) {
      const state = window.VDuckieEXPCore.calculateUserLevel(total);
      if (state.level !== 1) break;
      const delta = Math.abs(Number(state.progressPercent) - targetPercent);
      if (!best || delta < best.delta) best = { total, delta, actual: Number(state.progressPercent) };
    }
    return best;
  }, percent);
}

async function setProgress(page, percent) {
  const match = await expFor(page, percent);
  if (!match) fail(`No Level 1 EXP match for ${percent}`);
  await page.evaluate(total => window.VDuckieProgressStore.setFromExistingEXP(total), match.total);
  await page.waitForTimeout(150);
  return match;
}

async function stateOf(page) {
  return page.locator('.v92-evolution-visual [data-v95-mascot]').first().evaluate(node => ({
    level: node.getAttribute('data-v95-level'),
    stage: node.getAttribute('data-v109-egg-stage'),
    progress: node.getAttribute('data-v109-egg-progress'),
    mode: node.getAttribute('data-v95-render-mode'),
    asset: node.getAttribute('data-v95-resolved-asset'),
    rect: node.getBoundingClientRect().toJSON(),
    documentWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    images: Array.from(node.querySelectorAll('img')).map(image => ({
      src: image.currentSrc || image.src,
      complete: image.complete,
      width: image.naturalWidth,
      height: image.naturalHeight
    }))
  }));
}

async function assertStage(page, percent) {
  const match = await setProgress(page, percent);
  const first = await stateOf(page);
  if (first.level !== '1') fail(`${percent}: expected Level 1, got ${first.level}`);
  if (first.stage !== expected[percent]) fail(`${percent}: expected ${expected[percent]}, got ${first.stage}`);
  if (first.mode !== 'svg-sequence-v109') fail(`${percent}: wrong render mode ${first.mode}`);
  if (first.documentWidth - first.viewport > 2) fail(`${percent}: horizontal overflow ${first.documentWidth - first.viewport}px`);
  if (first.images.some(image => !image.complete || image.width <= 0 || image.height <= 0)) fail(`${percent}: missing Level 1 asset`);
  await page.waitForTimeout(650);
  const second = await stateOf(page);
  if (Math.abs(first.rect.width - second.rect.width) > 1 || Math.abs(first.rect.height - second.rect.height) > 1) fail(`${percent}: layout shift`);
  return { requested: percent, exp: match, state: first };
}

async function transition(page) {
  await page.evaluate(() => {
    const old = document.getElementById('v109-smoke-host');
    if (old) old.remove();
    const host = document.createElement('div');
    host.id = 'v109-smoke-host';
    host.style.cssText = 'position:fixed;left:12px;bottom:12px;width:min(520px,calc(100vw - 24px));height:292px;z-index:9999;background:#f5f1e8;overflow:visible';
    host.innerHTML = window.VDuckieMascot.render({ level: 1, progressPercent: 99, animationState: 'hatching', size: 'large' });
    document.body.appendChild(host);
    window.VDuckieMascot.hydrate(host);
  });
  const mascot = page.locator('#v109-smoke-host [data-v95-mascot]');
  const before = await mascot.boundingBox();
  await page.waitForTimeout(1550);
  const after = await mascot.boundingBox();
  if (!before || !after || Math.abs(before.width - after.width) > 1 || Math.abs(before.height - after.height) > 1) fail('hatch transition layout shift');
  const previewOpacity = await page.locator('#v109-smoke-host .v109-hatch-preview').evaluate(node => Number(getComputedStyle(node).opacity));
  if (previewOpacity < 0.9) fail('Level 2 preview did not arrive');
  const final = await page.evaluate(() => {
    const host = document.getElementById('v109-smoke-host');
    host.innerHTML = window.VDuckieMascot.render({ level: 1, progressPercent: 100, animationState: 'idle', size: 'large' });
    window.VDuckieMascot.hydrate(host);
    const node = host.querySelector('[data-v95-mascot]');
    return {
      level: node.getAttribute('data-v95-level'),
      origin: node.getAttribute('data-v109-origin-level'),
      asset: node.getAttribute('data-v95-resolved-asset')
    };
  });
  if (final.level !== '2' || final.origin !== '1') fail('100% did not delegate to Level 2');
  if (!/lv2\/duckling-sprite-v103\.webp/.test(final.asset || '')) fail(`100% did not use current Level 2 asset: ${final.asset}`);
  await page.locator('#v109-smoke-host').evaluate(node => node.remove());
  return { before, after, final };
}

async function reloadDeterminism(page) {
  await setProgress(page, 50);
  const before = await stateOf(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitApp(page);
  await setProgress(page, 50);
  const after = await stateOf(page);
  if (before.stage !== 'peek' || after.stage !== 'peek') fail('reload did not derive the same EXP state');
  return { before: before.stage, after: after.stage };
}

async function interactionSmoke(page, viewport) {
  await page.evaluate(() => {
    const old = document.getElementById('v109-interaction-host');
    if (old) old.remove();
    const host = document.createElement('div');
    host.id = 'v109-interaction-host';
    host.style.cssText = 'position:fixed;right:12px;top:12px;width:min(520px,calc(100vw - 24px));height:292px;z-index:9999;background:#f5f1e8;overflow:visible';
    host.innerHTML = window.VDuckieMascot.render({ level: 1, progressPercent: 75, animationState: 'idle', size: 'large' });
    document.body.appendChild(host);
    window.VDuckieMascot.hydrate(host);
  });
  const mascot = page.locator('#v109-interaction-host [data-v95-mascot]');
  await mascot.waitFor({ state: 'visible' });
  const before = await mascot.boundingBox();
  if (viewport.width >= 500) await mascot.hover();
  else await mascot.tap();
  await page.waitForTimeout(120);
  const during = await mascot.boundingBox();
  await page.waitForTimeout(1200);
  const after = await mascot.boundingBox();
  for (const box of [during, after]) {
    if (!box || Math.abs(box.width - before.width) > 1 || Math.abs(box.height - before.height) > 1) fail('hover/tap changed container size');
  }
  await page.locator('#v109-interaction-host').evaluate(node => node.remove());
  return { before, during, after };
}

async function runViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.width < 500,
    hasTouch: viewport.width < 500,
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  try {
    await page.goto(`${base}?lv1Maintenance=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await waitApp(page);
    const stages = [];
    for (const percent of targets) stages.push(await assertStage(page, percent));
    const transitionResult = await transition(page);
    const reload = await reloadDeterminism(page);
    const interaction = await interactionSmoke(page, viewport);
    const critical = consoleErrors.filter(text => /v109|Level 1 egg renderer|egg-(resting|first-crack|peek|ready)\.svg|VDuckie mascot/i.test(text));
    if (critical.length) fail(`critical console errors: ${critical.join(' | ')}`);
    const screenshot = `/tmp/lv1-${target}-${viewport.name}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    return { pass: true, stages, transition: transitionResult, reload, interaction, consoleErrors, screenshot };
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of viewports) {
      try {
        report.viewports[viewport.name] = await runViewport(browser, viewport);
      } catch (error) {
        report.failures.push({ viewport: viewport.name, error: error.stack || String(error) });
        report.viewports[viewport.name] = { pass: false, error: error.stack || String(error) };
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(`/tmp/lv1-${target}.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
