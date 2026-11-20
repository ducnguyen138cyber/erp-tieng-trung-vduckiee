const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),S=require('../assets/games/sentence-engine.js');
const manifest=JSON.parse(fs.readFileSync('data/games/sentence-catalog.json'));const banks=manifest.levels.map(l=>JSON.parse(fs.readFileSync('data/games/'+l.file)).sentences);
test('six graded banks have thousands of complete, sourced prompts and valid playable Pinyin',()=>{
 assert.deepEqual(manifest.levels.map(l=>l.level),[1,2,3,4,5,6]);assert(manifest.total>=2400);
 for(const [i,bank] of banks.entries()){
  const meta=manifest.levels[i];assert(bank.length>=200);assert.equal(bank.length,meta.count);assert.equal(new Set(bank.map(x=>x.id)).size,bank.length);assert.equal(crypto.createHash('sha256').update(fs.readFileSync('data/games/'+meta.file)).digest('hex'),meta.sha256);
  for(const s of bank){assert.equal(s.level,i+1);assert.equal(s.topic,'hsk'+(i+1));assert.ok(s.sources.length);assert.doesNotMatch(s.vi,/[\u3400-\u9fff]/);assert.doesNotMatch(s.vi,/khung kết hợp|ví dụ đặt|nghĩa trọng tâm/i);
   for(const a of s.answers){const r=new S.Round({sentences:[s]});r.type(a.pinyin);assert.equal(r.solved,true,s.id);assert.equal(r.score,100);assert.match(a.hanzi,/[。！？?!]$/);assert.ok(a.pinyin);}
  }
 }
});
test('every level uses fresh questions until its bank is exhausted, across serialized reloads',()=>{
 for(const bank of banks){let history=[],displayed=new Set();for(let n=0;n<Math.floor(bank.length/10);n++){const batch=S.pick(bank,10,JSON.parse(JSON.stringify(history)));assert.equal(batch.length,10);for(const s of batch){assert.equal(displayed.has(s.id),false,s.id);displayed.add(s.id);history=S.remember(history,s.id);}}
  const rest=S.pick(bank,10,history);const fresh=rest.filter(s=>!displayed.has(s.id));assert.equal(fresh.length,bank.length%10);
 }
});
test('selection spreads original sentence families and only repeats oldest visited prompts',()=>{
 const bank=banks[5];const picked=S.pick(bank,10,[],()=>.5);assert.equal(new Set(picked.map(s=>s.family)).size,10);
 let history=bank.map(s=>s.id);const oldest=S.pick(bank,10,history,()=>.1);assert.deepEqual(oldest.map(s=>s.id),history.slice(0,10));
 history=S.remember(history,oldest[0].id);assert.equal(history.at(-1),oldest[0].id);assert.equal(history.length,bank.length);
});
test('a displayed prompt is tracked globally even when the HSK selection changes',()=>{const a={id:'same',family:'a'},b={id:'new',family:'b'};assert.equal(S.pick([a,b],1,S.remember([],'same'))[0].id,'new');});
