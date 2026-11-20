import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const bank=require('../assets/hsk-content/hsk-practice-bank-v1.js');
const vocab=Array.from({length:180},(_,i)=>({
  id:'sourced-v-'+i,simplified:String.fromCodePoint(0x4e00+i),
  pinyin:'p'+i,meaningVi:'nghĩa '+i,
  examples:[{zh:'今天学习'+String.fromCodePoint(0x4e00+i)+'，然后复习。',sourceType:'original'}]
}));

test('224 variants derive contextual exercises from sourced sentences without inventing content',()=>{
  const ids=new Set();
  for(let level=1;level<=4;level++)for(let n=1;n<=56;n++){
    const paper=bank.build(level,n,vocab);
    assert.equal(bank.validatePaper(paper).ok,true,paper.id);
    assert.equal(paper.questions.length,[0,40,60,80,100][level]);
    ids.add(paper.id);
    const contextual=paper.questions.filter(q=>q.type==='reading-cloze'||q.type==='listening-sentence'||q.type==='writing-cloze');
    assert.ok(contextual.length>0,paper.id+' should include sourced contextual items');
    for(const q of contextual){
      assert.equal(q.reviewStatus,'unreviewed');
      assert.deepEqual(q.sourceIds,[q.wordId]);
      assert.ok(q.example.includes(q.hanzi));
      assert.equal(bank.grade(q,q.answer),true);
      if(q.type==='reading-cloze'||q.type==='writing-cloze'){
        assert.ok(q.stimulus.includes('____'));
        assert.ok(!q.stimulus.includes(q.hanzi),'written answer must not leak');
        assert.equal(q.answer,q.hanzi);
      }else{
        assert.equal(q.audioText,q.example);
        assert.equal(q.stimulus,'');
        assert.equal(q.answer,q.meaning);
      }
    }
  }
  assert.equal(ids.size,224);
});

test('incomplete or ambiguous examples fall back to existing vocabulary tasks',()=>{
  const word={id:'a',hanzi:'你好',example:'今天你好，你好'};
  assert.equal(bank.usableExample(word),'');
  assert.equal(bank.usableExample({id:'b',hanzi:'你好',example:'欢迎你好来学习。'}),'欢迎你好来学习。');
  const noContext=vocab.map(item=>({...item,examples:[{zh:'例句'}]}));
  for(let level=1;level<=4;level++){
    const p=bank.build(level,1,noContext);
    assert.equal(p.questions.filter(q=>q.type==='reading-cloze'||q.type==='listening-sentence').length,0);
    assert.equal(bank.validatePaper(p).ok,true);
  }
});

test('context item corruption is rejected and UI can play full sourced sentence',()=>{
  const paper=bank.build(3,1,vocab);
  const listen=paper.questions.find(q=>q.type==='listening-sentence');
  const cloze=paper.questions.find(q=>q.type==='reading-cloze');
  const written=paper.questions.find(q=>q.type==='writing-cloze');
  assert.ok(listen&&cloze&&written);
  const badAudio=JSON.parse(JSON.stringify(paper));
  badAudio.questions.find(q=>q.id===listen.id).audioText='đoạn không có trong học liệu';
  assert.equal(bank.validatePaper(badAudio).ok,false);
  const badCloze=JSON.parse(JSON.stringify(paper));
  badCloze.questions.find(q=>q.id===cloze.id).stimulus=cloze.example;
  assert.equal(bank.validatePaper(badCloze).ok,false);
  const ui=fs.readFileSync('assets/hsk-content/hsk-practice-ui-v1.js','utf8');
  assert.match(ui,/q\.audioText\|\|q\.hanzi/);
  assert.match(ui,/q\.section!=="listening"/);
});
