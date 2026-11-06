const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const api=require('../scripts/hsk-duplicate-engine');
test('allocation-free Jaccard preserves the union-based definition including empty and asymmetric sets',()=>{
 let seed=27;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(let n=0;n<1000;n++){
  const a=new Set(Array.from({length:Math.floor(random()*18)},()=>Math.floor(random()*24)));
  const b=new Set(Array.from({length:Math.floor(random()*18)},()=>Math.floor(random()*24)));
  const union=new Set([...a,...b]);const old=union.size?[...a].filter(x=>b.has(x)).length/union.size:1;
  assert.equal(api.jaccard(a,b),old);assert.equal(api.jaccard(b,a),old);
 }
});
test('cached and bounded candidate scan preserves full current duplicate findings exactly',()=>{
 const before=JSON.parse(fs.readFileSync('reports/hsk-duplication-report.json','utf8'));
 assert.deepEqual(api.checkDuplicates(process.cwd()),before);
});
