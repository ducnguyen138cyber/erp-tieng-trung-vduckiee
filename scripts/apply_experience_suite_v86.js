const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
const tag = '  <script src="./assets/v86/experience-suite-loader-v86.js?v=86.2"></script>';

index = index.replace(/\s*<script src="\.\/assets\/v86\/experience-suite-loader-v86\.js\?v=[^"]+"><\/script>/g, '');
index = index.replace(/<script src="\.\/community\.js\?v=[^"]+"><\/script>/, '<script src="./community.js?v=86.2"></script>');
index = index.replace(/\s*<\/body>/, `\n${tag}\n</body>`);

if (!index.includes('experience-suite-loader-v86.js?v=86.2') || !index.includes('community.js?v=86.2')) {
  throw new Error('Không thể gắn bố cục trang chủ v86.2 vào index.html.');
}

fs.writeFileSync(indexPath, index, 'utf8');
console.log('Applied compact home dashboard v86.2');
