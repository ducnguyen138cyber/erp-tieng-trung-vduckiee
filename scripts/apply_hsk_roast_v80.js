const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.join(__dirname, '..', 'index.html');
const current = fs.readFileSync(indexPath, 'utf8');
const next = current.replace(
  /<script src="\.\/community\.js\?v=[^"]+"><\/script>/,
  '<script src="./community.js?v=80.1"></script>'
);

if (next === current && !current.includes('./community.js?v=80.1')) {
  throw new Error('Không tìm thấy thẻ community.js để tăng phiên bản v80.1.');
}

fs.writeFileSync(indexPath, next, 'utf8');
console.log('community.js cache key: v80.1');
