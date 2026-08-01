'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const remove = relative => {
  const target = path.join(root, relative);
  if (fs.existsSync(target)) fs.rmSync(target, { force: true });
};

// These completed one-shot audio builders were wired to every PR and were the
// source of unrelated failed-run email spam. HSK Content Quality stays intact.
remove('.github/workflows/build-adam-clips.yml');
remove('.github/workflows/publish-adam-60.yml');

const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');

const cssAnchor = '<link rel="stylesheet" href="./assets/v106/mascot-polish-v106.css?v=106.1">';
const cssInsert = cssAnchor + '<link rel="stylesheet" href="./assets/v109/vduckie-level1-v109.css?v=109.0">';
if (!index.includes('./assets/v109/vduckie-level1-v109.css?v=109.0')) {
  if (!index.includes(cssAnchor)) throw new Error('Missing V106 CSS anchor in index.html');
  index = index.replace(cssAnchor, cssInsert);
}

const jsAnchor = '<script src="./assets/v99/vduckie-mascot-v99.js?v=100.0"><\\/script><script src="./assets/v94/customization-store-v94.js?v=96.0"><\\/script>';
const jsInsert = '<script src="./assets/v99/vduckie-mascot-v99.js?v=100.0"><\\/script><script src="./assets/v109/level1-manifest-v109.js?v=109.0"><\\/script><script src="./assets/v109/vduckie-level1-v109.js?v=109.0"><\\/script><script src="./assets/v94/customization-store-v94.js?v=96.0"><\\/script>';
if (!index.includes('./assets/v109/vduckie-level1-v109.js?v=109.0')) {
  if (!index.includes(jsAnchor)) throw new Error('Missing final mascot renderer anchor in index.html');
  index = index.replace(jsAnchor, jsInsert);
}

fs.writeFileSync(indexPath, index, 'utf8');

// The PR workflow checks this helper out only to apply the clean patch. Remove
// its staged state so it can be deleted without leaking an AD entry into main.
try {
  execFileSync('git', ['reset', '--', 'scripts/apply-lv1-maintenance-v109.js'], { cwd: root, stdio: 'ignore' });
} catch (error) {
  // Running outside Git is harmless; CI still removes the temporary file.
}

console.log('Applied workflow cleanup and Level 1 V109 boot wiring.');
