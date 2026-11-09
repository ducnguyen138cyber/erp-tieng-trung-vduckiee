import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=file=>fs.readFileSync(file,'utf8');
const js=read('assets/hsk-content/hsk-shadowing-v1.js');
const css=read('assets/hsk-content/hsk-shadowing-v1.css');
const entry=read('assets/curriculum/graded-hsk-entry.js');
const html=read('index.html');

test('Shadowing MVP script and app bootstrap remain parseable',()=>{
  new vm.Script(js);
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
  assert.ok(scripts.some(s=>s.includes('restoreStaticVDuckie')&&new vm.Script(s)));
  assert.match(html,/hsk-shadowing-v1\.css\?v=2/);
  assert.match(html,/hsk-shadowing-v1\.js\?v=2/);
  assert.match(entry,/data-shadow-open/);
  assert.match(css,/\.shadow-hanzi/);
});

test('HSK1 source contains real full-sentence Pinyin and Vietnamese translation',()=>{
  const data=JSON.parse(read('data/hsk/hsk1/sentences/hsk1-s-0001-0100.json'));
  const valid=data.records.filter(r=>r.chinese&&r.pinyin&&r.vietnamese);
  assert.ok(valid.length>=30);
  const manifest=JSON.parse(read('data/hsk/hsk1/sentences/index.json'));
  const all=manifest.shards.flatMap(shard=>JSON.parse(read('data/hsk/hsk1/sentences/'+shard.file)).records);
  assert.equal(all.length,900);
  assert.equal(all.filter(r=>r.chinese&&r.pinyin&&r.vietnamese).length,900);
  assert.match(js,/Promise\.all\(manifest\.shards\.map/);
  assert.match(js,/r\.pinyin,vi:r\.vietnamese/);
});

test('HSK2/3 annotated audio lines match source lessons, with full Pinyin and Vietnamese',()=>{
  for(const level of [2,3]){
    const lessons=JSON.parse(read(`data/hsk/hsk${level}/lessons.json`));
    const sources=new Map(lessons.records.flatMap(l=>l.sections||[])
      .filter(s=>s.type==='dialogue'&&s.content?.scriptZh)
      .map(s=>[s.id,s.content.scriptZh]));
    const dataset=JSON.parse(read(`data/shadowing/hsk${level}-v1.json`));
    assert.equal(dataset.reviewStatus,'machine-assisted-unreviewed');
    assert.equal(dataset.records.length,8);
    for(const line of dataset.records){
      assert.ok(sources.get(line.sourceSectionId)?.includes(line.hanzi),line.id+' must match a real dialogue');
      assert.ok(line.hanzi&&line.pinyin&&line.vi,line.id);
      assert.equal(line.reviewStatus,'machine-assisted-unreviewed');
    }
  }
  assert.match(js,/data\/shadowing\/hsk/);
});

test('browser permission, recording cleanup and no uploads',()=>{
  assert.match(js,/getUserMedia\(\{audio:true\}\)/);
  assert.match(js,/new root\.MediaRecorder\(stream\)/);
  assert.match(js,/getTracks\(\)\.forEach/);
  assert.match(js,/root\.URL\.revokeObjectURL/);
  assert.match(js,/data-shadow-clear/);
  assert.doesNotMatch(js,/\.rpc\s*\(|supabase\.storage|\.upload\s*\(/);
});

test('progress stored under isolated local key without marking mastery or awarding EXP',()=>{
  assert.match(js,/vduckie-shadowing-v1/);
  assert.match(js,/data\[level\]=Object\.assign\(\{\},entry/);
  assert.match(js,/vduckie-shadowing-v1/);
  assert.match(js,/data-shadow-star/);
  assert.match(js,/data-shadow-weak/);
  assert.match(js,/data-shadow-mode/);
  assert.match(js,/shadowGroup/);
  assert.doesNotMatch(js,/awardEXP|awardWordMastery|mastered\s*=/);
});
