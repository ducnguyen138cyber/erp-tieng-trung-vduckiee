const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
const tag = '  <script src="./assets/v86/experience-suite-loader-v86.js?v=86.3"></script>';

index = index.replace(/\s*<script src="\.\/assets\/v86\/experience-suite-loader-v86\.js\?v=[^"]+"><\/script>/g, '');
index = index.replace(/<script src="\.\/community\.js\?v=[^"]+"><\/script>/, '<script src="./community.js?v=86.3"></script>');
index = index.replace(/\s*<\/body>/, `\n${tag}\n</body>`);

if (!index.includes('experience-suite-loader-v86.js?v=86.3') || !index.includes('community.js?v=86.3')) {
  throw new Error('Không thể gắn bản sửa bố cục trang chủ v86.3 vào index.html.');
}

fs.writeFileSync(indexPath, index, 'utf8');
console.log('Applied home layout cleanup v86.3');
