import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const bank=require('../assets/hsk-content/hsk-practice-bank-v1.js');

// Synthetic fixture only: no new exam content is created or shipped.
const vocab=Array.from({length:500},(_,i)=>({
  id:'fixture-v-'+i,simplified:String.fromCodePoint(0x4e00+i),
  pinyin:'fixture'+i,meaningVi:'nghia-'+i,examples:[{zh:'例句'+i}]
}));
const clone=value=>JSON.parse(JSON.stringify(value));

test('phase 1 contract preserves HSK 1–4 plans and legacy result keys',()=>{
  assert.deepEqual(bank.SECTION_ORDER,['listening','reading','writing']);
  assert.deepEqual(Object.keys(bank.QUESTION_TYPES).sort(),['hanzi','listening','listening-sentence','meaning','pinyin','reading','reading-cloze','writing','writing-cloze']);
  assert.equal(bank.PROGRESS_STORAGE_KEY,'vduckie-hsk-practice-exams-v2');
  assert.equal(bank.PAPERS_PER_LEVEL,56);
  assert.equal(bank.TOTAL_PAPERS,224);
  for(let level=1;level<=4;level++){
    const p=bank.build(level,7,vocab);
    assert.equal(p.id,'hsk'+level+'-practice-07');
    assert.equal(p.legacyResultId,p.id);
    assert.equal(p.schemaVersion,'1.0.0');
    assert.equal(p.contentStatus,'machine-assisted');
    assert.equal(p.reviewStatus,'unreviewed');
    assert.equal(p.official,false);
    assert.equal(bank.validatePaper(p).ok,true);
  }
  const ui=fs.readFileSync('assets/hsk-content/hsk-practice-ui-v1.js','utf8');
  assert.ok(ui.includes(bank.PROGRESS_STORAGE_KEY));
  assert.match(ui,/attempts:Math\.min\(999/);
  assert.match(ui,/best:Math\.max\(score/);
});

test('all 224 deterministic paper variants satisfy the shared contract without invented approvals',()=>{
  const ids=new Set();
  for(let level=1;level<=4;level++)for(let n=1;n<=56;n++){
    const paper=bank.build(level,n,vocab),check=bank.validatePaper(paper);
    assert.deepEqual(check.errors,[],paper.id);
    assert.equal(check.ok,true,paper.id);
    assert.equal(paper.questionCount,paper.questions.length);
    ids.add(paper.id);
    for(const q of paper.questions){
      assert.equal(q.reviewStatus,'unreviewed',q.id);
      assert.deepEqual(q.reviewMetadata,{reviewer:null,reviewedAt:null,evidence:[]});
      assert.deepEqual(q.sourceIds,[q.wordId]);
      assert.equal(bank.grade(q,q.answer),true,q.id);
    }
    if(n===1||n===56)assert.deepEqual(
      bank.build(level,n,vocab).questions.map(q=>[q.id,q.answer,q.options]),
      paper.questions.map(q=>[q.id,q.answer,q.options])
    );
  }
  assert.equal(ids.size,224);
});

test('validation rejects corrupted sections, choices, source references and fabricated approval',()=>{
  const paper=bank.build(3,1,vocab);
  const cases=[
    p=>p.sections.reverse(),
    p=>p.blueprint.reading++,
    p=>p.questions[0].stimulus=p.questions[0].hanzi,
    p=>p.questions[0].options[1]=p.questions[0].options[0],
    p=>p.questions[0].sourceIds=['not-the-word-id'],
    p=>p.questions[0].responseType='text',
    p=>p.questions[0].reviewStatus='approved',
    p=>p.reviewStatus='approved',
    p=>p.questions[0].id='renamed',
    p=>p.questions[1].wordId=p.questions[0].wordId,
    p=>p.questions[paper.blueprint.listening+paper.blueprint.reading].options=['wrong']
  ];
  for(const mutate of cases){
    const broken=clone(paper);mutate(broken);
    assert.equal(bank.validatePaper(broken).ok,false);
    assert.throws(()=>bank.assertValidPaper(broken),/Invalid HSK/);
  }
  const honest=clone(paper);
  honest.questions[0].reviewStatus='linguistic-reviewed';
  honest.questions[0].reviewMetadata={
    reviewer:'human-reviewer',reviewedAt:'2026-11-09T00:00:00.000Z',
    evidence:['review-ticket-123']
  };
  assert.equal(bank.validatePaper(honest).ok,true,'documented partial human review remains possible');
  assert.equal(honest.reviewStatus,'unreviewed','paper stays unreviewed until all questions are approved');
});
