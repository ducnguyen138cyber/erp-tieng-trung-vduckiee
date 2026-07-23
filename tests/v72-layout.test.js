const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { getRuntimeSnapshot, assertAssetLoaded } = require("./helpers/runtime-snapshot");

const root = path.resolve(__dirname, "..");
const snapshot = getRuntimeSnapshot();
const html = snapshot.effectiveHtml;
const css = fs.readFileSync(path.join(root, "v72-layout.css"), "utf8");
const hsk = fs.readFileSync(path.join(root, "hsk-lessons.js"), "utf8");

const ids = Array.from(snapshot.shellSource.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
assert.deepEqual(duplicates, [], `Duplicate IDs in app shell: ${duplicates.join(", ")}`);

for (const requiredId of [
  "studySidebar",
  "mobileMenu",
  "erpNav",
  "studyRail",
  "erpJourney",
  "hskJourney",
  "hskLevels",
  "hskProgress",
  "hskLessonList"
]) {
  assert.match(html, new RegExp(`id="${requiredId}"`), `Missing #${requiredId}`);
}

assertAssetLoaded(assert, "v72-layout.css", { snapshot });
assertAssetLoaded(assert, "hsk-lessons.js", { snapshot });
assert.ok(html.indexOf("study-sidebar") < html.indexOf("study-center"));
assert.ok(html.indexOf("study-center") < html.indexOf("study-rail"));

assert.match(css, /grid-template-columns:\s*230px\s+minmax\(0,\s*1fr\)\s+300px/);
assert.match(css, /@media \(max-width: 980px\)/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /\.study-rail \.hsk-levels::before/);

for (const label of ["Nền tảng", "HSK 1", "HSK 4", "HSK 7–9"]) {
  assert.ok(hsk.includes(`label: "${label}"`), `Missing roadmap label ${label}`);
}

console.log("v72 layout tests passed");
