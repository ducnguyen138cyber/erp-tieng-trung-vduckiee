import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const bank=require('../assets/hsk-content/hsk-practice-bank-v1.js');
const root=process.cwd();
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));

function actualWords(level){
  const dir='data/hsk/hsk'+level+'/vocabulary/';
  const manifest=read(dir+'index.json');
  assert.equal(manifest.level,level);
  assert.ok(Array.isArray(manifest.shards)&&manifest.shards.length);
  let records=[];
  for(const shard of manifest.shards){
    assert.match(shard.file,/^[a-z0-9_-]+\.json$/i);
    const chunk=read(dir+shard.file);
    assert.ok(Array.isArray(chunk.records),shard.file);
    assert.equal(chunk.records.length,shard.count,shard.file);
    records.push(...chunk.records);
  }
  assert.equal(records.length,manifest.expectedCount);
  return records;
}
test('phase 5: all 224 paper IDs build from REAL HSK1–4 vocab shards; grade and review boundaries hold',()=>{
  const report=[];
  for(let level=1;level<=4;level++){
    const records=actualWords(level),ids=new Set();
    const types=Object.create(null);
    for(let number=1;number<=56;number++){
      const paper=bank.build(level,number,records);
      assert.equal(paper.id,bank.paperId(level,number));
      assert.equal(paper.legacyResultId,paper.id);
      assert.equal(paper.contentStatus,'machine-assisted');
      assert.equal(paper.reviewStatus,'unreviewed');
      assert.equal(bank.validatePaper(paper).ok,true,paper.id);
      assert.equal(paper.questionCount,paper.questions.length);
      assert.ok(!ids.has(paper.id));ids.add(paper.id);
      const responses=Object.fromEntries(paper.questions.map(q=>[q.id,q.answer]));
      const perfect=bank.scorePaper(paper,responses);
      assert.equal(perfect.percent,100,paper.id+' full');
      assert.equal(perfect.correct,paper.questionCount,paper.id+' correct');
      assert.equal(perfect.answered,paper.questionCount,paper.id+' answered');
      const blank=bank.scorePaper(paper,{});
      assert.equal(blank.percent,0,paper.id+' blank');
      assert.equal(blank.answered,0,paper.id+' blank answered');
      assert.equal(blank.incorrectIds.length,paper.questionCount,paper.id+' incorrect');
      for(const q of paper.questions){
        assert.equal(q.reviewStatus,'unreviewed',q.id);
        assert.ok(q.sourceIds.includes(q.wordId),q.id);
        assert.ok(q.options.length===0||q.options.includes(q.answer),q.id);
        assert.ok(bank.explainQuestion(q).includes(q.hanzi),q.id);
        types[q.type]=(types[q.type]||0)+1;
        if(q.type==='reading-cloze'||q.type==='writing-cloze'){
          assert.ok(q.stimulus.includes('____')&&!q.stimulus.includes(q.hanzi),q.id);
        }
        if(q.section==='listening'){
          assert.equal(q.stimulus,'',q.id);
        }
      }
    }
    assert.equal(ids.size,56);
    report.push({level,records:records.length,papers:ids.size,types});
  }
  // This verifies structural integrity, NOT editorial correctness, authentic
  // HSK task diversity or device-supported TTS pronunciation.
  console.log('REAL_DATA_224_AUDIT '+JSON.stringify(report));
});
