const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.join(__dirname, '..', 'index.html');
const current = fs.readFileSync(indexPath, 'utf8');
const next = current.replace(
  /<script src="\.\/supabase-sync\.js\?v=[^"]+"><\/script>/,
  '<script src="./supabase-sync.js?v=81.0"></script>'
);

if (next === current && !current.includes('./supabase-sync.js?v=81.0')) {
  throw new Error('Không tìm thấy thẻ supabase-sync.js để tăng phiên bản v81.0.');
}

fs.writeFileSync(indexPath, next, 'utf8');
console.log('supabase-sync.js cache key: v81.0');
