'use strict';

const path = require('node:path');
const mappingGenerator = require('./hsk1-progress-mapping-report');
const review = require('../assets/hsk-content/hsk-progress-review');

function generate(rootDirectory) {
  const root = path.resolve(rootDirectory || path.join(__dirname, '..'));
  const canonicalVocabulary = mappingGenerator.loadCanonicalVocabulary(root);
  const mappingReport = mappingGenerator.generate(root);
  return review.createReviewQueue({
    mappingReport,
    canonicalVocabulary
  });
}

if (require.main === module) {
  process.stdout.write(`${JSON.stringify(generate(process.cwd()), null, 2)}\n`);
}

module.exports = Object.freeze({ generate });
