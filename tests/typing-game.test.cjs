const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {Game,normalize,glyphs,MODES} = require('../assets/games/typing-engine.js');
const word={hanzi:'说话',pinyin:'shuō huà',meaning:'nói chuyện',level:1};
const create=(mode='easy',random=()=>.5)=>new Game({words:[word],mode,random});

test('keyboard variants and tone marks map back to visible Pinyin glyphs',()=>{
  for(const input of ['SHUO HUA','shuōhuà','shuo1 hua4'])assert.equal(normalize(input),'shuohua');
  for(const input of ['NǙ','nv','nu:','nu','nu\u0308\u030c'])assert.equal(normalize(input),'nu');
  assert.deepEqual(glyphs('nu:').map(g=>[g.start,g.end]),[[0,1],[1,2],[2,2]]);
  const mapped=glyphs('shuō huà');assert.deepEqual(mapped.map(g=>[g.char,g.start,g.end]),[
    ['s',0,1],['h',1,2],['u',2,3],['ō',3,4],[' ',4,4],['h',4,5],['u',5,6],['à',6,7]
  ]);
});
test('wrong suffix survives, Backspace preserves prefix, completion auto scores once',()=>{
  const g=create();g.drain();for(const s of ['s','sh','shu','shux','shu','shuo','shuoh','shuohu','shuohua'])g.type(s);
  assert.equal(g.score,100);assert.equal(g.completed,1);assert.equal(g.input,'');
  assert.equal(g.result().accuracy,88); // seven correct additions + one incorrect
  assert.equal(g.drain().filter(e=>e.type==='destroy').length,1);
  g.type('shuohua');assert.equal(g.score,100);
  g.step(.599);assert.equal(g.meteors.length,0);g.step(.0011);assert.equal(g.meteors.length,1);
});
for(const key of Object.keys(MODES))test(key+' falls in seconds with exact stagger and max two',()=>{
  const g=create(key),mode=MODES[key],first=g.target();g.step(mode.fall*mode.overlap-.001);
  assert.equal(g.meteors.length,1);g.step(.0011);assert.equal(g.meteors.length,2);
  g.step(mode.fall*(1-mode.overlap));assert.equal(g.lives,2);assert.equal(g.missed[0],word);assert.ok(!g.meteors.includes(first));
  for(let i=0;i<100&&!g.ended;i++){g.step(.1);assert.ok(g.meteors.length<=2);}
});
test('completion near threshold does not double spawn; bounded simultaneous typing',()=>{
  const g=create();g.step(10.21);assert.equal(g.meteors.length,2);g.type('shuohua');
  g.step(.61);assert.equal(g.meteors.length,2);const ids=g.meteors.map(m=>m.id);g.step(0);assert.deepEqual(g.meteors.map(m=>m.id),ids);
  g.type('shuohua');g.type('shuohua');assert.equal(g.score,300);assert.equal(g.meteors.length,0);
});
test('heart probability, three starting lives, five-heart limit, missed heart does not heal',()=>{
  const g=create('easy',()=>.05);assert.equal(g.lives,3);assert.equal(g.target().heart,true);
  for(let i=0;i<4;i++){g.type('shuohua');g.step(.61);}assert.equal(g.lives,5);
  g.step(12);assert.equal(g.lives,4);
  assert.equal(create('easy',()=>.1).target().heart,false);
});
test('pause freezes physics/input; no-input game ends at zero hearts',()=>{
  const g=create('hard');g.paused=true;g.step(100);g.type('shuohua');assert.equal(g.time,0);assert.equal(g.score,0);
  g.paused=false;for(let i=0;i<250;i++)g.step(.1);
  assert.equal(g.ended,true);assert.equal(g.lives,0);assert.equal(g.missed.length,3);
  const t=g.time;g.step(10);g.type('shuohua');assert.equal(g.time,t);assert.equal(g.score,0);
});
test('combo multiplies only game score; 180 active seconds end a surviving round',()=>{
  const g=create('hard',()=>.05);
  for(let i=0;i<300&&!g.ended;i++){if(g.target())g.type('shuohua');g.step(.61);}
  assert.equal(g.ended,true);assert.equal(g.time,180);assert.ok(g.score>g.completed*100);assert.equal(g.bestCombo,g.completed);
  assert.equal(g.drain().filter(e=>e.type==='end').length,1);
});
test('new game resets every counter and never repeats a word before exhausting the bag',()=>{
  const vocab=[word,{...word,hanzi:'你',pinyin:'nǐ'},{...word,hanzi:'好',pinyin:'hǎo'}];
  const g=new Game({words:vocab});const found=new Set();
  for(let i=0;i<3;i++){found.add(g.target().word.hanzi);g.type(g.target().word.pinyin);g.step(.61);}assert.equal(found.size,3);
  const fresh=create();assert.equal(fresh.score,0);assert.equal(fresh.time,0);assert.equal(fresh.lives,3);assert.equal(fresh.meteors.length,1);
});
test('published vocabulary loads from existing shard indexes; polyphonic entries can share Hanzi',()=>{
  const seen=new Set();let total=0;
  for(const level of [1,2,3,4]){
    const path='data/hsk/hsk'+level+'/vocabulary/';const index=JSON.parse(fs.readFileSync(path+'index.json'));
    let count=0;for(const shard of index.shards){for(const w of JSON.parse(fs.readFileSync(path+shard.file)).records){
      assert.ok(w.simplified&&w.pinyin&&w.meaningVi);assert.match(normalize(w.pinyinTone||w.pinyin),/^[a-z]+$/);
      seen.add(w.simplified);count++;
    }}assert.equal(count,index.shards.reduce((n,s)=>n+s.count,0));total+=count;
  }assert.ok(total>=2000);
});
