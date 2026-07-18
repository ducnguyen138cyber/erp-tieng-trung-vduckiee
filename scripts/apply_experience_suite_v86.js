const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
const tag = '  <script src="./assets/v86/experience-suite-loader-v86.js?v=86.0"></script>';

index = index.replace(/\s*<script src="\.\/assets\/v86\/experience-suite-loader-v86\.js\?v=[^"]+"><\/script>/g, '');
index = index.replace(/\s*<\/body>/, `\n${tag}\n</body>`);

if (!index.includes('experience-suite-loader-v86.js?v=86.0')) {
  throw new Error('Không thể gắn gói trải nghiệm v83–v86 vào index.html.');
}
fs.writeFileSync(indexPath, index, 'utf8');
console.log('Applied experience suite v86.0');
