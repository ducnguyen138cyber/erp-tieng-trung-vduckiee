import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const datasets=[2,3].map(level=>read(`data/shadowing/hsk${level}-v1.json`));
for(const dataset of datasets){
 test(`HSK${dataset.level}: every source turn has exactly one complete annotation`,()=>{
  const lessons=read(`data/hsk/hsk${dataset.level}/lessons.json`).records;
  const records=dataset.records;
  assert.equal(dataset.lessons.length,lessons.length);
  assert.equal(records.length,lessons.length*4);
  assert.equal(new Set(records.map(r=>r.id)).size,records.length);
  const aliases=new Set();let recordIndex=0;
  for(const lesson of lessons){
   const sections=lesson.sections.filter(s=>s.type==='dialogue'&&s.content?.scriptZh);
   for(const section of sections){
    let oldIndex=0;
    for(const turn of section.content.scriptZh.split('\n')){
     const [,speaker,hanzi]=turn.match(/^([^：:]+)[：:]([\s\S]+)$/);
     const r=records[recordIndex++];
     assert.equal(r.hanzi,hanzi);assert.equal(r.speaker,speaker);
     assert.equal(r.sourceSectionId,section.id);assert.equal(r.sourceLessonId,lesson.id);
     assert.ok(r.pinyin&&r.vi);assert.doesNotMatch(r.pinyin,/[\u3400-\u9fff]/);
     assert.match(r.pinyin,/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i);
     assert.doesNotMatch(r.vi,/đang bổ sung|TODO|chưa dịch/i);
     assert.equal(r.reviewStatus,'machine-assisted-unreviewed');
     const fragments=turn.split(/(?<=[。！？!?])/).filter(s=>/[\u3400-\u9fff]/.test(s));
     assert.deepEqual(r.legacyIds,fragments.map(()=>`${section.id}-${oldIndex++}`));
     for(const id of r.legacyIds){assert.ok(!aliases.has(id),'legacy mapping must be unambiguous');aliases.add(id);}
    }
   }
  }
  assert.equal(recordIndex,records.length);
  assert.deepEqual(records.slice(0,8).map(r=>r.id),Array.from({length:8},(_,i)=>`shadow-hsk${dataset.level}-${String(i+1).padStart(3,'0')}`));
 });
}
test('context-sensitive pronunciation regressions and clock-number 一 remain correct',()=>{
 const records=datasets.flatMap(x=>x.records);
 const check=(hanzi,pinyin)=>assert.match(records.find(r=>r.hanzi.includes(hanzi))?.pinyin||'',new RegExp(pinyin.source,'i'));
 check('先了解',/liǎo jiě/);check('量过体温',/liáng guò/);check('当地的鱼',/dāng dì/);
 check('老师教你们',/jiāo nǐ men/);check('只得了',/dé le/);check('来不了',/bù liǎo/);
 check('穿着长裤',/chuān zhe cháng kù/);check('十一点以后',/shí yī diǎn/i);
 check('到一点',/dào yī diǎn/);check('还没收到',/hái méi/);
});
test('Shadowing uses compact annotated payloads and precaches them for offline reopening',()=>{
 const js=fs.readFileSync('assets/hsk-content/hsk-shadowing-v1.js','utf8');
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert.doesNotMatch(js,/\/lessons\.json/);
 for(const level of [2,3])assert.ok(sw.includes(`./data/shadowing/hsk${level}-v1.json?v=3`));
 assert.match(js,/vduckie-shadowing-v1/);
 assert.doesNotMatch(js,/localStorage\.clear|removeItem\(key/);
});
