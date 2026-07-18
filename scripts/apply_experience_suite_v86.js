const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
const loaderTag = '  <script src="./assets/v86/experience-suite-loader-v86.js?v=87.5"></script>';
const stabilityTag = '  <script src="./assets/home/home-layout-stability-v87.3.js?v=87.3"></script>';

index = index.replace(/\s*<script src="\.\/assets\/v86\/experience-suite-loader-v86\.js\?v=[^"]+"><\/script>/g, '');
index = index.replace(/\s*<script src="\.\/assets\/home\/home-layout-stability-v87\.[^"?]+\.js\?v=[^"]+"><\/script>/g, '');
index = index.replace(/<script src="\.\/community\.js\?v=[^"]+"><\/script>/, '<script src="./community.js?v=87.5"></script>');
index = index.replace(/\s*<\/body>/, `\n${loaderTag}\n${stabilityTag}\n</body>`);

if (!index.includes('experience-suite-loader-v86.js?v=87.5') || !index.includes('home-layout-stability-v87.3.js?v=87.3') || !index.includes('community.js?v=87.5')) {
  throw new Error('Không thể gắn bản ổn định layout v87.5 vào index.html.');
}

fs.writeFileSync(indexPath, index, 'utf8');
console.log('Applied stable home layout v87.5');
